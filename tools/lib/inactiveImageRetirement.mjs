import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const hashJson=value=>digest(JSON.stringify(value));
const sha=/^[a-f0-9]{64}$/;
const revision=/^[a-f0-9]{40}$/;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const sourcePath=value=>typeof value==='string'&&!value.includes('\\')&&!path.posix.isAbsolute(value)&&path.posix.normalize(value)===value&&!value.startsWith('../');
// This finite audit covers only these legacy word-picture pools. It cannot
// establish absence for story, branding, background, classroom or Pal art.
export const INACTIVE_IMAGE_POOLS=Object.freeze([
  '/images/assessment/hfw/','/images/assessment/rhyming/',
  '/images/child-mode/blends/','/images/child-mode/initial-sounds/',
  '/images/child-mode/plurals/','/images/child-mode/reviewed/',
  '/media/initial-sounds/images/','/media/learn/images/','/media/vocabulary/images/'
]);
export const INACTIVE_IMAGE_CATALOGUES=Object.freeze([
  'src/data/childAssets.js','src/data/childWordMediaManifest.js',
  'src/data/importedVocabularyMediaManifest.js','src/data/vocabularyMediaLexicon.js',
  'src/data/generated/vocabularyRuntime.generated.js',
  'src/data/generated/k3VocabularyMediaManifest.generated.js',
  'src/data/generated/arcadeCuePictures.generated.js',
  'src/content/initialSounds/initialSoundWordBank.js',
  'src/content/initialSounds/initialSoundMediaManifest.js',
  'src/data/generated/assessmentImageVariants.generated.js'
]);
const imagePath=value=>typeof value==='string'&&INACTIVE_IMAGE_POOLS.some(prefix=>value.startsWith(prefix))&&
  /\.(webp|png|jpe?g)$/.test(value)&&!value.includes('\\')&&path.posix.normalize(value)===value&&!/[?#]/.test(value);
export const INACTIVE_IMAGE_EVALUATOR='tools/auditFiniteImageBindings.mjs';
export const INACTIVE_IMAGE_VALIDATOR='tools/lib/inactiveImageRetirement.mjs';
export const INACTIVE_IMAGE_POLICY_PINS=Object.freeze([
  'src/policy/literacyItemEligibility.js',
  'src/policy/literacyMockVersions.js',
  'src/data/assessmentImageStyleBlocklist.js'
]);

function runtimeSources(root){
  const rows=[];
  function walk(relative){
    const directory=path.join(root,relative);
    if(!fs.existsSync(directory))return;
    for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
      const file=relative+'/'+entry.name;
      if(entry.isDirectory())walk(file);
      else if(entry.isFile()&&/\.(?:[cm]?js|jsx|tsx?|json|html|css|svg)$/.test(entry.name))rows.push({path:file,sha256:digest(fs.readFileSync(path.join(root,file)))});
    }
  }
  for(const folder of ['src','preview','demos'])walk(folder);
  rows.sort((a,b)=>a.path.localeCompare(b.path));
  return rows;
}

export function fingerprintFiniteImageBindings(report,{retiredPaths=new Set(),root,evaluatorPath=INACTIVE_IMAGE_EVALUATOR}={}){
  const bindings=[...report.allFiniteImageBindings].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const positive=bindings.filter(row=>row.kind==='positive-current-output');
  const nonretired=bindings.filter(row=>!retiredPaths.has(row.path));
  const fingerprint=rows=>({count:rows.length,sha256:hashJson(rows)});
  const sources=runtimeSources(root);
  const loaded=[...report.loadedSources].sort((a,b)=>a.path.localeCompare(b.path));
  const coverage=[...report.coverage].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const branches=[...report.historicalBranches].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return {kind:'finite-image-binding-proof-v1',
    evaluator:{path:evaluatorPath,sha256:digest(fs.readFileSync(path.join(root,evaluatorPath))),validatorPath:INACTIVE_IMAGE_VALIDATOR,validatorSha256:digest(fs.readFileSync(path.join(root,INACTIVE_IMAGE_VALIDATOR)))},
    allBindings:fingerprint(bindings),nonretiredBindings:fingerprint(nonretired),positiveBindings:fingerprint(positive),
    coverage:{...fingerprint(coverage),surfaces:coverage.map(row=>row.surface)},
    historicalBranches:{...fingerprint(branches),branches:branches.map(({version,mixed,total,eligible,withdrawn,uniqueImages})=>({version,mixed,total,eligible,withdrawn,uniqueImages}))},
    sourceFiles:loaded,runtimeSources:{...fingerprint(sources),files:sources},
    retiredBoundPaths:[...new Set(bindings.filter(row=>retiredPaths.has(row.path)).map(row=>row.path))].sort(),
    retiredPositiveBoundPaths:[...new Set(positive.filter(row=>retiredPaths.has(row.path)).map(row=>row.path))].sort(),
    errors:report.errors};
}

