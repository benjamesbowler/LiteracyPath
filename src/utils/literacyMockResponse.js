export function mockResponseValue(item, selection) {
  if (item.format === 'build_word') return selection.map(id => item.choices.find(choice => choice.id === id)?.label || '').join('');
  return ['choice', 'select_text'].includes(item.format) ? selection[0] : selection;
}
export function mockResponseComplete(item, selection) {
  if (['choice', 'select_text'].includes(item.format)) return selection.length === 1;
  if (item.format === 'multi_select') return selection.length === item.selectCount;
  if (item.format === 'match') return selection.length === item.matchTargets.length && selection.every(Boolean);
  if (item.format === 'order') return selection.length === (item.sequenceLength || item.choices.length);
  return selection.length > 0;
}
