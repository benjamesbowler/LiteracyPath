import { useId } from "react";
import { getSoundSeekersActivationDisposition } from "../runtime/inputBridge.js";
import { SOUND_SEEKERS_VISUAL_TOKENS } from "../visual/visualTokens.js";

const TOKEN_STYLE = Object.freeze(Object.fromEntries(
  Object.entries(SOUND_SEEKERS_VISUAL_TOKENS).map(([tokenId, value]) => (
    [`--ss-token-${tokenId}`, value]
  ))
));

const CONTROL_STYLE = Object.freeze({
  minHeight: 56,
  minWidth: 56,
  padding: "10px 14px",
  color: "var(--ss-token-ink-deep)",
  background: "var(--ss-token-surface-option)",
  border: "3px solid var(--ss-token-ink-deep)",
  borderRadius: 16,
  boxShadow: "0 4px 0 var(--ss-token-ink-muted)",
  font: "inherit",
  fontWeight: 800,
  cursor: "pointer"
});
const ROOT_STYLE = Object.freeze({
  ...TOKEN_STYLE,
  display: "grid",
  gap: 8,
  padding: 8,
  color: "var(--ss-token-ink-deep)",
  background: "var(--ss-token-surface-warm)",
  border: "3px solid var(--ss-token-ink-deep)",
  borderRadius: 20
});
const CONTROL_INPUT_KEYS = Object.freeze([
  "type", "targetId", "sourceId", "value", "choiceId", "token", "segmentId",
  "recipientId", "meaningSemanticId", "candidateId", "itemId", "binId", "tileId",
  "slotId", "dx", "dy"
]);
const MODEL_CONTROL_INPUT_KEYS = new Set(CONTROL_INPUT_KEYS);
const ACTIVATION_MODES = new Set(["bridge", "model"]);
const SAFE_INPUT_TYPE = /^[a-z][a-z0-9_-]*$/u;
const PRIVATE_INPUT_TYPE = /(?:^|[_-])(?:answer|correct|correctness|expected|evidence|score)(?:[_-]|$)/iu;
const FORBIDDEN_MODEL_KEYS = new Set([
  "answer", "answers", "correct", "correctness", "isCorrect", "expectedAnswer",
  "expectedToken", "evidence", "score"
]);

function nonempty(value) {
  return typeof value === "string" && Boolean(value.trim());
}

function containsForbiddenKey(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_MODEL_KEYS.has(key)) return true;
    if (containsForbiddenKey(child, seen)) return true;
  }
  return false;
}

function canonicalInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || !nonempty(value.type)
    || !SAFE_INPUT_TYPE.test(value.type)
    || PRIVATE_INPUT_TYPE.test(value.type)
    || Object.keys(value).some(key => !CONTROL_INPUT_KEYS.includes(key))) return null;
  const input = { type: value.type };
  for (const key of CONTROL_INPUT_KEYS.slice(1)) {
    if (["dx", "dy"].includes(key)) {
      if (Number.isFinite(value[key])) input[key] = value[key];
    } else if (nonempty(value[key])) input[key] = value[key];
  }
  return Object.freeze(input);
}

function projectedInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || !Object.isFrozen(value)
    || !nonempty(value.type)
    || !SAFE_INPUT_TYPE.test(value.type)
    || PRIVATE_INPUT_TYPE.test(value.type)
    || Reflect.ownKeys(value).some(key => typeof key !== "string"
      || !MODEL_CONTROL_INPUT_KEYS.has(key))
    || containsForbiddenKey(value)) return null;
  for (const [key, item] of Object.entries(value)) {
    if (key === "type") continue;
    if (["dx", "dy"].includes(key)) {
      if (!Number.isFinite(item)) return null;
    } else if (!nonempty(item)) return null;
  }
  return value;
}

function transcript(value) {
  return value && nonempty(value.visibleText) && value.visibleText === value.spokenText
    ? value : null;
}

function controlAttributes(input, activationMode) {
  if (activationMode === "model") {
    return {
      "data-ss-model-control": "",
      "data-ss-model-input-type": input.type
    };
  }
  const attributes = { "data-ss-input-type": input.type };
  for (const [key, dataName] of [
    ["targetId", "data-ss-target-id"],
    ["sourceId", "data-ss-source-id"],
    ["value", "data-ss-input-value"],
    ["choiceId", "data-ss-choice-id"],
    ["token", "data-ss-option-token"],
    ["segmentId", "data-ss-segment-id"],
    ["recipientId", "data-ss-recipient-id"],
    ["meaningSemanticId", "data-ss-meaning-semantic-id"],
    ["candidateId", "data-ss-candidate-id"],
    ["itemId", "data-ss-item-id"],
    ["binId", "data-ss-bin-id"],
    ["tileId", "data-ss-tile-id"],
    ["slotId", "data-ss-slot-id"],
    ["dx", "data-ss-dx"],
    ["dy", "data-ss-dy"]
  ]) {
    if (Object.hasOwn(input, key)) attributes[dataName] = String(input[key]);
  }
  return attributes;
}

