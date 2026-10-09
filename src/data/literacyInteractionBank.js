import { loadLiteracyMockItems } from './literacyMockItems.js';
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { LITERACY_CORE_SKILLS } from '../policy/literacyPracticePolicy.js';
import { LITERACY_EXTENSION_SKILLS } from './literacyPracticeExtensions.js';
import { INTERACTION_STORIES } from '../content/literacy-interactions/stories.js';
import artwork from '../content/literacy-interactions/artwork.json' with { type: 'json' };
export const LITERACY_INTERACTION_VERSION = 'literacy-interactions-2026-10-09.1';
const descriptors = [...LITERACY_CORE_SKILLS, ...LITERACY_EXTENSION_SKILLS];
const instruction = text => ({ role: 'instruction', text, path: getLedaInstructionAudioPath(text), required: true });
function adapt(row) {
  const descriptor = descriptors.find(skill => skill.id === row.skillId);
  const options = row.choices.map(choice => ({ ...choice, value: choice.id, alt: choice.imageAlt }));
  const cues = (row.requiredAudioCues || [instruction(row.prompt)]).map(cue => ({ ...cue, required: true }));
  const passage = row.passage || '';
  const passageAudioPath = passage ? getLedaInstructionAudioPath(passage) : '';
  const paths = [...new Set([row.image, ...options.map(option => option.image)].filter(Boolean))];
  const media = { ...row.mediaDecision, role: !paths.length ? 'text-only' : row.image ? 'construct-support' : 'answer-cards',
    paths, construct: row.constructClaim, constructReview: 'approved',
    answerNeutral: paths.length ? 'approved: complete comparable evidence without key marks' : 'not-applicable: printed evidence',
    reason: paths.length ? 'Reviewed illustrations show exactly the stated objects or actions. Every answer image is required.'
      : 'Printed tiles or selectable words carry the entire intended evidence; pictures would substitute for that construct.' };
  const answer = Array.isArray(row.answer) ? JSON.stringify(row.answer) : row.answer;
  return { id: 'literacy.' + row.skillId + '.interactive-' + row.id.replace(/^mock\./, ''), source: LITERACY_INTERACTION_VERSION,
    practiceOnly: true, skillId: row.skillId, assessmentSkillId: row.skillId, skill: descriptor.label, skillName: descriptor.label,
    literacyDomainId: descriptor.domainId, literacyModality: row.modality === 'listening' ? 'listening' : passage ? 'reading' : 'recognition',
    level: row.level, phase: 1, practiceDemand: row.demand ?? (row.skillId === 'letter_knowledge' ? row.level - 1
      : row.format === 'build_word' ? (row.skillId === 'digraphs' ? 2 : 1)
        : row.skillId === 'antonyms_synonyms' ? row.level : row.level === 2 ? 4 : 2),
    mapInteraction: row.format, questionType: 'map_interaction', formatType: 'MAP_INTERACTION',
    prompt: row.prompt, question: row.prompt, spokenPrompt: row.prompt, instructionAudioPath: cues.find(cue => cue.role === 'instruction')?.path,
    passage, displayPassageDuringResponse: row.format !== 'select_text',
    ...(passage ? { passageAudioPath, allowPassageAudio: true } : {}),
    answerOptions: options, choices: options.map(option => option.value), answer, correctAnswer: answer,
    mapSlots: row.sequenceLength || row.matchTargets?.length || (row.format === 'build_word' ? row.choices.length - 1 : 0),
    mapTargets: row.matchTargets, targetWord: row.targetWord || '',
    ...(['order', 'match'].includes(row.format) ? { parts: row.choices.map(choice => ({ label: choice.label })),
      targetLetters: row.skillId === 'letter_knowledge' ? row.matchTargets.map(target => target.label) : undefined } : {}),
    ...(row.targetWord ? { audioText: row.targetWord, audioPath: getLedaWordAudioPath(row.targetWord) } : {}),
    suppressStimulusAudio: !row.targetWord, suppressChoiceAudio: true, allowChoiceAudio: false,
    itemKey: row.constructClaim, evidenceUnit: row.constructClaim, constructClaim: row.constructClaim,
    explanation: row.explanation, distractorRationales: row.distractorRationales || {},
    assessmentMediaDecision: media, mediaDecision: media,
    imageCards: options.filter(option => option.image), imagePath: row.image || '', imageAlt: row.imageAlt || '',
    evidenceModality: paths.length ? 'image+text' : row.targetWord ? 'audio+text' : 'text',
    sourceProvenance: { ...row.sourceProvenance, kind: 'original_public_interaction', sourceId: row.id },
    audioRequirements: cues,
    literacyAudioReady: cues.every(cue => Boolean(cue.path)) && (!passage || Boolean(passageAudioPath)),
  };
}
export async function loadLiteracyInteractionBank() {
  // Adapt existing original authored tasks for PUBLIC practice only. The
  // hosted v1 bank and its choices, keys and administration stay unchanged.
  const native = (await loadLiteracyMockItems()).filter(row => ['order', 'match', 'select_text', 'build_word'].includes(row.format)).map(row => {
    const image = row.targetWord ? '/images/assessment/' + (['ship', 'duck'].includes(row.targetWord) ? 'digraphs/' : 'literacy-classroom/') + row.targetWord + '.webp' : '';
    return adapt({ ...row, image, tutorialOnly: false });
  });
  const pictured = [];
  for (const story of INTERACTION_STORIES) {
    const art = artwork.find(asset => asset.id === story.id);
    const choices = story.labels.map((label, i) => ({ id: 'p' + i, label, image: art.cards[i].path, imageAlt: label }));
    const provenance = { file: 'src/content/literacy-interactions/stories.js', assets: [art] };
    for (const level of [1, 2]) {
      const passage = level === 1 ? story.sentences.join(' ') : story.extension;
      for (const listening of [false, true]) pictured.push(adapt({
        id: 'pictures.' + story.id + '-' + level + (listening ? '-listen' : ''), skillId: listening ? 'listen_sequencing' : 'sequencing',
        format: 'order', prompt: 'Put the pictures in the same order as the story.', passage, choices,
        answer: ['p0', 'p1', 'p2'], sequenceLength: 3, level, demand: level === 1 ? 3 : 4, modality: listening ? 'listening' : 'reading',
        constructClaim: 'pictured_story_event_order', sourceProvenance: provenance,
        requiredAudioCues: [instruction('Put the pictures in the same order as the story.'),
          ...(listening ? [{ role: 'passage', text: passage, path: getLedaInstructionAudioPath(passage), required: true }] : [])],
        explanation: story.sentences.join(' '),
      }));
    }
    for (let i = 0; i < 3; i++) pictured.push(adapt({
      id: 'story-picture.' + story.id + '-' + i, skillId: 'key_details', format: 'picture_choice',
      prompt: 'Which picture matches the story?', passage: story.sentences[i], choices, answer: 'p' + i,
      level: 1, demand: 3, constructClaim: 'literal_story_picture_match', sourceProvenance: provenance,
      explanation: story.sentences[i], distractorRationales: Object.fromEntries(choices.filter(choice => choice.id !== 'p' + i).map(choice => [choice.id, 'This picture shows a different action from the printed story.'])),
    }));
  }
  return [...native, ...pictured];
}
export async function listLiteracyInteractionAudioGaps() {
  const cues = (await loadLiteracyInteractionBank()).flatMap(item => [...item.audioRequirements,
    ...(item.passage ? [{ role: 'passage', text: item.passage, path: item.passageAudioPath }] : [])]);
  return [...new Map(cues.filter(cue => !cue.path).map(cue => [cue.role + ':' + cue.text, cue])).values()];
}
