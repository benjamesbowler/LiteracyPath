import { loadAssessmentSkillBank } from './loadAssessmentSkillBank.js';
import { allowsAssessmentChoiceAudio, getAssessmentStimulusAudioText } from '../utils/assessmentAudioPolicy.js';
import { getPreferredPhonemeAudioPath } from './phonemeAudioBank.js';
import { skillTree } from '../skillTree.js';
import { LITERACY_CORE_SKILLS, LITERACY_LISTENING_SKILLS } from '../policy/literacyPracticePolicy.js';
import { getLedaInstructionAudioPath, getLedaWordAudioPath, getLedaProductionAudioPath } from './ledaProductionAudio.js';
import { LITERACY_EXTENSION_SKILLS, loadLiteracyPracticeExtensions } from './literacyPracticeExtensions.js';

export const LITERACY_PRACTICE_SKILLS = Object.freeze([...LITERACY_CORE_SKILLS, ...LITERACY_EXTENSION_SKILLS]);
let pending;
export async function loadLiteracyPracticeBank() {
  if (!pending) pending = (async () => {
    const groups = await Promise.all(skillTree.map(async skill => {
      const descriptor = LITERACY_CORE_SKILLS.find(item => item.id === skill.id);
      const source = await loadAssessmentSkillBank(skill.id);
      const reading = descriptor.domainId === 'reading';
      const base = source.filter(item => !item.retentionOnly).map(item => ({ ...item,
        literacyDomainId: descriptor.domainId, literacyModality: reading ? 'reading' : 'recognition',
        ...(reading ? { allowChoiceAudio: false, suppressChoiceAudio: true } : {}) }));
      if (!LITERACY_LISTENING_SKILLS.includes(skill.id)) return base;
      const listening = source.filter(item => !item.retentionOnly && item.passage && getLedaInstructionAudioPath(item.passage)).map(item => ({ ...item,
        id: `listen:${item.id}`, sourceItemId: item.id, skillId: `listen_${skill.id}`,
        skillName: `Listening: ${skill.label}`, literacyDomainId: 'listening', literacyModality: 'listening',
        displayPassageDuringResponse: false, passageAudioPath: getLedaInstructionAudioPath(item.passage),
        evidenceModality: 'audio', constructClaim: `listening_${item.constructClaim || item.itemKey || skill.id}` }));
      return [...base, ...listening];
    }));
    const items = [...groups.flat(), ...await loadLiteracyPracticeExtensions()];
    const ids = new Set();
    for (const item of items) {
      if (!item.id || ids.has(item.id)) throw new Error('Practice question identities need repair.');
      ids.add(item.id);
    }
    for (const skill of LITERACY_PRACTICE_SKILLS) {
      if (![1, 2].every(level => items.some(item => item.skillId === skill.id && Number(item.level) === level))) throw new Error(`${skill.label} needs both starting and extension questions.`);
    }
    return items;
  })().catch(error => { pending = null; throw error; });
  return pending;
}
export function literacyPracticeExplanation(question) {
  if (question.explanation) return question.explanation;
  const answer = question.answer ?? question.correctAnswer;
  const value = Array.isArray(answer) ? answer.join(', ') : answer;
  const skillId = question.skillId?.replace(/^listen_/, '');
  const tip = {
    initial_sounds: 'Say the word slowly. Match the sound you hear at the beginning.',
    final_sounds: 'Say the whole word. Listen to its very last sound.',
    rhyming: 'Rhyming words have the same ending sound, even when their first sounds differ.',
    main_idea: 'The main idea covers the whole passage. A true detail may describe only one part.',
    key_details: 'Go back to the part of the passage that answers this question.',
    inference: 'Put the clues together. The answer must fit the clues in the text.',
    cause_effect: 'Find what happened and the reason it happened.',
    sequencing: 'Use the order of the events, from the beginning to the end.',
    theme: 'Think about what the character learns. The message can apply outside this story.',
    context_clues: 'Use the words around the unfamiliar word to work out its meaning.',
    nouns: 'A naming word names a person, place, animal, or thing.',
    verbs: 'An action word tells what someone or something does.',
    adjectives: 'A describing word gives information about a person, place, or thing.',
    plurals: 'Check whether the sentence means one or more than one.',
    prepositions: 'Look at the exact position shown in the picture.',
    prefix_suffix: 'Think about the meaning of the word part and the whole sentence.',
    homophones: 'Words can sound alike but have different meanings. Use the sentence to choose.',
    antonyms_synonyms: 'Compare what the words mean in this question.'
  }[skillId] || LITERACY_PRACTICE_SKILLS.find(skill => skill.id === question.skillId)?.suggestion || 'Look at the complete example, then try a fresh question.';
  return `The answer is “${value}”. ${tip}`;
}

export function literacyPracticeAudioCues(question) {
  if (question.audioRequirements) {
    const fixed = question.audioRequirements.filter(cue => cue.role !== 'choice');
    const choices = (question.choices || []).map(value => typeof value === 'object' ? value.value ?? value.label : value);
    return [...fixed, ...choices.flatMap(value => question.audioRequirements.filter(cue => cue.role === 'choice' && (cue.value || cue.text) === value))];
  }
  const cues = [];
  if (question.literacyModality === 'listening' && question.passage) cues.push({ role: 'passage', text: question.passage, path: question.passageAudioPath });
  const instruction = question.spokenPrompt || question.prompt;
  cues.push({ role: 'instruction', text: instruction, path: question.instructionAudioPath || getLedaInstructionAudioPath(instruction) });
  const target = getAssessmentStimulusAudioText(question);
  if (target) cues.push({ role: 'target_word', text: target, path: question.audioPath || getLedaWordAudioPath(target) });
  if (allowsAssessmentChoiceAudio(question)) {
    for (const value of question.choices || []) {
      const text = typeof value === 'string' ? value : value.label || value.text || value.word;
      cues.push({ role: 'choice', text, value: typeof value === 'object' ? value.value ?? text : value, path: getLedaWordAudioPath(text) || getLedaInstructionAudioPath(text) });
    }
  }
  return cues;
}

export function literacyPracticeTeachingCues(question) {
  const cues = [...(question.teachingAudioRequirements || []), ...literacyPracticeAudioCues(question).filter(cue => ['target_word', 'phoneme'].includes(cue.role))];
  const answers = question.correctAnswers || [question.answer ?? question.correctAnswer];
  for (const value of answers) {
    const label = typeof value === 'object' ? value.label || value.word || value.letter : String(value ?? '');
    const letterName = question.skillId === 'letter_knowledge' || (question.skillId === 'print_concepts' && ['first_letter', 'last_letter'].includes(question.itemKey));
    const spoken = ({ '1':'one', '2':'two', '3':'three', '4':'four' })[label] || label;
    const path = letterName ? getLedaProductionAudioPath(label, ['letter_name'])
      : /^[a-z]$/i.test(label) && ['phonics', 'sound_awareness'].includes(question.literacyDomainId) && question.skillId !== 'sound_manipulation'
        ? getPreferredPhonemeAudioPath(label) : getLedaWordAudioPath(spoken) || getLedaInstructionAudioPath(spoken);
    if (path && !cues.some(cue => cue.path === path)) cues.push({ role: 'worked_model', text: spoken, path });
  }
  return cues;
}
