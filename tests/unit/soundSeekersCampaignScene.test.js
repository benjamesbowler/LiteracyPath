import test from 'node:test';
import assert from 'node:assert/strict';
import { QUEST_STOPS } from '../../src/data/questSequence.js';
import { CAMPAIGN_MISSIONS, getCampaignMission, getCampaignStage } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { getCampaignLayout, getCampaignChoiceAnchors } from '../../src/features/soundSeekers/v3/content/campaignLayouts.js';
import { buildCampaignMission, createCampaignBeatState, resolveCampaignAction } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { MECHANICS, publicBeat } from '../../src/features/soundSeekers/v3/engine/challenges.js';
import { createCampaignWorldScene } from '../../src/features/soundSeekers/v3/render/campaignWorldScene.js';
import { loadImage, retryFailedImages } from '../../src/features/soundSeekers/v3/render/sprites.js';
const taught={targets:Object.fromEntries(['a','m','t','s'].map(id=>[id,{taught:true}]))};
const run=(scene,n)=>{for(let i=0;i<n;i++)scene.update(1/120);};
const position=(x,y)=>({v:1,x,y,vx:0,vy:0,facing:1,recoveries:0,lastCheckpointId:null});
function make(missionId,beats,extra={}){
 const mission=getCampaignMission(missionId),state=extra.beatState||createCampaignBeatState(beats[extra.beatIndex||0]);
 return createCampaignWorldScene({stage:getCampaignStage(mission.stageId),mission,beats:beats.map(publicBeat),heroId:'speedy',progress:{campaign:{completedMissions:{}}},beatState:state,...extra});
}
function recorder(){
 const text=[];
 const target={measureText:value=>({width:String(value).length*8}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),fillText:value=>text.push(String(value))};
 return {text,ctx:new Proxy(target,{get:(object,key)=>key in object?object[key]:()=>{},set:(object,key,value)=>{object[key]=value;return true;}})};
}
test('one genuine sound-step landing produces one literacy action, standing still produces none',()=>{
 const mission=getCampaignMission('meadow-01-1'),beat=buildCampaignMission(mission).beats.find(b=>b.key);
 const layout=getCampaignLayout(mission.id,{beatCount:1,beatFamilies:[beat.familyId]});
 const anchor=getCampaignChoiceAnchors(layout.rooms[0],beat.view.options.length)[0],actions=[];
 const scene=make(mission.id,[beat],{position:position(anchor.x,anchor.y-20),onAction:action=>actions.push(action)});
 scene.setInput('jump',true);run(scene,90);assert.equal(actions.length,1);assert.equal(actions[0].type,'CHOOSE');run(scene,90);assert.equal(actions.length,1);scene.dispose();
});
test('bridge gaps remain physical until repaired; repair and persisted resume support the crossing',()=>{
 const mission=getCampaignMission('meadow-01-3'),beat=buildCampaignMission(mission,taught).beats[0];
 const layout=getCampaignLayout(mission.id,{beatCount:1,beatFamilies:[beat.familyId]}),room=layout.rooms[0],gap=room.hazards[0];
 const atGap=position(gap.x+gap.width/2,room.groundY-20);
 const open=make(mission.id,[beat],{position:atGap});run(open,35);assert.ok(open.debug().player.y>room.groundY+20);open.dispose();
 for(const resumed of [false,true]){
  const state=createCampaignBeatState(beat);if(resumed)state.done=true;
  const scene=make(mission.id,[beat],{position:atGap,beatState:state});if(!resumed)scene.setState({...state,done:true});
  run(scene,35);assert.equal(scene.debug().player.y,room.groundY);assert.equal(scene.debug().player.recoveries,0);scene.dispose();
 }
});
test('listening to a grapheme-to-sound option never commits it; deliberate confirmation does',()=>{
 const mission=getCampaignMission('meadow-01-1'),beat=buildCampaignMission(mission).beats.find(b=>b.view.direction==='letter-to-sound');
 const actions=[],heard=[];const scene=make(mission.id,[beat],{onAction:a=>actions.push(a),onHear:(sources,meta)=>heard.push({sources,meta})});
 const option=scene.getObjects()[0];scene.activate(option.id);assert.equal(heard.length,1);assert.equal(actions.length,0);run(scene,20);assert.equal(actions.length,0);
 scene.confirm();assert.equal(actions.length,1);assert.equal(actions[0].optionId,option.id);scene.dispose();
});
test('finished teaching retains its picture and replay beside the onward path until the next beat',async()=>{
 const mission=getCampaignMission('meadow-01-1'),pack=buildCampaignMission(mission),teach=pack.beats.find(b=>b.mechanic===MECHANICS.SIGNPOST),choice=pack.beats.find(b=>b.key);
 const imagePaths=teach.view.cards.map(card=>card.anchorImage),previousImage=globalThis.Image;
 try{
  globalThis.Image=class {set src(value){this.source=value;this.width=this.naturalWidth=200;this.height=this.naturalHeight=200;this.onload();}};
  retryFailedImages(imagePaths);await Promise.all(imagePaths.map(loadImage));
 }finally{if(previousImage===undefined)delete globalThis.Image;else globalThis.Image=previousImage;}
 const heard=[],actions=[];let advances=0;
 const scene=make(mission.id,[teach,choice],{onHear:(sources,meta)=>heard.push({sources,meta}),onAction:action=>actions.push(action),onAdvance:()=>advances++});
 const before=scene.getObjects().filter(object=>object.role==='teach');assert.equal(before.length,teach.view.cards.length);
 scene.setState({...createCampaignBeatState(teach),done:true,cardsHeard:teach.targetIds});
 const after=scene.getObjects();assert.deepEqual(after.filter(object=>object.role==='teach'),before);assert.ok(after.some(object=>object.role==='exit'));
 const draw=recorder(),images=[];draw.ctx.drawImage=image=>images.push(image.source);scene.draw(draw.ctx,1100,730);
 for(const path of imagePaths)assert.ok(images.includes(path),`Missing completed teaching picture: ${path}`);
 scene.activate(before[0].id);run(scene,1200);assert.equal(heard.length,1);assert.equal(heard[0].meta.kind,'teach');assert.equal(actions.length,0);assert.equal(advances,0);
 scene.activate('leave-room');run(scene,3600);assert.equal(advances,1);run(scene,200);assert.equal(advances,1);assert.equal(actions.length,0);
 scene.setState(createCampaignBeatState(choice),1);assert.ok(scene.getObjects().every(object=>object.role!=='teach'));
 scene.setState({...createCampaignBeatState(choice),done:true});assert.ok(scene.getObjects().every(object=>object.role!=='choice'));scene.dispose();
});
test('forward checkpoint reconciliation reconstructs every previous bridge in the live scene',()=>{
 const mission=getCampaignMission('meadow-01-3'),word=buildCampaignMission(mission,taught).beats[0];
 const beats=[0,1,2].map(i=>({...word,id:`bridge-${i}`}));
 const layout=getCampaignLayout(mission.id,{beatCount:3,beatFamilies:beats.map(b=>b.familyId)}),room=layout.rooms[0],gap=room.hazards[0];
 const scene=make(mission.id,beats,{position:position(gap.x+gap.width/2,room.groundY-20)});
 scene.setState(createCampaignBeatState(beats[2]),2);run(scene,35);assert.equal(scene.debug().player.y,room.groundY);assert.equal(scene.debug().beatIndex,2);scene.dispose();
});
test('word-recognition signs print every offered word instead of three identical bare props',()=>{
 const progress={targets:{...taught.targets,n:{taught:true},i:{taught:true}}},mission=getCampaignMission('meadow-02-1');
 const beat=buildCampaignMission(mission,progress).beats.find(b=>b.domain==='auditory_word_recognition');
 assert.ok(beat);const scene=make(mission.id,[beat]),draw=recorder();scene.draw(draw.ctx,1100,730);
 for(const option of beat.view.choices)assert.ok(draw.text.includes(option.label),`Missing printed option ${option.label}`);scene.dispose();
});
test('oral sort does not print the stimulus word; contextual reading sort does',()=>{
 const mission=getCampaignMission('meadow-06-3');
 const beat={id:'sort-stimulus',missionId:mission.id,familyId:'sound-herd',mechanic:MECHANICS.SOUND_SORT,stopId:'s6',targetIds:['v','f'],domain:'phoneme_to_grapheme',prompt:{text:'Listen.',cues:[]},view:{mode:'initial',bins:[{id:'b0',grapheme:'v'},{id:'b1',grapheme:'f'}],items:[{id:'i0',word:'van',audio:'/audio/van.mp3',image:''}]},key:{bins:{i0:'b0'},binTargets:{b0:'v',b1:'f'}}};
 const visible=publicBeat(beat);assert.equal(visible.key,undefined);
 for(const mode of ['initial','read']){const variant={...beat,view:{...beat.view,mode}},scene=make(mission.id,[variant]),draw=recorder();scene.draw(draw.ctx,1100,730);assert.equal(draw.text.includes('van'),mode==='read');scene.dispose();}
});

