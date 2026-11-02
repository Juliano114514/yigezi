/* Offline word/character browsing, filtering, and hash navigation. */
'use strict';

const BROWSE_PAGE_SIZE = 80;
const pinyinCharacters = new Map();
const radicalCharacters = new Map();
const radicalLabels = new Map(BROWSE_DATA.radicals.map(radical => [String(radical.id), radical]));
const characterSearch = new Map();
const wordSearch = new Map();
let orderedCharacters = [];
let orderedWords = [];
let browseReady = false;
let viewState = { view: 'all', filter: '', query: '', rarities: [], page: 1 };
let lastGrid = { route: { ...viewState }, y: 0, sidebarY: 0, letter: '' };
let expandedLetter = '';
let restoreFrame = null;
let routeFrame = null;
let scrollSaveTimer = null;

function browseScroller() {
  return window.matchMedia('(max-width:900px)').matches ? $('#browse-nav') : $('#sidebar');
}

function isCharacterView(route = viewState) {
  return route.view === 'character' || route.view === 'invalid';
}

function normalizePinyin(value) {
  return String(value).toLowerCase().replace(/ɡ/g, 'g').replace(/u:|v/g, 'ü')
    .normalize('NFD').replace(/[\u0300\u0301\u0304\u030c]/g, '').normalize('NFC')
    .replace(/[0-5]/g, '');
}

function pinyinLetter(syllable) {
  return syllable.normalize('NFD')[0]?.toUpperCase() || '';
}

function pinyinSortKey(value) {
  const source = String(value || '').toLowerCase().replace(/ɡ/g, 'g').replace(/u:|v/g, 'ü');
  const syllables = source.match(/[a-züêāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹḿ]+[0-5]?/g) || [];
  return syllables.map(syllable => {
    const decomposed = syllable.normalize('NFD');
    let tone = Number(syllable.match(/[1-5]$/)?.[0]) || 5;
    for (const [mark, number] of [['\u0304', 1], ['\u0301', 2], ['\u030c', 3], ['\u0300', 4]]) {
      if (decomposed.includes(mark)) { tone = number; break; }
    }
    return [normalizePinyin(syllable), tone];
  });
}

function compareText(left, right) {
  return left === right ? 0 : (left < right ? -1 : 1);
}

function compareLetters(left, right) {
  const weight = character => character === 'ü' ? 'u'.codePointAt(0) * 2 + 1 : character === 'ê' ? 'e'.codePointAt(0) * 2 + 1 : character.codePointAt(0) * 2;
  for (let index = 0; index < Math.min(left.length, right.length); index++) {
    const difference = weight(left[index]) - weight(right[index]);
    if (difference) return difference;
  }
  return left.length - right.length;
}

function comparePinyin(left, right) {
  const a = pinyinSortKey(left), b = pinyinSortKey(right);
  for (let index = 0; index < Math.min(a.length, b.length); index++) {
    const difference = compareLetters(a[index][0], b[index][0]) || a[index][1] - b[index][1];
    if (difference) return difference;
  }
  return a.length - b.length;
}

