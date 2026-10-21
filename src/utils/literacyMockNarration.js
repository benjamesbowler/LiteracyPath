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

// Class questions must stand alone when their recorded target is teacher-read.
// Learner prompts and the versioned item/recording contract stay unchanged.
export function teacherMockQuestionPrompt(item) {
  const target=item.requiredAudioCues.find(cue=>cue.role==='target_word')?.text?.trim();
  if (!target) return item.prompt;
  if (/^Which word has the same (starting|last|middle vowel) sound\?$/.test(item.prompt))
    return item.prompt.replace(/\?$/,` as ${target}?`);
  if (item.prompt==='Which word rhymes with the word you hear?') return `Which word rhymes with ${target}?`;
  return item.prompt;
}

export function teacherMockNarrationCues(item,choices) {
  const prompt=teacherMockQuestionPrompt(item);
  const cues=literacyMockNarrationCues(item,choices);
  return prompt===item.prompt ? cues : cues.filter(cue=>cue.role!=='target_word')
    .map(cue=>cue.role==='instruction' ? {...cue,text:prompt} : cue);
}
