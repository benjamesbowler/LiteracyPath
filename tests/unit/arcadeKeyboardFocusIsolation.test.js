import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createComputerKeyboardProvider } from "../../src/features/soundkeys/inputProviders.js";
import { isInteractiveKeyTarget } from "../../src/utils/interactiveEventTarget.js";

function interactiveTarget() {
  return { closest: () => ({ tagName: "BUTTON" }) };
}

function gameSurfaceTarget() {
  return { closest: () => null };
}

function readFunction(source, functionName) {
  const functionStart = source.indexOf(`function ${functionName}(`);
  const arrowStart = source.indexOf(`const ${functionName} =`);
  const start = functionStart >= 0 ? functionStart : arrowStart;
  assert.notEqual(start, -1, `${functionName} should exist`);
  const lineStart = source.lastIndexOf("\n", start) + 1;
  const indent = source.slice(lineStart, start);
  const terminator = functionStart >= 0 ? `\n${indent}}\n` : `\n${indent}};\n`;
  const end = source.indexOf(terminator, start);
  assert.notEqual(end, -1, `${functionName} should have a readable body`);
  return source.slice(start, end + terminator.length);
}

test("interactive key targets include nested controls but not the game surface", () => {
  assert.equal(isInteractiveKeyTarget(interactiveTarget()), true);
  assert.equal(isInteractiveKeyTarget(gameSurfaceTarget()), false);
  assert.equal(isInteractiveKeyTarget(null), false);
  assert.equal(isInteractiveKeyTarget({}), false);
});

