import assert from 'node:assert/strict';
import test from 'node:test';
import { freshChapter } from '../../demos/sound-seekers/src/chapter/progress.js';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { campaignReturn, shouldLeadWithWoodland, woodlandReturn } from '../../src/features/soundSeekers/soundSeekersEntry.js';

const campaign = (overrides = {}) => ({
  updatedAt: Date.UTC(2026, 10, 20),
  campaign: { currentStageId: 'meadow-01', completedMissions: {}, gameDiscoveries: {}, ...overrides }
});

test('Sound Seekers only compares timestamps for valid adventures that have been played', () => {
  const stageName = 'Meadow Farm';
  const recent = woodlandReturn({ status: 'loaded', progress: {
    ...freshChapter(2), attempts: 1, updatedAt: '2026-11-23T00:00:00.000Z'
  } });
  const previous = campaignReturn({ stageName, progress: campaign() });
  assert.equal(previous.label, 'Back to Meadow Farm');
  assert.equal(shouldLeadWithWoodland(previous, recent), true);
  assert.equal(shouldLeadWithWoodland({ ...previous, lastPlayedAt: Date.UTC(2026, 10, 24) }, recent), false);
  assert.equal(shouldLeadWithWoodland(previous, woodlandReturn({ status: 'unavailable' })), false);
  assert.equal(shouldLeadWithWoodland(previous, woodlandReturn({ status: 'loaded', progress: {
    ...freshChapter(1), updatedAt: '2026-11-23T00:00:00.000Z'
  } })), false);
  assert.equal(campaignReturn({ blocked: true }).status, 'unavailable');
});

test('returning or finished adventures use the current place or completed state', () => {
  const stageName = 'Meadow Farm';
  const activeMission = CAMPAIGN_MISSIONS[0];
  assert.equal(campaignReturn({ stageName, progress: campaign(), activeMission }).detail, activeMission.title);
  const completedMissions = Object.fromEntries(CAMPAIGN_MISSIONS.filter(mission => mission.kind === 'main').map(mission => [mission.id, { at: 1 }]));
  assert.equal(campaignReturn({ stageName, progress: campaign({ completedMissions }) }).label, 'Visit your Pals');
  assert.equal(woodlandReturn({ status: 'loaded', progress: { ...freshChapter(1), complete: true } }).label, 'Play Woodland Homecoming again');
});
