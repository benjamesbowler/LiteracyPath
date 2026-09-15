import { parseChapter } from './progress.js';

export function readChapterSave(key, getStorage = () => globalThis.localStorage) {
  try { return parseChapter(getStorage().getItem(key)); }
  catch { return null; }
}

export function writeChapterSave(key, progress, getStorage = () => globalThis.localStorage) {
  try { getStorage().setItem(key, JSON.stringify(progress)); return true; }
  catch { return false; }
}
