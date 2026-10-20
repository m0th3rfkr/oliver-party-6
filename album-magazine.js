// Lays the album out as a magazine: a cover (newest photo) and inside pages,
// two pages per spread, each with a headline, a photo layout and pup stickers.

const PER_PAGE = 5;
const HEADLINE_COUNT = 6;

// Each page uses one of these shapes per item, on a 2-column grid.
// big = 2x2, wide = 2x1, tall = 1x2, small = 1x1. Each layout fills a 2x4 rectangle exactly,
// so the two pages of a spread come out the same height.
const LAYOUTS = [
  ['big', 'small', 'small', 'small', 'small'],
  ['wide', 'tall', 'small', 'small', 'wide'],
  ['small', 'small', 'big', 'small', 'small'],
];
const SHORT_LAYOUTS = {
  1: ['big'],
  2: ['wide', 'wide'],
  3: ['big', 'small', 'small'],
  4: ['wide', 'small', 'small', 'wide'],
};

// Decorations. Add more Paw Patrol images to img/ and list them here.
export const STICKERS = [
  'img/pup-marshall.png',
  'img/pup-chase.png',
  'img/pup-rubble.png',
  'img/pup-rocky.png',
  'img/pup-zuma.png',
  'img/pup-rex.png',
];
const COVER_STICKER = 'img/marshall.png';
const COVER_LOGO = 'img/paw-patrol-logo.png';
const EMPTY_COVER = 'img/pups-group.png';

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function textEl(tag, className, text) {
  const node = el(tag, className);
  node.textContent = text;
  return node;
}

function decorImg(src, className) {
  const img = el('img', className, { src, alt: '', 'aria-hidden': 'true', loading: 'lazy' });
  return img;
}

function videoEl(item) {
  // #t=0.1 makes most browsers show the first frame instead of a black box
  const video = el('video', 'media', { preload: 'metadata', 'aria-hidden': 'true' });
  video.muted = true;
  video.playsInline = true;
  video.src = `${item.full}#t=0.1`;
  video.addEventListener('loadeddata', () => video.closest('.shot, .cover')?.classList.add('loaded'), { once: true });
  return video;
}

// A thumbnail for a photo or video, falling back gracefully when the thumb is missing.
// The cover is big, so it asks for the full photo instead of the thumbnail.
function mediaEl(item, t, { preferFull = false } = {}) {
  if (item.kind === 'video' && !item.thumb) return videoEl(item);
  const img = el('img', 'media', { alt: t(item.kind === 'video' ? 'album.videoLabel' : 'album.photoAlt'), loading: 'lazy', decoding: 'async' });
  img.addEventListener('load', () => img.closest('.shot, .cover')?.classList.add('loaded'));
  img.addEventListener('error', () => {
    if (item.kind === 'video') img.replaceWith(videoEl(item));
    else if (img.src !== item.full) img.src = item.full;
  }, { once: true });
  img.src = (preferFull && item.kind === 'photo') ? item.full : (item.thumb || item.full);
  return img;
}

function shotButton(item, index, shape, t, onOpen) {
  const button = el('button', `shot shape-${shape}`, { type: 'button', 'aria-label': `${t('album.open')}: ${t(item.kind === 'video' ? 'album.videoLabel' : 'album.photoAlt')}` });
  button.append(mediaEl(item, t));
  if (item.kind === 'video') button.append(textEl('span', 'play', '▶'));
  button.addEventListener('click', () => onOpen(index));
  return button;
}

function renderCover(items, t, tn, onOpen) {
  const cover = el('article', 'cover');
  const featured = items.find((item) => item.kind === 'photo') || items[0];

  if (featured) {
    cover.append(mediaEl(featured, t, { preferFull: true }));
    const open = el('button', 'cover-open', { type: 'button', 'aria-label': `${t('album.open')}: ${t('album.photoAlt')}` });
    open.addEventListener('click', () => onOpen(items.indexOf(featured)));
    cover.append(open);
  } else {
    cover.classList.add('is-empty', 'loaded');
    cover.append(decorImg(EMPTY_COVER, 'cover-empty-art'));
  }

  const top = el('div', 'cover-top');
  top.append(decorImg(COVER_LOGO, 'cover-logo'), textEl('p', 'cover-kicker', t('album.coverKicker')));
  const bottom = el('div', 'cover-bottom');
  bottom.append(
    textEl('h2', 'cover-title', t('album.coverTitle')),
    textEl('p', 'cover-date', t('album.coverDate')),
    textEl('p', 'cover-count', items.length ? tn('album.items', items.length) : t('album.coverEmpty')),
  );
  cover.append(top, bottom, decorImg(COVER_STICKER, 'cover-sticker'));
  return cover;
}

function renderPage(pageItems, startIndex, pageNumber, t, onOpen) {
  const shapes = pageItems.length < PER_PAGE ? SHORT_LAYOUTS[pageItems.length] : LAYOUTS[(pageNumber - 2) % LAYOUTS.length];
  const page = el('article', 'page');

  const head = el('header', 'page-head');
  head.append(textEl('h3', 'page-title', t(`album.headline.${(pageNumber - 2) % HEADLINE_COUNT}`)));

  const grid = el('div', 'page-grid');
  pageItems.forEach((item, i) => grid.append(shotButton(item, startIndex + i, shapes[i], t, onOpen)));

  const foot = el('footer', 'page-foot');
  foot.append(textEl('span', '', t('album.pageFooter')), textEl('span', 'page-number', t('album.page', { n: pageNumber })));

  const stickerA = STICKERS[(pageNumber * 2) % STICKERS.length];
  const stickerB = STICKERS[(pageNumber * 2 + 3) % STICKERS.length];
  page.append(head, grid, foot, decorImg(stickerA, 'sticker sticker-a'), decorImg(stickerB, 'sticker sticker-b'));
  return page;
}

export function renderMagazine(container, items, { t, tn, onOpen }) {
  const pages = [];
  for (let start = 0; start < items.length; start += PER_PAGE) {
    pages.push(renderPage(items.slice(start, start + PER_PAGE), start, pages.length + 2, t, onOpen));
  }

  const spreads = [];
  for (let i = 0; i < pages.length; i += 2) {
    const spread = el('div', 'spread');
    spread.append(...pages.slice(i, i + 2));
    spreads.push(spread);
  }

  container.replaceChildren(renderCover(items, t, tn, onOpen), ...spreads);
}
