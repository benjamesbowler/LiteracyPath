import test from 'node:test';
import assert from 'node:assert/strict';
import { QUEST_STOPS } from '../../src/data/questSequence.js';
import { CAMPAIGN_LEARNING_PACKS, CAMPAIGN_LEARNING_AUDIO } from '../../src/features/soundSeekers/v3/content/campaignLearningPacks.js';
import { unitsFor } from '../../src/features/soundSeekers/v3/engine/lexicon.js';
import { existsSync } from 'node:fs';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { buildCampaignMission, createCampaignBeatState, resolveCampaignAction, campaignUnitTarget, CampaignContentError } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { publicBeat, MECHANICS, DOMAINS } from '../../src/features/soundSeekers/v3/engine/challenges.js';
import { resolveAction } from '../../src/features/soundSeekers/v3/engine/authority.js';
const mission=id=>CAMPAIGN_MISSIONS.find(m=>m.id===id);
const taught={targets:Object.fromEntries(['a','m','t','s'].map(id=>[id,{taught:true}]))};
function finish(beat) {
 let state=createCampaignBeatState(beat), outcome;
 const actions=beat.mechanic===MECHANICS.WORD_FORGE?beat.key.sequence.map(tileId=>({type:'PLACE_TILE',tileId})):[{type:'CHOOSE',optionId:beat.key.optionId,choiceId:beat.key.choiceId}];
 for(const action of actions)({state,outcome}=resolveAction(beat,state,action));
 return outcome;
}
test('introductions only expose their own two sounds and include both listening directions',()=>{
 for(const [id,letters]of [['meadow-01-1',['a','m']],['meadow-01-2',['t','s']]]){
  const pack=buildCampaignMission(mission(id));assert.equal(pack.beats.length,8);
  const decisions=pack.beats.filter(b=>b.key);assert.equal(decisions.length,6);
  assert.deepEqual(new Set(decisions.map(b=>b.domain)),new Set([DOMAINS.P2G,DOMAINS.G2P]));
  for(const beat of decisions){assert.deepEqual(new Set(Object.values(beat.key.optionTargets)),new Set(letters));assert.equal(beat.view.options.length,2);assert.equal(publicBeat(beat).key,undefined);}
 }
});
test('sound checks have explicit listen-only options; a sound prompt never prints its target',()=>{
 const beats=buildCampaignMission(mission('meadow-01-1')).beats.filter(b=>b.key);
 for(const b of beats){
  if(b.domain===DOMAINS.P2G){assert.equal(b.prompt.text,'Listen. Find the letter.');assert.equal(b.view.target.soundLabel,'');}
  else {assert.ok(['a','m'].includes(b.view.target.grapheme));assert.ok(b.view.options.every(o=>o.grapheme===''&&o.audio));assert.equal(b.prompt.cues.length,0);}
 }
});
test('mat and sat require taught code, deliver six encoding decisions, and hide print solution',()=>{
 assert.throws(()=>buildCampaignMission(mission('meadow-01-3')),e=>e instanceof CampaignContentError&&e.code==='untaught-prerequisite');
 const pack=buildCampaignMission(mission('meadow-01-3'),taught);
 assert.deepEqual(pack.beats.map(b=>b.key.word),['mat','sat']);assert.equal(pack.beats.reduce((n,b)=>n+b.view.slots,0),6);
 for(const beat of pack.beats){const visible=publicBeat(beat);assert.equal(visible.view.word,'');assert.equal(visible.view.image,'');assert.equal(visible.prompt.text,'Build the word.');assert.ok(visible.prompt.cues.every(c=>!c.text));assert.ok(visible.view.tiles.every(t=>['a','m','t','s'].includes(t.grapheme)));assert.equal(finish(beat).evidence.independent,true);}
});
test('initial modelling, retries and finale review are supported evidence',()=>{
 const beats=buildCampaignMission(mission('meadow-01-1')).beats.filter(b=>b.key);
 assert.equal(finish(beats[0]).evidence.independent,false);assert.equal(finish(beats[2]).evidence.independent,true);
 const beat=beats[2], state=createCampaignBeatState(beat);
 const wrong=resolveAction(beat,state,{type:'CHOOSE',optionId:beat.view.options.find(o=>o.id!==beat.key.optionId).id});
 assert.equal(resolveAction(beat,wrong.state,{type:'CHOOSE',optionId:beat.key.optionId}).outcome.evidence.independent,false);
 for(const b of buildCampaignMission(mission('meadow-01-5'),taught).beats)assert.equal(finish(b).evidence.independent,false);
});
test('replay is deterministic per ordinal and changes the item identities',()=>{
 const m=mission('meadow-01-1');assert.deepEqual(buildCampaignMission(m,{}, {replayOrdinal:2}),buildCampaignMission(m,{}, {replayOrdinal:2}));
 assert.notDeepEqual(buildCampaignMission(m).beats.map(b=>b.id),buildCampaignMission(m,{}, {replayOrdinal:1}).beats.map(b=>b.id));
});
test('all offered sound and word audio resolves to committed files',()=>{
 for(const id of ['meadow-01-1','meadow-01-2','meadow-01-3','meadow-01-4','meadow-01-5','meadow-01-side-1','meadow-01-side-2'])for(const b of buildCampaignMission(mission(id),taught).beats){
  const audio=[...(b.prompt.cues||[]).map(c=>c.src),...(b.view.options||[]).map(o=>o.audio),...(b.view.tiles||[]).map(o=>o.audio)].filter(Boolean);
  assert.ok(audio.length);for(const src of audio)assert.ok(existsSync(new URL(`../../public${src}`,import.meta.url)),src);
 }
});
test('unavailable oral and later authored packs fail rather than becoming unrelated quizzes',()=>{
 const unavailable=structuredClone(mission('meadow-01-4'));unavailable.id='missing';assert.throws(()=>buildCampaignMission(unavailable,taught),e=>e.code==='missing-authored-mission-pack');
 assert.ok(buildCampaignMission(mission('meadow-02-1'),taught).beats.length);
 const fake=structuredClone(mission('meadow-01-3'));fake.curriculum.allowedWordIds=['cat'];assert.throws(()=>buildCampaignMission(fake,taught),e=>e.code==='noncanonical-word');
});

