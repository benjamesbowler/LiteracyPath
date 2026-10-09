// One whole response. Sequence and matching keys keep order; sets do not.
export function mapPracticeResponse(question, slots) {
  const options = question.answerOptions || [];
  if (question.mapInteraction === 'build_word') return slots.map(id => options.find(option => option.value === id)?.label || '').join('').toLowerCase();
  return JSON.stringify(slots);
}
export function placeMapTile(slots, id, target, count) {
  if (!id || !Number.isInteger(target) || target < 0 || target >= count) return slots;
  const next = Array.from({ length: count }, (_, i) => slots[i] || '');
  const origin = next.indexOf(id), displaced = next[target];
  if (origin === target) return next;
  if (origin >= 0) next[origin] = displaced;
  next[target] = id;
  return next;
}
export function mapPracticeAnswerLabel(value, snapshot = {}) {
  if (value == null || !snapshot.mapInteraction) return value;
  const label = id => (snapshot.choices || snapshot.answerOptions || []).find(option => (option.value ?? option.id) === id)?.label || id;
  if (['order', 'match'].includes(snapshot.mapInteraction)) {
    try {
      const ids = JSON.parse(value);
      if (!Array.isArray(ids)) return value;
      return ids.map((id, i) => snapshot.mapInteraction === 'match' ? (snapshot.mapTargets?.[i]?.label || 'Space ' + (i + 1)) + ' → ' + label(id) : label(id)).join(snapshot.mapInteraction === 'match' ? '; ' : ' → ');
    } catch { return value; }
  }
  return snapshot.mapInteraction === 'build_word' ? value : label(value);
}
