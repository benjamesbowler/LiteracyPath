import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN_STAGES, CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { CAMPAIGN_STAGE_NARRATION, CAMPAIGN_FAMILY_NARRATION, CAMPAIGN_MISSION_NARRATION, CAMPAIGN_NARRATION_AUDIO } from '../../src/features/soundSeekers/v3/content/campaignNarration.js';

test('every stage problem and physical family has its own exact spoken support', () => {
  assert.equal(Object.keys(CAMPAIGN_STAGE_NARRATION).length, 30);
  for (const stage of CAMPAIGN_STAGES) assert.equal(CAMPAIGN_STAGE_NARRATION[stage.id].text, stage.problem);
  for (const family of new Set(CAMPAIGN_MISSIONS.map(m => m.familyId))) assert.ok(CAMPAIGN_FAMILY_NARRATION[family]?.text);
  assert.equal(Object.keys(CAMPAIGN_FAMILY_NARRATION).length, 12);
});

test('opening goals include both optional residents and all forty-nine clips have unique stable paths', () => {
  const first = CAMPAIGN_STAGES[0];
  assert.deepEqual(Object.keys(CAMPAIGN_MISSION_NARRATION), [...first.missionIds, ...first.optionalMissionIds]);
  assert.match(CAMPAIGN_MISSION_NARRATION['meadow-01-side-1'].text, /Tiny/u);
  assert.match(CAMPAIGN_MISSION_NARRATION['meadow-01-side-2'].text, /Shy/u);
  assert.equal(CAMPAIGN_NARRATION_AUDIO.length, 49);
  assert.equal(new Set(CAMPAIGN_NARRATION_AUDIO.map(c => c.id)).size, 49);
  for (const clip of CAMPAIGN_NARRATION_AUDIO) {
    assert.equal(clip.audio, `/audio/sound-seekers/campaign/${clip.id}.mp3`);
    assert.ok(clip.text.trim());
    assert.ok(Object.isFrozen(clip));
  }
});
