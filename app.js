'use strict';
const THEMES = {
  paper: { bg: '#faf7f0', card: '#fdfbf7', ink: '#231f1a', red: '#a8322a', line: '#e8dfd0', box: '#f5f1e8', mut: '#9a8a76', dim: '#cfc4af' },
  rubbing: { bg: '#191917', card: '#212120', ink: '#e9e4d9', red: '#c9a227', line: '#37372f', box: '#2a2a26', mut: '#8b8678', dim: '#5b5649' },
  classic: { bg: '#f4eee0', card: '#fffdf6', ink: '#3a3025', red: '#a8442a', line: '#e4d9c0', box: '#f9f4e8', mut: '#9c8f76', dim: '#c8bda4' }
};
let THEME = 'paper', timer = null, animationTimeout = null;
const $ = selector => document.querySelector(selector);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function lookup(raw) {
  // Deliberately limited to the basic Han range. Extension headwords are retired.
  const match = String(raw || '').match(/[\u4e00-\u9fff]/);
  if (!match) return null;
  const simple = match[0];
  const traditions = [...(TS[simple] || '')];
  const traditional = traditions.find(char => SW[char] || HAS_ORAC.includes(char)) || traditions[0] || simple;
  return {
    s: simple, t: traditional, sameT: simple === traditional,
    sw: SW[traditional] || SW[simple] || null,
    pinyin: BROWSE_DATA.records[simple]?.p.join(' · ') || (SW[traditional] || SW[simple])?.p || '',
    sealChar: HAS_SEAL.includes(traditional) ? traditional : (HAS_SEAL.includes(simple) ? simple : null),
    oracChar: HAS_ORAC.includes(traditional) ? traditional : (HAS_ORAC.includes(simple) ? simple : null)
  };
}

function render(raw) {
  clearInterval(timer);
  clearTimeout(animationTimeout);
  const record = lookup(raw), card = $('#card');
  card.replaceChildren();
  if (!record) {
    card.append(element('p', 'note', t('enterCharacter')));
    return;
  }
  const sw = record.sw || {};
  const head = element('div', 'head');
  head.append(element('span', 'zi', record.s));
  if (!record.sameT) head.append(element('span', 'trad', record.t));
  if (record.pinyin) head.append(element('span', 'py', record.pinyin));
  head.append(element('span', 'tag', t(record.oracChar ? 'allForms' : (record.sealChar ? 'hasSeal' : 'modernOnly'))));

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
    explanation.append(element('div', 'q', LANG === 'en' ? (sw.eEn || t('translationUnavailable')) : sw.e));
    if (LANG === 'en') {
      const original = element('details', 'original');
      original.append(element('summary', '', t('originalText')));
      const quotation = element('p', 'original-text', sw.e);
      quotation.lang = 'zh-Hant';
      original.append(quotation);
      explanation.append(original);
    }
    const source = [t('sourceShuowen')];
    if (sw.r && sw.r !== record.t) source.push(t('sourceRadical', { radical: sw.r }));
    if (sw.v) source.push(t('sourceVolume', { volume: Number(sw.v) }));
    if (sw.w) source.push(t('sourceVariants', { variants: sw.w }));
    explanation.append(element('div', 'src', source.join(' · ')));
  } else explanation.append(element('p', 'q muted', t('noShuowen')));
  card.append(head, timeline, phonetics, explanation);

  const correction = XZ[record.s] || XZ[record.t];
  if (correction || (sw.e && record.oracChar)) {
    const note = element('aside', 'xz');
    note.append(element('div', 't', t(correction ? 'correction' : 'historicalNoteTitle')));
    note.append(element('p', '', correction ? (LANG === 'en' ? correction.tEn : correction.t) : t('historicalNote')));
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
  $('#collection').textContent = t('collection', { seal: [...HAS_SEAL].length, oracle: [...HAS_ORAC].length, entries: Object.keys(SW).length });
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
  const inputCharacter = event => {
    if (event.isComposing) return;
    const character = $('#q').value.match(/[\u4e00-\u9fff]/)?.[0];
    if (character) openCharacter(character, true);
    else if (!$('#q').value) navigateBrowse({ view: 'all', filter: '', page: 1 }, { focus: false, scroll: false });
    else navigateBrowse({ view: 'invalid', raw: $('#q').value }, { replace: isCharacterView(), focus: false, scroll: false });
  };
  $('#q').addEventListener('input', inputCharacter);
  $('#q').addEventListener('compositionend', inputCharacter);
  for (const character of QUICK) {
    const button = element('button', '', character);
    button.type = 'button';
    button.onclick = () => openCharacter(character);
    $('#quick').append(button);
  }
  document.querySelectorAll('.theme-btn').forEach(button => { button.onclick = () => applyTheme(button.dataset.k); });
  document.querySelectorAll('.lang-btn').forEach(button => { button.onclick = () => setLanguage(button.dataset.lang); });
  updateStaticText();
  initBrowse();
  loadHash();
});
