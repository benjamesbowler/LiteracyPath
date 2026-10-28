import { getLedaInstructionAudioPath } from './ledaProductionAudio.js';

export const LITERACY_MOCK_BEGINNER_WRITING_V12_SOURCE = 'src/data/literacyMockBeginnerWritingV12.js';
// Distinct familiar situations and sentence structures at the existing sentence
// capitalization operation. Every response preserves the exact same words and
// punctuation; no vocabulary definition or oral reading is needed for the key.
const SENTENCES = [
  ['door', 'Please shut the door.'],
  ['play', 'We can play after lunch.'],
  ['socks', 'My socks are in the box.'],
  ['bird', 'A little bird sat on my hand.'],
  ['coat', 'Put your coat on the hook.'],
  ['fish', 'One red fish swam away.'],
  ['milk', 'Do you want some milk?'],
  ['bear', 'Where is my teddy bear?'],
];

export function buildLiteracyMockBeginnerWritingV12(base, normalize) {
  const existing = new Set(base.flatMap(q => (q.choices || []).map(c => c.label?.toLowerCase())).filter(Boolean));
  const prompt = 'Which sentence uses capital letters correctly?';
  const path = getLedaInstructionAudioPath(prompt);
  if (!path) throw Error('V12 capitalization needs its existing exact instruction recording.');
  return SENTENCES.filter(([, sentence]) => !existing.has(sentence.toLowerCase())).map(([key, sentence]) => {
    const lower = sentence.toLowerCase(), pieces = lower.split(' ');
    pieces[pieces.length - 1] = pieces.at(-1)[0].toUpperCase() + pieces.at(-1).slice(1);
    const labels = [sentence, lower, pieces.join(' '), sentence.toUpperCase()];
    const id = `mock.v12.beginner-writing.${key}`;
    const source = {
      id, skillId: 'capitalization', domainId: 'writing', level: 2, format: 'choice', answerMode: 'exact',
      prompt, passage: '', targetWord: '', renderTargetText: false, hideWrittenLabels: false,
      choices: labels.map((label, index) => ({ id: `c${index}`, label })), answer: 'c0',
      modality: 'recognition', evidenceModality: 'text', constructClaim: 'sentence_capital',
      stimulusKey: `sentence-capital:${lower}`, exposureFamilyId: `sentence-capital:${lower}`,
      requiredAudioCues: [{ role: 'instruction', text: prompt, path, required: true }],
      sourceProvenance: { kind: 'original_literacy_guide_v12_beginner_writing', file: LITERACY_MOCK_BEGINNER_WRITING_V12_SOURCE, sourceId: id },
      mediaDecision: { role: 'text-only', paths: [], constructReview: 'approved', answerNeutral: 'approved', reason: 'Printed case is the evidence. The choices have identical wording and punctuation; speaking them or adding an object picture would not establish capitalization.' },
      distractorRationales: {
        c1: 'Leaves the sentence start lowercase.',
        c2: 'Capitalizes an ordinary word inside the sentence instead of its first letter.',
        c3: 'Uses capital letters throughout rather than ordinary sentence case.',
      },
      taskDemand: { reviewed: true, operation: 'capitalize_sentence',
        features: { silentPrintedResponses: true, responseCount: 4, sameWording: true },
        proof: { sentence, retained: sentence, rejected: labels.slice(1) } },
      explanation: 'Start the sentence with one capital letter. These other words use small letters.',
    };
    const item = { ...normalize(source), routeReservationArea: 'writing', foundationBand: 1,
      adaptiveAreaBand: 1, adaptiveMixedEligible: true };
    return { ...item, itemSnapshot: { ...item } };
  });
}
