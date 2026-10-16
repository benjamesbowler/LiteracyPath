import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';

const FILE = 'src/data/literacyMockRetakeVocabulary.js';

// Both senses are nouns. The extension requires binding a named occurrence
// to its meaning, rather than using a noun/verb shortcut. The same target and
// sense contrast keep one exposure family at both authored demand bands.
const senseRows = [
  { word: 'cap', entry: 'The juice leaked until Mina twisted the cap tightly onto the bottle.',
    harder: 'Mina wore a wool cap over her hair on the cold walk. At lunch, she twisted the cap tightly onto her juice bottle so it would not leak.', occurrence: 2,
    labels: ['a cover that closes a bottle', 'a soft covering for the head', 'a handle for carrying a bottle'],
    queriedEvidence: 'she twisted the cap tightly onto her juice bottle so it would not leak', otherEvidence: 'Mina wore a wool cap over her hair on the cold walk' },
  { word: 'fan', entry: 'The fan beside the desk spun its blades and blew air across the warm room.',
    harder: 'The fan beside the desk spun its blades and blew air across the room. A football fan stood nearby, cheering for her team on the television.', occurrence: 1,
    labels: ['a machine that moves air', 'a person who supports a team', 'a television screen'],
    queriedEvidence: 'The fan beside the desk spun its blades and blew air across the room', otherEvidence: 'A football fan stood nearby, cheering for her team on the television' },
  { word: 'nail', entry: 'Dad tapped the metal nail through the wooden board with a hammer.',
    harder: 'Mara painted a tiny star on the nail at the end of her finger. Dad tapped a metal nail through a wooden board with his hammer.', occurrence: 2,
    labels: ['a metal fastener for wood', 'the hard covering on a fingertip', 'a wooden handle on a hammer'],
    queriedEvidence: 'Dad tapped a metal nail through a wooden board with his hammer', otherEvidence: 'Mara painted a tiny star on the nail at the end of her finger' },
  { word: 'palm', entry: 'A tall palm had a ringed trunk and long leaves above the beach.',
    harder: 'A tall palm had a ringed trunk and long leaves above the beach. Jo held a shell on her open palm, between her fingers and her wrist.', occurrence: 1,
    labels: ['a kind of tree', 'the inside surface of a hand', 'a sandy place beside the sea'],
    queriedEvidence: 'A tall palm had a ringed trunk and long leaves above the beach', otherEvidence: 'Jo held a shell on her open palm, between her fingers and her wrist' },
  { word: 'letter', entry: 'The letter arrived in an envelope with news from Gran.',
    harder: 'Eli pointed to the first letter in his printed name. Then he opened a letter from Gran and read the news she had written.', occurrence: 2,
    labels: ['a written message sent to someone', 'one character used to write words', 'a printed address on an envelope'],
    queriedEvidence: 'he opened a letter from Gran and read the news she had written', otherEvidence: 'Eli pointed to the first letter in his printed name' },
  { word: 'jam', entry: 'Our bus sat in a traffic jam, with vehicles blocking the road ahead.',
    harder: 'Our bus sat in a traffic jam, with vehicles blocking the road ahead. When we finally arrived, we put strawberry jam on toast.', occurrence: 1,
    labels: ['a line of traffic that cannot move freely', 'a sweet fruit spread for food', 'a place where buses stop for passengers'],
    queriedEvidence: 'Our bus sat in a traffic jam, with vehicles blocking the road ahead', otherEvidence: 'When we finally arrived, we put strawberry jam on toast.' },
  { word: 'chest', entry: 'The wooden chest had a hinged lid, with blankets stored inside.',
    harder: 'After running, I could feel my heart beating inside my chest. I sat beside a wooden chest with a hinged lid and blankets inside.', occurrence: 2,
    labels: ['a storage box with a lid', 'the front part of the upper body', 'a folded blanket used for warmth'],
    queriedEvidence: 'a wooden chest with a hinged lid and blankets inside', otherEvidence: 'I could feel my heart beating inside my chest' },
  { word: 'date', entry: 'The date on the invitation was the day of our party.',
    harder: 'The date on the invitation was the day of our party. For the snack, Gran cut a soft, sweet brown date in half and removed its hard stone.', occurrence: 1,
    labels: ['a particular day on a calendar', 'a sweet brown fruit with a stone', 'a written list of party snacks'],
    queriedEvidence: 'The date on the invitation was the day of our party', otherEvidence: 'Gran cut a soft, sweet brown date in half and removed its hard stone' },
  { word: 'patch', entry: 'Mum stitched a cloth patch over the hole in my trousers.',
    harder: 'Our small patch of soil was full of young carrots. Indoors, Mum stitched a cloth patch over the hole in my trousers.', occurrence: 2,
    labels: ['a piece of material covering a hole', 'a small area of ground', 'a pocket sewn onto some trousers'],
    queriedEvidence: 'Mum stitched a cloth patch over the hole in my trousers', otherEvidence: 'Our small patch of soil was full of young carrots' },
  { word: 'crane', entry: 'A crane stood on long legs in the pond, spreading its wings before it flew away.',
    harder: 'A crane stood on long legs in the pond, spreading its wings before it flew away. Across the road, a building crane lifted steel beams with a long arm and hook.', occurrence: 1,
    labels: ['a long-legged bird', 'a machine for lifting heavy loads', 'a metal hook at the end of a rope'],
    queriedEvidence: 'A crane stood on long legs in the pond, spreading its wings before it flew away', otherEvidence: 'a building crane lifted steel beams with a long arm and hook' },
  { word: 'coach', entry: 'The coach showed the team how to pass the ball and planned their practice.',
    harder: 'Our class boarded a coach with rows of seats for the trip. At the field, the coach showed our team how to pass the ball and planned our practice.', occurrence: 2,
    labels: ['a person who trains a team', 'a large bus for passengers', 'a player who guards the goal'],
    queriedEvidence: 'the coach showed our team how to pass the ball and planned our practice', otherEvidence: 'Our class boarded a coach with rows of seats for the trip' },
  { word: 'clip', entry: 'A metal clip held the two sheets together so they did not blow away.',
    harder: 'A metal clip held the two sheets together so they did not blow away. On her tablet, Mina played a short clip that showed a bird taking off, then stopped after a few seconds.', occurrence: 1,
    labels: ['a small fastener that holds things together', 'a short piece of video', 'a fold along the edge of paper'],
    queriedEvidence: 'A metal clip held the two sheets together so they did not blow away', otherEvidence: 'Mina played a short clip that showed a bird taking off, then stopped after a few seconds' },
  { word: 'rock', entry: 'Rock was piled beside the new path, with small stones ready for the builders.',
    harder: 'Rock was piled beside the new path, with small stones ready for the builders. During rehearsal, rock came from the hall’s speakers, with loud guitars and a steady drum beat.', occurrence: 1,
    labels: ['a solid stone material', 'a kind of music', 'the edge of a finished path'],
    queriedEvidence: 'Rock was piled beside the new path, with small stones ready for the builders', otherEvidence: 'rock came from the hall’s speakers, with loud guitars and a steady drum beat' },
  { word: 'post', entry: 'The post arrived in a bag of letters that the carrier left at our door.',
    harder: 'A wooden post held up one end of the fence. Later, the post arrived in a bag of letters that the carrier left at our door.', occurrence: 2,
    labels: ['letters delivered to a home', 'an upright support for a fence', 'a doorway used by a carrier'],
    queriedEvidence: 'the post arrived in a bag of letters that the carrier left at our door', otherEvidence: 'A wooden post held up one end of the fence' },
  { word: 'pitch', entry: 'The players ran onto the grassy pitch and placed the ball between the goals.',
    harder: 'The players ran onto the grassy pitch and placed the ball between the goals. In the music room, the singer changed the pitch of a note, first making it high and then low.', occurrence: 1,
    labels: ['a field where a game is played', 'the high or low level of a musical sound', 'a set of goalposts for a game'],
    queriedEvidence: 'The players ran onto the grassy pitch and placed the ball between the goals', otherEvidence: 'the singer changed the pitch of a note, first making it high and then low' },
  { word: 'pupil', entry: 'Each pupil carried a schoolbook into the classroom and sat down for a lesson.',
    harder: 'Light entered Jo’s eye through the dark pupil in its centre. At school, each pupil carried a book into the classroom and sat down for a lesson.', occurrence: 2,
    labels: ['a learner at a school', 'the dark opening in the centre of an eye', 'a person teaching a class'],
    queriedEvidence: 'each pupil carried a book into the classroom and sat down for a lesson', otherEvidence: 'Light entered Jo’s eye through the dark pupil in its centre' },
];

