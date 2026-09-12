import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN_STAGES,CAMPAIGN_MISSIONS,getCampaignStage } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { createExplorationLayout,createExplorer,advanceExplorer,setExplorerInput,releaseExplorer,findExplorationPath,explorationBlocked } from '../../src/features/soundSeekers/v3/engine/exploration.js';
import { createCampaignWorldScene } from '../../src/features/soundSeekers/v3/render/campaignWorldScene.js';
import { createCampaignBeatState,buildCampaignMission } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { publicBeat } from '../../src/features/soundSeekers/v3/engine/challenges.js';
import { createCampaignPreviewProgress } from '../../src/features/soundSeekers/preview/campaignPreview.js';
import { QUEST_STOPS } from '../../src/data/questSequence.js';
import { getCampaignLayout } from '../../src/features/soundSeekers/v3/content/campaignLayouts.js';
const run=(s,n)=>{for(let i=0;i<n;i++)s.update(1/120);};

test('all 30 overworlds have routes to every friend, switch, nook and exit without opening the shortcut',()=>{
  for(const stage of CAMPAIGN_STAGES){const l=createExplorationLayout(stage);for(const to of [...l.nodes,l.switch,l.secret,l.portal]){
    const s=createExplorer(l);s.path=findExplorationPath(l,s,to,s);assert.ok(s.path.length,`${stage.id}/${to.id}`);
    for(let i=0;i<5000&&s.path.length;i++)advanceExplorer(s,l,1/120);
    assert.ok(Math.hypot(s.x-to.x,s.y-to.y)<15,`${stage.id}/${to.id} blocked at ${s.x},${s.y}`);
  }}
});
test('free movement, river collision, lever shortcut and release use one world state',()=>{
  const l=createExplorationLayout(CAMPAIGN_STAGES[0]),s=createExplorer(l);
  setExplorerInput(s,'up',true);for(let i=0;i<120;i++)advanceExplorer(s,l,1/120);assert.ok(s.y<600);assert.equal(s.x,l.spawn.x);
  releaseExplorer(s);const y=s.y;advanceExplorer(s,l,.1);assert.equal(s.y,y);
  assert.equal(explorationBlocked(l,l.riverX+70,820),true);assert.equal(explorationBlocked(l,l.riverX+70,820,{shortcut:true}),false);
  assert.equal(explorationBlocked(l,l.riverX+70,700,{shortcut:true,jumping:true}),true);
});
test('exploration mechanisms and hidden shortcut never call the learning action or enter missions',()=>{
  let actions=0,missions=0,saved;
  const stage=CAMPAIGN_STAGES[0],scene=createCampaignWorldScene({stage,missions:CAMPAIGN_MISSIONS.filter(m=>m.stageId===stage.id),heroId:'speedy',progress:{campaign:{completedMissions:{}}},isAvailable:()=>true,onAction:()=>actions++,onMission:()=>missions++,onSavePosition:p=>saved=p});
  scene.activate('bridge-switch');run(scene,3000);assert.equal(scene.debug().player.shortcut,true);
  scene.activate('hidden-nook');run(scene,3000);assert.equal(scene.debug().player.discovered,true);
  scene.activate('camp-shortcut');run(scene,60);assert.equal(scene.debug().player.x,240);
  assert.equal(actions,0);assert.equal(missions,0);assert.equal(saved.discovered,true);scene.dispose();
});
test('all three motor traversal kinds are crossable with the same assist and never submit a literacy action',()=>{
  const seen=new Set();
  for(const mission of CAMPAIGN_MISSIONS){
    if(seen.size===3)break;
    const p={...createCampaignPreviewProgress(mission.stageId),targets:Object.fromEntries(QUEST_STOPS.flatMap(s=>s.teach.map(t=>[t.id,{taught:true}])))};
    const built=buildCampaignMission(mission,p),beats=built.beats.map(publicBeat);
    const layout=getCampaignLayout(mission.id,{beatCount:beats.length,beatFamilies:beats.map(b=>b.familyId),beatMechanics:beats.map(b=>b.mechanic),beatSections:beats.map(b=>b.sectionId)});
    for(const [beatIndex,room]of layout.rooms.entries()){
      const traversal=room.traversal;if(!traversal||seen.has(traversal.kind))continue;
      let advanced=0,actions=0;const state={...createCampaignBeatState(built.beats[beatIndex]),done:true};
      const scene=createCampaignWorldScene({stage:getCampaignStage(mission.stageId),mission,beats,beatIndex,beatState:state,heroId:'speedy',progress:p,onAction:()=>actions++,onAdvance:()=>advanced++});
      if(!scene.debug().traversal){scene.dispose();continue;}
      scene.activate('leave-room');for(let i=0;i<12000&&!advanced;i++)scene.update(1/120);
      assert.equal(advanced,1,`${traversal.kind}: ${JSON.stringify(scene.debug())}`);assert.equal(actions,0);seen.add(traversal.kind);scene.dispose();
    }
  }
  assert.equal(seen.size,3);
});

