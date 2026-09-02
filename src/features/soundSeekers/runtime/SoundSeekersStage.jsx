import { useEffect, useRef, useState } from "react";
import { ActionLayer } from "../ui/ActionLayer.jsx";
import { MissionHud } from "../ui/MissionHud.jsx";
import { LayeredBiome } from "../visual/LayeredBiome.jsx";
import { SceneVisual } from "../visual/SceneVisual.jsx";
import { SOUND_SEEKERS_VISUAL_TOKENS } from "../visual/visualTokens.js";
import { createSoundSeekersStageRuntime } from "./soundSeekersScene.js";

const TOKEN_STYLE = Object.freeze(Object.fromEntries(
  Object.entries(SOUND_SEEKERS_VISUAL_TOKENS).map(([tokenId, value]) => (
    [`--ss-token-${tokenId}`, value]
  ))
));
const STAGE_STYLE = Object.freeze({
  ...TOKEN_STYLE,
  display: "grid",
  gap: 8,
  minWidth: 0,
  color: "var(--ss-token-ink-deep)"
});
const WORLD_STYLE = Object.freeze({
  position: "relative",
  minWidth: 0,
  overflow: "hidden",
  borderRadius: 20,
  isolation: "isolate"
});
const CANVAS_STYLE = Object.freeze({
  position: "absolute",
  inset: 0,
  zIndex: 2,
  display: "block",
  width: "100%",
  height: "100%",
  background: "transparent",
  touchAction: "none"
});
const FALLBACK_WORLD_STYLE = Object.freeze({
  display: "grid",
  minHeight: 280,
  placeItems: "center",
  padding: 24,
  color: "var(--ss-token-ink-deep)",
  background: "linear-gradient(160deg, var(--ss-token-light-river) 0%, var(--ss-token-surface-warm) 56%, var(--ss-token-light-seedwake) 100%)",
  border: "3px solid var(--ss-token-ink-deep)",
  textAlign: "center"
});
const FALLBACK_CONTROL_STYLE = Object.freeze({
  minHeight: 56,
  minWidth: 56,
  padding: "8px 12px",
  color: "var(--ss-token-ink-deep)",
  background: "var(--ss-token-surface-option)",
  border: "3px solid var(--ss-token-ink-deep)",
  borderRadius: 14,
  boxShadow: "0 4px 0 var(--ss-token-ink-muted)",
  font: "inherit",
  fontWeight: 800,
  cursor: "pointer"
});
const TRAVERSAL_CONTROLS = Object.freeze([
  Object.freeze({ value: "left", label: "← Left", shortcut: "ArrowLeft" }),
  Object.freeze({ value: "up", label: "↑ Up", shortcut: "ArrowUp" }),
  Object.freeze({ value: "down", label: "↓ Down", shortcut: "ArrowDown" }),
  Object.freeze({ value: "right", label: "Right →", shortcut: "ArrowRight" })
]);

function requiredFunction(value, name) {
  if (typeof value !== "function") throw new TypeError(`Sound Seekers ${name} must be a function`);
  return value;
}

function requiredObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`Sound Seekers ${name} must be an object`);
  }
  return value;
}

function displayPosition(value) {
  const clamp = item => Math.min(1, Math.max(0, Number.isFinite(item) ? item : 0));
  return Object.freeze({ x: clamp(value?.x), y: clamp(value?.y) });
}

function TraversalControls({ onInput }) {
  return (
    <nav
      aria-label="Sound Seekers movement controls"
      data-ss-fallback-controls=""
      style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}
    >
      {TRAVERSAL_CONTROLS.map(control => {
        const input = Object.freeze({ type: "traverse", value: control.value });
        return (
          <button
            key={control.value}
            className="ss-stage__traversal-control"
            type="button"
            style={FALLBACK_CONTROL_STYLE}
            aria-label={`Move ${control.value}`}
            aria-keyshortcuts={control.shortcut}
            data-ss-input-type={input.type}
            data-ss-input-value={input.value}
            onClick={event => { if (!event.defaultPrevented) onInput(input); }}
          >
            {control.label}
          </button>
        );
      })}
    </nav>
  );
}

