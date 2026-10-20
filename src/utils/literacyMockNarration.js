import { MOCK_RUNTIME_INSTRUCTION_AUDIO } from '../data/generated/literacyMockRuntimeAudio.generated.js';
import { PROGRESS_CHECK_INSTRUCTIONS } from '../data/progressCheckInstructions.js';

// One sequence for recorded learner delivery and the teacher's read-aloud script.
// Only authored spoken cues belong here: silent printed choices stay silent.
export function literacyMockNarrationCues(item, choices) {
  const reading=item.modality==='reading' && item.passage && item.displayPassageDuringResponse;
  return [
    ...(reading ? [{role:'layout_instruction',text:PROGRESS_CHECK_INSTRUCTIONS.readPassage,path:MOCK_RUNTIME_INSTRUCTION_AUDIO.readPassage}] : []),
    ...item.requiredAudioCues.filter(cue=>cue.role!=='choice'),
    ...choices.flatMap((choice,index)=>item.requiredAudioCues
      .filter(cue=>cue.role==='choice' && (cue.choiceId===choice.id || (!cue.choiceId && cue.path===choice.audioPath)))
      .map(cue=>({...cue,choiceNumber:index+1})))
  ];
}
