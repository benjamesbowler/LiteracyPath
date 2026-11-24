import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCyclePracticePlan } from '../../src/components/cycle-practice/cyclePracticeContent.js';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';

test('all 27 cycles supply original practice activities rather than an assessment/check deck',()=>{
  for(const cycle of elSkillsBlockCycles.filter(cycle=>cycle.cycleNumber)){
    const plan=buildCyclePracticePlan(cycle,'teacher-class-practice');
    assert.ok(plan.rounds.length>=12,cycle.id);
    assert.equal(new Set(plan.rounds.map(round=>round.mechanicId)).size,6,cycle.id);
    assert.ok(plan.rounds.every(round=>round.stationId!=='check'));
  }
});
