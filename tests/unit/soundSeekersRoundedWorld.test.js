import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CAMPAIGN_STAGES } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { CAMPAIGN_WORLD_LAYOUTS, CAMPAIGN_WORLD_THEMES, campaignCanWalk, campaignRoute, campaignSegmentWalkable, campaignTerrainHeight, campaignRoadSamples } from '../../src/features/soundSeekers/rounded/campaignWorldLayouts.js';
import { CAMPAIGN_ROUNDED_RESTORATIONS, getRoundedCampaignRestoration } from '../../src/features/soundSeekers/rounded/campaignRestorations.js';
import { ROUNDED_CAMPAIGN_PROP_KINDS, campaignCollisionLayout, campaignStepPlayer, campaignFrameSteps, campaignNearMission, campaignUseWorldObject, campaignNearbyWorldInteraction, campaignRestoreWorldInventory, campaignEncounterProps, campaignWalkHeight } from '../../src/features/soundSeekers/rounded/campaignWorld.js';

test('slow rendering retains the same collision-stepped walking time without unbounded catch-up',()=>{
  const layout={bounds:{minX:-100,maxX:100,minZ:-100,maxZ:100},obstacles:[],water:null};
  function simulate(frames){
    const player={x:0,z:0,vx:0,vz:0};let remainder=0;
    for(const elapsed of frames){const clock=campaignFrameSteps(elapsed,remainder);remainder=clock.remainder;
      for(let i=0;i<clock.steps;i++)campaignStepPlayer(layout,player,{x:1,z:0},1/60);}
    return player;
  }
  const smooth=simulate(Array(96).fill(1/60)),slow=simulate(Array(16).fill(.1));
  assert.ok(slow.x>5);
  assert.ok(Math.abs(smooth.x-slow.x)<1e-9);
  assert.deepEqual(campaignFrameSteps(20),{steps:15,remainder:0});
  assert.deepEqual(campaignFrameSteps(NaN),{steps:0,remainder:0});
  assert.deepEqual(campaignFrameSteps(-1),{steps:0,remainder:0});
  const blocked={...layout,obstacles:[{kind:'trunk',x:1,z:0,r:.5}]},player={x:0,z:0,vx:0,vz:0};
  for(let frame=0;frame<8;frame++)for(let step=0;step<campaignFrameSteps(.25).steps;step++)campaignStepPlayer(blocked,player,{x:1,z:0},1/60);
  assert.ok(campaignCanWalk(blocked,player.x,player.z));assert.ok(player.x<1);
});

function walkRoute(layout,start,goal) {
  const player={...start,vx:0,vz:0},route=campaignRoute(layout,start,goal);
  assert.ok(route.length,`${layout.stageId} route to ${goal.missionId}`);
  let destination=route.shift(),ticks=0;
  while(destination&&ticks<7000){
    const distance=Math.hypot(destination.x-player.x,destination.z-player.z);
    if(distance<.18){destination=route.shift();if(!destination)break;continue;}
    campaignStepPlayer(layout,player,{x:(destination.x-player.x)/distance,z:(destination.z-player.z)/distance},1/60);
    assert.ok(campaignCanWalk(layout,player.x,player.z),`${layout.stageId} collision at ${player.x},${player.z}`);
    ticks++;
  }
  assert.ok(!destination,`${layout.stageId} never reached ${goal.missionId}`);
  assert.ok(Math.hypot(player.x-goal.x,player.z-goal.z)<.2);
  return player;
}

test('the rounded campaign authors all thirty distinct places and three terrain/light themes',()=>{
  assert.deepEqual(Object.keys(CAMPAIGN_WORLD_LAYOUTS),CAMPAIGN_STAGES.map(s=>s.id));
  assert.equal(new Set(Object.values(CAMPAIGN_WORLD_LAYOUTS).map(l=>l.kind)).size,30);
  assert.equal(new Set(Object.values(CAMPAIGN_WORLD_LAYOUTS).map(l=>JSON.stringify(l.roads))).size,30);
  assert.deepEqual(Object.keys(CAMPAIGN_WORLD_THEMES),['meadow','dino','moonwood']);
  assert.equal(new Set(Object.values(CAMPAIGN_WORLD_THEMES).map(t=>t.sky)).size,3);
  for(const stage of CAMPAIGN_STAGES){
    const l=CAMPAIGN_WORLD_LAYOUTS[stage.id];
    assert.deepEqual(l.missions.map(p=>p.missionId),[...stage.missionIds,...stage.optionalMissionIds]);
    assert.ok(l.roads.length>=2&&l.trees.length>=8);
    assert.ok(Object.isFrozen(l)&&Object.isFrozen(l.roads));
    assert.ok(campaignCanWalk(l,l.spawn.x,l.spawn.z));
    assert.ok(Number.isFinite(campaignTerrainHeight(l,l.spawn.x,l.spawn.z)));
  }
  assert.ok(campaignTerrainHeight(CAMPAIGN_WORLD_LAYOUTS['dino-11'],0,-20)>2);
  assert.ok(campaignTerrainHeight(CAMPAIGN_WORLD_LAYOUTS['moonwood-28'],0,-24)>4);
});

