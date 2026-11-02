import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isVerifiedInactiveImageRetirement,INACTIVE_IMAGE_POLICY_PINS,INACTIVE_IMAGE_EVALUATOR,INACTIVE_IMAGE_VALIDATOR} from '../../tools/lib/inactiveImageRetirement.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const hashJson=value=>hash(JSON.stringify(value));
const clone=structuredClone;

function fixture(){
  const image='/images/assessment/hfw/unused.webp',oldHash=hash('exact historical pixels');
  const table='src/data/childWordMediaManifest.js';
  const sources=INACTIVE_IMAGE_POLICY_PINS.map(path=>({path,sha256:hash(path)}));
  sources.push({path:table,sha256:hash('original catalogue')});sources.sort((a,b)=>a.path.localeCompare(b.path));
  const bindings={count:1,sha256:hashJson([{surface:'practice',path:'/images/child-mode/reviewed/cat.webp',kind:'positive-current-output'}])};
  const before={kind:'finite-image-binding-proof-v1',evaluator:{path:INACTIVE_IMAGE_EVALUATOR,sha256:hash('evaluator'),validatorPath:INACTIVE_IMAGE_VALIDATOR,validatorSha256:hash('validator')},
    allBindings:clone(bindings),nonretiredBindings:clone(bindings),positiveBindings:clone(bindings),
    coverage:{count:4,sha256:hash('exact coverage'),surfaces:['Present','Worksheets','Formal Assessment','MAP all accepted historical/current resume']},
    historicalBranches:{count:1,sha256:hash('exact accepted resume branch outputs'),branches:[{version:'current',mixed:false,total:1,eligible:1,withdrawn:0,uniqueImages:1}]},
    sourceFiles:clone(sources),runtimeSources:{count:sources.length,sha256:hashJson(sources),files:clone(sources)},retiredBoundPaths:[],retiredPositiveBoundPaths:[],errors:[]};
  const after=clone(before);
  for(const rows of [after.sourceFiles,after.runtimeSources.files])rows.find(row=>row.path===table).sha256=hash('image fields retired; words and audio kept');
  after.runtimeSources.sha256=hashJson(after.runtimeSources.files);
  return {retirement:{id:'inactive-picture-cohort',kind:'current-runtime-inactive-image',sourceRevision:'a'.repeat(40),assetCount:1,assets:[{oldPath:image,sha256:oldHash}],
    proof:{schemaVersion:1,before,after},catalogueChanges:[{path:table,beforeSha256:hash('original catalogue'),afterSha256:hash('image fields retired; words and audio kept')}]},
    previousHashes:{[image]:oldHash},historicalHashes:{[image]:oldHash},currentHashes:{},currentFingerprint:clone(after),deletedPaths:['public'+image],existingPaths:[],unauditedReferences:[]};
}
function retarget(f,image){
  const sha256=f.retirement.assets[0].sha256;
  f.retirement.assets[0].oldPath=image;f.previousHashes={[image]:sha256};f.historicalHashes={[image]:sha256};f.deletedPaths=['public'+image];
}

test('an exact inactive-image cohort requires historical bytes and fresh current, retention and accepted-history proof',()=>{
  assert.equal(isVerifiedInactiveImageRetirement(fixture()),true);
});

