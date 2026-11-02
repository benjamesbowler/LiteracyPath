import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {checkHeldSourceEligibility,validateAppVisualHeldSources,HELD_LEXICAL_SOURCES,HELD_UNREACHABLE_SOURCES,HELD_THEME_REFERENCE} from '../../tools/lib/appVisualHeldSources.mjs';
import {collectAppVisualSourceGraph} from '../../tools/lib/appVisualSourceGraph.mjs';
import {collectPresentRuntimeImageBindings} from '../../tools/appVisualReviewInventory.mjs';

const review='source-literal:src/content/appVisualAssetReviews.generated.js';
const packPath='/guided-reading/pages/gr-a-26-page-1.webp';
function eligibility(){
  return {asset:{id:'held-pack8-page',path:packPath,kind:'guided-reading-unpublished-source',bookId:'gr-a-26',role:'page',pageIndex:0},
    inventoryItem:{path:packPath,sources:[review,'source-literal:src/data/guidedReadingBooks.js']},
    rawBooks:[{id:'gr-a-26',coverImage:'/guided-reading/covers/gr-a-26-cover.webp',active:false,qaStatus:'needs_regeneration',needsRegeneration:true,regenerationReason:'Existing exact authoring hold',pages:[{image:packPath,active:false,qaStatus:'needs_regeneration',regenerationReason:'Existing page hold'}]}],
    runtimePaths:new Set(),finitePaths:new Set(),reachable:new Set(),themeReference:HELD_THEME_REFERENCE};
}
test('held-source Pack8 disposition preserves explicit book and page holds',()=>{
  const result=checkHeldSourceEligibility(eligibility());assert.equal(result.valid,true);assert.equal(result.role.pageIndex,0);assert.equal(result.role.reason,'Existing exact authoring hold');
});
for(const [label,change]of [
  ['another published original book slot',x=>x.runtimePaths.add(x.rawBooks[0].coverImage)],
  ['published image',x=>x.runtimePaths.add(packPath)],
  ['active book',x=>x.rawBooks[0].active=true],
  ['approved book',x=>x.rawBooks[0].qaStatus='approved'],
  ['cleared regeneration flag',x=>x.rawBooks[0].needsRegeneration=false],
  ['cleared authoring reason',x=>x.rawBooks[0].regenerationReason=''],
  ['active page',x=>x.rawBooks[0].pages[0].active=true],
  ['approved page',x=>x.rawBooks[0].pages[0].qaStatus='approved'],
  ['cleared page hold',x=>x.rawBooks[0].pages[0].regenerationReason=''],
  ['wrong page index',x=>x.asset.pageIndex=2],
  ['wrong book',x=>x.asset.bookId='gr-a-27'],
  ['unlisted new book',x=>x.asset.bookId='gr-a-999'],
  ['new source consumer',x=>x.inventoryItem.sources.push('source-literal:src/NewReader.jsx')],
  ['runtime reading selector',x=>x.inventoryItem.sources.push('runtime-guided-reading')],
  ['runtime story selector',x=>x.inventoryItem.sources.push('runtime-story-quests')],
  ['imported source image',x=>x.inventoryItem.sources.push('source-image-file')],
  ['unknown disposition kind',x=>x.asset.kind='unused-image']
])test('Pack8 rejects '+label,()=>{const x=eligibility();change(x);assert.equal(checkHeldSourceEligibility(x).valid,false);});

for(const [p,sources]of Object.entries(HELD_LEXICAL_SOURCES)){
  test('exact lexical alias requires current/history negative bound: '+p,()=>{
    const x=eligibility();x.asset={id:'held-lexical',path:p,kind:'unselected-legacy-word-source'};x.inventoryItem={path:p,sources:[review,...sources.map(s=>'source-literal:'+s)]};
    assert.equal(checkHeldSourceEligibility(x).valid,true);
    x.finitePaths.add(p);assert.equal(checkHeldSourceEligibility(x).valid,false);
  });
}
for(const [p,owner]of Object.entries(HELD_UNREACHABLE_SOURCES))test('author source must remain unreachable: '+p,()=>{
  const x=eligibility();x.asset={id:'held-author',path:p,kind:'unreachable-legacy-author-source'};x.inventoryItem={path:p,sources:[review,'source-literal:'+owner]};
  assert.equal(checkHeldSourceEligibility(x).valid,true);x.reachable.add(owner);assert.equal(checkHeldSourceEligibility(x).valid,false);
});
for(const p of ['/images/pals/dino-cheer.webp','/images/companions/full/bouncy.webp','/guided-reading/pages/new-page.webp','/game-assets/sound-seekers/v2/biomes/fossil-canyon/background.webp'])test('no generic held-image exemption: '+p,()=>{
  const x=eligibility();x.asset={id:'unlisted',path:p,kind:'unreachable-legacy-author-source'};x.inventoryItem={path:p,sources:[review]};assert.equal(checkHeldSourceEligibility(x).valid,false);
});
test('unused theme-field label cannot exempt a dynamically emitted character image',()=>{
  const x=eligibility();x.asset={id:'theme-source',path:HELD_THEME_REFERENCE,kind:'unused-physical-theme-reference'};x.inventoryItem={path:HELD_THEME_REFERENCE,sources:['source-literal:src/components/learn/games/shared/physicalArcadeThemes.js']};
  assert.equal(checkHeldSourceEligibility(x).valid,false);
});
test('current V2 ton cue can never be relabeled as an unselected historical source',()=>{
  const x=eligibility();x.asset={id:'ton-is-current',path:'/images/child-mode/reviewed/arcade/ton.webp',kind:'unselected-legacy-word-source'};
  x.inventoryItem={path:x.asset.path,sources:['source-literal:src/data/generated/arcadeCuePictures.generated.js']};
  assert.equal(checkHeldSourceEligibility(x).valid,false);
});
test('dynamic root plus pose cannot hide behind an unread literal theme field',()=>{
  const x=eligibility();x.asset={id:'theme-source',path:HELD_THEME_REFERENCE,kind:'unused-physical-theme-reference'};x.inventoryItem={path:HELD_THEME_REFERENCE,sources:['source-literal:src/components/learn/games/shared/physicalArcadeThemes.js']};
  x.dynamicRuntimePaths=new Set([HELD_THEME_REFERENCE]);assert.equal(checkHeldSourceEligibility(x).valid,false);
});

