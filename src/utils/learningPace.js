// Initial product tuning values, not measured classroom thresholds. Motion and
// response clocks stay separate from the time needed to inspect a learning result.
export const LEARNING_PACE = Object.freeze({ word: 1600, sentence: 2400, concept: 2000, reflection: 1200, settle: 500 });

// Skills practice has several item constructs. An instruction written as a
// sentence does not make its single-word answer a sentence-reading task.
export function practiceResultMinimum(question = {}) {
  question = question || {};
  const kind = `${question.questionType || ''} ${question.mechanicId || ''} ${question.skillId || ''} ${question.formatType || ''} ${question.templateType || ''}`;
  if (question.sentence || question.sentenceWithBlank || question.targetSentence || question.passage || /sentence|punctuation|grammar|comprehen/i.test(kind)) return LEARNING_PACE.sentence;
  if (/word|spelling|decod|blend|segment/i.test(kind)) return LEARNING_PACE.word;
  return LEARNING_PACE.concept;
}

/** A semantic result owns both a readable dwell and its actual feedback voice.
 * Pausing consumes only foreground time; replacing/cancelling the owner makes
 * old media promises harmless. Call waitFor again when replaying interrupted
 * feedback, before resume. Missing-media owners must resolve their promise. */
export function createLearningDwell({ minimumMs = LEARNING_PACE.word, settleMs = LEARNING_PACE.settle, onAdvance,
  now = () => performance.now(), schedule = (fn, ms) => setTimeout(fn, ms), clear = id => clearTimeout(id) } = {}) {
  let minimum = Math.max(0, minimumMs), settle = 0, pending = false, paused = false, cancelled = false;
  let started = now(), timer = null, generation = 0;
  const consume = () => {
    const at = now(), elapsed = paused ? 0 : Math.max(0, at - started);
    minimum = Math.max(0, minimum - elapsed);
    if (!pending) settle = Math.max(0, settle - elapsed);
    started = at;
  };
  const arm = () => {
    clear(timer); timer = null;
    if (paused || cancelled || pending) return;
    timer = schedule(() => {
      consume();
      if (minimum > 0 || settle > 0) { arm(); return; }
      cancelled = true; timer = null; onAdvance?.();
    }, Math.max(minimum, settle));
  };
  const api = {
    waitFor(promise) {
      if (cancelled) return;
      consume(); pending = true; clear(timer); timer = null;
      const ticket = ++generation;
      Promise.resolve(promise).catch(() => false).then(() => {
        if (cancelled || ticket !== generation) return;
        consume(); pending = false; settle = settleMs; arm();
      });
    },
    pause() { if (paused || cancelled) return; consume(); paused = true; clear(timer); timer = null; },
    resume() { if (!paused || cancelled) return; started = now(); paused = false; arm(); },
    cancel() { cancelled = true; generation++; clear(timer); timer = null; },
    get active() { return !cancelled; },
    get remainingMs() { consume(); return Math.max(minimum, settle); }
  };
  arm();
  return api;
}

/** Native timeout registry for games whose animation clock can be paused. */
export function createPausableTasks({ now = () => performance.now(), schedule = (fn, ms) => setTimeout(fn, ms), clear = id => clearTimeout(id) } = {}) {
  const tasks = new Set(); let paused = false;
  const arm = task => { task.started = now(); task.id = schedule(() => { tasks.delete(task); task.fn(); }, task.remaining); };
  return {
    schedule(fn, ms) { const task = { fn, remaining: ms, started: now(), id: null }; tasks.add(task); if (!paused) arm(task); return task; },
    pause() { if (paused) return; paused = true; for (const task of tasks) { task.remaining = Math.max(0, task.remaining - (now() - task.started)); clear(task.id); task.id = null; } },
    resume() { if (!paused) return; paused = false; for (const task of tasks) arm(task); },
    cancel() { for (const task of tasks) clear(task.id); tasks.clear(); }
  };
}
