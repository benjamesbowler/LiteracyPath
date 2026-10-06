import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { releaseWordBridgePhysicalPiece } from '../../src/components/learn/games/games/wordBridgePieceOwnership.js';
import { buildWordBridgeRounds, newWordBridgeEvidence, commitWordBridgePlacement } from '../../src/components/learn/games/games/wordBridgeLearning.js';
import { wordBridgeContentLadder } from '../../src/components/learn/games/games/wordBridgeContent.js';
import { newWordBridgeConstructionMotion, wordBridgeSlotSurface } from '../../src/components/learn/games/games/wordBridgeConstructionMotion.js';

const gamePath = new URL(
  "../../src/components/learn/games/games/WordBridgeGame.jsx",
  import.meta.url
);

async function gameSource() {
  return readFile(gamePath, "utf8");
}

function readFunction(source, functionName) {
  const start = source.indexOf(`function ${functionName}(`);
  assert.notEqual(start, -1, `${functionName} should exist`);
  const lineStart = source.lastIndexOf("\n", start) + 1;
  const indent = source.slice(lineStart, start);
  const end = source.indexOf(`\n${indent}}\n`, start);
  assert.notEqual(end, -1, `${functionName} should have a readable body`);
  return source.slice(start, end + indent.length + 3);
}

test("Word Bridge mismatch feedback names both the selected and needed tile", async () => {
  const source = await gameSource();
  const functionSource = readFunction(source, "mismatchFeedback");
  const mismatchFeedback = Function(
    `"use strict"; ${functionSource}; return mismatchFeedback;`
  )();

  assert.equal(
    mismatchFeedback("B", "C"),
    "You chose B. This space needs C. Try again."
  );
  assert.equal(
    mismatchFeedback("sat", "cat", true),
    "sat belongs later. This space needs cat."
  );
});

