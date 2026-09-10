import test from 'node:test';
import assert from 'node:assert/strict';
import {createCampaignActionMotion,advanceCampaignActionMotion,resolveCampaignActionMotion,cancelCampaignActionMotion} from '../../src/features/soundSeekers/v3/engine/campaignActionMotion.js';
const create=(familyId='sound-herd',reducedMotion=false)=>createCampaignActionMotion({familyId,from:{x:0,y:200},to:{x:650,y:100},objectId:'parcel',appearance:{colour:'red'},action:{type:'PLACE',binId:'bin1',itemId:'item1'},reducedMotion});
test('carrier reaches a selected destination before committing once and returns unchanged after a wrong route',()=>{
 const motion=create();assert.equal(advanceCampaignActionMotion(motion,.1).length,0);assert.ok(motion.position.x>0&&motion.position.x<650);
 let events=[];for(let i=0;i<10;i++)events.push(...advanceCampaignActionMotion(motion,.1));
 assert.deepEqual(events,[{type:'commit',action:{type:'PLACE',binId:'bin1',itemId:'item1'}}]);
 assert.equal(motion.phase,'awaiting-outcome');assert.deepEqual(advanceCampaignActionMotion(motion,.2),[]);
 resolveCampaignActionMotion(motion,{type:'incorrect'});events=[];for(let i=0;i<10;i++)events.push(...advanceCampaignActionMotion(motion,.1));
 assert.deepEqual(events,[{type:'returned',objectId:'parcel'}]);assert.deepEqual(motion.position,motion.from);assert.equal(motion.appearance.colour,'red');
});
test('boat, carts and delivery share only motor timelines; authority settles success',()=>{
 for(const family of ['river-route','sentence-express','pals-post','garden-kitchen','story-rescue','fix-it-workshop']){
  const motion=create(family,true);assert.equal(advanceCampaignActionMotion(motion,0)[0].type,'commit');
  assert.equal(motion.phase,'awaiting-outcome');resolveCampaignActionMotion(motion,{type:'complete'});assert.equal(motion.phase,'settled');
 }
});
test('cancelled movement creates no commitment and non-finite geometry is rejected',()=>{
 const motion=create();cancelCampaignActionMotion(motion);assert.deepEqual(advanceCampaignActionMotion(motion,1),[]);
 assert.throws(()=>createCampaignActionMotion({familyId:'river-route',from:{x:NaN,y:0},to:{x:0,y:0},action:{type:'CHOOSE'}}),/finite/);
});
