// Native input only. No clock override or controller/answer mutation. The
// compact observer avoids serializing a growing learning history while moving.
export const leapMotion = page => page.evaluate(() => document.querySelector('.letter-leap').__letterLeapMotion());
export const leapCheckpoint = page => page.evaluate(() => document.querySelector('.letter-leap').__letterLeapSnapshot());

// Steering prediction only: leaving a raised crate can carry a walking body
// into a pit which starts well beyond that crate's edge. These are the existing
// controller's unchanged ordinary-step units, not a new gameplay rule. Native
// contacts remain the authority; this only chooses when to press the jump key.
export function leapRaisedDepartureHazard(state, support, direction) {
  if (!support || !direction || !state.player?.onGround) return false;
  const player = state.player;
  const edge = direction > 0 ? support.x + support.w : support.x;
  if ((edge - player.x) * direction > 65) return false;
  const drop = state.groundY - support.y;
  if (drop <= 15) return false;
  const fallSteps = (-1 + Math.sqrt(1 + 8 * drop / .62)) / 2;
  const travel = Math.max(Math.abs(player.vx), 4.8) * fallSteps + player.w / 2;
  const landing = edge + direction * travel;
  return state.pits.some(([a, b]) => Math.max(Math.min(edge, landing), a) < Math.min(Math.max(edge, landing), b));
}

// Read-only steering forecast using the existing ordinary controller units.
// A far-away choice is not a safe landing objective: a crate-top jump can
// descend into a pit before the next stepping shelf. Native input brakes on
// the near bank, then makes the normal pit-approach jump from that bank.
export function leapAirLandingPlan(state, direction) {
  const player = state.player;
  if (!player || player.onGround || player.vy < 0 || !direction) return null;
  let x = player.x, feet = player.y + player.h / 2, vx = player.vx, vy = player.vy;
  const supports = [...state.platforms, ...state.blocks.filter(block => !block.broken)];
  for (let step = 0; step < 90; step++) {
    const previousFeet = feet;
    const difference = direction * 4.8 - vx;
    vx += Math.sign(difference) * Math.min(Math.abs(difference), .48);
    x += vx; vy = Math.min(18, vy + .62); feet += vy;
    if (supports.some(support => x + player.w / 2 > support.x && x - player.w / 2 < support.x + support.w
      && previousFeet <= support.y && feet >= support.y)) return null;
    if (feet >= state.groundY) {
      const pit = state.pits.find(([a,b]) => x > a && x < b);
      if (!pit) return null;
      const targetX = direction > 0 ? pit[0] - 32 : pit[1] + 32;
      if ((targetX - player.x) * direction < -60) return null;
      return { targetX, pit: [...pit], predictedX: x, steps: step + 1 };
    }
  }
  return null;
}

export function leapLandingSteering(player, targetX) {
  const distance = targetX - player.x, direction = Math.sign(distance);
  const brakingTravel = Math.abs(player.vx) * Math.max(0, Math.abs(player.vx) / .3 - 1) / 2;
  if (Math.abs(distance) < 8 || (Math.sign(player.vx) === direction && Math.abs(distance) <= brakingTravel + 8)) return 0;
  return direction;
}

// The captured LANDED loss came from ignoring the authored rising shelves:
// an early floor jump struck a crate's side, and the next launch hit its
// underside beside the walker. Select real intermediate shelf centres rather
// than aiming through that low overhead corridor at a distant letter.
// This changes only native key planning; contact/physics remain in the game.
export function leapLowOverheadWaypoint(state, goal) {
  const player = state.player;
  if (!player?.onGround || !goal || !Number.isFinite(goal.x)) return null;
  const direction = Math.sign(goal.x - player.x), feet = player.y + player.h / 2;
  if (!direction || (goal.x - player.x) * direction <= 320) return null;
  const ceiling = state.blocks.filter(block => !block.broken && block.y + block.h < state.groundY - 48
    && (block.x + block.w / 2 - player.x) * direction > 0
    && (goal.x - block.x - block.w / 2) * direction > 0)
    .sort((a, b) => (a.x - b.x) * direction)[0];
  if (!ceiling) return null;
  const candidates = state.platforms.filter(platform => platform.trailShelf && !platform.move
    && platform.y < feet - 8 && feet - platform.y <= 142
    && (platform.x + platform.w / 2 - player.x) * direction >= -65
    && (platform.x + platform.w / 2 - player.x) * direction <= 190
    && (ceiling.x + ceiling.w - platform.x - platform.w / 2) * direction > 0);
  const platform = candidates.sort((a, b) => Math.abs(a.x + a.w / 2 - player.x) - Math.abs(b.x + b.w / 2 - player.x))[0];
  return platform ? { x: platform.x + platform.w / 2, y: platform.y - player.h / 2,
    platform: { ...platform }, route: 'authored-rising-shelf-before-low-overhead' } : null;
}

