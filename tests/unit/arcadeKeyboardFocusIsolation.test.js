import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createComputerKeyboardProvider } from "../../src/features/soundkeys/inputProviders.js";
import { isInteractiveKeyTarget } from "../../src/utils/interactiveEventTarget.js";
import { reelReadKeyboardAllowed, reelReadKeyAction } from "../../src/utils/reelReadInput.js";

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
  ["rhymePopEngine.js", ["onKeyDown"]],
  ["SoundRacerGame.jsx", ["onKey"]],
  ["SoundSafariArcadeGame.jsx", ["onKeyDown"]],
  ["Ps1ArcadeGame.jsx", ["onKeyDown"]],
  ["StarGalleryArcadeGame.jsx", ["onKeyDown"]],
  ["GrammarGrindGame.jsx", ["onKeyDown"]]
];

const focusedMovementControlExceptions = new Map([
  [
    "Ps1ArcadeGame.jsx:onKeyDown",
    /if \(isInteractiveKeyTarget\(event\.target, focusKey\) && !padGroup\.contains\(event\.target\)\) return;/
  ],
  [
    "LetterLeapGame.jsx:onKeyDown",
    /if \(isInteractiveKeyTarget\(e\.target(?:, e\.key)?\) && !padWrap\.contains\(e\.target\)\) return;/
  ],
  [
    "RocketRunGame.jsx:onKey",
    /const steeringControlOwnsFocus = event\.target\?\.matches\?\.\('\[data-rr="left-control"\],\[data-rr="right-control"\]'\);\s+if \(isInteractiveKeyTarget\(event\.target(?:, event\.key)?\) && !steeringControlOwnsFocus\) return;/
  ],
  [
    "SoundRacerGame.jsx:onKey",
    /const steeringControlOwnsFocus = event\.target\?\.matches\?\.\('\[data-sr="left-control"\],\[data-sr="right-control"\](?:,\[data-sr="brake-control"\])?'\)(?:\s*\|\| \(event\.target\?\.matches\?\.\('\[data-sr="hear-target"\]'\) && Boolean\(laneDirectionForKey\(event\.key\)\)\))?;\s+if \(isInteractiveKeyTarget\(event\.target(?:, event\.key)?\) && !steeringControlOwnsFocus\) return;/
  ],

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
        focusedMovementException || /if \(isInteractiveKeyTarget\((?:e|event)\.target(?:, (?:e|event)\.key)?\)\) return;/,
        focusedMovementException
          ? `${handler} should only exempt its own named movement controls`
          : `${handler} should ignore keys owned by a focused control`
      );
    }
  });
}

test("Rhyme's actual leaf handler preserves nested controls and only fires from the focused game surface", async () => {
  const source = await readFile(new URL("../../src/components/learn/games/games/rhymePopEngine.js", import.meta.url), "utf8");
  const handlerSource = readFunction(source, "onKeyDown");
  const host = gameSurfaceTarget(), mount = { closest: () => host };
  const makeHandler = new Function("isInteractiveKeyTarget", "document", "mount", "select", "fire",
    `const state = { paused: false }, disposed = false; ${handlerSource}; return onKeyDown;`);
  for (const control of ["button", "a", "[role='button']", "[contenteditable='true']", "input", "summary"]) {
    const target = { closest: selector => selector.includes(control) ? { control } : null };
    for (const key of [" ", "Enter", "ArrowLeft", "ArrowRight"]) {
      const actions = []; let prevented = false;
      makeHandler(isInteractiveKeyTarget, { activeElement: host }, mount,
        value => actions.push(value), value => actions.push(value))({ target, key, preventDefault() { prevented = true; } });
      assert.deepEqual(actions, [], `${control} retains ${key}`);
      assert.equal(prevented, false);
    }
  }
  for (const [key, expected] of [["ArrowLeft", -1], ["ArrowRight", 1], [" ", "keyboard"], ["Enter", "keyboard"]]) {
    const actions = []; let prevented = false;
    makeHandler(isInteractiveKeyTarget, { activeElement: host }, mount,
      value => actions.push(value), value => actions.push(value))({ target: host, key, preventDefault() { prevented = true; } });
    assert.deepEqual(actions, [expected]); assert.equal(prevented, true);
  }
  const actions = [];
  makeHandler(isInteractiveKeyTarget, { activeElement: interactiveTarget() }, mount,
    value => actions.push(value), value => actions.push(value))({ target: host, key: " ", preventDefault() { throw new Error("Unfocused game stole input"); } });
  assert.deepEqual(actions, []);
  assert.match(source, /removeEventListener\('keydown', onKeyDown\)/);
});