test('every painted road stays traversable through each real restoration and low tier',()=>{
  for(const stage of CAMPAIGN_STAGES)for(let count=0;count<=5;count++)for(const low of [false,true]){
    const l=campaignCollisionLayout(CAMPAIGN_WORLD_LAYOUTS[stage.id],stage.missionIds.slice(0,count),low);
    for(const road of l.roads)for(let i=1;i<road.points.length;i++){
      const a={x:road.points[i-1][0],z:road.points[i-1][1]},b={x:road.points[i][0],z:road.points[i][1]};
      assert.ok(campaignSegmentWalkable(l,a,b),`${stage.id} repair ${count}, low ${low}: visible road blocked`);
    }
    for(const road of l.roads)for(const [x,z] of campaignRoadSamples(road))assert.ok(campaignCanWalk(l,x,z),`${stage.id}: rounded road drifted into a collider`);
    for(const point of l.missions){
      const route=campaignRoute(l,l.spawn,point);assert.ok(route.length,`${stage.id}: ${point.missionId}`);
      let start=l.spawn;for(const next of route){assert.ok(campaignSegmentWalkable(l,start,next));start=next;}
    }
  }
});

test('actual acceleration and collision reach every encounter across all thirty places',()=>{
  for(const stage of CAMPAIGN_STAGES){
    const l=campaignCollisionLayout(CAMPAIGN_WORLD_LAYOUTS[stage.id]);
    let position=l.spawn;
    for(const point of l.missions)position=walkRoute(l,position,point);
    const repaired=campaignCollisionLayout(CAMPAIGN_WORLD_LAYOUTS[stage.id],stage.missionIds,true);
    for(const point of repaired.missions)walkRoute(repaired,repaired.spawn,point);
  }
});

test('each main mission installs its exact supplies; optional and a finale alone cannot repair a place',()=>{
  for(const stage of CAMPAIGN_STAGES){
    const plan=CAMPAIGN_ROUNDED_RESTORATIONS[stage.id];
    assert.equal(plan.jobs.length,5);
    assert.deepEqual(plan.jobs.map(j=>j.missionId),stage.missionIds);
    const initial=getRoundedCampaignRestoration(stage.id);
    assert.equal(initial.completedCount,0);assert.equal(initial.fullyRestored,false);
    assert.deepEqual(getRoundedCampaignRestoration(stage.id,stage.optionalMissionIds),initial);
    assert.deepEqual(getRoundedCampaignRestoration(stage.id,[stage.missionIds[4]]),initial);
    for(let index=0;index<4;index++){
      const state=getRoundedCampaignRestoration(stage.id,[stage.missionIds[index]]);
      assert.equal(state.completedCount,1);assert.equal(state.fullyRestored,false);
      assert.deepEqual(state.props.filter(p=>p.missionId===stage.missionIds[index]).map(({missionId,installed,...p})=>{assert.equal(installed,true);assert.equal(missionId,stage.missionIds[index]);return p;}),plan.jobs[index].after);
    }
    const full=getRoundedCampaignRestoration(stage.id,new Set(stage.missionIds));
    assert.equal(full.completedCount,5);assert.equal(full.fullyRestored,true);
    assert.ok(full.props.every(p=>p.installed));
    assert.ok(full.props.every(p=>!p.supersededOnFinal));
    for(const prop of [...plan.base,...plan.jobs.flatMap(j=>[...j.before,...j.after])]){
      assert.ok(ROUNDED_CAMPAIGN_PROP_KINDS.includes(prop.kind),`${stage.id}: ${prop.kind} has no authored rounded construction`);
      assert.ok(['x','z','lift','size'].every(key=>Number.isFinite(prop[key])));
    }
  }
  assert.equal(getRoundedCampaignRestoration('unknown'),null);
});

test('real nearby gates exclude unavailable and completed missions, even when movement arrives',()=>{
  const l=CAMPAIGN_WORLD_LAYOUTS['meadow-01'],first=l.missions[0],second=l.missions[1];
  assert.equal(campaignNearMission(l,first),null);
  assert.equal(campaignNearMission(l,first,[second.missionId]),null);
  assert.equal(campaignNearMission(l,first,[first.missionId]),first.missionId);
  assert.equal(campaignNearMission(l,first,[first.missionId],[first.missionId]),null);
  assert.equal(campaignNearMission(l,{x:first.x+2.61,z:first.z},[first.missionId]),null);
  assert.equal(campaignNearMission(l,{x:first.x+2.5,z:first.z},[first.missionId]),first.missionId);
});