const affixRows = [
  { id: 'refilled', root: 'fill', affix: 're-', affixMeaning: 'again',
    passage: 'Lia emptied her bottle after a drink, then filled it a second time. She stopped exactly at the marked line, which showed the required amount.',
    prompt: 'Which word describes what Lia did?', labels: ['refilled', 'overfilled', 'underfilled'],
    contrast: 'The bottle is filled again, without going above or below the marked level.',
    key: 'Re- adds again to filled: Lia filled the bottle a second time.',
    foils: ['Overfilled means filled beyond the intended level; Lia stopped at the line.', 'Underfilled means filled below the intended level; Lia reached the line.'] },
  { id: 'miscounted', root: 'count', affix: 'mis-', affixMeaning: 'wrongly',
    passage: 'Jo counted the shells once, but her total was wrong. She had not counted them again.',
    prompt: 'Which word describes the shells after Jo’s attempt?', labels: ['miscounted', 'recounted', 'uncounted'],
    contrast: 'The shells have been counted wrongly, rather than counted again or left without a count.',
    key: 'Mis- adds wrongly to counted: Jo made an incorrect count.',
    foils: ['Recounted means counted again; the passage says Jo counted only once.', 'Uncounted means not counted; Jo did count the shells, although her total was wrong.'] },
  { id: 'unpacked', root: 'pack', affix: 'un-', affixMeaning: 'reverse the action',
    passage: 'Nia took every toy out of the box and left the toys loose on the mat. She put none back into the box.',
    prompt: 'What did Nia do to the toys?', labels: ['unpacked', 'packed', 'repacked'],
    contrast: 'The action reverses packing: toys move out of their container and are not packed into it again.',
    key: 'Un- reverses packed: Nia took the packed toys out.',
    foils: ['Packed would put the toys into a container; Nia took them out.', 'Repacked would pack the toys again; the passage says she put none back.'] },
  { id: 'unfastened', root: 'fasten', affix: 'un-', affixMeaning: 'reverse the action',
    passage: 'The clasp held Sara’s necklace closed. Sara opened the clasp and separated the two ends. She left the ends apart.',
    prompt: 'What did Sara do to the clasp?', labels: ['unfastened', 'fastened', 'refastened'],
    contrast: 'The clasp changes from holding the necklace closed to leaving its ends apart.',
    key: 'Un- reverses fastened: Sara undid the closed clasp.',
    foils: ['Fastened would secure the clasp; Sara opened it instead.', 'Refastened would secure the clasp again; Sara left the ends apart.'] },
  { id: 'harmless', root: 'harm', affix: '-less', affixMeaning: 'without causing harm',
    passage: 'The edge was covered in soft foam. It could not hurt a child who bumped it, and the edge itself was not damaged.',
    prompt: 'Which word describes the foam-covered edge?', labels: ['harmless', 'harmful', 'harmed'],
    contrast: 'The edge does not cause harm and has not received damage itself.',
    key: '-Less means without: harmless describes something that does not cause harm.',
    foils: ['Harmful means causing harm, which contradicts the edge not hurting a child.', 'Harmed describes something that has received damage; the edge itself was not damaged.'] },
  { id: 'colourless', root: 'colour', affix: '-less', affixMeaning: 'without',
    passage: 'The clear sheet had no colour. It was not tinted red, blue or any other colour.',
    prompt: 'Which word describes the clear sheet?', labels: ['colourless', 'colourful', 'coloured'],
    contrast: 'The sheet has no colour, rather than many colours or any applied colour.',
    key: '-Less adds without to colour: the sheet has no colour.',
    foils: ['Colourful describes something with strong or varied colours; the sheet has none.', 'Coloured describes something with colour or tint; the passage excludes any colour.'] },
  { id: 'unfair', root: 'fair', affix: 'un-', affixMeaning: 'not',
    passage: 'The rules gave every player one turn. Only one child was given extra turns because he was the leader’s friend. This did not make the turns more equal.',
    prompt: 'Which word describes the extra turns?', labels: ['unfair', 'fair', 'fairer'],
    contrast: 'Giving one friend extra turns breaks the equal-turn rule; it is not fair or an improvement in fairness.',
    key: 'Un- adds not to fair: favouring one friend broke the equal-turn rule.',
    foils: ['Fair would fit equal treatment under the rule, but one friend received extra turns.', 'Fairer means more fair; the passage explicitly says the extra turns did not make things more equal.'] },
  { id: 'disconnected', root: 'connect', affix: 'dis-', affixMeaning: 'reverse the connection',
    passage: 'The plug had joined the lamp to the socket. An adult pulled it out and left it lying on the table. Nobody put it back.',
    prompt: 'Which word describes the lamp now?', labels: ['disconnected', 'connected', 'reconnected'],
    contrast: 'A previous connection is removed and is not made again.',
    key: 'Dis- reverses connected: the plug no longer joins the lamp to the socket.',
    foils: ['Connected would mean the plug still joins lamp and socket, but it is on the table.', 'Reconnected would mean the connection was made again; nobody put the plug back.'] },
];

