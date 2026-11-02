# Third-party notices / 第三方数据来源与授权声明

The character glyphs, original dictionary text, modern pinyin, and character mappings in this edition come from the sources below. Preserve the applicable notices when redistributing this site or its exported images. English translations and editorial notes are additions to the source material, not statements by the original data providers.

本版本的字形、字典原文、现代拼音和简繁映射来自下列第三方。再分发本页面或导出图片时，请保留相应声明。英文翻译与编辑说明为本项目补充，不代表原始数据提供者的观点。

## 1. Character fonts / 字形字体

### 1.1 Kaiyuan Small Seal / 开元小篆

- Source / 来源：[frankslin/kaiyuan-small-seal-font](https://github.com/frankslin/kaiyuan-small-seal-font).
- Licence / 授权：**SIL Open Font License 1.1**; see [OFL-1.1.txt](licenses/OFL-1.1.txt).
- Glyphs are derived from public-domain editions of the *Shuowen Jiezi*. The site ships a subsetted font. / 字形据《说文解字》公版刻本描摹，网站使用子集化字体。
- Retain the font copyright notices and the full OFL. A derivative font must not use the reserved name "Kaiyuan" alone. / 保留字体版权声明与 OFL 全文，衍生字体命名须遵循原始许可的保留字体名要求。

### 1.2 CNS11643 *Shuowen* glyphs / 全字库说文解字补充字形

- Source / 来源：[CNS11643 中文標準交換碼全字庫](https://www.cns11643.gov.tw), Ministry of Digital Affairs / 數位發展部。
- Licence / 授权：**Open Government Data License, version 1.0 (Taiwan)** / **《政府資料開放授權條款－第1版》**（OGDL-Taiwan-1.0）。
- Required attribution, retained verbatim / 必须保留的显名文字：

  > 數位發展部，CNS11643中文標準交換碼全字庫網站，https://www.cns11643.gov.tw

### 1.3 Oracular 鏡原甲骨文

- Source / 来源：[Oracular](https://oracular.azurewebsites.net/), Peichao Qin / 鏡原甲骨數字平台。
- Licence / 授权：**SIL Open Font License 1.1**; see [OFL-1.1.txt](licenses/OFL-1.1.txt).
- Font copyright registration / 字库版权登记号：**国作登字-2024-F-00223767**。
- Retain the font copyright notices and the full OFL. / 保留字体版权声明与 OFL 全文。

## 2. *Shuowen Jiezi* data / 《说文解字》数据

- Source / 来源：[shuowen.org](http://www.shuowen.org/), repository / 数据仓库 `shuowenjiezi/shuowen`.
- Licence / 授权：**Apache License 2.0**。
- Retained content / 使用内容：head characters, original explanations, modern pinyin, radicals, volume numbers, and variant forms / 字头、原文释义、现代拼音、部首、卷次、重文。
- The original text is preserved as historical dictionary material. Project English translations are reading aids; consult the Chinese original for precise interpretation. / 原文作为历史字书材料保留；项目英文翻译用于辅助阅读，准确释读请核对中文原文。

## 3. Character mappings / 简繁映射

- Source / 来源：[OpenCC](https://github.com/BYVoid/OpenCC).
- Licence / 授权：**Apache License 2.0**。

## 4. Offline browse index / 离线检字索引

- Source / 来源：[Unicode 18.0.0 Unihan Database](https://www.unicode.org/Public/18.0.0/ucd/Unihan.zip), Unicode, Inc.; documentation / 字段说明：[UAX #38](https://www.unicode.org/reports/tr38/tr38-41.html).
- Licence / 授权：**Unicode License V3 (Unicode-3.0)**; the full licence is retained in [Unicode-3.0.txt](licenses/Unicode-3.0.txt).
- Copyright / 版权：© 1991–2026 Unicode, Inc.
- Retained fields / 使用字段：`kTGH`, `kTGHZ2013`, `kXHC1983`, `kMandarin`, `kSimplifiedVariant`, `kTraditionalVariant`, and `kDefinition`.
- `browse-data.js` contains only this edition's supported character headwords. Readings use `kTGHZ2013`, falling back to `kXHC1983`, then `kMandarin`. / `browse-data.js` 仅包含本期支持字头；读音依次采用上述字段。
- The browse radical index now follows Xu Shen's 540 *Shuowen* divisions, using historical membership and source IDs from the fixed upstream dataset. Unicode modern radical IDs are not used as historical classifications. / 检字索引改用许慎540部首，以固定上游的历史归部及来源ID为据，不以Unicode现代部首代替说文归部。
- Character rarity, retained/deleted headword decisions, source relationships, and layout are project editorial additions. The historical 1988 common-character list is used as a baseline; it is not presented as the current official rarity standard. / 字罕度、保留删除决定、关联关系与版式为项目编辑内容；1988旧表只作基准，不称为现行官方罕度标准。
- Preserve the Unicode copyright and permission notice when redistributing this data or derived copies. / 再分发本数据或其衍生副本时，保留 Unicode 版权与许可声明。

## 5. Vocabulary / 词表

- Input / 输入：the user-supplied Chinese Flashcard `wordlist.csv`, SHA-256 `6de1a9877f79ea7a809fd40d41383c15a86ce93580cb2954cf1344515d15639a`; only its 15,585 rarity 0–2 rows and necessary lexical fields are selected. No example sentences are imported. / 只选取用户词表罕度0–2的15,585条必要词汇字段，不导入例句。
- CC-CEDICT-derived readings and English glosses / CC-CEDICT改编读音与释义：CC-CEDICT contributors; CEDICT originally created by Paul Denisowski; distributed by [MDBG](https://www.mdbg.net/chinese/dictionary?page=cedict). Relevant adaptations retain [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) and attribution. / 相关改编保留同许可、署名及修改说明。
- Word rarity labels are inherited Chinese Flashcard editorial teaching stages; character rarity is this project's separate classification. The selected projection, filtering, cross-links, and character coverage are changes made for this edition. / 词罕度沿用原教学阶段，字罕度独立；本期修改包括字段筛选、范围过滤、关联和字目覆盖。
- The source project's notices identify mixed original materials whose public redistribution rights are not fully certified. No blanket MIT relicensing or independent rights certification is claimed here. / 原项目声明部分混合来源材料的公开再分发权待核实，本项目不将其整体改标MIT，也不宣称已独立完成全部权利核查。
- The frozen source manifest records the actual selected fields, source hashes, and provenance. / 冻结来源清单记录实际字段、来源哈希及归属。

## 6. Code and attribution / 代码与显名

The project code is distributed under the [MIT licence](LICENSE). The original `Copyright (c) 2026 Ivan666jjj` notice is retained. The licences above govern their respective data and fonts independently of the project code licence.

项目代码使用 [MIT 许可](LICENSE)，保留原始 `Copyright (c) 2026 Ivan666jjj` 声明。上述数据与字体分别遵循其各自许可，不因项目代码采用 MIT 而改变。

For scholarly use, cite the original dataset or work alongside any translation used. / 学术使用时，请同时注明原始数据或文献及所用译文。

> 許慎撰、徐鉉校定《說文解字》；数据来源：shuowen.org。
