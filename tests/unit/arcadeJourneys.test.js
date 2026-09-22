import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { ARCADE_JOURNEYS, arcadeJourneyChapter, completedArcadeChapters, finishArcadeChapter, nextArcadeChapter } from '../../src/utils/arcadeJourneys.js';
import { applyCheckpoint, readCheckpoint } from '../../src/utils/gameCheckpoints.js';
import { mergeMonotonic } from '../../src/utils/progressMerge.js';
import { grammarGrindLadder } from '../../src/utils/grammarGrindLevels.js';
import { buildSoundKeySession, soundKeyTokensForWord } from '../../src/features/soundkeys/content.js';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';

test('all thirteen Arcade games retain twelve bounded trails at each learning level',()=>{
  assert.equal(Object.keys(ARCADE_JOURNEYS).length,13);
  for(const id of Object.keys(ARCADE_JOURNEYS)){
    let record={stars:2};
    for(let i=0;i<12;i++){
      assert.equal(nextArcadeChapter(record,'easy'),i);
      assert.equal(arcadeJourneyChapter(id,i).index,i);
      record=finishArcadeChapter(record,id,'easy',i);
      assert.deepEqual(finishArcadeChapter(record,id,'easy',i),record,'replay must not stamp twice');
    }
    assert.equal(completedArcadeChapters(record,'easy').length,12);
    assert.equal(completedArcadeChapters(record,'hard').length,0);
    assert.equal(nextArcadeChapter(record,'easy'),0);
    assert.equal(record.stars,2);
    assert.equal(finishArcadeChapter(record,id,'easy',12),record);
  }
});
test('continuing and cloud merging preserve route identity and union achievements',()=>{
  let record=finishArcadeChapter({},'grammar-grind','easy',0);
  const games=applyCheckpoint({'grammar-grind':record},'grammar-grind','easy',4,10,879,2);
  assert.deepEqual(readCheckpoint(games,'grammar-grind','easy'),{level:4,totalLevels:10,sessionSeed:879,chapter:2});
  record=mergeMonotonic(record,finishArcadeChapter({},'grammar-grind','easy',1));
  assert.deepEqual(completedArcadeChapters(record,'easy'),[0,1]);
  assert.equal(nextArcadeChapter(record,'easy',1),2);
});
test('expanded sets have distinct words, playable spellings, pictures and released recordings',()=>{
  for(const difficulty of ['easy','medium','hard']){
    const words=buildSoundKeySession(difficulty,31,24);
    assert.equal(words.length,24);assert.equal(new Set(words.map(w=>w.id)).size,24);
    for(const word of words){
      assert.ok(word.image&&existsSync('public'+word.image),word.id+' image');
      assert.ok(existsSync('public'+getLedaWordAudioPath(word.id)),word.id+' recording');
      assert.ok(word.tokens.every(token=>soundKeyTokensForWord(word).includes(token)),word.id+' keys');
      assert.equal(word.tokens.join(''),word.id);
    }
    const skate=Array.from({length:3},(_,i)=>grammarGrindLadder(difficulty,31,i)).flat();
    assert.equal(new Set(skate.map(w=>w.correct)).size,30);
    for(const word of skate){
      assert.equal(word.options.filter(option=>option===word.correct).length,1);
      assert.equal(new Set(word.options).size,word.options.length);
      assert.ok(existsSync('public'+getLedaWordAudioPath(word.correct)),word.correct+' recording');
    }
  }
});
