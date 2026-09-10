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
    return {session:saved.session,world:{...world,paused:false,event:null}};
  } catch { return null; }
}
export function writeClimbSession(storage,key,session,world,feedback=world.feedback) {
  try { storage?.setItem(key,JSON.stringify({v:2,session,world:{...world,feedback,paused:false,event:null}})); } catch { /* Parent checkpoint remains usable if storage is full. */ }
}
export function clearClimbSession(storage,key) { try { storage?.removeItem(key); } catch { /* Optional local continuity. */ } }
