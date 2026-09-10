import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN_WORLDS, CAMPAIGN_STAGES, CAMPAIGN_MISSIONS, getCampaignStage, getCampaignMission } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { CAST } from '../../src/features/soundSeekers/v3/content/cast.js';
import { QUEST_STOPS, getStop } from '../../src/data/questSequence.js';

test('campaign contains the full proposed main and optional scope with honest duration budgets', () => {
  assert.equal(CAMPAIGN_WORLDS.length, 3);
  assert.equal(CAMPAIGN_STAGES.length, 30);
  assert.equal(CAMPAIGN_MISSIONS.filter(m => m.kind === 'main').length, 150);
  assert.equal(CAMPAIGN_MISSIONS.filter(m => m.kind === 'optional').length, 60);
  for (const world of CAMPAIGN_WORLDS) {
    const stages = CAMPAIGN_STAGES.filter(s => s.worldId === world.id);
    assert.equal(stages.length, 10);
    const minutes = CAMPAIGN_MISSIONS.filter(m => m.worldId === world.id && m.kind === 'main').reduce((sum, m) => sum + m.estimatedMinutes, 0);
    assert.equal(minutes + stages.reduce((sum, s) => sum + s.explorationMinutes, 0), world.estimatedMinutes);
  }
  assert.equal(CAMPAIGN_WORLDS.reduce((sum, w) => sum + w.estimatedMinutes, 0), 1200);
  assert.ok(CAMPAIGN_MISSIONS.every(m => m.durationEvidence === 'production-estimate-not-measured'));
});

test('all main missions remain reachable without optional quests and each stage offers a choice', () => {
  const completed = new Set();
  const main = CAMPAIGN_MISSIONS.filter(m => m.kind === 'main');
  let changed = true;
  while (changed) {
    changed = false;
    for (const mission of main) {
      if (!completed.has(mission.id) && mission.prerequisiteMissionIds.every(id => completed.has(id))) {
        completed.add(mission.id);
        changed = true;
      }
    }
  }
  assert.equal(completed.size, 150);
  for (const stage of CAMPAIGN_STAGES) {
    const roots = stage.missionIds.map(getCampaignMission).filter(m => m.prerequisiteMissionIds.every(id => !stage.missionIds.includes(id)));
    assert.ok(roots.length >= 2, stage.id);
    assert.equal(stage.missionIds.length, 5);
    assert.equal(stage.optionalMissionIds.length, 2);
    const finale = getCampaignMission(stage.finaleMissionId);
    assert.ok(finale.finale);
    assert.ok(finale.families.length >= 2);
    assert.equal(finale.outcome.repairId, stage.repairId);
  }
});

test('every prerequisite resolves, optional rewards never gate the campaign and references use canonical cast and anchors', () => {
  assert.equal(new Set(CAMPAIGN_MISSIONS.map(m => m.id)).size, 210);
  assert.equal(new Set(CAMPAIGN_MISSIONS.map(m => m.layoutId)).size, 210);
  assert.deepEqual(CAMPAIGN_STAGES.flatMap(s => s.legacyStopIds), QUEST_STOPS.map(s => s.id));
  for (const mission of CAMPAIGN_MISSIONS) {
    assert.ok(CAST[mission.residentId], mission.residentId);
    assert.ok(CAST[mission.residentAlternateId], mission.residentAlternateId);
    assert.notEqual(mission.residentId, mission.residentAlternateId);
    assert.equal(CAST[mission.residentId].land, CAST[mission.residentAlternateId].land);
    assert.ok(getCampaignStage(mission.stageId));
    assert.ok(mission.objective.length > 40);
    assert.ok(mission.layout.interaction);
    assert.equal(mission.curriculum.evidence, 'formative-only');
    assert.equal(mission.curriculum.configurationsStatus, 'requires-authored-reviewed-content-sets');
    for (const id of mission.prerequisiteMissionIds) {
      assert.ok(getCampaignMission(id), `${mission.id} -> ${id}`);
      assert.equal(getCampaignMission(id).kind, 'main');
    }
    const permitted = new Set(mission.curriculum.anchorIds.flatMap(id => getStop(id).teach.map(t => t.id)));
    assert.ok(mission.curriculum.targetIds.every(id => permitted.has(id)), mission.id);
  }
  assert.equal(getCampaignStage('missing'), null);
  assert.equal(getCampaignMission('missing'), null);
});

test('each stage uses at least three distinct action families and never repeats consecutive mandatory primary families', () => {
  assert.equal(new Set(CAMPAIGN_MISSIONS.map(m => m.familyId)).size, 12);
  for (const stage of CAMPAIGN_STAGES) {
    const families = stage.missionIds.map(id => getCampaignMission(id).familyId);
    assert.ok(new Set(families).size >= 3, stage.id);
    assert.ok(families.every((family, i) => !i || family !== families[i - 1]), stage.id);
  }
});

test('opening separates EL cycles 1 and 2 and gates encoding on both teaching branches', () => {
  const one = getCampaignMission('meadow-01-1');
  const two = getCampaignMission('meadow-01-2');
  const bridge = getCampaignMission('meadow-01-3');
  assert.deepEqual(one.curriculum.targetIds, ['a', 'm']);
  assert.deepEqual(one.curriculum.elIntroductionCycleNumbers, [1]);
  assert.deepEqual(two.curriculum.targetIds, ['t', 's']);
  assert.deepEqual(two.curriculum.elIntroductionCycleNumbers, [2]);
  assert.deepEqual(bridge.prerequisiteMissionIds, [one.id, two.id]);
  assert.deepEqual(bridge.curriculum.allowedWordIds, ['mat', 'sat']);
  for (const word of bridge.curriculum.allowedWordIds) {
    assert.ok(getStop('s1').words.includes(word));
    assert.ok([...word].every(letter => bridge.curriculum.minimumTaughtTargetIds.includes(letter)));
  }
  assert.equal(bridge.layout.gaps.length, 2);
  assert.ok(bridge.layout.phases.some(phase => phase.includes('collision surface')));
  const listening = getCampaignMission('meadow-01-4');
  assert.equal(listening.curriculum.printRole, 'none');
  assert.deepEqual(listening.curriculum.targetIds, []);
});

test('campaign catalogues are deeply immutable so progress cannot mutate authored content', () => {
  assert.throws(() => CAMPAIGN_STAGES[0].missionIds.push('bad'), TypeError);
  assert.throws(() => getCampaignMission('meadow-01-3').layout.gaps[0].width = 1, TypeError);
});
