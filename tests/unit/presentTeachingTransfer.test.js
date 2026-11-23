import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCyclePresentation, presentationReviewContent, PRESENTATION_DAYS } from '../../src/utils/present/presentationBuilder.js';
import { getApprovedPhonemeAudioPath } from '../../src/data/approvedPhonemeAudio.js';
import { PRESENT_DAILY_READING } from '../../src/data/presentDailyReading.js';

const lessonSection = (deck, predicate) => {
  const index = deck.manifest.slides.findIndex(predicate);
  assert.ok(index >= 0);
  return [...deck.html.matchAll(/<section class="slide [\s\S]*?<\/section>/g)][index][0];
};

test('late-cycle spelling transfers the same ending to a different modelled word', () => {
  for (const cycle of [25, 26, 27]) {
    const cycleId = `cycle-${cycle}`;
    const requiredEndings = { 25: /^ay$/, 26: /^y$/, 27: /^[aiou]ng$/ };
    for (const { value: day } of PRESENTATION_DAYS) {
      const deck = buildCyclePresentation(cycleId, { day });
      const patterns = deck.manifest.slides.filter(slide => slide.construct === 'decoding' && slide.parts);
      const spellings = deck.manifest.slides.filter(slide => slide.construct === 'encoding');
      assert.ok(patterns.length > 0, `${cycleId} ${day} needs a worked pattern`);
      const endings = patterns.map(slide => slide.parts.at(-1).text);
      assert.ok(endings.every(ending => requiredEndings[cycle].test(ending)));
      if (cycle === 26) assert.ok(patterns.every(slide => slide.parts.at(-1).audio === getApprovedPhonemeAudioPath('y_ie')));
      for (const spelling of spellings) {
        assert.ok(endings.includes(spelling.materials.graphemes.at(-1)));
        assert.ok(!patterns.some(pattern => pattern.target === spelling.target));
        assert.ok(spelling.audioRoles.some(role => role.src));
      }
      const currentWords = deck.lessonPlan.newWords;
      const taughtWords = presentationReviewContent(cycleId, day).words;
      const futureWords = presentationReviewContent(cycleId, 'friday').words.filter(word => !taughtWords.includes(word) && !currentWords.includes(word));
      assert.ok([...patterns, ...spellings].every(slide => !futureWords.includes(slide.target)));
    }
  }
});

test('new sight-word models show the authored attention spelling and hide it for recall', () => {
  const cases = [
    { cycle: 7, day: 'thursday', word: 'said', part: 'ai', model: '/ɛ/' },
    { cycle: 27, day: 'thursday', word: 'half', part: 'l', model: 'silent' }
  ];
  for (const { cycle, day, word, part, model } of cases) {
    const deck = buildCyclePresentation(`cycle-${cycle}`, { day });
    const html = lessonSection(deck, slide => slide.construct === 'high-frequency-word' && slide.target === word);
    assert.ok(html.includes(`data-hfw-attention="${part}"`), html);
    assert.ok(html.includes(model), html);
    assert.match(html, /p-hfw-model-cue p-memory-model/);
    assert.match(html, /data-memory-toggle/);
  }
});

test('picture descriptions carry visual evidence separately from authored captions', () => {
  for (const card of Object.values(PRESENT_DAILY_READING).flat()) {
    assert.ok(card.sceneAlt?.length > 10);
    assert.ok(!card.sceneAlt.includes(card.sentence));
    assert.doesNotMatch(card.sceneAlt, /Caption:|true|false|claim|recognisable/i);
    assert.doesNotMatch(card.sceneAlt, /\b(?:is|are|has|have|a|an)\b/i);
  }
  const deck = buildCyclePresentation('cycle-1', { day: 'tuesday' });
  const game = deck.manifest.slides.find(slide => slide.construct === 'supported-sentence-ordering');
  const html = lessonSection(deck, slide => slide === game);
  assert.ok(html.includes(`alt="${game.rounds[0].sceneAlt}"`));
  assert.ok(game.rounds.every(round => round.sceneAlt && !round.sceneAlt.includes(round.sentence)));
  const grammar = lessonSection(deck, slide => slide.construct === 'supported-basic-grammar');
  assert.doesNotMatch(grammar.match(/<img[^>]+>/)[0], /Caption:/);
});