// An actual landing on a higher box within the intended shelf's span also
// reaches the waypoint. Requiring the shelf's exact y can strand a grounded
// player above it with zero steering distance. No airborne or floor crossing
// qualifies, and this helper never changes game position or support geometry.
export function leapWaypointArrived(state, waypoint) {
  const player=state.player,platform=waypoint?.platform;
  if(!player?.onGround||!platform)return false;
  const feet=player.y+player.h/2;
  const support=[...state.platforms,...state.blocks.filter(block=>!block.broken)].find(item=>
    player.x+player.w/2>item.x&&player.x-player.w/2<item.x+item.w&&Math.abs(feet-item.y)<5);
  return Boolean(support&&feet<=platform.y+5&&player.x+player.w/2>platform.x&&player.x-player.w/2<platform.x+platform.w);
}

export function leapKeyboard(page, onInput = () => {}) {
  let held = new Set();
  return async (direction = 0, jump = false) => {
    const next = new Set([...(direction < 0 ? ['ArrowLeft'] : direction > 0 ? ['ArrowRight'] : []), ...(jump ? ['ArrowUp'] : [])]);
    for (const key of held) if (!next.has(key)) await page.keyboard.up(key);
    for (const key of next) if (!held.has(key)) await page.keyboard.down(key);
    const changed = [...held].join(':') !== [...next].join(':');
    held = next;
    if (changed) onInput({ at: Date.now(), held: [...held] });
  };
}

// Approach a real walking encounter from its clear ground edge. Waiting for
// `onGround` alone is insufficient: it can be an upper shelf, and the spring
// immediately before this patrol can carry a blind approach over the foe.
// Small ordinary key taps finish the approach outside the spring's cap, then
// the live patrol reaches the standing character. No geometry or clock moves.
export async function approachLeapGroundFoe(page, { timeout = 14000 } = {}) {
  const initial = await leapCheckpoint(page);
  const foe = initial.foes.filter(item => item.type === 'walker' && item.x0 > initial.player.x)
    .sort((a, b) => a.x0 - b.x0)[0];
  if (!foe) throw new Error('No forward ground walking encounter is available');
  const target = foe.x0 - 23;
  const spring = initial.springs.find(item => Math.abs(item.x - target) < 24);
  if (spring) throw new Error('The intended ground encounter overlaps a spring cap');
  const input = leapKeyboard(page), deadline = Date.now() + timeout;
  try {
    await page.locator('.lg-game-player-main').focus();
    await input(1);
    await page.waitForFunction(x => document.querySelector('.letter-leap').__letterLeapMotion().player.x >= x,
      target - 23, { timeout: Math.min(timeout, 12000) });
    await input();
    await page.waitForTimeout(140);
    while (Date.now() < deadline) {
      const state = await leapMotion(page), player = state.player;
      if (player.feedback === 'hurt') return state;
      if (Math.abs(player.y + player.h / 2 - initial.groundY) > 1 || !player.onGround) {
        throw new Error(`Ground encounter left its intended floor at ${player.x}:${player.y}`);
      }
      if (player.x >= target - 1 && player.x <= target + 3) {
        await page.waitForFunction(() => document.querySelector('.letter-leap').__letterLeapMotion().player.feedback === 'hurt',
          null, { timeout: Math.max(100, deadline - Date.now()) });
        return leapMotion(page);
      }
      await input(Math.sign(target - player.x));
      await page.waitForTimeout(22);
      await input();
      await page.waitForTimeout(90);
    }
    throw new Error('Native ground encounter did not produce a physical collision');
  } finally { await input(); }
}