test('accessible approach reaches a real elevated tree choice through the ledges',()=>{
 const m=getCampaignMission('meadow-02-1'),progress={targets:{...taught.targets,n:{taught:true},i:{taught:true}}};
 const b=buildCampaignMission(m,progress).beats.find(beat=>beat.key),actions=[];
 const scene=make(m.id,[b],{onAction:action=>actions.push(action)});const target=scene.getObjects()[0];scene.activate(target.id);run(scene,1200);
 assert.equal(actions.length,1,JSON.stringify(scene.debug()));assert.equal(actions[0].choiceId,target.id);scene.dispose();
});

test('every offered first-beat choice is physically reachable across all 210 missions',()=>{
 const progress={targets:Object.fromEntries(QUEST_STOPS.flatMap(s=>s.teach.map(t=>[t.id,{taught:true}])))};
 for(const mission of CAMPAIGN_MISSIONS){
  const beat=buildCampaignMission(mission,progress).beats.find(b=>b.key);
  const inventory=make(mission.id,[beat]),choices=inventory.getObjects().filter(object=>object.role!=='clue');inventory.dispose();
  for(const target of choices){
   const actions=[],scene=make(mission.id,[beat],{onAction:action=>actions.push(action)});
   scene.activate(target.id);for(let i=0;i<2400&&!actions.length;i++)scene.update(1/120);
   assert.equal(actions.length,1,`${mission.id}/${target.id}: ${JSON.stringify(scene.debug())}`);scene.dispose();
  }
 }
});

