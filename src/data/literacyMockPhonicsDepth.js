import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { getPreferredPhonemeAudioPath } from './phonemeAudioBank.js';

const SOURCE_FILE = 'src/data/literacyMockPhonicsDepth.js';
const instruction = text => ({ role: 'instruction', text, path: getLedaInstructionAudioPath(text) });
const wordCue = text => ({ role: 'target_word', text, path: getLedaWordAudioPath(text) });
const choicesFor = labels => labels.map((label, index) => ({ id: `c${index}`, label }));
const choiceCues = choices => choices.map(choice => ({ role: 'choice', choiceId: choice.id,
  value: choice.label, text: choice.label, path: getLedaWordAudioPath(choice.label) }));
const ASSETS = Object.freeze({
  spring: '/images/assessment/blends/spring.webp',
  splash: '/images/assessment/blends/splash.webp',
  brush: '/images/assessment/objective-words/brush.webp',
  plane: '/images/assessment/objective-words/plane.webp',
  chick: '/images/assessment/digraphs/chick.webp',
  shell: '/images/assessment/digraphs/shell.webp',
});

const TEAM_SOUNDS = Object.freeze({ ai: 'long_a', ay: 'long_a', ee: 'long_e', ea: 'long_e',
  oa: 'long_o', igh: 'long_i', oo: 'moon', ow: 'long_o', ou: 'cloud', oi: 'coin', oy: 'coin', ew: 'moon', aw: 'saw' });
const teamSound = item => {
  if (/short e sound/.test(item.prompt)) return 'short_e';
  if (item.itemKey === 'ow' && (/as in cow/.test(item.prompt) || ['loud', 'frown'].includes(item.targetWord))) return 'cloud';
  return TEAM_SOUNDS[item.itemKey];
};

export function literacyMockVowelSpellingClaim(skill, pattern, sound = TEAM_SOUNDS[pattern]) {
  if (skill === 'vowel_teams') return `complete_vowel_team_spelling:${pattern}:${sound}`;
  if (skill === 'long_vowels') return `complete_split_vowel_spelling:${pattern}`;
  return `complete_r_controlled_spelling:${pattern}`;
}

// A grapheme names content, not an operation: identifying a sound in printed
// words and completing a dictated spelling must never form one adaptive task.
function vowelTaskClaim(item) {
  const pattern = item.itemKey;
  if (!pattern) return item.constructClaim;
  if (item.skillId === 'vowel_teams') {
    const sound = teamSound(item);
    if (item.formatType === 'LONG_VOWEL_TEAM_COMPLETE') return literacyMockVowelSpellingClaim(item.skillId, pattern, sound);
    if (item.formatType === 'CPS') return `${item.targetWord ? 'match' : 'identify'}_read_vowel_sound:${pattern}:${sound}`;
    if (item.formatType === 'PTD') return `${/\bNOT\b/.test(item.prompt) ? 'exclude' : 'identify'}_read_vowel_sound:${pattern}:${sound}`;
  }
  if (item.skillId === 'long_vowels') {
    if (item.formatType === 'LONG_VOWEL_SILENT_E_PATTERN') return literacyMockVowelSpellingClaim(item.skillId, pattern);
    if (item.formatType === 'CPS') return `identify_read_split_vowel_sound:${pattern}`;
  }
  if (item.skillId === 'r_controlled') {
    if (item.formatType === 'R_CONTROLLED_PATTERN') return literacyMockVowelSpellingClaim(item.skillId, pattern);
    if (item.formatType === 'PICTURE_AUDIO_TO_PATTERN') return `identify_heard_r_controlled_spelling:${pattern}`;
    if (item.formatType === 'CPS') return `match_read_r_controlled_sound:${pattern}`;
  }
  return item.constructClaim;
}

// These corrections are Mock-only. Published practice and historical Mock
// catalogues retain their original levels, task labels and stable identities.
export function correctLiteracyMockPhonicsDemand(item) {
  const constructClaim = vowelTaskClaim(item);
  if (constructClaim && constructClaim !== item.constructClaim) item = { ...item, constructClaim };
  if (item.id !== 'lp3.long_vowels_silent_e.l1.A.e_e.v4') return item;
  return { ...item, level: 2,
    difficultyEvidence: 'Transfer the split e_e pattern from a single syllable to the stressed syllable of a two-syllable word with a consonant cluster.' };
}

