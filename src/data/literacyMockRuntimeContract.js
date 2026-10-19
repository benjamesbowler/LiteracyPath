// Lightweight learner contracts shared with the authoring bank.
export const LITERACY_MOCK_TUTORIAL_IDS = Object.freeze({
  multi_select: 'mock.rhyme.cat-hat', match: 'mock.letters.round',
  order: 'mock.sentence.puppy', select_text: 'mock.text.first-clouds', build_word: 'mock.build.cat',
});
export const literacyMockTutorialIdsForVersion = version => ['literacy-mock-v8','literacy-mock-v9','literacy-mock-v10'].includes(version)
  ? { ...LITERACY_MOCK_TUTORIAL_IDS, match: 'mock.v8.tutorial.match-shapes' } : LITERACY_MOCK_TUTORIAL_IDS;

export function scoreLiteracyMockResponse(item, selected) {
  if (item.answerMode === 'set') return Array.isArray(selected)
    && new Set(selected).size === selected.length
    && [...selected].sort().join('\u0000') === [...item.answer].sort().join('\u0000');
  if (item.answerMode === 'sequence') return Array.isArray(selected)
    && JSON.stringify(selected) === JSON.stringify(item.answer);
  return typeof selected === 'string' && selected === item.answer;
}
