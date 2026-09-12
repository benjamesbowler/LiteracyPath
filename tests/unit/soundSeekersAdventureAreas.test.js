import { CAMPAIGN_LANGUAGE,openingSceneAppearance } from '../../src/features/soundSeekers/v3/content/campaignLanguage.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';
import { QUEST_STOPS } from '../../src/data/questSequence.js';
import { CAMPAIGN_MISSIONS,CAMPAIGN_STAGES,getCampaignStage } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { buildCampaignMission,createCampaignBeatState } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { publicBeat } from '../../src/features/soundSeekers/v3/engine/challenges.js';
import { usesMazeArea,ACTIVITY_AREAS } from '../../src/features/soundSeekers/v3/content/activityAreas.js';
import { createActivityMaze,mazePath,mazeBlocked,advanceMazeWalker } from '../../src/features/soundSeekers/v3/engine/mazeAdventure.js';
import { createCampaignWorldScene } from '../../src/features/soundSeekers/v3/render/campaignWorldScene.js';
import { readAdventureGamepad,createAdventureGamepad } from '../../src/features/soundSeekers/v3/engine/adventureControls.js';
import { CAMPAIGN_EL_PRACTICE,CAMPAIGN_BEYOND_EL,campaignPacingPlan } from '../../src/features/soundSeekers/v3/content/campaignLearningJourney.js';
const progress={targets:Object.fromEntries(QUEST_STOPS.flatMap(s=>s.teach.map(t=>[t.id,{taught:true}])))};
const journeys=CAMPAIGN_MISSIONS.map(mission=>({mission,beats:buildCampaignMission(mission,progress).beats}));
const sceneFor=(mission,beats,extra={})=>createCampaignWorldScene({stage:getCampaignStage(mission.stageId),mission,beats:beats.map(publicBeat),heroId:'speedy',progress,beatState:createCampaignBeatState(beats[0]),...extra});
const run=(scene,seconds)=>{for(let i=0;i<seconds*60;i++)scene.update(1/60);};

test('every authored maze offers reachable nonoverlapping choices without receiving the answer key',()=>{
 let count=0;
 for(const {mission,beats} of journeys)for(const beat of beats)if(usesMazeArea(beat)){
  count++;const maze=createActivityMaze(`${mission.id}:${beat.sectionId||beat.familyId}`,0);
  assert.ok(maze.destinations.length>=beat.view.choices.length,beat.id);
  for(const destination of maze.destinations){assert.equal(mazeBlocked(maze,destination.x,destination.y),false);const path=mazePath(maze,maze.spawn,destination);assert.ok(path.length>2,beat.id);for(const p of path)assert.equal(mazeBlocked(maze,p.x,p.y),false);}
  assert.deepEqual(createActivityMaze(`${mission.id}:${beat.sectionId||beat.familyId}`,0).grid,maze.grid);
 }
 assert.ok(count>600);assert.equal(new Set(CAMPAIGN_MISSIONS.map(m=>m.familyId)).size,Object.keys(ACTIVITY_AREAS).length);
});

test('maze collision survives long frames and motor walking never submits an answer',()=>{
 const {mission,beats}=journeys.find(j=>j.beats.some(usesMazeArea));const beat=beats.find(usesMazeArea),actions=[];
 const scene=sceneFor(mission,[beat],{onAction:a=>actions.push(a)});
 scene.setInput('left',true);run(scene,15);assert.equal(mazeBlocked(scene.debug().maze,scene.snapshot().x,scene.snapshot().y),false);assert.equal(actions.length,0);
 scene.release();const before=scene.snapshot();run(scene,1);assert.equal(scene.snapshot().x,before.x);assert.equal(actions.length,0);scene.dispose();
 const maze=createActivityMaze('long-frame'),p={...maze.spawn,vx:0,vy:0,input:{left:true,right:false,up:false,down:false},path:[]};
 for(let i=0;i<30;i++)advanceMazeWalker(p,maze,5);assert.equal(mazeBlocked(maze,p.x,p.y),false);
});

