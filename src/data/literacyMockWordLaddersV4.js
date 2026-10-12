import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { hfwApprovedWordsBySkill } from './hfwApprovedCoverageWords.js';

const FILE = 'src/data/literacyMockWordLaddersV4.js';
export const MOCK_V4_HFW_PROMPT = 'Which printed word matches the recording?';
export const MOCK_V4_HOMOPHONE_PROMPT = 'Tap the word that needs changing.';

// target | two entry foils | two harder foils. The target stock is held
// constant across levels. Every harder foil is a real word, not a misspelling;
// it differs by one edit or by reversing letter order (was/saw). Homophones
// are excluded because an isolated spoken target cannot distinguish them.
export const MOCK_V4_HFW_CONTRASTS = Object.freeze({
  hfw_1_25: [
    ['and', 'pig', 'sun', 'ant', 'end'],
    ['are', 'sit', 'bug', 'arm', 'art'],
    ['as', 'go', 'in', 'at', 'is'],
    ['at', 'be', 'so', 'as', 'it'],
    ['be', 'up', 'so', 'by', 'he'],
    ['for', 'bit', 'hen', 'fog', 'fork'],
    ['have', 'jump', 'lock', 'gave', 'hate'],
    ['he', 'on', 'up', 'we', 'be'],
    ['his', 'cat', 'bed', 'hit', 'has'],
    ['in', 'be', 'so', 'on', 'it'],
    ['is', 'on', 'be', 'as', 'it'],
    ['it', 'be', 'so', 'in', 'at'],
    ['on', 'be', 'us', 'in', 'of'],
    ['that', 'milk', 'jump', 'than', 'chat'],
    ['was', 'big', 'pen', 'has', 'saw'],
  ],
  hfw_26_50: [
    ['all', 'net', 'pig', 'ill', 'ball'],
    ['an', 'up', 'so', 'as', 'in'],
    ['but', 'red', 'hen', 'bit', 'bat'],
    ['by', 'on', 'he', 'be', 'my'],
    ['can', 'pig', 'box', 'cat', 'pan'],
    ['do', 'in', 'up', 'go', 'no'],
    ['had', 'box', 'sun', 'has', 'hat'],
    ['how', 'pig', 'bed', 'cow', 'now'],
    ['if', 'be', 'so', 'in', 'it'],
    ['not', 'cup', 'bag', 'net', 'nut'],
    ['or', 'be', 'up', 'on', 'of'],
    ['said', 'jump', 'lock', 'paid', 'sand'],
    ['she', 'cat', 'bug', 'the', 'shed'],
    ['we', 'on', 'up', 'he', 'be'],
    ['when', 'milk', 'coat', 'then', 'hen'],
  ],
  hfw_51_75: [
    ['go', 'it', 'up', 'so', 'no'],
    ['has', 'cup', 'bed', 'had', 'his'],
    ['her', 'pig', 'box', 'hen', 'hem'],
    ['him', 'cat', 'sun', 'ham', 'hum'],
    ['like', 'boat', 'jump', 'line', 'lake'],
    ['look', 'fish', 'jump', 'book', 'lock'],
    ['make', 'fish', 'jump', 'take', 'maze'],
    ['more', 'fish', 'jump', 'mole', 'sore'],
    ['out', 'pig', 'hen', 'our', 'cut'],
    ['see', 'cat', 'bug', 'set', 'bee'],
    ['so', 'in', 'at', 'go', 'no'],
    ['some', 'fish', 'jump', 'same', 'come'],
    ['then', 'milk', 'coat', 'them', 'thin'],
    ['time', 'coat', 'jump', 'tame', 'tile'],
    ['will', 'boat', 'jump', 'well', 'wall'],
  ],
  hfw_76_100: [
    ['part', 'fish', 'jump', 'park', 'cart'],
    ['come', 'fish', 'jump', 'some', 'cone'],
    ['could', 'stamp', 'bring', 'would', 'cold'],
    ['day', 'pig', 'sun', 'say', 'dry'],
    ['did', 'cat', 'hen', 'dig', 'dad'],
    ['down', 'milk', 'coat', 'town', 'dawn'],
    ['find', 'coat', 'jump', 'kind', 'fine'],
    ['get', 'box', 'sun', 'got', 'pet'],
    ['long', 'fish', 'jump', 'song', 'lung'],
    ['made', 'fish', 'jump', 'maze', 'make'],
    ['may', 'pig', 'sun', 'say', 'man'],
    ['my', 'on', 'be', 'by', 'me'],
    ['no', 'it', 'up', 'go', 'so'],
    ['now', 'pig', 'bed', 'how', 'new'],
    ['sit', 'bag', 'cup', 'sat', 'sip'],
  ],
});

