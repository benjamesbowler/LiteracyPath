import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { SoundSeekersStage } from "../../src/features/soundSeekers/runtime/SoundSeekersStage.jsx";
import { createCharacterAppearance } from "../../src/features/soundSeekers/visual/characterCustomization.js";

const TRACKED_INPUT_EVENTS = new Set([
  "click", "keydown", "lostpointercapture", "pointercancel", "pointerdown", "pointerup",
  "soundseekers:switch"
]);
const nativeAddEventListener = EventTarget.prototype.addEventListener;
const nativeRemoveEventListener = EventTarget.prototype.removeEventListener;
const activeInputListeners = [];
const lifecycle = {
  strictSetups: 0,
  strictCleanups: 0,
  canvasesAdded: 0,
  canvasesRemoved: 0
};

function captureValue(options) {
  return typeof options === "boolean" ? options : options?.capture === true;
}

function trackedTarget(target) {
  return target instanceof Element && (
    target.matches("[data-sound-seekers-stage], [data-ss-phaser-host]")
      || Boolean(target.closest("[data-sound-seekers-stage]"))
  );
}

EventTarget.prototype.addEventListener = function addTrackedListener(type, listener, options) {
  if (TRACKED_INPUT_EVENTS.has(type) && trackedTarget(this)) {
    activeInputListeners.push({
      target: this,
      type,
      listener,
      capture: captureValue(options)
    });
  }
  return nativeAddEventListener.call(this, type, listener, options);
};

EventTarget.prototype.removeEventListener = function removeTrackedListener(type, listener, options) {
  const capture = captureValue(options);
  const index = activeInputListeners.findIndex(record => (
    record.target === this
      && record.type === type
      && record.listener === listener
      && record.capture === capture
  ));
  if (index >= 0) activeInputListeners.splice(index, 1);
  return nativeRemoveEventListener.call(this, type, listener, options);
};

window.__soundSeekersStageErrors = [];
window.addEventListener("error", event => {
  window.__soundSeekersStageErrors.push(event.error?.message || event.message);
});
window.addEventListener("unhandledrejection", event => {
  window.__soundSeekersStageErrors.push(event.reason?.message || String(event.reason));
});
window.__soundSeekersStageInputs = [];
window.__soundSeekersStageAudio = [];

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

const initialModel = Object.freeze({
  avatar: Object.freeze({
    characterId: "player",
    pose: "idle",
    appearance
  }),
  traversal: Object.freeze({
    routeId: "strict-mode-stage-route",
    position: Object.freeze({ x: 0.12, y: 0.58 }),
    target: Object.freeze({ x: 0.12, y: 0.58 }),
    bounds: Object.freeze({ minX: 0, maxX: 1, minY: 0, maxY: 1 }),
    interactions: Object.freeze([])
  }),
  activity: Object.freeze({
    id: "strict-mode-listen",
    kind: "sound_choice",
    instruction: Object.freeze({
      visibleText: "Listen, then choose the sound card.",
      spokenText: "Listen, then choose the sound card.",
      audioRequest: null
    }),
    correction: null,
    feedback: "Choose one sound card.",
    controls: Object.freeze([
      Object.freeze({
        id: "listen-card",
        label: "Choose sound card",
        input: Object.freeze({
          type: "confirm_candidate",
          targetId: "card-one",
          sourceId: "strict-mode-stage"
        }),
        audioRequest: Object.freeze({
          cueId: "stage-cue-one",
          audioKey: "stage-audio-one",
          kind: "instruction"
        }),
        disabled: false
      })
    ])
  }),
  hud: null
});

function StageHarness() {
  const [model, setModel] = useState(initialModel);
  const handleInput = input => {
    window.__soundSeekersStageInputs.push(input);
    if (input.type !== "traverse") return;
    const delta = {
      down: { x: 0, y: 0.18 },
      left: { x: -0.24, y: 0 },
      right: { x: 0.24, y: 0 },
      up: { x: 0, y: -0.18 }
    }[input.value];
    if (!delta) return;
    setModel(previous => {
      const target = previous.traversal.target;
      const clamp = value => Math.min(1, Math.max(0, value));
      return Object.freeze({
        ...previous,
        traversal: Object.freeze({
          ...previous.traversal,
          target: Object.freeze({
            x: clamp(target.x + delta.x),
            y: clamp(target.y + delta.y)
          })
        })
      });
    });
  };
  useEffect(() => {
    lifecycle.strictSetups += 1;
    window.__moveSoundSeekersAvatar = (x, y) => {
      setModel(previous => Object.freeze({
        ...previous,
        traversal: Object.freeze({
          ...previous.traversal,
          target: Object.freeze({ x, y })
        })
      }));
    };
    return () => {
      lifecycle.strictCleanups += 1;
    };
  }, []);

  return (
    <SoundSeekersStage
      model={model}
      assists={{ simplifiedScene: false, reducedMotion: false }}
      audioController={{
        request(request) {
          window.__soundSeekersStageAudio.push(request);
        }
      }}
      onInput={handleInput}
    />
  );
}

const rootElement = document.getElementById("root");
const canvasObserver = new MutationObserver(records => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (!(node instanceof Element)) continue;
      lifecycle.canvasesAdded += Number(node.matches("canvas"));
      lifecycle.canvasesAdded += node.querySelectorAll("canvas").length;
    }
    for (const node of record.removedNodes) {
      if (!(node instanceof Element)) continue;
      lifecycle.canvasesRemoved += Number(node.matches("canvas"));
      lifecycle.canvasesRemoved += node.querySelectorAll("canvas").length;
    }
  }
});
canvasObserver.observe(rootElement, { childList: true, subtree: true });

const root = createRoot(rootElement);
root.render(<StrictMode><StageHarness /></StrictMode>);

window.__resetSoundSeekersStageEffects = () => {
  window.__soundSeekersStageInputs.length = 0;
  window.__soundSeekersStageAudio.length = 0;
};
window.__unmountSoundSeekersStage = () => root.unmount();
window.__soundSeekersStageSnapshot = () => {
  const stage = document.querySelector("[data-sound-seekers-stage]");
  const host = document.querySelector("[data-ss-phaser-host]");
  const avatar = document.querySelector("[data-ss-live-avatar]");
  const avatarBounds = avatar?.getBoundingClientRect();
  const worldBounds = document.querySelector("[data-ss-react-world-owner]")?.getBoundingClientRect();
  return {
    stageCount: document.querySelectorAll("[data-sound-seekers-stage]").length,
    hostCount: document.querySelectorAll("[data-ss-phaser-host]").length,
    canvasCount: host?.querySelectorAll("canvas").length || 0,
    playerCount: stage?.querySelectorAll('[data-character-id="player"]').length || 0,
    liveAvatarCount: stage?.querySelectorAll("[data-ss-live-avatar]").length || 0,
    avatarLeftStyle: avatar?.style.left || null,
    avatarTopStyle: avatar?.style.top || null,
    avatarX: avatarBounds?.x ?? null,
    avatarY: avatarBounds?.y ?? null,
    avatarWidth: avatarBounds?.width ?? null,
    avatarHeight: avatarBounds?.height ?? null,
    worldWidth: worldBounds?.width ?? null,
    worldHeight: worldBounds?.height ?? null,
    runtimeStatus: stage?.dataset.runtimeStatus || null,
    activeInputListeners: activeInputListeners.length,
    inputs: [...window.__soundSeekersStageInputs],
    audio: [...window.__soundSeekersStageAudio],
    errors: [...window.__soundSeekersStageErrors],
    ...lifecycle
  };
};
