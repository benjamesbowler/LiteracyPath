import { MOCK_RUNTIME_INSTRUCTION_AUDIO } from '../data/generated/literacyMockRuntimeAudio.generated.js';
import { PROGRESS_CHECK_INSTRUCTIONS } from '../data/progressCheckInstructions.js';

// Recorded question, stimulus and shuffled answer narration share one sequence.
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

// Keep the reference word visible alongside the class question recording.
// Learner prompts and the versioned item/recording contract stay unchanged.
export function wholeClassMockQuestionPrompt(item) {
  const target=item.requiredAudioCues.find(cue=>cue.role==='target_word')?.text?.trim();
  if (!target) return item.prompt;
  if (/^Which word has the same (starting|last|middle vowel) sound\?$/.test(item.prompt))
    return item.prompt.replace(/\?$/,` as ${target}?`);
  if (item.prompt==='Which word rhymes with the word you hear?') return `Which word rhymes with ${target}?`;
  return item.prompt;
}