test('oral scene mappings are unique, hidden scripts are available as explicit supported access',()=>{
 for(const id of ['meadow-01-4','meadow-01-side-1','meadow-01-side-2'])for(const beat of buildCampaignMission(mission(id)).beats){
  assert.equal(beat.mechanic,MECHANICS.STORY_BRIDGE);assert.equal(publicBeat(beat).view.text,'');assert.ok(beat.view.choices.every(c=>c.label===''));
  assert.ok(beat.view.choices.every(c=>beat.view.sceneObjects.some(o=>o.id===c.icon)));
  assert.equal(finish(beat).evidence.independent,true);
  const help=resolveCampaignAction(beat,null,{type:'REQUEST_TEXT_SUPPORT'});assert.equal(help.outcome.line,beat.key.supportText);
  const done=resolveCampaignAction(beat,help.state,{type:'CHOOSE',choiceId:beat.key.choiceId});assert.equal(done.outcome.evidence.independent,false);assert.ok(done.outcome.evidence.supportUsed.includes('text-support'));
 }
});

test('all 210 missions build three replay configurations through actual sequential taught targets',()=>{
 const progress={targets:{}};let decisions=0;
 for(const m of CAMPAIGN_MISSIONS){
  for(const replayOrdinal of [0,1,2]){
   const pack=buildCampaignMission(m,progress,{replayOrdinal});assert.ok(pack.beats.length,m.id);
   assert.equal(new Set(pack.beats.map(b=>b.id)).size,pack.beats.length,m.id);
   for(const beat of pack.beats){assert.equal(publicBeat(beat).key,undefined);assert.equal(beat.missionId,m.id);}
   if(!replayOrdinal)decisions+=pack.coverage?.decisionCount||0;
  }
  if(m.curriculum.mode==='teach')for(const id of m.curriculum.targetIds)progress.targets[id]={taught:true};
 }
 assert.ok(decisions>2000);
});
test('later printed word construction uses actual taught units, complete tile banks and no printed word solution',()=>{
 const progress={targets:Object.fromEntries(QUEST_STOPS.flatMap(s=>s.teach.map(t=>[t.id,{taught:true}])))};
 for(const m of CAMPAIGN_MISSIONS)for(const beat of buildCampaignMission(m,progress).beats){
  if(beat.mechanic!==MECHANICS.WORD_FORGE)continue;
  assert.equal(beat.view.word,'');assert.ok(beat.key.sequence.every(id=>beat.view.tiles.some(t=>t.id===id)));
  assert.ok(unitsFor(beat.key.word).every(u=>progress.targets[campaignUnitTarget(u)]?.taught),beat.key.word);
  let state=createCampaignBeatState(beat);for(const tileId of beat.key.sequence){const result=resolveCampaignAction(beat,state,{type:'PLACE_TILE',tileId});assert.notEqual(result.outcome.type,'incorrect',beat.key.word);state=result.state;}assert.equal(state.done,true);
 }
});
test('retrieval does not reveal carried object and related delivery evidence shares one scenario',()=>{
 const pack=buildCampaignMission(mission('meadow-02-4'));
 assert.equal(pack.coverage.scenarioCount,18);
 for(const pickup of pack.beats.filter(b=>b.view.phase==='pickup')){const delivery=pack.beats.find(b=>b.view.phase==='delivery'&&b.view.scenarioId===pickup.view.scenarioId);
  assert.equal(pickup.view.phase,'pickup');assert.equal(pickup.view.objectId,'');assert.equal(delivery.view.phase,'delivery');assert.equal(pickup.view.scenarioId,delivery.view.scenarioId);
  assert.equal(pickup.view.choices.find(o=>o.id===pickup.key.choiceId).icon,delivery.view.objectId);
  const result=resolveCampaignAction(pickup,null,{type:'CHOOSE',choiceId:pickup.key.choiceId});assert.equal(result.outcome.evidence.correlatedScenario,true);
 }
});
test('explicit visual introductions make no mastery evidence and oral errors request listening',()=>{
 const sign=buildCampaignMission(mission('meadow-01-1')).beats[0];
 const help=resolveCampaignAction(sign,null,{type:'REQUEST_TEXT_SUPPORT'});assert.equal(help.outcome.exposure,'visual-supported');assert.equal(help.outcome.evidence,null);assert.ok(help.outcome.line.includes('a'));
 const oral=buildCampaignMission(mission('meadow-01-4')).beats[0];
 const result=resolveCampaignAction(oral,null,{type:'CHOOSE',choiceId:oral.view.choices.find(o=>o.id!==oral.key.choiceId).id});assert.match(result.outcome.line,/Listen again/);assert.doesNotMatch(result.outcome.line,/Read the note/);
});
test('sentence reconstruction and temporal grammar retain distinct evidence claims',()=>{
 const dictated=buildCampaignMission(mission('dino-11-4')).beats.find(b=>b.mechanic==='sentence_build');
 let state=createCampaignBeatState(dictated),outcome;for(const tileId of dictated.key.sequence)({state,outcome}=resolveCampaignAction(dictated,state,{type:'PLACE_TILE',tileId}));assert.equal(outcome.evidence.independent,false);assert.equal(outcome.evidence.domain,'spoken_sentence_order');
 const grammar=buildCampaignMission(mission('moonwood-29-3')).beats[0];assert.equal(grammar.domain,'grammar_tense');
 const result=resolveCampaignAction(grammar,null,{type:'PLACE_TILE',tileId:grammar.key.sequence[0]});assert.equal(result.outcome.evidence.independent,true);
 const help=resolveCampaignAction(grammar,null,{type:'REQUEST_TEXT_SUPPORT'});assert.equal(resolveCampaignAction(grammar,help.state,{type:'PLACE_TILE',tileId:grammar.key.sequence[0]}).outcome.evidence.independent,false);
});
test('authored scenario options and presentation metadata are explicit and audio IDs unique',()=>{
 assert.equal(new Set(CAMPAIGN_LEARNING_AUDIO.map(a=>a.id)).size,CAMPAIGN_LEARNING_AUDIO.length);
 for(const pack of Object.values(CAMPAIGN_LEARNING_PACKS))for(const item of pack){assert.ok(item.text&&item.audio);if(item.sentence||item.construct==='grammar_tense')continue;assert.equal(item.options.filter(o=>o.id===item.correctId).length,1);assert.ok(item.options.every(o=>o.icon&&o.audio&&o.appearance));}
});

