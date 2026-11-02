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
- Retained fields / 使用字段：`kTGH`, `kTGHZ2013`, `kXHC1983`, `kMandarin`, `kSimplifiedVariant`, and `kRSUnicode`.
- `browse-data.js` is a project-generated subset covering the existing dictionary/font headwords and the General Standard Chinese Characters represented in the site's supported basic-Han range U+4E00–U+9FFF. Readings use `kTGHZ2013`, falling back to `kXHC1983`, then `kMandarin`; readings from different fields are not combined. / `browse-data.js` 是以现有字典、字形字头及 U+4E00–U+9FFF 基本汉字范围内的通用规范汉字生成的子集。读音依次采用 `kTGHZ2013`、`kXHC1983`、`kMandarin`，不合并不同字段的读音。
- The familiar radical names, variant labels, selection, and index layout are project additions. Radical groups use Unicode radical IDs; they do not claim that every result contains a component at the same position. Historical *Shuowen* groupings remain separate from the browse index. / 常见部首名称、变体标签、筛选范围与索引编排为本项目补充。部首分组使用 Unicode 部首编号，不表示每个结果都在相同位置含有该偏旁；《说文》历史分部与检字索引分别保留。
- Preserve the Unicode copyright and permission notice when redistributing this data or derived copies. / 再分发本数据或其衍生副本时，保留 Unicode 版权与许可声明。

## 5. Code and attribution / 代码与显名

The project code is distributed under the [MIT licence](LICENSE). The original `Copyright (c) 2026 Ivan666jjj` notice is retained. The licences above govern their respective data and fonts independently of the project code licence.

项目代码使用 [MIT 许可](LICENSE)，保留原始 `Copyright (c) 2026 Ivan666jjj` 声明。上述数据与字体分别遵循其各自许可，不因项目代码采用 MIT 而改变。

For scholarly use, cite the original dataset or work alongside any translation used. / 学术使用时，请同时注明原始数据或文献及所用译文。

> 許慎撰、徐鉉校定《說文解字》；数据来源：shuowen.org。
