export const rescueSectionWidth = 1120;
export const gardenSectionWidth = 1740;
export function createCarryWorld(mode, index, total, saved = null) {
  const section = mode === "rescue" ? rescueSectionWidth : gardenSectionWidth;
  return {
    mode,
    section,
    index,
    total,
    x: saved?.x ?? index * section + 90,
    camera: saved?.camera ?? index * section,
    carry: saved?.carry || null,
    target: null,
    input: 0,
    moving: false,
    facing: 1,
    solved: index,
    friendX: saved?.friendX ?? total * section + 30,
    rescued: false,
    time: 0,
    event: null,
    discoveries: saved?.discoveries || []
  };
}
export function carryWorldSnapshot(world) {
  return {
    x: world.x,
    camera: world.camera,
    carry: world.carry,
    friendX: world.friendX,
    discoveries: world.discoveries
  };
}
export function carryRackX(world, index, choiceIndex) {
  return index * world.section + 170 + choiceIndex * 195;
}
export function carryStationX(world, index) {
  return index * world.section + (world.mode === "rescue" ? 850 : 1480);
}
export function requestCarryAction(world, action) {
  if (world.rescued) return false;
  world.target = {
    ...action
  };
  world.input = 0;
  return true;
}
export function advanceCarryWorld(world, seconds, viewWidth = 1100) {
  world.event = null;
  const dt = Math.min(.05, Math.max(0, seconds));
  world.time += dt;
  let dir = world.input;
  if (world.target) {
    const delta = world.target.x - world.x;
    if (Math.abs(delta) <= 330 * dt + 2) {
      world.x = world.target.x;
      world.event = world.target;
      world.target = null;
      dir = 0;
    } else dir = Math.sign(delta);
  }
  world.moving = Boolean(dir);
  if (dir) world.facing = dir;
  const frontier = world.mode === "rescue" ? world.solved * world.section + 900 : world.total * world.section;
  world.x = Math.max(55, Math.min(frontier, world.x + dir * 330 * dt));
  if (world.target && world.target.x > frontier) world.target = null;
  world.camera += (Math.max(0, world.x - viewWidth * .3) - world.camera) * (1 - Math.exp(-7 * dt));
  if (world.mode === "rescue" && world.solved === world.total && !world.rescued) {
    const home = world.total * world.section - 265;
    world.friendX = Math.max(home, world.friendX - 180 * dt);
    if (world.friendX === home) {
      world.rescued = true;
      world.event = {
        type: "rescued"
      };
    }
  }
}
export function createConveyorWorld(word, manual = false) {
  return {
    word,
    x: 150,
    y: 260,
    phase: manual ? "waiting" : "feeding",
    chosen: null,
    route: null,
    elapsed: 0,
    rollers: 0,
    event: null,
    dragging: false
  };
}
export function divertConveyor(world, bin, side) {
  if (!["feeding", "ready", "dragging"].includes(world.phase)) return false;
  world.phase = "routing";
  world.chosen = bin;
  world.dragging = false;
  world.route = {
    x: world.x,
    y: world.y,
    endX: side === 0 ? 240 : 760,
    endY: 470
  };
  world.elapsed = 0;
  return true;
}
export function advanceConveyor(world, seconds) {
  world.event = null;
  const dt = Math.min(.05, Math.max(0, seconds));
  world.rollers += dt;
  if (world.phase === "feeding") {
    world.x = Math.min(500, world.x + 250 * dt);
    if (world.x === 500) world.phase = "ready";
  } else if (["routing", "returning", "accepted"].includes(world.phase)) {
    world.elapsed += dt;
    const t = Math.min(1, world.elapsed / .85);
    const r = world.route;
    if (world.phase === "accepted") {
      world.y = 470 + t * 100;
      return;
    }
    const eased = t * t * (3 - 2 * t);
    world.x = r.x + (r.endX - r.x) * eased;
    world.y = r.y + (r.endY - r.y) * eased + (world.phase === "returning" ? Math.sin(t * Math.PI) * 70 : -Math.sin(t * Math.PI) * 24);
    if (t === 1) {
      if (world.phase === "routing") {
        world.phase = "judging";
        world.event = {
          type: "deliver",
          bin: world.chosen
        };
      } else {
        world.phase = "ready";
        world.chosen = null;
      }
    }
  }
}
export function resolveConveyorDelivery(world, correct) {
  world.elapsed = 0;
  if (correct) world.phase = "accepted";else {
    world.phase = "returning";
    world.route = {
      x: world.x,
      y: world.y,
      endX: 500,
      endY: 260
    };
  }
}
export function adventureSessionKey(scope, mode, difficulty) {
  return `literacy-guide-adventure-world:${scope || "default"}:${mode}:${difficulty}`;
}
export function loadAdventureSession(key, startLevel, checkpointPresent = true) {
  if (!checkpointPresent || typeof localStorage === "undefined") return null;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    return saved?.v === 1 && saved.index === startLevel && saved.roundSet ? saved : null;
  } catch {
    return null;
  }
}
export function saveAdventureSession(key, value) {
  if (typeof localStorage === "undefined") return;
  try {
    if (value === null) localStorage.removeItem(key);else localStorage.setItem(key, JSON.stringify({
      ...value,
      v: 1
    }));
  } catch {/* Existing parent progress remains the fallback if storage is unavailable. */}
}

// Preserve the authored transformation; difficulty changes only the number of competing seeds.
export function gardenSeedChoices(round, difficulty) {
  const expected = round.word[round.changeIndex];
  const count = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : round.bank.length;
  const allowed = new Set([expected, ...round.bank.filter(letter => letter !== expected).slice(0, count - 1)]);
  return round.bank.filter(letter => allowed.has(letter));
}
