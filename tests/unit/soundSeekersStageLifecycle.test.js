import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { createSoundSeekersScene } from "../../src/features/soundSeekers/runtime/soundSeekersScene.js";

class FakeEventHub {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    const listeners = (this.listeners.get(type) ?? []).filter(candidate => candidate !== listener);
    if (listeners.length) this.listeners.set(type, listeners);
    else this.listeners.delete(type);
  }

  once(type, listener) {
    const once = (...args) => {
      this.off(type, once);
      listener(...args);
    };
    this.addEventListener(type, once);
  }

  off(type, listener) {
    this.removeEventListener(type, listener);
  }

  emit(type, init = {}) {
    const event = {
      type,
      target: this,
      currentTarget: this,
      preventDefault() {},
      ...init
    };
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(event);
  }

  listenerCount() {
    return [...this.listeners.values()].reduce((total, listeners) => total + listeners.length, 0);
  }
}

function runtimeNodes() {
  const ownerDocument = { activeElement: null };
  const host = new FakeEventHub();
  host.ownerDocument = ownerDocument;
  host.clientWidth = 640;
  host.clientHeight = 360;
  host.children = [];
  host.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 360 });
  host.appendChild = child => {
    child.parentNode = host;
    host.children.push(child);
    return child;
  };
  host.removeChild = child => {
    host.children = host.children.filter(candidate => candidate !== child);
    child.parentNode = null;
    return child;
  };
  host.querySelector = selector => selector === "canvas"
    ? host.children.find(child => child.tagName === "CANVAS") ?? null
    : null;
  const actionRoot = new FakeEventHub();
  actionRoot.ownerDocument = ownerDocument;
  const control = {
    dataset: {
      ssInputType: "confirm_candidate",
      ssTargetId: "candidate-1",
      ssSourceId: "source-1"
    },
    disabled: false,
    isConnected: true,
    closest(selector) { return selector === "[data-ss-input-type]" ? this : null; },
    focus() { ownerDocument.activeElement = this; },
    click() { actionRoot.emit("click", { target: this, detail: 0 }); }
  };
  actionRoot.contains = node => node === control || node === host || host.children.includes(node);
  actionRoot.querySelectorAll = selector => selector === "[data-ss-input-type]" ? [control] : [];
  return { actionRoot, control, host };
}

function fakeCanvas() {
  const canvas = {
    attributes: new Map(),
    parentNode: null,
    style: {},
    tagName: "CANVAS",
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
  };
  return canvas;
}

function sceneContext() {
  const events = new FakeEventHub();
  let killedTweens = 0;
  return {
    add: new Proxy({}, { get() { throw new Error("Phaser must not render semantic objects"); } }),
    events,
    tweens: { killAll() { killedTweens += 1; } },
    get killedTweens() { return killedTweens; }
  };
}

const START_TRAVERSAL = Object.freeze({
  position: Object.freeze({ x: 0.1, y: 0.2 }),
  target: Object.freeze({ x: 0.9, y: 0.8 }),
  bounds: Object.freeze({ minX: 0, maxX: 1, minY: 0, maxY: 1 }),
  interactions: Object.freeze([
    Object.freeze({ id: "activity-ring", x: 0.9, y: 0.8, radius: 0.12 })
  ])
});

test("Task 4 stage surfaces consume the visual token authority without raw colors", async () => {
  const paths = [
    "../../src/features/soundSeekers/runtime/SoundSeekersStage.jsx",
    "../../src/features/soundSeekers/runtime/soundSeekersScene.js",
    "../../src/features/soundSeekers/runtime/inputBridge.js",
    "../../src/features/soundSeekers/ui/ActionLayer.jsx",
    "../../src/features/soundSeekers/ui/MissionHud.jsx"
  ];
  const rawColor = /(?:#[0-9a-f]{3,8}\b|(?:rgb|hsl)a?\s*\()/iu;
  for (const path of paths) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source, rawColor, path);
  }
});

test("traversal scene draws no semantic object, eases safely, and stops every late callback", () => {
  let assists = Object.freeze({ reducedMotion: false, slowerMovement: false });
  const positions = [];
  const config = createSoundSeekersScene({
    getTraversal: () => START_TRAVERSAL,
    getAssists: () => assists,
    onPosition: position => positions.push(position)
  });
  const context = sceneContext();
  config.create.call(context);
  config.update.call(context, 0, 16);
  assert.equal(positions.length, 1);
  assert.ok(positions[0].x > 0.1 && positions[0].x < 0.9);
  assert.ok(positions[0].y > 0.2 && positions[0].y < 0.8);
  assert.equal(positions[0].nearestInteractionId, null);

  assists = Object.freeze({ reducedMotion: true, slowerMovement: false });
  config.update.call(context, 16, 16);
  assert.deepEqual(positions.at(-1), {
    x: 0.9,
    y: 0.8,
    nearestInteractionId: "activity-ring"
  });
  assert.equal(Object.isFrozen(positions.at(-1)), true);
  config.update.call(context, 24, 16);
  assert.equal(positions.length, 2, "settled traversal must not trigger duplicate React renders");

  context.events.emit("shutdown");
  assert.equal(context.killedTweens, 1);
  assert.equal(context.events.listenerCount(), 0);
  config.update.call(context, 32, 16);
  assert.equal(positions.length, 2);
});

