import authored from '../content/literacy-reference/questions.json' with { type: 'json' };
import source from '../content/literacy-reference/source-manifest.json' with { type: 'json' };
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { LITERACY_CORE_SKILLS } from '../policy/literacyPracticePolicy.js';
import { LITERACY_EXTENSION_SKILLS } from './literacyPracticeExtensions.js';

export const LITERACY_REFERENCE_VERSION = 'classroom-reference-2026-10-10.1';
const artwork = Object.fromEntries(source.assets.map(asset => [asset.id, asset.path]));
const art = value => {
  const image = String(value).startsWith('/') ? value : artwork[value];
  if (!image) throw new Error(`Reference picture is not in the source manifest: ${value}`);
  return image;
};
const descriptors = [...LITERACY_CORE_SKILLS, ...LITERACY_EXTENSION_SKILLS];

// This is public MAP practice stock. The hosted independent mock has a frozen
// catalogue of its own; neither its content version nor its data is changed.
export function loadLiteracyReferenceBank() {
  return authored.map(row => {
    const descriptor = descriptors.find(skill => skill.id === row.skillId);
    if (!descriptor) throw new Error(`Reference question has an unknown skill: ${row.id}`);
    const build = row.format === 'build_word';
    const multi = row.format === 'multi_select';
    const passage = row.stimulus || '';
    const passageAudioRole = row.stimulusMode === 'word' ? 'word' : 'passage';
    const passageAudioPath = passageAudioRole === 'word' ? getLedaWordAudioPath(passage) : getLedaInstructionAudioPath(passage);
    const reading = descriptor.domainId === 'reading' || (row.skillId === 'context_clues' && passage.length > 100);
    const imageCards = row.cards ? row.options.map((value, i) => ({
      id: `card-${i}`, value, word: value, label: value, image: art(row.cards[value]),
      alt: row.hideWrittenLabels && row.id === 'train-tunnel' ? `Train and mountain, view ${i + 1}` : value,
      ...(row.oralChoices ? { audio: getLedaWordAudioPath(value) } : {}),
    })) : [];
    const imagePath = row.image ? art(row.image) : '';
    const paths = [...new Set([imagePath, ...imageCards.map(card => card.image)].filter(Boolean))];
    const cues = [{ role: 'instruction', text: row.prompt, path: getLedaInstructionAudioPath(row.prompt), required: true },
      ...(row.targetWord ? [{ role: 'target_word', text: row.targetWord, path: getLedaWordAudioPath(row.targetWord), required: true }] : []),
      ...(row.narrateStimulus ? [{ role: passageAudioRole, text: passage, path: passageAudioPath, required: true }] : []),
      ...(row.oralChoices ? row.options.map(value => ({ role: 'choice', text: value, value, path: getLedaWordAudioPath(value), required: true })) : []),
    ];
    const mediaDecision = { role: imageCards.length ? 'answer-cards' : imagePath ? (reading ? 'neutral-support' : 'target-or-scene') : 'text-only',
      paths, construct: row.family, constructReview: 'approved',
      answerNeutral: paths.length ? 'approved: complete comparable evidence; no scoring-key highlights' : 'not-applicable: printed or spoken evidence',
      reason: imageCards.length ? 'Every choice has the exact authored object or scene; the full set is required evidence.'
        : imagePath ? 'The supplied illustration supports the complete stimulus; all printed passage evidence remains available.'
          : 'The complete printed context or exact spoken target measures this construct; decoration would add no evidence.',
    };
    const letterTiles = build ? [...'abcdefghijklmnopqrstuvwxyz', ...[...row.targetWord].filter((letter, i, all) => all.indexOf(letter) !== i)] : [];
    return {
      id: `literacy.${row.skillId}.reference-${row.id}`, source: LITERACY_REFERENCE_VERSION, practiceOnly: true,
      skillId: row.skillId, assessmentSkillId: row.skillId, skill: descriptor.label, skillName: descriptor.label,
      literacyDomainId: descriptor.domainId, literacyModality: reading ? 'reading' : 'recognition',
      level: row.level, phase: 1, practiceDemand: row.demand, itemKey: row.family, evidenceUnit: row.family, constructClaim: row.family,
      formatType: build ? 'MAP_WORD_BUILD' : multi ? 'MAP_MULTI_SELECT' : 'LITERACY_REFERENCE_CHOICE',
      questionType: build ? 'map_word_build' : multi ? 'map_multi_select' : imageCards.length ? 'ixl_template' : 'choice',
      prompt: row.prompt, question: row.prompt, spokenPrompt: row.prompt,
      passage, displayPassageDuringResponse: true, ...(passage ? { passageAudioPath, passageAudioRole, allowPassageAudio: true } : {}),
      choices: row.options, answer: row.answer, correctAnswer: row.answer,
      ...(multi ? { correctAnswers: row.answer } : {}),
      answerOptions: row.options.map(value => ({ value, label: value, ...(imageCards.find(card => card.value === value) || {}) })),
      imageCards, ...(imagePath ? { imagePath, imageAlt: row.imageAlt, targetImage: imagePath } : {}),
      ...(row.targetWord ? { targetWord: row.targetWord, audioText: row.targetWord, audioPath: getLedaWordAudioPath(row.targetWord) } : {}),
      ...(build ? { letterTiles, blankSlots: row.targetWord.length } : {}),
      explanation: row.explanation, rationale: row.explanation,
      distractorRationales: row.distractorRationales,
      sourceProvenance: { kind: row.origin, file: 'src/content/literacy-reference/questions.json', sourceId: row.id,
        sourceSha256: source.sourceSha256, sourceSlides: row.sourceSlide ? [row.sourceSlide] : row.referenceSlides,
        adaptation: row.adaptation || 'Child-readable wording and complete literal answer set; supplied concept retained.' },
      assessmentMediaDecision: mediaDecision, mediaDecision,
      evidenceModality: row.oralChoices ? 'audio' : build ? 'audio+text' : paths.length ? 'image+text' : 'text',
      v3AuthoredMedia: { target: Boolean(imagePath), cards: Boolean(imageCards.length) },
      hideWrittenLabels: Boolean(row.hideWrittenLabels), suppressStimulusAudio: !row.targetWord,
      suppressChoiceAudio: !row.oralChoices, allowChoiceAudio: Boolean(row.oralChoices),
      instructionAudioText: row.prompt, instructionAudioPath: cues[0].path,
      ...(row.oralChoices ? { choiceAudioPaths: Object.fromEntries(cues.filter(cue => cue.role === 'choice').map(cue => [cue.value, cue.path])) } : {}),
      audioRequirements: cues, literacyAudioReady: cues.every(cue => Boolean(cue.path)) && (!passage || Boolean(passageAudioPath)),
    };
  });
}

export function listLiteracyReferenceAudioGaps() {
  const cues = loadLiteracyReferenceBank().flatMap(item => [...item.audioRequirements,
    ...(item.passage ? [{ role: item.passageAudioRole === 'word' ? 'target_word' : 'passage', text: item.passage, path: item.passageAudioPath }] : []),
  ]);
  return [...new Map(cues.filter(cue => !cue.path).map(cue => [`${cue.role}:${cue.text}`, cue])).values()];
}
