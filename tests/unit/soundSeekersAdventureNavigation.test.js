import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleAdventureNodes,adventureResidents,adventureNavigation } from '../../src/features/soundSeekers/v3/engine/adventureNavigation.js';
import { createExplorationScene } from '../../src/features/soundSeekers/v3/render/explorationScene.js';
import { CAMPAIGN_STAGES,getCampaignMission } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { createExplorationLayout } from '../../src/features/soundSeekers/v3/engine/exploration.js';
const stage=CAMPAIGN_STAGES[0],missions=[...stage.missionIds,...stage.optionalMissionIds].map(getCampaignMission),nodes=createExplorationLayout(stage).nodes.map(n=>({...n,mission:missions.find(m=>m.id===n.id)}));
test('visible doors, interaction targets and objectives omit completed and locked missions',()=>{
 const completed={[nodes[0].id]:true},available=id=>id!==nodes[2].id,visible=visibleAdventureNodes(nodes,completed,available);
 assert.ok(!visible.some(n=>n.id===nodes[0].id||n.id===nodes[2].id));
 const progress={campaign:{completedMissions:completed}},scene=createExplorationScene({stage,missions,heroId:'speedy',progress,isAvailable:available});
 assert.equal(scene.getObjects().filter(n=>n.role==='friend').length,visible.length);
 let entered=0;const check=createExplorationScene({stage,missions,heroId:'speedy',progress,isAvailable:available,onMission:()=>entered++});check.activate(nodes[0].id);for(let n=0;n<240;n++)check.update(1/60);assert.equal(entered,0);check.dispose();
 assert.equal(scene.getNavigation().id,visible[0].id);scene.setProgress({campaign:{completedMissions:Object.fromEntries(nodes.map(n=>[n.id,true]))}});assert.equal(scene.getNavigation(),null);assert.equal(scene.getObjects().filter(o=>o.role==='friend').length,0);scene.dispose();
});
test('one resident per canonical identity while every activity keeps a visible door',()=>{
 const residents=adventureResidents(nodes,'muddy'),ids=residents.map(n=>n.mission.residentId==='muddy'?n.mission.residentAlternateId:n.mission.residentId);
 assert.equal(new Set(ids).size,ids.length);assert.ok(!ids.includes('muddy'));assert.ok(residents.length<nodes.length);
});
test('compass follows camera direction and offers main missions before optional discoveries',()=>{
 const target={...nodes[0],x:100,y:0};
 assert.equal(adventureNavigation([target],stage,{x:0,y:0},-Math.PI/2).bearing,0);
 assert.equal(adventureNavigation([target],stage,{x:0,y:0},0).bearing,90);
 const optional=nodes.find(n=>!stage.missionIds.includes(n.id));assert.equal(adventureNavigation([optional,target],stage,{x:0,y:0},0).id,target.id);
});
test('walking past an activity does not pause or enter it; explicit interaction enters once',()=>{
 let entered=0;const scene=createExplorationScene({stage,missions,heroId:'speedy',progress:{campaign:{completedMissions:{}}},position:nodes[0],onMission:()=>entered++});
 for(let i=0;i<60;i++)scene.update(1/60);assert.equal(entered,0);assert.match(scene.getInteraction().label,/Enter/);scene.key('KeyE',true);assert.equal(entered,1);scene.dispose();
});
