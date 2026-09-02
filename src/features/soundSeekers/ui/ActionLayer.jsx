import { useId } from "react";
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
const CONTROL_INPUT_KEYS = Object.freeze(["type", "targetId", "sourceId", "value"]);
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
    if (nonempty(value[key])) input[key] = value[key];
  }
  return Object.freeze(input);
}

function transcript(value) {
  return value && nonempty(value.visibleText) && value.visibleText === value.spokenText
    ? value : null;
}

function controlAttributes(input) {
  return {
    "data-ss-input-type": input.type,
    "data-ss-target-id": input.targetId,
    "data-ss-source-id": input.sourceId,
    "data-ss-input-value": input.value
  };
}

export function ActionLayer({
  activity,
  assists = {},
  onInput,
  onAudioRequest = undefined
}) {
  const headingId = useId();
  if (typeof onInput !== "function") throw new TypeError("Sound Seekers action input must be a function");
  if (!activity || typeof activity !== "object" || Array.isArray(activity)
    || containsForbiddenKey(activity)) {
    throw new TypeError("Sound Seekers action model is invalid or exposes private decision data");
  }
  const instruction = transcript(activity.instruction);
  const correction = activity.correction === null ? null : transcript(activity.correction);
  const controls = Array.isArray(activity.controls) ? activity.controls.map(control => ({
    ...control,
    input: canonicalInput(control?.input)
  })) : [];
  if (!nonempty(activity.id) || !nonempty(activity.kind) || !instruction
    || (activity.correction !== null && !correction)
    || controls.length < 1
    || controls.some(control => !nonempty(control.id) || !nonempty(control.label) || !control.input)) {
    throw new TypeError("Sound Seekers action model is incomplete");
  }
  const reducedMotion = assists.reducedMotion === true;
  const simplified = assists.simplifiedScene === true;

  return (
    <section
      style={ROOT_STYLE}
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
            {...controlAttributes(control.input)}
            onClick={event => {
              if (!event.defaultPrevented) onInput(control.input);
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
