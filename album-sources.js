// Where album items come from. Both sources return items shaped like:
//   { name, kind: 'photo' | 'video', full, save, thumb }   (thumb may be null)
// createSupabaseSource is the real album; createDemoSource is the preview shown
// before Supabase is connected (only what was added in this browser).
// In the real album each guest only sees what they uploaded.

const BUCKET = 'party-photos';
const THUMB_DIR = 'thumbs';
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // Supabase free tier per-file limit
const FULL_EDGE = 2400;
const THUMB_EDGE = 600;
const FULL_QUALITY = 0.88;
const THUMB_QUALITY = 0.8;
const LIST_LIMIT = 500;
const POSTER_TIMEOUT_MS = 8000;
const SIGNED_URL_SECONDS = 24 * 60 * 60; // links to private files stop working after a day

const VIDEO_NAME = /\.(mp4|mov|m4v|webm)$/i;
const VIDEO_EXT_BY_TYPE = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm', 'video/x-m4v': 'm4v' };

function isVideoFile(file) {
  return file.type.startsWith('video/') || VIDEO_NAME.test(file.name);
}

function isImageFile(file) {
  return file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name);
}

function newBaseName() {
  const random = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${random}`;
}

// ---------- Media processing (runs on the guest's phone) ----------

async function decode(file) {
  if ('createImageBitmap' in window) {
    // imageOrientation fixes sideways phone photos (EXIF rotation)
    return createImageBitmap(file, { imageOrientation: 'from-image' });
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toJpeg(source, width, height, maxEdge, quality) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Encode failed'))), 'image/jpeg', quality);
  });
}

// Returns { full, thumb, ext }. If the browser cannot decode the format
// (e.g. HEIC on Android Chrome), uploads the original with no thumbnail.
async function preparePhoto(file) {
  try {
    const bitmap = await decode(file);
    const [full, thumb] = await Promise.all([
      toJpeg(bitmap, bitmap.width, bitmap.height, FULL_EDGE, FULL_QUALITY),
      toJpeg(bitmap, bitmap.width, bitmap.height, THUMB_EDGE, THUMB_QUALITY),
    ]);
    if (bitmap.close) bitmap.close();
    return { full, thumb, ext: 'jpg' };
  } catch (err) {
    console.warn('Could not process image, uploading original', err);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
    return { full: file, thumb: null, ext };
  }
}

function waitFor(target, event) {
  return new Promise((resolve, reject) => {
    target.addEventListener(event, resolve, { once: true });
    target.addEventListener('error', () => reject(new Error(`Video ${event} failed`)), { once: true });
  });
}

// Grabs a frame near the start of the video to use as its thumbnail.
// Returns null when the browser can't play the format (e.g. some .mov files).
async function videoPoster(file) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), POSTER_TIMEOUT_MS));
  const grab = (async () => {
    await waitFor(video, 'loadeddata');
    video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    await waitFor(video, 'seeked');
    return toJpeg(video, video.videoWidth, video.videoHeight, THUMB_EDGE, THUMB_QUALITY);
  })();
  try {
    return await Promise.race([grab, timeout]);
  } catch (err) {
    console.warn('Could not make a video thumbnail', err);
    return null;
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}

function videoExt(file) {
  const fromName = (file.name.match(VIDEO_NAME) || [])[1];
  return (fromName || VIDEO_EXT_BY_TYPE[file.type] || 'mp4').toLowerCase();
}

// ---------- Supabase (the real album) ----------

// Each browser signs in as its own anonymous guest and keeps its files in a
// folder named after that guest. The bucket is private and the storage
// policies only let a guest read their own folder (see SETUP.md).
export function createSupabaseSource(client) {
  const store = client.storage.from(BUCKET);
  let guestIdPromise = null;

  async function signIn() {
    const { data } = await client.auth.getSession();
    if (data.session) return data.session.user.id;
    const { data: created, error } = await client.auth.signInAnonymously();
    if (error) throw error;
    return created.user.id;
  }

  function guestId() {
    if (!guestIdPromise) {
      guestIdPromise = signIn().catch((err) => {
        guestIdPromise = null; // try again on the next call
        throw err;
      });
    }
    return guestIdPromise;
  }

  const thumbPath = (folder, name) => `${folder}/${THUMB_DIR}/${name.replace(/\.[^.]+$/, '')}.jpg`;

  async function list() {
    const folder = await guestId();
    const { data, error } = await store.list(folder, {
      limit: LIST_LIMIT,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) throw error;
    // Folders (like thumbs/) come back with a null id
    const names = data
      .filter((entry) => entry.id && entry.name && !entry.name.startsWith('.'))
      .map((entry) => entry.name);
    if (names.length === 0) return [];

    const paths = [...names.map((name) => `${folder}/${name}`), ...names.map((name) => thumbPath(folder, name))];
    const { data: signed, error: signError } = await store.createSignedUrls(paths, SIGNED_URL_SECONDS);
    if (signError) throw signError;
    // Missing thumbnails come back with an error instead of a URL
    const urlFor = new Map(signed.filter((entry) => entry.signedUrl).map((entry) => [entry.path, entry.signedUrl]));

    return names
      .filter((name) => urlFor.has(`${folder}/${name}`))
      .map((name) => {
        const full = urlFor.get(`${folder}/${name}`);
        return {
          name,
          kind: VIDEO_NAME.test(name) ? 'video' : 'photo',
          full,
          save: `${full}&download=${encodeURIComponent(`oliver-party-${name}`)}`,
          thumb: urlFor.get(thumbPath(folder, name)) ?? null,
        };
      });
  }

  async function put(path, body, contentType) {
    const { error } = await store.upload(path, body, { contentType, upsert: false });
    if (error) console.error(`Upload failed: ${path}`, error);
    return !error;
  }

  async function upload(file) {
    const folder = await guestId();
    const base = newBaseName();
    if (isVideoFile(file)) {
      if (file.size > MAX_VIDEO_BYTES) return false;
      const poster = await videoPoster(file);
      if (poster) await put(thumbPath(folder, base), poster, 'image/jpeg');
      return put(`${folder}/${base}.${videoExt(file)}`, file, file.type || 'video/mp4');
    }
    if (!isImageFile(file)) return false;
    const { full, thumb, ext } = await preparePhoto(file);
    if (full.size > MAX_PHOTO_BYTES) return false;
    if (thumb) await put(thumbPath(folder, base), thumb, 'image/jpeg');
    return put(`${folder}/${base}.${ext}`, full, full.type || 'image/jpeg');
  }

  return { list, upload, isDemo: false };
}

// ---------- Preview (no Supabase yet) ----------

export function createDemoSource() {
  let local = [];

  async function list() {
    return local;
  }

  // Keeps the file in this browser only, so people can see how their own photos look.
  async function upload(file) {
    const isVideo = isVideoFile(file);
    if (!isVideo && !isImageFile(file)) return false;
    const url = URL.createObjectURL(file);
    const item = { name: `local-${newBaseName()}`, kind: isVideo ? 'video' : 'photo', full: url, save: url, thumb: isVideo ? null : url };
    local = [item, ...local];
    return true;
  }

  return { list, upload, isDemo: true };
}
