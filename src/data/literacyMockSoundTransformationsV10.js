import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';

export const LITERACY_MOCK_SOUND_TRANSFORMATIONS_V10_SOURCE = 'src/data/literacyMockSoundTransformationsV10.js';
// Literal broad English phonemes, stress omitted; checked against the primary
// CMU dictionary (https://github.com/cmusphinx/cmudict). These are authored
// sound units, never a spelling-length or generated pronunciation heuristic.
export const LITERACY_MOCK_V10_TRANSFORM_WORD_PHONEMES = Object.freeze({
  bag: 'B AE G',
  ban: 'B AE N',
  bat: 'B AE T',
  bed: 'B EH D',
  bet: 'B EH T',
  bid: 'B IH D',
  bit: 'B IH T',
  boat: 'B OW T',
  bun: 'B AH N',
  clam: 'K L AE M',
  clamp: 'K L AE M P',
  clap: 'K L AE P',
  cliff: 'K L IH F',
  clip: 'K L IH P',
  clock: 'K L AA K',
  clot: 'K L AA T',
  cluck: 'K L AH K',
  duck: 'D AH K',
  fan: 'F AE N',
  fat: 'F AE T',
  fin: 'F IH N',
  fish: 'F IH SH',
  fit: 'F IH T',
  fun: 'F AH N',
  fuss: 'F AH S',
  hat: 'HH AE T',
  hen: 'HH EH N',
  hit: 'HH IH T',
  kite: 'K AY T',
  lad: 'L AE D',
  lamp: 'L AE M P',
  land: 'L AE N D',
  lap: 'L AE P',
  led: 'L EH D',
  leg: 'L EH G',
  lid: 'L IH D',
  limp: 'L IH M P',
  lip: 'L IH P',
  lock: 'L AA K',
  mail: 'M EY L',
  man: 'M AE N',
  map: 'M AE P',
  mat: 'M AE T',
  met: 'M EH T',
  mile: 'M AY L',
  mime: 'M AY M',
  mop: 'M AA P',
  mouse: 'M AW S',
  nag: 'N AE G',
  nap: 'N AE P',
  neck: 'N EH K',
  net: 'N EH T',
  nick: 'N IH K',
  nip: 'N IH P',
  pan: 'P AE N',
  pat: 'P AE T',
  peck: 'P EH K',
  pet: 'P EH T',
  pig: 'P IH G',
  pin: 'P IH N',
  pit: 'P IH T',
  pop: 'P AA P',
  pot: 'P AA T',
  rabbit: 'R AE B AH T',
  rack: 'R AE K',
  rag: 'R AE G',
  rain: 'R EY N',
  rake: 'R EY K',
  ram: 'R AE M',
  ran: 'R AE N',
  red: 'R EH D',
  rim: 'R IH M',
  rod: 'R AA D',
  rug: 'R AH G',
  run: 'R AH N',
  sap: 'S AE P',
  sat: 'S AE T',
  sell: 'S EH L',
  set: 'S EH T',
  sip: 'S IH P',
  sit: 'S IH T',
  slab: 'S L AE B',
  slap: 'S L AE P',
  sled: 'S L EH D',
  slip: 'S L IH P',
  smile: 'S M AY L',
  snap: 'S N AE P',
  sock: 'S AA K',
  span: 'S P AE N',
  spat: 'S P AE T',
  spin: 'S P IH N',
  spit: 'S P IH T',
  spot: 'S P AA T',
  stack: 'S T AE K',
  star: 'S T AA R',
  steer: 'S T IH R',
  step: 'S T EH P',
  stock: 'S T AA K',
  stop: 'S T AA P',
  sun: 'S AH N',
  table: 'T EY B AH L',
  tack: 'T AE K',
  tan: 'T AE N',
  tap: 'T AE P',
  tar: 'T AA R',
  tell: 'T EH L',
  ten: 'T EH N',
  tick: 'T IH K',
  tiger: 'T AY G ER',
  tin: 'T IH N',
  tip: 'T IH P',
  top: 'T AA P',
  tot: 'T AA T',
  track: 'T R AE K',
  train: 'T R EY N',
  tram: 'T R AE M',
  trap: 'T R AE P',
  trick: 'T R IH K',
  trim: 'T R IH M',
  trip: 'T R IH P',
  wag: 'W AE G',
  water: 'W AO T ER',
  wig: 'W IH G',
  win: 'W IH N',
  wren: 'R EH N',
});
const rows = [
  ["substitute_initial","pan","fish","fan","fat","fin"],
  ["substitute_initial","pig","water","wig","win","wag"],
  ["substitute_initial","hen","table","ten","tell","tin"],
  ["substitute_initial","map","sock","sap","sat","sip"],
  ["substitute_initial","bag","rabbit","rag","ram","rug"],
  ["substitute_initial","net","sun","set","sell","sit"],
  ["substitute_initial","bed","rabbit","red","wren","rod"],
  ["substitute_initial","tap","mouse","map","mat","mop"],
  ["substitute_initial","pin","table","tin","tip","ten"],
  ["substitute_initial","bun","fish","fun","fuss","fan"],
  ["substitute_final","map","boat","mat","hat","met"],
  ["substitute_final","bag","boat","bat","mat","bet"],
  ["substitute_final","pin","boat","pit","hit","pet"],
  ["substitute_final","bed","boat","bet","net","bit"],
  ["substitute_final","bag","sun","ban","pan","bun"],
  ["substitute_final","fan","boat","fat","mat","fit"],
  ["substitute_final","tap","sun","tan","man","tin"],
  ["substitute_final","net","duck","neck","peck","nick"],
  ["substitute_final","lip","bed","lid","bid","led"],
  ["substitute_final","ram","sun","ran","man","run"],
  ["delete_phoneme","clap","","lap","lad","lip"],
  ["delete_phoneme","slip","","lip","lid","lap"],
  ["delete_phoneme","smile","","mile","mime","mail"],
  ["delete_phoneme","train","","rain","rake","run"],
  ["delete_phoneme","stop","","top","tot","tip"],
  ["delete_phoneme","spot","","pot","pop","pit"],
  ["delete_phoneme","stack","","tack","tap","tick"],
  ["delete_phoneme","snap","","nap","nag","nip"],
  ["delete_phoneme","sled","","led","leg","lid"],
  ["delete_phoneme","clamp","","lamp","land","limp"],
  ["add_phoneme","top","sun","stop","stock","step"],
  ["add_phoneme","pin","sock","spin","spit","span"],
  ["add_phoneme","lip","kite","clip","cliff","clap"],
  ["add_phoneme","lock","kite","clock","clot","cluck"],
  ["add_phoneme","rack","tiger","track","trap","trick"],
  ["add_phoneme","pat","sun","spat","span","spit"],
  ["add_phoneme","tar","sun","star","stock","steer"],
  ["add_phoneme","lap","kite","clap","clam","clip"],
  ["add_phoneme","lap","sun","slap","slab","slip"],
  ["add_phoneme","rim","tiger","trim","trip","tram"],
];