function cue(role, text, choiceId) {
  return { role, text, path: (role === 'choice' ? getLedaWordAudioPath(text) : '') || getLedaInstructionAudioPath(text),
    required: true, ...(choiceId ? { choiceId, value: text } : {}) };
}

export function buildLiteracyMockRetakeVocabulary() {
  const contexts = senseRows.flatMap(row => [3, 5].map(band => {
    const level = band === 3 ? 1 : 2;
    const id = `mock.v8.vocabulary.context.${row.word}.b${band}`;
    const passage = level === 1 ? row.entry : row.harder;
    const occurrence = level === 1 ? 1 : row.occurrence;
    const prompt = level === 1 ? `What did "${row.word}" mean in the sentence?`
      : `What did "${row.word}" mean the ${occurrence === 1 ? 'first' : 'second'} time it was used?`;
    const choices = row.labels.map((label, index) => ({ id: `c${index}`, label }));
    const requiredAudioCues = [cue('instruction', prompt), cue('passage', passage), ...choices.map(choice => cue('choice', choice.label, choice.id))];
    const family = `v8-context-word-senses:${row.word}`;
    const rationales = {
      c1: level === 1 ? `The supplied occurrence describes ${row.labels[0]}, rather than ${row.labels[1]}.`
        : `This is the real sense of ${row.word} at its other occurrence, not at the named occurrence.`,
      c2: `This names a related thing in the scene, rather than the meaning of ${row.word} at the named occurrence.`,
    };
    return {
      id, sourceItemId: id, canonicalItemId: id, contentVersion: 'literacy-mock-v8',
      skillId: 'context_clues', domainId: 'vocabulary', level, format: 'choice', sourceFormat: 'ORIGINAL_RETAKE_CONTEXT_V8',
      answerMode: 'exact', constructClaim: 'meaning_at_named_occurrence', prompt, passage,
      choices, answer: 'c0', targetWord: row.word, renderTargetText: false,
      modality: 'recognition', evidenceModality: 'audio+text', passageAccess: 'audio+text', oralLanguageAccess: true,
      displayPassageDuringResponse: true, hideWrittenLabels: false, tutorialOnly: false,
      image: '', imageAlt: '', requiredImagePaths: [],
      stimulusKey: passage.toLowerCase().normalize('NFKC'), canonicalPassageId: passage, exposureFamilyId: family,
      requiredAudioCues, requiredAudioPaths: [...new Set(requiredAudioCues.map(audio => audio.path).filter(Boolean))],
      mediaReady: requiredAudioCues.every(audio => Boolean(audio.path)),
      missingAudioCues: requiredAudioCues.filter(audio => !audio.path).map(({ role, text, choiceId }) => ({ role, text, ...(choiceId ? { choiceId } : {}) })),
      explanation: `At the named occurrence, ${row.word} means ${row.labels[0]}.`, distractorRationales: rationales,
      difficultyEvidence: level === 1 ? 'Resolve one noun sense from one supplied contextual occurrence.'
        : 'Resolve the named occurrence of a repeated noun and reject another sense that is true elsewhere in the same passage.',
      taskDemand: { reviewed: true, operation: 'meaning_at_named_occurrence', choiceCount: 3,
        features: { targetOccurrences: level, trueSenseFoils: level === 2 ? 1 : 0, queriedOccurrence: occurrence },
        proof: { queriedSense: row.labels[0], otherSense: row.labels[1], queriedOccurrence: occurrence,
          evidence: level === 1 ? [row.entry] : [row.queriedEvidence, row.otherEvidence],
          key: `The named occurrence is supported by ${level === 1 ? row.entry : row.queriedEvidence}.`,
          foils: [rationales.c1, rationales.c2] } },
      sourceProvenance: { kind: 'original_literacy_guide_retake', file: FILE, sourceId: id, pairedFamily: family,
        originalAuthorship: 'Original noun-sense contexts and semantic foils; no NWEA items or artwork reused.' },
      mediaDecision: { role: 'text-and-audio', construct: 'meaning_at_named_occurrence', paths: [],
        constructReview: 'approved', answerNeutral: 'approved',
        reason: 'Exact recorded question, passage and choices accompany complete printed contextual evidence. No picture substitutes for deciding which noun sense belongs to the named occurrence.' },
    };
  }));
  const affixes = affixRows.map(row => {
    const id = `mock.v8.vocabulary.affix.${row.id}`;
    const family = `v8-affix-root:${row.root}`;
    const choices = row.labels.map((label, index) => ({ id: `c${index}`, label }));
    const requiredAudioCues = [cue('instruction', row.prompt), cue('passage', row.passage), ...choices.map(choice => cue('choice', choice.label, choice.id))];
    return {
      id, sourceItemId: id, canonicalItemId: id, contentVersion: 'literacy-mock-v8',
      skillId: 'prefix_suffix', domainId: 'vocabulary', level: 2, format: 'choice', sourceFormat: 'ORIGINAL_RETAKE_AFFIX_V8',
      answerMode: 'exact', constructClaim: 'apply_affix_meaning_in_context', prompt: row.prompt, passage: row.passage,
      choices, answer: 'c0', targetWord: row.labels[0], renderTargetText: false,
      modality: 'recognition', evidenceModality: 'audio+text', passageAccess: 'audio+text', oralLanguageAccess: true,
      displayPassageDuringResponse: true, hideWrittenLabels: false, tutorialOnly: false,
      image: '', imageAlt: '', requiredImagePaths: [],
      stimulusKey: row.passage.toLowerCase().normalize('NFKC'), canonicalPassageId: row.passage, exposureFamilyId: family,
      requiredAudioCues, requiredAudioPaths: [...new Set(requiredAudioCues.map(audio => audio.path).filter(Boolean))],
      mediaReady: requiredAudioCues.every(audio => Boolean(audio.path)),
      missingAudioCues: requiredAudioCues.filter(audio => !audio.path).map(({ role, text, choiceId }) => ({ role, text, ...(choiceId ? { choiceId } : {}) })),
      explanation: row.key, distractorRationales: { c1: row.foils[0], c2: row.foils[1] },
      difficultyEvidence: 'Apply the stated prefix or suffix meaning to one root while rejecting two competing forms of that same root.',
      taskDemand: { reviewed: true, operation: 'apply_affix_meaning_in_context', choiceCount: 3,
        features: { sameRootAlternatives: 3, contextualContrast: true },
        proof: { root: row.root, forms: row.labels, affix: row.affix, affixMeaning: row.affixMeaning,
          contrast: row.contrast, evidence: [row.passage], key: row.key, foils: row.foils } },
      sourceProvenance: { kind: 'original_literacy_guide_retake', file: FILE, sourceId: id, pairedFamily: family,
        originalAuthorship: 'Original affix-in-context contrasts with three real forms of one root; no NWEA items reused.' },
      mediaDecision: { role: 'text-and-audio', construct: 'apply_affix_meaning_in_context', paths: [],
        constructReview: 'approved', answerNeutral: 'approved',
        reason: 'Complete printed and exact spoken context supports the affix contrast. Pictures would replace the required analysis of competing forms of the same root.' },
    };
  });
  return [...contexts, ...affixes];
}