test('search clues never reveal the requested object through the carried-object projection',()=>{
 for(const id of ['meadow-02-side-2','dino-17-side-1','moonwood-29-1'])for(const beat of buildCampaignMission(mission(id)).beats){if(beat.mechanic===MECHANICS.SIGNPOST||!beat.key.supportText.startsWith('Find '))continue;assert.equal(beat.view.phase,'search');assert.equal(beat.view.objectId,'');}
});

test('authored suffix roles recover canonical morphology targets without guessing segmentation',()=>{
 assert.equal(campaignUnitTarget(unitsFor('jumped').at(-1)),'suffix_ed');
 assert.equal(campaignUnitTarget(unitsFor('dogs').at(-1)),'suffix_s');
 assert.equal(campaignUnitTarget(unitsFor('reading').at(-1)),'suffix_ing');
 const progress={targets:Object.fromEntries(QUEST_STOPS.flatMap(s=>s.teach.map(t=>[t.id,{taught:true}])))};
 const all=[0,1,2].flatMap(replayOrdinal=>buildCampaignMission({...mission('moonwood-29-2'),familyId:'rescue-bridge'},progress,{replayOrdinal}).beats);
 assert.ok(all.some(b=>b.key?.word==='jumped'));assert.ok(all.filter(b=>b.key?.word==='jumped').every(b=>b.targetIds.includes('suffix_ed')));
});
test('optional mission kind selects shorter canonical reading and encoding sections',()=>{
 const progress={targets:Object.fromEntries(QUEST_STOPS.flatMap(s=>s.teach.map(t=>[t.id,{taught:true}])))};
 for(const [id,mainCount,optionalCount]of [['dino-11-1',24,6],['dino-11-3',24,3]]){
  const main=mission(id);
  assert.equal(buildCampaignMission(main,progress).coverage.wordLevelDecisions,mainCount);
  assert.equal(buildCampaignMission({...main,kind:'optional'},progress).coverage.wordLevelDecisions,optionalCount);
 }
});

