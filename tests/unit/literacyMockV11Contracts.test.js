import test from 'node:test';
import assert from 'node:assert/strict';
import {loadLiteracyMockBank} from '../../src/data/literacyMockBank.js';
import {auditLiteracyMockBank,auditLiteracyMockItem} from '../../tools/lib/literacyMockContracts.mjs';
const bank=await loadLiteracyMockBank({contentVersion:'literacy-mock-v11'}),sourceItems=new Map(bank.map(q=>[q.id,q]));
test('all V11 active areas, bands, media, literal keys and complete option sets pass current contracts',()=>{
 assert.deepEqual(auditLiteracyMockBank(bank,{contentVersion:'literacy-mock-v11'}),[]);
});
test('V11 refuses a short option set or a fabricated inherited demand reference',()=>{
 const q=bank.find(q=>q.adaptiveMixedEligible&&q.sourceProvenance?.v11MeaningChoices);
 const short={...q,choices:q.choices.slice(0,3)};
 assert.ok(auditLiteracyMockItem(short,{sourceItems}).some(x=>x.code==='Q-MOCK-FOUR-CHOICES'));
 const fake={...q,sourceProvenance:{...q.sourceProvenance,v11MeaningChoices:{...q.sourceProvenance.v11MeaningChoices,originalId:'not-published'}}};
 assert.ok(auditLiteracyMockItem(fake,{sourceItems}).some(x=>x.code==='Q-MOCK-DEMAND'));
});
test('new CVC stock cannot declare a four-phoneme word or omit its exact target recording',()=>{
 const q=bank.find(q=>q.sourceProvenance?.file==='src/data/literacyMockPhonicsCapacityV11.js');
 const four={...q,taskDemand:{...q.taskDemand,proof:{...q.taskDemand.proof,targetPhonemes:['F','IH','K','S']}}};
 assert.ok(auditLiteracyMockItem(four,{sourceItems}).some(x=>x.code==='Q-MOCK-DEMAND'));
 const mute={...q,requiredAudioCues:q.requiredAudioCues.filter(c=>c.role!=='target_word')};
 assert.ok(auditLiteracyMockItem(mute,{sourceItems}).some(x=>x.code==='Q-MOCK-DEMAND'));
});
