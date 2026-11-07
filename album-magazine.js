// Lays the album out as a magazine: a cover (the party invitation) and inside pages,
// two pages per spread, each with a headline, a photo layout and pup stickers.

const PER_PAGE = 5;
const HEADLINE_COUNT = 6;

// Each frame takes its photo's real shape so nothing gets cropped:
// wide photos (16:9) span both columns, tall or square ones (9:16, 3:4, 1:1) take one column
// and pair up side by side. A tall photo left without a partner is centered on its own row.
const WIDE_RATIO = 1.1;

// Decorations. Add more Paw Patrol images to img/ and list them here.
export const STICKERS = [
  'img/pup-marshall.png',
  'img/pup-chase.png',
  'img/pup-rubble.png',
  'img/pup-rocky.png',
  'img/pup-zuma.png',
  'img/pup-rex.png',
];
const COVER_IMAGE = 'img/cover-invitation.jpg';

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

// Gives the frame the photo's aspect ratio and re-pairs the tall photos on its page.
function fitShot(media, width, height) {
  const shot = media.closest('.shot');
  if (!shot || !width || !height) return;
  shot.style.setProperty('--ratio', `${width} / ${height}`);
  shot.classList.toggle('is-wide', width / height > WIDE_RATIO);
  const narrow = [...shot.parentElement.children].filter((node) => !node.classList.contains('is-wide'));
  narrow.forEach((node, i) => node.classList.toggle('is-solo', narrow.length % 2 === 1 && i === narrow.length - 1));
}

function videoEl(item) {
  // #t=0.1 makes most browsers show the first frame instead of a black box
  const video = el('video', 'media', { preload: 'metadata', 'aria-hidden': 'true' });
  video.muted = true;
  video.playsInline = true;
  video.src = `${item.full}#t=0.1`;
  video.addEventListener('loadeddata', () => {
    fitShot(video, video.videoWidth, video.videoHeight);
    video.closest('.shot, .cover')?.classList.add('loaded');
  }, { once: true });
  return video;
}

// A thumbnail for a photo or video, falling back gracefully when the thumb is missing.
// The cover is big, so it asks for the full photo instead of the thumbnail.
function mediaEl(item, t, { preferFull = false } = {}) {
  if (item.kind === 'video' && !item.thumb) return videoEl(item);
  const img = el('img', 'media', { alt: t(item.kind === 'video' ? 'album.videoLabel' : 'album.photoAlt'), loading: 'lazy', decoding: 'async' });
  img.addEventListener('load', () => {
    fitShot(img, img.naturalWidth, img.naturalHeight);
    img.closest('.shot, .cover')?.classList.add('loaded');
  });
  img.addEventListener('error', () => {
    if (item.kind === 'video') img.replaceWith(videoEl(item));
    else if (img.src !== item.full) img.src = item.full;
  }, { once: true });
  img.src = (preferFull && item.kind === 'photo') ? item.full : (item.thumb || item.full);
  return img;
}

function shotButton(item, index, t, onOpen) {
  const button = el('button', 'shot', { type: 'button', 'aria-label': `${t('album.open')}: ${t(item.kind === 'video' ? 'album.videoLabel' : 'album.photoAlt')}` });
  button.append(mediaEl(item, t));
  if (item.kind === 'video') button.append(textEl('span', 'play', '▶'));
  button.addEventListener('click', () => onOpen(index));
  return button;
}

function renderCover(t) {
  const cover = el('article', 'cover');
  cover.append(el('img', 'cover-art', { src: COVER_IMAGE, alt: t('album.coverAlt'), width: 937, height: 1679 }));
  return cover;
}

function renderPage(pageItems, startIndex, pageNumber, t, onOpen) {
  const page = el('article', 'page');

  const head = el('header', 'page-head');
  head.append(textEl('h3', 'page-title', t(`album.headline.${(pageNumber - 2) % HEADLINE_COUNT}`)));

  const grid = el('div', 'page-grid');
  pageItems.forEach((item, i) => grid.append(shotButton(item, startIndex + i, t, onOpen)));

  const foot = el('footer', 'page-foot');
  foot.append(textEl('span', '', t('album.pageFooter')), textEl('span', 'page-number', t('album.page', { n: pageNumber })));

  const stickerA = STICKERS[(pageNumber * 2) % STICKERS.length];
  const stickerB = STICKERS[(pageNumber * 2 + 3) % STICKERS.length];
  page.append(head, grid, foot, decorImg(stickerA, 'sticker sticker-a'), decorImg(stickerB, 'sticker sticker-b'));
  return page;
}

export function renderMagazine(container, items, { t, onOpen }) {
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

  container.replaceChildren(renderCover(t), ...spreads);
}