export function SoundSeekersStage({ model, assists = {}, audioController, onInput }) {
  requiredObject(model, "stage model");
  requiredObject(assists, "assist model");
  requiredFunction(onInput, "stage input");
  const actionRootRef = useRef(null);
  const canvasRef = useRef(null);
  const runtimeRef = useRef(null);
  const initialRuntimeRef = useRef({ model, assists, onInput });
  const [runtimeStatus, setRuntimeStatus] = useState("loading");
  const [position, setPosition] = useState(() => displayPosition(model.traversal?.position));

  useEffect(() => {
    let mounted = true;
    const runtime = createSoundSeekersStageRuntime({
      canvas: canvasRef.current,
      actionRoot: actionRootRef.current,
      model: initialRuntimeRef.current.model,
      assists: initialRuntimeRef.current.assists,
      onInput: input => initialRuntimeRef.current.onInput(input),
      onTraversalPosition: next => { if (mounted) setPosition(displayPosition(next)); },
      onStatus: status => { if (mounted) setRuntimeStatus(status); }
    });
    runtimeRef.current = runtime;
    return () => {
      mounted = false;
      runtimeRef.current = null;
      runtime.destroy();
    };
  }, []);

  useEffect(() => {
    runtimeRef.current?.update({
      model,
      assists,
      onInput,
      onTraversalPosition: next => setPosition(displayPosition(next))
    });
  }, [assists, model, onInput]);

  const childScene = model.childScene ?? null;
  const hasTraversal = Boolean(model.traversal);
  const motionProfile = assists.reducedMotion === true ? "reduced" : "full";
  const sceneProfile = assists.simplifiedScene === true ? "simplified" : "full";
  const requestAudio = typeof audioController?.request === "function"
    ? request => audioController.request(request) : undefined;

  return (
    <section
      ref={actionRootRef}
      className="ss-stage"
      aria-label="Sound Seekers game"
      tabIndex={0}
      style={STAGE_STYLE}
      data-sound-seekers-stage=""
      data-runtime-status={runtimeStatus}
      data-scene-profile={sceneProfile}
      data-motion-profile={motionProfile}
    >
      <style>{`
        .ss-stage:focus-visible,
        .ss-stage__traversal-control:focus-visible {
          outline: 4px solid var(--ss-token-focus-gold);
          outline-offset: 3px;
        }
        .ss-stage[data-motion-profile="reduced"] * {
          animation: none !important;
          scroll-behavior: auto !important;
          transition: none !important;
        }
      `}</style>
      <MissionHud model={model.hud} onInput={onInput} />
      <div
        style={{
          ...WORLD_STYLE,
          "--ss-traversal-x": `${position.x * 100}%`,
          "--ss-traversal-y": `${position.y * 100}%`
        }}
        data-ss-react-world-owner=""
        data-traversal-x={String(position.x)}
        data-traversal-y={String(position.y)}
      >
        {childScene ? (
          <SceneVisual
            {...model.sceneVisualProps}
            childScene={childScene}
            onChoose={token => onInput(Object.freeze({ type: "choose", token }))}
          />
        ) : model.biomeProps ? (
          <LayeredBiome {...model.biomeProps} />
        ) : (
          <div role="status" style={FALLBACK_WORLD_STYLE} data-ss-fallback-world="">
            <div>
              <strong style={{ display: "block", fontSize: "clamp(1.15rem, 4vw, 1.6rem)" }}>
                Your trail is ready
              </strong>
              <span>Use the movement buttons to explore.</span>
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          tabIndex={-1}
          data-ss-phaser-role="traversal-only"
          data-canvas-input={childScene ? "disabled" : "enabled"}
          style={{ ...CANVAS_STYLE, pointerEvents: childScene ? "none" : "auto" }}
        />
      </div>
      {!childScene && hasTraversal ? <TraversalControls onInput={onInput} /> : null}
      {!childScene && model.activity ? (
        <ActionLayer
          activity={model.activity}
          assists={assists}
          onInput={onInput}
          onAudioRequest={requestAudio}
        />
      ) : null}
      {runtimeStatus === "unavailable" ? (
        <p role="status" aria-live="polite" style={{ margin: 0, textAlign: "center", fontWeight: 700 }}>
          Movement buttons are ready.
        </p>
      ) : null}
    </section>
  );
}
