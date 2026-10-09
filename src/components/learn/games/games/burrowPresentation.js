// Garden growth replaces block objects, but doesn't change the construction.
// Avoid serializing the full build on every movement/render frame.
export function burrowStructureChanged(previous, next) {
  if (previous === next) return false;
  if (!previous || previous.length !== next.length) return true;
  return next.some((block, index) => {
    const old = previous[index];
    return block !== old && ['x', 'y', 'z', 'type', 'rotation'].some(key => block[key] !== old[key]);
  });
}
