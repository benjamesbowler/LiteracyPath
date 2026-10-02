import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSortRounds } from '../../src/utils/adventureRounds.js';
import { gameRandom } from '../../src/utils/gameReplay.js';
import { QUEST_STOPS } from '../../src/data/questSequence.js';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { buildCampaignMission, createCampaignBeatState, resolveCampaignAction } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { targetAudio } from '../../src/features/soundSeekers/v3/engine/lexicon.js';

test('Sound Sort Factory varies bin sides per saved shift without changing word membership', () => {
  const counts = [0, 0];
  for (let seed = 1; seed <= 300; seed++) {
    const round = buildSortRounds('easy', gameRandom(seed));
    const item = round.items.find(item => item.binA === 'a' || item.binB === 'a');
    counts[item.binA === 'a' ? 0 : 1]++;
    assert.ok(round.items.every(item => item.bin === item.binA || item.bin === item.binB));
    const sameShift = round.items.filter(row => row.shift === item.shift);
    assert.ok(sameShift.every(row => row.binA === item.binA && row.binB === item.binB));
    assert.deepEqual(JSON.parse(JSON.stringify(round)), round);
  }
  assert.ok(counts.every(count => count > 100 && count < 200), `biased bin positions ${counts}`);
  assert.deepEqual(buildSortRounds('easy', gameRandom('saved-shift')), buildSortRounds('easy', gameRandom('saved-shift')));
});

test('Sound Seekers spelling-pattern fallback shuffles bin objects while private keys and recordings stay truthful', () => {
  const mission = CAMPAIGN_MISSIONS.find(mission => mission.id === 'meadow-02-2');
  const progress = {targets: Object.fromEntries(QUEST_STOPS.flatMap(stop => stop.teach.map(target => [target.id, {taught: true}])))};
  const sides = new Set();
  for (let replayOrdinal = 0; replayOrdinal < 32; replayOrdinal++) {
    const pack = buildCampaignMission(mission, progress, {replayOrdinal});
    const beat = pack.beats.find(beat => beat.domain === 'spelling_pattern_sort');
    sides.add(beat.view.bins.findIndex(bin => bin.id === 'bin0'));
    const restored = JSON.parse(JSON.stringify(beat));
    assert.deepEqual(restored.view.bins, beat.view.bins);
    for (const bin of beat.view.bins) assert.equal(bin.audio, targetAudio(beat.key.binTargets[bin.id]));
    let state = createCampaignBeatState(restored);
    for (const item of beat.view.items) {
      const correctId = beat.key.bins[item.id];
      assert.ok(beat.view.bins.some(bin => bin.id === correctId));
      const result = resolveCampaignAction(restored, state, {type: 'PLACE', itemId: item.id, binId: correctId});
      assert.notEqual(result.outcome?.correct, false);
      state = result.state;
    }
    assert.equal(state.done, true);
  }
  assert.deepEqual(sides, new Set([0, 1]));
  assert.deepEqual(buildCampaignMission(mission, progress, {replayOrdinal: 8}), buildCampaignMission(mission, progress, {replayOrdinal: 8}));
});
