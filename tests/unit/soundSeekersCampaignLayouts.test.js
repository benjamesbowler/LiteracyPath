import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { CAMPAIGN_MISSIONS, CAMPAIGN_STAGES } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { CAMPAIGN_STAGE_LAYOUTS, getCampaignHubLayout, getCampaignLayout } from '../../src/features/soundSeekers/v3/content/campaignLayouts.js';
import { createPlatformState, advancePlatform } from '../../src/features/soundSeekers/v3/engine/platformPhysics.js';

const settle = state => {
  const events = [];
  for (let i = 0; i < 240; i += 1) events.push(...advancePlatform(state, 1 / 120).events);
  return events;
};

test('every authored stage has concrete hub geometry, canonical backdrop and reachable raised meet points', () => {
  assert.equal(CAMPAIGN_STAGE_LAYOUTS.length, 30);
  assert.equal(new Set(CAMPAIGN_STAGE_LAYOUTS.map(p => p.landmark)).size, 30);
  for (const stage of CAMPAIGN_STAGES) {
    const layout = getCampaignHubLayout(stage.id);
    assert.equal(layout.missionNodes.length, 7);
    assert.deepEqual(layout.missionNodes.map(n => n.id), [...stage.missionIds, ...stage.optionalMissionIds]);
    assert.ok(existsSync(new URL(`../../public${layout.backdrop}`, import.meta.url)), layout.backdrop);
    const state = createPlatformState({ ...layout, tuning: { jumpSpeed: 630 } });
    assert.equal(settle(state).filter(e => e.type === 'recover').length, 0);
    for (const node of layout.missionNodes) {
      assert.ok([...layout.solids, ...layout.platforms].some(r => node.x >= r.x && node.x <= r.x + r.width && Math.abs(r.y - node.y) < 1), `${stage.id} ${node.id} needs supporting terrain`);
    }
    for (const platform of layout.platforms) {
      const previous = [...layout.solids, ...layout.platforms].filter(p => p.id !== platform.id && p.y > platform.y);
      const jumpHeight = state.tuning.jumpSpeed ** 2 / (2 * state.tuning.gravity);
      assert.ok(previous.some(p => p.y - platform.y <= jumpHeight && platform.x - (p.x + p.width) < 120), `${platform.id} needs a jumpable approach`);
    }
    assert.equal(layout.repairFootprint.repairId, stage.repairId);
  }
});

test('all 210 missions compile to usable physics terrain with family-specific action objects', () => {
  for (const mission of CAMPAIGN_MISSIONS) {
    const layout = getCampaignLayout(mission.id, { beatCount: 3 });
    assert.equal(layout.rooms.length, 3);
    assert.equal(layout.repairFootprint.repairId, mission.outcome.repairId);
    createPlatformState(layout);
    assert.ok(layout.rooms.every(room => room.objects.length >= 2));
    for (const rect of [...layout.solids, ...layout.platforms]) {
      assert.ok(rect.width > 0 && Number.isFinite(rect.x) && Number.isFinite(rect.y));
      assert.ok(rect.x >= layout.bounds.left && rect.x + rect.width <= layout.bounds.right + 1);
    }
    assert.ok(layout.hazards.every(hazard => hazard.literacyPenalty === false));
  }
});

test('bridges have a real collision gap before encoding and a walkable surface after repair', () => {
  const layout = getCampaignLayout('meadow-01-3');
  const room = layout.rooms[0];
  const gap = room.hazards[0];
  const spawn = { x: gap.x + gap.width / 2, y: room.groundY };
  const broken = createPlatformState({ ...layout, spawn });
  assert.ok(settle(broken).some(e => e.type === 'recover'));
  const repaired = createPlatformState({ ...layout, spawn, platforms: [...layout.platforms, ...room.repairPlatforms] });
  assert.equal(settle(repaired).filter(e => e.type === 'recover').length, 0);
  assert.equal(repaired.y, room.groundY);
  assert.equal(room.actionContract.collisionUnlock, 'encoding-complete');
});

test('climbing produces continuing real height with platforms rather than a capped visual offset', () => {
  const mission = CAMPAIGN_MISSIONS.find(m => m.familyId === 'tree-rescue');
  const layout = getCampaignLayout(mission.id, { beatCount: 6 });
  assert.equal(layout.camera.vertical, true);
  assert.equal(layout.rooms.at(-1).exit.y, 560 - 6 * 300);
  assert.ok(layout.bounds.top < layout.rooms.at(-1).exit.y);
  assert.equal(layout.platforms.length, 24);
  assert.ok(layout.rooms.every((room, i) => i === 0 || room.spawn.y === layout.rooms[i - 1].exit.y));
});

test('finales can compose their actual beat families and layout builds do not share mutable state', () => {
  const layout = getCampaignLayout('meadow-01-5', { beatCount: 3, beatFamilies: ['sound-steps', 'rescue-bridge', 'garden-kitchen'] });
  assert.deepEqual(layout.rooms.map(r => r.familyId), ['sound-steps', 'rescue-bridge', 'garden-kitchen']);
  assert.ok(layout.rooms[1].repairPlatforms.length);
  assert.ok(layout.rooms[2].objects.some(o => o.id === 'stool'));
  layout.rooms[0].objects.length = 0;
  assert.ok(getCampaignLayout('meadow-01-5').rooms[0].objects.length);
  assert.throws(() => getCampaignLayout('meadow-01-1', { beatCount: 0 }), RangeError);
  assert.throws(() => getCampaignLayout('meadow-01-1', { beatFamilies: ['unknown'] }), /No physical action kit/u);
  assert.equal(getCampaignLayout('missing'), null);
  assert.equal(getCampaignHubLayout('missing'), null);
});
