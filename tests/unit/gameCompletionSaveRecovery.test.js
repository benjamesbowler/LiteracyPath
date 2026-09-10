import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { transformSync } from "rolldown/experimental";
import * as progress from "../../src/utils/learnGamesProgress.js";
import { clearProgressSyncSession, configureProgressSync, flushQueuedProgressWrites, getProgressSyncState } from "../../src/utils/progressSync.js";
import { readProgressQueueRecords } from "../../src/utils/progressQueue.js";
import { GAME_LIST } from "../../src/data/learnGamesData.js";
import { premiumProfileForGame } from "../../src/components/learn/games/shared/arcadePremiumProfiles.js";
import * as surfaceNames from "../../src/utils/fullscreenOverlayNames.js";

const scope = "completion-recovery";
const key = `literacy-guide-learn-games:${scope}`;
const noop = () => {};
const element = (type, props, ...children) => ({ type, props: { ...props, children } });
const source = readFileSync(new URL("../../src/components/learn/games/GamePlayer.jsx", import.meta.url), "utf8");
// Run the whole actual player (including JSX handlers/effects), with a small
// synchronous hook host. No browser, engine, audio or fullscreen is launched.
const { code, errors } = transformSync("GamePlayer.jsx", source, { jsx: { runtime: "classic", pragma: "element" } });
assert.deepEqual(errors, []);
const playerCode = code.replace(/^import[\s\S]*?from\s+["'][^"']+["'];\s*/gm, "")
  .replace(/^export\s*\{[^}]*\};?\s*$/gm, "")
  .replace(/export function GamePlayer/, "function GamePlayer");

function setup(t, gameId = "rhyme-pop") {
  const values = new Map();
  const writes = [];
  let rejectWrite = () => false;
  const storage = {
    get length() { return values.size; },
    key: index => [...values.keys()][index] ?? null,
    getItem: name => values.get(name) ?? null,
    setItem(name, value) {
      writes.push({ name, value });
      if (rejectWrite(name, value)) throw new Error("Injected storage failure");
      values.set(name, value);
    },
    removeItem: name => values.delete(name)
  };
  const document = new EventTarget();
  document.body = {};
  document.documentElement = {};
  document.hidden = false;
  const window = new EventTarget();
  Object.assign(window, { localStorage: storage, setTimeout: () => 1, clearTimeout: noop });
  const previous = { window: globalThis.window, document: globalThis.document };
  Object.assign(globalThis, { window, document });

  const slots = [];
  let cursor = 0;
  let effects = [];
  let dirty = true;
  let tree;
  const changed = (a, b) => !a || !b || a.length !== b.length || a.some((x, i) => !Object.is(x, b[i]));
  const hooks = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = { value: typeof initial === "function" ? initial() : initial };
      return [slots[i].value, next => {
        const value = typeof next === "function" ? next(slots[i].value) : next;
        if (!Object.is(value, slots[i].value)) { slots[i].value = value; dirty = true; }
      }];
    },
    useRef(initial) {
      const i = cursor++;
      return slots[i] ??= { current: initial };
    },
    useCallback(fn, deps) {
      const i = cursor++;
      if (!slots[i] || changed(slots[i].deps, deps)) slots[i] = { fn, deps };
      return slots[i].fn;
    },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!slots[i] || changed(slots[i].deps, deps)) {
        const cleanup = slots[i]?.cleanup;
        slots[i] = { deps };
        effects.push(() => { cleanup?.(); slots[i].cleanup = fn(); });
      }
    }
  };
  function Engine() {}
  const missions = [];
  const returned = [];
  const updates = [];
  let closed = 0;
  let paused = false;
  const api = { pause() { paused = true; }, resume() { paused = false; } };
  const imports = {
    ...hooks, ...progress, ...surfaceNames, element,
    Component: class {}, Suspense: "Suspense", createPortal: content => content,
    GAME_LIST, LEARN_GAMES: { [gameId]: Engine }, premiumProfileForGame,
    cancelSpeech: noop, hasRecordedSpeech: () => false, speak: noop, cancelGameSfx: noop,
    startGameMusic: noop, stopGameMusic: noop, SoundToggle: "SoundToggle", MusicToggle: "MusicToggle", ProgressStars: "ProgressStars",
    worldForDifficulty: () => ({ id: "meadow" }), worldStyle: () => ({}), sceneForKey: () => "",
    getBrowserFullscreenElement: () => null, requestBrowserFullscreen: noop, exitBrowserFullscreen: noop,
    notifyMissionTaskDone: (...args) => { missions.push(args); return true; },
    announceMissionReturn: (...args) => returned.push(args)
  };
  const Player = new Function(...Object.keys(imports), `${playerCode}\nreturn GamePlayer;`)(...Object.values(imports));
  const props = { game: GAME_LIST.find(game => game.id === gameId), difficulty: "easy", progressScopeKey: scope,
    soundEnabled: false, musicEnabled: false, onClose: () => { closed++; }, onProgressChange: next => updates.push(next) };
  function nodes(node = tree) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
  }
  function flush() {
    let passes = 0;
    while (dirty) {
      assert.ok(passes++ < 20, "player render must settle");
      dirty = false; cursor = 0; effects = [];
      tree = Player(props);
      for (const node of nodes()) if (node.props?.ref && typeof node.props.ref === "object") {
        node.props.ref.current = { focus() { document.activeElement = node; }, querySelectorAll: () => [], contains: () => false };
      }
      effects.forEach(run => run());
    }
    return tree;
  }
  flush();
  nodes().find(node => node.type === Engine).props.onEngineReady(api);
  t.after(() => {
    slots.forEach(slot => slot.cleanup?.());
    clearProgressSyncSession();
    Object.assign(globalThis, previous);
  });
  const textOf = node => typeof node === "string" ? node : Array.isArray(node) ? node.map(textOf).join("") : textOf(node?.props?.children || "");
  return {
    storage, writes, missions, returned, updates, window, document, props, api,
    get closed() { return closed; }, get paused() { return paused; },
    reject(fn) { rejectWrite = fn; },
    render() { dirty = true; flush(); }, flush,
    engine() { flush(); return nodes().find(node => node.type === Engine).props; },
    dialogs() { flush(); return nodes().filter(node => node.props?.role === "alertdialog" || (node.props?.role === "dialog" && node !== tree)); },
    recovery() { return this.dialogs().find(node => /sav/i.test(node.props["aria-label"])); },
    button(pattern) {
      flush();
      const button = nodes().find(node => node.type === "button" && pattern.test(node.props["aria-label"] || textOf(node)));
      assert.ok(button, `missing button ${pattern}`);
      return button;
    },
    click(pattern) { this.button(pattern).props.onClick(); flush(); },
    read() { return progress.loadLearnGamesProgress(scope).games[gameId]; },
    seedCheckpoint() { this.engine().onCheckpoint(2, 5); writes.length = 0; }
  };
}

