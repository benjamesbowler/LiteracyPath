// Coordinates are world pixels: x is the player's centre, y their feet, +y down.
// Terrain is explicit; an absent floor is a gap. Motor events carry no learning evidence.
const STEP = 1 / 120;
const DEFAULTS = { width: 34, height: 54, speed: 260, acceleration: 1800, braking: 2200, gravity: 1500, jumpSpeed: 550, maxFall: 950, coyoteTime: 0.1, jumpBuffer: 0.12, jumpCut: 0.45 };
const finite = (v, fallback) => Number.isFinite(v) ? v : fallback;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const approach = (a, b, d) => a < b ? Math.min(b, a + d) : Math.max(b, a - d);
const overlap = (a, b, c, d) => a < d && b > c;
function rect(raw, shelf = false) {
  if (!raw || !['x', 'y', 'width'].every(k => Number.isFinite(raw[k])) || raw.width <= 0 || (!shelf && (!Number.isFinite(raw.height) || raw.height <= 0))) throw new TypeError('Terrain needs finite coordinates and positive dimensions');
  return { ...raw, height: shelf ? 0 : raw.height };
}
function safePoint(state, point) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
  const h = state.tuning.height, r = state.tuning.width / 2;
  return point.x - r >= state.bounds.left && point.x + r <= state.bounds.right && point.y - h >= state.bounds.top && point.y < state.bounds.bottom && !state.solids.some(s => overlap(point.x-r, point.x+r, s.x, s.x+s.width) && overlap(point.y-h, point.y, s.y, s.y+s.height));
}
export function createPlatformState(options = {}) {
  const tuning = { ...DEFAULTS, ...options.tuning };
  for (const k of Object.keys(DEFAULTS)) if (!Number.isFinite(tuning[k]) || tuning[k] <= 0) throw new TypeError(`Invalid physics tuning: ${k}`);
  tuning.jumpCut = Math.min(1, tuning.jumpCut);
  const bounds = { left: 0, right: 3200, top: -1600, bottom: 1600, ...options.bounds };
  if (!Object.values(bounds).every(Number.isFinite) || bounds.right - bounds.left < tuning.width || bounds.bottom - bounds.top < tuning.height) throw new TypeError('Invalid world bounds');
  const cameraOptions = { width: 960, height: 540, vertical: false, ...options.camera };
  if (![cameraOptions.width, cameraOptions.height].every(v => Number.isFinite(v) && v > 0)) throw new TypeError('Invalid camera size');
  const state = { tuning, bounds, solids: (options.solids || []).map(r => rect(r)), platforms: (options.platforms || []).map(r => rect(r, true)), checkpoints: (options.checkpoints || []).map(r => rect(r)), cameraOptions, camera: { x: bounds.left, y: bounds.top }, x: 0, y: 0, vx: 0, vy: 0, facing: 1, grounded: false, input: { left: false, right: false, jump: false }, accumulator: 0, coyote: 0, buffer: 0, recoveries: 0, lastCheckpointId: null };
  state.spawn = { ...(options.spawn || { x: bounds.left + tuning.width, y: 0 }) };
  if (!safePoint(state, state.spawn)) throw new TypeError('Spawn must be finite, inside bounds and outside solids');
  for (const checkpoint of state.checkpoints) if (typeof checkpoint.id !== 'string' || !safePoint(state, checkpoint.spawn)) throw new TypeError('Checkpoint needs an id and safe spawn');
  state.safeSpawn = { ...state.spawn };
  Object.assign(state, state.spawn);
  const saved = options.snapshot;
  if (saved?.v === 1 && safePoint(state, saved) && ['vx','vy','facing','recoveries'].every(k => Number.isFinite(saved[k]))) {
    Object.assign(state, { x: saved.x, y: saved.y, vx: clamp(saved.vx, -tuning.speed, tuning.speed), vy: clamp(saved.vy, -tuning.jumpSpeed, tuning.maxFall), facing: saved.facing < 0 ? -1 : 1, recoveries: Math.max(0, Math.floor(saved.recoveries)) });
    const checkpoint = state.checkpoints.find(c => c.id === saved.lastCheckpointId);
    if (checkpoint) { state.lastCheckpointId = checkpoint.id; state.safeSpawn = { ...checkpoint.spawn }; }
  }
  updateCamera(state, 1, true);
  return state;
}
export function setPlatformInput(state, input = {}) {
  for (const key of ['left', 'right', 'jump']) {
    if (typeof input[key] !== 'boolean') continue;
    if (key === 'jump') {
      if (input.jump && !state.input.jump) state.buffer = state.tuning.jumpBuffer;
      if (!input.jump && state.input.jump && state.vy < 0) state.vy *= state.tuning.jumpCut;
    }
    state.input[key] = input[key];
  }
}
export function releasePlatformInput(state) {
  setPlatformInput(state, { left: false, right: false, jump: false });
  state.buffer = 0;
  state.accumulator = 0;
}
function updateCamera(s, dt, immediate = false) {
  const { width, height, vertical } = s.cameraOptions;
  const targetX = clamp(s.x - width / 2 + s.vx * 0.15, s.bounds.left, Math.max(s.bounds.left, s.bounds.right - width));
  const targetY = clamp(s.y - height * 0.7, s.bounds.top, Math.max(s.bounds.top, s.bounds.bottom - height));
  const blend = immediate ? 1 : 1 - Math.exp(-9 * dt);
  s.camera.x += (targetX - s.camera.x) * blend;
  if (vertical || immediate) s.camera.y += (targetY - s.camera.y) * blend;
}
function tick(s, events) {
  const t = s.tuning, r = t.width / 2;
  s.buffer = Math.max(0, s.buffer - STEP);
  s.coyote = s.grounded ? t.coyoteTime : Math.max(0, s.coyote - STEP);
  const axis = Number(s.input.right) - Number(s.input.left);
  s.vx = approach(s.vx, axis * t.speed, (axis ? t.acceleration : t.braking) * STEP);
  if (axis) s.facing = axis;
  if (s.buffer > 0 && s.coyote > 0) { s.vy = -t.jumpSpeed * (s.input.jump ? 1 : t.jumpCut); s.grounded = false; s.coyote = 0; s.buffer = 0; events.push({ type: 'jump' }); }
  const oldX = s.x;
  s.x = clamp(s.x + s.vx * STEP, s.bounds.left + r, s.bounds.right - r);
  for (const block of s.solids) {
    if (!overlap(s.y-t.height, s.y, block.y, block.y+block.height)) continue;
    if (s.vx > 0 && oldX+r <= block.x && s.x+r >= block.x) { s.x = Math.min(s.x, block.x-r); s.vx = 0; }
    else if (s.vx < 0 && oldX-r >= block.x+block.width && s.x-r <= block.x+block.width) { s.x = Math.max(s.x, block.x+block.width+r); s.vx = 0; }
  }
  const oldY = s.y, wasGrounded = s.grounded;
  s.vy = Math.min(t.maxFall, s.vy + t.gravity * STEP);
  s.y += s.vy * STEP;
  s.grounded = false;
  for (const block of [...s.solids, ...s.platforms]) {
    if (!overlap(s.x-r, s.x+r, block.x, block.x+block.width)) continue;
    if (s.vy >= 0 && oldY <= block.y + 0.001 && s.y >= block.y) { s.y = block.y; s.vy = 0; s.grounded = true; }
    else if (block.height > 0 && s.vy < 0 && oldY-t.height >= block.y+block.height-0.001 && s.y-t.height <= block.y+block.height) { s.y = block.y+block.height+t.height; s.vy = 0; }
  }
  if (s.y-t.height < s.bounds.top) { s.y = s.bounds.top+t.height; s.vy = Math.max(0, s.vy); }
  if (s.grounded && !wasGrounded) events.push({ type: 'land' });
  for (const c of s.checkpoints) if (s.grounded && s.lastCheckpointId !== c.id && overlap(s.x-r,s.x+r,c.x,c.x+c.width) && overlap(s.y-t.height,s.y+0.001,c.y,c.y+c.height)) { s.lastCheckpointId = c.id; s.safeSpawn = { ...c.spawn }; events.push({ type: 'checkpoint', id: c.id }); }
  if (s.y > s.bounds.bottom) {
    Object.assign(s, s.safeSpawn, { vx: 0, vy: 0, grounded: false, coyote: 0, buffer: 0 });
    s.recoveries++;
    releasePlatformInput(s);
    updateCamera(s, STEP, true);
    events.push({ type: 'recover', checkpointId: s.lastCheckpointId });
  }
  updateCamera(s, STEP);
}
export function advancePlatform(state, seconds) {
  const events = [];
  state.accumulator += clamp(finite(seconds, 0), 0, 0.25);
  let steps = 0;
  while (state.accumulator + 1e-10 >= STEP && steps < 30) {
    state.accumulator = Math.max(0, state.accumulator - STEP);
    tick(state, events);
    steps++;
  }
  return { steps, events };
}
export function platformSnapshot(s) {
  return { v: 1, x: s.x, y: s.y, vx: s.vx, vy: s.vy, facing: s.facing, recoveries: s.recoveries, lastCheckpointId: s.lastCheckpointId };
}
