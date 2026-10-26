import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN_WORLD_LAYOUTS, CAMPAIGN_WORLD_THEMES, campaignCanWalk, campaignRoadSamples, campaignTerrainHeight } from '../../src/features/soundSeekers/rounded/campaignWorldLayouts.js';
import { campaignRoadGeometry, sampleCampaignRoads } from '../../src/features/soundSeekers/rounded/campaignWorldSurface.js';

test('painted shoulders preserve every authored road centre, width and terrain height across all places', () => {
  for (const layout of Object.values(CAMPAIGN_WORLD_LAYOUTS)) {
    const theme = CAMPAIGN_WORLD_THEMES[layout.worldId], roads = sampleCampaignRoads(layout);
    for (const road of layout.roads) {
      const geometry = campaignRoadGeometry(layout, road, theme, roads);
      const points = campaignRoadSamples(road), position = geometry.attributes.position;
      const stride = 6;
      for (let i = 0; i < points.length; i++) {
        const first = i * stride, last = first + stride - 1;
        assert.ok(Math.abs((position.getX(first) + position.getX(last)) / 2 - points[i][0]) < 1e-5, layout.stageId);
        assert.ok(Math.abs((position.getZ(first) + position.getZ(last)) / 2 - points[i][1]) < 1e-5, layout.stageId);
        assert.ok(Math.abs(Math.hypot(position.getX(first) - position.getX(last), position.getZ(first) - position.getZ(last)) - road.width) < 1e-5, layout.stageId);
      }
      for (let i = 0; i < position.count; i++) {
        assert.ok(Math.abs(position.getY(i) - campaignTerrainHeight(layout, position.getX(i), position.getZ(i)) - .04) < 1e-5, layout.stageId);
        if (i >= points.length * stride) assert.ok(campaignCanWalk(layout, position.getX(i), position.getZ(i)), 'A rounded end cannot paint a route into a blocker');
      }
      assert.ok([...geometry.attributes.color.array].every(value => Number.isFinite(value) && value >= 0 && value <= 1));
      assert.ok([...geometry.attributes.uv.array].every(Number.isFinite));
      geometry.dispose();
    }
  }
});