export function ActionLayer({
  activity,
  assists = {},
  onInput,
  onAudioRequest = undefined,
  activationMode = "bridge"
}) {
  const headingId = useId();
  if (typeof onInput !== "function") throw new TypeError("Sound Seekers action input must be a function");
  if (!activity || typeof activity !== "object" || Array.isArray(activity)
    || containsForbiddenKey(activity)) {
    throw new TypeError("Sound Seekers action model is invalid or exposes private decision data");
  }
  if (!ACTIVATION_MODES.has(activationMode)) {
    throw new TypeError("Sound Seekers action activation mode is invalid");
  }
  const modelControlled = activationMode === "model";
  const instruction = transcript(activity.instruction);
  const correction = activity.correction === null ? null : transcript(activity.correction);
  const controls = Array.isArray(activity.controls) ? activity.controls.map(control => ({
    ...control,
    input: modelControlled ? projectedInput(control?.input) : canonicalInput(control?.input)
  })) : [];
  if (!nonempty(activity.id) || !nonempty(activity.kind) || !instruction
    || (activity.correction !== null && !correction)
    || controls.length < 1
    || controls.some(control => !nonempty(control.id) || !nonempty(control.label) || !control.input)) {
    throw new TypeError("Sound Seekers action model is incomplete");
  }
  const reducedMotion = assists.reducedMotion === true;
  const simplified = assists.simplifiedScene === true;
  const primaryControlId = controls.find(control => (
    control.disabled !== true && control.input.type !== "replay_instruction"
  ))?.id ?? null;

  return (
    <section
      style={ROOT_STYLE}
      className="ss-action-layer"
      aria-labelledby={headingId}
      data-ss-action-layer=""
      data-activity-id={activity.id}
      data-activity-kind={activity.kind}
      data-motion-profile={reducedMotion ? "reduced" : "full"}
      data-scene-profile={simplified ? "simplified" : "full"}
    >
      <style>{`
        .ss-action-layer__control:focus-visible {
          outline: 4px solid var(--ss-token-focus-gold);
          outline-offset: 3px;
        }
        [data-ss-action-layer][data-motion-profile="reduced"] * {
          animation: none !important;
          transition: none !important;
        }
      `}</style>
      <header>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Sound Seekers practice</p>
        <h2 id={headingId} style={{ margin: "2px 0 0", fontSize: "clamp(1.1rem, 4vw, 1.5rem)" }}>
          {instruction.visibleText}
        </h2>
      </header>
      {correction ? (
        <p role="alert" style={{ margin: 0, padding: 8, borderInlineStart: "5px solid var(--ss-token-focus-gold)" }}>
          {correction.visibleText}
        </p>
      ) : null}
      <div
        role="group"
        aria-label={instruction.visibleText}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))", gap: 8 }}
      >
        {controls.map(control => (
          <button
            key={control.id}
            className="ss-action-layer__control"
            type="button"
            style={{ ...CONTROL_STYLE, transition: reducedMotion ? "none" : "transform 160ms ease" }}
            disabled={control.disabled === true}
            aria-label={control.label}
            data-control-id={control.id}
            data-ss-primary-control={control.id === primaryControlId ? "" : undefined}
            {...controlAttributes(control.input, activationMode)}
            onClick={event => {
              const disposition = getSoundSeekersActivationDisposition(event);
              const legitimateActivation = disposition === "bridge-handled"
                || (disposition === "unmanaged" && !event.defaultPrevented);
              if (!legitimateActivation) return;
              if (disposition !== "bridge-handled") onInput(control.input);
              if (control.audioRequest && typeof onAudioRequest === "function") {
                onAudioRequest(control.audioRequest);
              }
            }}
          >
            {control.label}
          </button>
        ))}
      </div>
      {nonempty(activity.feedback) ? (
        <p role="status" aria-live="polite" style={{ minHeight: 24, margin: 0 }}>
          {activity.feedback}
        </p>
      ) : (
        <p role="status" aria-live="polite" style={{ minHeight: 24, margin: 0 }} />
      )}
    </section>
  );
}