test("Reel's actual leaf handlers preserve native control activation, focused gameplay and held-key ownership", async () => {
  const source = await readFile(new URL("../../src/components/learn/games/games/reelReadEngine.js", import.meta.url), "utf8");
  const main = {}, player = {}, owned = new Set(), mount = { closest: () => main, contains: target => owned.has(target) };
  const native = (editable = false, modal = false) => ({ closest(selector) {
    if (selector === '.lg-game-player') return player;
    if (selector === '[role="dialog"]') return modal ? {} : player;
    if (selector.startsWith('[inert]')) return editable ? {} : null;
    return {};
  } });
  const surface = gameSurfaceTarget(), ownButton = native(); owned.add(ownButton);
  const document = { activeElement: main }, state = { paused: false }, actions = [];
  const down = new Function("reelReadKeyboardAllowed", "reelReadKeyAction", "mount", "document", "state", "hold",
    `${readFunction(source, "onKeyDown")}; return onKeyDown;`)(reelReadKeyboardAllowed, reelReadKeyAction, mount, document, state, (...args) => actions.push(args));
  const press = (target, key, repeat = false) => { let prevented = false; down({ target, key, code: key, repeat,
    preventDefault() { prevented = true; } }); return prevented; };
  for (const target of [native(), native(true), native(false, true)]) {
    document.activeElement = target;
    for (const key of ['Enter', ' ', 'ArrowLeft', 'ArrowDown']) assert.equal(press(target, key), false);
  }
  document.activeElement = ownButton;
  for (const key of ['Enter', ' ']) assert.equal(press(ownButton, key), false, 'Native action button owns activation');
  assert.deepEqual(actions, []);
  document.activeElement = main;
  for (const [key, action] of [['ArrowLeft','left'], ['ArrowRight','right'], ['Enter','cast'], ['ArrowDown','cast']]) {
    assert.equal(press(surface, key), true); assert.deepEqual(actions.at(-1), [action, true, 'keyboard', key]);
  }
  const count = actions.length; assert.equal(press(surface, 'Enter', true), true); assert.equal(actions.length, count);
  state.paused = true; assert.equal(press(surface, 'ArrowLeft'), false); assert.equal(actions.length, count);
  const held = new Set(['keyboard:ArrowLeft']); let changes = 0, saves = 0;
  const up = new Function("held", "controlsChanged", "persist", `${readFunction(source, "onKeyUp")}; return onKeyUp;`)(held, () => changes++, () => saves++);
  document.activeElement = native();
  const release = { key:'ArrowLeft', code:'ArrowLeft', target:document.activeElement, preventDefault(){ throw new Error('Native focused control release was intercepted'); } };
  up(release); assert.equal(held.size,0); assert.equal(changes,1); assert.equal(saves,1);
  up(release); assert.equal(changes,1); assert.equal(saves,1);
  assert.match(source, /removeEventListener\('keydown',onKeyDown\)/); assert.match(source, /removeEventListener\('keyup',onKeyUp\)/);
});

test("held movement keys still release after focus moves to a control", async () => {
  const grammarSource = await readFile(
    new URL("../../src/components/learn/games/games/GrammarGrindGame.jsx", import.meta.url),
    "utf8"
  );
  const grammarKeyUp = readFunction(grammarSource, "onKeyUp");
  assert.match(grammarKeyUp, /setKey\("left", false\)/);
  assert.match(grammarKeyUp, /if \(!isInteractiveKeyTarget\(event\.target(?:, event\.key)?\)\) event\.preventDefault\(\)/);
  assert.doesNotMatch(grammarKeyUp, /if \(isInteractiveKeyTarget\(event\.target(?:, event\.key)?\)\) return/);

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

test("Arcade movement survives button focus while activation, editing and modal keys remain native", () => {
  const player = {};
  const button = {};
  const target = ({ inPlayer = true, modal = false, editable = false, inert = false, isButton = true } = {}) => ({
    closest(selector) {
      if (selector === '.lg-game-player') return inPlayer ? player : null;
      if (selector === '[role="dialog"]') return modal ? {} : inPlayer ? player : null;
      if (selector === "[inert], input, select, textarea, [contenteditable='true']") return editable || inert ? {} : null;
      if (selector === "button, [role='button']") return isButton ? button : null;
      return button;
    }
  });
  for (const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','A','s','D']) {
    assert.equal(isInteractiveKeyTarget(target(), key), false, `${key} reaches the active engine`);
    for (const options of [{ inPlayer:false }, { modal:true }, { editable:true }, { inert:true }, { isButton:false }]) {
      assert.equal(isInteractiveKeyTarget(target(options), key), true, `${key} respects unrelated control boundaries`);
    }
  }
  for (const key of ['Enter',' ','Tab',undefined]) assert.equal(isInteractiveKeyTarget(target(), key), true);
});
