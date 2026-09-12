import test from 'node:test';
import assert from 'node:assert/strict';
import { QUEST_STOPS } from '../../src/data/questSequence.js';
import { CAMPAIGN_MISSIONS,getCampaignMission,getCampaignStage } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { getCampaignLayout,getCampaignChoiceAnchors } from '../../src/features/soundSeekers/v3/content/campaignLayouts.js';
import { usesMazeArea } from '../../src/features/soundSeekers/v3/content/activityAreas.js';
import { buildCampaignMission,createCampaignBeatState,resolveCampaignAction } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { MECHANICS,publicBeat } from '../../src/features/soundSeekers/v3/engine/challenges.js';
import { openCampaignTraversal,advanceCampaignTraversal } from '../../src/features/soundSeekers/v3/engine/campaignTraversal.js';
import { createCampaignWorldScene } from '../../src/features/soundSeekers/v3/render/campaignWorldScene.js';
const progress={targets:Object.fromEntries(QUEST_STOPS.flatMap(s=>s.teach.map(t=>[t.id,{taught:true}])))};
const buildLayout=(mission,beats)=>getCampaignLayout(mission.id,{beatCount:beats.length,beatFamilies:beats.map(b=>b.familyId),beatMechanics:beats.map(b=>b.mechanic),beatSections:beats.map(b=>b.sectionId)});
const sceneFor=(mission,beats,extra={})=>createCampaignWorldScene({stage:getCampaignStage(mission.stageId),mission,beats:beats.map(publicBeat),heroId:'speedy',beatState:createCampaignBeatState(beats[0]),...extra});
const runUntil=(scene,predicate,limit=6000)=>{for(let i=0;i<limit&&!predicate();i++)scene.update(1/120);assert.ok(predicate(),JSON.stringify(scene.debug()));};

test('teaching rooms keep every card reachable without a mandatory crossing detour',()=>{
  let taughtRooms=0;
  for(const mission of CAMPAIGN_MISSIONS){
    const beats=buildCampaignMission(mission,progress).beats,layout=buildLayout(mission,beats);
    for(const [index,beat]of beats.entries())if(beat.mechanic===MECHANICS.SIGNPOST){
      taughtRooms++;const room=layout.rooms[index];assert.equal(room.traversal,undefined);assert.equal(room.width,720);
      for(const target of getCampaignChoiceAnchors(room,beat.view.cards.length)){assert.ok(target.x>room.originX&&target.x<room.originX+room.width);assert.equal(target.y,room.groundY);}
    }
  }
  assert.ok(taughtRooms>100);
});

test('a completed teaching card continues physically into the next problem without teleporting the camera or feet',()=>{
  const mission=getCampaignMission('meadow-01-1'),beats=buildCampaignMission(mission).beats;
  assert.equal(beats[0].familyId,beats[1].familyId);assert.equal(beats[0].sectionId,beats[1].sectionId);
  let heard=0,advanced=0,actions=0;const scene=sceneFor(mission,beats,{onHear:()=>heard++,onAdvance:()=>advanced++,onAction:()=>actions++});
  scene.activate(scene.getObjects()[0].id);runUntil(scene,()=>heard===1);assert.equal(scene.getInteraction().role,'teach');
  scene.setState({...createCampaignBeatState(beats[0]),done:true});scene.activate('leave-room');runUntil(scene,()=>advanced===1);
  const before=scene.snapshot(),camera={...scene.debug().camera};scene.setState(createCampaignBeatState(beats[1]),1);
  assert.deepEqual(scene.snapshot(),before);assert.deepEqual(scene.debug().camera,camera);
  const resumed=sceneFor(mission,beats,{beatIndex:1,beatState:createCampaignBeatState(beats[1]),position:before});
  assert.equal(resumed.snapshot().x,before.x);assert.equal(resumed.snapshot().y,before.y);
  scene.key('ArrowRight',true);scene.update(.1);assert.ok(scene.snapshot().x>before.x);assert.equal(actions,0);
  scene.dispose();resumed.dispose();
});

