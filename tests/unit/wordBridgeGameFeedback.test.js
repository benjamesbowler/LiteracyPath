import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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

  assert.match(returnSource, /sourceTile\.placed = false/);
  assert.match(returnSource, /placed: false/);
  assert.match(returnSource, /builder\.carrying = null/);
  assert.doesNotMatch(returnSource, /slots/);
  const builder = { x: 700, facing: 1, carrying: { sourceIndex: 0, w: 64 } };
  const tiles = [{ x: 80, homeX: 80, w: 64, placed: true }];
  const returned = Function("builder", "tiles", "clamp", "worldWidth", "GROUND_Y", `${returnSource}; return returnCarriedTileToBank();`)(builder, tiles, (v, lo, hi) => Math.max(lo, Math.min(hi, v)), 1600, 650);
  assert.equal(builder.carrying, null);
  assert.ok(Math.abs(returned.x - builder.x) < 120, "wrong piece stays near the attempted socket");
  assert.equal(returned.placed, false);
  assert.match(
    source,
    /setBanner\(mismatchFeedback\(carried\.glyph, slot\.needed\), 1\.9\);\s+const returnedTile = returnCarriedTileToBank\(\)/
  );
  assert.doesNotMatch(source, /The bridge ran out of the right tiles/);
});

test("Word Bridge exposes readable retry feedback and honours reduced motion", async () => {
  const source = await gameSource();

  assert.match(source, /data-wb="banner" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(source, /if \(reduceMotion\) elBanner\.style\.transition = "none"/);
  assert.match(source, /const bob = carried \|\| reduceMotion \? 0/);
  assert.match(source, /carried && !reduceMotion \? Math\.sin/);
  assert.match(source, /ctx\.fillText\("↺"/);
  assert.match(source, /if \(isInteractiveKeyTarget\(e\.target\)\) return/);
});

test("Word Bridge literacy actions commit on release and clear cancelled pointers", async () => {
  const source = await gameSource();
  const touchSource = readFunction(source, "setTouch");

  assert.match(
    touchSource,
    /btn\.addEventListener\("pointerup",[\s\S]*if \(key === "action" && releasedInside\) actionQueued = true/
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
  assert.deepEqual(result,{keys:{left:false,right:false},actionQueued:false,moveTargetX:null,pendingTapAction:null,targetedAction:null,canvasPointerIntent:null});
  assert.doesNotMatch(source,/carrying/);
});
