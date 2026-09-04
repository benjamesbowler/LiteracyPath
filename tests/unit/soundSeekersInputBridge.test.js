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
      propagationStopped: false,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.propagationStopped = true; },
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
  value = undefined,
  primary = false
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
    hasAttribute(name) {
      return name === "data-ss-primary-control" && primary;
    },
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

test("a focused game shell shares movement keys and activates the marked learning control", () => {
  const fixture = bridgeFixture();
  const keyboardRoot = new FakeEventHub();
  keyboardRoot.ownerDocument = fixture.ownerDocument;
  keyboardRoot.contains = node => node === fixture.actionRoot || fixture.actionRoot.contains(node);
  fixture.controls[1].hasAttribute = name => name === "data-ss-primary-control";
  const dispatched = [];
  const bridge = createInputBridge({
    canvas: fixture.canvas,
    actionRoot: fixture.actionRoot,
    keyboardRoot,
    dispatch: input => dispatched.push(input)
  });

  fixture.ownerDocument.activeElement = keyboardRoot;
  keyboardRoot.emit("keydown", { key: "ArrowRight", repeat: false });
  keyboardRoot.emit("keydown", { key: "d", repeat: false });
  keyboardRoot.emit("keydown", { key: "Enter", repeat: false });
  keyboardRoot.emit("keydown", { key: " ", repeat: false });

  assert.deepEqual(dispatched, [
    { type: "traverse", value: "right" },
    { type: "traverse", value: "right" },
    { type: "confirm_candidate", targetId: "choice-2", sourceId: "source-2" },
    { type: "confirm_candidate", targetId: "choice-2", sourceId: "source-2" }
  ]);
  bridge.destroy();
  assert.equal(keyboardRoot.listenerCount(), 0);
});

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

  for (const [releaseType, pointerId] of [["pointercancel", 41], ["lostpointercapture", 42]]) {
    dispatched.length = 0;
    actionRoot.emit("pointerdown", { target: option, pointerId, pointerType: "touch" });
    actionRoot.emit(releaseType, { target: option, pointerId, pointerType: "touch" });
    const canceledClick = actionRoot.emit("click", {
      target: option,
      pointerId,
      pointerType: "touch",
      detail: 1
    });
    assert.equal(canceledClick.defaultPrevented, true, `${releaseType} compatibility click`);
    assert.equal(canceledClick.propagationStopped, true, `${releaseType} React choice handler`);
    assert.deepEqual(dispatched, [], releaseType);
  }
  bridge.destroy();
});

test("model-controlled actions keep their exact projected input across click, keyboard, switch, and cancellation", () => {
  const ownerDocument = { activeElement: null };
  const canvas = new FakeEventHub();
  canvas.ownerDocument = ownerDocument;
  const actionRoot = new FakeEventHub();
  actionRoot.ownerDocument = ownerDocument;
  const projectedInput = Object.freeze({
    type: "narrative_choice",
    choiceId: "story-choice-a",
    token: "story-token-a"
  });
  const reactInputs = [];
  let fieldsetDisabled = false;
  const control = {
    dataset: { ssModelControl: "" },
    disabled: false,
    isConnected: true,
    closest(selector) {
      return selector.includes("[data-ss-model-control]") ? this : null;
    },
    matches(selector) {
      return selector === ":disabled" && fieldsetDisabled;
    },
    focus() {
      ownerDocument.activeElement = this;
    },
    click() {
      const event = actionRoot.emit("click", { target: this, detail: 0 });
      if (!event.defaultPrevented && !event.propagationStopped) reactInputs.push(projectedInput);
    }
  };
  actionRoot.contains = node => node === control;
  actionRoot.querySelectorAll = selector => selector.includes("[data-ss-model-control]")
    ? [control] : [];
  const bridgeInputs = [];
  const bridge = createInputBridge({
    canvas,
    actionRoot,
    dispatch: input => bridgeInputs.push(input)
  });

  control.click();
  assert.strictEqual(reactInputs[0], projectedInput);
  assert.deepEqual(bridgeInputs, []);

  reactInputs.length = 0;
  assert.equal(bridge.scan(), control);
  assert.equal(bridge.activate(), control);
  assert.strictEqual(reactInputs[0], projectedInput);

  reactInputs.length = 0;
  const keyEvent = actionRoot.emit("keydown", { target: control, key: "Enter", repeat: false });
  assert.equal(keyEvent.defaultPrevented, false);
  control.click();
  assert.strictEqual(reactInputs[0], projectedInput);

  for (const [releaseType, pointerId] of [["pointercancel", 61], ["lostpointercapture", 62]]) {
    reactInputs.length = 0;
    actionRoot.emit("pointerdown", { target: control, pointerId, pointerType: "touch" });
    actionRoot.emit(releaseType, { target: control, pointerId, pointerType: "touch" });
    control.click = () => {
      const event = actionRoot.emit("click", {
        target: control, pointerId, pointerType: "touch", detail: 1
      });
      if (!event.defaultPrevented && !event.propagationStopped) reactInputs.push(projectedInput);
    };
    control.click();
    assert.deepEqual(reactInputs, [], releaseType);
  }

  fieldsetDisabled = true;
  assert.equal(bridge.scan(), null, "a disabled fieldset descendant must not be switch-scannable");
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