test('a drawbridge grows a traversable collision span and a hoist carries its rider with the rising deck',()=>{
  const mission=getCampaignMission('meadow-01-3'),beat=buildCampaignMission(mission,progress).beats[0];
  for(const kind of ['drawbridge','hoist']){
    let route;
    for(let count=1;count<=12&&!route;count++)route=buildLayout(mission,Array.from({length:count},()=>beat)).rooms.find(r=>r.traversal?.kind===kind)?.traversal;
    assert.ok(route,kind);
    const target=route.platforms[0],player={platforms:[],x:target.x+target.width/2,y:target.y+160,grounded:true,tuning:{width:48}};
    openCampaignTraversal(route,player);const deck=player.platforms[0];assert.equal(deck.height,0);assert.equal(route.progress,0);
    advanceCampaignTraversal(route,player,.2);assert.ok(route.progress>0&&route.progress<1);
    if(kind==='drawbridge')assert.ok(deck.width>1&&deck.width<target.width);
    else{assert.ok(deck.y<target.y+160&&deck.y>target.y);assert.equal(player.y,deck.y);}
    for(let i=0;i<5;i++)advanceCampaignTraversal(route,player,.2);
    assert.equal(route.progress,1);assert.equal(deck.width,target.width);assert.equal(deck.y,target.y);
    openCampaignTraversal(route,player);assert.equal(player.platforms.length,route.platforms.length);
  }
});

test('maze choices animate the action once, return wrong deliveries, and keep the problem for a correct retry',()=>{
  for(const familyId of ['story-rescue','lantern-search']){
    const mission=CAMPAIGN_MISSIONS.find(m=>m.familyId===familyId),beat=buildCampaignMission(mission,progress).beats.find(usesMazeArea);
    let state=createCampaignBeatState(beat),actions=0;
    const choose=id=>({type:'CHOOSE',choiceId:id});
    const wrong=beat.view.choices.find(c=>resolveCampaignAction(beat,state,choose(c.id)).outcome.type==='incorrect');
    const correct=beat.view.choices.find(c=>resolveCampaignAction(beat,state,choose(c.id)).state.done);
    assert.ok(wrong&&correct);
    const scene=sceneFor(mission,[beat],{onAction:action=>{actions++;const result=resolveCampaignAction(beat,state,action);state=result.state;scene.setState(state);scene.applyOutcome(result.outcome);}});
    scene.activate(wrong.id);runUntil(scene,()=>scene.debug().motion?.phase==='outbound');assert.equal(actions,0);
    runUntil(scene,()=>scene.debug().motion?.phase==='returning');assert.equal(actions,1);assert.equal(state.done,false);
    const start=scene.debug().motion;scene.update(.1);const next=scene.debug().motion;
    if(next){assert.equal(next.phase,'returning');assert.notDeepEqual(next.position,start.position);}
    runUntil(scene,()=>!scene.debug().motion);assert.ok(scene.getObjects().some(o=>o.id===correct.id));
    scene.activate(correct.id);runUntil(scene,()=>state.done);assert.equal(actions,2);assert.ok(scene.getObjects().some(o=>o.role==='exit'));
    scene.dispose();
  }
});

test('standing at a completed exit advances once, and interaction prompts never reveal the answer',()=>{
  const mission=getCampaignMission('meadow-01-1'),beat=buildCampaignMission(mission).beats[0],room=buildLayout(mission,[beat]).rooms[0];
  let advanced=0;const scene=sceneFor(mission,[beat],{beatState:{...createCampaignBeatState(beat),done:true},position:{v:1,x:room.exit.x,y:room.exit.y,vx:0,vy:0,facing:1,recoveries:0,lastCheckpointId:null},onAdvance:()=>advanced++});
  assert.deepEqual(Object.keys(scene.getInteraction()).sort(),['id','label','role']);
  for(let i=0;i<240;i++)scene.update(1/120);assert.equal(advanced,1);scene.dispose();
});
