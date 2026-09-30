import { climbRouteCenter, createClimbJourney } from "./wordClimbJourney.js";
export function climbSessionKey(scope = "default", difficulty = "easy") { return `literacy-guide-word-climb:${scope}:${difficulty}`; }
export function readClimbSession(storage, key, checkpoint, checkpointPresent) {
  if (!checkpointPresent) return null;
  try {
    const saved=JSON.parse(storage?.getItem(key)||"null");
    if(saved?.v!==2 || !saved.session?.target || !Array.isArray(saved.world?.platforms))return null;
    const world=saved.world;
    if(Math.min(world.step,world.summit-1)!==Number(checkpoint) || world.summit!==saved.session.summit)return null;
    if(!["x","y","vx","vy","camera","step","summit","wrong","motorFalls","elapsed","landingTime"].every(k=>Number.isFinite(world[k])))return null;
    if(!world.platforms.some(p=>p.id===world.safeId&&p.correct))return null;
    if(!["grounded","landed","airborne","clinging","recovering","climbing","gripping"].includes(world.state))return null;
    if (world.journey?.travelPerSection > 600 && !world.completed) {
      // Resume older long corridors at the last earned word, retaining content
      // and reading evidence while adopting the current shorter physical route.
      const refreshed = createClimbJourney(saved.session, world.journey.stageIndex, world.step);
      for (const p of refreshed.platforms) {
        const previous = world.platforms.find(old => old.id === p.id && old.kind === "word");
        if (previous) { p.word = previous.word; p.correct = previous.correct; }
      }
      const safe = refreshed.platforms.find(p => p.kind === "word" && p.row === world.step && p.correct)
        || refreshed.platforms.find(p => p.id === "root");
      Object.assign(refreshed, { x:safe.x, y:safe.y, camera:safe.y-115, safeId:safe.id, standingId:safe.id,
        wrong:world.wrong, motorFalls:world.motorFalls, elapsed:world.elapsed });
      refreshed.journey.branchStartX=safe.x;
      refreshed.journey.safeRest={id:safe.id,x:safe.x,y:safe.y};
      refreshed.journey.collected=(world.journey.collected || []).filter(id=>refreshed.journey.lights.some(l=>l.id===id));
      return {session:saved.session,world:refreshed};
    }
    // Adopt the roomier thorn route in existing saves without resetting a
    // child's position, earned words, collected lights or recovery state.
    if (Array.isArray(world.journey?.obstacles)) {
      world.journey.obstacles = world.journey.obstacles.map(obstacle => ({
        ...obstacle,
        x: climbRouteCenter(world.journey, obstacle.y) + obstacle.side * 96,
        width: 104
      }));
    }
    return {session:saved.session,world:{...world,paused:false,event:null}};
  } catch { return null; }
}
export function writeClimbSession(storage,key,session,world,feedback=world.feedback) {
  try { storage?.setItem(key,JSON.stringify({v:2,session,world:{...world,feedback,paused:false,event:null}})); } catch { /* Parent checkpoint remains usable if storage is full. */ }
}
export function clearClimbSession(storage,key) { try { storage?.removeItem(key); } catch { /* Optional local continuity. */ } }