const evidence = () => ({ firstResponses: [{ target: "cat", response: "dog", correct: false, support: "print" }], assistedRetries: [{ target: "cat", response: "hat", correct: true }] });

test("result and matching checkpoint cleanup share one atomic write; old callers retain checkpoints", t => {
  const h = setup(t);
  h.seedCheckpoint();
  progress.saveGameCheckpoint(scope, "rhyme-pop", "hard", 4, 8);
  h.writes.length = 0;
  h.reject(name => name === key && h.writes.filter(write => write.name === key).length > 1);
  const next = progress.saveLearnGameResult(scope, "rhyme-pop", 2, 80, 4, evidence(), "easy");
  assert.equal(h.writes.filter(write => write.name === key).length, 1);
  assert.equal(next.games["rhyme-pop"].checkpoints.easy, undefined);
  assert.deepEqual(next.games["rhyme-pop"].checkpoints.hard, { level: 4, totalLevels: 8 });
  h.reject(() => false);
  progress.saveLearnGameResult(scope, "rhyme-pop", 1, 20, 2);
  assert.deepEqual(h.read().checkpoints.hard, { level: 4, totalLevels: 8 });
  assert.equal(h.read().plays, 2, "separate utility calls remain separate legacy runs");
});

test("failed final-action save returns false, pauses, and explicitly retries the original receipt once", t => {
  const h = setup(t);
  h.seedCheckpoint();
  const firstEvidence = evidence();
  h.reject(name => name === key);
  assert.equal(h.engine().onResultReady(2, 80, 4, firstEvidence), false);
  h.flush();
  assert.ok(h.recovery());
  assert.equal(h.recovery().props.role, "dialog");
  assert.equal(h.recovery().props["aria-label"], "Save game progress");
  assert.equal(h.paused, true);
  assert.equal(h.read().plays || 0, 0);
  assert.deepEqual(h.read().checkpoints.easy, { level: 2, totalLevels: 5 });
  assert.equal(h.missions.length, 0);
  assert.equal(h.updates.length, 0);
  assert.equal(h.dialogs().length, 1);
  assert.equal(h.document.activeElement, h.button(/try saving again/i));
  firstEvidence.firstResponses[0].correct = true;
  h.engine().onScoreUpdate(999);
  const attempts = h.writes.length;
  assert.equal(h.engine().onResultReady(3, 999, 99, evidence()), false);
  h.engine().onSessionStart();
  h.engine().onCheckpoint(3, 5);
  assert.equal(h.writes.length, attempts, "pending callbacks cannot silently retry or replace the result");
  h.reject(() => false);
  const retry = h.button(/try saving again/i).props.onClick;
  retry(); h.flush();
  assert.equal(h.paused, false);
  assert.equal(h.recovery(), undefined);
  assert.equal(h.dialogs().length, 0, "an early save does not present Finish");
  const receipt = h.engine().onResultReady(3, 999, 99, evidence());
  assert.deepEqual(receipt, { stars: 2, score: 80, words: 4, evidence: evidence() });
  h.render(); retry(); h.engine().onComplete(3, 999, 99, evidence()); h.flush();
  assert.equal(h.read().plays, 1);
  assert.equal(h.read().practiceRecord.completions.length, 1);
  assert.equal(h.read().practiceRecord.completions[0].steps[0].correct, false);
  assert.equal(h.read().checkpoints.easy, undefined);
  assert.equal(h.read().highScore, 80);
  assert.equal(h.dialogs().length, 1);
  assert.equal(h.missions.length, 1);
  assert.deepEqual(h.missions[0], [scope, "game", { deferReturn: true }]);
  assert.equal(h.updates.length, 1);
  h.click(/Back to Arcade/);
  assert.equal(h.closed, 1);
  assert.deepEqual(h.returned, [["game"]]);
});

