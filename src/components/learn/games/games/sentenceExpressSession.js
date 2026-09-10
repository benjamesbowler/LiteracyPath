export const expressSessionKey = (scope, difficulty) => `literacy-guide-sentence-express:${scope}:${difficulty}`;
export function loadExpressSnapshot(key, level) {
  if (!key) return null;
  try { const saved = JSON.parse(localStorage.getItem(key) || 'null'); return saved?.v === 1 && saved.levelIndex === Number(level) ? saved : null; } catch { return null; }
}
export function saveExpressSnapshot(key, snapshot) {
  if (!key) return;
  try { if (snapshot) localStorage.setItem(key, JSON.stringify({ ...snapshot, v: 1 })); else localStorage.removeItem(key); } catch { /* Storage failure never prevents play. */ }
}