test('real assisted movement reaches choices and exits across every maze-bearing mission',()=>{
 for(const {mission,beats} of journeys){const beat=beats.find(usesMazeArea);if(!beat)continue;
  const inventory=sceneFor(mission,[beat]),choices=inventory.getObjects().filter(o=>o.role==='destination');inventory.dispose();
  for(const choice of choices){const actions=[],scene=sceneFor(mission,[beat],{onAction:a=>actions.push(a)});scene.activate(choice.id);
   for(let n=0;n<2400&&!actions.length;n++)scene.update(1/60);
   assert.equal(actions.length,1,`${mission.id}/${choice.id}`);assert.equal(actions[0].choiceId,choice.id);run(scene,.4);assert.equal(actions.length,1);
   const saved=scene.snapshot(),resumed=sceneFor(mission,[beat],{position:saved});assert.equal(resumed.snapshot().x,saved.x);assert.equal(resumed.snapshot().y,saved.y);resumed.dispose();
   let advanced=0;const completed=sceneFor(mission,[beat],{position:saved,beatState:{...createCampaignBeatState(beat),done:true},onAdvance:()=>advanced++});completed.activate('leave-room');for(let n=0;n<2400&&!advanced;n++)completed.update(1/60);assert.equal(advanced,1);completed.dispose();scene.dispose();
  }
 }
});

test('beat transitions rebuild the segmented area and cannot carry a stale maze position',()=>{
 const {mission,beats}=journeys.find(j=>j.beats.some(usesMazeArea));const maze=beats.find(usesMazeArea),side=journeys[0].beats[0],actions=[];
 const scene=sceneFor(mission,[maze,side],{onAction:a=>actions.push(a)});assert.equal(scene.getPresentation(),'depth');scene.setInput('right',true);run(scene,1);
 scene.setState(createCampaignBeatState(side),1);assert.equal(scene.getPresentation(),'side');assert.notEqual(scene.snapshot().lastCheckpointId,`maze:${maze.id}`);run(scene,2);assert.equal(actions.length,0);scene.dispose();
});

const pad=(axes=[],pressed=[])=>({connected:true,mapping:'standard',axes,buttons:Array.from({length:16},(_,i)=>({pressed:pressed.includes(i)}))});
test('controller dead zones, analog strength, edges, pause and disconnect release safely',()=>{
 assert.equal(readAdventureGamepad(pad([.1,-.1])).analogX,0);assert.equal(readAdventureGamepad(pad([1])).analogX,1);assert.ok(readAdventureGamepad(pad([.5])).analogX<.5);
 const events=[],controller=createAdventureGamepad({onInput:(...a)=>events.push(a),onInteract:()=>events.push('use'),onPause:()=>events.push('pause'),onRelease:()=>events.push('release')});
 controller.poll([pad()]);assert.deepEqual(events,[]);controller.poll([pad([1], [2])]);controller.poll([pad([1],[2])]);assert.equal(events.filter(e=>e==='use').length,1);
 controller.poll([pad([1],[2,9])],true);controller.poll([pad([1],[2,9])],true);assert.equal(events.filter(e=>e==='pause').length,1);assert.equal(events.filter(e=>e==='release').length,1);
 controller.poll([pad([1],[2])],false);assert.equal(events.filter(e=>e==='use').length,1);controller.poll([pad()]);controller.poll([pad([], [2])]);assert.equal(events.filter(e=>e==='use').length,2);
 controller.poll([]);controller.poll([]);assert.equal(events.filter(e=>e==='release').length,2);
});

