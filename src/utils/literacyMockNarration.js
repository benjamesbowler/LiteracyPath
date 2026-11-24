import { MOCK_RUNTIME_INSTRUCTION_AUDIO } from '../data/generated/literacyMockRuntimeAudio.generated.js';
import { PROGRESS_CHECK_INSTRUCTIONS } from '../data/progressCheckInstructions.js';

// Recorded question, stimulus and shuffled answer narration share one sequence.
// Only authored spoken cues belong here: silent printed choices stay silent.
export function literacyMockLetterReference(item) {
  return item.skillId === 'letter_knowledge' && /^[A-Za-z]$/.test(item.passage || '');
}
export function literacyMockReadingInstructionPath(item) {
  return !literacyMockLetterReference(item) && item.modality === 'reading' && item.passage && item.displayPassageDuringResponse
    ? MOCK_RUNTIME_INSTRUCTION_AUDIO.readPassage : null;
}

export function literacyMockNarrationCues(item, choices, { includeLayoutInstruction = true } = {}) {
  const instruction = includeLayoutInstruction && literacyMockReadingInstructionPath(item);
  return [
    ...(instruction ? [{role:'layout_instruction',text:PROGRESS_CHECK_INSTRUCTIONS.readPassage,path:instruction}] : []),
    ...item.requiredAudioCues.filter(cue=>cue.role!=='choice'),
    ...choices.flatMap((choice,index)=>item.requiredAudioCues
      .filter(cue=>cue.role==='choice' && (cue.choiceId===choice.id || (!cue.choiceId && cue.path===choice.audioPath)))
      .map(cue=>({...cue,choiceNumber:index+1})))
  ];
}
