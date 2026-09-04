const BRIDGE_CONTROL_SELECTOR = "[data-ss-input-type]";
const CONNECTED_TEXT_CONTROL_SELECTOR = "[data-option-token]";
const MODEL_CONTROL_SELECTOR = "[data-ss-model-control]";
const SCANNABLE_CONTROL_SELECTOR = [
  BRIDGE_CONTROL_SELECTOR,
  CONNECTED_TEXT_CONTROL_SELECTOR,
  MODEL_CONTROL_SELECTOR
].join(", ");
const ACTIVATION_DISPOSITIONS = new WeakMap();
const SAFE_INPUT_ID = /^[a-z][a-z0-9_-]*$/u;
const FORBIDDEN_INPUT_KEY = /(?:^|[_-])(?:answer|correct|correctness|expected|evidence|score)(?:[_-]|$)/iu;
const DIRECTION_BY_KEY = Object.freeze({
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  a: "left",
  d: "right",
  w: "up",
  s: "down"
});

function eventTarget(value, name) {
  if (!value || typeof value.addEventListener !== "function"
    || typeof value.removeEventListener !== "function") {
    throw new TypeError(`Sound Seekers ${name} must be an event target`);
  }
  return value;
}

function requiredFunction(value, name) {
  if (typeof value !== "function") throw new TypeError(`Sound Seekers ${name} must be a function`);
  return value;
}

function nonempty(value) {
  return typeof value === "string" && Boolean(value.trim());
}

function controlDisabled(control) {
  return control?.disabled === true
    || control?.getAttribute?.("aria-disabled") === "true"
    || control?.matches?.(":disabled") === true;
}

function scannableControlForEvent(actionRoot, event) {
  const control = event?.target?.closest?.(BRIDGE_CONTROL_SELECTOR)
    ?? event?.target?.closest?.(CONNECTED_TEXT_CONTROL_SELECTOR)
    ?? event?.target?.closest?.(MODEL_CONTROL_SELECTOR)
    ?? null;
  if (!control || !actionRoot.contains?.(control) || controlDisabled(control)) return null;
  return control;
}

function semanticInputForControl(control) {
  const type = control?.dataset?.ssInputType;
  if (!nonempty(type) || !SAFE_INPUT_ID.test(type) || FORBIDDEN_INPUT_KEY.test(type)) return null;
  const entries = [["type", type]];
  for (const [key, dataKey] of [
    ["targetId", "ssTargetId"],
    ["sourceId", "ssSourceId"],
    ["value", "ssInputValue"],
    ["choiceId", "ssChoiceId"],
    ["token", "ssOptionToken"],
    ["segmentId", "ssSegmentId"],
    ["recipientId", "ssRecipientId"],
    ["meaningSemanticId", "ssMeaningSemanticId"],
    ["candidateId", "ssCandidateId"],
    ["itemId", "ssItemId"],
    ["binId", "ssBinId"],
    ["tileId", "ssTileId"],
    ["slotId", "ssSlotId"]
  ]) {
    const value = control.dataset?.[dataKey];
    if (nonempty(value) && !FORBIDDEN_INPUT_KEY.test(key)) entries.push([key, value]);
  }
  for (const [key, dataKey] of [["dx", "ssDx"], ["dy", "ssDy"]]) {
    const raw = control.dataset?.[dataKey];
    if (raw === undefined) continue;
    const value = Number(raw);
    if (!Number.isFinite(value)) return null;
    entries.push([key, value]);
  }
  return Object.freeze(Object.fromEntries(entries));
}