test("SoundKeys ignores typing on controls and still accepts game-surface keys", () => {
  const previousWindow = globalThis.window;
  let keydownHandler = null;
  let removedHandler = null;
  const events = [];

  globalThis.window = {
    addEventListener(type, handler) {
      if (type === "keydown") keydownHandler = handler;
    },
    removeEventListener(type, handler) {
      if (type === "keydown") removedHandler = handler;
    }
  };

  try {
    const cleanup = createComputerKeyboardProvider(event => events.push(event));
    assert.equal(typeof keydownHandler, "function");

    keydownHandler({ key: "a", repeat: false, target: interactiveTarget() });
    assert.deepEqual(events, []);

    keydownHandler({ key: "a", repeat: false, target: gameSurfaceTarget() });
    keydownHandler({ key: "Backspace", repeat: false, target: gameSurfaceTarget() });
    assert.deepEqual(events, [
      { type: "token", token: "a", source: "computer" },
      { type: "control", action: "clear" }
    ]);

    cleanup();
    assert.equal(removedHandler, keydownHandler);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

const gameHandlerContracts = [
  ["LetterLeapGame.jsx", ["onKeyDown"]],
  ["SoundSafariArcadeGame.jsx", ["onKeyDown"]],
  ["SoundBeatGame.jsx", ["onKeyDown"]],
  ["ReelReadGame.jsx", ["onKeyDown"]],
  ["StarGalleryArcadeGame.jsx", ["onKeyDown", "onIntroKey"]],
  ["GrammarGrindGame.jsx", ["onKeyDown", "onIntroKey"]]
];

const focusedMovementControlExceptions = new Map([
  [
    "LetterLeapGame.jsx:onKeyDown",
    /if \(isInteractiveKeyTarget\(e\.target\) && !padWrap\.contains\(e\.target\)\) return;/
  ],

]);

test("Rhyme Pop only moves focus between its own native balloons and preserves control activation", async () => {
  const source = await readFile(new URL('../../src/components/learn/games/games/RhymePopArcadeGame.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /listen\((?:window|document), 'keydown'/);
  const body = source.match(/listen\(root, 'keydown', event => \{([\s\S]*?)\n {2}\}\);/)[1];
  const fieldTargets = [{ focus() { focused = 0; } }, { focus() { focused = 1; } }];
  let focused = 0, prevented = 0;
  const hostControl = {};
  const document = { activeElement: fieldTargets[0] };
  const handler = new Function('canChoose', 'el', 'document', 'cardKey', `return event => {${body}}`)(
    () => true,
    () => ({ contains: target => fieldTargets.includes(target), querySelectorAll: () => fieldTargets }),
    document, null
  );
  const key = (target, key, repeat = false) => handler({ target, key, repeat, preventDefault() { prevented++; } });
  for (const value of ['ArrowRight', 'ArrowLeft', 'a', 'd', 'Enter', ' ']) key(hostControl, value);
  assert.equal(prevented, 0); assert.equal(focused, 0);
  key(fieldTargets[0], 'Enter'); key(fieldTargets[0], ' ');
  assert.equal(prevented, 0, 'native buttons own Enter and Space activation');
  key(fieldTargets[0], 'ArrowRight');
  assert.equal(prevented, 1); assert.equal(focused, 1);
  key(fieldTargets[0], 'Enter', true);
  assert.equal(prevented, 2, 'held activation cannot repeatedly answer');
});

for (const [fileName, handlers] of gameHandlerContracts) {
  test(`${fileName} leaves unrelated focused controls to native keyboard behaviour`, async () => {
    const source = await readFile(
      new URL(`../../src/components/learn/games/games/${fileName}`, import.meta.url),
      "utf8"
    );

    assert.match(source, /import \{ isInteractiveKeyTarget \} from/);
    for (const handler of handlers) {
      const focusedMovementException = focusedMovementControlExceptions.get(`${fileName}:${handler}`);
      assert.match(
        readFunction(source, handler),
        focusedMovementException || /if \(isInteractiveKeyTarget\((?:e|event)\.target\)\) return;/,
        focusedMovementException
          ? `${handler} should only exempt its own named movement controls`
          : `${handler} should ignore keys owned by a focused control`
      );
    }
  });
}

test("held movement keys still release after focus moves to a control", async () => {
  const reelSource = await readFile(
    new URL("../../src/components/learn/games/games/ReelReadGame.jsx", import.meta.url),
    "utf8"
  );
  const reelKeyUp = readFunction(reelSource, "onKeyUp");
  assert.match(reelKeyUp, /const interactiveTarget = isInteractiveKeyTarget\(event\.target\)/);
  assert.match(reelKeyUp, /if \(!interactiveTarget\) event\.preventDefault\(\);\s+keys\.left = false/);
  assert.doesNotMatch(reelKeyUp, /if \(isInteractiveKeyTarget\(event\.target\)\) return/);

  const grammarSource = await readFile(
    new URL("../../src/components/learn/games/games/GrammarGrindGame.jsx", import.meta.url),
    "utf8"
  );
  const grammarKeyUp = readFunction(grammarSource, "onKeyUp");
  assert.match(grammarKeyUp, /setKey\("left", false\)/);
  assert.match(grammarKeyUp, /if \(!isInteractiveKeyTarget\(event\.target\)\) event\.preventDefault\(\)/);
  assert.doesNotMatch(grammarKeyUp, /if \(isInteractiveKeyTarget\(event\.target\)\) return/);

  const groveSource = await readFile(
    new URL("../../src/components/learn/games/games/StarGalleryArcadeGame.jsx", import.meta.url),
    "utf8"
  );
  const groveKeyUp = readFunction(groveSource, "onKeyUp");
  assert.match(groveKeyUp, /keys\.left = false/);
  assert.doesNotMatch(groveKeyUp, /preventDefault|isInteractiveKeyTarget/);
});

test("Rocket release controls preserve their pointer owner through unrelated cancellation", async () => {
  const source = await readFile(new URL('../../src/components/learn/games/games/RocketRunGame.jsx', import.meta.url), 'utf8');
  const attach = new Function(`return (${readFunction(source, 'attachRelease')})`)();
  const button = Object.assign(new EventTarget(), { disabled: false, dataset: {}, setPointerCapture() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 100, bottom: 60 }) });
  const dispatch = (type, pointerId) => button.dispatchEvent(Object.assign(new Event(type), { pointerId, button: 0, clientX: 50, clientY: 30 }));
  let calls = 0, epoch = 0;
  const cleanup = attach(button, () => calls++, () => epoch);
  dispatch('pointerdown', 1); dispatch('pointerdown', 2); dispatch('pointercancel', 2); dispatch('pointerup', 1);
  assert.equal(calls, 1);
  dispatch('pointerdown', 3); dispatch('lostpointercapture', 3); dispatch('pointerup', 3);
  assert.equal(calls, 1);
  dispatch('pointerdown', 4); epoch++; dispatch('pointerup', 4);
  assert.equal(calls, 1);
  cleanup(); dispatch('pointerdown', 5); dispatch('pointerup', 5);
  assert.equal(calls, 1);
});

test("SoundKeys provider keeps the interactive-target guard beside repeat filtering", async () => {
  const source = await readFile(
    new URL("../../src/features/soundkeys/inputProviders.js", import.meta.url),
    "utf8"
  );
  assert.match(source, /if \(event\.repeat \|\| isInteractiveKeyTarget\(event\.target\)\) return;/);
});

 test("Sound Racer's mission isolates native focus and commits only explicit nonrepeat action", async () => {
  const source = await readFile(new URL("../../src/features/soundRacer/RacerSession.jsx", import.meta.url), "utf8");
  assert.match(source, /const nativeTarget = isInteractiveKeyTarget\(event\.target\)/);
  assert.match(source, /closest\?\.\('\[data-sr-driving-control\]'\)/);
  assert.match(source, /if \(nativeTarget && !steerControl\) return;/);
  assert.match(source, /else if \(!nativeTarget && \[' ', 'Enter'\]\.includes\(event\.key\)\)/);
  assert.match(source, /if \(!event\.repeat\) commit\(\)/);
  assert.match(source, /window\.removeEventListener\('keydown', key\)/);
  assert.match(source, /onClick=\{\(\) => selectLane/);
  assert.doesNotMatch(source, /setInterval|setPointerCapture/);
});
