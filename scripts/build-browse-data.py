#!/usr/bin/env python3
"""Build the offline browse index from existing characters and Unicode 18.0.0.

Run from any directory with Python 3. No third-party packages are required.
The fixed Unicode archive is read in memory; only the index and licence are saved.
"""

import hashlib
import io
import json
from pathlib import Path
import re
import urllib.request
import zipfile


ROOT = Path(__file__).resolve().parent.parent
VERSION = "18.0.0"
DATA_URL = f"https://www.unicode.org/Public/{VERSION}/ucd/Unihan.zip"
LICENSE_URL = "https://www.unicode.org/license.txt"
MAX_ARCHIVE_BYTES = 16 * 1024 * 1024
MAX_MEMBER_BYTES = 64 * 1024 * 1024
MAX_TOTAL_BYTES = 128 * 1024 * 1024
FIELDS = {"kTGH", "kTGHZ2013", "kXHC1983", "kMandarin",
          "kSimplifiedVariant", "kRSUnicode"}

# A deliberately limited set of familiar radical names. Stroke counts describe
# the original Kangxi radical, rather than the shorter component variants.
# The glyphs are recognition aids: a radical class does not guarantee a specific
# component position, and moon/flesh and the two ear components stay separate.
RADICALS = [
    (1, "一", "一字旁", "One", 1),
    (8, "亠", "点横头", "Lid", 2),
    (9, "人 / 亻", "人部（单人旁）", "Person", 2),
    (10, "儿", "儿字底", "Legs", 2),
    (12, "八", "八字旁", "Eight", 2),
    (13, "冂", "同字框", "Open enclosure", 2),
    (14, "冖", "秃宝盖", "Cover", 2),
    (15, "冫", "两点水", "Ice", 2),
    (18, "刀 / 刂", "刀部（立刀旁）", "Knife", 2),
    (19, "力", "力字旁", "Strength", 2),
    (20, "勹", "包字头", "Wrap", 2),
    (21, "匕", "匕字旁", "Spoon", 2),
    (24, "十", "十字旁", "Ten", 2),
    (25, "卜", "卜字旁", "Divination", 2),
    (26, "卩", "单耳旁", "Seal", 2),
    (27, "厂", "厂字头", "Cliff", 2),
    (29, "又", "又字旁", "Right hand", 2),
    (30, "口", "口字旁", "Mouth", 3),
    (31, "囗", "国字框", "Enclosure", 3),
    (32, "土", "提土旁", "Earth", 3),
    (33, "士", "士字旁", "Scholar", 3),
    (36, "夕", "夕字旁", "Evening", 3),
    (37, "大", "大字旁", "Big", 3),
    (38, "女", "女字旁", "Woman", 3),
    (39, "子", "子字旁", "Child", 3),
    (40, "宀", "宝盖头", "Roof", 3),
    (41, "寸", "寸字旁", "Inch", 3),
    (42, "小 / ⺌", "小字旁", "Small", 3),
    (44, "尸", "尸字头", "Body", 3),
    (46, "山", "山字旁", "Mountain", 3),
    (47, "巛 / 川", "川字旁", "River", 3),
    (48, "工", "工字旁", "Work", 3),
    (50, "巾", "巾字旁", "Cloth", 3),
    (53, "广", "广字头", "Shelter", 3),
    (59, "彡", "三撇旁", "Bristles", 3),
    (60, "彳", "双人旁", "Step", 3),
    (61, "心 / 忄 / ⺗", "心部（竖心旁）", "Heart", 4),
    (62, "戈", "戈字旁", "Dagger-axe", 4),
    (63, "户 / 戶", "户字头", "Door", 4),
    (64, "手 / 扌", "手部（提手旁）", "Hand", 4),
    (66, "攴 / 攵", "反文旁", "Tap", 4),
    (67, "文", "文字旁", "Writing", 4),
    (68, "斗", "斗字旁", "Dipper", 4),
    (69, "斤", "斤字旁", "Axe", 4),
    (70, "方", "方字旁", "Square", 4),
    (72, "日", "日字旁", "Sun", 4),
    (74, "月", "月字旁", "Moon", 4),
    (75, "木", "木字旁", "Tree", 4),
    (76, "欠", "欠字旁", "Lack", 4),
    (77, "止", "止字旁", "Stop", 4),
    (78, "歹", "歹字旁", "Death", 4),
    (81, "比", "比字旁", "Compare", 4),
    (82, "毛", "毛字旁", "Hair", 4),
    (84, "气", "气字头", "Air", 4),
    (85, "水 / 氵", "水部（三点水）", "Water", 4),
    (86, "火 / 灬", "火部（四点底）", "Fire", 4),
    (87, "爪 / 爫", "爪字头", "Claw", 4),
    (93, "牛 / 牜", "牛字旁", "Ox", 4),
    (94, "犬 / 犭", "犬部（反犬旁）", "Dog", 4),
    (96, "玉 / 王", "玉部（斜玉旁）", "Jade", 5),
    (102, "田", "田字旁", "Field", 5),
    (104, "疒", "病字旁", "Sickness", 5),
    (106, "白", "白字旁", "White", 5),
    (107, "皮", "皮字旁", "Skin", 5),
    (108, "皿", "皿字底", "Dish", 5),
    (109, "目", "目字旁", "Eye", 5),
    (111, "矢", "矢字旁", "Arrow", 5),
    (112, "石", "石字旁", "Stone", 5),
    (113, "示 / 礻", "示部（示字旁）", "Spirit", 5),
    (115, "禾", "禾木旁", "Grain", 5),
    (116, "穴", "穴宝盖", "Cave", 5),
    (117, "立", "立字旁", "Stand", 5),
    (118, "竹 / ⺮", "竹字头", "Bamboo", 6),
    (119, "米", "米字旁", "Rice", 6),
    (120, "纟 / 糹 / 糸", "绞丝旁", "Silk", 6),
    (122, "网 / 罒", "网部（四字头）", "Net", 6),
    (123, "羊 / ⺶", "羊字旁", "Sheep", 6),
    (124, "羽", "羽字旁", "Feather", 6),
    (128, "耳", "耳字旁", "Ear", 6),
    (130, "肉 / ⺼", "肉部（肉月旁）", "Flesh", 6),
    (140, "艹 / 艸", "草字头", "Grass", 6),
    (142, "虫", "虫字旁", "Insect", 6),
    (145, "衣 / 衤", "衣部（衣字旁）", "Clothing", 6),
    (149, "讠 / 言", "言字旁", "Speech", 7),
    (154, "贝 / 貝", "贝字旁", "Cowrie", 7),
    (156, "走", "走字旁", "Run", 7),
    (157, "足 / ⻊", "足字旁", "Foot", 7),
    (159, "车 / 車", "车字旁", "Cart", 7),
    (162, "辶 / 辵", "走之旁", "Walk", 7),
    (163, "邑 / 阝（右）", "右耳旁", "City / right ear", 7),
    (167, "钅 / 釒 / 金", "金字旁", "Metal", 8),
    (169, "门 / 門", "门字框", "Gate", 8),
    (170, "阜 / 阝（左）", "左耳旁", "Mound / left ear", 8),
    (173, "雨", "雨字头", "Rain", 8),
    (181, "页 / 頁", "页字旁", "Head", 9),
    (184, "饣 / 飠 / 食", "食字旁", "Food", 9),
    (187, "马 / 馬", "马字旁", "Horse", 10),
    (195, "鱼 / 魚", "鱼字旁", "Fish", 11),
    (196, "鸟 / 鳥", "鸟字旁", "Bird", 11),
    (203, "黑", "黑字旁", "Black", 12),
]


class FixedSourceRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, newurl):
        raise ValueError(f"Unexpected redirect from fixed Unicode source ({code})")


def download(url, limit):
    request = urllib.request.Request(url, headers={"User-Agent": "yigezi-browse-data/1.0"})
    opener = urllib.request.build_opener(FixedSourceRedirect())
    with opener.open(request, timeout=45) as response:
        length = response.headers.get("Content-Length")
        if length and int(length) > limit:
            raise ValueError("Unicode response exceeds size limit")
        result = response.read(limit + 1)
    if len(result) > limit:
        raise ValueError("Unicode response exceeds size limit")
    return result


def read_constant(source, name):
    match = re.search(rf"^const {name}\s*=\s*(.*?);\s*$", source, re.M | re.S)
    if not match:
        raise ValueError(f"Missing source constant: {name}")
    # SW has one trailing object comma; its string values remain untouched.
    value = re.sub(r",(\s*})\s*$", r"\1", match.group(1))
    return json.loads(value)


def is_basic(character):
    return 0x4E00 <= ord(character) <= 0x9FFF


def load_unihan(raw):
    records = {}
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        members = archive.infolist()
        if len(members) > 16 or sum(x.file_size for x in members) > MAX_TOTAL_BYTES:
            raise ValueError("Unicode archive exceeds unpacked size limits")
        for member in members:
            if member.file_size > MAX_MEMBER_BYTES or member.is_dir():
                raise ValueError("Unexpected Unicode archive member")
            # No archive paths are written to disk.
            text = archive.read(member).decode("utf-8")
            if f"# Unicode Version {VERSION}" not in text[:1024]:
                raise ValueError("Unicode archive version does not match")
            for line in text.splitlines():
                if not line or line.startswith("#"):
                    continue
                code, field, value = line.split("\t", 2)
                if field in FIELDS:
                    character = chr(int(code[2:], 16))
                    if is_basic(character):
                        records.setdefault(character, {})[field] = value
    return records


