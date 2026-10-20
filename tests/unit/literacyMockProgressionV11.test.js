import test from 'node:test';
import assert from 'node:assert/strict';
import { literacyMockProgressionV11, LITERACY_MOCK_V11_AREA_BUDGETS, literacyMockSuccessesToAdvanceV11 } from '../../src/policy/literacyMockProgressionV11.js';
import { LITERACY_MOCK_AREA_ORDER, LITERACY_MOCK_AREA_MAX } from '../../src/policy/literacyMockAdaptivePolicy.js';
const row=(domainId,band,isCorrect,flags={})=>({questionId:`${domainId}.${band}.${Math.random()}`, itemSnapshot:{domainId,adaptiveAreaBand:band,contentVersion:'literacy-mock-v11'},responseStatus:'answered',isCorrect,evidenceType:'independent',...flags});
for(const domain of LITERACY_MOCK_AREA_ORDER){
 test(`${domain}: one or two entry successes cannot jump difficulty; three promote exactly one step`,()=>{
  const rows=[];for(let i=0;i<3;i++){assert.equal(literacyMockProgressionV11(rows)[domain].nextBand,0);rows.push(row(domain,0,true));}
  assert.equal(literacyMockProgressionV11(rows)[domain].nextBand,1);
 });
 test(`${domain}: later steps need two successes and two errors lower only one step`,()=>{
  assert.equal(literacyMockSuccessesToAdvanceV11(1),2);
  let rows=[row(domain,1,true)];assert.equal(literacyMockProgressionV11(rows)[domain].nextBand,1);
  rows.push(row(domain,1,true));assert.equal(literacyMockProgressionV11(rows)[domain].nextBand,2);
  rows.push(row(domain,2,false));assert.equal(literacyMockProgressionV11(rows)[domain].nextBand,2);
  rows.push(row(domain,2,false));assert.equal(literacyMockProgressionV11(rows)[domain].nextBand,1);
 });
 test(`${domain}: assistance and errors break a promotion streak; other areas cannot supply successes`,()=>{
  const rows=[row(domain,0,true),row(domain,0,true),row(domain,0,true,{supportUsed:true}),row(domain,0,true)];
  assert.equal(literacyMockProgressionV11(rows)[domain].nextBand,0);
  assert.equal(literacyMockProgressionV11([row(domain,0,true),row(domain,0,false),row(domain,0,true),row(domain,0,true)])[domain].nextBand,0);
  assert.equal(literacyMockProgressionV11([row(domain,0,true),row(domain==='phonics'?'print':'phonics',0,true)])[domain].nextBand,0);
 });
 test(`${domain}: a correct path can reach and confirm the ceiling within its budget`,()=>{
  const rows=[];for(let band=0;band<LITERACY_MOCK_AREA_MAX[domain];band++)for(let i=0;i<literacyMockSuccessesToAdvanceV11(band);i++) rows.push(row(domain,band,true));
  for(let i=0;i<2;i++)rows.push(row(domain,LITERACY_MOCK_AREA_MAX[domain],true));
  const state=literacyMockProgressionV11(rows)[domain];assert.equal(state.stopReason,'ceiling_confirmed');assert.ok(rows.length<=LITERACY_MOCK_V11_AREA_BUDGETS[domain]);
 });
}
test('alternating outcomes never turn a weak pattern into a promotion',()=>{
 const rows=Array.from({length:12},(_,i)=>row('vocabulary',1,i%2===0));assert.equal(literacyMockProgressionV11(rows).vocabulary.nextBand,1);
});
test('two harder errors actually offer an easier recheck before concluding an adjacent boundary',()=>{
 const rows=[row('vocabulary',0,true),row('vocabulary',0,true),row('vocabulary',0,true),row('vocabulary',1,false),row('vocabulary',1,false)];
 let state=literacyMockProgressionV11(rows).vocabulary;
 assert.equal(state.nextBand,0);assert.equal(state.complete,false,'The child must actually receive easier work after the harder errors');
 rows.push(row('vocabulary',0,true));state=literacyMockProgressionV11(rows).vocabulary;
 assert.equal(state.stopReason,'adjacent_boundary');
});
