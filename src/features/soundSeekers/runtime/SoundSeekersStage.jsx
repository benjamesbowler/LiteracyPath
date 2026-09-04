import { useEffect, useRef, useState } from "react";
import { ActionLayer } from "../ui/ActionLayer.jsx";
import { MissionHud } from "../ui/MissionHud.jsx";
import { LayeredBiome } from "../visual/LayeredBiome.jsx";
import { SceneVisual } from "../visual/SceneVisual.jsx";
import { SoundSeekersCharacter } from "../visual/CharacterSystem.jsx";
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
const SCENE_FIELDSET_STYLE = Object.freeze({
  minWidth: 0,
  margin: 0,
  padding: 0,
  border: 0
});
const PHASER_HOST_STYLE = Object.freeze({
  position: "absolute",
  inset: 0,
  zIndex: 2,
  display: "block",
  width: "100%",
  height: "100%",
  background: "transparent",
  touchAction: "none"
});
const AVATAR_STYLE = Object.freeze({
  position: "absolute",
  zIndex: 3,
  width: "clamp(5.75rem, 17vw, 9.5rem)",
  margin: 0,
  pointerEvents: "none"
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
const SCENE_CHOICE_INPUT_KEYS = new Set(["type", "choiceId", "token", "recipientId"]);
const SAFE_SCENE_INPUT_TYPE = /^[a-z][a-z0-9_-]*$/u;
const PRIVATE_SCENE_INPUT_TYPE = /(?:^|[_-])(?:answer|correct|correctness|expected|evidence|score)(?:[_-]|$)/iu;

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

function requiredAvatar(value) {
  requiredObject(value, "avatar");
  const expectedKeys = ["appearance", "characterId", "pose"];
  const keys = Reflect.ownKeys(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (keys.length !== expectedKeys.length
    || keys.some(key => typeof key !== "string" || !expectedKeys.includes(key))
    || expectedKeys.some(key => !Object.hasOwn(descriptors[key], "value")
      || !descriptors[key].enumerable)
    || value.characterId !== "player"
    || typeof value.pose !== "string"
    || !value.pose.trim()
    || !value.appearance
    || typeof value.appearance !== "object"
    || Array.isArray(value.appearance)) {
    throw new TypeError("Sound Seekers avatar must contain exactly characterId, pose, and appearance");
  }
  return value;
}

function assertNoProjectedPlayer(biomeProps) {
  const characters = biomeProps?.scenePresentation?.characters;
  if (Array.isArray(characters)
    && characters.some(character => character?.characterId === "player")) {
    throw new TypeError("Sound Seekers biome projection must exclude the live player avatar");
  }
}

function displayPosition(value) {
  const clamp = item => Math.min(1, Math.max(0, Number.isFinite(item) ? item : 0));
  const nearestInteractionId = typeof value?.nearestInteractionId === "string"
    && value.nearestInteractionId.trim() ? value.nearestInteractionId : null;
  return Object.freeze({
    x: clamp(value?.x),
    y: clamp(value?.y),
    nearestInteractionId
  });
}

function sceneChoiceSurface(model, childScene) {
  const enabled = model.sceneOptionsEnabled;
  const controls = model.sceneChoiceControls;
  const options = childScene?.choice?.options;
  if (typeof enabled !== "boolean" || !Array.isArray(controls) || !Array.isArray(options)) {
    throw new TypeError("Sound Seekers scene choice controls are incomplete");
  }
  if (!enabled) {
    if (controls.length !== 0) {
      throw new TypeError("Disabled Sound Seekers scene options cannot expose active controls");
    }
    return Object.freeze({ enabled, inputs: new Map() });
  }
  if (controls.length !== options.length) {
    throw new TypeError("Sound Seekers scene choices must map every visible option");
  }
  const optionTokens = new Set(options.map(option => option?.token));
  const inputs = new Map();
  for (const control of controls) {
    const input = control?.input;
    if (!control || Reflect.ownKeys(control).length !== 2
      || !Object.hasOwn(control, "token") || !Object.hasOwn(control, "input")
      || typeof control.token !== "string" || !control.token.trim()
      || !optionTokens.has(control.token) || inputs.has(control.token)
      || !input || typeof input !== "object" || Array.isArray(input)
      || !Object.isFrozen(input) || typeof input.type !== "string" || !input.type.trim()
      || !SAFE_SCENE_INPUT_TYPE.test(input.type) || PRIVATE_SCENE_INPUT_TYPE.test(input.type)
      || Reflect.ownKeys(input).some(key => typeof key !== "string"
        || !SCENE_CHOICE_INPUT_KEYS.has(key))
      || Object.entries(input).some(([key, value]) => key !== "type"
        && (typeof value !== "string" || !value.trim()))) {
      throw new TypeError("Sound Seekers scene choice mapping is invalid");
    }
    inputs.set(control.token, input);
  }
  return Object.freeze({ enabled, inputs });
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
  const phaserHostRef = useRef(null);
  const runtimeRef = useRef(null);
  const initialRuntimeRef = useRef({ model, assists, onInput });
  const [runtimeStatus, setRuntimeStatus] = useState("loading");
  const [position, setPosition] = useState(() => displayPosition(model.traversal?.position));

  useEffect(() => {
    const stage = actionRootRef.current;
    const document = stage?.ownerDocument;
    const game = stage?.closest?.("[data-sound-seekers-game]");
    if (!stage || !document) return;
    if (document.activeElement === document.body || document.activeElement === game) {
      stage.focus({ preventScroll: true });
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const runtime = createSoundSeekersStageRuntime({
      host: phaserHostRef.current,
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
  const sceneChoices = childScene ? sceneChoiceSurface(model, childScene) : null;
  const avatar = childScene ? null : requiredAvatar(model.avatar);
  if (!childScene) assertNoProjectedPlayer(model.biomeProps);
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
        data-nearest-interaction-id={position.nearestInteractionId ?? undefined}
      >
        {childScene ? (
          <fieldset
            disabled={!sceneChoices.enabled}
            style={SCENE_FIELDSET_STYLE}
            data-ss-scene-options={sceneChoices.enabled ? "enabled" : "disabled"}
          >
            <SceneVisual
              {...model.sceneVisualProps}
              childScene={childScene}
              onChoose={token => {
                const input = sceneChoices.inputs.get(token);
                if (input) onInput(input);
              }}
            />
          </fieldset>
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
        {avatar ? (
          <div
            style={{
              ...AVATAR_STYLE,
              left: `${position.x * 100}%`,
              top: `${position.y * 100}%`,
              transform: "translate(-50%, -78%)",
              transition: assists.reducedMotion === true ? "none" : "left 140ms linear, top 140ms linear"
            }}
            data-ss-live-avatar=""
            data-traversal-x={String(position.x)}
            data-traversal-y={String(position.y)}
          >
            <SoundSeekersCharacter
              characterId={avatar.characterId}
              pose={avatar.pose}
              appearance={avatar.appearance}
            />
          </div>
        ) : null}
        <div
          ref={phaserHostRef}
          aria-hidden="true"
          tabIndex={-1}
          data-ss-phaser-host=""
          data-ss-phaser-role="traversal-only"
          data-canvas-input={childScene ? "disabled" : "enabled"}
          style={{ ...PHASER_HOST_STYLE, pointerEvents: childScene ? "none" : "auto" }}
        />
      </div>
      {!childScene && hasTraversal ? <TraversalControls onInput={onInput} /> : null}
      {(childScene ? model.sceneActivity : model.activity) ? (
        <ActionLayer
          activity={childScene ? model.sceneActivity : model.activity}
          assists={assists}
          onInput={onInput}
          onAudioRequest={requestAudio}
          activationMode={childScene ? "model" : "bridge"}
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