test("pending completion blocks Escape, engine exit and unload until explicit discard", t => {
  const h = setup(t);
  h.seedCheckpoint(); h.reject(name => name === key);
  assert.equal(h.engine().onResultReady(2, 80, 4, evidence()), false);
  h.engine().onExit();
  const escape = new Event("keydown", { cancelable: true });
  Object.defineProperty(escape, "key", { value: "Escape" });
  h.window.dispatchEvent(escape); h.flush();
  assert.equal(h.closed, 0);
  assert.equal(h.dialogs().length, 1);
  const unload = new Event("beforeunload", { cancelable: true });
  Object.defineProperty(unload, "returnValue", { value: true, writable: true });
  h.window.dispatchEvent(unload);
  assert.equal(unload.defaultPrevented, true);
  h.click(/Leave without saving/);
  assert.equal(h.closed, 1);
  assert.equal(h.read().plays || 0, 0);
  assert.equal(h.returned.length, 0);
});

test("onComplete-only engines recover one result dialog and can start another run", t => {
  const h = setup(t, "soundkeys");
  h.seedCheckpoint(); h.reject(name => name === key);
  assert.equal(h.engine().onComplete(2, 80, 4), false);
  h.flush();
  h.click(/try saving again/i);
  assert.ok(h.recovery(), "repeated storage failure stays recoverable");
  h.reject(() => false);
  h.click(/try saving again/i);
  assert.equal(h.dialogs().length, 1);
  assert.equal(h.read().plays, 1);
  h.render(); h.engine().onComplete(2, 80, 4); h.flush();
  assert.equal(h.read().plays, 1, "duplicate completion callbacks cannot invent a replay");
  h.engine().onProgressUpdate(0, 5); h.flush();
  h.engine().onComplete(3, 100, 5); h.flush();
  assert.equal(h.read().plays, 2, "actual new play resets legacy completion deduplication");
});

test("early failure followed by Finish retains the original result and shows the debrief after retry", t => {
  const h = setup(t);
  h.seedCheckpoint(); h.reject(name => name === key);
  assert.equal(h.engine().onResultReady(2, 80, 4, evidence()), false);
  assert.equal(h.engine().onComplete(3, 900, 9), false);
  h.reject(() => false); h.click(/try saving again/i);
  assert.equal(h.dialogs().length, 1);
  assert.equal(h.read().highScore, 80);
  assert.equal(h.read().plays, 1);
});

test("a successful result never needs the old second checkpoint write", t => {
  const h = setup(t);
  h.seedCheckpoint();
  h.reject(name => name === key && h.writes.filter(write => write.name === key).length > 1);
  assert.ok(h.engine().onResultReady(2, 80, 4, evidence()));
  assert.equal(h.read().checkpoints.easy, undefined);
  assert.equal(h.read().plays, 1);
  h.engine().onComplete(2, 80, 4, evidence()); h.flush();
  assert.equal(h.recovery(), undefined);
  assert.equal(h.writes.filter(write => write.name === key).length, 1);
});

