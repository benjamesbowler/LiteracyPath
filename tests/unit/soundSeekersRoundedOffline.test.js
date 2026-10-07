import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { buildCampaignMission } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { registerCampaignAudio, collectCampaignOfflineAudio, CAMPAIGN_OFFLINE_AUDIO_PREFIXES } from '../../src/features/soundSeekers/rounded/campaignAudioCatalog.js';
import { campaignActionSound } from '../../src/features/soundSeekers/rounded/campaignPlayfield.js';

test('entering a stage warms only its recorded narration, entering a mission adds its exact immutable pack', () => {
  const stage = collectCampaignOfflineAudio({ stageId: 'meadow-01' });
  assert.ok(stage.length > 0 && stage.length < 25);
  assert.ok(stage.includes('/audio/sound-seekers/campaign/stage-meadow-01-problem.mp3'));
  assert.ok(!stage.some(url => url.includes('stage-meadow-02')));
  const mission = CAMPAIGN_MISSIONS[0];
  const challenges = buildCampaignMission(mission).beats;
  const meetingOnly = collectCampaignOfflineAudio({ missionId: mission.id });
  const urls = collectCampaignOfflineAudio({ stageId: mission.stageId, missionId: mission.id, challenges });
  assert.ok(urls.length > meetingOnly.length && urls.length < 100);
  assert.ok(urls.includes('/audio/phonemes/short_a.mp3'));
  assert.ok(urls.some(url => url.startsWith('/audio/production/en-US/isolated_word/')));
  assert.ok(urls.every(url => existsSync(new URL(`../../public${url}`, import.meta.url))), 'all warmed references resolve to actual recordings');
  assert.equal(new Set(urls).size, urls.length);
  assert.deepEqual(urls, [...urls].sort());
  assert.ok(!urls.some(url => url.includes('stage-moonwood')));
});

test('offline selection rejects private key URLs, foreign mission packs, unrelated roots and remote paths', () => {
  const first = CAMPAIGN_MISSIONS[0], foreign = CAMPAIGN_MISSIONS[7];
  const privateOnly = '/audio/sound-seekers/campaign/private-key.mp3';
  const urls = collectCampaignOfflineAudio({ missionId: first.id, challenges: [
    { missionId: first.id, key: { answerAudio: privateOnly }, prompt: { cues: [
      { src: 'https://private.example/answer.mp3' }, { src: '//private.example/answer.mp3' },
      { src: '/audio/production/private/answer.mp3' }, { src: '/audio/phonemes/../private.mp3' },
      { src: '/audio/phonemes/m.mp3' }
    ] } },
    { missionId: foreign.id, prompt: { cues: [{ src: '/audio/sound-seekers/campaign/foreign-mission.mp3' }] } }
  ] });
  assert.ok(urls.includes('/audio/phonemes/m.mp3'));
  assert.ok(!urls.includes(privateOnly));
  assert.ok(!urls.some(url => /private|foreign/.test(url)));
  assert.deepEqual(collectCampaignOfflineAudio({ stageId: 'meadow-01', missionId: 'unknown' }), []);
  assert.deepEqual(collectCampaignOfflineAudio({ stageId: 'unknown' }), []);
});

test('all authored packs use only the bounded canonical audio roots without changing audio registration', () => {
  const taught = { targets: Object.fromEntries(CAMPAIGN_MISSIONS.flatMap(mission => [...mission.curriculum.targetIds,
    ...(mission.curriculum.minimumTaughtTargetIds || [])].map(id => [id, { taught: true }]))) };
  for (const mission of CAMPAIGN_MISSIONS) {
    const beats = buildCampaignMission(mission, taught).beats;
    const referenced = registerCampaignAudio({}, beats.map(beat => ({ prompt: beat.prompt, view: beat.view, support: beat.support })));
    const warmed = new Set(collectCampaignOfflineAudio({ missionId: mission.id, challenges: beats }));
    for (const beat of beats) assert.ok(warmed.has(campaignActionSound(beat.familyId)), `${mission.id} must warm each played family's action sound`);
    for (const url of Object.keys(referenced)) {
      assert.ok(CAMPAIGN_OFFLINE_AUDIO_PREFIXES.some(prefix => url.startsWith(prefix)), `${mission.id}: ${url}`);
      assert.ok(warmed.has(url), `${mission.id} must warm its actual instruction and optional replay recordings`);
    }
  }
});
