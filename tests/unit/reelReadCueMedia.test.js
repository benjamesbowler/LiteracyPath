import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { reelReadV2Ladder } from '../../src/utils/reelReadV2Levels.js';
import { getArcadeCuePicture } from '../../src/data/arcadeCuePictures.js';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';

test('all thirty retained Reel target slots resolve real recorded cues and explicit picture/context semantics',()=>{
  const counts={word:0,'meaning-context':0};
  for(const difficulty of ['easy','medium','hard']) for(const level of reelReadV2Ladder(difficulty,0)) {
    const picture=getArcadeCuePicture(level.target),audio=getLedaWordAudioPath(level.target);
    assert.ok(picture.image&&existsSync(new URL('../../public'+picture.image,import.meta.url)),level.target+' picture');
    assert.ok(audio&&existsSync(new URL('../../public'+audio,import.meta.url)),level.target+' recorded cue');
    assert.ok(['word','meaning-context'].includes(picture.kind));counts[picture.kind]++;
    assert.ok(![...level.correctWords,...level.distractors].includes(level.target),level.target+' cannot be copied from a whole-word fish');
  }
  assert.deepEqual(counts,{word:15,'meaning-context':15});
  // This is resolver/file coverage. It does not establish actual playback,
  // human listening or picture-ID uniqueness for broad contextual scenes.
});
