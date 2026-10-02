import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPlayerCheckpoint } from '../../src/components/learn/games/arcadeLearningContext.js';
import { buildAdventureRoundSet } from '../../src/utils/adventureRounds.js';
import { gameRandom } from '../../src/utils/gameReplay.js';

const games=['cvc-word-builder','sight-word-memory','blend-and-build','word-rescue','sound-sort-factory','letter-garden','pop-the-word','word-hopscotch','reading-race'];
test('all nine seeded practice games preserve first-question support and partial progress',()=>{
  for(const game of games){
    const cp={level:0,totalLevels:5,sessionSeed:654};
    assert.deepEqual(readPlayerCheckpoint({[game]:{checkpoints:{easy:cp}}},game,'easy'),cp,game);
    assert.equal(readPlayerCheckpoint({[game]:{checkpoints:{easy:{...cp,sessionSeed:-1}}}},game,'easy'),null,game);
    assert.equal(readPlayerCheckpoint({[game]:{checkpoints:{easy:{...cp,level:5}}}},game,'easy'),null,game);
    assert.deepEqual(readPlayerCheckpoint({[game]:{checkpoints:{easy:{level:2,totalLevels:10}}}},game,'easy'),{level:2,totalLevels:10},`${game} legacy checkpoint`);
  }
});
test('rescue and factory fresh rounds replay their recorded seed',()=>{
  for(const mode of ['rescue','sort'])for(const difficulty of ['easy','medium','hard']){
    const first=buildAdventureRoundSet(mode,difficulty,0,gameRandom('known run'));
    assert.deepEqual(buildAdventureRoundSet(mode,difficulty,0,gameRandom('known run')),first);
    assert.notDeepEqual(buildAdventureRoundSet(mode,difficulty,0,gameRandom('different run')),first);
  }
});
