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
  ["RocketRunGame.jsx", ["onKey", "onIntroKey"]],
  ["RhymePopArcadeGame.jsx", ["onKeyDown"]],
  ["SoundRacerGame.jsx", ["onKey", "onIntroKey"]],
  ["SoundSafariArcadeGame.jsx", ["onKeyDown"]],
  ["SoundBeatGame.jsx", ["onKeyDown"]],
  ["ReelReadGame.jsx", ["onKeyDown"]],
  ["StarGalleryArcadeGame.jsx", ["onKeyDown", "onIntroKey"]],
  ["GrammarGrindGame.jsx", ["onKeyDown", "onIntroKey"]]
];

for (const [fileName, handlers] of gameHandlerContracts) {
  test(`${fileName} leaves focused controls to native keyboard behaviour`, async () => {
    const source = await readFile(
      new URL(`../../src/components/learn/games/games/${fileName}`, import.meta.url),
      "utf8"
    );

    assert.match(source, /import \{ isInteractiveKeyTarget \} from/);
    for (const handler of handlers) {
      assert.match(
        readFunction(source, handler),
        /if \(isInteractiveKeyTarget\((?:e|event)\.target\)\) return;/,
        `${handler} should ignore keys owned by a focused control`
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

test("SoundKeys provider keeps the interactive-target guard beside repeat filtering", async () => {
  const source = await readFile(
    new URL("../../src/features/soundkeys/inputProviders.js", import.meta.url),
    "utf8"
  );
  assert.match(source, /if \(event\.repeat \|\| isInteractiveKeyTarget\(event\.target\)\) return;/);
});
