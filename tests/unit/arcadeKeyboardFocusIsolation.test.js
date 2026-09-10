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
  ["RocketRunGame.jsx", ["onKey"]],
  ["RhymePopArcadeGame.jsx", ["onKeyDown"]],
  ["SoundRacerGame.jsx", ["onKey"]],
  ["SoundSafariArcadeGame.jsx", ["onKeyDown"]],
  ["Ps1ArcadeGame.jsx", ["onKeyDown"]],
  ["ReelReadGame.jsx", ["onKeyDown"]],
  ["StarGalleryArcadeGame.jsx", ["onKeyDown"]],
  ["GrammarGrindGame.jsx", ["onKeyDown"]]
];

const focusedMovementControlExceptions = new Map([
  [
    "Ps1ArcadeGame.jsx:onKeyDown",
    /if \(isInteractiveKeyTarget\(event\.target\) && !padGroup\.contains\(event\.target\)\) return;/
  ],
  [
    "LetterLeapGame.jsx:onKeyDown",
    /if \(isInteractiveKeyTarget\(e\.target\) && !padWrap\.contains\(e\.target\)\) return;/
  ],
  [
    "RocketRunGame.jsx:onKey",
    /const steeringControlOwnsFocus = event\.target\?\.matches\?\.\('\[data-rr="left-control"\],\[data-rr="right-control"\]'\);\s+if \(isInteractiveKeyTarget\(event\.target\) && !steeringControlOwnsFocus\) return;/
  ],
  [
    "SoundRacerGame.jsx:onKey",
    /const steeringControlOwnsFocus = event\.target\?\.matches\?\.\('\[data-sr="left-control"\],\[data-sr="right-control"\](?:,\[data-sr="brake-control"\])?'\);\s+if \(isInteractiveKeyTarget\(event\.target\) && !steeringControlOwnsFocus\) return;/
  ]
]);

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

test("Rocket Run lane repeat controls reject a second pointer before it can replace the repeat owner", async () => {
  const contracts = [
    ["RocketRunGame.jsx", "attachRocketPressControl"]
  ];

  for (const [fileName, helperName] of contracts) {
    const source = await readFile(
      new URL(`../../src/components/learn/games/games/${fileName}`, import.meta.url),
      "utf8"
    );
    const helper = readFunction(source, helperName);
    const ownershipGuard = helper.indexOf("if (pointerId != null) return;");
    const pointerAssignment = helper.indexOf("pointerId = event.pointerId;");
    assert.ok(ownershipGuard >= 0, `${helperName} should reject an extra pointer`);
    assert.ok(
      ownershipGuard < pointerAssignment,
      `${helperName} must reject an extra pointer before replacing the repeat owner`
    );
    assert.match(helper, /event\.pointerId !== pointerId\) return;/);
    assert.match(helper, /element\.addEventListener\("lostpointercapture", release\)/);
  }
});

test("SoundKeys accepts only explicitly owned instrument focus and suppresses held-key repeats", () => {
  const previousWindow = globalThis.window;
  let handler;
  const events = [];
  const owned = interactiveTarget();
  globalThis.window = { addEventListener(type, value) { if (type === "keydown") handler = value; }, removeEventListener() {} };
  try {
    const cleanup = createComputerKeyboardProvider(event => events.push(event), {
      acceptTarget: target => target === owned,
      resolveKey: key => key === "1" ? "sh" : null
    });
    handler({ key: "1", target: interactiveTarget(), preventDefault() { throw new Error("unrelated control was intercepted"); } });
    handler({ key: "1", target: owned, repeat: true, preventDefault() { throw new Error("repeat was intercepted"); } });
    assert.deepEqual(events, []);
    let prevented = false;
    handler({ key: "1", target: owned, preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.deepEqual(events, [{ type: "token", token: "sh", source: "computer", key: "1" }]);
    cleanup();
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
