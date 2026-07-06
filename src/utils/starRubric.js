// Shared star rubric for every arcade game. Rates PER-TARGET accuracy — not
// perfection across a whole session — so 3 stars is actually reachable by the
// target age, and both games grade on the same scale (the arcade sums stars).
// A child who achieves nothing gets ZERO stars (and therefore no collectible
// gem — rewards stay derived from real progress).
export function starRubric({ correct = 0, total = 0, mistakes = 0, deaths = 0 } = {}) {
  const c = Math.max(0, Number(correct) || 0);
  const t = Math.max(0, Number(total) || 0);
  const m = Math.max(0, Number(mistakes) || 0);
  const d = Math.max(0, Number(deaths) || 0);
  if (t === 0 || c === 0) return 0;
  const accuracy = c / t;
  const allowed = Math.max(1, Math.ceil(t / 10)); // ~1 slip per 10 targets
  if (d === 0 && accuracy >= 0.95 && m <= allowed) return 3;
  if (accuracy >= 0.70) return 2;
  return 1;
}
