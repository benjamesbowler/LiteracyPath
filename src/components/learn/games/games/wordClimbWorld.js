import { wordClimbChoicesForStep } from "../../../../utils/wordClimbLevels.js";

export const CLIMB_ROW_HEIGHT = 210;
export const CLIMB_VIEW_HEIGHT = 350;
const GRAVITY = 1700;
const FLIGHT_TIME = 0.94;

// All shelves are authored once in world coordinates. Answering never moves
// terrain. Rendering and collision detection read these same platform objects.
export function createClimbWorld(session, startStep = 0, random = Math.random) {
  const platforms = [{ id: "root", row: 0, x: 500, y: 0, width: 230, correct: true, word: "" }];
  for (let row = 1; row <= session.summit; row += 1) {
    wordClimbChoicesForStep(session.round, row - 1, random).forEach((choice, lane) => {
      platforms.push({ ...choice, id: `${row}-${lane}`, row, x: 190 + lane * 310,
        y: row * CLIMB_ROW_HEIGHT, width: 240 });
    });
  }
  const step = Math.max(0, Math.min(startStep, session.summit - 1));
  const safe = step ? platforms.find(p => p.row === step && p.correct) : platforms[0];
  return { platforms, summit: session.summit, step, x: safe.x, y: safe.y,
    vx: 0, vy: 0, safeId: safe.id, standingId: safe.id, targetId: null,
    state: "grounded", camera: safe.y - 115, wrong: 0, motorFalls: 0,
    paused: false, elapsed: 0, landingTime: 0, completed: false, event: null };
}

export function reachableClimbPlatforms(world) {
  if(world.journey&&world.journey.phase!=="word")return [];
  return world.platforms.filter(p => p.row === world.step + 1 && (!world.journey||p.kind==="word"));
}

function launch(world, target, recovering = false) {
  world.vx = (target.x - world.x) / FLIGHT_TIME;
  world.vy = (target.y - world.y + 0.5 * GRAVITY * FLIGHT_TIME ** 2) / FLIGHT_TIME;
  world.targetId = target.id;
  world.standingId = null;
  world.state = recovering ? "recovering" : "airborne";
}

export function jumpToClimbPlatform(world, id) {
  if (world.paused || world.completed || !["grounded", "landed"].includes(world.state)) return false;
  const target = reachableClimbPlatforms(world).find(p => p.id === id);
  if (!target) return false;
  launch(world, target);
  world.event = { type: "jump", platform: target };
  return true;
}

// Air steering can miss a leaf. A missed landing is a motor event, never a
// reading error. The safety vine returns to the last earned checkpoint.
export function advanceClimbWorld(world, seconds, steer = 0) {
  world.event = null;
  if (world.paused || world.completed) return;
  let remaining = Math.min(Math.max(seconds, 0), 0.1);
  while (remaining > 0) {
    const dt = Math.min(remaining, 1 / 120);
    remaining -= dt;
    world.elapsed += dt;
    if (world.state === "landed") {
      world.landingTime -= dt;
      if (world.landingTime <= 0) world.state = "grounded";
    }
    if (world.state === "clinging") {
      world.landingTime -= dt;
      if (world.landingTime <= 0) launch(world, world.platforms.find(p => p.id === world.safeId), true);
    }
    if (["airborne", "recovering"].includes(world.state)) {
      const beforeY = world.y;
      if (world.state === "airborne") world.vx += steer * 1400 * dt;
      world.x += world.vx * dt;
      world.y += world.vy * dt - 0.5 * GRAVITY * dt * dt;
      world.vy -= GRAVITY * dt;
      const safe = world.platforms.find(p => p.id === world.safeId);
      const landing = world.vy < 0 && world.platforms.find(p =>
        (world.state === "recovering" ? p.id === world.safeId : p.row <= world.step + 1) &&
        beforeY >= p.y && world.y <= p.y && Math.abs(world.x - p.x) <= p.width / 2);
      if (landing) {
        world.y = landing.y;
        world.vx = 0; world.vy = 0;
        world.standingId = landing.id;
        if (landing.row === world.step + 1 && world.state !== "recovering") {
          if (landing.correct) {
            world.step += 1; world.safeId = landing.id;
            world.state = "landed"; world.landingTime = 0.22;
            world.completed = world.step === world.summit;
            world.event = { type: world.completed ? "summit" : "correct", platform: landing };
          } else {
            world.wrong += 1; world.state = "clinging"; world.landingTime = 0.32;
            world.event = { type: "wrong", platform: landing };
          }
        } else if (landing.id === world.safeId) {
          world.state = "landed"; world.landingTime = 0.18;
          world.event = { type: "recovered", platform: landing };
        } else {
          world.motorFalls += 1; world.state = "clinging"; world.landingTime = 0.2;
          world.event = { type: "fall", platform: landing };
        }
      } else if (world.state === "airborne" && (world.y < safe.y - 130 || world.x < -80 || world.x > 1080)) {
        world.motorFalls += 1;
        world.state = "clinging"; world.landingTime = 0.25;
        world.vx = 0; world.vy = 0;
        world.event = { type: "fall", platform: safe };
      }
    }
    world.camera += (world.y - 115 - world.camera) * (1 - Math.exp(-7 * dt));
    if (world.event) break;
  }
}
