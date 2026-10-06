import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { buildCampaignMission } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { campaignDisplayChoices, campaignSceneDescriptor } from '../../src/features/soundSeekers/rounded/campaignPresentation.js';
import { campaignQuestionImage, campaignQuestionArtSignature } from '../../src/features/soundSeekers/rounded/campaignQuestionArt.js';
import sceneArt from '../../src/features/soundSeekers/rounded/campaignSceneArt.generated.json' with {type:'json'};
import { collectCampaignQuestionArt } from '../../src/features/soundSeekers/rounded/campaignQuestionArtOffline.js';

const fingerprints = new Map();
function fingerprint(descriptor) {
  const source = campaignQuestionImage(descriptor);
  if (!fingerprints.has(source)) {
    const file = new URL(`../../public${source}`, import.meta.url);
    assert.ok(fs.existsSync(file), `Missing exact question artwork: ${source}`);
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    fingerprints.set(source, createHash('sha256').update(bytes).digest('hex'));
  }
  // Temporal trays also have their exact live caption in the question renderer.
  return `${fingerprints.get(source)}:${descriptor.appearance?.temporal || ''}`;
}

test('all current and replayed pictured choices resolve to distinct committed painted scenes', () => {
  const progress = {targets:{}}, signatures = new Map();
  for (const mission of CAMPAIGN_MISSIONS) for (const replayOrdinal of [0,1,2]) {
    for (const beat of buildCampaignMission(mission, progress, {replayOrdinal}).beats) {
      if (beat.mechanic === 'sound_signpost') for (const id of beat.targetIds) progress.targets[id] = {taught:true};
      const images = [];
      if (beat.view.objectId) fingerprint({kind:beat.view.objectId});
      for (const choice of campaignDisplayChoices(beat)) {
        const descriptor = campaignSceneDescriptor(beat,choice);
        if (!descriptor) continue;
        images.push(fingerprint(descriptor));
        const source=campaignQuestionImage(descriptor), signature=campaignQuestionArtSignature(descriptor);
        if(signatures.has(source))assert.equal(signatures.get(source),signature,`Scene signature collision: ${beat.id}`);
        signatures.set(source,signature);
      }
      assert.equal(new Set(images).size,images.length,`${beat.id}: indistinguishable pictured choices`);
    }
  }
  for (const kind of ['basket','parcel']) fingerprint({kind});
});

test('scene selection ignores private keys and labels, retaining the exact saved semantics', () => {
  const descriptor={kind:'towel',appearance:{relation:'on',landmark:{kind:'rail'}},destination:true,carriedKind:'towel'};
  assert.equal(campaignQuestionImage(descriptor),campaignQuestionImage({...descriptor,label:'Changed clue',correct:true,key:{answer:'another answer'}}));
  assert.equal(campaignQuestionImage(descriptor),campaignQuestionImage({...descriptor,appearance:{landmark:{kind:'rail'},relation:'on'}}));
  assert.notEqual(campaignQuestionImage(descriptor),campaignQuestionImage({...descriptor,appearance:{relation:'under',landmark:{kind:'stool'}}}));
});

test('activity-banner painted props and all landscape variants retain available real media', () => {
  for(const prop of Object.values(sceneArt)){
    assert.ok(prop.aspect>0);
    const file=new URL(`../../public${prop.source}`,import.meta.url);
    const bytes=fs.readFileSync(file);
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
  }
  for(const name of ['day','river','night']){
    const bytes=fs.readFileSync(new URL(`../../public/game-assets/sound-seekers/question-art/landscape-${name}.webp`,import.meta.url));
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
  }
});

test('offline artwork warming stays bounded to the active saved pack, with no private-key reads', () => {
  const progress={targets:{}};
  for(const mission of CAMPAIGN_MISSIONS){
    const beats=buildCampaignMission(mission,progress).beats;
    for(const beat of beats)if(beat.mechanic==='sound_signpost')for(const id of beat.targetIds)progress.targets[id]={taught:true};
    const challenges=beats.map(beat=>({...beat,key:new Proxy({}, {get(){throw new Error('Private key read');}})}));
    const urls=collectCampaignQuestionArt({missionId:mission.id,challenges});
    assert.ok(urls.length>0&&urls.length<250,mission.id);
    assert.equal(new Set(urls).size,urls.length);
    for(const url of urls)assert.ok(fs.existsSync(new URL(`../../public${url}`,import.meta.url)),url);
  }
  assert.deepEqual(collectCampaignQuestionArt({missionId:'unknown',challenges:[]}),[]);
  assert.deepEqual(collectCampaignQuestionArt({missionId:CAMPAIGN_MISSIONS[0].id,challenges:[{missionId:'foreign',key:{}}]}),[]);
});
