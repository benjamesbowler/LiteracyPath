import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';

const flush = () => new Promise(resolve => setImmediate(resolve));

async function withMedia(run) {
  const original = { Image: globalThis.Image, Audio: globalThis.Audio, window: globalThis.window };
  const images = [];
  const audio = [];
  class ImageDouble {
    constructor() { images.push(this); }
    decode() { return Promise.resolve(); }
  }
  class AudioDouble extends EventTarget {
    constructor() { super(); audio.push(this); this.src = ''; this.readyState = 0; }
    load() {}
    pause() {}
    removeAttribute(name) { if (name === 'src') this.src = ''; }
  }
  globalThis.Image = ImageDouble;
  globalThis.Audio = AudioDouble;
  globalThis.window = { setTimeout, clearTimeout };
  const media = await import(`../../src/utils/preloadQuestionMedia.js?scheduling=${Date.now()}-${Math.random()}`);
  const prefix = `/scheduling-${Math.random()}`;
  const question = index => ({ id: `${prefix}-${index}`, image: `${prefix}-${index}.webp`, audio: `${prefix}-${index}.mp3` });
  const settle = async () => {
    images.forEach(image => image.onload?.());
    audio.forEach(element => element.dispatchEvent(new Event('canplay')));
    await flush();
  };
  try { await run({ ...media, images, audio, question, settle }); }
  finally {
    for (let index = 0; index < 4; index += 1) await settle();
    Object.assign(globalThis, original);
  }
}

test('the current question finishes warming before either future question starts', () => withMedia(async ({ preloadQuestionMediaBatch, images, audio, question, settle }) => {
  const questions = [question(0), question(1), question(2)];
  const done = preloadQuestionMediaBatch(questions);
  await flush();
  assert.deepEqual(images.map(image => image.src), [questions[0].image]);
  assert.deepEqual(audio.map(element => element.src), [questions[0].audio]);
  images[0].onload();
  await flush();
  assert.equal(images.length, 1, 'future pictures wait for the current spoken cue too');
  audio[0].dispatchEvent(new Event('canplay'));
  await flush();
  assert.deepEqual(images.map(image => image.src), questions.map(item => item.image));
  assert.equal(images[0].fetchPriority, 'high');
  assert.equal(images[1].fetchPriority, 'low');
  await settle();
  await done;
}));

test('leaving while current media is slow cancels the future stage', () => withMedia(async ({ preloadQuestionMediaBatch, images, audio, question, settle }) => {
  const controller = new AbortController();
  const questions = [question(0), question(1), question(2)];
  const done = preloadQuestionMediaBatch(questions, { signal: controller.signal });
  controller.abort();
  await settle();
  await done;
  assert.deepEqual(images.map(image => image.src), [questions[0].image]);
  assert.deepEqual(audio.map(element => element.src), [questions[0].audio]);
}));

test('a replacement question cancels its old window and survives the old rendered question cleanup', () => withMedia(async ({ preloadQuestionMediaWindow, cancelQuestionMediaWindow, images, audio, question, settle }) => {
  const owner = {};
  const old = [question(0), question(1)];
  const next = [question(2), question(3)];
  const oldDone = preloadQuestionMediaWindow(owner, old);
  const nextDone = preloadQuestionMediaWindow(owner, next);
  cancelQuestionMediaWindow(owner, old[0]);
  await settle();
  assert.deepEqual(images.map(image => image.src), [old[0].image, next[0].image, next[1].image]);
  assert.deepEqual(audio.map(element => element.src), [old[0].audio, next[0].audio, next[1].audio]);
  await settle();
  await Promise.all([oldDone, nextDone]);
  cancelQuestionMediaWindow(owner, next[0]);
}));

test('cleanup cancels only its assessment owner while another learner keeps warming', () => withMedia(async ({ preloadQuestionMediaWindow, cancelQuestionMediaWindow, images, question, settle }) => {
  const left = {};
  const right = {};
  const leftQuestions = [question(0), question(1)];
  const rightQuestions = [question(2), question(3)];
  const leftDone = preloadQuestionMediaWindow(left, leftQuestions);
  const rightDone = preloadQuestionMediaWindow(right, rightQuestions);
  cancelQuestionMediaWindow(left, leftQuestions[0]);
  await settle();
  assert.deepEqual(images.map(image => image.src), [leftQuestions[0].image, rightQuestions[0].image, rightQuestions[1].image]);
  await settle();
  await Promise.all([leftDone, rightDone]);
  cancelQuestionMediaWindow(right);
}));