// L2 places the SAME printed homophone once correctly and once incorrectly.
// The learner must locate the contextual error rather than flag its spelling
// wherever it occurs. Indices identify occurrences, including repeated text.
// The contexts are intentionally read: narrating spellings cannot reveal which
// occurrence is wrong, and silent selectable tokens retain the printed proof.
export const MOCK_V4_HOMOPHONE_CONTEXTS = Object.freeze([
  { pair: 'sea_see', wrong: 'see', replacement: 'sea', meaning: 'the large body of salt water',
    entry: 'We sailed on the see.', entryIndex: 4,
    harder: 'I see a boat on the see.', harderIndex: 6, correctIndex: 1,
    correctMeaning: 'looking with the eyes' },
  { pair: 'sun_son', wrong: 'son', replacement: 'sun', meaning: 'the bright star in the sky',
    entry: 'The son shines in the sky.', entryIndex: 1,
    harder: 'The son shines as my son runs outside.', harderIndex: 1, correctIndex: 5,
    correctMeaning: 'a male child in a family' },
  { pair: 'be_bee', wrong: 'be', replacement: 'bee', meaning: 'the flying insect',
    entry: 'A be landed on a flower.', entryIndex: 1,
    harder: 'A be landed near me; I will be still.', harderIndex: 1, correctIndex: 7,
    correctMeaning: 'the verb after will in will be still' },
  { pair: 'no_know', wrong: 'no', replacement: 'know', meaning: 'having the answer in mind',
    entry: 'I no the answer.', entryIndex: 1,
    harder: 'I no the answer, but I said no.', harderIndex: 1, correctIndex: 7,
    correctMeaning: 'the reply that refuses or disagrees' },
  { pair: 'one_won', wrong: 'one', replacement: 'won', meaning: 'finishing first in the race',
    entry: 'Our team one the race.', entryIndex: 2,
    harder: 'The one team that trained hard one the race.', harderIndex: 6, correctIndex: 1,
    correctMeaning: 'the number of teams described' },
  { pair: 'ate_eight', wrong: 'eight', replacement: 'ate', meaning: 'eating the lunch in the past',
    entry: 'I eight my lunch.', entryIndex: 1,
    harder: 'I eight my lunch when the clock struck eight.', harderIndex: 1, correctIndex: 8,
    correctMeaning: 'the time named by the number eight' },
  { pair: 'hear_here', wrong: 'hear', replacement: 'here', meaning: 'the place beside the speaker',
    entry: 'Stand hear by me.', entryIndex: 1,
    harder: 'I hear a bird, but stand hear by me.', harderIndex: 6, correctIndex: 1,
    correctMeaning: 'perceiving the bird with the ears' },
  { pair: 'blue_blew', wrong: 'blue', replacement: 'blew', meaning: 'the wind moving in the past',
    entry: 'The wind blue my hat away.', entryIndex: 2,
    harder: 'The wind blue away my blue hat.', harderIndex: 2, correctIndex: 5,
    correctMeaning: 'the colour of the hat' },
  { pair: 'to_two', wrong: 'to', replacement: 'two', meaning: 'the number of socks',
    entry: 'I have to red socks.', entryIndex: 2,
    harder: 'I went to bed with to warm socks on.', harderIndex: 5, correctIndex: 2,
    correctMeaning: 'the destination in went to bed' },
  { pair: 'there_their', wrong: 'their', replacement: 'there', meaning: 'introducing something that exists',
    entry: 'Their is a dog outside.', entryIndex: 0,
    harder: 'We saw their was a dog beside their gate.', harderIndex: 2, correctIndex: 7,
    correctMeaning: 'the owners of the gate' },
  { pair: 'right_write', wrong: 'right', replacement: 'write', meaning: 'making the letters of a name',
    entry: 'I right my name.', entryIndex: 1,
    harder: 'My right hand helps me right my name.', harderIndex: 5, correctIndex: 1,
    correctMeaning: 'the hand on the opposite side to the left hand' },
  { pair: 'new_knew', wrong: 'new', replacement: 'knew', meaning: 'having the answer in mind in the past',
    entry: 'I new the answer.', entryIndex: 1,
    harder: 'The new pupil new the answer to the question.', harderIndex: 3, correctIndex: 1,
    correctMeaning: 'the pupil who has recently joined' },
]);

