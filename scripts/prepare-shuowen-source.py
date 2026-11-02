#!/usr/bin/env python3
"""Freeze a compact official Shuowen snapshot from a verified local checkout.

Preparation helper only; ordinary rebuilds do not need Git, network, or this
checkout. Excludes large Duan notes, font encodings, and unrelated repository
files. Existing English translations are captured separately before pruning.
"""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
REVISION = "6553a350763ce4feca2c5d1cc2cad7e594dc2975"


def compact(value):
    return (json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8")


class PlainText(HTMLParser):
    """Read source formatting as text, without evaluating any markup."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []

    def handle_data(self, value):
        self.parts.append(value)


def variant_record(record):
    original = record.get("explanation", "")
    parser = PlainText()
    parser.feed(original)
    parser.close()
    result = {"head": record["wordhead"], "e": "".join(parser.parts)}
    if result["e"] != original:
        result["sourceE"] = original
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("checkout", type=Path)
    parser.add_argument("--legacy-translations", type=Path, default=ROOT / "data" / "translation-source.json")
    args = parser.parse_args()
    revision = subprocess.check_output(["git", "-C", str(args.checkout), "rev-parse", "HEAD"], text=True).strip()
    if revision != REVISION:
        raise ValueError("The official Shuowen checkout is not at the fixed revision")
    subprocess.run(["git", "-C", str(args.checkout), "diff", "--quiet", "HEAD", "--", "data"], check=True)
    entries, source_hashes = [], []
    for path in sorted((args.checkout / "data").glob("*.json"), key=lambda p: int(p.stem)):
        if path.stat().st_size > 1024 * 1024:
            raise ValueError("Unexpectedly large Shuowen JSON source: " + path.name)
        raw = path.read_bytes()
        record = json.loads(raw)
        source_hashes.append([path.name, hashlib.sha256(raw).hexdigest()])
        variants = [variant_record(v) for v in record.get("variants", [])]
        entries.append({"id": str(record["id"]), "head": record["wordhead"],
                        "e": record["explanation"], "p": record.get("pinyin_full", ""),
                        "r": record["radical"], "v": record["volume"],
                        "w": "".join(v["head"] for v in variants), "variants": variants,
                        "indexes": record.get("indexes", [])})
    if len(entries) != 9833 or len({e["id"] for e in entries}) != 9833:
        raise ValueError("Expected 9,833 uniquely identified official entries")
    first = {}
    for entry in entries:
        first.setdefault(entry["r"], entry)
    if len(first) != 540:
        raise ValueError("Expected 540 distinct official Shuowen departments")
    radicals = [{"id": "sw:" + e["id"], "glyph": head, "zh": head + "部",
                 "en": head + " department", "volume": e["v"], "order": order}
                for order, (head, e) in enumerate(first.items(), 1)]
    for entry in entries:
        entry["rid"] = "sw:" + first[entry["r"]]["id"]
    source = {"revision": REVISION, "entryCount": len(entries), "licence": "Apache-2.0",
              "source": "https://github.com/shuowenjiezi/shuowen/tree/" + REVISION,
              "sourceFilesDigest": hashlib.sha256(compact(source_hashes)).hexdigest(),
              "entries": {e["id"]: e for e in entries}, "radicals": radicals}
    old = json.loads(args.legacy_translations.read_text(encoding="utf-8"))
    old = old.get("entries", old)
    translations = {"source": "Existing project English translations before catalogue pruning",
                    "note": "Match literal Chinese explanations before attaching English; same headword alone is insufficient.",
                    "entries": {head: {"e": e["e"], "eEn": e["eEn"]} for head, e in old.items() if e.get("eEn")}}
    data = ROOT / "data"
    (data / "shuowen-source.json").write_bytes(compact(source))
    (data / "translation-source.json").write_bytes(compact(translations))
    manifest = json.loads((data / "source-manifest.json").read_text(encoding="utf-8"))
    manifest["shuowen"] = {key: source[key] for key in ("revision", "entryCount", "sourceFilesDigest", "source", "licence")}
    manifest["snapshots"] = {name: hashlib.sha256((data / name).read_bytes()).hexdigest() for name in
        ("wordlist-source.csv", "legacy-inputs.json", "modern-source.json", "common-characters.json", "shuowen-source.json", "translation-source.json")}
    (data / "source-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"entries": len(entries), "departments": len(radicals), "legacyTranslations": len(translations["entries"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
