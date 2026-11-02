# The Life of a Character · 一个字的一生

An offline, bilingual character and vocabulary reference. Browse modern teaching characters, explore historical forms, and compare Xu Shen's original Shuowen Jiezi account with an English reading aid.

离线中英双语字目与词表。按罕度、拼音或《说文》部首检索，查看历史字形、许慎原文及英文辅助译文。

[Open the site / 打开网站](https://juliano114514.github.io/yigezi/) · [Sources and licences / 来源与许可](THIRD_PARTY_NOTICES.md)

## Browse / 使用

- **Character index / 字目**: supported headwords with modern pinyin and rarity. Browse by rarity 0–2, pinyin, or Xu Shen's radicals.
- **Word list / 词表**: 15,585 entries at word rarity 0–2. Search Hanzi, accented/unaccented pinyin, or English, combine query terms, and open a constituent character.
- **Navigation / 导航**: 80 results per page. Returning from a character restores the originating view, query, rarity selection, page, and scroll. “All” clears rarity selections.
- **Shuowen / 说文**: all 540 historical radical definitions are retained as metadata. The directory shows groups containing supported characters in original order by volume; entries without an evidenced classification form a separate group.
- **Related entries / 相关条目**: distinguish 后/後 and 發/髮. 明 links to 朙 and retains its variant explanation. The active entry controls the explanation, historical form, and export.
- **Construction / 构形**: emphasize explicit 从X, X聲, X亦聲, and X省聲 with text labels. Complex clauses remain as original text; search components are not treated as evidence of semantic or phonetic roles.
- **Language and themes / 语言与主题**: English opens by default, then reuses a saved preference. Three palettes retain Paper, Rubbing, and Classic theme keys. Information text is at least 14px and explanations are 18px.
- **Export / 导出**: JPG cards and animated GIFs, individually or in batches of up to 100, using the captured language, theme, selected source entry, rarity, and construction text.

## Rarity and support / 罕度与收录边界

Character and word rarity are different editorial scales, not a single frequency ranking or an official school-stage certification.

字罕度和词罕度采用不同编辑口径，不能混作统一字频排名或官方学段认证。

| Level / 等级 | Character baseline / 字目基准 | Word-list meaning / 词表含义 |
|---|---|---|
| 0 | Historical 2,500 common characters / 旧表2,500常用字 | Primary school / 小学 |
| 1 | Following 1,000 less-common characters / 旧表1,000次常用字 | Middle school / 初中 |
| 2 | Other modern general-use characters and explicit editorial decisions / 其他现代通用字及冻结编辑决定 | High school / 高中 |

The retained words contain **3,716 unique characters**, all supported. Required characters are capped at character rarity 2 for this edition, with adjustments recorded in the audit. Other existing headwords rated 3 or higher are removed from lookup, direct links, animation, and export.

保留词条包含的 **3,716 个去重汉字全部支持**。按本期约定，必需字最终字罕度最高为2，覆盖调整单独记录。其余原有字头只保留最终罕度0–2，被删除字头不再支持查询、直达、动画或导出。

Traditional forms, historical variants, radicals, and rare characters in quotations remain source material, not independent supported headwords. Missing glyphs or explanations are marked unavailable.

繁体、重文、部首和原文罕字作为关联文献保留，不自动成为独立支持字头；缺失字形与释文明示不可用。

The 1988 list is a historical project baseline, not the current official standard. Modern general-use candidates use Unicode 18.0.0 kTGH plus explicit editorial overrides. kTGH sequence numbers are not frequency ranks. The current edition retains **5,514 headwords** (2,500 at level 0, 1,000 at level 1, and 2,014 at level 2) and removes **5,556 previous headwords**. Decisions are model-assisted editorial judgements, not a human-certified frequency census. See frozen inputs, decisions, and hashes in [data](data/).

## Historical interpretation / 文献解读

The Shuowen is an Eastern Han historical source whose account can differ from later palaeographic research. Original Chinese and variant descriptions are preserved. Existing English translations are reading aids and have not received an independent scholarly review of every entry. Missing translations are identified explicitly.

《说文》为东汉文献，其说解可能与后世古文字研究不同。原文及重文说明保留；英文为辅助阅读材料，未逐条接受独立学术审校，缺译明确提示。

Historical data use shuowenjiezi/shuowen at fixed commit **6553a350763ce4feca2c5d1cc2cad7e594dc2975**. Source IDs, radicals, volumes, indexes, and variant explanations are retained, with links to [shuowen.org](https://www.shuowen.org/). A source search-index association is labelled separately from an explicit headword or variant relationship. Conservative identity corrections are recorded in [history-overrides.json](data/history-overrides.json), rather than silently treating every search hit as the same modern character.

## Offline use and regeneration / 离线使用与重建

Open index.html with its adjacent scripts, generated data, and fonts preserved. Core browsing, language switching, animation, and export need no server, package installation, translation service, or account. Visitor counts need a network connection on HTTP(S) pages; local file pages skip those requests.

保持页面、数据脚本和字体相邻后打开index.html；核心功能不依赖服务器、运行依赖安装、翻译服务或账号。HTTP(S)页面统计需要联网，本地文件跳过统计请求。

Regenerate using Python 3 and the standard library:

```sh
python scripts/build-browse-data.py
```

The generator uses frozen project inputs and explicit rarity decisions, not the neighbouring Android project. Runtime assets contain supported headwords and their associated historical records; visitors do not fetch dictionary data.

生成器使用本项目冻结输入及分级决定，不依赖隔壁工程实时状态；运行数据包含支持字目及关联历史条目，访客无需联网下载字库。

## Distribution / 分发

Code uses MIT; fonts, historical data, Unicode data, and vocabulary have separate licences. The supplied vocabulary is mixed-source material: retain provenance and applicable CC BY-SA notices. Do not relabel the complete dataset MIT or claim all underlying redistribution rights have been independently verified. Example sentences are not imported.

代码采用MIT；字体、文献、Unicode数据和词表分别遵循各自许可。混合来源词表保留来源及适用CC BY-SA声明，不改标为纯MIT，也不宣称已独立确认全部公开再分发权。本期不导入例句。

Existing GitHub Pages hosting uses the repository root on main. A push to that branch updates the site. Keep asset paths relative and retain .nojekyll.
