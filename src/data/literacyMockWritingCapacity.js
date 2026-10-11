import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { WRITING_PURPOSE_CAPACITY } from './literacyMockWritingPurposeCapacity.js';
import { WRITING_CONVENTIONS_CAPACITY } from './literacyMockWritingConventionsCapacity.js';
import { WRITING_ORGANIZATION_CAPACITY } from './literacyMockWritingOrganizationCapacity.js';
import { WRITING_REVISION_ORAL_CAPACITY } from './literacyMockWritingRevisionOralCapacity.js';
import { WRITING_REVISION_READING_CAPACITY } from './literacyMockWritingRevisionReadingCapacity.js';

export function buildLiteracyMockWritingCapacityItems(bank) {
  const sources = [
    [WRITING_PURPOSE_CAPACITY, 'src/data/literacyMockWritingPurposeCapacity.js'],
    [WRITING_CONVENTIONS_CAPACITY, 'src/data/literacyMockWritingConventionsCapacity.js'],
    [WRITING_ORGANIZATION_CAPACITY, 'src/data/literacyMockWritingOrganizationCapacity.js'],
    [WRITING_REVISION_ORAL_CAPACITY, 'src/data/literacyMockWritingRevisionOralCapacity.js'],
    [WRITING_REVISION_READING_CAPACITY, 'src/data/literacyMockWritingRevisionReadingCapacity.js'],
  ];
  return sources.flatMap(([rows, sourceFile]) => rows.map(row => ({ ...row, sourceFile }))).map(row => {
    const template = bank.find(item => item.id === row.templateId);
    if (!template) throw new Error(`Missing writing capacity template ${row.templateId}`);
    const id = `mock.capacity.writing.${row.id}`;
    const prompt = row.prompt || template.prompt;
    const passage = row.passage || '';
    const choices = row.labels.map((label, index) => ({ id: `c${index}`, label, ...(template.format === 'select_text' ? { tokenIndex: index } : {}) }));
    const requiredAudioCues = [{ role: 'instruction', text: prompt, path: getLedaInstructionAudioPath(prompt) }];
    if (template.modality !== 'reading' && template.requiredAudioCues.some(cue => cue.role === 'passage') && passage) {
      const text = passage.replace(/_{2,}/g, '…');
      requiredAudioCues.push({ role: 'passage', text, path: getLedaInstructionAudioPath(text) });
    }
    if (template.requiredAudioCues.some(cue => cue.role === 'choice')) requiredAudioCues.push(...choices.map(choice => {
      const recording = row.choiceAudioOverrides?.[choice.label];
      return {
        role: 'choice', choiceId: choice.id, value: choice.label, text: choice.label,
        path: recording?.path || getLedaWordAudioPath(choice.label) || getLedaInstructionAudioPath(choice.label),
        ...(recording ? { recordingProvenance: recording } : {}),
      };
    }));
    return { ...template, id, sourceItemId: id, canonicalItemId: id, sourceFormat: template.format,
      prompt, passage, choices, answer: row.ordered ? choices.map(choice => choice.id) : `c${row.answerIndex ?? 0}`, targetWord: '', image: '', imageAlt: '',
      ...(row.ordered ? { responseLength: choices.length, sequenceLength: choices.length } : {}),
      requiredAudioCues, stimulusKey: passage.toLowerCase() || `response-evidence:${JSON.stringify((row.ordered ? row.labels : [row.labels[row.answerIndex ?? 0]]).map(value => value.toLowerCase()))}`,
      canonicalPassageId: undefined, passageIsInstruction: false, exposureFamilyId: `writing-capacity:${row.id}`,
      explanation: row.explanation, difficultyEvidence: row.demand || template.difficultyEvidence,
      distractorRationales: row.ordered ? {} : Object.fromEntries(choices.filter((_,index) => index !== (row.answerIndex ?? 0)).map((choice,index) => [choice.id, template.format === 'select_text' ? 'This word already uses the appropriate capitalization in this sentence.' : row.foilReasons?.[index] || `This alternative does not meet the stated task. ${row.explanation}`])),
      sourceProvenance: { kind: 'original_mock_capacity', file: row.sourceFile, sourceId: row.id },
      mediaDecision: { role: 'text-only', paths: [], constructReview: 'approved', answerNeutral: 'approved', reason: 'The authored situation supplies the writing evidence. Decorative pictures would not help answer this task.' },
    };
  });
}
