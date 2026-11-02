# The Life of a Character · 一个字的一生

**Oracle bone → Small seal → Traditional → Simplified** — explore Chinese character forms, modern Mandarin pronunciation, and the *Shuowen Jiezi* in English or Chinese.

**甲骨文 → 小篆 → 繁体 → 简体** —— 用英语或中文了解汉字字形、现代普通话读音和《说文解字》。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-yigezi-success)](https://juliano114514.github.io/yigezi/)
[![GitHub stars](https://img.shields.io/github/stars/Juliano114514/yigezi?style=social)](https://github.com/Juliano114514/yigezi/stargazers)

[Open the site / 打开网站](https://juliano114514.github.io/yigezi/#z=江) · [Repository / 仓库](https://github.com/Juliano114514/yigezi)

## Features / 功能

| Feature | English | 中文 |
|---|---|---|
| Character forms / 字形 | Four stages with period labels; unavailable glyphs are marked explicitly. | 四种字形及年代标注，缺失字形明确提示。 |
| Modern pronunciation / 现代读音 | Mandarin pinyin, including separate surname readings where supplied. | 普通话拼音；数据包含时单独显示姓氏读音。 |
| Explanations / 讲解 | English translations of every included *Shuowen* entry, character-form notes, and source metadata. Chinese originals can be expanded for comparison. | 全部收录《说文》释文、字形说明及来源信息支持中英切换，中文原文可展开对照。 |
| Language switch / 语言切换 | English opens by default. A saved language choice is reused on later visits. Controls, messages, help, and exported cards follow the selected language. | 默认英语，后续访问沿用保存的语言选择；控件、提示、帮助与导出卡片同步切换。 |
| Themes / 配色 | Paper, Rubbing, and Classic. | 宣纸、碑拓、藏经。 |
| Export / 导出 | JPG cards and animated GIFs, individually or in batches. | 支持单字或批量导出 JPG 图片、GIF 动图。 |
| Sharing / 分享 | `#z=江` opens the requested character directly. | 通过 `#z=江` 直接打开指定汉字。 |

The pronunciation section supports modern Mandarin only. English explanations are packaged with the site; visitors do not need a translation account or API key.

读音区只保留现代普通话。英文讲解随网站一并提供，访客无需翻译账号或 API Key。

## Coverage and interpretation / 收录与解读

| Content / 内容 | Included / 收录数量 |
|---|---:|
| Small-seal glyphs / 小篆字形 | 10,249 |
| Oracle-bone glyphs / 甲骨文字形 | 1,425 |
| *Shuowen* entries with English translations / 《说文》条目及英文翻译 | 7,699 |

Input supports basic Han characters in **U+4E00–U+9FFF**. The 2,116 dictionary headwords outside that range have been removed and are no longer supported as lookup entries. Rare characters occurring inside a retained quotation, variant form, or other metadata are preserved as part of the original source.

输入支持 **U+4E00–U+9FFF 基本汉字**。范围外的 2,116 个字典字头已移除，不再支持查询。保留条目的原文引句、重文或其他元信息中出现的生僻字，仍作为原始文献内容保留。

Missing data is shown as unavailable. These counts describe this edition’s dataset, rather than the total number of characters known to scholarship. The four stages offer a visual comparison; they do not establish a direct historical lineage for every glyph.

缺失数据会明确标出。以上数字仅指本版本的数据收录范围，不代表学术界所知字形总量。四阶段用于直观对照，不表示每个字形都已证实存在直接演变关系。

The *Shuowen* is an Eastern Han work whose author did not have access to oracle-bone discoveries. Its explanations are historical evidence and can differ from modern palaeographic interpretations. The original text is preserved, including its descriptions of character components. English translations are reading aids and should be checked against the original for scholarly use.

《说文》成书于东汉，作者未见后来出土的甲骨文，其解释具有文献价值，也可能与现代古文字研究不同。原文（包括构形描述）予以保留。英文翻译用于辅助阅读，学术使用请核对原文。

English translations were drafted with a language model, checked for complete entry coverage, and reviewed on selected entries. They have not received an independent scholarly review of every entry.

英文译文由语言模型起草，已检查条目覆盖完整性并抽样复核，尚未对每条译文进行独立的学术审校。

## Local use / 本地使用

Download the repository with its directory structure intact and open `index.html` in a browser. Keep the bundled translation data, scripts, `seal.woff2`, and `orac.woff2` beside the page at their original paths. Core lookup, language switching, animation, and export use local assets. Visitor statistics contact external services on hosted HTTP(S) pages; local `file://` pages skip those requests.

下载完整仓库并保持目录结构，在浏览器中打开 `index.html`。保留随附的翻译数据、脚本及 `seal.woff2`、`orac.woff2` 的原有路径。查字、语言切换、动画与导出使用本地资源；HTTP(S) 托管页面的访问统计会请求外部服务，本地 `file://` 页面跳过这些请求。

## Publishing / 发布

This edition is maintained in `Juliano114514/yigezi` and published at [juliano114514.github.io/yigezi](https://juliano114514.github.io/yigezi/). GitHub Pages serves the static files from this repository; no application server or translation service is required. Maintain asset links relative to the project path `/yigezi/`.

本版本由 `Juliano114514/yigezi` 仓库维护，访问地址为 [juliano114514.github.io/yigezi](https://juliano114514.github.io/yigezi/)。GitHub Pages 直接托管仓库内的静态文件，无需应用服务器或在线翻译服务。资源链接须兼容项目路径 `/yigezi/`。

Publishing source: the `main` branch, repository root (`/`). Future pushes to `main` automatically update the site. Keep `.nojekyll` in the root.

发布来源为 `main` 分支的仓库根目录（`/`）；后续推送到 `main` 会自动更新网站。请保留根目录的 `.nojekyll`。

## Sources and licences / 来源与许可

| Data / 数据 | Source / 来源 | Licence / 许可 |
|---|---|---|
| Small-seal glyphs / 小篆字形 | [Kaiyuan Small Seal / 开元小篆](https://github.com/frankslin/kaiyuan-small-seal-font) + [CNS11643 / 全字库](https://www.cns11643.gov.tw) | OFL-1.1 / OGDL-Taiwan-1.0 |
| Oracle-bone glyphs / 甲骨文字形 | [Oracular 鏡原甲骨文](https://oracular.azurewebsites.net/), Peichao Qin | SIL OFL-1.1 |
| *Shuowen* text, pinyin, and metadata / 《说文》原文、拼音与元信息 | [shuowen.org](http://www.shuowen.org/) | Apache-2.0 |
| Simplified/traditional mappings / 简繁映射 | [OpenCC](https://github.com/BYVoid/OpenCC) | Apache-2.0 |

Retain [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and the relevant licence notices when redistributing the page or its exports. The code uses the [MIT licence](LICENSE), including the original author’s copyright notice.

再分发页面或导出内容时，请保留 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 及相应许可声明。代码使用 [MIT 许可](LICENSE)，保留原作者版权声明。

## Implementation / 技术说明

Static HTML, CSS, and JavaScript with bundled character and translation data; no application framework or runtime package installation. Glyphs use subsetted WOFF2 fonts. JPG rendering uses Canvas; GIF export uses the included GIF89a encoder.

静态 HTML、CSS、JavaScript 与随附字形、翻译数据，无应用框架，无需安装运行依赖。字形使用子集化 WOFF2 字体；JPG 通过 Canvas 绘制，GIF 使用项目内置 GIF89a 编码器。
