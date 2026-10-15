// V6 classifies the task the child must perform. Source level, word-list
// position, extra nouns and longer directions are never promotion criteria.
const rung=(operation,requires)=>Object.freeze({operation,requires});
export const LITERACY_MOCK_DEMAND_LADDERS=Object.freeze({
 sound_awareness:[rung('compare_initial_sounds','Compare the initial sounds of recorded familiar words.'),rung('map_initial_sound','Isolate an initial sound and select its letter.'),rung('compare_rimes','Compare the vowel and ending together to find a spoken rhyme.'),rung('compare_medial_vowels','Ignore the consonants and compare the internal vowel of spoken words.'),rung('blend_three_phonemes','Hold and blend three separately recorded phonemes.'),rung('manipulate_phoneme','Add, delete or substitute a phoneme and identify the changed word.')],
 phonics:[rung('recognize_familiar_word','Match one short recorded familiar word to print.'),rung('decode_cvc','Discriminate a complete printed CVC word against other CVC words.'),rung('encode_cvc','Construct all three ordered graphemes of a dictated CVC word.'),rung('encode_consonant_blend','Construct four or more ordered phonemes, including a consonant blend.'),rung('decode_split_vowel','Decode a split-vowel word against its real short-vowel twin.'),rung('encode_vowel_team','Choose a vowel-team grapheme and construct a three-phoneme word; reject spare tiles.'),rung('encode_blend_and_vowel_team','Construct four or more phonemes with both a consonant blend and a vowel team; reject spare tiles.')],
 print:[rung('recognize_letter_name','Match a recorded letter name to its printed glyph.'),rung('match_letter_case','Relate capital and lowercase forms of one letter.'),rung('locate_letter_in_word','Locate the first or last letter within a complete printed word.'),rung('locate_word_in_sentence','Use word boundaries to locate a word within a complete sentence.'),rung('navigate_connected_print','Navigate across a line or sentence boundary, or distinguish multiple complete sentences.')],
 vocabulary:[rung('recognize_object_category','Recognize a familiar word against a picture from another broad category.'),rung('discriminate_related_objects','Distinguish a familiar word from pictures in the same semantic category.'),rung('relate_word_meanings','Relate individual words by synonym or antonym meaning.'),rung('interpret_one_context','Use one occurrence of a word to select its contextual sense.'),rung('apply_affix_contrast','Apply an affix in context against competing forms of the same root.'),rung('resolve_competing_contexts','Resolve a repeated word against another correctly used occurrence or competing true sense.')],
 listening:[rung('recognize_spoken_word','Identify one recorded familiar word.'),rung('find_spoken_referent','Identify the referent within a short recorded sentence.'),rung('retrieve_spoken_detail','Retrieve one explicit detail from a short recording.'),rung('order_spoken_events','Track three explicitly chronological spoken events.'),rung('integrate_spoken_topic','Connect two spoken statements to identify their common topic.'),rung('infer_spoken_lesson','Infer a general lesson from an unstated mistake-and-repair relationship.'),rung('integrate_spoken_episodes','Find one transferable lesson across two different episodes; reject true lessons fitting only one.')],
 language:[rung('recognize_action','Distinguish an action word from an object word using a picture and recordings.'),rung('discriminate_actions','Distinguish the pictured action from other actions.'),rung('classify_word_form','Identify a word class or plural form without sentence-level reasoning.'),rung('understand_one_clause','Interpret the roles or action in one complete clause.'),rung('link_two_clauses','Combine a causal clause or a pronoun with its referent across clauses.'),rung('preserve_scope','Preserve a quantified, negative or temporal relationship while comparing restatements.')],
 reading:[rung('recognize_pictured_word','Match a picture to one printed word with a distinct initial.'),rung('decode_pictured_cvc','Read the full CVC word against close printed alternatives.'),rung('retrieve_printed_detail','Independently read a short statement and retrieve an explicit detail.'),rung('order_printed_events','Track three explicitly chronological events in print.'),rung('integrate_printed_topic','Connect two printed statements to identify their common topic.'),rung('infer_printed_lesson','Infer a general lesson from an unstated mistake-and-repair relationship.'),rung('integrate_printed_episodes','Find one transferable lesson across two different episodes; reject true lessons fitting only one.')],
 writing:[rung('capitalize_name','Recognize the conventional capitalized form of a supplied name.'),rung('capitalize_sentence','Apply initial capitalisation to a complete sentence.'),rung('construct_sentence','Order words or distinguish a complete simple thought from fragments.'),rung('separate_two_thoughts','Locate the boundary between two simple complete thoughts.'),rung('organize_three_events','Arrange three complete sentences by their prerequisite event relationships.'),rung('edit_clause_or_paragraph','Retain a dependent clause with its main clause, or reject a true but irrelevant paragraph detail.')],
});