test("Word Bridge returns a wrong distractor without changing completed slots", async () => {
  const source = await gameSource();
  const returnSource = readFunction(source, "returnCarriedTileToBank");

  assert.match(returnSource, /releaseWordBridgePhysicalPiece/);
  assert.match(returnSource, /builder\.carrying = null/);
  assert.doesNotMatch(returnSource, /slots/);
  const builder = { x: 700, facing: 1, carrying: { sourceIndex: 0, physicalId: 0, glyph: "z", correct: false, order: 0, placed: true, w: 64 } };
  const tiles = [{ physicalId: 0, glyph: "z", correct: false, order: 0, x: 80, homeX: 80, w: 64, placed: true }];
  const returned = Function("builder", "tiles", "clamp", "worldWidth", "GROUND_Y", "releaseWordBridgePhysicalPiece", `${returnSource}; return returnCarriedTileToBank();`)(builder, tiles, (v, lo, hi) => Math.max(lo, Math.min(hi, v)), 1600, 650, releaseWordBridgePhysicalPiece);
  assert.equal(builder.carrying, null);
  assert.ok(Math.abs(returned.x - builder.x) < 120, "wrong piece stays near the attempted socket");
  assert.equal(returned.placed, false);
  assert.match(
    source,
    /setBanner\(levelMistakes >= 2 \? mismatchFeedback\(carried\.glyph, slot\.needed\)[\s\S]*?const returnedTile = returnCarriedTileToBank\(\)/
  );
  assert.doesNotMatch(source, /The bridge ran out of the right tiles/);
});

test("Word Bridge exposes readable retry feedback and honours reduced motion", async () => {
  const source = await gameSource();

  assert.match(source, /data-wb="banner" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(source, /if \(reduceMotion\) elBanner\.style\.transition = "none"/);
  assert.match(source, /const bob = carried \|\| reduceMotion \? 0/);
  assert.match(source, /carried && !reduceMotion && !t\.registeredGrip \? Math\.sin/);
  assert.match(source, /ctx\.fillText\("↺"/);
  assert.match(source, /if \(isInteractiveKeyTarget\(e\.target, e\.key\) && !movementControlOwnsFocus\) return/);
});

test("Word Bridge literacy actions commit on release and clear cancelled pointers", async () => {
  const source = await gameSource();
  const touchSource = readFunction(source, "setTouch");

  assert.match(
    touchSource,
    /btn\.addEventListener\("pointerup",[\s\S]*if \(key === "action" && releasedInside\s*&&\s*keysActive\(\)\) \{[\s\S]*actionQueued = true/
  );
  assert.match(touchSource, /const rect = btn\.getBoundingClientRect\(\)/);
  const pointerDownSource = touchSource.slice(
    touchSource.indexOf('btn.addEventListener("pointerdown"'),
    touchSource.indexOf('btn.addEventListener("pointerup"')
  );
  assert.doesNotMatch(
    pointerDownSource,
    /actionQueued = true/
  );
  assert.match(source, /cv\.addEventListener\("pointerup", event =>/);
  assert.match(source, /Math\.hypot\(x - intent\.startX, y - intent\.startY\) > 32/);
  assert.match(source, /cv\.addEventListener\("pointercancel", clearCanvasPointerIntent\)/);
  assert.match(source, /cv\.addEventListener\("lostpointercapture", clearCanvasPointerIntent\)/);
});

test("Word Bridge pause and blur discard queued tap destinations without dropping a carried piece",async()=>{
  const source=readFunction(await gameSource(),'clearHeldControls');
  const result=Function(`const keys={left:true,right:true};let actionQueued=true,moveTargetX=800,pendingTapAction={type:'tile'},targetedAction={type:'slot'},canvasPointerIntent={pointerId:1};${source};clearHeldControls();return {keys,actionQueued,moveTargetX,pendingTapAction,targetedAction,canvasPointerIntent};`)();
  assert.deepEqual(result,{keys:{left:false,right:false,action:false},actionQueued:false,moveTargetX:null,pendingTapAction:null,targetedAction:null,canvasPointerIntent:null});
  assert.doesNotMatch(source,/carrying/);
});

test('placing the last correct bridge piece starts the crossing once, without another action', async () => {
  const action=readFunction(await gameSource(),'handleAction');
  const round=buildWordBridgeRounds(wordBridgeContentLadder('easy', 17), 'easy', 17, 0)[0];
  const result=Function('round','newWordBridgeEvidence','commitWordBridgePlacement','newWordBridgeConstructionMotion','wordBridgeSlotSurface', `${action}
    let targetedAction=null, phase='PLAYING', score=0, bridgeGlow=0, constructionMotion=null, constructionPiece=null, constructionSlot=null;
    const learningRounds=[round], stageIdx=0, supportReasons={}, originStage=0, cue={snapshot:()=>({})}, opts={getSound:()=>false};
    let evidence=newWordBridgeEvidence();
    const slots=round.units.map((needed,order)=>({filled:order<round.units.length-1,needed,x:20,y:20,w:56,h:56,order}));
    for(let slot=0;slot<slots.length-1;slot++) {
      const tile=round.tiles.find(t=>t.correct&&t.glyph.toUpperCase()===round.units[slot].toUpperCase()&&!evidence.acceptedResponses.some(r=>r.tileId===t.id));
      evidence=commitWordBridgePlacement(evidence,round,slot,tile.id,{soundEnabled:false}).evidence;
    }
    const tile=round.tiles.find(t=>t.correct&&t.glyph.toUpperCase()===round.units.at(-1).toUpperCase()&&!evidence.acceptedResponses.some(r=>r.tileId===t.id));
    const builder={carrying:{correct:true,glyph:tile.glyph,physicalId:tile.id}};
    const pals=[{x:20,speed:10}], worldWidth=200, theme={light:'#fff'};
    const normalizeGlyph=value=>value.toLowerCase();
    const sfx=()=>{},playCorrectChime=()=>{},playCelebrationFanfare=()=>{},emitBurst=()=>{},addFloat=()=>{},renderTargetHUD=()=>{},setBanner=()=>{},targetSpeechText=()=>round.units.join('');
    handleAction({type:'slot',index:slots.length-1});
    handleAction({type:'slot',index:slots.length-1});
    return {phase,score,filled:slots.every(s=>s.filled),carrying:builder.carrying,speed:pals[0].speed,evidence};
  `)(round,newWordBridgeEvidence,commitWordBridgePlacement,newWordBridgeConstructionMotion,wordBridgeSlotSurface);
  assert.equal(result.phase,'PALS_CROSSING');
  assert.equal(result.score,35);
  assert.equal(result.filled,true);
  assert.equal(result.carrying,null);
  assert.equal(result.evidence.acceptedResponses.length,round.units.length);
  assert.equal(result.evidence.completions.length,1);
  assert.ok(result.speed>100,'crossing is a short automatic feedback beat');
});
