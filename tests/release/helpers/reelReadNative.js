import { REEL_READ_ART } from '../../../src/components/learn/games/games/reelReadArtData.js';
import { reelReadV2Ladder } from '../../../src/utils/reelReadV2Levels.js';
import { reelReadOperatorFrame, reelReadCastColumn } from '../../../src/utils/reelReadMotion.js';
import { reelReadSceneGeometry } from '../../../src/utils/reelReadSceneGeometry.js';
import { beginReelReadCast, stepReelReadSimulation } from '../../../src/utils/reelReadSimulation.js';

export const readReel=page=>page.evaluate(()=>window.__arcadePreviewSnapshot());
export const readReelFrame=page=>page.evaluate(()=>{
  const s=window.__arcadePreviewSnapshot();
  return {stage:s.stage,sessionSeed:s.sessionSeed,elapsedSeconds:s.elapsedSeconds,paused:s.paused,complete:s.complete,
    boatPosition:s.boatPosition,boatVelocity:s.boatVelocity,steering:s.steering,facing:s.facing,castAt:s.castAt,
    castPending:s.castPending,errorAt:s.errorAt,escapeAt:s.escapeAt,landedAt:s.landedAt,
    celebrationAt:s.celebrationAt,steerPulseUntil:s.steerPulseUntil,steerPulseDirection:s.steerPulseDirection,
    fish:s.fish,hook:s.hook,fight:s.fight,reeling:s.reeling,
    currentTask:s.currentTask,acceptedWords:s.acceptedWords,landedWords:s.landedWords,
    roundPendingAdvance:s.roundPendingAdvance,mistakes:s.mistakes,hintMistakes:s.hintMistakes,
    motorMisses:s.motorMisses,motorEscapes:s.motorEscapes,motorInterceptions:s.motorInterceptions,scene:s.scene,
    targetDelivered:s.evidence.audioReceipts.some(r=>r.stage===s.stage&&r.kind==='target')};
});

export async function openReel(page,difficulty='easy',{seed=913,sound=true,waitForArt=true,waitForCue=true}={}) {
  await page.addInitScript(()=>localStorage.setItem('lp-arcade-onboarded-v1:reel-read','1'));
  await page.goto(`/preview/game-overlay.html?game=reel-read&difficulty=${difficulty}&seed=${seed}&sound=${Number(sound)}&music=0`);
  const start=page.getByRole('button',{name:'Start playing',exact:true});if(await start.isVisible())await start.click();
  await page.waitForFunction(()=>Boolean(window.__arcadePreviewSnapshot?.()?.scene?.layout),null,{timeout:30000});
  if(waitForArt)await page.waitForFunction(()=>window.__arcadePreviewSnapshot().scene.delivered,null,{timeout:30000});
  if(sound) {
    await page.getByRole('button',{name:'Hear fishing clue again',exact:true}).click();
    if(waitForCue)await page.waitForFunction(()=>window.__arcadePreviewSnapshot().evidence.audioReceipts.length>0,null,{timeout:15000});
  }
}

/** Predict only the first swept physical impact from truthful current scene
 * geometry. The actual game receives native arrow/Space input, never answers,
 * positions, time changes or advancement. */
export function clearReelCast(snapshot,intendedId,difficulty='easy') {
  if(snapshot.hook||snapshot.castPending||snapshot.fight||snapshot.roundPendingAdvance)return false;
  const state={...structuredClone(snapshot),elapsed:snapshot.elapsedSeconds+.025,level:reelReadV2Ladder(difficulty,snapshot.sessionSeed)[snapshot.stage],
    celebrating:false,paused:false,complete:false,steering:0,castPending:false,hook:null,fight:null};
  const {world,character,layout}=snapshot.scene;
  const primary=REEL_READ_ART[`${character}-fishing-actions-v1`];
  const actorAsset=snapshot.scene.actor.delivered?primary:REEL_READ_ART[`${character}-fishing-fallback-v1`];
  const actorReady=snapshot.scene.actor.delivered;
  const kitPrimary=snapshot.scene.assets[`${world}-fishing-kit-v1`]==='delivered';
  const parts=REEL_READ_ART[`${world}-fishing-kit${kitPrimary?'':'-fallback'}-v1`].parts;
  const geometry=current=>{
    const frame=reelReadOperatorFrame(current),actorFrame=actorReady?actorAsset.frames[frame]:actorAsset.frames[0];
    return reelReadSceneGeometry(current,layout,{actorAsset,actorFrame,referenceFrames:primary.frames,parts,actorReady,frame});
  };
  beginReelReadCast(state,'keyboard');let impact=null;
  for(let step=0;step<280&&!impact;step++) {
    state.steering=state.elapsed<state.steerPulseUntil?state.steerPulseDirection:0;
    const view=geometry(state);
    stepReelReadSimulation(state,1/120,{...view,resolveRod:current=>geometry(current).rod},
      {onHook:fish=>{impact=fish.id;return{kind:'wrong-word'};}});
    if(state.motorMisses>snapshot.motorMisses)break;
  }
  return impact===intendedId;
}

export async function castReelKeyboard(page,id,difficulty='easy',{attempts=320}={}) {
  await page.locator('.lg-game-player-main').focus();
  for(let attempt=0;attempt<attempts;attempt++) {
    const before=await readReelFrame(page),fish=before.fish.find(row=>row.id===id);
    if(!fish)throw Error(`Physical fish${id} left the unchanged school`);
    if(clearReelCast(before,id,difficulty)) {
      await page.keyboard.press('Space');
      await page.waitForFunction(previous=>{
        const s=window.__arcadePreviewSnapshot();return Boolean(s.fight)||s.mistakes!==previous.mistakes||s.motorMisses!==previous.motorMisses;
      },before,{timeout:3500});
      const after=await readReelFrame(page);
      if(after.fight||after.mistakes!==before.mistakes)return after;
    } else if(!before.hook&&!before.castPending&&fish.visible) {
      const rod=before.scene.rod;
      if(Number.isFinite(rod?.tip.x)) {
        const facing=fish.x<before.scene.actor.placement.x?'left':'right';
        if(before.scene.layout.castReach>18&&before.facing!==facing) {
          await page.keyboard.press(facing==='left'?'ArrowLeft':'ArrowRight');
          await page.waitForTimeout(90);continue;
        }
        const column=reelReadCastColumn(rod,before.scene.layout,before.facing);
        const distance=fish.x-column,direction=distance<0?'ArrowLeft':'ArrowRight';
        const routeEdge=distance<0?before.boatPosition<=.01:before.boatPosition>=.99;
        if(Math.abs(distance)>54&&!routeEdge) {
          await page.keyboard.down(direction);await page.waitForTimeout(85);await page.keyboard.up(direction);continue;
        }
      }
    }
    await page.waitForTimeout(80);
  }
  throw Error(`No genuine native first-impact route to fish${id}`);
}

export async function landReelKeyboard(page) {
  try {
    for(let attempt=0;attempt<150;attempt++) {
      const state=await readReelFrame(page);if(!state.fight)return state;
      if(state.fight.tension>.76) {
        await page.keyboard.up('Space');await page.waitForTimeout(180);
      } else {
        await page.keyboard.down('Space');await page.waitForTimeout(150);
      }
    }
    throw Error('Actual reel/ease struggle did not resolve');
  } finally {
    await page.keyboard.up('Space');
  }
}
