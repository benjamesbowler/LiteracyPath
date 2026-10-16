import { getLedaInstructionAudioPath } from './ledaProductionAudio.js';

/** Mechanics practice uses neutral glyphs so a worked example cannot expose
 * letters or lexical targets reserved for the scored sitting. */
export function buildLiteracyMockTutorialV8() {
  const prompt = 'Match each shape to the same shape.';
  return {
    id: 'mock.v8.tutorial.match-shapes',
    skillId: 'print_concepts', domainId: 'print', level: 1,
    tutorialOnly: true, format: 'match', answerMode: 'sequence',
    modality: 'recognition', evidenceModality: 'text',
    prompt, passage: '', targetWord: '',
    matchTargets: [
      { id: 'm0', label: '●' },
      { id: 'm1', label: '▲' },
      { id: 'm2', label: '■' },
    ],
    choices: [
      { id: 'c0', label: '■' },
      { id: 'c1', label: '●' },
      { id: 'c2', label: '▲' },
    ],
    answer: ['c1', 'c2', 'c0'], sequenceLength: 3,
    constructClaim: 'mechanics_same_shape_match',
    stimulusKey: 'tutorial-match:●|▲|■',
    exposureFamilyId: 'mechanics-tutorial:match-shapes',
    requiredAudioCues: [{
      role: 'instruction', text: prompt,
      path: getLedaInstructionAudioPath(prompt) || null, required: true,
    }],
    explanation: 'Each shape matches the identical shape.',
    sourceProvenance: {
      kind: 'original_literacy_guide',
      file: 'src/data/literacyMockTutorialV8.js',
      sourceId: 'mock.v8.tutorial.match-shapes',
    },
    mediaDecision: {
      role: 'visual-glyphs', paths: [], constructReview: 'approved',
      answerNeutral: 'approved',
      reason: 'The identical geometric glyphs carry mechanics evidence; no lexical stimulus, named shape recording or picture asset is required.',
    },
  };
}
