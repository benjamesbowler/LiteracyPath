import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { literacyMockDemandV6, LITERACY_MOCK_DEMAND_LADDERS } from '../../src/policy/literacyMockDemandV6.js';
import { selectLiteracyMockPlan, adaptLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { LITERACY_MOCK_AREA_MAX } from '../../src/policy/literacyMockAdaptivePolicy.js';
import { canonicalLiteracyIdentity } from '../../src/utils/literacyEvidence.js';

const legacy=await loadLiteracyMockBank({contentVersion:'literacy-mock-v5'});
const bank=await loadLiteracyMockBank({contentVersion:'literacy-mock-v6'});
const byId=new Map(bank.map(q=>[q.id,q]));
const band=id=>byId.get(id)?.adaptiveAreaBand;
const answer=(q,ok)=>({questionId:q.id,skillId:q.skillId,domainId:q.domainId,level:q.level,itemSnapshot:q.itemSnapshot,responseStatus:'answered',evidenceType:'independent',isCorrect:ok});

test('source Level 2 cannot turn the same simple operation into an advanced task',()=>{
 assert.equal(band('lp3.initial_sounds.l2.C.b.v3'),null);
 assert.equal(band('lp3.short_vowel_discrimination.l2.A.short_o.v1'),null);
 assert.equal(band('mock.capacity.foundation.letter-case.l2.a'),1);
 assert.equal(band('mock.capacity.foundation.silent-e-category.o_e.l2.cope'),4);
 assert.equal(band('lp3.cvc_short_vowels.l2.B.short_a.v5'),3);
 assert.equal(band('mock.capacity.language.same-sets-13'),2);
 assert.equal(band('mock.capacity.language.set-ies-young'),2);
 assert.equal(band('literacy.capitalization.sentence-edit'),1);
 assert.equal(band('literacy.punctuation.two-thoughts'),3);
 assert.equal(band('literacy.print_concepts.next-page'),null);
 for(const q of legacy){
  const before=literacyMockDemandV6(q), renamed=literacyMockDemandV6({...q,level:q.level===1?2:1});
  assert.deepEqual(renamed,before,`${q.id}: source-level-only promotion`);
 }
});

test('every routed item carries the actual operation and its increasing unit of work',()=>{
 for(const q of bank.filter(q=>q.adaptiveMixedEligible)){
  const descriptor=LITERACY_MOCK_DEMAND_LADDERS[q.domainId][q.adaptiveAreaBand];
  assert.equal(q.adaptiveAreaVersion,'areas-v2');
  assert.deepEqual(q.adaptiveDemand,descriptor);
  assert.equal(q.itemSnapshot.adaptiveDemand.operation,descriptor.operation);
  assert.ok(descriptor.requires.length);
 }
 const top=bank.filter(q=>q.domainId==='sound_awareness'&&q.adaptiveAreaBand===5);
 assert.ok(top.length>=20);
 assert.ok(top.every(q=>['substitute_initial','substitute_final','delete_phoneme','add_phoneme'].includes(q.constructClaim)));
 const phonicTop=bank.filter(q=>q.domainId==='phonics'&&q.adaptiveAreaBand===6);
 assert.ok(phonicTop.length>=10);
 for(const q of phonicTop){assert.equal(q.format,'build_word');assert.ok(q.phonemeTiles.length>=4);assert.ok(q.phonemeTiles.some(s=>/^(ai|ee|ea|oa|oo)$/.test(s)));assert.ok(q.choices.length>q.phonemeTiles.length);}
 for(const q of bank.filter(q=>['reading','listening'].includes(q.domainId)&&q.adaptiveAreaBand>=3))assert.equal(q.taskDemand.reviewed,true,q.id);
});

test('all complete offline paths use the intended task after each answer, with independent fresh stock',()=>{
 const patterns=[()=>true,()=>false,i=>i<16,i=>i%2===0,(_,q)=>['reading','listening'].includes(q.domainId)];
 for(let seed=0;seed<10;seed++)for(const correct of patterns){
  let ids=[];let plan=selectLiteracyMockPlan(bank,{sessionId:`demand-${seed}`,studentId:'child',onOfflineItems:value=>{ids=value;}});
  const pool=bank.filter(q=>ids.includes(q.id)),responses=[],state=Object.fromEntries(Object.keys(LITERACY_MOCK_AREA_MAX).map(d=>[d,1])),seen=new Set();
  assert.ok(plan.seed.endsWith(':areas-v2'));
  assert.ok(new Set(pool.flatMap(q=>[...q.requiredAudioPaths,...q.requiredImagePaths].map(p=>p.split('#')[0]))).size<=512);
  for(let i=0;i<43;i++){
   const q=byId.get(plan.itemIds[i]);assert.equal(q.adaptiveAreaBand,state[q.domainId]);assert.ok(q.adaptiveDemand);
   for(const [kind,id]of Object.entries(canonicalLiteracyIdentity(q)))if(id){assert.equal(seen.has(`${kind}:${id}`),false);seen.add(`${kind}:${id}`);}
   const ok=correct(i,q);responses.push(answer(q,ok));state[q.domainId]=Math.max(0,Math.min(LITERACY_MOCK_AREA_MAX[q.domainId],q.adaptiveAreaBand+(ok?1:-1)));
   const prefix=plan.itemIds.slice(0,i+1);plan=adaptLiteracyMockPlan(pool,plan,responses);assert.deepEqual(plan.itemIds.slice(0,i+1),prefix);
  }
 }
});
