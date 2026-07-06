// Shared "catch-up" queue for every LiteracyPath game.
//
// The child works through a level's targets in order. If they MISS a target
// (e.g. grab the wrong letter while spelling a word), that target is requeued
// and returns a few steps later so they can recover it. The level only
// finishes once every target — including recovered ones — has been completed.
//
// DOM-free + deterministic, so it is unit-testable.
export function makeCatchUp(targets, { requeueGap = 3 } = {}) {
  const items = (targets || []).map((value, id) => ({ value, id }));
  const requiredIds = new Set(items.map(it => it.id));
  const doneIds = new Set();
  let queue = items.slice();

  return {
    get remaining() { return queue.length; },
    get total() { return requiredIds.size; },
    get completed() { return doneIds.size; },
    get isDone() { return doneIds.size >= requiredIds.size; },

    // The target currently on screen (null once the level is finished).
    peek() { return queue.length ? queue[0].value : null; },

    // Child got it: drop it from the queue and mark it complete.
    complete() {
      const cur = queue.shift();
      if (cur) doneIds.add(cur.id);
      return this.isDone;
    },

    // Child missed it: move it back `requeueGap` places (or to the end when
    // the queue is short) so it comes back later rather than immediately.
    miss() {
      const cur = queue.shift();
      if (!cur) return null;
      const at = Math.min(requeueGap, queue.length);
      queue.splice(at, 0, cur);
      return cur.value;
    }
  };
}
