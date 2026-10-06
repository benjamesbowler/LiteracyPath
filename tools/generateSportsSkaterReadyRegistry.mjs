import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {SPORTS_SHARP_ART_REGISTRY as originalRegistry} from '../src/components/learn/games/games/sportsSharpArtRegistry.js';
import {SPORTS_SKATER_READY_FORMAT,SPORTS_SKATER_READY_BYTES,SPORTS_SKATER_READY_WORLDS,validSportsSkaterReadyEntry,
 completeSportsSkaterReadyRegistry,validateSportsSkaterReadyMetadata} from '../src/components/learn/games/games/sportsSkaterReadyAtlas.js';
import {assembleReadyJumpAtlas} from '../artwork/games/spell-skate/derive_ready_jump_atlas.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const RECIPE='artwork/games/spell-skate/derive_ready_jump_atlas.mjs';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
sharp.concurrency(2);

// Equality includes invisible RGB as well as visible RGB and alpha. It is not
// a premultiplied/visual-only comparison and never erases padding differences.
export function assertReadyAtlasPixels(actual,expected,label){
 assert.equal(actual.length,expected.length,`${label}: exact decoded length`);
 assert.ok(actual.equals(expected),`${label}: zero changed RGBA channels`);
 return sha(actual);
}

export function assertReadyAtlasBytes(bytes,{length,sha256},label){
 assert.equal(bytes.length,length,`${label}: exact encoded length`);
 assert.equal(sha(bytes),sha256,`${label}: exact encoded fingerprint`);
}

export async function readPreparedSportsSkaterReadyWorld({root=ROOT,world}){
 assert.ok(Object.hasOwn(SPORTS_SKATER_READY_WORLDS,world),'Exact finite world');
 const read=file=>fs.readFileSync(path.join(root,file));
 const expected=await assembleReadyJumpAtlas({root,world});
 const stem=`/game-assets/spell-skate/recovery384-action-atlas-candidate/${expected.character}/coast-jump-v1`;
 const metadataBytes=read(`public${stem}.json`),raw=JSON.parse(metadataBytes),imageBytes=read(`public${stem}.webp`);
 const source=`source-art/arcade/spell-skate-3d/action-atlas-candidate/${expected.character}/coast-jump-v1.png`;
 assert.equal(raw.source,source,`${world}: exact retained source path`);
 const sourceBytes=read(source),recipeSha256=sha(read(RECIPE));
 assert.equal(raw.recipe,RECIPE,`${world}: sole current recipe`);
 assert.equal(raw.recipeSha256,recipeSha256,`${world}: current derivation binding`);
 assert.equal(raw.modelSha256,expected.sources[0].modelSha256,`${world}: original current model`);
 assert.equal(raw.runtime,`${stem}.webp`,`${world}: finite image path`);
 assertReadyAtlasBytes(imageBytes,{length:raw.runtimeBytes,sha256:raw.runtimeSha256},`${world}/delivery`);
 assertReadyAtlasBytes(sourceBytes,{length:sourceBytes.length,sha256:raw.sourceSha256},`${world}/retained source`);
 assert.deepEqual(raw.frames,expected.frames,`${world}: every original contact/pose registration`);
 assert.deepEqual(raw.lineage?.originalSources,expected.lineage,`${world}: retained original PNG lineage`);
 const entry={format:SPORTS_SKATER_READY_FORMAT,world,character:expected.character,runtime:`${stem}.webp`,runtimeBytes:imageBytes.length,
  runtimeSha256:sha(imageBytes),metadata:`${stem}.json`,metadataBytes:metadataBytes.length,metadataSha256:sha(metadataBytes),
  decodedBytes:SPORTS_SKATER_READY_BYTES,decodedSha256:raw.decodedSha256,viewSheet:[1536,3456],modelSha256:expected.sources[0].modelSha256,
  recipeSha256,sources:structuredClone(expected.sources),frameRegistrationSha256:[...expected.registrations]};
 assert.ok(await validateSportsSkaterReadyMetadata(raw,entry,originalRegistry,world),`${world}: exact complete finite registration`);
 for(const [label,bytes]of [['delivered',imageBytes],['retained PNG',sourceBytes]]){
  const metadata=await sharp(bytes).metadata();
  assert.deepEqual([metadata.width,metadata.height],[1536,3456],`${world}/${label}: all36 cells`);
  const pixels=await sharp(bytes).ensureAlpha().raw().toBuffer();
  const decodedSha256=assertReadyAtlasPixels(pixels,expected.rgba,`${world}/${label}`);
  assert.equal(decodedSha256,entry.decodedSha256,`${world}/${label}: registered readback`);
 }
 return entry;
}

// No partial table is returned or written. Runtime does not import this author;
// admission still requires the separately allocated native all-world gate.
export async function buildSportsSkaterReadyRegistry(root=ROOT,{loadWorld=readPreparedSportsSkaterReadyWorld}={}){
 const table={};
 for(const world of Object.keys(SPORTS_SKATER_READY_WORLDS)){
  const entry=await loadWorld({root,world});
  assert.ok(validSportsSkaterReadyEntry(entry,originalRegistry,world),`${world}: finite source entry`);table[world]=entry;
 }
 assert.ok(completeSportsSkaterReadyRegistry(table,originalRegistry),'All three worlds are required before writing the unused table');
 return table;
}

export function sportsSkaterReadyRegistrySource(table){
 assert.ok(completeSportsSkaterReadyRegistry(table,originalRegistry),'Never emit a partial or unknown-world registry');
 return `// Generated only from all3 complete exact-RGBA original sports coast/jump atlases.\n// Regenerate with tools/generateSportsSkaterReadyRegistry.mjs; never hand edit.\n// Normal runtime selection remains a separate native admission gate.\nconst freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};\nexport const SPORTS_SKATER_READY_REGISTRY=freeze(${JSON.stringify(table,null,2)});\n`;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert.equal(process.argv.length,2,'No partial or alternate registry mode');
 const table=await buildSportsSkaterReadyRegistry();
 const output=path.join(ROOT,'src/components/learn/games/games/sportsSkaterReadyRegistry.js');
 fs.writeFileSync(output,sportsSkaterReadyRegistrySource(table));
 console.log('Registered all3 exact coast/jump atlases; normal/native/full-outing gates remain separate.');
}
