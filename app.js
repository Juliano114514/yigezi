'use strict';
const THEMES = {
  paper: { bg: '#f6f2e8', card: '#fffefa', ink: '#25231f', red: '#963d2d', line: '#cbc1ae', box: '#eee6d8', mut: '#625b50', dim: '#6d6459', onAccent: '#ffffff', controlLine: '#8a7c67' },
  rubbing: { bg: '#181b20', card: '#22262d', ink: '#f2efe8', red: '#e5bb70', line: '#59616e', box: '#2d333d', mut: '#c9c2b5', dim: '#aea798', onAccent: '#181b20', controlLine: '#8b95a5' },
  classic: { bg: '#eae4d6', card: '#fcf8ed', ink: '#2c332b', red: '#4f6144', line: '#b4b9a6', box: '#e5e9db', mut: '#4f5a49', dim: '#5c6852', onAccent: '#ffffff', controlLine: '#758369' }
};
let THEME = 'paper', timer = null, animationTimeout = null;
const $ = selector => document.querySelector(selector);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function constructionInfo(sw) {
  // Parse only explicit, short constructions in Xu Shen's text. Unresolved
  // clauses remain visible; search components are never treated as etymology.
  const clauses = (sw?.e || '').split(/[。；;！？]/u).map(value => value.trim())
    .filter(value => value && !value.startsWith('凡') &&
      (/[从從]/u.test(value) || /^\p{Script=Han}(?:亦|省)?聲$/u.test(value)));
  const parts = [];
  const add = (role, head, text) => {
    if (!parts.some(part => part.role === role && part.head === head)) parts.push({ role, head, text });
  };
  for (const clause of clauses) {
    const compact = clause.match(/^[从從](\p{Script=Han})(\p{Script=Han})(亦聲|省聲|聲)$/u);
    if (compact) {
      add('from', compact[1], clause.slice(0, 1) + compact[1]);
      const role = compact[3] === '亦聲' ? 'also-sound' : compact[3] === '省聲' ? 'reduced-sound' : 'sound';
      add(role, compact[2], compact[2] + compact[3]);
      continue;
    }
    for (const match of clause.matchAll(/[从從](\p{Script=Han})(?=[从從，、]|$)/gu)) {
      add('from', match[1], match[0]);
    }
    for (const segment of clause.split(/[，、]/u)) {
      const sound = segment.trim().match(/^(\p{Script=Han})(亦聲|省聲|聲)$/u);
      if (sound) add(sound[2] === '亦聲' ? 'also-sound' : sound[2] === '省聲' ? 'reduced-sound' : 'sound', sound[1], sound[0]);
    }
  }
  return { clauses, parts };
}

function constructionRoleKey(role) {
  return ({ from: 'constructionFrom', sound: 'constructionSound', 'also-sound': 'constructionAlsoSound', 'reduced-sound': 'constructionReducedSound' })[role];
}

function appendConstructionText(node, text, construction) {
  const tokens = construction.parts.map(part => ({ ...part, start: text.indexOf(part.text) }))
    .filter(part => part.start >= 0).sort((a, b) => a.start - b.start || b.text.length - a.text.length);
  let cursor = 0;
  for (const token of tokens) {
    if (token.start < cursor) continue;
    node.append(document.createTextNode(text.slice(cursor, token.start)));
    const mark = element('mark', 'construction-mark ' + token.role, token.text);
    mark.title = t(constructionRoleKey(token.role));
    node.append(mark);
    cursor = token.start + token.text.length;
  }
  node.append(document.createTextNode(text.slice(cursor)));
}

function lookup(raw, entryId = null) {
  const simple = String(raw || '').trim();
  if (!/^[\u4e00-\u9fff]$/u.test(simple) || !Object.prototype.hasOwnProperty.call(BROWSE_DATA.records, simple)) return null;
  const modern = BROWSE_DATA.records[simple];
  const entries = modern.entries.map(id => SHUOWEN_DATA.entries[id]).filter(Boolean);
  const sw = entries.find(entry => String(entry.id) === String(entryId)) || entries[0] || null;
  const traditions = [...(TS[simple] || '')];
  const traditional = sw && (sw.head === simple || traditions.includes(sw.head)) ? sw.head : (traditions[0] || simple);
  const historical = sw?.head || traditional;
  const variant = sw?.variants.find(item => item.head === simple || item.head === traditional) || null;
  const displayForms = new Set([simple, ...traditions]);
  const entryRelation = !sw ? null : displayForms.has(sw.head) ? 'head' :
    sw.variants.some(item => displayForms.has(item.head)) ? 'variant' : 'index';
  return {
    s: simple, t: traditional, sameT: simple === traditional,
    sw, entries, entryId: sw?.id || null, entryRelation, variant, rarity: modern.rarity,
    construction: constructionInfo(sw),
    pinyin: modern.p.join(' · ') || sw?.p || '',
    sealChar: [historical, traditional, simple].find(char => HAS_SEAL.includes(char)) || null,
    oracChar: [historical, traditional, simple].find(char => HAS_ORAC.includes(char)) || null
  };
}