const SOUND_ROWS = [
  ['final_sounds', 'final_sound_discrimination', 'final-pond', 'pond', ['bed', 'pen', 'dog'],
    'Pond and bed end in /d/. Pen ends in /n/; dog starts with /d/ but ends in /g/.',
    ['Pen selects the earlier /n/ inside the final cluster instead of the final /d/.', 'Dog puts /d/ at the beginning instead of the end.'],
    'Isolate the final phoneme from the /nd/ consonant cluster rather than a simple final consonant.'],
  ['final_sounds', 'final_sound_discrimination', 'final-nest', 'nest', ['cat', 'bus', 'hen'],
    'Nest and cat end in /t/. Bus ends in /s/; hen ends in /n/.',
    ['Bus selects the earlier /s/ inside the final cluster instead of the final /t/.', 'Hen matches the initial /n/ of nest instead of its final sound.'],
    'Isolate the final phoneme from the /st/ consonant cluster against an internal-sound competitor.'],
  ['rhyming', 'spoken_rhyme_discrimination', 'rhyme-coat', 'coat', ['boat', 'cat', 'cake'],
    'Coat and boat share the spoken ending /oʊt/. Cat keeps the final consonant but changes the vowel; cake keeps the long vowel but changes the final consonant.',
    ['Cat shares the beginning and final consonant but has a different vowel.', 'Cake shares the beginning and long vowel but has a different final consonant.'],
    'Compare the complete long-vowel rime while rejecting a vowel-change and a final-consonant-change near neighbour.'],
  ['rhyming', 'spoken_rhyme_discrimination', 'rhyme-train', 'train', ['plane', 'tree', 'pen'],
    'Train and plane share the spoken ending /eɪn/ even though their beginnings differ. Tree shares the initial blend; pen changes the vowel.',
    ['Tree matches the beginning blend rather than the complete ending.', 'Pen shares the final /n/ but changes the vowel.'],
    'Compare long-vowel rimes across consonant-cluster onsets rather than matching an onset or final consonant alone.'],
  ['blends', 'spoken_blend_discrimination', 'blend-spray', 'spray', ['spring', 'splash', 'brush'],
    'Spray and spring begin with all three sounds /s/ /p/ /r/. Splash ends its initial cluster with /l/; brush lacks /s/ and uses /b/.',
    ['Splash matches /s/ /p/ but changes the third sound of the cluster.', 'Brush shares /r/ but has a different, shorter initial cluster.'],
    'Retain all three consonants of /spr/ while discriminating a cluster differing only in its third sound.'],
  ['blends', 'spoken_blend_discrimination', 'blend-splinter', 'splinter', ['splash', 'spring', 'plane'],
    'Splinter and splash begin /s/ /p/ /l/. Spring changes the third sound; plane omits the initial /s/.',
    ['Spring matches the first two sounds but changes /l/ to /r/.', 'Plane drops the initial /s/ from the three-sound cluster.'],
    'Extract and compare a three-consonant onset from a two-syllable spoken word against a third-sound substitution and an omitted sound.'],
];

