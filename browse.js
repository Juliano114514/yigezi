/* Local character browsing and hash navigation. No network requests. */
'use strict';

const BROWSE_PAGE_SIZE = 80;
const pinyinCharacters = new Map();
const radicalCharacters = new Map();
const radicalLabels = new Map(BROWSE_DATA.radicals.map(radical => [String(radical.id), radical]));
let browseReady = false;
let viewState = { view: 'all', filter: '', page: 1 };
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
    .normalize('NFD').replace(/[\u0300\u0301\u0304\u030c]/g, '').normalize('NFC');
}

function pinyinLetter(syllable) {
  return syllable.normalize('NFD')[0]?.toUpperCase() || '';
}

function radicalName(radical) {
  return LANG === 'en' ? radical.en : radical.zh.replace(/^.+部（(.+)）$/, '$1');
}

function radicalGlyphs(radical) {
  return radical.glyph.replace(/（[左右]）/g, '').split(' / ').slice(0, 2).join(' ');
}

function resultsFor(route) {
  if (route.view === 'pinyin' && route.filter) return pinyinCharacters.get(route.filter) || [];
  if (route.view === 'radical' && route.filter) return radicalCharacters.get(route.filter) || [];
  return BROWSE_DATA.characters;
}

function validatedRoute(route) {
  if (route.view === 'invalid') return { view: 'invalid', raw: String(route.raw || '').slice(0, 6), filter: '', page: 1 };
  if (route.view === 'character' && /^[\u4e00-\u9fff]$/.test(route.z || '')) {
    return { view: 'character', z: route.z, filter: '', page: 1 };
  }
  const view = ['all', 'pinyin', 'radical'].includes(route.view) ? route.view : 'all';
  let filter = '';
  if (view === 'pinyin') {
    const syllable = normalizePinyin(route.filter || '');
    if (pinyinCharacters.has(syllable)) filter = syllable;
  } else if (view === 'radical' && radicalLabels.has(String(route.filter))) filter = String(route.filter);
  const result = { view, filter, page: 1 };
  const page = Number(route.page);
  const pages = Math.max(1, Math.ceil(resultsFor(result).length / BROWSE_PAGE_SIZE));
  result.page = Number.isSafeInteger(page) ? Math.max(1, Math.min(page, pages)) : 1;
  return result;
}

function browseHash(route) {
  const params = new URLSearchParams();
  if (isCharacterView(route)) params.set('z', route.z || '');
  else {
    params.set('view', route.view);
    if (route.filter) params.set(route.view === 'pinyin' ? 'p' : 'r', route.filter);
    if (route.page > 1) params.set('page', route.page);
  }
  if (THEME !== 'paper') params.set('t', THEME);
  return '#' + params.toString();
}

