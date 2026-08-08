export function normalizeSoundKeyEvent(event = {}) {
  const note = Number(event.note);
  const velocity = Number(event.velocity ?? 100);
  if (!Number.isFinite(note) || event.type === "noteOff" || velocity <= 0) return null;
  return { note, velocity, type: "noteOn" };
}

export function resolveTokenForNote(note, mapping) {
  return String(mapping?.[String(note)] || "").trim().toLowerCase() || null;
}

export function appendToken(tokens, token, targetLength = Infinity) {
  if (!token || tokens.length >= targetLength) return tokens;
  return [...tokens, token];
}

export function isMissingSoundCorrect(tokens, target, missingIndex) {
  return String(tokens[0] || "").toLowerCase() === String(target?.tokens?.[missingIndex] || "").toLowerCase();
}

