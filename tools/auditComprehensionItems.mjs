// Describe the live question bank. These word-overlap measures do not score a pupil.
import { readFileSync } from 'node:fs';
import { COMPREHENSION_PASSAGES } from '../src/content/comprehension/passages.js';
import { COMPREHENSION_EXPANSION_IDS } from '../src/content/comprehension/expansionPassages.js';

const tokens = text => text.toLowerCase().match(/[a-z]+/g) || [];
function mostCommonOpening(lines) {
  const counts = new Map();
  for (const line of lines) {
    const opening = line.split(/\s+/).slice(0, 2).join(' ');
    counts.set(opening, (counts.get(opening) || 0) + 1);
  }
  const [opening, count] = [...counts].sort((a, b) => b[1] - a[1])[0];
  return { opening, count };
}
function shortestCredit(lengths, keyIndex) {
  const shortest = Math.min(...lengths);
  return lengths[keyIndex] === shortest ? 1 / lengths.filter(length => length === shortest).length : 0;
}
function summarize(group) {
  let questions = 0;
  let uniqueCorrect = 0;
  let uniqueWrong = 0;
  let ties = 0;
  let highCredit = 0;
  let lowCredit = 0;
  let oneSentenceCitations = 0;
  let shortestWordCredit = 0;
  let shortestCharacterCredit = 0;
  for (const passage of group) {
    const story = new Set(tokens(passage.text));
    for (const question of passage.questions) {
      const scores = question.options.map(option => {
        const words = tokens(option);
        if (!words.length) throw new Error(`Empty choice in ${question.id}`);
        return words.filter(word => story.has(word)).length / words.length;
      });
      const keyIndex = question.options.indexOf(question.answer);
      const answer = scores[keyIndex];
      const max = Math.max(...scores), min = Math.min(...scores);
      const top = scores.filter(score => score === max).length;
      if (top > 1) ties++;
      else if (answer === max) uniqueCorrect++;
      else uniqueWrong++;
      if (answer === max) highCredit += 1 / top;
      if (answer === min) lowCredit += 1 / scores.filter(score => score === min).length;
      shortestWordCredit += shortestCredit(question.options.map(option => tokens(option).length), keyIndex);
      shortestCharacterCredit += shortestCredit(question.options.map(option => option.length), keyIndex);
      if (question.evidence.length === 1) oneSentenceCitations++;
      questions++;
    }
  }
  const prompts = group.flatMap(p => p.questions.map(q => q.prompt));
  return {
    passages: group.length, questions, highestUniqueCorrect: uniqueCorrect, highestUniqueWrong: uniqueWrong,
    highestTies: ties, highestOverlapPercent: 100 * highCredit / questions,
    lowestOverlapPercent: 100 * lowCredit / questions, shortestChoicePercent: 100 * shortestWordCredit / questions,
    shortestCharacterPercent: 100 * shortestCharacterCredit / questions,
    oneSentenceCitations,
    exactlySixSentences: group.filter(p => p.sentences.length === 6).length,
    characterFirst: group.filter(p => /^(Chips|Chompy|Fluff|Muddy|Pip|Socks)\b/.test(p.text)).length,
    withDirectSpeech: group.filter(p => /[“"]/.test(p.text)).length,
    distinctQuestionPrompts: new Set(prompts).size,
    mostCommonQuestionOpening: mostCommonOpening(prompts),
    mostCommonDrawingOpening: mostCommonOpening(group.map(p => p.draw)),
    distinctDiscussionPrompts: new Set(group.map(p => p.discussion).filter(Boolean)).size
  };
}
const expansion = new Set(COMPREHENSION_EXPANSION_IDS);
// A saved runtime bank lets editors compare an earlier edition using the identical rule.
const source = process.argv[2];
const passages = source ? JSON.parse(readFileSync(source, 'utf8')) : COMPREHENSION_PASSAGES;
console.log(JSON.stringify({
  all: summarize(passages),
  original: summarize(passages.filter(p => !expansion.has(p.id))),
  expansion: summarize(passages.filter(p => expansion.has(p.id)))
}, null, 2));