test("Strict Mode-style remount, model update, and unmount create no duplicate game or dispatch", async () => {
  const vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  const { createSoundSeekersStageRuntime } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/runtime/soundSeekersScene.js"
  );
  const trace = { created: 0, destroyed: 0, activeListeners: 0, duplicateDispatches: 0 };
  const dispatched = [];
  const configs = [];
  class FakeGame {
    constructor(config) {
      trace.created += 1;
      configs.push(config);
      this.config = config;
      this.canvas = fakeCanvas();
      config.parent.appendChild(this.canvas);
      this.context = sceneContext();
      config.scene.create.call(this.context);
    }

    destroy(removeCanvas) {
      assert.equal(removeCanvas, true);
      this.context.events.emit("shutdown");
      if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
      trace.destroyed += 1;
    }
  }
  const loadPhaser = async () => ({ AUTO: "AUTO", Game: FakeGame });

  try {
    for (let mount = 0; mount < 2; mount += 1) {
      const nodes = runtimeNodes();
      const runtime = createSoundSeekersStageRuntime({
        host: nodes.host,
        actionRoot: nodes.actionRoot,
        model: { traversal: START_TRAVERSAL },
        assists: { reducedMotion: false },
        onInput: input => dispatched.push(input),
        onTraversalPosition() {},
        loadPhaser
      });
      await runtime.ready;
      assert.equal(nodes.host.children.length, 1, "Phaser owns one child canvas while mounted");
      assert.equal(nodes.host.children[0].attributes.get("data-ss-phaser-canvas"), "");
      runtime.update({
        model: {
          traversal: {
            ...START_TRAVERSAL,
            target: { x: 0.25, y: 0.35 }
          }
        },
        assists: { reducedMotion: true },
        onInput: input => dispatched.push(input),
        onTraversalPosition() {}
      });
      assert.equal(trace.created, mount + 1, "model updates must not reconstruct Phaser");
      nodes.control.click();
      runtime.destroy();
      runtime.destroy();
      assert.equal(nodes.host.children.length, 0, "Phaser removes only its child canvas");
      trace.activeListeners += nodes.host.listenerCount() + nodes.actionRoot.listenerCount();
    }
    trace.duplicateDispatches = dispatched.length - 2;
    assert.deepEqual(trace, {
      created: 2,
      destroyed: 2,
      activeListeners: 0,
      duplicateDispatches: 0
    });
    assert.equal(configs.every(config => config.type === "AUTO"), true);
    assert.equal(configs.every(config => config.parent), true);
    assert.equal(configs.every(config => !Object.hasOwn(config, "canvas")), true);
    assert.equal(configs.every(config => config.scene.key === "SoundSeekersTraversal"), true);
  } finally {
    await vite.close();
  }
});

test("late Phaser resolution and Phaser failure preserve the semantic input bridge", async () => {
  const vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  const { createSoundSeekersStageRuntime } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/runtime/soundSeekersScene.js"
  );
  try {
    let resolveLoader;
    let created = 0;
    const deferred = new Promise(resolve => { resolveLoader = resolve; });
    const lateNodes = runtimeNodes();
    const late = createSoundSeekersStageRuntime({
      host: lateNodes.host,
      actionRoot: lateNodes.actionRoot,
      model: { traversal: START_TRAVERSAL },
      assists: {},
      onInput() {},
      onTraversalPosition() {},
      loadPhaser: () => deferred
    });
    late.destroy();
    resolveLoader({ AUTO: 0, Game: class { constructor() { created += 1; } } });
    await late.ready;
    assert.equal(created, 0);

    const failedNodes = runtimeNodes();
    const statuses = [];
    const dispatched = [];
    const failed = createSoundSeekersStageRuntime({
      host: failedNodes.host,
      actionRoot: failedNodes.actionRoot,
      model: { traversal: START_TRAVERSAL },
      assists: {},
      onInput: input => dispatched.push(input),
      onTraversalPosition() {},
      onStatus: status => statuses.push(status),
      loadPhaser: async () => { throw new Error("WebGL unavailable"); }
    });
    assert.equal(await failed.ready, null);
    failedNodes.control.click();
    assert.deepEqual(dispatched, [{
      type: "confirm_candidate",
      targetId: "candidate-1",
      sourceId: "source-1"
    }]);
    assert.deepEqual(statuses, ["loading", "unavailable"]);
    failed.destroy();
    assert.equal(failedNodes.host.listenerCount() + failedNodes.actionRoot.listenerCount(), 0);
  } finally {
    await vite.close();
  }
});