function validHashRows(rows){
  return Array.isArray(rows)&&rows.length>0&&new Set(rows.map(row=>row.path)).size===rows.length&&rows.every(row=>sourcePath(row.path)&&sha.test(row.sha256));
}
function validFingerprint(value){
  if(!value||value.kind!=='finite-image-binding-proof-v1'||!Array.isArray(value.errors)||value.errors.length||
    !validHashRows(value.sourceFiles)||!validHashRows(value.runtimeSources?.files))return false;
  for(const field of ['allBindings','nonretiredBindings','positiveBindings','coverage','historicalBranches','runtimeSources']){
    const row=value[field];if(!row||!Number.isInteger(row.count)||row.count<1||!sha.test(row.sha256))return false;
  }
  if(value.runtimeSources.count!==value.runtimeSources.files.length||value.runtimeSources.sha256!==hashJson(value.runtimeSources.files))return false;
  const scope=new Map(value.runtimeSources.files.map(row=>[row.path,row.sha256]));
  if(value.sourceFiles.some(row=>scope.get(row.path)!==row.sha256))return false;
  if(!Array.isArray(value.coverage.surfaces)||value.coverage.surfaces.length!==value.coverage.count||
    !Array.isArray(value.historicalBranches.branches)||value.historicalBranches.branches.length!==value.historicalBranches.count)return false;
  if(!Array.isArray(value.retiredBoundPaths)||!Array.isArray(value.retiredPositiveBoundPaths))return false;
  return value.evaluator?.path===INACTIVE_IMAGE_EVALUATOR&&value.evaluator.validatorPath===INACTIVE_IMAGE_VALIDATOR&&
    sha.test(value.evaluator.sha256)&&sha.test(value.evaluator.validatorSha256);
}

// A checked-in record binds evidence; it is never an unconditional deletion list.
// The caller computes hashes from actual Git bytes and reruns the pinned evaluator.
export function isVerifiedInactiveImageRetirement({retirement,previousHashes={},historicalHashes={},currentHashes={},
  currentFingerprint,deletedPaths=[],existingPaths=[],unauditedReferences=[],validateOnly=false}={}){
  try{
    const r=retirement;
    if(!r||r.kind!=='current-runtime-inactive-image'||!/^[a-z0-9][a-z0-9-]*$/.test(r.id)||!revision.test(r.sourceRevision)||
      !Number.isInteger(r.assetCount)||r.assetCount<1||!Array.isArray(r.assets)||r.assets.length!==r.assetCount||
      new Set(r.assets.map(a=>a.oldPath)).size!==r.assetCount||r.assets.some(a=>!imagePath(a.oldPath)||!sha.test(a.sha256)))return false;
    const before=r.proof?.before,after=r.proof?.after;
    if(r.proof?.schemaVersion!==1||!validFingerprint(before)||!validFingerprint(after)||!validFingerprint(currentFingerprint)||
      !same(before.evaluator,after.evaluator)||!same(after,currentFingerprint)||
      !same(before.nonretiredBindings,after.nonretiredBindings)||!same(before.positiveBindings,after.positiveBindings)||
      !same(before.coverage,after.coverage)||!same(before.historicalBranches,after.historicalBranches)||
      before.retiredPositiveBoundPaths.length||after.retiredBoundPaths.length||after.retiredPositiveBoundPaths.length||unauditedReferences.length)return false;
    for(const file of INACTIVE_IMAGE_POLICY_PINS){
      const prior=before.sourceFiles.find(row=>row.path===file),current=after.sourceFiles.find(row=>row.path===file);
      if(!prior||!current||prior.sha256!==current.sha256)return false;
    }
    const oldSources=new Map(before.runtimeSources.files.map(row=>[row.path,row.sha256]));
    const newSources=new Map(after.runtimeSources.files.map(row=>[row.path,row.sha256]));
    if(!same([...oldSources.keys()],[...newSources.keys()]))return false;
    const changed=[...oldSources].filter(([file,hash])=>newSources.get(file)!==hash).map(([file,beforeSha256])=>({path:file,beforeSha256,afterSha256:newSources.get(file)}));
    if(!Array.isArray(r.catalogueChanges)||!same(changed,r.catalogueChanges)||
      r.catalogueChanges.some(row=>!INACTIVE_IMAGE_CATALOGUES.includes(row.path)||INACTIVE_IMAGE_POLICY_PINS.includes(row.path)))return false;
    const paths=r.assets.map(a=>'public'+a.oldPath);
    if(!validateOnly&&(deletedPaths.length!==paths.length||new Set(deletedPaths).size!==paths.length||paths.some(p=>!deletedPaths.includes(p))||existingPaths.some(p=>paths.includes(p))))return false;
    for(const asset of r.assets){
      if(previousHashes[asset.oldPath]!==asset.sha256||historicalHashes[asset.oldPath]!==asset.sha256)return false;
      if(validateOnly&&existingPaths.includes('public'+asset.oldPath)&&currentHashes[asset.oldPath]!==asset.sha256)return false;
    }
    return true;
  }catch{return false;}
}