export const LITERACY_MOCK_V10_SOUND_ROWS = Object.freeze(rows.map(([operation, sourceWord, anchorWord, correctWord, otherEdgeFoil, vowelFoil]) => Object.freeze({
  id: `mock.v10.sounds.transform.${operation}.${sourceWord}.${anchorWord || 'first'}`,
  operation, sourceWord, anchorWord, correctWord, otherEdgeFoil, vowelFoil,
})));
const phones = word => (LITERACY_MOCK_V10_TRANSFORM_WORD_PHONEMES[word] || '').split(' ').filter(Boolean);
const vowel = sounds => sounds.findIndex(sound => /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)$/.test(sound));
const spokenCue = item => (item.requiredAudioCues || []).find(c => c.role === 'instruction');
const answerWord = item => item.choices?.find(c => c.id === item.answer)?.label;
const sourceOf = item => spokenCue(item)?.text.match(/^Say ([a-z]+)\./)?.[1];
const anchorOf = item => spokenCue(item)?.text.match(/sound in ([a-z]+)/)?.[1] || '';

function instruction(row) {
  if (row.operation === 'delete_phoneme') return `Say ${row.sourceWord}. Take away its first sound. What word remains?`;
  if (row.operation === 'add_phoneme') return `Say ${row.sourceWord}. Add the first sound in ${row.anchorWord} at the beginning. What word do you make?`;
  const position = row.operation === 'substitute_initial' ? 'first' : 'last';
  return `Say ${row.sourceWord}. Change its ${position} sound to the ${position} sound in ${row.anchorWord}. What is the new word?`;
}

/** New immutable identities with literal source-retention contrasts. Matching
 * old source + operation + result keeps its existing encounter identity even
 * if a replacement-sound anchor or the foils have changed. */