def pinyin(record):
    for field in ("kTGHZ2013", "kXHC1983", "kMandarin"):
        if field in record:
            readings = [value.split(":")[-1] for value in record[field].split()]
            return list(dict.fromkeys(readings))
    raise ValueError("A supported character has no Mandarin reading")


def radical_ids(record):
    return sorted({int(value.split(".")[0].rstrip("'"))
                   for value in record["kRSUnicode"].split()})


def tgh_index(record):
    return int(record["kTGH"].split(":")[1]) if "kTGH" in record else 999999


def write_index(characters, records, digest):
    compact = lambda value: json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    lines = [
        "// Generated by scripts/build-browse-data.py; do not edit by hand.",
        f"// Unicode {VERSION}: {DATA_URL}",
        f"// Source SHA-256: {digest}",
        "// Unicode-3.0 licence: licenses/Unicode-3.0.txt",
        "const BROWSE_DATA = {",
        f"  version: '{VERSION}',",
        "  characters: " + compact(characters) + ",",
        "  records: {",
    ]
    for character, record in records.items():
        lines.append("    " + compact(character) + ":" + compact(record) + ",")
    lines.extend(["  },", "  radicals: ["])
    for radical, glyph, zh, en, strokes in RADICALS:
        lines.append("    " + compact({"id": radical, "glyph": glyph, "zh": zh,
                                       "en": en, "strokes": strokes}) + ",")
    lines.extend(["  ]", "};", ""])
    (ROOT / "browse-data.js").write_text("\n".join(lines), encoding="utf-8")


def main():
    source = (ROOT / "characters.js").read_text(encoding="utf-8")
    sw = read_constant(source, "SW")
    ts = read_constant(source, "TS")
    candidates = set(sw) | set(ts)
    for value in ts.values():
        candidates.update(value)
    candidates.update(read_constant(source, "HAS_SEAL"))
    candidates.update(read_constant(source, "HAS_ORAC"))
    candidates = {character for character in candidates if is_basic(character)}

    raw = download(DATA_URL, MAX_ARCHIVE_BYTES)
    unihan = load_unihan(raw)
    # Modern standard characters already fit the site's basic-Han input range.
    # Including the whole supported portion avoids gaps such as 找 and 花 even
    # when the historical dictionary or font subsets do not contain them.
    standard = {character for character, record in unihan.items() if "kTGH" in record}
    candidates.update(standard)
    license_text = download(LICENSE_URL, 64 * 1024).decode("utf-8")
    if "UNICODE LICENSE V3" not in license_text:
        raise ValueError("The Unicode licence is no longer the expected V3 licence")

    display = set()
    for character in candidates:
        record = unihan[character]
        variants = {chr(int(code[2:], 16))
                    for code in record.get("kSimplifiedVariant", "").split()}
        variants = {variant for variant in variants
                    if is_basic(variant) and variant in candidates}
        if "kTGH" not in record and len(variants) == 1:
            display.update(variants)
        else:
            display.add(character)

    characters = sorted(display, key=lambda char: (tgh_index(unihan[char]), ord(char)))
    records = {char: {"p": pinyin(unihan[char]), "r": radical_ids(unihan[char])}
               for char in sorted(candidates | display, key=ord)}
    if len(RADICALS) != len({entry[0] for entry in RADICALS}):
        raise ValueError("Duplicate named radical")
    write_index(characters, records, hashlib.sha256(raw).hexdigest())
    (ROOT / "licenses" / "Unicode-3.0.txt").write_text(license_text, encoding="utf-8")

    named = {entry[0] for entry in RADICALS}
    covered = sum(bool(named.intersection(records[char]["r"])) for char in characters)
    sources = {field: sum(field in unihan[char] for char in candidates)
               for field in ("kTGHZ2013", "kXHC1983", "kMandarin", "kRSUnicode")}
    print(json.dumps({"unicode": VERSION, "basicStandardCharacters": len(standard),
                      "candidates": len(candidates),
                      "displayCharacters": len(characters), "records": len(records),
                      "namedRadicals": len(RADICALS), "namedRadicalCoverage": covered,
                      "sourceCoverage": sources,
                      "examples": {char: records[char] for char in "行乐重干只女律吕听爱找花"}},
                     ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