test('workshop changes one canonical taught part and preserves the original on errors',()=>{
 const progress={targets:Object.fromEntries(QUEST_STOPS.flatMap(s=>s.teach.map(t=>[t.id,{taught:true}])))};
 const beat=buildCampaignMission(mission('meadow-05-2'),progress).beats.find(b=>b.view.workshop?.mode==='replace'&&b.actId==='solve');
 assert.ok(beat);const w=beat.view.workshop;
 assert.ok(QUEST_STOPS.some(stop=>stop.words.includes(w.baseWord)));
 assert.equal(publicBeat(beat).view.word,'');assert.equal(beat.view.slots,1);
 const initial=createCampaignBeatState(beat),wrong=beat.view.tiles.find(t=>t.id!==beat.key.sequence[0]);
 const retry=resolveCampaignAction(beat,initial,{type:'PLACE_TILE',tileId:wrong.id});
 assert.equal(retry.outcome.type,'incorrect');assert.deepEqual(retry.state.wordUnits,w.baseUnits);
 const assisted=resolveCampaignAction(beat,retry.state,{type:'REQUEST_MODEL'});
 assert.equal(assisted.outcome.revealId,beat.key.sequence[0]);
 const done=resolveCampaignAction(beat,assisted.state,{type:'PLACE_TILE',tileId:assisted.outcome.revealId});
 assert.equal(done.outcome.type,'complete');assert.equal(done.outcome.evidence.independent,false);
 assert.equal(done.outcome.evidence.construct,'phoneme-substitution-encoding');
 assert.deepEqual(done.state.wordUnits,unitsFor(beat.key.word).map(u=>u.grapheme));
 assert.deepEqual(done.state.wordUnits.map((u,i)=>u===w.baseUnits[i]?null:i).filter(i=>i!==null),[w.slotIndex]);
 assert.ok(mission('meadow-05-2').curriculum.targetIds.includes(beat.targetIds[0]));
});
test('workshop without eligible changed target uses explicit supported assembly',()=>{
 const progress={targets:Object.fromEntries(QUEST_STOPS.flatMap(s=>s.teach.map(t=>[t.id,{taught:true}])))};
 const beats=buildCampaignMission(mission('moonwood-29-2'),progress).beats.filter(b=>b.key&&b.actId==='solve');
 assert.ok(beats.length);assert.ok(beats.every(b=>b.view.workshop.mode==='assembly'&&b.supportContext.mode==='supported-practice'));
});
test('three-act expansion has fresh scenarios, stable child-facing sections and distinct item IDs',()=>{
 const progress={targets:Object.fromEntries(QUEST_STOPS.flatMap(s=>s.teach.map(t=>[t.id,{taught:true}])))};
 for(const id of ['meadow-02-4','meadow-08-3','moonwood-29-3']){
  const pack=buildCampaignMission(mission(id),progress);
  assert.equal(pack.coverage.scenarioCount,18,id);
  assert.deepEqual([...new Set(pack.beats.filter(b=>b.act).map(b=>b.act.title))],['Find the supplies','Help your friend','Bring it home']);
 }
 const final=buildCampaignMission(mission('dino-11-5'),progress);assert.equal(final.coverage.scenarioCount,24);assert.equal(final.coverage.wordLevelDecisions,6);
 for(const m of CAMPAIGN_MISSIONS){
  const pack=buildCampaignMission(m,progress);assert.equal(new Set(pack.beats.map(b=>b.id)).size,pack.beats.length,m.id);assert.ok(pack.beats.length<=200);
  const wordTargets=pack.beats.filter(b=>b.key?.word).map(b=>b.key.word);assert.equal(new Set(wordTargets).size,wordTargets.length,`${m.id} repeats an encoding target`);
  const scenarioScripts=new Map();for(const beat of pack.beats.filter(b=>b.key?.scenarioId)){
   const previous=scenarioScripts.get(beat.key.scenarioId);if(previous)assert.equal(previous,beat.key.supportText);else scenarioScripts.set(beat.key.scenarioId,beat.key.supportText);
  }
  assert.equal(new Set(scenarioScripts.values()).size,scenarioScripts.size,`${m.id} repeats a scenario script`);
 }
});
test('successful split-pattern encoding exposes exact completed orthography only after authority completion',()=>{
 const progress={targets:Object.fromEntries(QUEST_STOPS.flatMap(s=>s.teach.map(t=>[t.id,{taught:true}])))};
 const beat=buildCampaignMission(mission('dino-18-1'),progress).beats.find(b=>b.view.workshop?.mode==='replace'&&b.actId==='solve');
 let state=createCampaignBeatState(beat);assert.equal(state.completedWord,undefined);
 ({state}=resolveCampaignAction(beat,state,{type:'PLACE_TILE',tileId:beat.key.sequence[0]}));assert.equal(state.completedWord,beat.key.word);
});
