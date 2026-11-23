import { parseChapter } from './progress.js';

export function readChapterSave(key, getStorage = () => globalThis.localStorage) {
  return readChapterSaveResult(key, getStorage).progress;
}

export function readChapterSaveResult(key, getStorage = () => globalThis.localStorage) {
  try {
    const raw = getStorage().getItem(key);
    if (raw === null) return { status: 'fresh', progress: null };
    const progress = parseChapter(raw);
    if (progress) return { status: 'loaded', progress };
  } catch { /* The scoped save is unavailable. */ }
  return { status: 'unavailable', progress: null };
}

export function writeChapterSave(key, progress, getStorage = () => globalThis.localStorage) {
  try { getStorage().setItem(key, JSON.stringify(progress)); return true; }
  catch { return false; }
}