const instruction = text => ({ role: 'instruction', text, path: getLedaInstructionAudioPath(text) });
const cleanWord = text => text.toLowerCase().replace(/[^a-z]/g, '');
const orderedChoices = words => words.map((label, index) => ({ id: `c${index}`, label }));
const sourceIdentity = id => ({ id, sourceItemId: id, canonicalItemId: id, tutorialOnly: false });

function editDistance(left, right) {
  let row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    const next = [i];
    for (let j = 1; j <= right.length; j++) next.push(Math.min(next[j - 1] + 1,
      row[j] + 1, row[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1)));
    row = next;
  }
  return row[right.length];
}

function orthographicRelationship(target, foil) {
  if (editDistance(target, foil) === 1) return target.length === foil.length ? 'one_letter_substitution'
    : target.length < foil.length ? 'one_letter_insertion' : 'one_letter_deletion';
  if (target === [...foil].reverse().join('')) return 'letter_order_reversal';
  return 'distant_real_word';
}

function hfwSources(skillId, rows, template) {
  return rows.flatMap(([target, e1, e2, h1, h2]) => [1, 2].map(level => {
    if (!hfwApprovedWordsBySkill[skillId].includes(target)) throw new Error(`Out-of-band v4 HFW target: ${skillId}:${target}`);
    const foils = level === 1 ? [e1, e2] : [h1, h2];
    const choices = orderedChoices([target, ...foils]);
    const id = `mock.v4.word-ladder.${skillId}.l${level}.${target}`;
    const relationships = foils.map(foil => orthographicRelationship(target, foil));
    const distances = foils.map(foil => editDistance(target, foil));
    return {
      ...sourceIdentity(id), skillId, domainId: 'phonics', level, format: 'choice', formatType: 'HFW_AUDIO_CONTRAST_V4',
      answerMode: 'exact', constructClaim: 'spoken_to_print_hfw_orthographic_discrimination',
      prompt: MOCK_V4_HFW_PROMPT, passage: '', targetWord: target, choices, answer: 'c0',
      modality: 'recognition', evidenceModality: 'audio+print', displayPassageDuringResponse: true, hideWrittenLabels: false,
      stimulusKey: `hfw-word:${target}`, canonicalPassageId: `hfw-word:${target}`, exposureFamilyId: `hfw-word:${target}`,
      requiredAudioCues: [instruction(MOCK_V4_HFW_PROMPT), { role: 'target_word', text: target, path: getLedaWordAudioPath(target) }],
      explanation: `${target} is the printed word matching the exact spoken recording. ${foils.join(' and ')} are different real words.`,
      distractorRationales: Object.fromEntries(choices.slice(1).map((choice, index) => [choice.id,
        level === 1 ? `${choice.label} differs from ${target} in ${distances[index]} letter edits and does not match the spoken word.`
          : `D-VISUAL-NEIGHBOR: ${choice.label} is a ${relationships[index].replaceAll('_', ' ')} neighbour of ${target}; its full printed word does not match the spoken recording.`])),
      difficultyEvidence: level === 1
        ? `Recognise the supplied spoken HFW among two real words with at least ${Math.min(...distances)} letter edits; whole-word shape separates the alternatives.`
        : `Recognise the same in-band spoken HFW while rejecting two close real-word neighbours (${relationships.join(', ')}); distinguishing letters and their positions are required. The target stock, three-choice operation and silent print access are unchanged.`,
      sourceProvenance: { kind: 'original_mock_v4_word_ladder', file: FILE, sourceId: `${skillId}:${target}:l${level}`, taskTemplate: template.id,
        demand: { operation: 'recognise_spoken_hfw', targetBand: skillId, targetLength: target.length, choiceCount: 3,
          foilEditDistances: distances, foilRelationships: relationships, closeRealWordFoils: level === 2 ? 2 : 0,
          targetStockHeldConstant: true } },
      mediaDecision: { role: 'audio-and-print', paths: [], constructReview: 'approved', answerNeutral: 'approved',
        reason: 'The exact spoken target is essential evidence. All printed alternatives remain silent; pictures would substitute a different word-to-picture task.' },
    };
  }));
}