test("React remains the sole world, story-option, and cast renderer around traversal-only Phaser", async () => {
  const vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  const { SoundSeekersStage } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/runtime/SoundSeekersStage.jsx"
  );
  try {
    const { toChildConnectedTextScene } = await vite.ssrLoadModule(
      "/src/features/soundSeekers/content/connectedText.js"
    );
    const childScene = toChildConnectedTextScene("scene-s1", "stage-lifecycle-test");
    const html = renderToStaticMarkup(React.createElement(SoundSeekersStage, {
      model: {
        childScene,
        sceneVisualProps: {
          childScene: { forged: true },
          activeAttemptId: null,
          reducerRevision: null,
          sceneAccess: null,
          cropProfile: "landscape",
          densityProfile: "full",
          motionProfile: "reduced",
          compositionMode: "ordinary"
        },
        traversal: START_TRAVERSAL,
        activity: null,
        hud: {
          title: "Seedwake trail",
          locationLabel: "Meadow gate",
          progress: { current: 1, total: 5, label: "Stop 1 of 5" },
          controls: []
        }
      },
      assists: { simplifiedScene: false, reducedMotion: true },
      audioController: { request() {} },
      onInput() {}
    }));
    assert.equal((html.match(/data-code-native-world=""/gu) ?? []).length, 1);
    assert.equal((html.match(/data-sound-seekers-scene=""/gu) ?? []).length, 1);
    assert.ok((html.match(/data-character-id="player"/gu) ?? []).length <= 1);
    assert.equal((html.match(/data-ss-live-avatar/gu) ?? []).length, 0);
    assert.equal((html.match(/data-option-visual-id=/gu) ?? []).length, childScene.choice.options.length);
    assert.match(html, /data-ss-phaser-host=""/u);
    assert.match(html, /data-ss-phaser-role="traversal-only"/u);
    assert.match(html, /aria-hidden="true"[^>]*tabindex="-1"/u);
    assert.doesNotMatch(html, /<canvas/u);
    assert.doesNotMatch(html, /data-ss-action-layer/u);
    assert.doesNotMatch(html, /data-(?:answer|correct|expected-token)/iu);
  } finally {
    await vite.close();
  }
});

test("the non-story fallback keeps visible 56px traversal controls without quiz data", async () => {
  const vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  const { SoundSeekersStage } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/runtime/SoundSeekersStage.jsx"
  );
  try {
    const { createCharacterAppearance } = await vite.ssrLoadModule(
      "/src/features/soundSeekers/visual/characterCustomization.js"
    );
    const appearance = createCharacterAppearance({
      schemaVersion: 1,
      bodyShapeId: "body-shape-sprout",
      paletteTokenId: "player-palette-river",
      accessories: {
        back: "gear-back-field-pack",
        head: "gear-head-leaf-cap",
        neck: "gear-neck-scout-scarf",
        held: "gear-held-listening-shell"
      }
    });
    const html = renderToStaticMarkup(React.createElement(SoundSeekersStage, {
      model: {
        avatar: { characterId: "player", pose: "idle", appearance },
        traversal: START_TRAVERSAL,
        activity: null,
        hud: null
      },
      assists: { simplifiedScene: true, reducedMotion: true },
      audioController: { request() {} },
      onInput() {}
    }));
    assert.match(html, /data-ss-fallback-world=""/u);
    assert.match(html, /data-ss-fallback-controls=""/u);
    assert.match(html, /data-ss-live-avatar=""/u);
    assert.equal((html.match(/data-character-id="player"/gu) ?? []).length, 1);
    assert.match(html, /data-traversal-x="0\.1"/u);
    assert.match(html, /left:10%/u);
    assert.match(html, /data-appearance-signature="sound-seekers-appearance:/u);
    assert.match(html, /data-ss-phaser-host=""/u);
    assert.doesNotMatch(html, /<canvas/u);
    assert.equal((html.match(/data-ss-input-type="traverse"/gu) ?? []).length, 4);
    assert.equal((html.match(/min-height:56px/gu) ?? []).length, 4);
    assert.match(html, /data-ss-input-value="left"/u);
    assert.match(html, /data-motion-profile="reduced"/u);
    assert.doesNotMatch(html, /data-(?:answer|correct|expected-token)/iu);

    for (const avatar of [
      undefined,
      { characterId: "resident", pose: "idle", appearance },
      { characterId: "player", pose: "idle", appearance, fallback: true }
    ]) {
      assert.throws(() => renderToStaticMarkup(React.createElement(SoundSeekersStage, {
        model: { avatar, traversal: START_TRAVERSAL, activity: null, hud: null },
        onInput() {}
      })), /avatar/iu);
    }
    assert.throws(() => renderToStaticMarkup(React.createElement(SoundSeekersStage, {
      model: {
        avatar: { characterId: "player", pose: "idle", appearance },
        traversal: START_TRAVERSAL,
        activity: null,
        hud: null,
        biomeProps: { scenePresentation: { characters: [{ characterId: "player" }] } }
      },
      onInput() {}
    })), /exclude.*player|player.*avatar/iu);
  } finally {
    await vite.close();
  }
});