function validContract(){
  const asset={id:'held-source-one',path:packPath,sha256:'a'.repeat(64),kind:'guided-reading-unpublished-source',bookId:'gr-a-26',role:'page',pageIndex:0};
  const currentProof={kind:'app-visual-held-source-proof-v1',assetDefinitions:createHash('sha256').update(JSON.stringify([asset])).digest('hex'),assets:[{...asset,eligibility:{valid:true}}],runtimeSources:{sha256:'b'.repeat(64)},errors:[]};
  return {registry:{schemaVersion:1,assets:[asset],proof:structuredClone(currentProof)},currentProof,records:[{path:packPath,sha256:asset.sha256,status:'held-source',sourceDispositionId:asset.id}],inventory:[{path:packPath}]};
}
test('separate exact held-source contract never claims approved pixels',()=>{
  const x=validContract(),result=validateAppVisualHeldSources(x);assert.deepEqual(result.failures,[]);assert.equal(result.held.size,1);assert.equal(x.records[0].status,'held-source');
});
for(const[label,change]of [
  ['stale runtime/caller bytes',x=>x.currentProof.runtimeSources.sha256='c'.repeat(64)],
  ['changed image bytes',x=>x.currentProof.assets[0].sha256='d'.repeat(64)],
  ['new active output',x=>{x.currentProof.errors.push('current output');x.registry.proof=structuredClone(x.currentProof);}],
  ['missing proof',x=>x.registry.proof=null],
  ['cleared source eligibility',x=>{x.currentProof.assets[0].eligibility.valid=false;x.registry.proof=structuredClone(x.currentProof);}],
  ['pixel-approved replacement status',x=>x.records[0].status='approved'],
  ['missing exact disposition ID',x=>delete x.records[0].sourceDispositionId],
  ['wrong review bytes',x=>x.records[0].sha256='e'.repeat(64)],
  ['extra unlisted held record',x=>x.records.push({path:'/images/pals/dino-cheer.webp',status:'held-source'})],
  ['missing inventory',x=>x.inventory=[]],
  ['duplicate asset',x=>x.registry.assets.push(x.registry.assets[0])],
  ['null asset',x=>x.registry.assets.push(null)],
  ['malformed path',x=>x.registry.assets[0].path='/guided-reading/../images/foo.webp'],
  ['malformed hash',x=>x.registry.assets[0].sha256='unknown'],
  ['definitions changed after proof',x=>x.registry.assets[0].id='changed']
])test('held-source contract rejects '+label,()=>{const x=validContract();change(x);assert.ok(validateAppVisualHeldSources(x).failures.length);});
test('empty registry permits ordinary visual review but forbids held records',()=>{
  const x={registry:{schemaVersion:1,assets:[],proof:null},records:[],inventory:[]};assert.deepEqual(validateAppVisualHeldSources(x).failures,[]);x.records.push({path:packPath,status:'held-source'});assert.ok(validateAppVisualHeldSources(x).failures.length);
});
test('Present inventory enumerates every named day rather than repeating the saved default',()=>{
  const bindings=collectPresentRuntimeImageBindings();
  assert.deepEqual([...new Set(bindings.filter(x=>x.cycleId==='cycle-1').map(x=>x.day))].sort(),['','friday','monday','thursday','tuesday','wednesday']);
  assert.ok(bindings.some(x=>x.path==='/game-assets/sound-seekers/characters/chompy/pose-ready.webp'));
});
test('fresh source graph follows lazy imports and globs, rejects unresolved dynamic boundaries',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'lp-held-graph-test-'));
  try{
    fs.mkdirSync(path.join(root,'src/lazy'),{recursive:true});
    fs.writeFileSync(path.join(root,'src/main.jsx'),"import './style.css'; import('./lazy/a.js'); import.meta.glob('./lazy/*.js');");
    fs.writeFileSync(path.join(root,'src/lazy/a.js'),'export const ready=true;');fs.writeFileSync(path.join(root,'src/lazy/b.js'),'export const other=true;');fs.writeFileSync(path.join(root,'src/style.css'),'');
    let graph=collectAppVisualSourceGraph(root);assert.deepEqual(graph.issues,[]);assert.deepEqual(graph.dynamic,[]);assert.ok(graph.modules.includes('src/lazy/b.js'));
    fs.appendFileSync(path.join(root,'src/main.jsx'),"import('./missing.js'); import(variable);");graph=collectAppVisualSourceGraph(root);assert.equal(graph.issues.length,1);assert.equal(graph.dynamic.length,1);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