test('walking cannot cross a trunk or water, and a newly placed prop allows outward escape',()=>{
  const l=campaignCollisionLayout(CAMPAIGN_WORLD_LAYOUTS['meadow-04']);
  assert.equal(campaignCanWalk(l,0,-3),false);assert.equal(campaignCanWalk(l,NaN,0),false);
  const p={x:-3,z:0,vx:0,vz:0};for(let i=0;i<300;i++)campaignStepPlayer(l,p,{x:1,z:0,run:true},1/60);
  assert.ok(p.x<=-1.98,`walked into the river: ${p.x}`);
  const obstacle={kind:'crate',x:0,z:0,r:.8},simple={bounds:{minX:-10,maxX:10,minZ:-10,maxZ:10},obstacles:[obstacle],water:null};
  const trapped={x:.1,z:0,vx:0,vz:0};for(let i=0;i<90;i++)campaignStepPlayer(simple,trapped,{x:1,z:0},1/60);
  assert.ok(trapped.x>1.28);assert.ok(campaignCanWalk(simple,trapped.x,trapped.z));
});

test('rounded presentation uses only approved assets and has no old playable or evidence runtime',()=>{
  const source=fs.readFileSync(new URL('../../src/features/soundSeekers/rounded/campaignWorld.js',import.meta.url),'utf8');
  const imports=Array.from(source.matchAll(/from ['"]([^'"]+)['"]/g),match=>match[1]);
  assert.ok(imports.every(path=>!/v3\/(?:render|quest)|legacy|worldScene|quaternius|monster/i.test(path)));
  assert.ok(!/public\/models|\/sprites|pixel-hero/.test(source));
  assert.ok(!/recordAttempt|completeMission|writeProgress|saveCampaign|awardMastery|setInterval/.test(source));
  assert.ok(source.includes("['woolly','splashy','clucky'].includes(id)"));
  for(const file of ['characters/bouncy.glb','characters/woolly.glb','characters/splashy.glb','characters/clucky.glb','forest/tree.glb','forest/rock.glb','forest/mushrooms.glb'])assert.ok(fs.existsSync(new URL(`../../demos/sound-seekers/assets/${file}`,import.meta.url)));
  assert.ok(source.includes("loadingController.abort()")&&source.includes('resources.dispose()'));
});


test('each place provides a real carry-return route and an operable offshoot without reading evidence',()=>{
  for(const stage of CAMPAIGN_STAGES)for(const low of [false,true]){
    const l=campaignCollisionLayout(CAMPAIGN_WORLD_LAYOUTS[stage.id],[],low),[carry,operate]=l.discoveries;
    assert.deepEqual([carry.id,operate.id],['carry','operate']);
    assert.deepEqual([carry.kind,operate.kind],['carry','operate']);
    assert.ok(ROUNDED_CAMPAIGN_PROP_KINDS.includes(carry.itemKind));
    assert.ok(ROUNDED_CAMPAIGN_PROP_KINDS.includes(operate.itemKind));
    let state=campaignRestoreWorldInventory(l),player=walkRoute(l,l.spawn,carry.source);
    let result=campaignUseWorldObject(l,player,state);assert.equal(result.accepted,true);assert.equal(result.interaction.action,'pickup');assert.equal(result.discovery,null);state=result.state;
    assert.equal(state.carrying,'carry');assert.deepEqual(state.discoveredIds,[]);
    assert.equal(campaignUseWorldObject(l,{x:26,z:26},state).accepted,false);
    const resumed=campaignRestoreWorldInventory(l,{}, {carryingId:state.carrying,discoveredIds:[]});
    assert.equal(resumed.carrying,'carry');assert.deepEqual(resumed.discoveredIds,[]);
    player=walkRoute(l,player,operate.source);result=campaignUseWorldObject(l,player,state);assert.equal(result.interaction.action,'operate');assert.deepEqual(result.discovery,{stageId:stage.id,id:'operate',kind:'operate'});state=result.state;
    assert.equal(state.carrying,'carry');assert.equal(state.operated,true);
    result=campaignUseWorldObject(l,player,state);assert.equal(result.discovery,null);assert.equal(result.state.operated,false);state=result.state;
    player=walkRoute(l,player,carry.destination);result=campaignUseWorldObject(l,player,state);assert.equal(result.interaction.action,'place');assert.deepEqual(result.discovery,{stageId:stage.id,id:'carry',kind:'carry'});state=result.state;
    assert.equal(state.carrying,null);assert.deepEqual(state.discoveredIds,['operate','carry']);
    assert.ok(!campaignNearbyWorldInteraction(l,carry.source,state)||campaignNearbyWorldInteraction(l,carry.source,state).id!=='carry');
    assert.equal(getRoundedCampaignRestoration(stage.id,state.discoveredIds).completedCount,0);
    assert.equal(campaignRestoreWorldInventory(l,{}, {carryingId:'forged'}).carrying,null);
    assert.equal(campaignRestoreWorldInventory(l,{}, {carryingId:'operate'}).carrying,null);
    assert.equal(campaignRestoreWorldInventory(l,{}, {carryingId:'carry',discoveredIds:['carry']}).carrying,null);
    assert.equal(campaignRestoreWorldInventory(l,{}, {discoveredIds:['operate']}).operated,true);
  }
});

