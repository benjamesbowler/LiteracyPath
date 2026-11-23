import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN_STAGES } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { mergeCampaignProgress, normalizeCampaignProgress } from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';
import { createCampaignStorage } from '../../src/features/soundSeekers/v3/campaignStorage.js';
import { ROUND_CAMPAIGN, recordRoundedDiscovery, recordRoundedInventory } from '../../src/features/soundSeekers/rounded/campaignController.js';
import { getCampaignWorldLayout, campaignSegmentWalkable, segmentDistance } from '../../src/features/soundSeekers/rounded/campaignWorldLayouts.js';
import { campaignCollisionLayout, campaignSpringSteps, campaignStepPlayer } from '../../src/features/soundSeekers/rounded/campaignWorld.js';
import { advanceCampaignTrail, campaignTrailTarget, getCampaignTrail } from '../../src/features/soundSeekers/rounded/campaignWorldTrails.js';

test('all thirty trails can be walked in both qualities before, during and after restoration', () => {
  for (const stage of CAMPAIGN_STAGES) {
    const base = getCampaignWorldLayout(stage.id);
    const layout = { ...base, springSteps: campaignSpringSteps(base) };
    const trail = getCampaignTrail(layout);
    assert.ok(trail.checkpoints.length >= 3, stage.id);
    assert.equal(advanceCampaignTrail(trail, 0, layout.spawn), 0, stage.id);
    for (const low of [false, true]) {
      for (let repaired = 0; repaired <= stage.missionIds.length; repaired++) {
        const world = campaignCollisionLayout(layout, stage.missionIds.slice(0, repaired), low);
        const player = { ...layout.spawn, vx: 0, vz: 0 };
        let index = 0;
        for (const point of trail.checkpoints) {
          const previous = trail.checkpoints[index - 1] || layout.spawn;
          const context = `${stage.id}, step ${index}, ${repaired} repairs, low ${low}`;
          assert.ok(campaignSegmentWalkable(world, previous, point, .68), context);
          for (const spring of world.springSteps) {
            const distance = segmentDistance(spring.x, spring.z, [previous.x, previous.z], [point.x, point.z]);
            assert.ok(distance > spring.radius + .68, `${context}: trail skirts the spring platforms`);
          }
          let next = index;
          for (let step = 0; step < 360 && next === index; step++) {
            const x = point.x - player.x;
            const z = point.z - player.z;
            const distance = Math.hypot(x, z);
            campaignStepPlayer(world, player, { x: x / distance, z: z / distance }, 1 / 60);
            next = advanceCampaignTrail(trail, index, player);
          }
          assert.equal(next, index + 1, context);
          index = next;
        }
        assert.equal(campaignTrailTarget(trail, index), null);
      }
    }
  }
});

test('visiting a lookout early cannot skip a trail mark', () => {
  const trail = getCampaignTrail(getCampaignWorldLayout('meadow-01'));
  const [start, middle, lookout] = trail.checkpoints;
  assert.equal(advanceCampaignTrail(trail, 0, lookout), 0);
  assert.equal(advanceCampaignTrail(trail, 0, start), 1);
  assert.equal(advanceCampaignTrail(trail, 1, start), 1);
  assert.equal(advanceCampaignTrail(trail, 1, lookout), 1);
  assert.equal(advanceCampaignTrail(trail, 1, middle), 2);
  assert.equal(advanceCampaignTrail(trail, 2, lookout), 3);
  assert.equal(advanceCampaignTrail(trail, 3, lookout), 3);
});

test('earned trail receipts survive local reload and merge without affecting literacy or carried objects', async () => {
  const scopeKey = 'trail-learner';
  const stageId = 'meadow-01';
  const initial = normalizeCampaignProgress(null, ROUND_CAMPAIGN);
  const event = { stageId, id: 'trail', kind: 'trail' };
  assert.equal(recordRoundedDiscovery(initial, { ...event, stageId: 'meadow-02' }, 20), initial);
  assert.equal(recordRoundedDiscovery(initial, { ...event, id: 'invented' }, 20), initial);
  assert.equal(recordRoundedDiscovery(initial, { ...event, kind: 'operate' }, 20), initial);
  const earned = recordRoundedDiscovery(initial, event, 20);
  assert.equal(recordRoundedDiscovery(earned, event, 22), earned);

  const carried = recordRoundedInventory(initial, { stageId, carryingId: 'carry' }, 25);
  const merged = mergeCampaignProgress({ scopeKey, progress: carried }, { scopeKey, progress: earned }, ROUND_CAMPAIGN).progress;
  assert.deepEqual(merged.campaign.gameDiscoveries[`${stageId}:trail`], { ...event, at: 20, narrativeOnly: true });
  assert.equal(merged.campaign.gameInventory[stageId].carryingId, 'carry');
  assert.deepEqual(merged.evidence, initial.evidence);
  assert.deepEqual(merged.targets, initial.targets);
  assert.deepEqual(merged.campaign.completedMissions, initial.campaign.completedMissions);

  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const adapter = createCampaignStorage({ storage, localOnly: true });
  try {
    assert.equal(adapter.saveCampaignProgress(scopeKey, merged).ok, true);
    const reloaded = createCampaignStorage({ storage, localOnly: true });
    try {
      const loaded = reloaded.loadCampaignProgress(scopeKey).progress;
      assert.deepEqual(loaded.campaign.gameDiscoveries, merged.campaign.gameDiscoveries);
      const other = reloaded.loadCampaignProgress('other-learner').progress;
      assert.deepEqual(other.campaign.gameDiscoveries, {});
    } finally {
      await reloaded.disposeCampaignStorage(scopeKey);
    }
  } finally {
    await adapter.disposeCampaignStorage(scopeKey);
  }
});
