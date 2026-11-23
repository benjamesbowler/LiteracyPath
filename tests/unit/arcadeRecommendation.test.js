import test from 'node:test';
import assert from 'node:assert/strict';
import { arcadeRecommendation, arcadeRecommendationAudioTexts } from '../../src/components/learn/games/arcadeRecommendation.js';
import { GAME_LIST } from '../../src/data/learnGamesData.js';
import { getLedaInstructionAudioPath } from '../../src/data/ledaProductionAudio.js';
import { AUDIO_QUEST_PATHS } from '../../src/data/generated/audioQuestPaths.generated.js';

const games = [
  { id: 'rocket-run', skill: 'Beginning sounds' },
  { id: 'rhyme-pop', skill: 'Rhyming' },
  { id: 'sentence-express', skill: 'Sentence order' }
];

test('teacher assignment takes precedence over skill and exploration suggestions', () => {
  const result = arcadeRecommendation({ games, assignedGameId: 'sentence-express', recommendedSkill: 'rhyming' });
  assert.equal(result.game.id, 'sentence-express');
  assert.equal(result.basis, 'teacher');
  assert.equal(result.reason, 'Your teacher chose this game.');
});

test('class focus selects an available game for the taught construct without claiming mastery', () => {
  const result = arcadeRecommendation({ games, recommendedSkill: 'rhyming' });
  assert.equal(result.game.id, 'rhyme-pop');
  assert.equal(result.reason, 'Practise: rhyming.');
  assert.equal(result.basis, 'skill');
  assert.doesNotMatch(result.reason, /master|passed|best|need|struggl/i);
});

test('current teaching cycle can suggest a relevant game when no focus game is available', () => {
  const result = arcadeRecommendation({ games, currentCycleId: 'cycle-1', recommendedSkill: 'unknown' });
  assert.equal(result.game.id, 'rocket-run');
  assert.equal(result.basis, 'cycle');
});

test('absent teaching evidence gives an honest saved-place or exploration suggestion', () => {
  const result = arcadeRecommendation({ games, progress: { difficulty: 'easy', games: {
    'rhyme-pop': { checkpoints: { easy: { chapterIndex: 1 } } }
  } } });
  assert.equal(result.game.id, 'rhyme-pop');
  assert.equal(result.reason, 'Keep going from your saved place.');
  assert.equal(result.basis, 'exploration');
  const unknown = arcadeRecommendation({ games, currentCycleId: 'missing', recommendedSkill: 'not_taught' });
  assert.equal(unknown.game.id, 'rocket-run');
  assert.equal(unknown.reason, 'Try a game you have not played yet.');
});

test('every authored teaching, saved-place and exploration reason resolves an exact recorded clip', () => {
  for (const text of arcadeRecommendationAudioTexts(GAME_LIST)) {
    const audio = getLedaInstructionAudioPath(text);
    assert.ok(audio, text);
    assert.ok(AUDIO_QUEST_PATHS.has(audio), text);
  }
});

test('cycle 8 with three played onset games still recommends onset practice, while written sorting matches its own target', () => {
  const progress = { games: {
    'rocket-run': { stars: 3, lastPlayedAt: '2026-11-22T00:00:00Z' },
    'sound-racer': { stars: 3, lastPlayedAt: '2026-11-20T00:00:00Z' },
    'word-climb': { stars: 3, lastPlayedAt: '2026-11-21T00:00:00Z' }
  } };
  assert.equal(arcadeRecommendation({ games: GAME_LIST, progress, currentCycleId: 'cycle-8' }).game.id, 'sound-racer');
  const next = arcadeRecommendation({ games: GAME_LIST, progress, currentCycleId: 'cycle-15' });
  assert.equal(next.game.id, 'sound-sort-factory');
  assert.equal(next.reason, 'Practise: match starting letters.');
  const unavailable = arcadeRecommendation({ games: [next.game], progress, recommendedSkill: 'initial_sounds' });
  assert.equal(unavailable.basis, 'exploration');
  assert.doesNotMatch(unavailable.reason, /sound/i);
});

test('browsing gives the same cycle recommendation and prefers an available unfinished or resumable outing', () => {
  const progress = { difficulty: 'easy', games: {
    'rocket-run': { journeys: { easy: { completed: Array.from({ length: 12 }, (_, i) => i) } } },
    'word-climb': { checkpoints: { easy: { chapterIndex: 3 } } }
  } };
  const recommend = (currentCycleId, games = GAME_LIST) => arcadeRecommendation({ games, progress, currentCycleId });
  assert.equal(recommend('cycle-1').game.id, 'word-climb');
  assert.equal(recommend('cycle-1', GAME_LIST.filter(game => game.id !== 'word-climb')).game.id, 'sound-racer');
  assert.equal(recommend('cycle-11').game.id, 'blend-and-build');
  assert.equal(recommend('cycle-25').game.id, 'pop-the-word');
  assert.deepEqual(recommend('cycle-11'), recommend('cycle-11'));
});