test('recovery supplies belong to the actual encounter and leave it after its exact receipt',()=>{
  for(const stage of CAMPAIGN_STAGES){
    const l=CAMPAIGN_WORLD_LAYOUTS[stage.id],initial=campaignEncounterProps(l);
    assert.ok(initial.length>=3);
    for(const prop of initial){
      const point=l.missions.find(p=>p.missionId===prop.missionId);
      assert.ok(Math.hypot(prop.x-point.x,prop.z-point.z)<=4.51);
      assert.ok(campaignCanWalk(l,prop.x,prop.z,.8));
      assert.equal(prop.installed,false);
    }
    for(const missionId of stage.missionIds){
      const completed=campaignEncounterProps(l,[missionId]);
      assert.ok(completed.every(p=>p.missionId!==missionId));
      assert.deepEqual(completed,initial.filter(p=>p.missionId!==missionId));
    }
    assert.deepEqual(campaignEncounterProps(l,stage.optionalMissionIds),initial);
  }
});


test('permanent place scenery is authored for all thirty places and shares its real solid footprints',()=>{
  for(const l of Object.values(CAMPAIGN_WORLD_LAYOUTS)){
    assert.ok(l.features.length>=4);
    assert.ok(l.features.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)&&p.scale>0));
    assert.ok(l.backdrop.length>=20);
    assert.ok(l.backdrop.every(t=>t.x<l.bounds.minX||t.x>l.bounds.maxX||t.z<l.bounds.minZ||t.z>l.bounds.maxZ));
    for(const f of l.features.filter(f=>['rock','cottage','hedge'].includes(f.kind))){
      assert.ok(l.obstacles.some(o=>o.kind===f.kind&&o.x===f.x&&o.z===f.z));
      for(const low of [true,false])assert.equal(campaignCanWalk(campaignCollisionLayout(l,[],low),f.x,f.z),false);
    }
  }
  assert.equal(new Set(Object.values(CAMPAIGN_WORLD_LAYOUTS).map(l=>JSON.stringify(l.features))).size,30);
});

test('installed river crossings genuinely connect both banks and lift the player onto the visible deck',()=>{
  for(const stageId of ['meadow-04','meadow-07','meadow-10','dino-14','dino-20','moonwood-21','moonwood-23','moonwood-27','moonwood-30']){
    const stage=CAMPAIGN_STAGES.find(s=>s.id===stageId),raw=CAMPAIGN_WORLD_LAYOUTS[stageId],z=raw.landmark.z+.5;
    const start={x:raw.water.at-raw.water.width/2-.6,z},end={x:raw.water.at+raw.water.width/2+.6,z};
    assert.equal(campaignSegmentWalkable(campaignCollisionLayout(raw,stage.optionalMissionIds),start,end),false);
    for(const low of [false,true]){
      const l=campaignCollisionLayout(raw,stage.missionIds,low);
      assert.ok(campaignSegmentWalkable(l,start,end),`${stageId}: restored deck never connects its banks`);
      const player={...start,vx:0,vz:0};
      for(let tick=0;tick<Math.ceil((end.x-start.x)/4.6*60)+30;tick++)campaignStepPlayer(l,player,{x:1,z:0},1/60);
      assert.ok(player.x>end.x,`${stageId}: movement stopped on the installed bridge`);
      assert.ok(campaignWalkHeight(l,raw.water.at,z)>campaignTerrainHeight(raw,raw.water.at,z));
    }
  }
});

test('continuous outward walking remains inside the authored boundary without warping',()=>{
  for(const raw of Object.values(CAMPAIGN_WORLD_LAYOUTS)){
    const l=campaignCollisionLayout(raw,[],true),p={...l.spawn,vx:0,vz:0};let last={...p};
    for(let tick=0;tick<1800;tick++){
      campaignStepPlayer(l,p,{x:.7,z:1,run:true},1/60);
      assert.ok(Math.hypot(p.x-last.x,p.z-last.z)<=7/60+.001);
      assert.ok(campaignCanWalk(l,p.x,p.z));last={...p};
    }
  }
});