export async function driveLeap(page, {
  until, timeout = 240000, select = state => state.bubbles.find(b => !b.taken && b.ch === state.word[state.letterIndex]),
  onCheckpoint = () => {}, onSample = () => {}, onInput = () => {}, recover = true,
} = {}) {
  const input = leapKeyboard(page, onInput);
  const deadline = Date.now() + timeout;
  let jumpUntil = 0, lastIdentity = null, lastX = 0, stuckSince = Date.now(), wasAir = false, landingTarget = null, overheadWaypoint = null;
  const metrics = { jumps: 0, landings: 0, recoveryClicks: 0, movingFeedback: false, observations: 0 };
  try {
    while (Date.now() < deadline) {
      const state = await leapMotion(page);
      metrics.observations++;
      const reached = until(state);
      // Real native keyup precedes any feedback/completion/pause/save observer.
      // Source matches the verified Easy/Medium word-result ordering and also
      // releases the completion branch before its final readback.
      if (reached || state.phase === 'word-result' || state.phase === 'retry-stage' || state.paused || state.saveHeld || !state.running) await input();
      if (reached) { await onCheckpoint(state); return { state, metrics }; }
      if (state.saveHeld) throw new Error('Native route stopped for an unresolved save failure');
      const identity = [state.stageIndex, state.legIndex, state.wordIndex, state.letterIndex, state.phase].join(':');
      if (identity !== lastIdentity) { lastIdentity = identity; await onCheckpoint(state); stuckSince = Date.now(); }
      // The callback may retain counts/positions, never an unbounded sequence
      // of full immutable response-history snapshots.
      onSample({ phase: state.phase, x: state.player?.x, y: state.player?.y,
        wordsDone: state.wordsDone, stage: state.stageIndex, slot: state.letterIndex, state,
        controllerPlan: {overheadWaypoint:overheadWaypoint?structuredClone(overheadWaypoint):null,landingTarget,jumpUntil} });
      if (state.phase === 'retry-stage' && recover) {
        await input();
        landingTarget = null;
        overheadWaypoint = null;
        await page.getByRole('button', { name: 'Keep going', exact: true }).click();
        metrics.recoveryClicks++;
        await page.waitForTimeout(100);
        continue;
      }
      if (!state.running || !state.player || state.paused) { await input(); await page.waitForTimeout(80); continue; }
      if (state.wordTransitionT > 0 && Math.abs(state.player.vx) > 1) metrics.movingFeedback = true;
      if (!state.player.onGround) wasAir = true;
      else if (wasAir) { metrics.landings++; wasAir = false; }
      // A native player can stop to hear the just-built word. The original
      // driver blindly held Right through the whole feedback dwell, skipped
      // its hazard planning and ran into the next room's pit. Keep the live
      // controller active, but deliberately release movement while listening.
      if (state.phase === 'word-result') { overheadWaypoint = null; await input(); await page.waitForTimeout(80); continue; }
      const goal = select(state);
      if (!goal) { overheadWaypoint = null; await input(1); await page.waitForTimeout(70); continue; }
      const player = state.player;
      if (leapWaypointArrived(state,overheadWaypoint)) overheadWaypoint = null;
      if (!overheadWaypoint) overheadWaypoint = leapLowOverheadWaypoint(state, goal);
      const target = overheadWaypoint || goal;
      let dx = target.x - player.x;
      const support = [...state.platforms, ...state.blocks.filter(b => !b.broken)].find(p =>
        player.x >= p.x - 12 && player.x <= p.x + p.w + 12 && Math.abs(player.y + player.h / 2 - p.y) < 5);
      if (target.y > player.y + 48 && Math.abs(dx) < 45 && support) {
        const left = support.x - 45, right = support.x + support.w + 45;
        const edge = Math.abs(left - target.x) < Math.abs(right - target.x) ? left : right;
        dx = edge - player.x;
      }
      const direction = Math.sign(dx);
      if (player.onGround) landingTarget = null;
      else if (landingTarget === null) landingTarget = leapAirLandingPlan(state, direction)?.targetX ?? null;
      const lower = state.bubbles.find(b => !b.taken && b.choiceId === target.choiceId && b.y > target.y + 40);
      const edgeX = support ? (direction > 0 ? support.x + support.w : support.x) : player.x;
      const gap = leapRaisedDepartureHazard(state, support, direction) || state.pits.some(([a,b]) => support
        ? Math.abs(edgeX-player.x) < 65 && edgeX+direction*35 > a && edgeX+direction*35 < b
        : player.x+direction*85 > a && player.x+direction*85 < b);
      const decoy = state.bubbles.some(b => b !== goal && !b.taken && direction === Math.sign(b.x-player.x)
        && Math.abs(b.x-player.x) < 85 && Math.abs(b.x-player.x) > 35);
      const foe = state.foes.some(f => direction === Math.sign(f.x-player.x) && Math.abs(f.x-player.x) < 130);
      const block = state.blocks.some(b => !b.broken && direction === Math.sign(b.x+b.w/2-player.x)
        && Math.abs(b.x+b.w/2-player.x) < 100 && b.y+b.h > player.y-55 && b.y < player.y+player.h/2);
      if (Math.abs(player.x-lastX) > 2) { lastX = player.x; stuckSince = Date.now(); }
      const stuck = Date.now()-stuckSince > 700 && Math.abs(dx)>20;
      if (player.onGround && Date.now() >= jumpUntil && (gap || decoy || foe || block || stuck
        || (target.y < player.y-45 && (Math.abs(dx)<130 || (lower && Math.abs(lower.x-player.x)<85))))) {
        jumpUntil = Date.now()+340; metrics.jumps++; stuckSince = Date.now();
      }
      await input(landingTarget === null ? (Math.abs(dx) < 12 ? 0 : direction) : leapLandingSteering(player, landingTarget), Date.now() < jumpUntil);
      await page.waitForTimeout(70);
    }
    const state = await leapMotion(page);
    const error=new Error(`Native route timed out at ${state.stageIndex}:${state.legIndex}:${state.wordIndex}:${state.letterIndex}; x=${state.player?.x}, y=${state.player?.y}, phase=${state.phase}`);
    error.nativeDiagnostic={capturedAt:Date.now(),state,controllerPlan:{overheadWaypoint:overheadWaypoint?structuredClone(overheadWaypoint):null,landingTarget,jumpUntil}};
    throw error;
  } finally { await input(); }
}