const TEAM_ROWS = [
  ['ai', 'strain', 'str__n', ['ai', 'ay', 'oa'], 'Map the long vowel inside a three-consonant onset rather than the one- or two-consonant entry words.'],
  ['ai', 'sprain', 'spr__n', ['ai', 'ay', 'ee'], 'Keep the three-consonant onset while selecting the medial spelling of the long vowel.'],
  ['ay', 'spray', 'spr__', ['ay', 'ai', 'oa'], 'Transfer the final long-vowel spelling to a three-consonant onset.'],
  ['ay', 'stray', 'str__', ['ay', 'ai', 'ee'], 'Retain a three-consonant onset while distinguishing the conventional final vowel-team spelling.'],
  ['ee', 'screen', 'scr__n', ['ee', 'ea', 'oa'], 'Transfer the vowel spelling into a three-consonant onset, beyond entry words such as green.'],
  ['ee', 'screech', 'scr__ch', ['ee', 'ea', 'ai'], 'Locate the vowel team between a three-consonant onset and a final digraph.'],
  ['ea', 'stream', 'str__m', ['ea', 'ee', 'ai'], 'Transfer the medial vowel-team spelling to a three-consonant onset.'],
  ['ea', 'squeak', 'squ__k', ['ea', 'ee', 'oa'], 'Locate the vowel team after the three-phoneme /s/ /k/ /w/ onset while rejecting a same-sound spelling alternative.'],
  ['oa', 'throat', 'thr__t', ['oa', 'ow', 'ee'], 'Locate the vowel team after a consonant digraph-plus-consonant onset rather than a simple onset.'],
  ['oa', 'approach', 'appr__ch', ['oa', 'ow', 'ai'], 'Locate the vowel team in the stressed second syllable with a final digraph, beyond the one-syllable entry words.'],
  // Bright and flight already occur at entry: another one-syllable cluster
  // word would not justify a new level. These add a second spoken syllable.
  ['igh', 'twilight', 'twil___t', ['igh', 'ie', 'ai'], 'Locate the target long-vowel spelling in the second syllable while preserving the first syllable.'],
  ['igh', 'spotlight', 'spotl___t', ['igh', 'ie', 'ee'], 'Transfer the target pattern into the second part of a two-syllable compound.'],
];

