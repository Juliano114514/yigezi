/* Local JPG/GIF export. All text and colors use a captured language/theme. */
'use strict';

const EXPORT_MAX_BATCH = 100;
const EXPORT_MAX_HEIGHT = 8192;
const EXPORT_MAX_PIXELS = 8 * 1024 * 1024;
const PALETTE_BITS = 3;
let exportBusy = false;
let exportHintTimer = null;
let exportHintState = { key: 'hint', params: {} };

function exportSnapshot(options = {}) {
  return Object.freeze({
    lang: options.lang === 'zh' || options.lang === 'en' ? options.lang : LANG,
    theme: Object.prototype.hasOwnProperty.call(THEMES, options.theme) ? options.theme : THEME,
    entryId: Object.prototype.hasOwnProperty.call(options, 'entryId') ? options.entryId :
      (typeof viewState !== 'undefined' && viewState.view === 'character' ? viewState.e || null : null)
  });
}

function exportText(key, params, snapshot) {
  return t(key, params || {}, snapshot.lang);
}

function refreshExportHint() {
  const hint = document.getElementById('exphint');
  if (hint) hint.textContent = t(exportHintState.key, exportHintState.params, LANG);
}

function setExportHint(key, params = {}) {
  clearTimeout(exportHintTimer);
  exportHintState = { key, params: { ...params } };
  refreshExportHint();
}

function lockExport(locked) {
  exportBusy = locked;
  ['exp-jpg', 'exp-gif', 'exp-batch'].forEach(id => {
    const button = document.getElementById(id);
    if (button) button.disabled = locked;
  });
  const hint = document.getElementById('exphint');
  if (hint) {
    hint.classList.toggle('busy', locked);
    hint.setAttribute('aria-busy', String(locked));
  }
}

function resetExportHint(delay) {
  clearTimeout(exportHintTimer);
  exportHintTimer = setTimeout(() => setExportHint('hint'), delay);
}

function hex2rgb(hex) {
  return [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16));
}

function exportPalette(snapshot) {
  const theme = THEMES[snapshot.theme];
  return [theme.bg, theme.card, theme.ink, theme.red, theme.line, theme.mut, theme.dim, '#ffffff'].map(hex2rgb);
}

