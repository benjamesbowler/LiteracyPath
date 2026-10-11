import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { comprehensionCapacityStories } from './literacyMockComprehensionCapacityStories.js';
import { comprehensionCapacityMainIdeas } from './literacyMockComprehensionCapacityMainIdeas.js';
import { comprehensionCapacityCauses } from './literacyMockComprehensionCapacityCauses.js';
import { comprehensionCapacityInference } from './literacyMockComprehensionCapacityInference.js';
import { comprehensionCapacityThemes } from './literacyMockComprehensionCapacityThemes.js';
import { comprehensionCapacitySequence } from './literacyMockComprehensionCapacitySequence.js';
import { readingCapacityNavigation } from './literacyMockReadingCapacityNavigation.js';
import { readingCapacityEvidence } from './literacyMockReadingCapacityEvidence.js';
import { readingCapacityTextPurpose } from './literacyMockReadingCapacityTextPurpose.js';
import { readingCapacityVoices } from './literacyMockReadingCapacityVoices.js';
import { readingCapacityImagery } from './literacyMockReadingCapacityImagery.js';
import { readingCapacityForms } from './literacyMockReadingCapacityForms.js';
import { readingCapacityMultipleEvidence } from './literacyMockReadingCapacityMultipleEvidence.js';

// These are complete authored evidence units. The listening view shares the
// story's exposure family with its reading view; it is never a fresh retest.
export function buildLiteracyMockComprehensionCapacityItems(bank) {
  return [...comprehensionCapacityStories, ...comprehensionCapacityMainIdeas, ...comprehensionCapacityCauses, ...comprehensionCapacityInference,
    ...comprehensionCapacityThemes, ...comprehensionCapacitySequence, ...readingCapacityNavigation, ...readingCapacityEvidence,
    ...readingCapacityTextPurpose, ...readingCapacityVoices, ...readingCapacityImagery, ...readingCapacityForms,
    ...readingCapacityMultipleEvidence].flatMap(row => {
    const source = bank.find(item => item.id === row.templateId);
    if (!source) throw new Error(`Missing capacity template: ${row.templateId}`);
    const templates = [source];
    if (row.paired) {
      const listening = bank.find(item => item.skillId === `listen_${source.skillId}`
        && item.constructClaim === `listening_${source.constructClaim}` && item.level === source.level
        && item.modality === 'listening');
      if (!listening) throw new Error(`Missing listening capacity template: ${row.templateId}`);
      templates.push(listening);
    }
    return templates.map(template => {
      const id = `mock.capacity.${template.skillId}.${row.id}`;
      const choices = row.labels.map((label,index) => ({id:`c${index}`,label}));
      const prompt = row.prompt || source.prompt;
      const cues = [{role:'instruction',text:prompt,path:getLedaInstructionAudioPath(prompt)}];
      if (template.modality === 'listening') {
        cues.unshift({role:'passage',text:row.passage,path:getLedaInstructionAudioPath(row.passage)});
        cues.push(...choices.map(choice => {
          const recording = row.choiceAudioOverrides?.[choice.label];
          return {role:'choice',choiceId:choice.id,value:choice.label,text:choice.label,
            path:recording?.path || getLedaWordAudioPath(choice.label)||getLedaInstructionAudioPath(choice.label),
            ...(recording ? {recordingProvenance:recording} : {})};
        }));
      }
      return {...template,id,sourceItemId:id,canonicalItemId:`mock.capacity.${source.skillId}.${row.id}`,
        prompt,passage:row.passage,choices,answer:row.answerIndexes ? row.answerIndexes.map(index=>`c${index}`) : 'c0',
        targetWord:'',image:'',imageAlt:'',textFeature:row.textFeature,requiredAudioCues:cues,
        stimulusKey:row.passage.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),
        exposureFamilyId:`mock-capacity:${source.skillId}:${row.id}`,tutorialOnly:false,
        explanation:row.explanation,difficultyEvidence:row.demand,
        distractorRationales:row.distractorRationales || Object.fromEntries(row.foilReasons.map((reason,index)=>[`c${index+1}`,reason])),
        sourceProvenance:{kind:'original_mock_capacity',file:row.sourceFile || 'src/data/literacyMockComprehensionCapacityStories.js',
          sourceId:row.id,taskTemplate:row.templateId},
        mediaDecision:{role:'text-only',paths:[],constructReview:'approved',answerNeutral:'approved',
          reason:'The complete original text supplies the evidence; reading remains silent and listening uses exact separate recordings.'}};
    });
  });
}
