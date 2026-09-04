import { createInputBridge } from "./inputBridge.js";

const DEFAULT_BOUNDS = Object.freeze({ minX: 0, maxX: 1, minY: 0, maxY: 1 });
const NOOP = () => {};

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

function finite(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function normalizeBounds(value) {
  const bounds = {
    minX: finite(value?.minX, DEFAULT_BOUNDS.minX),
    maxX: finite(value?.maxX, DEFAULT_BOUNDS.maxX),
    minY: finite(value?.minY, DEFAULT_BOUNDS.minY),
    maxY: finite(value?.maxY, DEFAULT_BOUNDS.maxY)
  };
  if (bounds.maxX <= bounds.minX || bounds.maxY <= bounds.minY) return DEFAULT_BOUNDS;
  return bounds;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizePoint(value, bounds, fallback) {
  return {
    x: clamp(finite(value?.x, fallback.x), bounds.minX, bounds.maxX),
    y: clamp(finite(value?.y, fallback.y), bounds.minY, bounds.maxY)
  };
}

function initialState(traversal) {
  const bounds = normalizeBounds(traversal?.bounds);
  const position = normalizePoint(traversal?.position, bounds, {
    x: bounds.minX,
    y: bounds.minY
  });
  return {
    active: true,
    bounds,
    x: position.x,
    y: position.y,
    routeId: traversal?.routeId ?? null,
    lastPosition: null
  };
}

function addListener(emitter, type, listener) {
  if (typeof emitter?.on === "function") emitter.on(type, listener);
  else emitter?.addEventListener?.(type, listener);
}

function removeListener(emitter, type, listener) {
  if (typeof emitter?.off === "function") emitter.off(type, listener);
  else emitter?.removeEventListener?.(type, listener);
}

function nearestInteraction(interactions, position) {
  if (!Array.isArray(interactions)) return null;
  let nearest = null;
  let nearestDistance = Infinity;
  for (const interaction of interactions) {
    if (typeof interaction?.id !== "string" || !interaction.id.trim()
      || !Number.isFinite(interaction.x) || !Number.isFinite(interaction.y)
      || !Number.isFinite(interaction.radius) || interaction.radius < 0) continue;
    const distance = Math.hypot(position.x - interaction.x, position.y - interaction.y);
    if (distance <= interaction.radius && distance < nearestDistance) {
      nearest = interaction.id;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function rounded(value) {
  return Math.round(value * 10_000) / 10_000;
}

export function createSoundSeekersScene({ getTraversal, getAssists, onPosition }) {
  requiredFunction(getTraversal, "traversal reader");
  requiredFunction(getAssists, "assist reader");
  requiredFunction(onPosition, "position callback");
  const states = new WeakMap();

  function create() {
    const context = this;
    const state = initialState(getTraversal());
    states.set(context, state);
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      state.active = false;
      context.tweens?.killAll?.();
      removeListener(context.events, "shutdown", cleanup);
      removeListener(context.events, "destroy", cleanup);
    };
    addListener(context.events, "shutdown", cleanup);
    addListener(context.events, "destroy", cleanup);
  }

  function update(_time, delta) {
    const state = states.get(this);
    if (!state?.active) return;
    const traversal = getTraversal();
    const bounds = normalizeBounds(traversal?.bounds);
    const routeChanged = (traversal?.routeId ?? null) !== state.routeId;
    if (routeChanged) {
      const reset = initialState(traversal);
      state.x = reset.x;
      state.y = reset.y;
      state.routeId = reset.routeId;
      state.lastPosition = null;
    }
    state.bounds = bounds;
    const target = normalizePoint(traversal?.target, bounds, { x: state.x, y: state.y });
    const assists = getAssists() ?? {};
    if (assists.reducedMotion === true || assists.autoTravel === true) {
      state.x = target.x;
      state.y = target.y;
    } else {
      const seconds = clamp(finite(delta, 16), 0, 100) / 1000;
      const speed = assists.slowerMovement === true ? 3 : 8;
      const amount = 1 - Math.exp(-speed * seconds);
      state.x += (target.x - state.x) * amount;
      state.y += (target.y - state.y) * amount;
    }
    const position = Object.freeze({
      x: rounded(clamp(state.x, bounds.minX, bounds.maxX)),
      y: rounded(clamp(state.y, bounds.minY, bounds.maxY)),
      nearestInteractionId: nearestInteraction(traversal?.interactions, state)
    });
    if (state.lastPosition?.x === position.x
      && state.lastPosition?.y === position.y
      && state.lastPosition?.nearestInteractionId === position.nearestInteractionId) return;
    state.lastPosition = position;
    onPosition(position);
  }

  return Object.freeze({
    key: "SoundSeekersTraversal",
    create,
    update
  });
}

function phaserApi(moduleValue) {
  const candidate = typeof moduleValue?.default?.Game === "function"
    ? moduleValue.default : moduleValue;
  if (!candidate || typeof candidate.Game !== "function" || !("AUTO" in candidate)) {
    throw new TypeError("Sound Seekers Phaser runtime is unavailable");
  }
  return candidate;
}

function surfaceSize(surface, property, fallback) {
  const value = Number(surface?.[property]);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

function identifyTraversalCanvas(game, host) {
  const canvas = game?.canvas ?? host?.querySelector?.("canvas") ?? null;
  if (!canvas || canvas.parentNode !== host) return null;
  canvas.setAttribute?.("aria-hidden", "true");
  canvas.setAttribute?.("tabindex", "-1");
  canvas.setAttribute?.("data-ss-phaser-canvas", "");
  canvas.setAttribute?.("data-ss-phaser-role", "traversal-only");
  if (canvas.style) canvas.style.pointerEvents = "none";
  return canvas;
}

function runtimeSnapshot({ model, assists = {}, onInput, onTraversalPosition = NOOP }) {
  return {
    model: requiredObject(model, "stage model"),
    assists: requiredObject(assists, "assist model"),
    onInput: requiredFunction(onInput, "stage input"),
    onTraversalPosition: requiredFunction(onTraversalPosition, "traversal position callback")
  };
}

function interactionId(value) {
  return typeof value === "string" && value.trim() ? value : null;
}

export function createSoundSeekersStageRuntime({
  host,
  actionRoot,
  model,
  assists = {},
  onInput,
  onTraversalPosition = NOOP,
  onStatus = NOOP,
  loadPhaser = () => import("phaser")
}) {
  let current = runtimeSnapshot({ model, assists, onInput, onTraversalPosition });
  requiredFunction(onStatus, "runtime status callback");
  requiredFunction(loadPhaser, "Phaser loader");
  let destroyed = false;
  let game = null;
  let nearestInteractionId = null;

  const bridge = createInputBridge({
    canvas: host,
    actionRoot,
    keyboardRoot: actionRoot.closest?.("[data-sound-seekers-game]") ?? actionRoot,
    dispatch(input) {
      if (!destroyed) current.onInput(input);
    }
  });
  onStatus("loading");

  const ready = Promise.resolve()
    .then(loadPhaser)
    .then(moduleValue => {
      if (destroyed) return null;
      const Phaser = phaserApi(moduleValue);
      const scene = createSoundSeekersScene({
        getTraversal: () => current.model.traversal,
        getAssists: () => current.assists,
        onPosition(position) {
          if (destroyed) return;
          current.onTraversalPosition(position);
          const nextNearestInteractionId = interactionId(position.nearestInteractionId);
          if (nextNearestInteractionId === nearestInteractionId) return;
          nearestInteractionId = nextNearestInteractionId;
          if (nearestInteractionId) {
            current.onInput(Object.freeze({
              type: "arrive",
              targetId: nearestInteractionId
            }));
          }
        }
      });
      const nextGame = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host,
        width: surfaceSize(host, "clientWidth", 640),
        height: surfaceSize(host, "clientHeight", 360),
        transparent: true,
        backgroundColor: "transparent",
        banner: false,
        audio: { noAudio: true },
        input: { keyboard: false, mouse: false, touch: false, gamepad: false },
        scene
      });
      identifyTraversalCanvas(nextGame, host);
      if (destroyed) {
        nextGame.destroy?.(true);
        return null;
      }
      game = nextGame;
      onStatus("ready");
      return game;
    })
    .catch(() => {
      if (!destroyed) onStatus("unavailable");
      return null;
    });

  return Object.freeze({
    ready,
    scan: bridge.scan,
    activate: bridge.activate,
    update(next) {
      if (destroyed) return false;
      const snapshot = runtimeSnapshot(next);
      if ((snapshot.model.traversal?.routeId ?? null)
        !== (current.model.traversal?.routeId ?? null)) {
        nearestInteractionId = null;
      }
      current = snapshot;
      return true;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      bridge.destroy();
      const ownedGame = game;
      game = null;
      ownedGame?.destroy?.(true);
    }
  });
}