function currentGrid() {
  return { route: { ...viewState }, y: window.scrollY, sidebarY: browseScroller().scrollTop, letter: expandedLetter };
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
  if (isCharacterView(next) || next.view === 'all' || next.filter) closeBrowseMenu();
  const state = { yigezi: { lastGrid, fromGrid, y: 0, sidebarY: 0, letter: expandedLetter } };
  history[options.replace ? 'replaceState' : 'pushState'](state, '', browseHash(next));
  renderView();
  if (options.restore) restoreBrowsePosition(options.restore);
  else if (options.scroll !== false) {
    if (restoreFrame !== null) cancelAnimationFrame(restoreFrame);
    restoreFrame = null;
    $('.content').scrollIntoView({ block: 'start' });
  }
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

function loadBrowseRoute() {
  const params = new URLSearchParams(location.hash.slice(1).replace(/;/g, '&'));
  applyTheme(Object.prototype.hasOwnProperty.call(THEMES, params.get('t')) ? params.get('t') : 'paper', false);
  const character = params.get('z')?.match(/^[\u4e00-\u9fff]/)?.[0];
  viewState = validatedRoute(character ? { view: 'character', z: character } : params.has('z') ? { view: 'invalid' } : {
    view: params.get('view'), filter: params.get(params.get('view') === 'pinyin' ? 'p' : 'r'),
    page: /^\d{1,6}$/.test(params.get('page') || '') ? Number(params.get('page')) : 1
  });
  const saved = history.state?.yigezi;
  if (saved?.lastGrid) lastGrid = { ...saved.lastGrid, route: validatedRoute(saved.lastGrid.route || {}) };
  expandedLetter = saved?.letter || (viewState.view === 'pinyin' && viewState.filter ? pinyinLetter(viewState.filter) : '');
  closeBrowseMenu();
  renderView();
  restoreBrowsePosition(saved || { y: 0, sidebarY: 0 });
}

function renderSidebar() {
  const nav = $('#browse-nav'), scroller = browseScroller(), sidebarY = scroller.scrollTop;
  const active = isCharacterView() ? lastGrid.route : viewState;
  nav.setAttribute('aria-label', t('browseNavigation'));
  for (const mode of ['all', 'pinyin', 'radical']) {
    const button = $('#nav-' + mode), on = active.view === mode;
    button.classList.toggle('on', on);
    if (on) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  $('#pinyin-index').hidden = active.view !== 'pinyin';
  $('#radical-index').hidden = active.view !== 'radical';
  const syllables = [...pinyinCharacters.keys()].sort((a, b) => a.localeCompare(b, 'en'));
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
      button.onclick = () => navigateBrowse({ view: 'pinyin', filter: syllable, page: 1 });
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
  for (const radical of BROWSE_DATA.radicals) {
    if (!radicalCharacters.get(String(radical.id))?.length) continue;
    const button = element('button', 'radical-item');
    button.type = 'button';
    const on = active.view === 'radical' && active.filter === String(radical.id);
    button.classList.toggle('on', on);
    button.setAttribute('aria-pressed', String(on));
    button.append(element('span', 'radical-glyph', radicalGlyphs(radical)), element('span', 'radical-name', radicalName(radical)));
    button.onclick = () => navigateBrowse({ view: 'radical', filter: String(radical.id), page: 1 });
    radicalFragment.append(button);
  }
  $('#radical-index').replaceChildren(radicalFragment);
  scroller.scrollTop = sidebarY;
}

function renderCharacterGrid() {
  const characters = resultsFor(viewState), pages = Math.max(1, Math.ceil(characters.length / BROWSE_PAGE_SIZE));
  let title = t('browseAll');
  if (viewState.view === 'pinyin') title = viewState.filter || t('browsePinyin');
  if (viewState.view === 'radical') {
    const radical = radicalLabels.get(viewState.filter);
    title = radical ? radicalGlyphs(radical) + ' · ' + radicalName(radical) : t('browseRadical');
  }
  $('#results-title').textContent = title;
  $('#results-count').textContent = t('browseCount', { count: characters.length.toLocaleString(LANG === 'zh' ? 'zh-CN' : 'en-US') });
  const fragment = document.createDocumentFragment();
  for (const character of characters.slice((viewState.page - 1) * BROWSE_PAGE_SIZE, viewState.page * BROWSE_PAGE_SIZE)) {
    const tile = element('a', 'character-tile', character);
    tile.href = browseHash({ view: 'character', z: character });
    tile.lang = 'zh';
    tile.setAttribute('aria-label', t('browseOpenCharacter', { char: character }));
    tile.onclick = event => {
      if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openCharacter(character);
    };
    fragment.append(tile);
  }
  $('#character-grid').replaceChildren(fragment);
  $('#browse-empty').hidden = characters.length > 0;
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
  $('#quick').hidden = !detail;
  $('#back-to-results').hidden = !detail;
  $('.toolbar').hidden = viewState.view === 'invalid';
  if (detail) {
    $('#q').value = viewState.z || viewState.raw || '';
    render($('#q').value);
  } else {
    $('#q').value = '';
    $('#card').replaceChildren();
    renderCharacterGrid();
  }
  renderSidebar();
  if (position) restoreBrowsePosition(position);
}

function initBrowse() {
  for (const character of BROWSE_DATA.characters) {
    const record = BROWSE_DATA.records[character];
    const readings = new Set(record.p.map(normalizePinyin));
    const surname = SURNAME[character];
    if (surname) readings.add(normalizePinyin(surname));
    for (const syllable of readings) {
      if (!pinyinCharacters.has(syllable)) pinyinCharacters.set(syllable, []);
      pinyinCharacters.get(syllable).push(character);
    }
    for (const radical of record.r) {
      const key = String(radical);
      if (!radicalLabels.has(key)) continue;
      if (!radicalCharacters.has(key)) radicalCharacters.set(key, []);
      radicalCharacters.get(key).push(character);
    }
  }
  browseReady = true;
  history.scrollRestoration = 'manual';
  for (const mode of ['all', 'pinyin', 'radical']) {
    $('#nav-' + mode).onclick = () => navigateBrowse({ view: mode, filter: '', page: 1 }, { focus: mode === 'all', scroll: mode === 'all' });
  }
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