function render(raw, entryId = null) {
  clearInterval(timer);
  clearTimeout(animationTimeout);
  const record = lookup(raw, entryId), card = $('#card');
  card.replaceChildren();
  if (!record) {
    card.append(element('p', 'note', raw ? t('unsupportedCharacter', { char: String(raw).slice(0, 6) }) : t('enterCharacter')));
    return;
  }
  const sw = record.sw || {};
  const head = element('div', 'head');
  head.append(element('span', 'zi', record.s));
  if (!record.sameT) head.append(element('span', 'trad', record.t));
  if (record.pinyin) head.append(element('span', 'py', record.pinyin));
  head.append(element('span', 'rarity-badge', t('rarityBadge', { rarity: record.rarity })));
  head.append(element('span', 'tag', t(record.oracChar ? 'allForms' : (record.sealChar ? 'hasSeal' : 'modernOnly'))));

  const selector = element('div', 'entry-selector');
  if (record.entries.length > 1) {
    selector.setAttribute('role', 'group');
    selector.setAttribute('aria-label', t('relatedEntries'));
    selector.append(element('span', 'entry-label', t('relatedEntries')));
    for (const entry of record.entries) {
      const button = element('button', 'entry-option', entry.head + ' · ' + entry.r);
      button.type = 'button';
      const selected = entry.id === sw.id;
      button.classList.toggle('on', selected);
      button.setAttribute('aria-pressed', String(selected));
      button.onclick = () => selectShuowenEntry(String(entry.id));
      selector.append(button);
    }
  }

  const timeline = element('div', 'stages');
  timeline.id = 'tl';
  const cells = [
    { char: record.oracChar, family: 'Orac', label: 'stageOracle', era: 'eraShang', missing: 'missingOracle' },
    { char: record.sealChar, family: 'Seal', label: 'stageSeal', era: 'eraQin', missing: 'missingSeal' },
    { char: record.t, label: record.sameT ? 'stageTraditionalSame' : 'stageTraditional', era: 'eraHan' },
    { char: record.s, label: 'stageSimplified', era: 'eraToday' }
  ];
  for (const cell of cells) {
    const stage = element('div', 'stage'), art = element('div', 'art');
    if (cell.char) {
      const glyph = element('span', (cell.family ? 'fonty' : 'sys') + ' glyphwrap', cell.char);
      glyph.lang = 'zh';
      if (cell.family) glyph.style.fontFamily = cell.family;
      art.append(glyph);
    } else art.append(element('span', 'void', t(cell.missing)));
    stage.append(art, element('div', 'lab', t(cell.label)), element('div', 'era', t(cell.era)));
    timeline.append(stage);
  }

  const phonetics = element('div', 'phon'), modern = element('div');
  modern.append(element('label', '', t('modernPronunciation')), element('span', record.pinyin ? '' : 'na', record.pinyin || '—'));
  const surname = SURNAME[record.s] || SURNAME[record.t];
  if (surname) modern.append(element('em', 'sn', t('surnameReading', { reading: surname })));
  phonetics.append(modern);

  const explanation = element('section', 'shuowen');
  if (sw.e) {
    explanation.append(element('div', 'explanation-label', t('historicalAccount')));
    const quote = element('div', 'q');
    if (LANG === 'en') quote.textContent = sw.eEn || t('translationUnavailable');
    else appendConstructionText(quote, sw.e, record.construction);
    explanation.append(quote);
    if (LANG === 'en') {
      const original = element('details', 'original');
      original.append(element('summary', '', t('originalText')));
      const quotation = element('p', 'original-text');
      appendConstructionText(quotation, sw.e, record.construction);
      quotation.lang = 'zh-Hant';
      original.append(quotation);
      explanation.append(original);
    }
    const source = [t('sourceShuowen')];
    source.push(t(record.entryRelation === 'index' ? 'sourceIndexedHead' : 'sourceHead', { head: sw.head }));
    if (sw.p) source.push(t('sourceEntryReading', { reading: sw.p }));
    if (sw.r) source.push(t('sourceRadical', { radical: sw.r }));
    if (sw.v) source.push(t('sourceVolume', { volume: Number(sw.v) }));
    if (sw.w) source.push(t('sourceVariants', { variants: sw.w }));
    explanation.append(element('div', 'src', source.join(' · ')));
    const link = element('a', 'source-link', t('sourceLink'));
    link.href = 'https://www.shuowen.org/view/' + encodeURIComponent(sw.id);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    explanation.append(link);
  } else explanation.append(element('p', 'q muted', t('noShuowen')));
  card.append(head);
  if (record.entries.length > 1) card.append(selector);
  card.append(timeline, phonetics);
  if (record.construction.clauses.length) {
    const structure = element('section', 'construction');
    structure.append(element('h3', '', t('constructionTitle')));
    const parts = element('div', 'construction-parts');
    for (const part of record.construction.parts) {
      const item = element('div', 'construction-part ' + part.role);
      item.append(element('span', 'role-label', t(constructionRoleKey(part.role))), element('strong', '', part.text));
      parts.append(item);
    }
    structure.append(parts);
    const original = element('p', 'construction-original');
    original.lang = 'zh-Hant';
    appendConstructionText(original, record.construction.clauses.join('；') + '。', record.construction);
    structure.append(original);
    card.append(structure);
  }
  card.append(explanation);
  if (record.variant?.e) {
    const variant = element('section', 'variant-note');
    variant.append(element('h3', '', t('variantAccount', { char: record.variant.head })), element('p', '', record.variant.e));
    card.append(variant);
  }

  const correction = XZ[record.s] || XZ[record.t];
  if (correction) {
    const note = element('aside', 'xz');
    note.append(element('div', 't', t('correction')));
    note.append(element('p', '', LANG === 'en' ? correction.tEn : correction.t));
    card.append(note);
  }
  const notes = [];
  if (!record.sealChar) notes.push(t('noSealNote'));
  if (!record.oracChar) notes.push(t('noOracleNote'));
  if (!record.sameT) notes.push(t('traditionalMapping', { simple: record.s, traditional: record.t }));
  if (notes.length) card.append(element('div', 'note', notes.join(' ')));
  animationTimeout = setTimeout(play, 140);
}

