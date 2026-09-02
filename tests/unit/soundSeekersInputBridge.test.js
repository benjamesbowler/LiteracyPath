import assert from "node:assert/strict";
import test from "node:test";

import { createInputBridge } from "../../src/features/soundSeekers/runtime/inputBridge.js";

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

  emit(type, init = {}) {
    const event = {
      type,
      target: this,
      currentTarget: this,
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
      ...init
    };
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(event);
    return event;
  }

  listenerCount() {
    return [...this.listeners.values()].reduce((total, listeners) => total + listeners.length, 0);
  }
}

function semanticControl(root, ownerDocument, {
  id,
  inputType = "confirm_candidate",
  targetId = id,
  sourceId = "source-2",
  value = undefined
}) {
  const control = {
    dataset: {
      ssInputType: inputType,
      ssTargetId: targetId,
      ssSourceId: sourceId,
      ...(value === undefined ? {} : { ssInputValue: value })
    },
    disabled: false,
    isConnected: true,
    closest(selector) {
      return selector.includes("[data-ss-input-type]") ? this : null;
    },
    focus() {
      ownerDocument.activeElement = this;
    },
    click() {
      root.emit("click", { target: this, detail: 0 });
    }
  };
  return control;
}

function bridgeFixture() {
  const ownerDocument = { activeElement: null };
  const canvas = new FakeEventHub();
  canvas.ownerDocument = ownerDocument;
  canvas.getBoundingClientRect = () => ({ left: 10, top: 20, width: 200, height: 100 });
  const actionRoot = new FakeEventHub();
  actionRoot.ownerDocument = ownerDocument;
  const controls = [
    semanticControl(actionRoot, ownerDocument, { id: "choice-1" }),
    semanticControl(actionRoot, ownerDocument, { id: "choice-2" })
  ];
  actionRoot.contains = node => controls.includes(node);
  actionRoot.querySelectorAll = selector => selector.includes("[data-ss-input-type]") ? controls : [];
  return { actionRoot, canvas, controls, ownerDocument };
}

function activateLikeBrowser(root, control, pointerType) {
  const pointerId = pointerType === "touch" ? 7 : 3;
  root.emit("pointerdown", { target: control, pointerId, pointerType });
  root.emit("pointerup", { target: control, pointerId, pointerType });
  root.emit("click", { target: control, pointerId, pointerType, detail: 1 });
}

test("pointer, touch, keyboard, and switch activation dispatch one identical semantic input", () => {
  const traces = {};
  for (const modality of ["pointer", "touch", "keyboard", "switchFocus"]) {
    const fixture = bridgeFixture();
    const dispatched = [];
    const bridge = createInputBridge({
      canvas: fixture.canvas,
      actionRoot: fixture.actionRoot,
      dispatch: input => dispatched.push(input)
    });
    if (modality === "pointer") activateLikeBrowser(fixture.actionRoot, fixture.controls[1], "mouse");
    if (modality === "touch") activateLikeBrowser(fixture.actionRoot, fixture.controls[1], "touch");
    if (modality === "keyboard") fixture.actionRoot.emit("click", {
      target: fixture.controls[1], detail: 0
    });
    if (modality === "switchFocus") {
      bridge.scan();
      bridge.scan();
      bridge.activate();
    }
    traces[modality] = dispatched;
    bridge.destroy();
  }

  const expected = [{
    type: "confirm_candidate",
    targetId: "choice-2",
    sourceId: "source-2"
  }];
  assert.deepEqual(traces.pointer, expected);
  assert.deepEqual(traces.touch, expected);
  assert.deepEqual(traces.keyboard, expected);
  assert.deepEqual(traces.switchFocus, expected);
  assert.equal(Object.isFrozen(traces.pointer[0]), true);
});

test("pointer cancellation and lost capture never dispatch traversal", () => {
  for (const releaseType of ["pointercancel", "lostpointercapture"]) {
    const fixture = bridgeFixture();
    const dispatched = [];
    const bridge = createInputBridge({
      canvas: fixture.canvas,
      actionRoot: fixture.actionRoot,
      dispatch: input => dispatched.push(input)
    });
    fixture.canvas.emit("pointerdown", {
      pointerId: 4, pointerType: "touch", clientX: 70, clientY: 50
    });
    fixture.canvas.emit(releaseType, {
      pointerId: 4, pointerType: "touch", clientX: 90, clientY: 60
    });
    fixture.canvas.emit("pointerup", {
      pointerId: 4, pointerType: "touch", clientX: 90, clientY: 60
    });
    assert.deepEqual(dispatched, [], releaseType);
    bridge.destroy();
  }
});

test("a canceled semantic-control pointer cannot leak a synthetic click or block a keyboard click", () => {
  for (const releaseType of ["pointercancel", "lostpointercapture"]) {
    const fixture = bridgeFixture();
    const dispatched = [];
    const bridge = createInputBridge({
      canvas: fixture.canvas,
      actionRoot: fixture.actionRoot,
      dispatch: input => dispatched.push(input)
    });
    fixture.actionRoot.emit("pointerdown", {
      target: fixture.controls[0],
      pointerId: 9,
      pointerType: "touch"
    });
    fixture.actionRoot.emit(releaseType, {
      target: fixture.controls[0],
      pointerId: 9,
      pointerType: "touch"
    });
    fixture.actionRoot.emit("click", {
      target: fixture.controls[0],
      ...(releaseType === "pointercancel" ? { pointerId: 9 } : {}),
      pointerType: "touch",
      detail: 1
    });
    assert.deepEqual(dispatched, [], releaseType);

    fixture.actionRoot.emit("click", { target: fixture.controls[0], detail: 0 });
    assert.equal(dispatched.length, 1, `${releaseType} must not suppress keyboard activation`);
    bridge.destroy();
  }
});