/** Raw template clones are renormalized by the bank so missing exact cues fail closed. */
export function buildLiteracyMockPhonicsDepthItems(bank) {
  const templateFor = (skill, construct) => {
    const template = bank.find(item => item.skillId === skill && item.constructClaim === construct
      && item.level === 1 && item.format === (construct === 'construct_dictated_word' ? 'build_word' : 'choice'));
    if (!template) throw new Error(`Missing Mock phonics depth template: ${skill}:${construct}`);
    return template;
  };
  const imageFor = label => {
    const image = ASSETS[label] || bank.flatMap(item => item.choices).find(choice => choice.label === label && choice.image)?.image;
    if (!image) throw new Error(`Missing approved Mock phonics picture: ${label}`);
    return image;
  };
  const make = (template, id, extras) => {
    const key = `mock.depth.phonics.${id}`;
    return { ...template, id: key, sourceItemId: key, canonicalItemId: key,
      exposureFamilyId: `mock-phonics-depth:${id}`, level: 2, tutorialOnly: false,
      targetWord: '', image: '', imageAlt: '', passage: '', renderTargetText: false,
      demandCeiling: undefined, ceilingReason: undefined,
      sourceProvenance: { kind: 'original_mock_depth', file: SOURCE_FILE, sourceId: id, taskTemplate: template.id },
      ...extras };
  };
  const pictureDecision = (paths, reason) => ({ role: 'answer-cards', paths,
    constructReview: 'approved', answerNeutral: 'approved', reason });
  const items = SOUND_ROWS.map(([skill, construct, id, target, labels, explanation, rationales, demand]) => {
    const template = templateFor(skill, construct);
    const choices = choicesFor(labels).map(choice => ({ ...choice, image: imageFor(choice.label), imageAlt: choice.label }));
    return make(template, id, { choices, answer: 'c0', targetWord: target, stimulusKey: target,
      requiredAudioCues: [instruction(template.prompt), wordCue(target), ...choiceCues(choices)],
      hideWrittenLabels: true, explanation, difficultyEvidence: demand,
      distractorRationales: { c1: rationales[0], c2: rationales[1] },
      mediaDecision: pictureDecision(choices.map(choice => choice.image),
        'Existing approved pictures identify exact spoken choices; hidden spellings preserve the sound comparison.') });
  });

  for (const [pattern, target, masked, labels, demand] of TEAM_ROWS) {
    const template = templateFor('vowel_teams', literacyMockVowelSpellingClaim('vowel_teams', pattern));
    items.push(make(template, `team-${pattern}-${target}`, { prompt: `Which letters complete ${masked}?`,
      choices: choicesFor(labels), answer: 'c0', targetWord: target, stimulusKey: target,
      requiredAudioCues: [instruction(`${target[0].toUpperCase()}${target.slice(1)}. Which letters complete the word?`), wordCue(target)],
      explanation: `The conventional spelling of ${target} uses ${pattern} in the blank.`, difficultyEvidence: demand,
      distractorRationales: Object.fromEntries(labels.slice(1).map((label, index) => [`c${index + 1}`,
        `${label} does not give the conventional spelling of the spoken word ${target}.`])),
      mediaDecision: { role: 'text-only', paths: [], constructReview: 'approved', answerNeutral: 'approved',
        reason: 'The heard word and printed incomplete spelling are the evidence; spelling alternatives must not be narrated.' } }));
  }
  for (const [target, masked] of [['concrete', 'concr_t_'], ['athlete', 'athl_t_']]) {
    const template = templateFor('long_vowels', literacyMockVowelSpellingClaim('long_vowels', 'e_e'));
    items.push(make(template, `split-e-${target}`, { prompt: `Which vowel pattern completes ${masked}?`,
      choices: choicesFor(['e_e', 'i_e', 'a_e']), answer: 'c0', targetWord: target, stimulusKey: target,
      requiredAudioCues: [instruction(`${target[0].toUpperCase()}${target.slice(1)}. Which vowel pattern completes the word?`), wordCue(target)],
      explanation: `The split e_e pattern completes the final syllable of ${target}.`,
      difficultyEvidence: 'Transfer the split e_e pattern from a single-syllable word into the final syllable of a longer word with a consonant cluster.',
      distractorRationales: { c1: 'The i_e pattern changes the long vowel in the spoken word.', c2: 'The a_e pattern changes the long vowel in the spoken word.' },
      mediaDecision: { role: 'text-only', paths: [], constructReview: 'approved', answerNeutral: 'approved',
        reason: 'Exact target audio and the printed incomplete spelling preserve the entry spelling task without narrating its choices.' } }));
  }

  for (const [target, phonemes, labels, rationales] of [
    ['stop', ['s', 't', 'o', 'p'], ['stop', 'top', 'spot'], ['Top omits the initial /s/.', 'Spot reverses the positions of /t/ and /p/.']],
    ['plan', ['p', 'l', 'a', 'n'], ['plan', 'pan', 'plant'], ['Pan omits /l/ from the initial cluster.', 'Plant adds a final /t/ that was not spoken.']],
  ]) {
    const template = templateFor('sound_manipulation', 'blend_phonemes');
    const choices = choicesFor(labels);
    items.push(make(template, `phonemes-${target}`, { choices, answer: 'c0', stimulusKey: `phonemes:${phonemes.join('|')}`,
      // The correct word occurs only as one shuffled choice, never as a
      // target or pre-answer model. Atomic phoneme recordings are mandatory.
      requiredAudioCues: [instruction('Listen to the sounds. Which word do they make?'),
        ...phonemes.map(text => ({ role: 'phoneme', text, path: getPreferredPhonemeAudioPath(text) })), ...choiceCues(choices)],
      explanation: `Blending the four sounds in order makes ${target}.`,
      difficultyEvidence: 'Blend four separately presented phonemes, retaining a two-consonant onset, instead of three-phoneme entry words.',
      distractorRationales: { c1: rationales[0], c2: rationales[1] },
      mediaDecision: { role: 'text-only', paths: [], constructReview: 'approved', answerNeutral: 'approved',
        reason: 'Four isolated phoneme recordings supply the stimulus. Hidden written labels and separately replayable spoken choices preserve oral blending.' } }));
  }
  for (const [target, labels] of [['chick', ['ch', 'i', 'ck', 'sh', 't', 'k']], ['shell', ['sh', 'e', 'll', 'ch', 'a', 'l']]]) {
    const template = templateFor('digraphs', 'construct_dictated_word');
    items.push(make(template, `build-${target}`, { choices: choicesFor(labels), answer: target, targetWord: target,
      responseLength: 3, stimulusKey: target, image: ASSETS[target], imageAlt: target,
      requiredAudioCues: [instruction(template.prompt), wordCue(target)],
      explanation: `${labels.slice(0, 3).join(' + ')} makes the complete dictated word ${target}.`,
      difficultyEvidence: 'Select and order two multiletter graphemes around the vowel, rather than one multiletter grapheme in the entry word.',
      distractorRationales: Object.fromEntries(labels.slice(3).map((label, index) => [`c${index + 3}`,
        `${label} is not part of the required conventional spelling of ${target}.`])),
      mediaDecision: { ...pictureDecision([ASSETS[target]], 'An existing approved picture supports the dictated word without displaying its spelling.'), role: 'target' } }));
  }
  return items;
}
