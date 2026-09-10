import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN_STAGES } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { getCampaignHubLayout, CAMPAIGN_STAGE_LAYOUTS } from '../../src/features/soundSeekers/v3/content/campaignLayouts.js';
import { CAMPAIGN_PROP_ROLES } from '../../src/features/soundSeekers/v3/render/campaignProps.js';
import { CAMPAIGN_RESTORATIONS, getCampaignRestorationState, drawCampaignRestoration } from '../../src/features/soundSeekers/v3/render/campaignRestoration.js';
const drawing = (stage, completed) => {
 const commands=[];
 const ctx=new Proxy({}, {get:(_,key)=>(...args)=>commands.push([key,...args]),set:(_,key,v)=>{commands.push([key,v]);return true;}});
 const state=drawCampaignRestoration(ctx,{stage,layout:getCampaignHubLayout(stage.id),completed,reducedMotion:true});
 return {state,commands};
};
test('all thirty authored landmarks have five exact mission-bound, drawable restoration changes',()=>{
 assert.deepEqual(Object.keys(CAMPAIGN_RESTORATIONS),CAMPAIGN_STAGES.map(s=>s.id));
 for(const stage of CAMPAIGN_STAGES){
  const plan=CAMPAIGN_RESTORATIONS[stage.id];
  assert.equal(plan.problem,stage.problem);assert.equal(plan.landmark,CAMPAIGN_STAGE_LAYOUTS.find(p=>p.stageId===stage.id).landmark);
  assert.deepEqual(plan.jobs.map(j=>j.missionId),stage.missionIds);
  for(const job of plan.jobs){assert.ok(job.after.length);assert.notDeepEqual(job.before,job.after);}
  for(const prop of [...plan.base,...plan.jobs.flatMap(j=>[...j.before,...j.after])]){
   assert.ok(CAMPAIGN_PROP_ROLES.includes(prop.kind),`${stage.id}: ${prop.kind}`);
   assert.ok(Number.isFinite(prop.x)&&Number.isFinite(prop.y)&&prop.size>0);
  }
  for(const completed of [{},Object.fromEntries(stage.missionIds.slice(0,2).map(id=>[id,true])),new Set(stage.missionIds)]){
   const {state}=drawing(stage,completed);assert.equal(state.drawnProps,state.props.length,stage.id);
  }
 }
});
test('branch repairs are independent, optional/mastery data cannot restore hubs, and a finale alone is insufficient',()=>{
 for(const stage of CAMPAIGN_STAGES){
  const initial=getCampaignRestorationState(stage.id,{});
  assert.deepEqual(getCampaignRestorationState(stage.id,{mastery:100,...Object.fromEntries(stage.optionalMissionIds.map(id=>[id,true]))}),initial);
  const second=getCampaignRestorationState(stage.id,{[stage.missionIds[1]]:{at:20}});
  assert.equal(second.completedCount,1);assert.equal(second.fullyRestored,false);
  assert.ok(second.props.some(p=>p.missionId===stage.missionIds[1]&&p.installed));
  assert.equal(getCampaignRestorationState(stage.id,[stage.finaleMissionId]).fullyRestored,false);
  const final=getCampaignRestorationState(stage.id,stage.missionIds);
  assert.equal(final.completedCount,5);assert.equal(final.fullyRestored,true);
  assert.notDeepEqual(drawing(stage,{}).commands,drawing(stage,new Set(stage.missionIds)).commands);
 }
});
test('the opening bath, bedding and rescued egg become concrete completed story arrangements',()=>{
 const full=id=>getCampaignRestorationState(id,CAMPAIGN_STAGES.find(s=>s.id===id).missionIds);
 const bath=full('meadow-01');
 for(const kind of ['bucket','soap','mat','towel','rail','brush'])assert.ok(bath.props.some(p=>p.kind===kind),kind);
 assert.ok(bath.props.some(p=>p.kind==='bucket'&&p.filled));
 const bed=full('meadow-02');for(const kind of ['bed','blanket','pillow','roof'])assert.ok(bed.props.some(p=>p.kind===kind),kind);
 const nest=full('meadow-03');assert.equal(nest.props.filter(p=>p.kind==='egg').length,1);assert.ok(nest.props.find(p=>p.kind==='egg').y< -100);
 assert.equal(getCampaignRestorationState('unknown',{}),null);
});