test("sync notification failure after local commit cannot turn it into a duplicate result", t => {
  const h = setup(t);
  configureProgressSync({ mode: "student", studentId: scope, token: "unit-token", client: { call: async () => ({ data: { ok: true } }) } });
  const dispatch = h.window.dispatchEvent.bind(h.window);
  h.window.dispatchEvent = () => { throw new Error("Injected sync notification failure"); };
  const receipt = h.engine().onResultReady(2, 80, 4, evidence());
  assert.ok(receipt, "durable local persistence is still reported as success");
  h.flush();
  assert.ok(h.recovery(), "a queue exception must retain an explicit sync recovery path");
  assert.match(JSON.stringify(h.recovery()), /saved on this device/i);
  assert.equal(h.paused, true);
  h.engine().onExit(); h.flush();
  assert.match(JSON.stringify(h.recovery()), /saved on this device/i, "guarded exit must retain truthful local-save status");
  const stored = h.storage.getItem(key);
  h.window.dispatchEvent = dispatch;
  h.click(/Try saving again/);
  assert.equal(h.storage.getItem(key), stored, "sync retry cannot rewrite the local result");
  assert.equal(readProgressQueueRecords(h.storage).length, 1);
  assert.equal(h.paused, false);
  h.engine().onComplete(2, 80, 4, evidence()); h.flush();
  assert.equal(h.read().plays, 1);
  assert.equal(h.recovery(), undefined);
});

test("queue quota failure leaves the locally saved result with the existing sync recovery", async t => {
  const h = setup(t);
  const sent = [];
  configureProgressSync({ mode: "student", studentId: scope, token: "unit-token-quota", client: { call: async (_, args) => {
    sent.push(args.p_payload); return { data: { ok: true } };
  } } });
  h.reject(name => name !== key);
  const receipt = h.engine().onResultReady(2, 80, 4, evidence());
  assert.ok(receipt);
  assert.equal(h.read().plays, 1);
  assert.equal(getProgressSyncState(scope).status, "storage-failed");
  assert.equal(getProgressSyncState(scope).pending, 1);
  assert.equal(h.recovery(), undefined, "existing sync recovery owns its volatile queue entry");
  h.reject(() => false);
  await flushQueuedProgressWrites();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].games["rhyme-pop"].plays, 1);
  assert.equal(sent[0].games["rhyme-pop"].practiceRecord.completions.length, 1);
  assert.equal(getProgressSyncState(scope).pending, 0);
  assert.strictEqual(h.engine().onResultReady(3, 100, 5), receipt);
});

test("failure before queue admission retries sync without recreating the durable evidence identity", t => {
  const h = setup(t);
  configureProgressSync({ mode: "student", studentId: scope, token: "unit-token-admission" });
  const uuid = globalThis.crypto.randomUUID.bind(globalThis.crypto);
  let ids = 0;
  const fault = t.mock.method(globalThis.crypto, "randomUUID", () => {
    if (++ids > 1) throw new Error("Injected queue revision failure");
    return uuid();
  });
  const receipt = h.engine().onResultReady(2, 80, 4, evidence());
  assert.ok(receipt);
  assert.equal(readProgressQueueRecords(h.storage).length, 0);
  assert.ok(h.recovery());
  const stored = h.storage.getItem(key);
  assert.strictEqual(h.engine().onComplete(3, 999, 9), receipt);
  assert.equal(h.dialogs().length, 1, "sync recovery defers the debrief");
  h.click(/Try saving again/);
  assert.equal(h.storage.getItem(key), stored);
  assert.ok(h.recovery(), "failed sync retry stays explicit");
  fault.mock.restore();
  h.click(/Try saving again/);
  const queued = readProgressQueueRecords(h.storage);
  assert.equal(queued.length, 1);
  assert.deepEqual(queued[0].entry.payload.games["rhyme-pop"], JSON.parse(stored).games["rhyme-pop"]);
  assert.equal(h.storage.getItem(key), stored);
  assert.equal(h.missions.length, 1);
  assert.equal(h.updates.length, 1);
  assert.equal(h.dialogs().length, 1);
  assert.equal(h.recovery(), undefined);
});

test("save retry retains original owner, difficulty, scores and response evidence across rerenders", t => {
  const h = setup(t);
  h.seedCheckpoint(); h.reject(name => name === key);
  assert.equal(h.engine().onResultReady(2, 80, 4, evidence()), false);
  h.props.progressScopeKey = "another-owner";
  h.props.difficulty = "hard";
  h.render(); h.reject(() => false);
  h.click(/Try saving again/);
  assert.equal(h.read().plays, 1);
  assert.equal(h.read().checkpoints.easy, undefined);
  assert.equal(h.storage.getItem("literacy-guide-learn-games:another-owner"), null);
  assert.equal(h.missions[0][0], scope);
});