test("canvas pointer release, arrows, WASD, Escape, Enter, and Space share canonical controls", () => {
  const fixture = bridgeFixture();
  const dispatched = [];
  const bridge = createInputBridge({
    canvas: fixture.canvas,
    actionRoot: fixture.actionRoot,
    dispatch: input => dispatched.push(input)
  });

  fixture.canvas.emit("pointerdown", {
    pointerId: 2, pointerType: "touch", clientX: 110, clientY: 45
  });
  fixture.canvas.emit("pointerup", {
    pointerId: 2, pointerType: "touch", clientX: 110, clientY: 45
  });
  for (const key of ["ArrowLeft", "d", "W", "s", "Escape"]) {
    fixture.canvas.emit("keydown", { key, repeat: false });
  }
  fixture.controls[0].focus();
  for (const key of ["Enter", " "]) fixture.canvas.emit("keydown", { key, repeat: false });

  assert.deepEqual(dispatched, [
    { type: "travel", position: { x: 0.5, y: 0.25 } },
    { type: "traverse", value: "left" },
    { type: "traverse", value: "right" },
    { type: "traverse", value: "up" },
    { type: "traverse", value: "down" },
    { type: "back" },
    { type: "confirm_candidate", targetId: "choice-1", sourceId: "source-2" },
    { type: "confirm_candidate", targetId: "choice-1", sourceId: "source-2" }
  ]);
  assert.equal(Object.isFrozen(dispatched[0].position), true);
  bridge.destroy();
});

test("switch scanning activates the existing connected-text option without intercepting its React choice", () => {
  const ownerDocument = { activeElement: null };
  const canvas = new FakeEventHub();
  canvas.ownerDocument = ownerDocument;
  const actionRoot = new FakeEventHub();
  actionRoot.ownerDocument = ownerDocument;
  const dispatched = [];
  const option = {
    dataset: { optionToken: "story-choice-a" },
    disabled: false,
    isConnected: true,
    closest(selector) {
      return selector.includes("[data-option-token]") ? this : null;
    },
    focus() {
      ownerDocument.activeElement = this;
    },
    click() {
      const event = actionRoot.emit("click", { target: this, detail: 0 });
      if (!event.defaultPrevented) dispatched.push(Object.freeze({
        type: "choose",
        token: this.dataset.optionToken
      }));
    }
  };
  actionRoot.contains = node => node === option;
  actionRoot.querySelectorAll = selector => selector.includes("[data-option-token]") ? [option] : [];
  const bridge = createInputBridge({
    canvas,
    actionRoot,
    dispatch: input => dispatched.push(input)
  });

  assert.equal(bridge.scan(), option);
  assert.equal(bridge.activate(), option);
  assert.deepEqual(dispatched, [{ type: "choose", token: "story-choice-a" }]);

  dispatched.length = 0;
  option.focus();
  const keyEvent = actionRoot.emit("keydown", {
    target: option,
    key: "Enter",
    repeat: false
  });
  assert.equal(keyEvent.defaultPrevented, false, "native option keyboard activation stays native");
  option.click();
  assert.deepEqual(dispatched, [{ type: "choose", token: "story-choice-a" }]);
  bridge.destroy();
});

test("switch scan skips disabled controls, wraps, and destroy removes every listener", () => {
  const fixture = bridgeFixture();
  fixture.controls[0].disabled = true;
  const dispatched = [];
  const bridge = createInputBridge({
    canvas: fixture.canvas,
    actionRoot: fixture.actionRoot,
    dispatch: input => dispatched.push(input)
  });

  assert.equal(bridge.scan(), fixture.controls[1]);
  assert.equal(bridge.scan(), fixture.controls[1]);
  bridge.activate();
  assert.equal(dispatched.length, 1);
  assert.ok(fixture.canvas.listenerCount() > 0);
  assert.ok(fixture.actionRoot.listenerCount() > 0);

  bridge.destroy();
  bridge.destroy();
  assert.equal(fixture.canvas.listenerCount(), 0);
  assert.equal(fixture.actionRoot.listenerCount(), 0);
  fixture.actionRoot.emit("click", { target: fixture.controls[1] });
  assert.equal(dispatched.length, 1);
});

test("bridge rejects malformed nodes and never copies answer or correctness data", () => {
  const fixture = bridgeFixture();
  fixture.controls[0].dataset.ssAnswer = "private-answer";
  fixture.controls[0].dataset.ssCorrect = "true";
  const dispatched = [];
  const bridge = createInputBridge({
    canvas: fixture.canvas,
    actionRoot: fixture.actionRoot,
    dispatch: input => dispatched.push(input)
  });
  fixture.controls[0].click();
  assert.deepEqual(dispatched, [{
    type: "confirm_candidate",
    targetId: "choice-1",
    sourceId: "source-2"
  }]);
  assert.doesNotMatch(JSON.stringify(dispatched), /answer|correct|expected/iu);
  bridge.destroy();

  assert.throws(() => createInputBridge({
    canvas: null,
    actionRoot: fixture.actionRoot,
    dispatch() {}
  }), /canvas/iu);
});