test('a partial bridge restores only the placed span on reload',()=>{
 const mission=getCampaignMission('meadow-01-3'),beat=buildCampaignMission(mission,taught).beats[0];
 const room=getCampaignLayout(mission.id,{beatCount:1,beatFamilies:[beat.familyId]}).rooms[0],span=room.repairPlatforms[0];
 const placed=resolveCampaignAction(beat,createCampaignBeatState(beat),{type:'PLACE_TILE',tileId:beat.key.sequence[0]}).state;
 for(const [fraction,supported]of [[.16,true],[.80,false]]){
  const scene=make(mission.id,[beat],{beatState:placed,position:position(span.x+span.width*fraction,room.groundY-20)});run(scene,35);
  if(supported)assert.equal(scene.debug().player.y,room.groundY);else assert.ok(scene.debug().player.y>room.groundY+20);
  scene.dispose();
 }
});
test('inspectable clue replays the prompt without choosing an answer',()=>{
 const mission=CAMPAIGN_MISSIONS.find(m=>m.familyId==='lantern-search');
 const beat=buildCampaignMission(mission,{targets:{}}).beats.find(b=>b.key),heard=[],actions=[];
 const scene=make(mission.id,[beat],{onHear:(sources,meta)=>heard.push({sources,meta}),onAction:a=>actions.push(a)});
 const clue=scene.getObjects().find(object=>object.role==='clue');assert.ok(clue);scene.activate(clue.id);run(scene,1200);
 assert.equal(heard.length,1);assert.equal(heard[0].meta.kind,'clue');assert.equal(actions.length,0);scene.dispose();
});
test('actual herd routing commits on arrival and returns the unchanged item after an incorrect bin',()=>{
 const progress={targets:Object.fromEntries(QUEST_STOPS.flatMap(s=>s.teach.map(t=>[t.id,{taught:true}])))};
 const mission=getCampaignMission('meadow-06-3'),beat=buildCampaignMission(mission,progress).beats.find(b=>b.mechanic===MECHANICS.SOUND_SORT);
 assert.ok(beat);let state=createCampaignBeatState(beat);const actions=[];
 const scene=make(mission.id,[beat],{onAction:action=>{
  actions.push(action);const result=resolveCampaignAction(beat,state,action);state=result.state;scene.setState(state);scene.applyOutcome(result.outcome);
 }});
 const item=beat.view.items[0],wrong=beat.view.bins.find(bin=>bin.id!==beat.key.bins[item.id]);scene.activate(wrong.id);
 let returning=null;
 for(let i=0;i<2400;i++){scene.update(1/120);if(scene.debug().motion?.phase==='returning'){returning=scene.debug().motion;break;}}
 assert.equal(actions.length,1);assert.ok(returning,'wrong route must physically return the carrier');assert.equal(state.itemIndex,0);
 const startDistance=Math.hypot(returning.position.x-returning.from.x,returning.position.y-returning.from.y);
 run(scene,20);const next=scene.debug().motion;
 if(next)assert.ok(Math.hypot(next.position.x-next.from.x,next.position.y-next.from.y)<startDistance);
 run(scene,240);assert.equal(actions.length,1);assert.equal(scene.debug().motion,null);assert.equal(state.itemIndex,0);scene.dispose();
});
test('all 210 friends are reachable on their authored stage hubs',()=>{
 for(const mission of CAMPAIGN_MISSIONS){
  const stage=getCampaignStage(mission.stageId),met=[];
  const scene=createCampaignWorldScene({stage,missions:CAMPAIGN_MISSIONS.filter(m=>m.stageId===stage.id),heroId:'speedy',progress:{campaign:{completedMissions:{}}},isAvailable:()=>true,onMission:friend=>met.push(friend.id)});
  scene.activate(mission.id);for(let i=0;i<3600&&!met.length;i++)scene.update(1/120);
  assert.deepEqual(met,[mission.id],`${mission.id}: ${JSON.stringify(scene.debug())}`);scene.dispose();
 }
});
