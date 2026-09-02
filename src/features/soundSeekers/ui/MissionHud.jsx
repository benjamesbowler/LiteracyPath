import { SOUND_SEEKERS_VISUAL_TOKENS } from "../visual/visualTokens.js";

const TOKEN_STYLE = Object.freeze(Object.fromEntries(
  Object.entries(SOUND_SEEKERS_VISUAL_TOKENS).map(([tokenId, value]) => (
    [`--ss-token-${tokenId}`, value]
  ))
));

const HUD_STYLE = Object.freeze({
  ...TOKEN_STYLE,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 8,
  alignItems: "center",
  padding: 8,
  color: "var(--ss-token-ink-deep)",
  background: "var(--ss-token-surface-option)",
  border: "3px solid var(--ss-token-ink-deep)",
  borderRadius: 18
});
const TOOL_STYLE = Object.freeze({
  minHeight: 56,
  minWidth: 56,
  padding: "8px 12px",
  color: "var(--ss-token-ink-deep)",
  background: "var(--ss-token-light-star)",
  border: "3px solid var(--ss-token-ink-deep)",
  borderRadius: 14,
  font: "inherit",
  fontWeight: 800,
  cursor: "pointer"
});
const SAFE_INPUT_TYPE = /^[a-z][a-z0-9_-]*$/u;
const PRIVATE_INPUT_TYPE = /(?:^|[_-])(?:answer|correct|correctness|expected|evidence|score)(?:[_-]|$)/iu;

function nonempty(value) {
  return typeof value === "string" && Boolean(value.trim());
}

function hudInput(value) {
  if (!value || typeof value !== "object" || !nonempty(value.type)
    || !SAFE_INPUT_TYPE.test(value.type)
    || PRIVATE_INPUT_TYPE.test(value.type)
    || Object.keys(value).some(key => !["type", "targetId", "sourceId", "value"].includes(key))) {
    return null;
  }
  return Object.freeze(Object.fromEntries(Object.entries(value)
    .filter(([, item]) => nonempty(item))));
}

export function MissionHud({ model, onInput }) {
  if (!model) return null;
  if (typeof onInput !== "function") throw new TypeError("Sound Seekers HUD input must be a function");
  const current = model.progress?.current;
  const total = model.progress?.total;
  const controls = Array.isArray(model.controls) ? model.controls.map(control => ({
    ...control,
    input: hudInput(control?.input)
  })) : [];
  if (!nonempty(model.title) || !nonempty(model.locationLabel)
    || !Number.isInteger(current) || !Number.isInteger(total)
    || current < 0 || total < 1 || current > total
    || !nonempty(model.progress?.label)
    || controls.some(control => !nonempty(control.id) || !nonempty(control.label) || !control.input)) {
    throw new TypeError("Sound Seekers HUD model is invalid");
  }
  return (
    <header style={HUD_STYLE} data-ss-mission-hud="">
      <style>{`
        .ss-mission-hud__tool:focus-visible {
          outline: 4px solid var(--ss-token-focus-gold);
          outline-offset: 3px;
        }
      `}</style>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>{model.locationLabel}</p>
        <h1 style={{ margin: "2px 0 6px", fontSize: "clamp(1.1rem, 3vw, 1.45rem)" }}>{model.title}</h1>
        <div
          role="progressbar"
          aria-label={model.progress.label}
          aria-valuemin={0}
          aria-valuenow={current}
          aria-valuemax={total}
          style={{ height: 12, overflow: "hidden", background: "var(--ss-token-mist-overlay)", border: "2px solid var(--ss-token-ink-deep)", borderRadius: 999 }}
        >
          <span
            aria-hidden="true"
            style={{ display: "block", width: `${(current / total) * 100}%`, height: "100%", background: "var(--ss-token-focus-gold)" }}
          />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700 }}>{model.progress.label}</span>
      </div>
      {controls.length ? (
        <nav aria-label="Sound Seekers trail tools" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {controls.map(control => (
            <button
              key={control.id}
              className="ss-mission-hud__tool"
              type="button"
              style={TOOL_STYLE}
              aria-label={control.label}
              data-control-id={control.id}
              data-ss-input-type={control.input.type}
              data-ss-target-id={control.input.targetId}
              data-ss-source-id={control.input.sourceId}
              data-ss-input-value={control.input.value}
              onClick={event => { if (!event.defaultPrevented) onInput(control.input); }}
            >
              {control.label}
            </button>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
