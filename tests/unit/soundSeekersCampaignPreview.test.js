import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaignPreviewProgress } from '../../src/features/soundSeekers/preview/campaignPreview.js';
import { CAMPAIGN_VERSION, CAMPAIGN_STAGES, CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { isCampaignStageUnlocked } from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';

test('every isolated later-land preview is reachable without fabricating learning evidence', () => {
  const catalog = { version: CAMPAIGN_VERSION, stages: CAMPAIGN_STAGES, missions: CAMPAIGN_MISSIONS };
  for (const stage of CAMPAIGN_STAGES) {
    const progress = createCampaignPreviewProgress(stage.id);
    assert.equal(isCampaignStageUnlocked(progress, stage.id, catalog), true);
    assert.equal(progress.campaign.currentStageId, stage.id);
    assert.equal(progress.previewFixture.synthetic, true);
    assert.deepEqual(progress.evidence, []);
    assert.deepEqual(progress.campaign.checkpoints, {});
    for (const target of Object.values(progress.targets)) {
      assert.equal(target.independent || 0, 0);
      assert.equal(target.supported || 0, 0);
    }
    for (const completion of Object.values(progress.campaign.completedMissions)) {
      assert.equal(completion.previewFixture, true);
    }
  }
  assert.throws(() => createCampaignPreviewProgress('missing'), RangeError);
});