function rr(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

// Wrap English at word boundaries; split only words wider than an entire line.
// Chinese is wrapped by Unicode code point, so supplementary Hanzi stay intact.
function wrapExportText(context, text, width, lang) {
  const lines = [];
  for (const paragraph of String(text).split(/\r?\n/)) {
    const tokens = lang === 'zh' ? [...paragraph] : (paragraph.match(/\S+\s*/gu) || []);
    let line = '';
    for (const token of tokens) {
      if (context.measureText((line + token).trimEnd()).width <= width) {
        line += token;
        continue;
      }
      if (line.trim()) {
        lines.push(line.trimEnd());
        line = '';
      }
      const next = token.trimStart();
      if (context.measureText(next.trimEnd()).width <= width) {
        line = next;
        continue;
      }
      for (const point of next) {
        if (line && context.measureText(line + point).width > width) {
          lines.push(line.trimEnd());
          line = '';
        }
        line += point;
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

function exportCells(record, snapshot) {
  const text = key => exportText(key, {}, snapshot);
  return [
    { glyph: record.oracChar, family: 'Orac', size: 164, label: text('stageOracle'), era: text('eraShang'), missing: text('missingOracle') },
    { glyph: record.sealChar, family: 'Seal', size: 164, label: text('stageSeal'), era: text('eraQin'), missing: text('missingSeal') },
    { glyph: record.t, family: '"Songti SC","Noto Serif CJK SC",serif', size: 140, label: text(record.sameT ? 'stageTraditionalSame' : 'stageTraditional'), era: text('eraHan') },
    { glyph: record.s, family: '"Songti SC","Noto Serif CJK SC",serif', size: 140, label: text('stageSimplified'), era: text('eraToday') }
  ];
}

// Measurements use a 1080-unit design space for both JPG and GIF.
function measureExportCard(context, record, options = {}) {
  const snapshot = exportSnapshot(options);
  const sw = record.sw || {};
  const explanation = snapshot.lang === 'en' ? sw.eEn : sw.e;
  context.save();
  context.font = '26px Georgia,"Songti SC","Noto Serif CJK SC",serif';
  const quoteLines = wrapExportText(context, explanation || (sw.e ? exportText('translationUnavailable', {}, snapshot) + '\n' + sw.e : exportText('noShuowen', {}, snapshot)), 824, snapshot.lang);
  context.font = '24px Georgia,"Songti SC","Noto Serif CJK SC",serif';
  const structureText = [
    record.construction.parts.map(part => exportText(constructionRoleKey(part.role), {}, snapshot) + ': ' + part.text).join(' · '),
    record.construction.clauses.join('；')
  ].filter(Boolean).join('\n');
  const constructionLines = structureText ? wrapExportText(context, structureText, 824, snapshot.lang) : [];
  const constructionTop = 637;
  const quoteTop = constructionTop + (constructionLines.length ? constructionLines.length * 34 + 24 : 0);
  const quoteHeight = quoteLines.length * 40 + 36;
  const bits = [];
  bits.push(exportText('rarityBadge', { rarity: record.rarity }, snapshot));
  if (sw.head) bits.push(exportText(record.entryRelation === 'index' ? 'sourceIndexedHead' : 'sourceHead', { head: sw.head }, snapshot));
  if (sw.p) bits.push(exportText('sourceEntryReading', { reading: sw.p }, snapshot));
  if (sw.r) bits.push(exportText('sourceRadical', { radical: sw.r }, snapshot));
  if (sw.v) bits.push(exportText('sourceVolume', { volume: Number(sw.v) }, snapshot));
  if (sw.w) bits.push(exportText('sourceVariants', { variants: sw.w }, snapshot));
  if (record.variant?.e) bits.push(record.variant.head + ': ' + record.variant.e);
  context.font = '19px Georgia,"Songti SC","Noto Serif CJK SC",serif';
  const sourceLines = bits.length ? wrapExportText(context, bits.join(' · '), 856, snapshot.lang) : [];
  const sourceTop = quoteTop + quoteHeight + 31;
  const bodyBottom = sourceTop + sourceLines.length * 28;
  context.font = '18px Georgia,"Songti SC","Noto Serif CJK SC",serif';
  const brandLines = wrapExportText(context, exportText('exportBrand', {}, snapshot), 856, snapshot.lang);
  context.font = '17px Georgia,"Songti SC","Noto Serif CJK SC",serif';
  const attributionLines = wrapExportText(context, exportText('exportAttribution', {}, snapshot), 856, snapshot.lang);
  const footerHeight = brandLines.length * 27 + attributionLines.length * 25;
  const height = Math.ceil(Math.max(1080, bodyBottom + footerHeight + 148));
  context.restore();
  return { snapshot, quoteLines, quoteTop, quoteHeight, constructionLines, constructionTop, sourceLines, sourceTop, brandLines, attributionLines, footerHeight, height };
}

function drawCard(context, width, height, record, scale, active = -1, options = {}) {
  const layout = options.layout || measureExportCard(context, record, options);
  const snapshot = layout.snapshot;
  const theme = THEMES[snapshot.theme];
  const unit = width / 1080;
  const designHeight = height / unit;
  const sw = record.sw || {};
  context.save();
  context.scale(unit, unit);
  context.fillStyle = theme.bg;
  context.fillRect(0, 0, 1080, designHeight);
  rr(context, 54, 50, 972, designHeight - 100, 6);
  context.fillStyle = theme.card;
  context.fill();
  context.strokeStyle = theme.line;
  context.lineWidth = 2;
  context.stroke();
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.fillStyle = theme.ink;
  context.font = '500 62px "Songti SC","Noto Serif CJK SC",serif';
  context.fillText(record.s, 104, 150);
  let x = 104 + context.measureText(record.s).width + 16;
  if (!record.sameT) {
    context.fillStyle = theme.red;
    context.font = '40px "Songti SC","Noto Serif CJK SC",serif';
    context.fillText(record.t, x, 148);
    x += context.measureText(record.t).width + 20;
  }
  if (record.pinyin) {
    context.fillStyle = theme.mut;
    context.font = '28px Georgia,"Songti SC",serif';
    context.fillText(record.pinyin, x, 148, 976 - x);
  }
  context.font = '18px Georgia,"Songti SC",serif';
  context.fillStyle = theme.mut;
  const surname = typeof SURNAME !== 'undefined' && (SURNAME[record.s] || SURNAME[record.t]);
  const pronunciation = exportText('modernPronunciation', {}, snapshot) + ': ' + (record.pinyin || '—');
  context.fillText(pronunciation, 104, 192, surname ? 470 : 872);
  if (surname) context.fillText(exportText('surnameReading', { reading: surname }, snapshot), 594, 192, 382);
  context.strokeStyle = theme.line;
  context.beginPath();
  context.moveTo(104, 220);
  context.lineTo(976, 220);
  context.stroke();

  const by = 240, bh = 330, bw = 218;
  exportCells(record, snapshot).forEach((cell, index) => {
    const left = 104 + index * bw;
    const center = left + bw / 2;
    const lit = active < 0 || index <= active;
    if (index) {
      context.strokeStyle = theme.line;
      context.beginPath();
      context.moveTo(left, by + 16);
      context.lineTo(left, by + bh - 16);
      context.stroke();
    }
    if (lit) {
      context.fillStyle = theme.box;
      context.fillRect(left + 4, by + 8, bw - 8, bh - 16);
    }
    context.textAlign = 'center';
    context.fillStyle = lit ? theme.red : theme.ink;
    if (cell.glyph) {
      context.font = `${cell.size}px ${cell.family}`;
      context.fillText(cell.glyph, center, by + 184);
    } else {
      context.fillStyle = theme.dim;
      context.font = '24px Georgia,"Songti SC",serif';
      const missing = wrapExportText(context, cell.missing, bw - 26, snapshot.lang);
      missing.forEach((line, lineIndex) => context.fillText(line, center, by + 143 + lineIndex * 30));
    }
    context.fillStyle = lit ? theme.red : theme.ink;
    context.font = '24px Georgia,"Songti SC",serif';
    const labels = wrapExportText(context, cell.label, bw - 22, snapshot.lang);
    labels.forEach((line, lineIndex) => context.fillText(line, center, by + 238 + lineIndex * 28));
    context.fillStyle = theme.dim;
    context.font = '18px Georgia,"Songti SC",serif';
    const eras = wrapExportText(context, cell.era, bw - 22, snapshot.lang);
    eras.forEach((line, lineIndex) => context.fillText(line, center, by + 304 + lineIndex * 22));
    if (lit) {
      context.strokeStyle = theme.red;
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(left + bw * 0.3, by + bh - 8);
      context.lineTo(left + bw * 0.7, by + bh - 8);
      context.stroke();
      context.lineWidth = 2;
    }
  });

  context.textAlign = 'left';
  context.fillStyle = theme.mut;
  context.font = '20px Georgia,"Songti SC",serif';
  context.fillText(exportText('sourceShuowen', {}, snapshot), 104, 612);
  context.fillStyle = theme.red;
  context.font = '24px Georgia,"Songti SC","Noto Serif CJK SC",serif';
  layout.constructionLines.forEach((line, index) => context.fillText(line, 128, layout.constructionTop + index * 34));
  context.fillStyle = theme.box;
  context.fillRect(104, layout.quoteTop, 872, layout.quoteHeight);
  context.fillStyle = theme.red;
  context.fillRect(104, layout.quoteTop, 4, layout.quoteHeight);
  context.fillStyle = theme.ink;
  context.font = '26px Georgia,"Songti SC","Noto Serif CJK SC",serif';
  layout.quoteLines.forEach((line, index) => context.fillText(line, 128, layout.quoteTop + 42 + index * 40));
  context.fillStyle = theme.mut;
  context.font = '19px Georgia,"Songti SC","Noto Serif CJK SC",serif';
  layout.sourceLines.forEach((line, index) => context.fillText(line, 104, layout.sourceTop + index * 28));
  context.fillStyle = theme.dim;
  context.textAlign = 'center';
  let footerY = designHeight - 80 - layout.footerHeight + 23;
  context.font = '18px Georgia,"Songti SC","Noto Serif CJK SC",serif';
  layout.brandLines.forEach(line => { context.fillText(line, 540, footerY); footerY += 27; });
  context.font = '17px Georgia,"Songti SC","Noto Serif CJK SC",serif';
  layout.attributionLines.forEach(line => { context.fillText(line, 540, footerY); footerY += 25; });
  context.restore();
  return layout;
}

async function ensureFonts(record) {
  if (!document.fonts) return;
  const requests = [];
  if (record && record.sealChar) requests.push(document.fonts.load('164px Seal', record.sealChar));
  if (record && record.oracChar) requests.push(document.fonts.load('164px Orac', record.oracChar));
  await Promise.all(requests);
  await document.fonts.ready;
}

function curData() {
  const character = typeof viewState !== 'undefined' && viewState.view === 'character' ? viewState.z : null;
  return character && lookup(character) ? character : null;
}

function saveExport(blob, filename) {
  if (!blob) throw new Error('Canvas encoding failed');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function exportFilename(character, asGif, snapshot) {
  return `${exportText('filenamePrefix', {}, snapshot)}_${character}_${snapshot.lang}.${asGif ? 'gif' : 'jpg'}`;
}

async function exportOne(character, asGif, options = {}) {
  const snapshot = exportSnapshot(options);
  const record = lookup(character, snapshot.entryId);
  if (!record) return null;
  await ensureFonts(record);
  const width = asGif ? 540 : 1080;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: asGif });
  if (!context) throw new Error('Canvas is unavailable');
  const layout = measureExportCard(context, record, snapshot);
  const height = Math.ceil(layout.height * width / 1080);
  if (height > EXPORT_MAX_HEIGHT || width * height > EXPORT_MAX_PIXELS) {
    const error = new Error('Export dimensions exceed browser limits');
    error.exportKey = 'exportTooLarge';
    throw error;
  }
  canvas.width = width;
  canvas.height = height;
  const filename = exportFilename(record.s, asGif, snapshot);
  try {
    if (!asGif) {
      drawCard(context, width, height, record, 1, -1, { ...snapshot, layout });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.93));
      saveExport(blob, filename);
    } else {
      const palette = exportPalette(snapshot);
      const frames = [];
      for (let stage = 0; stage < 4; stage++) {
        drawCard(context, width, height, record, 1, stage, { ...snapshot, layout });
        frames.push(quantize(context.getImageData(0, 0, width, height).data, width, height, palette));
        await new Promise(resolve => setTimeout(resolve, 8));
      }
      for (let repeat = 0; repeat < 3; repeat++) frames.push(frames[3]);
      const gif = encodeGIF(frames, width, height, 700, palette);
      saveExport(new Blob([gif], { type: 'image/gif' }), filename);
    }
    return record.s;
  } finally {
    // Release the pixel buffer before the next item in a batch.
    canvas.width = 1;
    canvas.height = 1;
  }
}

async function exportCurrent(asGif) {
  if (exportBusy) return;
  const snapshot = exportSnapshot();
  const character = curData();
  if (!character) {
    setExportHint('exportBatchEmpty');
    resetExportHint(4200);
    return;
  }
  lockExport(true);
  setExportHint(asGif ? 'exportGeneratingGif' : 'exportGeneratingJpg');
  try {
    const saved = await exportOne(character, asGif, snapshot);
    if (!saved) throw new Error('No Hanzi');
    setExportHint('exportSaved', { file: exportFilename(saved, asGif, snapshot) });
  } catch (error) {
    setExportHint(error.exportKey || 'exportFailed');
  } finally {
    lockExport(false);
    resetExportHint(4200);
  }
}

function exportJPG() { return exportCurrent(false); }
function exportGIF() { return exportCurrent(true); }

async function exportBatch() {
  if (exportBusy) return;
  const snapshot = exportSnapshot();
  const box = prompt(exportText('exportBatchPrompt', {}, snapshot), '日月山水火木人马车鱼');
  if (!box) return;
  const characters = [...new Set(box.match(/[\u4e00-\u9fff]/g) || [])];
  if (!characters.length) {
    setExportHint('exportBatchEmpty');
    resetExportHint(4200);
    return;
  }
  if (characters.length > EXPORT_MAX_BATCH) {
    setExportHint('exportTooMany', { max: EXPORT_MAX_BATCH });
    resetExportHint(5200);
    return;
  }
  const unsupported = characters.filter(character => !lookup(character));
  if (unsupported.length) {
    setExportHint('exportUnsupported', { characters: unsupported.join('、') });
    resetExportHint(7000);
    return;
  }
  const asGif = confirm(exportText('exportBatchFormat', { count: characters.length }, snapshot));
  lockExport(true);
  let saved = 0;
  try {
    for (let index = 0; index < characters.length; index++) {
      setExportHint('exportBatchProgress', { current: index + 1, total: characters.length, char: characters[index] });
      try {
        if (await exportOne(characters[index], asGif, snapshot)) saved++;
      } catch (error) {
        // Continue the requested batch; the final total includes failed items.
      }
      await new Promise(resolve => setTimeout(resolve, 520));
    }
    setExportHint('exportBatchDone', { ok: saved, total: characters.length });
  } finally {
    lockExport(false);
    resetExportHint(7000);
  }
}

/* GIF89a: the existing fixed-palette encoder, with a captured theme palette. */
function quantize(data, width, height, palette = exportPalette(exportSnapshot())) {
  const output = new Uint8Array(width * height);
  for (let index = 0, offset = 0; index < output.length; index++, offset += 4) {
    const red = data[offset], green = data[offset + 1], blue = data[offset + 2];
    let best = 0, distance = Infinity;
    for (let color = 0; color < palette.length; color++) {
      const target = palette[color];
      const candidate = (red - target[0]) ** 2 + (green - target[1]) ** 2 + (blue - target[2]) ** 2;
      if (candidate < distance) { distance = candidate; best = color; }
    }
    output[index] = best;
  }
  return output;
}

function gifLZW(output, pixels, minCode) {
  const clear = 1 << minCode, end = clear + 1;
  let size = minCode + 1, next = end + 1, dictionary = new Map();
  const bytes = [];
  let bitBuffer = 0, bitCount = 0;
  const emit = code => {
    bitBuffer |= code << bitCount;
    bitCount += size;
    while (bitCount >= 8) { bytes.push(bitBuffer & 255); bitBuffer >>= 8; bitCount -= 8; }
  };
  output.push(minCode);
  emit(clear);
  let current = pixels[0];
  for (let index = 1; index < pixels.length; index++) {
    const point = pixels[index], key = current * 4096 + point;
    if (dictionary.has(key)) { current = dictionary.get(key); continue; }
    emit(current);
    if (next < 4096) {
      dictionary.set(key, next++);
      if (next > (1 << size) && size < 12) size++;
    } else {
      emit(clear);
      dictionary = new Map();
      next = end + 1;
      size = minCode + 1;
    }
    current = point;
  }
  emit(current);
  emit(end);
  if (bitCount > 0) bytes.push(bitBuffer & 255);
  for (let index = 0; index < bytes.length; index += 255) {
    const chunk = bytes.slice(index, index + 255);
    output.push(chunk.length, ...chunk);
  }
  output.push(0);
}

function encodeGIF(frames, width, height, delay, palette = exportPalette(exportSnapshot())) {
  const bits = PALETTE_BITS, paletteSize = 1 << bits, output = [];
  for (const point of 'GIF89a') output.push(point.charCodeAt(0));
  output.push(width & 255, width >> 8, height & 255, height >> 8, 0xF0 | (bits - 1), 0, 0);
  for (let index = 0; index < paletteSize; index++) output.push(...(palette[index] || [0, 0, 0]));
  output.push(0x21, 0xFF, 0x0B);
  for (const point of 'NETSCAPE2.0') output.push(point.charCodeAt(0));
  output.push(3, 1, 0, 0, 0);
  for (const frame of frames) {
    output.push(0x21, 0xF9, 4, 0, delay / 10 & 255, delay / 10 >> 8, 0, 0);
    output.push(0x2C, 0, 0, 0, 0, width & 255, width >> 8, height & 255, height >> 8, 0);
    gifLZW(output, frame, bits);
  }
  output.push(0x3B);
  return new Uint8Array(output);
}
