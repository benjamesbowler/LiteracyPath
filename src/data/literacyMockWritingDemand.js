import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';

/** Keep choosing a supplied case form separate from locating a missing capital. */
const sequenceCorrections = {
  'mock.depth.writing-sequence-1': {
    passage: 'These jobs are mixed up: seal the envelope, put the letter inside, and post the sealed envelope. The letter must be inside before you seal the envelope.',
    labels: ['Put the letter inside the envelope.', 'Seal the envelope closed.', 'Post the sealed envelope.'],
    explanation: 'Putting the letter inside must precede sealing; the sealed envelope can then be posted.',
  },
  'mock.depth.writing-sequence-2': {
    passage: 'These jobs are mixed up: paint a picture, cover the table, and lay out the paper. The cover must lie under the paper to protect the table from paint.',
    labels: ['Cover the table to protect it.', 'Lay the paper on the table.', 'Paint the picture on the paper.'],
    explanation: 'The protective cover must go down before the paper, and painting needs the paper in place.',
  },
};
const relevanceCorrections = {
  'literacy.writing_organization.remove-detail': {
    passage: 'This paragraph explains how pond animals use plants for shelter. Tadpoles hide among the weeds. The pond path was built last spring. Dragonflies rest among the reeds.',
    labels: ['The pond path was built last spring.', 'Tadpoles hide among the weeds.', 'Dragonflies rest among the reeds.'],
    explanation: 'The path is related to the pond, but its construction date does not explain animals using plants for shelter.',
  },
  'literacy.writing_organization.irrelevant-recipe': {
    passage: 'These sentences explain how to make dough. Mix flour and water. The flour is kept in a blue cupboard. Add a small pinch of salt. Knead the dough until it is smooth.',
    labels: ['The flour is kept in a blue cupboard.', 'Add a small pinch of salt.', 'Knead the dough until it is smooth.'],
    explanation: 'The storage detail concerns an ingredient but is not a step in making the dough.',
  },
};
export function correctLiteracyMockWritingDemand(item) {
  if (['mock.depth.revision-detail-0', 'mock.depth.revision-detail-2'].includes(item.id)) {
    const prompt = 'Which sentence identifies the intended thing accurately?';
    return { ...item, prompt, requiredAudioCues: item.requiredAudioCues.map(cue => cue.role === 'instruction'
      ? { ...cue, text: prompt, path: getLedaInstructionAudioPath(prompt) } : cue) };
  }
  const sequence = sequenceCorrections[item.id];
  if (sequence) {
    const choices = sequence.labels.map((label, index) => ({ id: `c${index}`, label }));
    return { ...item, passage: sequence.passage, choices, answer: 'c0', canonicalPassageId: undefined,
      stimulusKey: sequence.passage.toLowerCase(), explanation: sequence.explanation,
      difficultyEvidence: 'Infer the necessary order from a prerequisite when the actions are supplied out of order.',
      requiredAudioCues: [
        { role: 'instruction', text: item.prompt, path: getLedaInstructionAudioPath(item.prompt) },
        { role: 'passage', text: sequence.passage, path: getLedaInstructionAudioPath(sequence.passage) },
        ...choices.map(choice => ({ role: 'choice', choiceId: choice.id, value: choice.label, text: choice.label,
          path: getLedaWordAudioPath(choice.label) || getLedaInstructionAudioPath(choice.label) })),
      ],
      distractorRationales: { c1: 'This action needs the first step completed already.', c2: 'This final action needs the preceding preparation completed.' },
    };
  }
  const edited = relevanceCorrections[item.id];
  if (edited) return { ...item, format: 'choice', constructClaim: item.constructClaim || item.itemKey, answerMode: 'exact', passage: edited.passage, stimulusKey: edited.passage.toLowerCase(),
    choices: edited.labels.map((label, index) => ({ id: `c${index}`, label })), answer: 'c0',
    explanation: edited.explanation,
    distractorRationales: { c1: 'This detail supports the specific topic announced by the opening sentence.', c2: 'This detail supports the specific topic announced by the opening sentence.' },
    difficultyEvidence: 'Distinguish a related background detail from evidence that serves the paragraph’s specific purpose.',
  };
  if (item.skillId !== 'capitalization') return item;
  const claim = item.constructClaim || item.itemKey;
  const locate = item.format === 'select_text' || item.prompt === 'Which word needs a capital letter?';
  const form = {
    proper_name: 'supply_proper_name_capital_form',
    days: 'supply_weekday_capital_form',
    places: 'supply_place_name_capital_form',
  }[claim];
  if (form && !locate) return { ...item, constructClaim: form, level: 1, demandCeiling: 1,
    ceilingReason: 'This task chooses the capitalized form of an explicitly identified name. A longer surrounding sentence does not make this fixed case operation harder.',
    ceilingNextTask: 'Check finding an unmarked error or deciding which use of a word is a name in a separately labelled editing task.',
    difficultyEvidence: 'Recognition of the conventional case form for the explicitly named target; no additional demand is inferred from sentence length.' };
  if (locate && claim === 'places') return { ...item, constructClaim: 'locate_place_name_capital' };
  return item;
}