test('EL practice links cover all cycles and live stages; pacing is an estimate with no enforced minimum',()=>{
 assert.deepEqual(CAMPAIGN_EL_PRACTICE.map(c=>c.cycleNumber),Array.from({length:27},(_,i)=>i+1));
 const anchors=new Set(QUEST_STOPS.map(s=>s.id));
 for(const source of elSkillsBlockCycles.filter(c=>c.cycleNumber)){
  const link=CAMPAIGN_EL_PRACTICE.find(c=>c.cycleNumber===source.cycleNumber);assert.ok(link);
  const taught=new Set(QUEST_STOPS.filter(s=>link.anchorIds.includes(s.id)).flatMap(s=>s.teach.map(t=>t.id)));
  for(const focus of source.focusLetters||[])if(!['all','fszl','pattern'].includes(focus.spelling))for(const spelling of focus.spelling.split(' '))assert.ok(taught.has(/^[aiou]ng$/.test(spelling)?'ng':spelling),`Cycle ${source.cycleNumber}: ${spelling}`);
 }
for(const cycle of CAMPAIGN_EL_PRACTICE){assert.ok(cycle.stageIds.length);assert.equal(cycle.alignment,'related-practice-not-cycle-assessment');for(const a of cycle.anchorIds)assert.ok(anchors.has(a));for(const id of cycle.stageIds)assert.ok(CAMPAIGN_STAGES.some(s=>s.id===id));}
 for(const group of CAMPAIGN_BEYOND_EL)for(const a of group.anchors)assert.ok(anchors.has(a));
 const plan=campaignPacingPlan();assert.equal(plan.mainMissionMinutes+plan.explorationMinutes,1200);assert.equal(plan.minimumPlayTimeEnforced,false);assert.equal(plan.basis,'authoring-estimate-not-observed-playtime');
});


test('touch movement still works after releasing an analog stick in a platform area',()=>{
 const {mission,beats}=journeys[0],scene=sceneFor(mission,[beats[0]]);
 scene.setInput('analogX',1);run(scene,.1);scene.setInput('analogX',0);run(scene,.3);
 const start=scene.snapshot().x;scene.setInput('right',true);run(scene,.3);assert.ok(scene.snapshot().x>start+15);scene.release();scene.dispose();
});


test('opening choices and old saved objects retain visible size and location contrasts',()=>{
 for(const pack of Object.values(CAMPAIGN_LANGUAGE))for(const scenario of pack){
  const appearances=scenario.options.map(o=>openingSceneAppearance(o));assert.equal(new Set(appearances.map(a=>JSON.stringify(a))).size,scenario.options.length);
  for(const o of scenario.options)assert.deepEqual(openingSceneAppearance({id:o.id}),o.appearance);
 }
 assert.equal(openingSceneAppearance({id:'little'}).sizeVariant,'little');assert.equal(openingSceneAppearance({id:'large'}).sizeVariant,'large');
 assert.equal(openingSceneAppearance({id:'shade'}).scenery[0].kind,'tree');assert.equal(openingSceneAppearance({id:'pond'}).scenery[0].kind,'pond');
});


test('related maze clues keep the room and player position with a nearby next-clue interaction',()=>{
 const {mission,beats}=journeys.find(j=>j.beats.filter(usesMazeArea).length>1);
 const pair=beats.filter(usesMazeArea).slice(0,2);assert.equal(pair[0].familyId,pair[1].familyId);assert.equal(pair[0].sectionId,pair[1].sectionId);
 let actions=0,advanced=0;const scene=sceneFor(mission,pair,{onAction:()=>actions++,onAdvance:()=>advanced++});
 scene.activate(scene.getObjects().find(o=>o.role==='destination').id);for(let i=0;i<2400&&!actions;i++)scene.update(1/60);assert.equal(actions,1);
 const before=scene.snapshot(),grid=scene.debug().maze.grid;
 scene.setState({...createCampaignBeatState(pair[0]),done:true},0);const exit=scene.debug().objects[0];assert.equal(exit.label,'Next clue');assert.ok(Math.hypot(exit.x-before.x,exit.y-before.y)<1);
 scene.key('KeyE',true);assert.equal(advanced,1);
 scene.setState(createCampaignBeatState(pair[1]),1);assert.deepEqual(scene.debug().maze.grid,grid);assert.equal(scene.snapshot().x,before.x);assert.equal(scene.snapshot().y,before.y);scene.dispose();
});


test('assisted walking starts at full speed after a virtual stick release',()=>{
 const {mission,beats}=journeys[0],scene=sceneFor(mission,[beats[0]]);
 scene.setInput('analogX',.6);run(scene,.2);scene.setInput('analogX',0);run(scene,.3);
 const before=scene.snapshot().x;scene.activate(scene.getObjects()[0].id);run(scene,.5);assert.ok(scene.snapshot().x>before+50);scene.dispose();
});