for(const [name,mutate]of [
  ['unregistered retirement kind',f=>{f.retirement.kind='delete-images';}],
  ['malformed recovery revision',f=>{f.retirement.sourceRevision='main';}],
  ['partial asset record',f=>{f.retirement.assetCount=2;}],
  ['duplicate path binding',f=>{f.retirement.assets.push(clone(f.retirement.assets[0]));f.retirement.assetCount++;}],
  ['traversal path',f=>{f.retirement.assets[0].oldPath='/images/../private.webp';}],
  ['companion artwork outside audited word-picture pools',f=>retarget(f,'/images/companions/full/hero.webp')],
  ['Pal artwork outside audited word-picture pools',f=>retarget(f,'/images/pals/meadow-cheer.webp')],
  ['background artwork outside audited word-picture pools',f=>retarget(f,'/images/learn-games/forest.webp')],
  ['classroom reference artwork outside audited word-picture pools',f=>retarget(f,'/images/assessment/literacy-classroom/camping.webp')],
  ['Guided Reading artwork outside audited word-picture pools',f=>retarget(f,'/guided-reading/series/meadow-pals/book-01/cover.webp')],
  ['malformed old SHA',f=>{f.retirement.assets[0].sha256='unknown';}],
  ['changed comparison-base pixels',f=>{f.previousHashes[f.retirement.assets[0].oldPath]=hash('different pixels');}],
  ['changed historical pixels',f=>{f.historicalHashes[f.retirement.assets[0].oldPath]=hash('different historical pixels');}],
  ['missing old bytes',f=>{f.previousHashes={};}],
  ['unsupported proof schema',f=>{f.retirement.proof.schemaVersion=2;}],
  ['unregistered evaluator',f=>{f.retirement.proof.before.evaluator.path='ignored/claims.json';}],
  ['changed evaluator implementation',f=>{f.currentFingerprint.evaluator.sha256=hash('changed audit');}],
  ['changed validator implementation',f=>{f.currentFingerprint.evaluator.validatorSha256=hash('changed validator');}],
  ['current source drift after proof',f=>{f.currentFingerprint.sourceFiles[0].sha256=hash('new source');}],
  ['mismatched source and runtime footprints',f=>{f.retirement.proof.after.sourceFiles[0].sha256=hash('inconsistent source');f.currentFingerprint=clone(f.retirement.proof.after);}],
  ['an incomplete runtime footprint',f=>{f.retirement.proof.after.runtimeSources.files.pop();f.currentFingerprint=clone(f.retirement.proof.after);}],
  ['missing private hold policy pin',f=>{f.retirement.proof.before.sourceFiles=f.retirement.proof.before.sourceFiles.filter(row=>row.path!==INACTIVE_IMAGE_POLICY_PINS[0]);}],
  ['private eligibility policy drift',f=>{f.retirement.proof.before.sourceFiles.find(row=>row.path===INACTIVE_IMAGE_POLICY_PINS[0]).sha256=hash('weakened holds');}],
  ['remaining current retired binding',f=>{f.retirement.proof.after.retiredBoundPaths=[f.retirement.assets[0].oldPath];f.currentFingerprint=clone(f.retirement.proof.after);}],
  ['positive retired evidence before cleanup',f=>{f.retirement.proof.before.retiredPositiveBoundPaths=[f.retirement.assets[0].oldPath];}],
  ['changed eligible outputs',f=>{f.retirement.proof.after.positiveBindings.sha256=hash('changed eligible evidence');f.currentFingerprint=clone(f.retirement.proof.after);}],
  ['lost nonretired binding',f=>{f.retirement.proof.after.nonretiredBindings.count=2;f.currentFingerprint=clone(f.retirement.proof.after);}],
  ['weakened finite domain coverage',f=>{f.retirement.proof.after.coverage.sha256=hash('skipped domain');f.currentFingerprint=clone(f.retirement.proof.after);}],
  ['missing accepted historical branch',f=>{f.retirement.proof.after.historicalBranches.branches=[];f.currentFingerprint=clone(f.retirement.proof.after);}],
  ['changed historical eligibility output',f=>{f.retirement.proof.after.historicalBranches.sha256=hash('new historical selection');f.currentFingerprint=clone(f.retirement.proof.after);}],
  ['audit error',f=>{f.retirement.proof.after.errors=[{error:'failed selector'}];f.currentFingerprint=clone(f.retirement.proof.after);}],
  ['a new unaudited caller',f=>{f.unauditedReferences=['src/newCaller.jsx'];}],
  ['a partial physical retirement',f=>{f.deletedPaths=[];}],
  ['an unlisted extra deletion',f=>{f.deletedPaths.push('public/images/child-mode/reviewed/cat.webp');}],
  ['a file still present',f=>{f.existingPaths=clone(f.deletedPaths);}],
  ['an undocumented catalogue change',f=>{f.retirement.catalogueChanges=[];}]
])test(`inactive-image retirement rejects ${name}`,()=>{const f=fixture();mutate(f);assert.equal(isVerifiedInactiveImageRetirement(f),false);});

test('declaring an arbitrary new caller as a catalogue change cannot bypass the finite-domain boundary',()=>{
  const f=fixture(),file='src/newCaller.jsx',beforeSha256=hash('old caller'),afterSha256=hash('new caller');
  for(const [fingerprint,sha256]of [[f.retirement.proof.before,beforeSha256],[f.retirement.proof.after,afterSha256]]){
    fingerprint.runtimeSources.files.push({path:file,sha256});fingerprint.runtimeSources.count++;
    fingerprint.runtimeSources.sha256=hashJson(fingerprint.runtimeSources.files);
  }
  f.retirement.catalogueChanges.push({path:file,beforeSha256,afterSha256});f.currentFingerprint=clone(f.retirement.proof.after);
  assert.equal(isVerifiedInactiveImageRetirement(f),false);
});

test('pre-deletion validation permits only byte-identical old files while keeping runtime proof requirements',()=>{
  const f=fixture(),asset=f.retirement.assets[0];f.validateOnly=true;f.deletedPaths=[];f.existingPaths=['public'+asset.oldPath];f.currentHashes[asset.oldPath]=asset.sha256;
  assert.equal(isVerifiedInactiveImageRetirement(f),true);
  f.currentHashes[asset.oldPath]=hash('unverified current pixels');
  assert.equal(isVerifiedInactiveImageRetirement(f),false);
});

test('only obsolete broad-bound candidates may disappear; all actual positive and nonretired outputs remain identical',()=>{
  const f=fixture();f.retirement.proof.before.allBindings.count=2;f.retirement.proof.before.allBindings.sha256=hash('old extra negative bound');
  f.retirement.proof.before.retiredBoundPaths=[f.retirement.assets[0].oldPath];
  assert.equal(isVerifiedInactiveImageRetirement(f),true);
});