function normalizedPointerPosition(canvas, event) {
  const rect = canvas.getBoundingClientRect?.();
  if (!rect || !(rect.width > 0) || !(rect.height > 0)
    || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return null;
  const clamp = value => Math.min(1, Math.max(0, value));
  return Object.freeze({
    x: clamp((event.clientX - rect.left) / rect.width),
    y: clamp((event.clientY - rect.top) / rect.height)
  });
}

function focusableControls(actionRoot) {
  return [...(actionRoot.querySelectorAll?.(SCANNABLE_CONTROL_SELECTOR) ?? [])]
    .filter(control => control.isConnected !== false && !controlDisabled(control));
}

function textEntryTarget(target) {
  const tagName = String(target?.tagName || "").toLocaleLowerCase("en-US");
  return target?.isContentEditable === true || tagName === "input" || tagName === "textarea"
    || tagName === "select";
}

function nativeActivationEvent(event) {
  const candidate = event?.nativeEvent ?? event;
  return candidate && (typeof candidate === "object" || typeof candidate === "function")
    ? candidate : null;
}

function setActivationDisposition(event, disposition) {
  const nativeEvent = nativeActivationEvent(event);
  if (nativeEvent) ACTIVATION_DISPOSITIONS.set(nativeEvent, disposition);
}

export function getSoundSeekersActivationDisposition(event) {
  const nativeEvent = nativeActivationEvent(event);
  return nativeEvent ? ACTIVATION_DISPOSITIONS.get(nativeEvent) ?? "unmanaged" : "unmanaged";
}

export function createInputBridge({ canvas, actionRoot, keyboardRoot = actionRoot, dispatch }) {
  eventTarget(canvas, "canvas");
  eventTarget(actionRoot, "action root");
  eventTarget(keyboardRoot, "keyboard root");
  requiredFunction(dispatch, "input dispatch");

  let destroyed = false;
  let scanIndex = -1;
  const canvasPointers = new Set();
  const actionPointers = new Map();
  const canceledActionPointers = new Map();
  const listeners = [];

  const listen = (target, type, listener, options = undefined) => {
    target.addEventListener(type, listener, options);
    listeners.push([target, type, listener, options]);
  };
  const emit = input => {
    if (destroyed || !input) return false;
    dispatch(input);
    return true;
  };
  const controls = () => focusableControls(actionRoot);
  const currentControl = () => {
    const candidates = controls();
    const focused = actionRoot.ownerDocument?.activeElement;
    if (candidates.includes(focused)) return focused;
    const primary = candidates.find(control => control.hasAttribute?.("data-ss-primary-control"));
    if (primary) return primary;
    return candidates[scanIndex] ?? null;
  };
  const scan = () => {
    if (destroyed) return null;
    const candidates = controls();
    if (!candidates.length) {
      scanIndex = -1;
      return null;
    }
    const focusedIndex = candidates.indexOf(actionRoot.ownerDocument?.activeElement);
    scanIndex = (focusedIndex >= 0 ? focusedIndex + 1 : scanIndex + 1) % candidates.length;
    const control = candidates[scanIndex];
    control.focus?.({ preventScroll: false });
    return control;
  };
  const activate = () => {
    if (destroyed) return null;
    const control = currentControl() ?? scan();
    if (!control) return null;
    control.click?.();
    return control;
  };

  const onSemanticClick = event => {
    const control = scannableControlForEvent(actionRoot, event);
    let canceledPointerId = null;
    if (Number.isFinite(event?.pointerId)
      && canceledActionPointers.get(event.pointerId) === control) {
      canceledPointerId = event.pointerId;
    } else if (control && Number(event?.detail) > 0 && !Number.isFinite(event?.pointerId)) {
      canceledPointerId = [...canceledActionPointers.entries()]
        .find(([, pressedControl]) => pressedControl === control)?.[0] ?? null;
    }
    if (canceledPointerId !== null) {
      canceledActionPointers.delete(canceledPointerId);
      setActivationDisposition(event, "canceled");
      event.preventDefault?.();
      if (!semanticInputForControl(control)) event.stopPropagation?.();
      return;
    }
    const input = semanticInputForControl(control);
    if (!input) return;
    setActivationDisposition(event, "bridge-handled");
    event.preventDefault?.();
    emit(input);
  };
  const onActionPointerDown = event => {
    const control = scannableControlForEvent(actionRoot, event);
    if (control && Number.isFinite(event.pointerId)) {
      canceledActionPointers.delete(event.pointerId);
      for (const [pointerId, pressedControl] of canceledActionPointers.entries()) {
        if (pressedControl === control) canceledActionPointers.delete(pointerId);
      }
      actionPointers.set(event.pointerId, control);
    }
  };
  const onActionPointerUp = event => {
    if (!Number.isFinite(event.pointerId)) return;
    const pressedControl = actionPointers.get(event.pointerId);
    actionPointers.delete(event.pointerId);
    if (pressedControl && scannableControlForEvent(actionRoot, event) !== pressedControl) {
      canceledActionPointers.set(event.pointerId, pressedControl);
    }
  };
  const cancelActionPointer = event => {
    if (!Number.isFinite(event.pointerId)) return;
    const pressedControl = actionPointers.get(event.pointerId);
    actionPointers.delete(event.pointerId);
    if (pressedControl) canceledActionPointers.set(event.pointerId, pressedControl);
  };
  const onCanvasPointerDown = event => {
    if (event.isPrimary === false || (Number.isFinite(event.button) && event.button !== 0)) return;
    if (Number.isFinite(event.pointerId)) {
      canvasPointers.add(event.pointerId);
      try { canvas.setPointerCapture?.(event.pointerId); } catch { /* capture is optional */ }
    }
  };
  const clearCanvasPointer = event => {
    if (Number.isFinite(event.pointerId)) canvasPointers.delete(event.pointerId);
  };
  const onCanvasPointerUp = event => {
    if (!Number.isFinite(event.pointerId) || !canvasPointers.delete(event.pointerId)) return;
    const position = normalizedPointerPosition(canvas, event);
    if (position) emit(Object.freeze({ type: "travel", position }));
  };
  const onKeyDown = event => {
    if (destroyed || event.repeat || textEntryTarget(event.target)) return;
    const normalizedKey = typeof event.key === "string" && event.key.length === 1
      ? event.key.toLocaleLowerCase("en-US") : event.key;
    const direction = DIRECTION_BY_KEY[normalizedKey];
    if (direction) {
      event.preventDefault?.();
      emit(Object.freeze({ type: "traverse", value: direction }));
      return;
    }
    if (normalizedKey === "Escape") {
      event.preventDefault?.();
      emit(Object.freeze({ type: "back" }));
      return;
    }
    if ((normalizedKey === "Enter" || normalizedKey === " ")
      && !scannableControlForEvent(actionRoot, event)) {
      event.preventDefault?.();
      activate();
    }
  };
  const onSwitch = event => {
    if (event?.detail?.action === "scan") scan();
    if (event?.detail?.action === "activate") activate();
  };

  listen(actionRoot, "click", onSemanticClick, true);
  listen(actionRoot, "pointerdown", onActionPointerDown, true);
  listen(actionRoot, "pointerup", onActionPointerUp, true);
  listen(actionRoot, "pointercancel", cancelActionPointer, true);
  listen(actionRoot, "lostpointercapture", cancelActionPointer, true);
  listen(keyboardRoot, "keydown", onKeyDown);
  listen(actionRoot, "soundseekers:switch", onSwitch);
  listen(canvas, "pointerdown", onCanvasPointerDown);
  listen(canvas, "pointerup", onCanvasPointerUp);
  listen(canvas, "pointercancel", clearCanvasPointer);
  listen(canvas, "lostpointercapture", clearCanvasPointer);
  if (!keyboardRoot.contains?.(canvas)) listen(canvas, "keydown", onKeyDown);

  return Object.freeze({
    scan,
    activate,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      canvasPointers.clear();
      actionPointers.clear();
      canceledActionPointers.clear();
      for (const [target, type, listener, options] of listeners.splice(0)) {
        target.removeEventListener(type, listener, options);
      }
    }
  });
}