test('a pre-cancelled window starts no requests and an unavailable current image cannot hang the future stage', () => withMedia(async ({ preloadQuestionMediaBatch, images, audio, question, settle }) => {
  const controller = new AbortController();
  controller.abort();
  await preloadQuestionMediaBatch([question(0)], { signal: controller.signal });
  assert.equal(images.length + audio.length, 0);
  const questions = [question(1), question(2)];
  const done = preloadQuestionMediaBatch(questions);
  images[0].onerror();
  audio[0].dispatchEvent(new Event('error'));
  await flush();
  assert.equal(images[1].src, questions[1].image);
  await settle();
  const result = await done;
  assert.equal(result[0].value[0].value, false, 'warmup failure remains a failure, never media evidence');
}));

function visit(node, callback) {
  if (!node || typeof node !== 'object') return;
  callback(node);
  Object.values(node).forEach(value => {
    if (Array.isArray(value)) value.forEach(item => visit(item, callback));
    else if (value && typeof value === 'object') visit(value, callback);
  });
}

test('the mounted Cycle window uses the resumed plan and cancels deferred cues on exit', async () => {
  const source = readFileSync(new URL('../../src/components/cycle-practice/CyclePracticePage.jsx', import.meta.url), 'utf8');
  let effect;
  visit(parse(source, { sourceType: 'module', plugins: ['jsx'] }), node => {
    if (node.type !== 'CallExpression' || node.callee.name !== 'useEffect') return;
    const callback = node.arguments[0];
    const body = source.slice(callback.start, callback.end);
    if (body.includes('audioWindowRelease.current = release')) effect = body;
  });
  assert.ok(effect, 'exercise the production Cycle warmup effect');
  const pictures = [];
  const recordings = [];
  const rounds = ['past', 'current', 'next', 'after-next', 'outside-window'];
  let releaseCurrent;
  const currentPending = new Promise(resolve => { releaseCurrent = resolve; });
  const callback = vm.runInNewContext(`(${effect})`, {
    mode: 'practice', practicePlan: rounds, practiceIndex: 1, assessmentPlan: [], assessmentIndex: 0,
    result: null, state: {}, audioWindowRelease: { current: null },
    preloadQuestionImages: round => pictures.push(round),
    roundAudioSources: (round, withChoices = true) => withChoices ? [round, `${round}-choice`] : [round],
    retainCueAudioSources: () => () => {},
    preloadCueAudio: src => { recordings.push(src); return currentPending; }
  });
  const cleanup = callback();
  assert.deepEqual(pictures, ['current']);
  assert.deepEqual(recordings, ['current']);
  cleanup();
  releaseCurrent();
  await flush();
  assert.deepEqual(pictures, ['current'], 'future pictures are cancelled too');
  assert.deepEqual(recordings, ['current'], 'the old window never starts deferred choice/next cues after leaving');
});

test('student session setup loads its named component only when the teacher opens it', async () => {
  const source = readFileSync(new URL('../../src/components/student-sessions/StudentSessionSetupDialog.jsx', import.meta.url), 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  let declaration;
  visit(ast, node => {
    if (node.type === 'ImportDeclaration') assert.notEqual(node.source.value, './StudentSessionSetup.jsx');
    if (node.type === 'VariableDeclarator' && node.id.name === 'StudentSessionSetup') declaration = node.init;
  });
  assert.equal(declaration?.callee.name, 'lazyWithRetry');
  const lazySource = source.slice(declaration.start, declaration.end).replace(/import\(([^)]+)\)/, 'load($1)');
  const component = () => null;
  const paths = [];
  const load = vm.runInNewContext(lazySource, {
    lazyWithRetry: loader => loader,
    load: async path => { paths.push(path); return { StudentSessionSetup: component }; }
  });
  assert.deepEqual(paths, []);
  assert.equal((await load()).default, component);
  assert.deepEqual(paths, ['./StudentSessionSetup.jsx']);
});

test('signing in on Home, an assessment, or Adventure does not warm an unrelated Cycle plan', async () => {
  for (const appView of ['student-home', 'assessment', 'skills-block-quest']) {
    const calls = [];
    const cleanup = [];
    for (const path of ['src/App.jsx', 'src/components/AppSurface.jsx']) {
      const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
      const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
      visit(ast, node => {
        if (node.type !== 'CallExpression' || node.callee.name !== 'useEffect') return;
        const effect = node.arguments[0];
        const body = source.slice(effect.start, effect.end);
        if (!body.includes('preloadCyclePracticePage')) return;
        const callback = vm.runInNewContext(`(${body})`, {
          appView, authReady: true, entryMode: 'student', sessionMode: 'student',
          nameSaved: true, studentId: 'child-a', cyclePracticeWarmupId: 'cycle-4',
          preloadCyclePracticePage: async () => {
            calls.push('route');
            return { preloadCyclePracticeAudio: () => calls.push('unselected plan') };
          }
        });
        cleanup.push(callback());
      });
    }
    await flush();
    cleanup.forEach(stop => stop?.());
    assert.deepEqual(calls, [], appView);
  }
});
