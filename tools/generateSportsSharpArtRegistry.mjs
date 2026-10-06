import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const WORLDS={meadow:'bouncy',dino:'chompy',moonwood:'pip'};
const STATES={driver:['drive','turn_left','turn_right','brake','recover','celebrate'],skater:['coast','push','turn_left','turn_right','crouch','jump','land','grind','stumble','recover']};
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const same=(a,b,message)=>assert.deepEqual(a,b,message);
const point=(value,dimensions,limit)=>Array.isArray(value)&&value.length===dimensions&&value.every(n=>Number.isFinite(n)&&(limit===undefined||n>=0&&n<limit));

// Authoring only: a missing/stale direction prevents the entire normal registry
// from being written. Native craft/playability acceptance remains a separate
// release gate. No partial bank or alternate cell dimensions are admitted.
export function buildSportsSharpArtRegistry(root=ROOT){
 const read=file=>fs.readFileSync(path.join(root,file));
 const registry={driver:{},skater:{}};
 for(const kind of ['driver','skater']){
  const states=STATES[kind],game=kind==='driver'?'sound-racer':'spell-skate',actor=kind==='driver'?'kart':'skater';
  for(const [world,character]of Object.entries(WORLDS)){
   const modelSha256=sha(read(`public/game-assets/${game}/models/${character}-${actor}-v2.glb`));
   const editableSha256=sha(read(`source-art/arcade/${game}-3d/${character}-${actor}-v2.blend`));
   registry[kind][world]=[];
   for(let view=0;view<8;view++){
    const stem=`/game-assets/${game}/recovery384/${character}/view-${view}-v2`;
    const folder=`source-art/arcade/${game}-3d/recovery384/${character}/view-${view}`;
    const metadataBytes=read(`public${stem}.json`),raw=JSON.parse(metadataBytes);
    const source=JSON.parse(read(`${folder}/view-${view}-sheet-v2.json`));
    const label=`${kind}/${world}/${view}`;
    same([raw.kind,raw.world,raw.character,raw.view,raw.format],[kind,world,character,view,`${kind}-384-tight-v2`],`${label}: finite context`);
    same(raw.cell,[384,384],`${label}: registered source cell`);
    same(raw.viewSheet,[1536,states.length*384],`${label}: complete sheet dimensions`);
    same(raw.states,states,`${label}: actual native clips`);same(raw.phases,[0,.25,.5,.75],`${label}: actual native phases`);
    same(raw.modelSha256,modelSha256,`${label}: current primary source`);
    same(source.modelSha256,modelSha256,`${label}: current original editable source`);
    same(source.editableSha256,editableSha256,`${label}: current retained Blend`);
    same(source.recipeSha256,sha(read(source.sourceRecipe)),`${label}: exact retained original render recipe`);
    same(source.packingRecipeSha256,sha(read(source.packingRecipe)),`${label}: exact retained packing recipe`);
    same(source.frames,raw.frames,`${label}: unchanged evaluated registration`);
    same(raw.framing,source.framing,`${label}: unchanged original pose-union camera`);
    same(raw.framing?.mode,'native-pose-union');same(raw.framing.unionPoseCount,states.length*4);same(raw.framing.marginPixels,12);
    assert.ok(Number.isFinite(raw.pixelsPerUnit)&&raw.pixelsPerUnit>0&&Number.isFinite(raw.framing.orthoScale)&&raw.framing.orthoScale>0);
    assert.ok(Number.isFinite(raw.framing.originalOrthoScale)&&raw.framing.originalOrthoScale>0,`${label}: retained physical shadow registration`);
    assert.ok(Math.abs(384/raw.framing.orthoScale-raw.pixelsPerUnit)<1e-6,`${label}: registered physical texel density`);
    same(raw.runtime,`${stem}.webp`);same(raw.frames.length,states.length*4);
    const keys=new Set();
    for(const frame of raw.frames){
     const row=states.indexOf(frame.state),column=raw.phases.indexOf(frame.phase),key=`${row}:${column}`;
     assert.ok(row>=0&&column>=0&&!keys.has(key),`${label}: complete unique native pose`);keys.add(key);
     same(frame.cell,[column*384,row*384,384,384]);same(frame.source,`${frame.state}-${column}.png`);
     same(frame.sha256,sha(read(`${folder}/frames/${frame.source}`)),`${label}: actual retained rendered pose`);
     assert.ok(point(frame.groundAnchor,2,384),`${label}: actual projected world origin`);
     const bounds=frame.opaqueBounds;assert.ok(Array.isArray(bounds)&&bounds.length===4&&bounds.every(n=>Number.isFinite(n)&&n>0&&n<384)&&bounds[0]<bounds[2]&&bounds[1]<bounds[3],`${label}: full alpha contour`);
     for(const [name,count]of [['tyreContacts',4],[kind==='driver'?'pedalSoles':'soleContacts',2],...(kind==='skater'?[['palmAnchors',2]]:[])]){
      assert.ok(Array.isArray(frame[name])&&frame[name].length===count&&frame[name].every(p=>point(p,2,384)),`${label}: evaluated projected ${name}`);
     }
     for(const [name,count]of [['tyres',4],['soles',2],...(kind==='skater'?[['palms',2]]:[])]){
      assert.ok(Array.isArray(frame.contactWorld?.[name])&&frame.contactWorld[name].length===count&&frame.contactWorld[name].every(p=>point(p,3)),`${label}: original evaluated world ${name}`);
     }
    }
    const imageBytes=read(`public${raw.runtime}`),decodedBytes=1536*states.length*384*4;
    same(sha(imageBytes),raw.runtimeSha256,`${label}: exact delivery bytes`);same(imageBytes.length,raw.runtimeBytes);
    same(source.runtimeSha256,raw.runtimeSha256,`${label}: original source/delivery binding`);
    same(sha(read(source.sourceSheet)),source.sourceSheetSha256,`${label}: complete original alpha sheet`);
    same(raw.decodedBytes,decodedBytes,`${label}: declared actual RGBA ownership`);
    registry[kind][world].push({format:raw.format,kind,world,character,view,metadata:`${stem}.json`,metadataBytes:metadataBytes.length,metadataSha256:sha(metadataBytes),runtime:raw.runtime,runtimeBytes:imageBytes.length,runtimeSha256:raw.runtimeSha256,modelSha256,
     decodedBytes,pixelsPerUnit:raw.pixelsPerUnit,groundAnchor:raw.frames[0].groundAnchor,
     ...(kind==='skater'?{shadowPixelsPerUnit:256/raw.framing.originalOrthoScale}:{})});
   }
  }
 }
 return registry;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const registry=buildSportsSharpArtRegistry();
 const output=path.join(ROOT,'src/components/learn/games/games/sportsSharpArtRegistry.js');
 const text=`// Generated from all48 complete original-model directional sources.\n// Regenerate with tools/generateSportsSharpArtRegistry.mjs; never hand edit.\nconst freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};\nexport const SPORTS_SHARP_ART_REGISTRY=freeze(${JSON.stringify(registry,null,2)});\n`;
 fs.writeFileSync(output,text);
 console.log('Registered all48 complete384px sports sheets; native game/release gates remain separate.');
}