function searchText(value) {
  return normalizePinyin(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

function matchesQuery(text, query) {
  return searchText(query).split(/\s+/).filter(Boolean).every(token => text.includes(token));
}

function normalizedRarities(value) {
  const levels = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(levels.filter(level => String(level).trim() !== '').map(Number)
    .filter(level => Number.isInteger(level) && level >= 0 && level <= 2))].sort();
}

function radicalName(radical) {
  return LANG === 'en' ? radical.en : radical.zh;
}

function radicalGlyphs(radical) {
  return radical.glyph;
}

function gridRoute() {
  return isCharacterView() ? lastGrid.route : viewState;
}

function resultsFor(route) {
  let items = route.view === 'words' ? orderedWords : orderedCharacters;
  if (route.view === 'pinyin' && route.filter) items = pinyinCharacters.get(route.filter) || [];
  if (route.view === 'radical' && route.filter) items = radicalCharacters.get(route.filter) || [];
  const levels = route.rarities || [], query = route.query || '';
  if (!levels.length && !query.trim()) return items;
  return items.filter(item => {
    const record = route.view === 'words' ? item : BROWSE_DATA.records[item];
    const searchable = route.view === 'words' ? wordSearch.get(String(item.id)) : characterSearch.get(item);
    return (!levels.length || levels.includes(record.rarity)) && (!query.trim() || matchesQuery(searchable || '', query));
  });
}

function validatedRoute(route) {
  if (route.view === 'invalid') return { view: 'invalid', raw: String(route.raw || '').slice(0, 100), filter: '', page: 1 };
  if (route.view === 'character' && /^\p{Script=Han}$/u.test(route.z || '')) {
    const result = { view: 'character', z: route.z, filter: '', page: 1 };
    const entry = String(route.e || '');
    if (BROWSE_DATA.records[route.z]?.entries?.map(String).includes(entry)) result.e = entry;
    return result;
  }
  const view = ['words', 'all', 'pinyin', 'radical'].includes(route.view) ? route.view : 'all';
  let filter = '';
  if (view === 'pinyin') {
    const syllable = normalizePinyin(route.filter || '');
    if (pinyinCharacters.has(syllable)) filter = syllable;
  } else if (view === 'radical' && (radicalLabels.has(String(route.filter)) || route.filter === 'unclassified')) {
    filter = String(route.filter);
  }
  const result = { view, filter, query: String(route.query || '').slice(0, 100), rarities: normalizedRarities(route.rarities), page: 1 };
  const page = Number(route.page), pages = Math.max(1, Math.ceil(resultsFor(result).length / BROWSE_PAGE_SIZE));
  result.page = Number.isSafeInteger(page) ? Math.max(1, Math.min(page, pages)) : 1;
  return result;
}

function browseHash(route) {
  const params = new URLSearchParams();
  if (isCharacterView(route)) {
    params.set('z', route.z || route.raw || '');
    if (route.e) params.set('e', route.e);
  } else {
    params.set('view', route.view);
    if (route.filter) params.set(route.view === 'pinyin' ? 'p' : 'r', route.filter);
    if (route.query) params.set('q', route.query);
    if (route.rarities?.length) params.set('rarity', route.rarities.join(','));
    if (route.page > 1) params.set('page', route.page);
  }
  if (THEME !== 'paper') params.set('t', THEME);
  return '#' + params.toString();
}

function currentGrid() {
  return { route: { ...viewState, rarities: [...(viewState.rarities || [])] }, y: window.scrollY, sidebarY: browseScroller().scrollTop, letter: expandedLetter };
}

function saveBrowseEntry() {
  if (!browseReady) return;
  if (!isCharacterView()) lastGrid = currentGrid();
  const previous = history.state?.yigezi || {};
  history.replaceState({ yigezi: {
    lastGrid, y: window.scrollY, sidebarY: browseScroller().scrollTop,
    letter: expandedLetter, fromGrid: Boolean(previous.fromGrid)
  } }, '', location.href);
}

function syncBrowseTheme() {
  saveBrowseEntry();
  history.replaceState(history.state, '', browseHash(viewState));
}

function restoreBrowsePosition(position) {
  if (restoreFrame !== null) cancelAnimationFrame(restoreFrame);
  restoreFrame = requestAnimationFrame(() => {
    restoreFrame = null;
    const y = Number(position?.y);
    window.scrollTo(0, Number.isFinite(y) ? Math.max(0, y) : 0);
    browseScroller().scrollTop = Math.max(0, Number(position?.sidebarY) || 0);
    saveBrowseEntry();
  });
}

function closeBrowseMenu() {
  $('#sidebar').classList.remove('open');
  $('#browse-toggle').setAttribute('aria-expanded', 'false');
}

function navigateBrowse(route, options = {}) {
  if (restoreFrame !== null) cancelAnimationFrame(restoreFrame);
  restoreFrame = null;
  const next = validatedRoute(route);
  const fromGrid = isCharacterView(next) && (!isCharacterView() || Boolean(history.state?.yigezi?.fromGrid));
  saveBrowseEntry();
  viewState = next;
  if (next.view === 'pinyin' && next.filter) expandedLetter = pinyinLetter(next.filter);
  if (isCharacterView(next) || ['all', 'words'].includes(next.view) || next.filter) closeBrowseMenu();
  const state = { yigezi: { lastGrid, fromGrid, y: 0, sidebarY: 0, letter: expandedLetter } };
  history[options.replace ? 'replaceState' : 'pushState'](state, '', browseHash(next));
  renderView();
  if (options.restore) restoreBrowsePosition(options.restore);
  else if (options.scroll !== false) $('.content').scrollIntoView({ block: 'start' });
  if (options.focus !== false) {
    const target = isCharacterView(next) ? $('#card') : $('#results-title');
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  saveBrowseEntry();
}

function openCharacter(character, typing = false) {
  if (viewState.view === 'character' && viewState.z === character) return;
  navigateBrowse({ view: 'character', z: character }, {
    replace: isCharacterView(), focus: !typing, scroll: !typing
  });
}

function selectShuowenEntry(id) {
  if (viewState.view !== 'character') return;
  const entry = String(id);
  if (!BROWSE_DATA.records[viewState.z]?.entries?.map(String).includes(entry)) return;
  const position = { y: window.scrollY, sidebarY: browseScroller().scrollTop };
  navigateBrowse({ ...viewState, e: entry }, { replace: true, focus: false, scroll: false, restore: position });
}

function loadBrowseRoute() {
  const params = new URLSearchParams(location.hash.slice(1).replace(/;/g, '&'));
  applyTheme(Object.prototype.hasOwnProperty.call(THEMES, params.get('t')) ? params.get('t') : 'paper', false);
  const raw = params.get('z') || '';
  viewState = validatedRoute(params.has('z') ? (/^\p{Script=Han}$/u.test(raw) ? {
    view: 'character', z: raw, e: params.get('e')
  } : { view: 'invalid', raw }) : {
    view: params.get('view'), filter: params.get(params.get('view') === 'pinyin' ? 'p' : 'r'),
    query: params.get('q'), rarities: params.get('rarity'),
    page: /^\d{1,6}$/.test(params.get('page') || '') ? Number(params.get('page')) : 1
  });
  const saved = history.state?.yigezi;
  if (saved?.lastGrid && !isCharacterView(saved.lastGrid.route || {})) {
    lastGrid = { ...saved.lastGrid, route: validatedRoute(saved.lastGrid.route || {}) };
  }
  expandedLetter = saved?.letter || (viewState.view === 'pinyin' && viewState.filter ? pinyinLetter(viewState.filter) : '');
  closeBrowseMenu();
  renderView();
  restoreBrowsePosition(saved || { y: 0, sidebarY: 0 });
}

function renderSidebar() {
  const nav = $('#browse-nav'), scroller = browseScroller(), sidebarY = scroller.scrollTop;
  const active = gridRoute();
  nav.setAttribute('aria-label', t('browseNavigation'));
  for (const mode of ['words', 'all', 'pinyin', 'radical']) {
    const button = $('#nav-' + mode), on = active.view === mode;
    button.classList.toggle('on', on);
    if (on) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  $('#pinyin-index').hidden = active.view !== 'pinyin';
  $('#radical-index').hidden = active.view !== 'radical';
  const syllables = [...pinyinCharacters.keys()].sort(compareLetters);
  const pinyinFragment = document.createDocumentFragment();
  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const matching = syllables.filter(syllable => pinyinLetter(syllable) === letter);
    if (!matching.length) {
      const unavailable = element('button', 'letter-empty', letter);
      unavailable.type = 'button';
      unavailable.disabled = true;
      pinyinFragment.append(unavailable);
      continue;
    }
    const group = element('details', 'pinyin-letter');
    group.setAttribute('name', 'pinyin-letters');
    group.open = expandedLetter === letter;
    const summary = element('summary', '', letter), list = element('div', 'syllables');
    for (const syllable of matching) {
      const button = element('button', 'syllable', syllable);
      button.type = 'button';
      const on = active.view === 'pinyin' && active.filter === syllable;
      button.classList.toggle('on', on);
      button.setAttribute('aria-pressed', String(on));
      button.onclick = () => navigateBrowse({ ...active, view: 'pinyin', filter: syllable, page: 1 });
      list.append(button);
    }
    group.append(summary, list);
    group.addEventListener('toggle', () => {
      if (!group.isConnected) return;
      if (group.open) {
        expandedLetter = letter;
        $('#pinyin-index').querySelectorAll('details').forEach(other => { if (other !== group) other.open = false; });
      } else if (expandedLetter === letter) expandedLetter = '';
    });
    pinyinFragment.append(group);
  }
  $('#pinyin-index').replaceChildren(pinyinFragment);
  const radicalFragment = document.createDocumentFragment();
  let volume = null;
  for (const radical of BROWSE_DATA.radicals) {
    const count = radicalCharacters.get(String(radical.id))?.length || 0;
    if (!count) continue;
    if (String(radical.volume) !== volume) {
      volume = String(radical.volume);
      radicalFragment.append(element('div', 'radical-volume', t('radicalVolume', { volume: Number(volume) })));
    }
    const button = element('button', 'radical-item');
    button.type = 'button';
    const on = active.view === 'radical' && active.filter === String(radical.id);
    button.classList.toggle('on', on);
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', radicalGlyphs(radical) + ' · ' + radicalName(radical) + ' · ' + t('radicalGroupCount', { count }));
    button.append(element('span', 'radical-glyph', radicalGlyphs(radical)), element('span', 'radical-name', radicalName(radical)), element('span', 'radical-count', String(count)));
    button.onclick = () => navigateBrowse({ ...active, view: 'radical', filter: String(radical.id), page: 1 });
    radicalFragment.append(button);
  }
  const unclassified = radicalCharacters.get('unclassified')?.length || 0;
  if (unclassified) {
    const button = element('button', 'radical-item', t('noRadical') + ' · ' + unclassified);
    button.type = 'button';
    button.classList.toggle('on', active.view === 'radical' && active.filter === 'unclassified');
    button.setAttribute('aria-pressed', String(active.view === 'radical' && active.filter === 'unclassified'));
    button.onclick = () => navigateBrowse({ ...active, view: 'radical', filter: 'unclassified', page: 1 });
    radicalFragment.append(button);
  }
  $('#radical-index').replaceChildren(radicalFragment);
  scroller.scrollTop = sidebarY;
}

function rarityBadge(level, word = false) {
  const badge = element('span', 'rarity-badge', t('rarityLevel', { level }));
  badge.dataset.rarity = String(level);
  badge.title = t((word ? 'wordRarity' : 'rarity') + level);
  return badge;
}

function renderRarityFilters() {
  const container = $('#rarity-filters');
  container.setAttribute('aria-label', t('rarity'));
  const fragment = document.createDocumentFragment();
  fragment.append(element('span', 'rarity-label', t('rarity')));
  const all = element('button', 'rarity-filter', t('rarityAll'));
  all.type = 'button';
  all.classList.toggle('on', !viewState.rarities.length);
  all.setAttribute('aria-pressed', String(!viewState.rarities.length));
  all.onclick = () => navigateBrowse({ ...viewState, page: 1, rarities: [] }, { scroll: false });
  fragment.append(all);
  for (const level of [0, 1, 2]) {
    const button = element('button', 'rarity-filter', t('rarityLevel', { level }));
    const selected = viewState.rarities.includes(level);
    button.type = 'button';
    button.dataset.rarity = String(level);
    button.classList.toggle('on', selected);
    button.setAttribute('aria-pressed', String(selected));
    button.onclick = () => navigateBrowse({ ...viewState, page: 1, rarities: selected ? viewState.rarities.filter(item => item !== level) : [...viewState.rarities, level] }, { scroll: false });
    fragment.append(button);
  }
  container.replaceChildren(fragment);
}

function characterLink(character, className) {
  const link = element('a', className, character);
  link.href = browseHash({ view: 'character', z: character });
  link.lang = 'zh';
  link.setAttribute('aria-label', t('browseOpenCharacter', { char: character }));
  link.onclick = event => {
    if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openCharacter(character);
  };
  return link;
}

function renderCharacterGrid() {
  const items = resultsFor(viewState), words = viewState.view === 'words';
  const pages = Math.max(1, Math.ceil(items.length / BROWSE_PAGE_SIZE));
  let title = t(words ? 'browseWords' : 'browseAll');
  if (viewState.view === 'pinyin') title = viewState.filter || t('browsePinyin');
  if (viewState.view === 'radical') {
    const radical = radicalLabels.get(viewState.filter);
    title = radical ? radicalGlyphs(radical) + ' · ' + radicalName(radical) : t(viewState.filter === 'unclassified' ? 'noRadical' : 'browseRadical');
  }
  $('#results-title').textContent = title;
  const countKey = words ? (items.length === 1 ? 'browseWordCountOne' : 'browseWordCount') :
    (items.length === 1 ? 'browseCountOne' : 'browseCount');
  $('#results-count').textContent = t(countKey, { count: items.length.toLocaleString(LANG === 'zh' ? 'zh-CN' : 'en-US') });
  renderRarityFilters();
  $('#rarity-explanation').textContent = t(words ? 'wordRarityExplanation' : 'rarityExplanation');
  const fragment = document.createDocumentFragment();
  for (const item of items.slice((viewState.page - 1) * BROWSE_PAGE_SIZE, viewState.page * BROWSE_PAGE_SIZE)) {
    if (words) {
      const tile = element('article', 'word-tile');
      const heading = element('div', 'word-hanzi', item.hanzi);
      heading.lang = 'zh-Hans';
      const pinyin = element('div', 'word-pinyin', item.pinyin);
      pinyin.lang = 'zh-Latn';
      const meta = element('div', 'word-meta');
      if (item.pos) meta.append(element('span', 'word-pos', item.pos));
      meta.append(rarityBadge(item.rarity, true));
      const characters = element('div', 'word-characters');
      characters.setAttribute('aria-label', t('wordCharacters'));
      for (const character of new Set([...item.hanzi])) {
        if (BROWSE_DATA.records[character]) characters.append(characterLink(character, 'word-character'));
      }
      const english = element('div', 'word-english', item.english);
      english.lang = 'en';
      tile.append(heading, pinyin, english, meta, characters);
      fragment.append(tile);
    } else {
      const tile = characterLink(item, 'character-tile');
      tile.replaceChildren();
      const glyph = element('span', 'tile-hanzi', item), pinyin = element('span', 'tile-pinyin', BROWSE_DATA.records[item].p.join(' · '));
      pinyin.lang = 'zh-Latn';
      tile.append(glyph, pinyin, rarityBadge(BROWSE_DATA.records[item].rarity));
      fragment.append(tile);
    }
  }
  const grid = $('#character-grid');
  grid.classList.toggle('word-grid', words);
  grid.dataset.view = words ? 'words' : 'characters';
  grid.replaceChildren(fragment);
  $('#browse-empty').hidden = items.length > 0;
  const pagination = $('#pagination');
  pagination.setAttribute('aria-label', t('browsePagination'));
  pagination.replaceChildren();
  pagination.hidden = pages <= 1;
  const previous = element('button', '', t('browsePrevious')), next = element('button', '', t('browseNext'));
  previous.type = next.type = 'button';
  previous.disabled = viewState.page === 1;
  next.disabled = viewState.page === pages;
  previous.onclick = () => navigateBrowse({ ...viewState, page: viewState.page - 1 });
  next.onclick = () => navigateBrowse({ ...viewState, page: viewState.page + 1 });
  pagination.append(previous, element('span', 'page-position', t('browsePage', { page: viewState.page, pages })), next);
}

function renderView(options = {}) {
  const position = options.preserveScroll ? { y: window.scrollY, sidebarY: browseScroller().scrollTop } : null;
  const detail = isCharacterView();
  clearInterval(timer);
  clearTimeout(animationTimeout);
  timer = animationTimeout = null;
  $('#browse-results').hidden = detail;
  $('#detail-view').hidden = !detail;
  $('#back-to-results').hidden = !detail;
  $('.toolbar').hidden = detail && (viewState.view === 'invalid' || !BROWSE_DATA.records[viewState.z]);
  if (detail) {
    $('#q').value = viewState.z || viewState.raw || '';
    render($('#q').value, viewState.e);
  } else {
    $('#q').value = viewState.query;
    $('#card').replaceChildren();
    renderCharacterGrid();
  }
  renderSidebar();
  if (position) restoreBrowsePosition(position);
}

function initBrowse() {
  orderedCharacters = [...BROWSE_DATA.characters].sort((a, b) => {
    const left = BROWSE_DATA.records[a], right = BROWSE_DATA.records[b];
    return left.rarity - right.rarity || comparePinyin(left.p[0], right.p[0]) || compareText(a, b);
  });
  orderedWords = [...WORDLIST_DATA.words].sort((a, b) => a.rarity - b.rarity || comparePinyin(a.pinyin, b.pinyin) || compareText(String(a.id), String(b.id)));
  for (const word of orderedWords) {
    wordSearch.set(String(word.id), searchText([word.hanzi, word.pinyin, normalizePinyin(word.pinyin).replace(/\s+/g, ''), word.english].join(' ')));
  }
  for (const character of orderedCharacters) {
    const record = BROWSE_DATA.records[character];
    const readings = new Set(record.p.map(normalizePinyin));
    const surname = SURNAME[character];
    if (surname) readings.add(normalizePinyin(surname));
    const entries = (record.entries || []).map(id => SHUOWEN_DATA.entries[String(id)]).filter(Boolean);
    characterSearch.set(character, searchText([character, record.p.join(' '), ...entries.flatMap(entry => [entry.head, ...(entry.indexes || []), entry.eEn || ''])].join(' ')));
    for (const syllable of readings) {
      if (!pinyinCharacters.has(syllable)) pinyinCharacters.set(syllable, []);
      pinyinCharacters.get(syllable).push(character);
    }
    const radicals = record.r.filter(id => radicalLabels.has(String(id)));
    for (const radical of radicals.length ? radicals : ['unclassified']) {
      const key = String(radical);
      if (!radicalCharacters.has(key)) radicalCharacters.set(key, []);
      radicalCharacters.get(key).push(character);
    }
  }
  browseReady = true;
  history.scrollRestoration = 'manual';
  for (const mode of ['words', 'all', 'pinyin', 'radical']) {
    $('#nav-' + mode).onclick = () => navigateBrowse({ ...gridRoute(), view: mode, filter: '', page: 1 }, { focus: ['words', 'all'].includes(mode), scroll: ['words', 'all'].includes(mode) });
  }
  let composing = false;
  const search = () => {
    if (composing) return;
    const query = $('#q').value.slice(0, 100), active = gridRoute();
    navigateBrowse({ ...active, query, page: 1 }, { replace: !isCharacterView(), focus: false, scroll: false });
  };
  $('#q').addEventListener('compositionstart', () => { composing = true; });
  $('#q').addEventListener('compositionend', () => { composing = false; search(); });
  $('#q').addEventListener('input', event => { if (!event.isComposing) search(); });
  $('#browse-toggle').onclick = () => {
    const open = $('#sidebar').classList.toggle('open');
    $('#browse-toggle').setAttribute('aria-expanded', String(open));
  };
  $('#back-to-results').onclick = () => {
    if (history.state?.yigezi?.fromGrid) history.back();
    else navigateBrowse(lastGrid.route, { restore: lastGrid });
  };
  const routeChanged = () => {
    if (routeFrame !== null) cancelAnimationFrame(routeFrame);
    routeFrame = requestAnimationFrame(() => { routeFrame = null; loadBrowseRoute(); });
  };
  window.addEventListener('popstate', routeChanged);
  window.addEventListener('hashchange', routeChanged);
  window.addEventListener('scroll', () => {
    clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(saveBrowseEntry, 150);
  }, { passive: true });
  window.addEventListener('pagehide', saveBrowseEntry);
}