test('orbit-relative movement preserves world-space assisted paths and a safe jump over the fallen log',()=>{
  const layout=createExplorationLayout(CAMPAIGN_STAGES[0]),player=createExplorer(layout);player.heading=-Math.PI/2;
  setExplorerInput(player,'up',true);for(let i=0;i<60;i++)advanceExplorer(player,layout,1/120);
  assert.ok(player.x>layout.spawn.x+100);assert.ok(Math.abs(player.y-layout.spawn.y)<1);
  releaseExplorer(player);player.path=findExplorationPath(layout,player,layout.nodes[1],player);
  for(let i=0;i<5000&&player.path.length;i++)advanceExplorer(player,layout,1/120);
  assert.ok(Math.hypot(player.x-layout.nodes[1].x,player.y-layout.nodes[1].y)<15);
  player.x=390;player.y=990;player.heading=0;releaseExplorer(player);setExplorerInput(player,'down',true);
  for(let i=0;i<120;i++)advanceExplorer(player,layout,1/120);assert.ok(player.y<1018);
  setExplorerInput(player,'jump',true);for(let i=0;i<60;i++)advanceExplorer(player,layout,1/120);assert.ok(player.y>1095);
});

test('landscape bridges share deck height with walking; all chosen glTF dependencies exist',async()=>{
  const {createLandscapeSurface,EXPLORATION_MODELS}=await import('../../src/features/soundSeekers/v3/render/explorationLandscape.js');
  const {existsSync,readFileSync}=await import('node:fs');const {resolve,dirname}=await import('node:path');
  for(const stage of CAMPAIGN_STAGES){const l=createExplorationLayout(stage),surface=createLandscapeSurface(l);for(const b of l.bridges){const x=(b.x+b.width/2)/30,z=(b.y+b.height/2)/30;assert.equal(surface.groundHeight(x,z,true),.25);if(b.shortcut)assert.ok(surface.groundHeight(x,z,false)<0);}}
  for(const src of Object.values(EXPLORATION_MODELS)){const file=resolve('public',src.slice(1));assert.ok(existsSync(file),src);const model=JSON.parse(readFileSync(file));for(const item of [...model.buffers||[],...model.images||[]])if(item.uri&&!item.uri.startsWith('data:'))assert.ok(existsSync(resolve(dirname(file),decodeURI(item.uri))),`${src}: ${item.uri}`);}
});

test('the exploration production brief satisfies the current game contract',async()=>{
  const {verticalSliceBriefForGame}=await import('../../src/components/learn/games/shared/arcadeVerticalSliceBriefs.js');
  const {validateGameVerticalSliceBrief}=await import('../../src/components/learn/games/shared/premiumGameStandard.js');
  assert.deepEqual(validateGameVerticalSliceBrief(verticalSliceBriefForGame('sound-seekers')),[]);
});

test('expanded rooms recover an old motor position at the saved learning beat',()=>{
  const mission=CAMPAIGN_MISSIONS[0],progress=createCampaignPreviewProgress(mission.stageId),built=buildCampaignMission(mission,progress),beats=built.beats.map(publicBeat);
  let actions=0;
  const scene=createCampaignWorldScene({stage:getCampaignStage(mission.stageId),mission,beats,beatIndex:2,beatState:createCampaignBeatState(built.beats[2]),heroId:'speedy',progress,position:{v:1,x:-140,y:560,vx:0,vy:0,facing:1,recoveries:0,lastCheckpointId:null},onAction:()=>actions++});
  const layout=getCampaignLayout(mission.id,{beatCount:beats.length,beatFamilies:beats.map(b=>b.familyId),beatMechanics:beats.map(b=>b.mechanic),beatSections:beats.map(b=>b.sectionId)}),room=layout.rooms[2];
  assert.equal(scene.debug().beatIndex,2);assert.equal(scene.snapshot().x,room.spawn.x);assert.equal(scene.snapshot().y,room.spawn.y);run(scene,60);assert.equal(actions,0);assert.equal(scene.snapshot().recoveries,0);scene.dispose();
});
