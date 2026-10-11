/** Fixed operations have an authored task ceiling, never a learner ceiling.
 * Raising word rarity, layout noise or tile count alone would not validate a
 * harder level of the same construct. Next tasks are named separately. */
export function literacyMockTaskCeiling(item) {
  const claim = item.constructClaim || item.itemKey;
  let reason; let next;
  if (item.skillId?.startsWith('hfw_') && ['spoken_to_print_high_frequency_word_recognition', 'contextual_high_frequency_word_recognition'].includes(claim)) {
    reason = 'This task recognizes a familiar printed word from its spoken form or narrated context. Spelling that word independently is a different task, so it is not labelled a harder version of this recognition task.';
    next = 'Check independent spelling or use of these words in an unspoken sentence as a separate task.';
  } else if (item.skillId === 'letter_knowledge' && claim === 'letter_name') {
    reason = 'Matching a spoken letter name to its glyph is a fixed recognition operation. New letters provide fresh evidence; decorative fonts or extra distractors would not establish a new level of letter knowledge.';
    next = 'Check letter-sound knowledge or decoding in a separate task.';
  } else if (item.skillId === 'cvc_short_vowels' && claim === 'construct_dictated_word') {
    reason = 'This task builds a three-phoneme CVC word from supplied tiles. More tiles alone would not establish a different linguistic demand.';
    next = 'Check longer phoneme sequences or words with digraphs in a separate decoding and spelling task.';
  } else if (item.skillId === 'r_controlled' && claim?.startsWith('identify_heard_r_controlled_spelling:')) {
    reason = 'This task selects one conventional r-controlled spelling for a heard word. Adding consonants or rarer vocabulary would not by itself increase the demand of selecting that spelling pattern.';
    next = 'Check independent decoding, completion or construction of words with this pattern as a separate task.';
  } else if (item.skillId === 'long_vowels' && /^complete_split_vowel_spelling:[aiou]_e$/.test(claim)) {
    reason = 'This task supplies the spoken word and asks for its split-vowel spelling pattern. More consonants or rarer words do not create the short-to-long decoding contrast required for a harder silent-e task.';
    next = 'Check independent reading with a real short-vowel twin, or whole-word spelling, as a separate task.';
  } else if (item.skillId === 'long_vowels' && claim === 'silent_e_vowel_contrast') {
    reason = 'This task matches a supplied spoken word to its printed form. Switching the recording from a long-vowel word to a short-vowel word does not by itself establish a harder response operation.';
    next = 'Check independent decoding of a real short-to-long word pair without a supplied spoken answer as a separate task.';
  } else if (item.skillId === 'sound_manipulation' && claim === 'delete_word_part') {
    reason = 'Removing one named whole word from a two-word compound is a fixed operation. Longer compound parts would mainly add vocabulary and memory load.';
    next = 'Check phoneme deletion or substitution in a separately labelled sound-manipulation task.';
  } else if (item.skillId === 'prepositions' && ['in','on','under','behind','next_to','between','in_front_of','above','below'].includes(claim)) {
    reason = 'Each pictured item identifies one visible spatial relation. More visual clutter would add search demand rather than a validated harder version of that same relation.';
    next = 'Check a sequence of oral directions or two linked spatial relations as a separate task.';
  } else if (item.skillId === 'homophones' && ['sea_see','sun_son','be_bee','no_know','one_won','ate_eight','hear_here','blue_blew'].includes(claim)) {
    reason = 'This task selects the spelling for one stated meaning in a fixed homophone pair. Fresh definitions check consistency; a harder claim would need a different operation.';
    next = 'Check contextual spelling or explain the two meanings in a separate task.';
  } else if (item.skillId === 'print_concepts' && ['first_word','last_word','first_letter','last_letter'].includes(claim)) {
    reason = 'Locating the first or last printed unit is a fixed boundary operation. Increasing sentence length or word rarity would not by itself make that print concept more advanced.';
    next = 'Check line-return navigation, word boundaries or sentence meaning as a separate task.';
  } else if (item.skillId === 'plurals' && claim === 'recognize_plural_picture_word') {
    reason = 'This task matches a pictured group with its regular s plural. Extra objects do not establish harder morphology within this operation.';
    next = 'Check es endings, spelling changes or irregular plurals as separate tasks.';
  }
  return reason ? { demandCeiling: 1, ceilingReason: reason, ceilingNextTask: next } : {};
}
