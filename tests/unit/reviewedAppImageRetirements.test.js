import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateReviewedRetirementEvidence, REVIEWED_RETIREMENT_AUTHORITIES } from '../../tools/lib/reviewedAppImageRetirements.mjs';

const hash = s => createHash('sha256').update(s).digest('hex');
const clone = value => structuredClone(value);
function fixture() {
  const oldHash = hash('exact original bytes'), newHash = hash('reviewed replacement');
  const format = { id:'reviewed-format-migrations',kind:'reviewed-format-migration',assetCount:1,
    assets:[{oldPath:'/images/child-mode/minimal-pairs/cut.png',sha256:oldHash,newPath:'/images/child-mode/minimal-pairs/cut.webp',newSha256:newHash,width:1024,height:1024,hasAlpha:false}] };
  const a = format.assets[0];
  const authorities = Object.fromEntries(REVIEWED_RETIREMENT_AUTHORITIES.map(p=>[p,hash(p)]));
  return { manifest:{schemaVersion:1,kind:'reviewed-app-image-retirements',sourceRevision:'a'.repeat(40),
      authorities:Object.entries(authorities).map(([path,sha256])=>({path,sha256})),questionDomainKinds:['exact-domain'],cohorts:[format]},
    deletedPaths:['public'+a.oldPath],previousHashes:{[a.oldPath]:oldHash},historicalHashes:{[a.oldPath]:oldHash},existingPaths:[],
    replacements:{[a.newPath]:{format:'webp',sha256:newHash,width:1024,height:1024,hasAlpha:false}},
    reviews:{[a.newPath]:{status:'approved',sha256:newHash}},rejectedHashes:[],authorities,evidence:{},
    finite:{errors:[],allFiniteImageBindings:[],historicalBranches:Array(15).fill({}),coverage:Array(50).fill({}),questionSelectionDomains:[{kind:'exact-domain',questionIds:['one'],imagePaths:[a.newPath]}]},
    graph:{modules:['src/main.jsx'],issues:[],dynamic:[]},literalReferences:[] };
}
const valid = f => validateReviewedRetirementEvidence(f).failures.length === 0;

test('an exact format retirement requires historical bytes, fresh absence and current replacement approval',()=>{
  const f=fixture(),result=validateReviewedRetirementEvidence(f);
  assert.deepEqual(result.failures,[]);
  assert.deepEqual([...result.paths],f.deletedPaths);
});

test('a failed proof grants no deletion and reports no cohort as verified',()=>{
  const f=fixture();f.reviews={};const result=validateReviewedRetirementEvidence(f);
  assert.ok(result.failures.length);assert.equal(result.paths.size,0);assert.deepEqual(result.rows,[]);
});

for (const [name, change] of [
  ['comparison-base byte drift',f=>f.previousHashes[f.manifest.cohorts[0].assets[0].oldPath]=hash('changed')],
  ['historical byte drift',f=>f.historicalHashes={}],
  ['undeleted old image',f=>f.existingPaths.push(f.manifest.cohorts[0].assets[0].oldPath)],
  ['partial deletion',f=>f.deletedPaths=[]],
  ['unlisted deletion',f=>f.deletedPaths.push('public/images/unlisted.webp')],
  ['new learner binding',f=>f.finite.allFiniteImageBindings.push({path:f.manifest.cohorts[0].assets[0].oldPath})],
  ['new retained question selection',f=>f.finite.questionSelectionDomains[0].imagePaths.push(f.manifest.cohorts[0].assets[0].oldPath)],
  ['reachable source literal',f=>f.literalReferences.push({file:'src/NewViewer.jsx',path:f.manifest.cohorts[0].assets[0].oldPath})],
  ['incomplete source graph',f=>f.graph.issues.push({type:'unresolved-local-import'})],
  ['unevaluated lazy source',f=>f.graph.dynamic.push({type:'dynamic-import'})],
  ['finite audit error',f=>f.finite.errors.push('selector failed')],
  ['missing accepted-history branch',f=>f.finite.historicalBranches.pop()],
  ['missing finite domain',f=>f.finite.questionSelectionDomains=[]],
  ['authority drift',f=>f.authorities[REVIEWED_RETIREMENT_AUTHORITIES[0]]=hash('weakened validator')],
  ['unknown cohort role',f=>f.manifest.cohorts[0].kind='any-unused-image'],
  ['unlisted format cohort',f=>f.manifest.cohorts[0].id='arbitrary-images'],
  ['unreviewed replacement',f=>f.reviews={}],
  ['rejected replacement',f=>f.reviews[f.manifest.cohorts[0].assets[0].newPath].status='rejected'],
  ['rejected pixel hash behind approval',f=>f.rejectedHashes.push(f.manifest.cohorts[0].assets[0].newSha256)],
  ['replacement byte drift',f=>f.replacements[f.manifest.cohorts[0].assets[0].newPath].sha256=hash('bad pixels')],
  ['false image extension',f=>f.replacements[f.manifest.cohorts[0].assets[0].newPath].format='png'],
  ['replacement dimension drift',f=>f.replacements[f.manifest.cohorts[0].assets[0].newPath].width=512],
  ['replacement alpha drift',f=>f.replacements[f.manifest.cohorts[0].assets[0].newPath].hasAlpha=true],
  ['non-adjacent replacement',f=>f.manifest.cohorts[0].assets[0].newPath='/images/unrelated.webp'],
  ['duplicate path',f=>{const c=f.manifest.cohorts[0];c.assets.push(clone(c.assets[0]));c.assetCount++;}],
  ['path traversal',f=>f.manifest.cohorts[0].assets[0].oldPath='/images/../private.png'],
  ['unscoped orphan reference',f=>{const c=f.manifest.cohorts[0];c.id='orphan-moonwood-expansion-reference';c.kind='orphaned-moonwood-author-reference';c.assets=[{oldPath:'/images/unrelated.webp',sha256:hash('bytes')}];}]
]) test('reviewed retirement rejects '+name,()=>{const f=fixture();change(f);assert.equal(valid(f),false);});

test('obsolete thumbnails require the exact checked-in cohort and evidence hash',()=>{
  const f=fixture(),p='tools/manifests/retired-obsolete-assessment-thumbnails.json';
  const rows=Array.from({length:5},(_,i)=>({oldPath:`/images/assessment/old-${i}.webp`,sha256:hash('old'+i)}));
  f.manifest.cohorts=[{id:'obsolete-assessment-thumbnails',kind:'obsolete-administrative-thumbnails',assetCount:5,assets:rows,evidence:{path:p,sha256:hash('manifest')}}];
  f.evidence[p]={sha256:hash('manifest'),assets:rows.map(r=>({path:r.oldPath,sha256:r.sha256}))};
  f.deletedPaths=rows.map(r=>'public'+r.oldPath);f.previousHashes=f.historicalHashes=Object.fromEntries(rows.map(r=>[r.oldPath,r.sha256]));
  assert.equal(valid(f),true);
  for(const change of [x=>x.evidence[p].sha256=hash('unreviewed manifest'),x=>x.evidence[p].assets.pop(),x=>x.manifest.cohorts[0].assets[0].oldPath='/images/unlisted.webp']){
    const next=clone(f);change(next);assert.equal(valid(next),false);
  }
});