test("recovery holds visible and newly attached engines, then resumes only when visible", t => {
  const h = setup(t);
  h.reject(name => name === key);
  assert.equal(h.engine().onResultReady(2, 80, 4), false);
  assert.equal(h.paused, true, "pause is synchronous at the failing callback");
  h.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(h.paused, true);
  h.api.resume();
  h.engine().onEngineReady(h.api);
  assert.equal(h.paused, true, "a newly attached engine inherits recovery pause");
  h.document.hidden = true;
  h.reject(() => false); h.click(/Try saving again/);
  assert.equal(h.paused, true, "retry cannot resume a hidden game");
  h.document.hidden = false;
  h.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(h.paused, false);
  const unload = new Event("beforeunload", { cancelable: true });
  h.window.dispatchEvent(unload);
  assert.equal(unload.defaultPrevented, false, "successful retry removes the pending-exit guard");
});

test("throwing progress observers cannot invalidate a saved receipt or cause a second write", t => {
  const h = setup(t);
  t.mock.method(console, "error", noop);
  h.props.onProgressChange = () => { throw new Error("Injected observer failure"); };
  h.render();
  const receipt = h.engine().onResultReady(2, 80, 4, evidence());
  assert.ok(receipt);
  assert.strictEqual(h.engine().onComplete(3, 999, 9), receipt);
  assert.equal(h.read().plays, 1);
  assert.equal(h.read().practiceRecord.completions.length, 1);
  assert.equal(h.recovery(), undefined);
});

for (const game of GAME_LIST) {
  test(`${game.id}: shared failure/retry and subsequent receipt callbacks save one run`, t => {
    const h = setup(t, game.id);
    h.seedCheckpoint();
    const callbacks = h.engine(); // Imperative engines keep the original callbacks.
    h.reject(name => name === key);
    assert.equal(callbacks.onResultReady(2, 80, 4, evidence()), false);
    h.render(); h.reject(() => false); h.click(/Try saving again/);
    const receipt = callbacks.onResultReady(3, 999, 9);
    assert.ok(receipt);
    assert.strictEqual(callbacks.onResultReady(3, 999, 9), receipt);
    assert.strictEqual(callbacks.onComplete(3, 999, 9), receipt);
    h.flush();
    assert.equal(h.read().plays, 1);
    assert.equal(h.read().practiceRecord.completions.length, 1);
    assert.equal(h.read().highScore, 80);
    assert.equal(h.read().checkpoints.easy, undefined);
    assert.equal(h.dialogs().length, premiumProfileForGame(game.id) && game.id !== "rocket-run" ? 1 : 0);
    assert.equal(h.missions.length, 1);
    callbacks.onSessionStart();
    assert.ok(callbacks.onResultReady(3, 100, 5, evidence()));
    assert.equal(h.read().plays, 2);
    assert.equal(h.read().practiceRecord.completions.length, 2);
  });
}



test("legacy progress reset establishes a new run while repeated completion callbacks deduplicate", t => {
  const h = setup(t, "word-rescue"), callbacks = h.engine();
  const first = callbacks.onComplete(2, 40, 3, evidence());
  assert.strictEqual(callbacks.onComplete(3, 999, 9), first);
  callbacks.onProgressUpdate(3, 3);
  assert.strictEqual(callbacks.onComplete(3, 999, 9), first);
  assert.equal(h.read().plays, 1);
  callbacks.onProgressUpdate(0, 3);
  const second = callbacks.onComplete(2, 50, 3, evidence());
  assert.notStrictEqual(second, first);
  assert.equal(h.read().plays, 2);
  assert.strictEqual(callbacks.onComplete(3, 999, 9), second);
});

test("early-result engines retain their receipt until their explicit session callback", t => {
  const h = setup(t, "word-rescue"), callbacks = h.engine();
  const first = callbacks.onResultReady(2, 40, 3, evidence());
  callbacks.onComplete(2, 40, 3, evidence());
  callbacks.onProgressUpdate(0, 3);
  assert.strictEqual(callbacks.onComplete(3, 999, 9), first);
  assert.equal(h.read().plays, 1);
  callbacks.onSessionStart();
  callbacks.onResultReady(2, 50, 3, evidence());
  callbacks.onComplete(2, 50, 3, evidence());
  assert.equal(h.read().plays, 2);
});
