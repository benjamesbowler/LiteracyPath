export function mockResponseValue(item, selection) {
  if (item.format === 'build_word') return selection.map(id => item.choices.find(choice => choice.id === id)?.label || '').join('');
  return ['choice', 'select_text'].includes(item.format) ? selection[0] : selection;
}
export function mockConstructionLength(item) {
  if (item.format === 'order') return item.sequenceLength || item.choices.length;
  if (item.format !== 'build_word') return 0;
  if (Number.isInteger(item.responseLength) && item.responseLength > 0) return item.responseLength;
  // Count authored tiles, not letters: c + l + o + ck occupies four spaces.
  const answer = String(item.answer || '').toLowerCase();
  const tiles = item.choices.map(choice => String(choice.label || '').toLowerCase());
  function count(offset, used) {
    if (offset === answer.length) return 0;
    let best = Infinity;
    tiles.forEach((tile, index) => {
      if (tile && !used.has(index) && answer.startsWith(tile, offset)) {
        const next = new Set(used); next.add(index);
        best = Math.min(best, 1 + count(offset + tile.length, next));
      }
    });
    return best;
  }
  const length = count(0, new Set());
  return Number.isFinite(length) && length > 0 ? length : item.choices.length;
}
export function mockResponseComplete(item, selection) {
  if (['choice', 'select_text'].includes(item.format)) return selection.length === 1;
  if (item.format === 'multi_select') return selection.length === item.selectCount;
  if (item.format === 'match') return selection.length === item.matchTargets.length && selection.every(Boolean);
  if (['order', 'build_word'].includes(item.format)) return selection.length === mockConstructionLength(item);
  return false;
}
