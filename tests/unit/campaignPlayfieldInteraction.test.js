import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { createCampaignPreviewProgress } from '../../src/features/soundSeekers/preview/campaignPreview.js';
import { startRoundedMission, judgeRoundedAction, currentCampaignCheckpoint } from '../../src/features/soundSeekers/rounded/campaignController.js';
import { validateCampaignSavedProgress } from '../../src/features/soundSeekers/v3/campaignStorage.js';
import { CAMPAIGN_PLAY, campaignLayoutSeed, campaignActionSound, campaignPlayfieldLandscape } from '../../src/features/soundSeekers/rounded/campaignPlayfield.js';
import { createAudio } from '../../demos/sound-seekers/src/audio.js';

test('all 210 entrances select owned scenery from their authored world without consulting an answer', () => {
  const worlds = new Map();
  for (const mission of CAMPAIGN_MISSIONS) {
    const landscape = campaignPlayfieldLandscape({ missionId: mission.id, familyId: mission.familyId,
      key: new Proxy({}, { get() { throw new Error('Answer consulted for scenery'); } }) });
    assert.ok(readFileSync(`public${landscape}`).length > 1000, mission.id);
    if (!worlds.has(mission.worldId)) worlds.set(mission.worldId, new Set());
    worlds.get(mission.worldId).add(landscape);
  }
  assert.equal(worlds.size, 3);
  assert.ok([...worlds.get('dino')].every(path => path.includes('fossil-canyon')));
  assert.ok([...worlds.get('moonwood')].every(path => path.includes('lantern-forest')));
  assert.equal(worlds.get('meadow').size, 3);
});

test('opening a lantern survives serialization without a response, teaching credit or completion', () => {
  const mission = CAMPAIGN_MISSIONS.find(m => m.familyId === 'lantern-search');
  const before = startRoundedMission(createCampaignPreviewProgress(mission.stageId),mission.id,{attemptId:'motor-only',now:1});
  const cp = currentCampaignCheckpoint(before), beat = cp.challenges[cp.beatIndex];
  const choice = (beat.view.choices || beat.view.options)[0];
  const result = judgeRoundedAction(before,{type:'PLAYFIELD',openId:choice.id},2);
  assert.equal(result.outcome.type,'motor');
  assert.deepEqual(result.progress.evidence,before.evidence);
  assert.deepEqual(result.progress.targets,before.targets);
  const restored = JSON.parse(JSON.stringify(result.progress));
  validateCampaignSavedProgress(restored);
  const saved = currentCampaignCheckpoint(restored);
  assert.deepEqual(saved.challenges,cp.challenges);
  assert.deepEqual(saved.beatState.playfield.opened,[choice.id]);
  assert.equal(saved.beatState.done,false);
  assert.equal(saved.beatState.errors,0);
  assert.deepEqual(judgeRoundedAction(restored,{type:'PLAYFIELD',openId:'unknown'},3).progress,restored);
  assert.equal(campaignLayoutSeed(beat),campaignLayoutSeed(saved.challenges[saved.beatIndex]));
});

test('all family action sounds are distinct bounded owned PCM with retained provenance', () => {
  const hashes = new Set();
  const manifest=JSON.parse(readFileSync('tools/soundSeekersQuestionArt/action-sounds.json'));
  for (const family of Object.keys(CAMPAIGN_PLAY)) {
    const bytes=readFileSync(`public${campaignActionSound(family)}`);
    assert.equal(bytes.toString('ascii',0,4),'RIFF');
    const duration=bytes.readUInt32LE(40)/(bytes.readUInt32LE(24)*bytes.readUInt16LE(22)*bytes.readUInt16LE(34)/8);
    assert.ok(duration>=.16&&duration<=.55,family);
    const hash=createHash('sha256').update(bytes).digest('hex');
    assert.equal(hash,manifest[family].sha256);
    assert.equal(hash,createHash('sha256').update(readFileSync(manifest[family].source)).digest('hex'));
    hashes.add(hash);
  }
  assert.equal(hashes.size,12);
});

test('a physical effect neither cancels speech nor claims stimulus delivery, and stop owns both buses', async () => {
  const sources=[];
  class Context {
    state='running';sampleRate=44100;currentTime=0;destination={};
    resume(){return Promise.resolve();}
    close(){return Promise.resolve();}
    createGain(){return {gain:{value:1},connect(){},disconnect(){}};}
    createBuffer(){return {duration:0,length:1};}
    decodeAudioData(){return Promise.resolve({duration:.3,length:1000});}
    createBufferSource(){
      const source={connect(){},disconnect(){},start(){sources.push(this);},stop(){this.stopped=true;}};
      return source;
    }
  }
  const audio=createAudio({AudioContextClass:Context,catalog:{voice:'/audio/v.mp3',action:'/audio/a.wav'},fetcher:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(44)})});
  await audio.unlock();
  const speech=audio.sequence(['voice']);
  await new Promise(resolve=>setTimeout(resolve,0));
  const voice=sources.find(s=>s.buffer?.length===1000);
  assert.ok(voice);
  assert.equal(await audio.effect('action'),true);
  assert.equal(voice.stopped,undefined);
  const effects=sources.filter(s=>s.buffer?.length===1000);
  assert.equal(effects.length,2);
  audio.stop();
  assert.equal(await speech,false);
  assert.ok(effects.every(s=>s.stopped));
  audio.dispose();
});
