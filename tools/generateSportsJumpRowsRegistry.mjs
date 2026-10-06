import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {SPORTS_SHARP_ART_REGISTRY} from '../src/components/learn/games/games/sportsSharpArtRegistry.js';
import {validateJumpRowPilotMetadata} from '../src/components/learn/games/games/sportsJumpRowPilot.js';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const WORLDS={meadow:'bouncy',dino:'chompy',moonwood:'pip'};
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
sharp.concurrency(2);

// Re-register existing lossless derivatives without rewriting their accepted
// source recipes or pixels. Every row must still be a crop of the current
// complete, registered model sheet. No partial table is written on failure.
export async function buildSportsJumpRowsRegistry(root=ROOT){
 const read=file=>fs.readFileSync(path.join(root,file));
 const result={};
 for(const [world,character]of Object.entries(WORLDS)){
  const rows=[];
  const modelSha256=sha(read(`public/game-assets/spell-skate/models/${character}-skater-v2.glb`));
  for(let view=0;view<8;view++){
   const full=SPORTS_SHARP_ART_REGISTRY.skater[world][view];
   const fullBytes=read(`public${full.metadata}`),original=JSON.parse(fullBytes);
   const stem=`/game-assets/spell-skate/recovery384-action-pilot/${character}/jump/view-${view}-v1`;
   const metadataBytes=read(`public${stem}.json`),raw=JSON.parse(metadataBytes),runtimeBytes=read(`public${stem}.webp`);
   const row={view,runtime:`${stem}.webp`,runtimeBytes:runtimeBytes.length,runtimeSha256:sha(runtimeBytes),
    metadata:`${stem}.json`,metadataBytes:metadataBytes.length,metadataSha256:sha(metadataBytes),
    decodedBytes:1536*384*4,decodedCropSha256:raw.decodedCropSha256};
   assert.equal(sha(fullBytes),full.metadataSha256,`${world}/${view}: current full registration`);
   assert.equal(sha(read(`public${full.runtime}`)),full.runtimeSha256,`${world}/${view}: current full image`);
   assert.equal(full.modelSha256,modelSha256,`${world}/${view}: current original model`);
   assert.ok(validateJumpRowPilotMetadata(raw,row,full),`${world}/${view}: finite row registration`);
   const sourceRecipe=`artwork/games/spell-skate/${world==='dino'?'derive_action_row_pilot':'derive_jump_rows'}.py`;
   assert.equal(sha(read(sourceRecipe)),raw.recipeSha256,`${world}/${view}: retained original derivation recipe`);
   assert.equal(sha(read(raw.source)),raw.sourceSha256,`${world}/${view}: retained original row PNG`);
   assert.equal(sha(read(raw.lineage.originalSourcePng)),raw.lineage.originalSourcePngSha256,`${world}/${view}: retained complete original PNG`);
   for(const [index,frame]of raw.frames.entries()){
    const prior=original.frames.filter(item=>item.state==='jump')[index];
    assert.deepEqual(frame.fullCell,prior.cell);
    for(const key of ['phase','groundAnchor','opaqueBounds','tyreContacts','soleContacts','palmAnchors','contactWorld'])assert.deepEqual(frame[key],prior[key],`${world}/${view}: actual ${key}`);
   }
   const oldPixels=await sharp(read(`public${full.runtime}`)).extract({left:0,top:1920,width:1536,height:384}).ensureAlpha().raw().toBuffer();
   const metadata=await sharp(runtimeBytes).metadata();
   assert.deepEqual([metadata.width,metadata.height],[1536,384]);
   const newPixels=await sharp(runtimeBytes).ensureAlpha().raw().toBuffer();
   assert.ok(newPixels.equals(oldPixels),`${world}/${view}: zero changed delivered RGBA channels`);
   assert.equal(sha(newPixels),row.decodedCropSha256,`${world}/${view}: registered decoded crop`);
   rows.push(row);
  }
  result[world]={character,rows,maximumEncodedBytes:rows.reduce((sum,row)=>sum+row.runtimeBytes,0),maximumMetadataEncodedBytes:rows.reduce((sum,row)=>sum+row.metadataBytes,0)};
 }
 return result;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const registry=await buildSportsJumpRowsRegistry();
 const output=path.join(ROOT,'src/components/learn/games/games/sportsJumpRowRegistry.js');
 const source=`// Generated from exact current384 delivered RGBA and retained lossless jump sources.\n// Regenerate with tools/generateSportsJumpRowsRegistry.mjs; never hand edit.\nconst freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};\nexport const SPORTS_JUMP_ROWS=freeze(${JSON.stringify(registry,null,2)});\n`;
 fs.writeFileSync(output,source);
 console.log('Registered all24 lossless jump rows against the complete current384 bank; native completion remains a separate gate.');
}