const cvc=word=>/^[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/i.test(word||'');
const simpleOnset=word=>/^[bcdfghjklmnpqrstvwxyz]/i.test(word||'')&&!/^(bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|sk|sl|sm|sn|sp|st|sw|tr|tw|sh|ch|th|wh)/i.test(word);
const words=text=>String(text||'').trim().split(/\s+/).filter(Boolean);
const sentenceCount=text=>(String(text||'').match(/[.!?](?:[”’"']?)(?:\s|$)/g)||[]).length;
const oneWordChoices=q=>q.choices.every(c=>!c.label.trim().includes(' '));
const affixContrastIds=new Set(['mock.depth.affix-careless','mock.depth.affix-reusable',...['unlocked','reheated','thankful','restless','misread','washable','kindness'].map(id=>`mock.capacity.language.affix-${id}`)]);

/** A null result leaves the item available to its original assessment, but
 * excludes it from this adaptive route. The source's numeric level is ignored. */
export function literacyMockDemandV6(q) {
 if(q.tutorialOnly)return null;
 const task=q.constructClaim||'',features=q.taskDemand?.features||{},reviewed=q.taskDemand?.reviewed===true;
 switch(q.domainId){
  case 'sound_awareness':
   if(task==='initial_sound_discrimination'&&simpleOnset(q.targetWord))return 0;
   if(task==='initial_sound_grapheme_mapping'&&simpleOnset(q.targetWord)&&q.evidenceModality==='audio+image+print')return 1;
   if(task==='spoken_rhyme_discrimination'&&q.evidenceModality==='audio+image')return 2;
   if(task==='spoken_medial_vowel_discrimination')return 3;
   if(task==='blend_phonemes'&&q.requiredAudioCues.filter(c=>c.role==='phoneme').length===3)return 4;
   if(['substitute_initial','substitute_final','delete_phoneme','add_phoneme'].includes(task))return 5;
   return null;
  case 'phonics':
   if(q.phonemeTiles&&task==='construct_vowel_team_word_with_spare_tiles')return q.phonemeTiles.length===3?5:q.phonemeTiles.length>=4?6:null;
   if(q.skillId==='hfw_1_25'&&/^(a|i|in|on|it|is|at|up|to|my|me|we)$/i.test(q.targetWord)&&q.format==='choice'&&!q.passage&&['spoken_to_print_high_frequency_word_recognition','spoken_to_print_hfw_orthographic_discrimination'].includes(task))return 0;
   if(task.startsWith('match_spoken_short_vowel_word:')&&cvc(q.targetWord)&&q.choices.every(c=>cvc(c.label)))return 1;
   if(task.startsWith('construct_short_vowel_phoneme_sequence:')&&q.format==='build_word'){
    const target=q.targetWord||q.answer;
    if(cvc(target))return 2;
    if(/^[bcdfghjklmnpqrstvwxyz]{2}[aeiou][bcdfghjklmnpqrstvwxyz]{1,2}$|^[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]{2}$/i.test(target)&&!/(sh|ch|th|ck|ng|ph)/i.test(target))return 3;
   }
   if(task.startsWith('identify_read_split_vowel_sound:')){
    const key=q.choices.find(c=>c.id===q.answer)?.label||'';
    if(/^[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]e$/i.test(key)&&q.choices.some(c=>c.label===key.slice(0,-1)))return 4;
   }
   return null;
  case 'print':
   if(task==='letter_name')return 0;
   if(['letter_case','letter_case_correspondence'].includes(task))return 1;
   if(['first_letter','last_letter'].includes(task)&&words(q.passage).length===1)return 2;
   if(['first_word','last_word'].includes(task)&&words(q.passage).length>=3&&sentenceCount(q.passage)<=1)return 3;
   if(task==='return_sweep'&&q.passage.includes('\n'))return 4;
   if(['sentence_end_location','sentence_count'].includes(task)&&sentenceCount(q.passage)>=2)return 4;
   return null;
  case 'vocabulary':
   if(q.foundationBand!==undefined&&['familiar_word_across_categories','familiar_word_within_category'].includes(task))return q.foundationBand;
   if(['antonym_concrete','synonym_concrete','antonym_picture','synonym_picture','synonyms','antonyms'].includes(task))return 2;
   if(task==='meaning_at_named_occurrence'&&reviewed&&features.targetOccurrences===1)return 3;
   if(task==='apply_affix_meaning_in_context'&&affixContrastIds.has(q.id))return 4;
   if(task==='meaning_at_named_occurrence'&&reviewed&&features.targetOccurrences===2&&features.trueSenseFoils>=1)return 5;
   if(task==='locate_contextual_homophone_error'&&q.sourceProvenance?.demand?.requiresOccurrenceContext===true&&q.sourceProvenance.demand.correctlyUsedSameSpellingOccurrences>=1)return 5;
   return null;
  case 'listening':
  case 'reading':{
   const claim=task.replace(/^listening_/,'');
   if(q.domainId==='listening'&&['identify_spoken_word','identify_spoken_sentence_referent'].includes(task))return task==='identify_spoken_word'?0:1;
   if(q.domainId==='reading'&&['read_word_distinct_initials','read_complete_cvc_word'].includes(task))return task==='read_word_distinct_initials'?0:1;
   if(['where','who','number_detail','what_happened'].includes(claim)&&q.passage&&words(q.passage).length<=10)return 2;
   if(!reviewed)return null;
   if(claim==='story_event_order'&&features.temporalLinks===0&&features.presentationConflicts===0)return 3;
   if(claim==='mostly_about_info'&&features.competingTruePartialAccounts===0&&sentenceCount(q.passage)>=2)return 4;
   if(claim==='lesson_mistake_fixed'&&features.episodesToIntegrate===1)return 5;
   if(claim==='lesson_mistake_fixed'&&features.episodesToIntegrate===2&&features.plausiblePartialLessons>=2)return 6;
   return null;
  }
  case 'language':
   if(['action_word_against_object_word','distinguish_action_word_meaning'].includes(task))return task==='action_word_against_object_word'?0:1;
   if(task==='recognize_plural_word_forms')return 2;
   if(/^(noun_(person|animal|place|thing)|verb_(action_body|action_object|everyday))$/.test(task)&&!q.passage&&oneWordChoices(q))return 2;
   if(/^literal_(who_what|where_when|action)$/.test(task)&&words(q.passage).length<=12&&!/\b(because|before|after|although|unless|while|if)\b/i.test(q.passage))return 3;
   if(['two_clause','pronoun_reference'].includes(task)&&q.passage)return 4;
   if(task==='best_restatement'&&/\b(all|every|no|only|before|after|until|neither|unless|except|already|not|never)\b/i.test(q.passage))return 5;
   return null;
  case 'writing':
   if(task==='recognize_name_capital_form')return 0;
   if(task==='sentence_capital')return 1;
   if(task==='sentence_word_order'&&q.choices.length<=5)return 2;
   if(task==='complete_sentence'&&!q.choices.some(c=>/^(after|before|although|because|when|if|unless)\b/i.test(c.label)))return 2;
   if(task==='punctuate_two_sentence_boundary')return q.taskDemand?.dependentClause?5:3;
   if(task==='sentence_boundary')return 3;
   if(task==='coherent_event_order'&&q.format==='order'&&q.choices.length===3)return 4;
   if(task==='relevance'&&sentenceCount(q.passage)>=3)return 5;
   return null;
  default:return null;
 }
}