function homophoneSources(rows, template) {
  return rows.flatMap(row => [1, 2].map(level => {
    const passage = level === 1 ? row.entry : row.harder;
    const answerIndex = level === 1 ? row.entryIndex : row.harderIndex;
    const choices = orderedChoices(passage.split(' ')).map((choice, tokenIndex) => ({ ...choice, tokenIndex }));
    const id = `mock.v4.word-ladder.homophones.l${level}.${row.pair}`;
    if (cleanWord(choices[answerIndex].label) !== row.wrong) throw new Error(`Misregistered homophone error: ${id}`);
    const family = `homophone-context-pair:${row.pair}`;
    return {
      ...sourceIdentity(id), skillId: 'homophones', domainId: 'vocabulary', level, format: 'select_text', formatType: 'HOMOPHONE_ERROR_LOCATION_V4',
      answerMode: 'exact', constructClaim: 'locate_contextual_homophone_error', prompt: MOCK_V4_HOMOPHONE_PROMPT,
      passage, choices, answer: `c${answerIndex}`, targetWord: '', modality: 'reading', evidenceModality: 'text',
      passageAccess: 'text_only', displayPassageDuringResponse: true, hideWrittenLabels: false,
      stimulusKey: passage.toLowerCase(), exposureFamilyId: family,
      requiredAudioCues: [instruction(MOCK_V4_HOMOPHONE_PROMPT)],
      explanation: `The ${answerIndex + 1}${answerIndex === 0 ? 'st' : answerIndex === 1 ? 'nd' : answerIndex === 2 ? 'rd' : 'th'} word, ${choices[answerIndex].label}, must be ${row.replacement}: this context means ${row.meaning}.${level === 2 ? ` The other ${row.wrong} is correct because it means ${row.correctMeaning}.` : ''}`,
      distractorRationales: Object.fromEntries(choices.filter(choice => choice.tokenIndex !== answerIndex).map(choice => [choice.id,
        level === 2 && choice.tokenIndex === row.correctIndex
          ? `D-HOMOPHONE: This occurrence of ${row.wrong} correctly means ${row.correctMeaning}. Matching its spelling to the error without checking its role selects the wrong occurrence.`
          : `D-CONTEXT: ${choice.label} is correctly used at token ${choice.tokenIndex + 1}; it is not the homophone error required by this sentence.`])),
      difficultyEvidence: level === 1
        ? 'Locate one misused homophone in a short concrete sentence; there is no correctly used instance of the same spelling competing with it.'
        : 'Locate one misused homophone while retaining another correct occurrence of exactly the same printed word. Its meaning and grammatical role, rather than spotting the spelling, determine which token needs changing.',
      sourceProvenance: { kind: 'original_mock_v4_word_ladder', file: FILE, sourceId: `${row.pair}:l${level}`, taskTemplate: template.id,
        demand: { operation: 'locate_contextual_homophone_error', homophonePair: row.pair,
          errorTokenIndex: answerIndex, replacement: row.replacement,
          sameSpellingOccurrences: level, correctlyUsedSameSpellingOccurrences: level - 1,
          ...(level === 2 ? { correctHomophoneTokenIndex: row.correctIndex } : {}),
          wordCount: choices.length, requiresOccurrenceContext: level === 2 } },
      mediaDecision: { role: 'text-only', paths: [], constructReview: 'approved', answerNeutral: 'approved',
        reason: 'The printed sentence supplies the contextual spelling evidence. Only the exact error-location direction is narrated; no token or replacement is spoken as an answer clue.' },
    };
  }));
}

/** New v4 sources only. Existing normalized sources are never changed. */
export function buildLiteracyMockWordLaddersV4(bank) {
  const output = [];
  for (const [skillId, rows] of Object.entries(MOCK_V4_HFW_CONTRASTS)) {
    const template = bank.find(item => item.skillId === skillId);
    if (!template) throw new Error(`Missing v4 word-ladder skill: ${skillId}`);
    output.push(...hfwSources(skillId, rows, template));
  }
  const homophones = bank.find(item => item.skillId === 'homophones');
  if (!homophones) throw new Error('Missing v4 word-ladder skill: homophones');
  output.push(...homophoneSources(MOCK_V4_HOMOPHONE_CONTEXTS, homophones));
  return output;
}
