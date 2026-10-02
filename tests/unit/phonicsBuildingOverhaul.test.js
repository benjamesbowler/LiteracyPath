import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { buildPhonicsBlendMissions, buildPhonicsGardenRounds } from '../../src/components/learn/games/games/phonicsBuildingRounds.js';
import { getChildWordAsset } from '../../src/data/childAssets.js';
import { hasKnownBadWordAudio } from '../../src/data/knownBadWordAudio.js';
import { segmentWrittenWord } from '../../src/utils/graphemeSegments.js';
import { gameRandom } from '../../src/utils/gameReplay.js';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';
import { AUDIO_QUEST_PATHS } from '../../src/data/generated/audioQuestPaths.generated.js';

for (const difficulty of ['easy', 'medium', 'hard']) {
  test(`${difficulty}: every garden edit changes exactly one written grapheme, preserves the rest, and has one seed answer`, () => {
    const rounds = buildPhonicsGardenRounds(difficulty, gameRandom(17));
    assert.equal(rounds.length, 26);
    assert.equal(new Set(rounds.map(item => item.id)).size, rounds.length);
    for (const round of rounds) {
      const source = segmentWrittenWord(round.sourceWord), target = segmentWrittenWord(round.word);
      assert.equal(source.length, target.length, `${round.sourceWord}/${round.word}`);
      assert.equal(source.filter((grapheme, index) => grapheme !== target[index]).length, 1);
      const candidate = [...round.sourceWord]; candidate[round.changeIndex] = round.word[round.changeIndex];
      assert.equal(candidate.join(''), round.word);
      assert.equal(round.bank.filter(letter => letter === round.word[round.changeIndex]).length, 1);
      assert.equal(new Set(round.bank).size, round.bank.length);
      const image = getChildWordAsset(round.word)?.image;
      assert.ok(image && existsSync(`public${image}`), `${round.word} has no owned picture`);
      assert.equal(hasKnownBadWordAudio(round.word), false);
      const voice = getLedaWordAudioPath(round.word);
      assert.ok(voice && AUDIO_QUEST_PATHS.has(voice) && existsSync(`public${voice}`), `${round.word} has no registered owned voice`);
    }
  });
  test(`${difficulty}: blend missions retain one rime and specific pictured targets, with seeded replay variation`, () => {
    const missions = buildPhonicsBlendMissions(difficulty, gameRandom(17));
    for (const mission of missions) {
      assert.equal(mission.onset + mission.rime, mission.word);
      assert.ok(mission.targets.length >= 2);
      assert.equal(new Set(mission.targets).size, mission.targets.length);
      for (const word of mission.targets) {
        assert.ok(word.endsWith(mission.rime));
        assert.equal(hasKnownBadWordAudio(word), false);
        const image = getChildWordAsset(word)?.image;
        assert.ok(image && existsSync(`public${image}`), `${word} has no owned picture`);
        const voice = getLedaWordAudioPath(word);
        assert.ok(voice && AUDIO_QUEST_PATHS.has(voice) && existsSync(`public${voice}`), `${word} has no registered owned voice`);
      }
    }
    assert.deepEqual(missions, buildPhonicsBlendMissions(difficulty, gameRandom(17)));
    assert.notDeepEqual(missions, buildPhonicsBlendMissions(difficulty, gameRandom(91)));
    assert.deepEqual(buildPhonicsGardenRounds(difficulty, gameRandom(17)), buildPhonicsGardenRounds(difficulty, gameRandom(17)));
    assert.notDeepEqual(buildPhonicsGardenRounds(difficulty, gameRandom(17)), buildPhonicsGardenRounds(difficulty, gameRandom(91)));
  });
}
test('difficulty adds literacy demand rather than timing pressure', () => {
  const lengths = ['easy','medium','hard'].map(tier => buildPhonicsGardenRounds(tier).reduce((sum, round) => sum + round.word.length, 0) / 26);
  assert.ok(lengths[0] < lengths[1] && lengths[1] < lengths[2]);
  assert.ok(buildPhonicsBlendMissions('medium').some(mission => mission.onset.length > 1));
  assert.ok(buildPhonicsBlendMissions('hard').some(mission => mission.onset.length >= 3));
  assert.ok(buildPhonicsBlendMissions('hard').some(mission => mission.rime === 'ain'));
});
