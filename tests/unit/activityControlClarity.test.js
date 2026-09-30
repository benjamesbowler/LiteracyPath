import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { guidedReadingBookmark } from '../../src/utils/guidedReading/bookmark.js';
import { arcadeGuideForGame, ARCADE_GUIDE_EXAMPLES } from '../../src/components/learn/games/shared/arcadeGuideExamples.js';
import { GAME_LIST } from '../../src/data/learnGamesData.js';
import { ARCADE_PREMIUM_PROFILES } from '../../src/components/learn/games/shared/arcadePremiumProfiles.js';
import { getLedaInstructionAudioPath } from '../../src/data/ledaProductionAudio.js';
import { AUDIO_QUEST_PATHS } from '../../src/data/generated/audioQuestPaths.generated.js';

test('a book bookmark preserves backward navigation separately from pages reached', () => {
  const book = { pages: Array(8).fill({}) };
  assert.equal(guidedReadingBookmark(book, { lastPageIndex: 1, completedPages: 7 }), 1);
  assert.equal(guidedReadingBookmark(book, { lastPageIndex: 1 }, 4), 4);
  assert.equal(guidedReadingBookmark(book, { lastPageIndex: 99, pageStats: {
    7: { lastOpenedAt: '2026-09-30T01:00:00Z' }, 2: { lastOpenedAt: '2026-09-30T02:00:00Z' },
    99: { lastOpenedAt: '2026-09-30T03:00:00Z' }
  } }), 1);
  assert.equal(guidedReadingBookmark(book, { completedPages: 4 }), 3);
  assert.equal(guidedReadingBookmark(book, { completedPages: 99 }), 0);
  assert.equal(guidedReadingBookmark(book), 0);
  assert.equal(guidedReadingBookmark(book, null), 0);
});

test('each premium game has a real instruction recording and an action-specific example', async () => {
  assert.deepEqual(Object.keys(ARCADE_GUIDE_EXAMPLES).sort(), Object.keys(ARCADE_PREMIUM_PROFILES).sort());
  for (const game of GAME_LIST.filter(item => ARCADE_PREMIUM_PROFILES[item.id])) {
    const guide = arcadeGuideForGame(game);
    assert.equal(guide.steps.length, 3, game.id);
    assert.equal(guide.pieces.length, 3, game.id);
    assert.notEqual(guide.instruction, game.title, game.id);
    const audio = getLedaInstructionAudioPath(guide.instruction);
    assert.ok(audio, `${game.id} instruction resolver`);
    assert.ok(AUDIO_QUEST_PATHS.has(audio), `${game.id} current manifest`);
    await access(new URL(`../../public${audio}`, import.meta.url));
  }
  assert.equal(arcadeGuideForGame({ id: 'unknown' }), null);
});
