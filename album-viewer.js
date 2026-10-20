// Full-screen viewer for photos and videos, with swipe, keys and a slideshow.

const SLIDE_MS = 5000;
const MAX_VIDEO_SLIDE_MS = 60000;
const SWIPE_PX = 50;

export function createViewer(els, getItems) {
  const state = { index: -1, playing: false, timer: null };

  function stopVideo() {
    els.video.onended = null;
    els.video.pause();
    els.video.removeAttribute('src');
    els.video.load();
  }

  function scheduleNext(item) {
    clearTimeout(state.timer);
    if (!state.playing) return;
    const next = () => show(state.index + 1);
    if (item.kind === 'video') {
      els.video.onended = next;
      state.timer = setTimeout(next, MAX_VIDEO_SLIDE_MS);
    } else {
      state.timer = setTimeout(next, SLIDE_MS);
    }
  }

  function show(index) {
    const items = getItems();
    const total = items.length;
    if (total === 0) return;
    state.index = (index + total) % total;
    const item = items[state.index];

    if (item.kind === 'video') {
      els.big.hidden = true;
      els.big.removeAttribute('src');
      els.video.hidden = false;
      els.video.src = item.full;
      els.video.play().catch(() => {}); // autoplay can be blocked; controls are still there
    } else {
      stopVideo();
      els.video.hidden = true;
      els.big.hidden = false;
      els.big.src = item.full;
      // Warm the cache for the next photo so swiping feels instant
      const ahead = items[(state.index + 1) % total];
      if (ahead && ahead.kind === 'photo') new Image().src = ahead.full;
    }
    els.download.href = item.save;
    els.position.textContent = `${state.index + 1} / ${total}`;
    scheduleNext(item);
  }

  function open(index) {
    if (index < 0) return;
    els.lightbox.hidden = false;
    document.body.classList.add('noscroll');
    show(index);
    els.close.focus();
  }

  function stopSlideshow() {
    state.playing = false;
    clearTimeout(state.timer);
    els.video.onended = null;
    els.lightbox.classList.remove('playing');
  }

  function close() {
    stopSlideshow();
    stopVideo();
    els.lightbox.hidden = true;
    els.big.removeAttribute('src');
    document.body.classList.remove('noscroll');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  function startSlideshow() {
    state.playing = true;
    els.lightbox.classList.add('playing');
    if (els.lightbox.requestFullscreen) els.lightbox.requestFullscreen().catch(() => {});
    open(0);
  }

  function step(delta) {
    stopSlideshow();
    show(state.index + delta);
  }

  // Keeps the same photo on screen when new uploads shift the list.
  function itemsChanged(previousName) {
    if (els.lightbox.hidden || !previousName) return;
    const index = getItems().findIndex((item) => item.name === previousName);
    if (index >= 0) {
      state.index = index;
      els.position.textContent = `${index + 1} / ${getItems().length}`;
    }
  }

  function currentName() {
    return getItems()[state.index]?.name ?? null;
  }

  function bind() {
    els.close.addEventListener('click', close);
    els.prev.addEventListener('click', () => step(-1));
    els.next.addEventListener('click', () => step(1));
    els.lightbox.addEventListener('click', (e) => {
      if (e.target === els.lightbox) close();
    });
    document.addEventListener('keydown', (e) => {
      if (els.lightbox.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });

    let startX = null;
    els.lightbox.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    els.lightbox.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > SWIPE_PX) step(dx < 0 ? 1 : -1);
    });
  }

  bind();
  return { open, startSlideshow, itemsChanged, currentName };
}
