export const deletedMediaManifest = [
];

const STORAGE_KEY = "lpDeletedMediaManifest";

function normalizePath(filePath = "") {
  return String(filePath || "").trim();
}

function readLocalDeletedMedia() {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalDeletedMedia(records = []) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function readDeletedMediaManifest() {
  const byKey = new Map();
  [...deletedMediaManifest, ...readLocalDeletedMedia()].forEach(record => {
    const key = [
      normalizePath(record.path),
      record.assetType || "",
      record.bookId || "",
      record.pageNumber || ""
    ].join("::");
    if (key.trim()) byKey.set(key, record);
  });
  return [...byKey.values()];
}

export function addDeletedMediaRecords(records = []) {
  if (!records.length) return readLocalDeletedMedia();
  const existing = readLocalDeletedMedia();
  const next = [
    ...existing,
    ...records.map(record => ({
      deletedAt: new Date().toISOString(),
      deletedBy: "admin",
      replacementNeeded: true,
      ...record,
      path: normalizePath(record.path)
    }))
  ];
  writeLocalDeletedMedia(next);
  return next;
}

export function getDeletedMediaPaths() {
  return new Set(readDeletedMediaManifest().map(record => normalizePath(record.path)).filter(Boolean));
}

export function isMediaDeleted(filePath = "") {
  const path = normalizePath(filePath);
  return Boolean(path && getDeletedMediaPaths().has(path));
}

export function isGuidedReadingBookDeleted(bookId = "") {
  const id = String(bookId || "");
  return readDeletedMediaManifest().some(record =>
    record.assetType === "guided-reading-book" &&
    record.bookId === id
  );
}

export function isGuidedReadingAssetDeleted({ bookId = "", path = "", pageNumber = null } = {}) {
  const normalizedPath = normalizePath(path);
  return readDeletedMediaManifest().some(record => {
    if (record.assetType === "guided-reading-book" && record.bookId === bookId) return true;
    if (normalizedPath && normalizePath(record.path) === normalizedPath) return true;
    if (
      record.assetType === "guided-reading-page" &&
      record.bookId === bookId &&
      pageNumber !== null &&
      Number(record.pageNumber) === Number(pageNumber)
    ) return true;
    return false;
  });
}
