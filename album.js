// Fill these two in after creating your Supabase project (see SETUP.md).
// The anon key is meant to be public; the bucket policies limit what it can do.
// Until they are filled in, the album is a preview that only keeps
// what is added in this browser.
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

import { createSupabaseSource, createDemoSource } from './album-sources.js?v=5';
import { renderMagazine } from './album-magazine.js?v=3';
import { createViewer } from './album-viewer.js';

const { t, tn, onChange } = window.I18N;

const byId = (id) => document.getElementById(id);
const els = {
  file: byId('file'),
  pick: byId('pick'),
  status: byId('status'),
  progress: byId('progress'),
  bar: byId('bar'),
  magazine: byId('magazine'),
  setup: byId('setup'),
  slideshow: byId('slideshow'),
  drop: byId('drop'),
};

const state = { items: [], signature: '', status: null };

const viewer = createViewer({
  lightbox: byId('lightbox'),
  big: byId('big'),
  video: byId('big-video'),
  close: byId('close'),
  prev: byId('prev'),
  next: byId('next'),
  download: byId('download'),
  position: byId('position'),
}, () => state.items);

// Stores how to build the message so it can be redrawn when the language changes.
function setStatus(render, isError = false) {
  state.status = { render, isError };
  els.status.textContent = render();
  els.status.classList.toggle('error', isError);
}

function setProgress(fraction) {
  els.progress.hidden = fraction === null;
  els.bar.style.transform = `scaleX(${fraction ?? 0})`;
}

function showQr() {
  if (typeof QRCode === 'undefined') return;
  new QRCode(byId('qrcode'), { text: window.location.href.split('#')[0], width: 160, height: 160 });
}

function isConfigured() {
  return !SUPABASE_URL.startsWith('YOUR_') && !SUPABASE_ANON_KEY.startsWith('YOUR_');
}

function render() {
  renderMagazine(els.magazine, state.items, { t, tn, onOpen: viewer.open });
  els.slideshow.disabled = state.items.length === 0;
}

async function refresh(source) {
  try {
    const items = await source.list();
    const signature = items.map((item) => item.name).join('|');
    if (signature === state.signature) return;
    const showing = viewer.currentName();
    state.items = items;
    state.signature = signature;
    render();
    viewer.itemsChanged(showing);
  } catch (err) {
    console.error('Could not load the album', err);
    setStatus(() => t('album.loadError'), true);
  }
}

async function uploadFiles(source, files) {
  const list = [...files];
  if (list.length === 0) return;

  els.pick.disabled = true;
  let done = 0;
  let failed = 0;
  setProgress(0);

  for (const file of list) {
    const i = done + failed + 1;
    setStatus(() => t('album.uploading', { i, total: list.length }));
    let ok = false;
    try {
      ok = await source.upload(file);
    } catch (err) {
      console.error('Upload failed', err);
    }
    if (ok) done += 1;
    else failed += 1;
    setProgress((done + failed) / list.length);
    if (ok) await refresh(source);
  }

  els.pick.disabled = false;
  els.file.value = '';
  setProgress(null);
  if (failed > 0) setStatus(() => t('album.partial', { done, failed }), true);
  else setStatus(() => tn('album.thanks', done));
}

function bindDragDrop(source) {
  let depth = 0;
  document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    depth += 1;
    els.drop.hidden = false;
  });
  document.addEventListener('dragleave', () => {
    depth = Math.max(0, depth - 1);
    if (depth === 0) els.drop.hidden = true;
  });
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    depth = 0;
    els.drop.hidden = true;
    if (!els.pick.disabled) uploadFiles(source, e.dataTransfer.files);
  });
}

function init() {
  showQr();
  onChange(() => {
    render();
    if (state.status) els.status.textContent = state.status.render();
  });

  const source = isConfigured()
    ? createSupabaseSource(window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY))
    : createDemoSource();
  els.setup.hidden = !source.isDemo;

  els.pick.addEventListener('click', () => els.file.click());
  els.file.addEventListener('change', () => uploadFiles(source, els.file.files));
  els.slideshow.addEventListener('click', viewer.startSlideshow);
  bindDragDrop(source);

  render();
  refresh(source);
}

init();