function play() {
  clearTimeout(animationTimeout);
  clearInterval(timer);
  const stages = [...document.querySelectorAll('#tl .stage')];
  if (!stages.length) return;
  stages.forEach(stage => stage.classList.remove('lit'));
  let index = 0;
  timer = setInterval(() => {
    if (index > 0) stages[index - 1].classList.remove('lit');
    if (index >= stages.length) {
      clearInterval(timer);
      stages[stages.length - 1].classList.add('lit');
    } else stages[index++].classList.add('lit');
  }, 560);
}

function updateStaticText() {
  document.documentElement.lang = LANG === 'en' ? 'en' : 'zh-Hans';
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach(node => {
    if (node.id === 'exphint' && exportBusy) return;
    node.textContent = t(node.dataset.i18n);
  });
  $('#q').placeholder = t('searchPlaceholder');
  $('#q').setAttribute('aria-label', t('searchLabel'));
  $('#card').setAttribute('aria-label', t('characterExplanation'));
  $('.languages').setAttribute('aria-label', t('languageLabel'));
  $('.themes').setAttribute('aria-label', t('themeLabel'));
  $('#visit-stats').setAttribute('aria-label', t('statistics'));
  document.querySelectorAll('.lang-btn').forEach(button => {
    const active = button.dataset.lang === LANG;
    button.classList.toggle('on', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function setLanguage(language) {
  if (!(language === 'en' || language === 'zh')) return;
  LANG = language;
  try { localStorage.setItem('yigezi.language', language); } catch (_) {}
  updateStaticText();
  refreshExportHint();
  renderView({ preserveScroll: true });
  window.dispatchEvent(new Event('languagechange'));
}

function applyTheme(theme, syncRoute = true) {
  if (!Object.prototype.hasOwnProperty.call(THEMES, theme)) return;
  THEME = theme;
  for (const [name, value] of Object.entries(THEMES[theme])) document.documentElement.style.setProperty('--' + name, value);
  document.querySelectorAll('.theme-btn').forEach(button => {
    const active = button.dataset.k === theme;
    button.classList.toggle('on', active);
    button.setAttribute('aria-pressed', String(active));
  });
  if (syncRoute && browseReady) syncBrowseTheme();
}

function loadHash() {
  loadBrowseRoute();
}

document.addEventListener('DOMContentLoaded', () => {
  $('#play').onclick = play;
  $('#exp-jpg').onclick = exportJPG;
  $('#exp-gif').onclick = exportGIF;
  $('#exp-batch').onclick = exportBatch;
  document.querySelectorAll('.theme-btn').forEach(button => { button.onclick = () => applyTheme(button.dataset.k); });
  document.querySelectorAll('.lang-btn').forEach(button => { button.onclick = () => setLanguage(button.dataset.lang); });
  updateStaticText();
  initBrowse();
  loadHash();
});