export function buildLiteracyMockSoundTransformationsV10(base) {
  if (!Array.isArray(base) || !base.length) throw Error('V10 transformation authoring requires the frozen prior bank for semantic exposure identities.');
  const recordings = new Map();
  for (const item of base) for (const cue of item.requiredAudioCues || []) {
    if (cue.path && ['instruction', 'choice', 'target_word'].includes(cue.role)) recordings.set(`${cue.role === 'instruction' ? 'instruction' : 'word'}:${cue.text}`, cue.path);
  }
  const cue = (role, text, choiceId) => ({ role, text, required: true,
    path: role === 'instruction' ? getLedaInstructionAudioPath(text) || recordings.get(`instruction:${text}`) || null
      : getLedaWordAudioPath(text) || recordings.get(`word:${text}`) || null,
    ...(choiceId ? { choiceId, value: text } : {}),
  });
  return LITERACY_MOCK_V10_SOUND_ROWS.map(row => {
    const old = base.find(q => q.constructClaim === row.operation && sourceOf(q) === row.sourceWord && answerWord(q) === row.correctWord);
    const speech = old && anchorOf(old) === row.anchorWord ? spokenCue(old).text : instruction(row);
    const options = [row.correctWord, row.otherEdgeFoil, row.vowelFoil, row.sourceWord].map((label, index) => ({ id: `c${index}`, label }));
    const sourcePhonemes = phones(row.sourceWord), anchorPhonemes = phones(row.anchorWord), resultPhonemes = phones(row.correctWord);
    const operationIndex = row.operation === 'substitute_final' ? sourcePhonemes.length - 1 : 0;
    const removed = row.operation === 'add_phoneme' ? [] : [sourcePhonemes[operationIndex]];
    const inserted = row.operation === 'delete_phoneme' ? [] : [row.operation === 'substitute_final' ? anchorPhonemes.at(-1) : anchorPhonemes[0]];
    const novelFamily = `oral-operation:${row.operation}:${row.sourceWord}:${inserted.join('') || 'first'}`;
    const stimulusKey = old?.stimulusKey || novelFamily;
    return {
      id: row.id, sourceItemId: row.id, canonicalItemId: old?.canonicalItemId || old?.id || row.id,
      skillId: 'sound_manipulation', domainId: 'sound_awareness', level: 2, format: 'choice', answerMode: 'exact',
      prompt: 'Listen. Choose the new word.', sourceWord: row.sourceWord, anchorWord: row.anchorWord,
      correctWord: row.correctWord, targetWord: row.correctWord, choices: options, answer: 'c0',
      hideWrittenLabels: true, renderTargetText: false, displayPassageDuringResponse: false,
      modality: 'listening', evidenceModality: 'audio', constructClaim: row.operation,
      requiredAudioCues: [cue('instruction', speech), ...options.map(c => cue('choice', c.label, c.id))],
      stimulusKey, canonicalPassageId: old?.canonicalPassageId || old?.stimulusKey || novelFamily,
      exposureFamilyId: old?.exposureFamilyId || novelFamily,
      lexicalExposureWords: [...new Set([row.sourceWord, row.correctWord, row.anchorWord].filter(Boolean))],
      taskDemand: { reviewed: true, operation: 'manipulate_and_retain_phonemes',
        features: { requiresLetters: false, changedOptionsSamePhonemeCount: true, changedEdgeSharedByChangedOptions: true,
          unchangedSourceDiagnostic: true, fourthChoiceDiagnostic: 'unchanged_source',
          retainedVowelContrast: true, retainedOtherEdgeContrast: true, resultPhonemeCount: resultPhonemes.length },
        proof: { sourceWord: row.sourceWord, sourcePhonemes, anchorWord: row.anchorWord, anchorPhonemes,
          correctWord: row.correctWord, resultPhonemes, instructionText: speech,
          change: { operation: row.operation, index: operationIndex, removed, inserted },
          choiceWords: Object.fromEntries(options.map(c => [c.id, c.label])),
          choicePhonemes: Object.fromEntries(options.map(c => [c.id, phones(c.label)])),
          retainedVowelIndex: vowel(resultPhonemes), retainedOtherEdgeIndex: row.operation === 'substitute_final' ? 0 : resultPhonemes.length - 1,
          otherEdgeFoilId: 'c1', vowelFoilId: 'c2', unchangedSourceFoilId: 'c3', priorSemanticItemId: old?.id || null,
        } },
      sourceProvenance: { kind: 'original_literacy_guide_v10_sound_retention', file: LITERACY_MOCK_SOUND_TRANSFORMATIONS_V10_SOURCE,
        sourceId: row.id, priorSemanticItemId: old?.id || null },
      explanation: `Apply exactly one ${row.operation.replaceAll('_', ' ')} to ${row.sourceWord}, preserving its other sounds, to make ${row.correctWord}.`,
      distractorRationales: { c1: 'Keeps the compared vowel but changes another sound that the operation must retain.',
        c2: 'Keeps the compared outside sound but changes the vowel that the operation must retain.',
        c3: 'Keeps the original word unchanged. Its retained source pattern is correct, but the instructed phoneme operation has not been performed.' },
      mediaDecision: { role: 'audio-only', paths: [], constructReview: 'approved', answerNeutral: 'approved',
        reason: 'Only the exact spoken operation and replayable word choices provide evidence. Three changed alternatives share the changed edge and phoneme count; the fourth unchanged-source diagnostic prevents rhyme or retained-pattern matching alone. Both the operation and retained-unit contrasts are required. No answer word is spoken as a separate target cue.' },
    };
  });
}

/** Exact requests for the established Leda pipeline; this does not create audio. */
export function listLiteracyMockSoundTransformationsV10AudioGaps(base) {
  const gaps = new Map();
  for (const q of buildLiteracyMockSoundTransformationsV10(base)) for (const c of q.requiredAudioCues) if (!c.path) {
    const role = c.role === 'instruction' ? 'assessment_prompt' : 'isolated_word', key = `${role}:${c.text}`;
    const gap = gaps.get(key) || { role, text: c.text, itemIds: [] };
    gap.itemIds.push(q.id); gaps.set(key, gap);
  }
  return [...gaps.values()];
}