test("action and HUD controls remain 56px, separated, focus-visible, reduced-motion, and answer-neutral", async () => {
  const vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  const { ActionLayer } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/ui/ActionLayer.jsx"
  );
  const { MissionHud } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/ui/MissionHud.jsx"
  );
  const activity = Object.freeze({
    id: "sound-sort-1",
    kind: "sound_sort",
    instruction: Object.freeze({
      visibleText: "Listen, then place the sound card.",
      spokenText: "Listen, then place the sound card.",
      audioRequest: null
    }),
    correction: null,
    feedback: "Choose one card.",
    controls: Object.freeze([
      Object.freeze({
        id: "card-1",
        label: "Place sound card",
        input: Object.freeze({ type: "place", targetId: "bin-1", sourceId: "card-1" }),
        audioRequest: null,
        disabled: false
      }),
      Object.freeze({
        id: "replay-1",
        label: "Hear it again",
        input: Object.freeze({ type: "replay", targetId: "instruction-1", sourceId: "replay-1" }),
        audioRequest: Object.freeze({ cueId: "cue-1", audioKey: "audio-1", kind: "instruction" }),
        disabled: false
      })
    ])
  });
  try {
    const actionHtml = renderToStaticMarkup(React.createElement(ActionLayer, {
      activity,
      assists: { reducedMotion: true },
      onInput() {},
      onAudioRequest() {}
    }));
    assert.match(actionHtml, /data-ss-action-layer=""/u);
    assert.match(actionHtml, /data-motion-profile="reduced"/u);
    assert.equal((actionHtml.match(/min-height:56px/gu) ?? []).length, 2);
    assert.equal((actionHtml.match(/min-width:56px/gu) ?? []).length, 2);
    assert.match(actionHtml, /gap:8px/u);
    assert.match(actionHtml, /:focus-visible/u);
    assert.match(actionHtml, /role="status"/u);
    assert.doesNotMatch(actionHtml, /data-(?:answer|correct|expected-token)/iu);
    assert.doesNotMatch(actionHtml, /complete|finish/iu);

    const hudHtml = renderToStaticMarkup(React.createElement(MissionHud, {
      model: {
        title: "Seedwake trail",
        locationLabel: "Meadow gate",
        progress: { current: 2, total: 5, label: "Stop 2 of 5" },
        controls: [{
          id: "help",
          label: "Trail help",
          input: { type: "help", targetId: "trail", sourceId: "hud" }
        }]
      },
      onInput() {}
    }));
    assert.match(hudHtml, /aria-valuenow="2"/u);
    assert.match(hudHtml, /aria-valuemax="5"/u);
    assert.match(hudHtml, /min-height:56px/u);
    assert.doesNotMatch(hudHtml, /quiz|score|correct|answer/iu);

    assert.throws(() => renderToStaticMarkup(React.createElement(ActionLayer, {
      activity: {
        ...activity,
        controls: [{
          ...activity.controls[0],
          input: { type: "submit_correct_answer", targetId: "private" }
        }]
      },
      onInput() {}
    })), /incomplete|invalid|private/iu);
    assert.throws(() => renderToStaticMarkup(React.createElement(MissionHud, {
      model: {
        title: "Seedwake trail",
        locationLabel: "Meadow gate",
        progress: { current: 2, total: 5, label: "Stop 2 of 5" },
        controls: [{
          id: "unsafe",
          label: "Unsafe",
          input: { type: "reveal_answer", targetId: "private" }
        }]
      },
      onInput() {}
    })), /invalid|private/iu);
  } finally {
    await vite.close();
  }
});
