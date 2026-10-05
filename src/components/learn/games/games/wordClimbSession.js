import { createClimbJourney } from "./wordClimbJourney.js";
import { climbLayoutRevision } from "./wordClimbPacedRoute.js";
import { createClimbWorld } from "./wordClimbWorld.js";
import { createWordClimbPracticeState, validateWordClimbPracticeSession } from "./wordClimbPracticeSession.js";
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
    if(!world.journey){
      const reference=createClimbWorld(saved.session,0,()=>.32),byId=new Map(reference.platforms.map(p=>[p.id,p]));
      if(world.platforms.length!==reference.platforms.length||new Set(world.platforms.map(p=>p.id)).size!==reference.platforms.length
        ||world.platforms.some(p=>{const expected=byId.get(p.id);return !expected||['x','y','row','width'].some(k=>p[k]!==expected[k]);}))return null;
      return {session:saved.session,world:{...world,paused:false,event:null}};
    }
    const layoutRevision=climbLayoutRevision(world.journey);
    if(!layoutRevision)return null;
    const reference=createClimbJourney(saved.session,world.journey.stageIndex,0,()=>.32,{layoutRevision});
    // Old worlds remain exactly where the child left them. Recognising an old
    // finite recipe never rebuilds a corridor or moves a saved obstruction.
    if(world.platforms.length!==reference.platforms.length||new Set(world.platforms.map(p=>p.id)).size!==reference.platforms.length)return null;
    const byId=new Map(reference.platforms.map(p=>[p.id,p]));
    if(world.platforms.some(p=>{const expected=byId.get(p.id);return !expected||['x','y','row','kind','width'].some(k=>p[k]!==expected[k]);}))return null;
    if(world.journey.sectionHeight!==reference.journey.sectionHeight||world.summitHeight!==reference.summitHeight
      ||JSON.stringify(world.journey.lights)!==JSON.stringify(reference.journey.lights)
      ||world.journey.obstacles?.length!==reference.journey.obstacles.length
      ||world.journey.obstacles.some((o,i)=>{const expected=reference.journey.obstacles[i];return Object.keys(o).join('|')!==Object.keys(expected).join('|')||Object.keys(expected).some(k=>k==='x'?(!Number.isFinite(o.x)||Math.abs(o.x-expected.x)>1e-9):o[k]!==expected[k]);}))return null;
    // The old final landing updated safeId but left safeRest on its launch
    // base. Retain the genuinely completed world and synchronise its saved
    // attachment with that final solid shelf, without inventing responses.
    if (world.completed && world.step === world.summit && world.journey && world.journey.layoutRevision === undefined) {
      const final = world.platforms.find(platform => platform.id === world.safeId && platform.correct && platform.row === world.summit);
      if (final && world.y === final.y && Math.abs(world.x - final.x) <= final.width / 2 + 25) {
        world.journey.safeRest = { id: final.id, x: world.x, y: world.y };
      }
    }
    const checked=createWordClimbPracticeState(saved.session,world,{difficulty:saved.session.difficulty,seed:0,journeyIndex:0,
      originStep:Math.min(world.step,world.summit-1),legacyResume:true,legacyCompletedResume:world.completed});
    const valid=validateWordClimbPracticeSession(checked,saved.session.difficulty,0,0);
    return valid?{session:valid.session,world:valid.world}:null;
  } catch { return null; }
}
export function writeClimbSession(storage,key,session,world,feedback=world.feedback) {
  try { storage?.setItem(key,JSON.stringify({v:2,session,world:{...world,feedback,paused:false,event:null}})); } catch { /* Parent checkpoint remains usable if storage is full. */ }
}
export function clearClimbSession(storage,key) { try { storage?.removeItem(key); } catch { /* Optional local continuity. */ } }
