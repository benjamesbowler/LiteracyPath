# Blueprints — Grammar & Language (skills 15–22)

Updated 2026-09-22. The executable inventory is `src/content/blueprints/skillBlueprints.js`; the authored content is `tools/assessmentRebuild/authoring/`. Read MASTERY_SYSTEM.md and AUTHORING_STANDARDS.md for the shared scoring and quality contracts. This document describes instructional intent and must not create a second mastery algorithm.

## Shared contract

Grammar skills use concept units rather than treating every vocabulary word as a separate skill. Child-facing Level 1 wording uses “naming word”, “doing word” and “describing word”. Level 2 demands more precise application, contrast or integration; extra text alone does not establish higher difficulty.

Each level and phase needs a complete initial sitting and a genuinely fresh retry. Nouns, Verbs, Adjectives, Prepositions, Plurals and Antonyms/Synonyms use eight questions per sitting. Prefixes/Suffixes and Homophones/Homonyms use ten. Each skill also needs sixteen independent reserved questions across both levels: an eight-question delayed retention check and a fresh eight-question retry. Reserves do not inflate ordinary phase stock. Generated counts and evidence, rather than historical authoring quotas, establish readiness.

Pictures are required when they supply scoring evidence. They are excluded when naming an object or depicting an action would reveal the grammatical category being assessed. Recorded instructions support independent access; playback must preserve the construct and cannot speak an answer that should be read.

## 15. Nouns (`nouns`)

Level 1 units: `noun_person`, `noun_animal`, `noun_place`, `noun_thing`. Level 2: `noun_in_sentence`, `noun_vs_verb`, `noun_two_step`.

Level 1 uses `GRAMMAR_SENTENCE_FIT` and `GRAMMAR_WORD_CHOICE`: identify a naming word or use it in a controlled sentence. One obvious object picture among action pictures is not evidence of grammatical understanding. Level 2 uses sentence fit and `GRAMMAR_CONTRAST`, including identifying nouns in a sentence and finding exactly two nouns.

For noun-count comparisons, every candidate must be a grammatical sentence. For phrase completion, every phrase must fit the single blank. Neither answer length, its rank among the choices, copied words nor subject–verb agreement may replace counting nouns. Choices distinguish two nouns from one, three or a pronoun.

## 16. Verbs (`verbs`)

Level 1 units: `verb_action_body`, `verb_action_object`, `verb_everyday`. Level 2: `verb_in_sentence`, `verb_vs_noun`, `verb_precision`.

Level 1 uses controlled sentence fit and identifies an action among words actually present in a complete sentence. A bare word can have several grammatical functions, so the supplied context decides. Level 2 adds function contrasts and precision: all choices in a precision item must be plausible verbs, with a concrete sense clue selecting one. For example, moving a sack along the floor without lifting it distinguishes dragging from carrying, raising or throwing.

## 17. Adjectives (`adjectives`)

Level 1 units: `adj_size`, `adj_color`, `adj_texture_state`, `adj_feeling`. Level 2: `adj_in_sentence`, `adj_precision`, `adj_vs_noun_verb`.

Both levels use controlled language contexts rather than subjective “big”, “happy” or “soft” object pictures. Sentence extraction choices must occur in the actual sentence. Level 2 includes precise sense distinctions and adjective-versus-noun/verb/adverb contrasts. A frame must identify the intended sense without making another offered description equally defensible.

## 18. Prepositions of Place (`prepositions_of_place`)

Level 1 units: `in`, `on`, `under`, `behind`, `next_to`, `between`, `in_front_of`, `above`, `below`. Level 2: `over`, `through`, `near`, `opposite`, `among`, `around`, `inside_outside`.

Every scored location question has its exact scene. Level 1 uses `PREPOSITION_SCENE_CHOICE`; the legacy `PREPOSITION_TEXT_CHOICE` name remains allowed by the blueprint, but must still supply the actual visible relationship. Level 2 uses `PREPOSITION_SENTENCE_FIT` and `PREPOSITION_PRECISION`.

Options distinguish visible relationships. Do not offer two valid descriptions such as under/underneath or near/next to when the picture supports both. Object labels may identify the depicted subjects but must not state their relationship. Filenames must never be spoken as stimuli. A reused picture with a reworded question does not become fresh retention evidence when the same relationship is keyed. Required images must finish loading before a scored response is possible.

## 19. Plurals (`plurals`)

Level 1 units: `plural_add_s`, `plural_add_es`, `plural_concept`. Level 2: `plural_y_to_ies`, `plural_irregular`, `plural_f_to_ves`, `plural_in_sentence`.

Level 1 uses `PLURAL_IMAGE_SPELLING` and `PLURAL_SPELLING_CONTEXT`. Level 2 adds `PLURAL_ERROR_SPOT` and `PLURAL_TEXT_CHOICE`. Scored picture questions show an unmistakable count; narration cannot name the correct plural. Sentence contexts combine an explicit number signal with sufficient meaning to select a unique word.

Every ordinary spelling choice is a real word. Developmental errors are permitted only in the explicit error-recognition format and must come from `approvedDevErrors` in `src/content/lexicon/approvedWords.json`. Error recognition must distinguish the actual error from correctly spelled words in the same sentence. Singular words ending in s, such as bus, class, dress and cross, must not be mistaken for plurals by automated checks.

## 20. Prefixes & Suffixes (`prefixes_suffixes`)

Level 1 units: `prefix_un`, `prefix_re`, `suffix_ful`, `suffix_less`, `suffix_er_person`. Level 2: `suffix_s_es`, `suffix_ing`, `suffix_ed`, `suffix_er_est`, `suffix_ly`, `prefix_pre`.

Level 1 uses `MORPHEME_MEANING_CONTEXT` and `MORPHEME_TRANSFER` with familiar bases and short language. Level 2 also uses `MORPHEME_BUILD`, including inflection, spelling changes, comparison and transfer to a new context. A transfer claim requires application; simply copying a supplied gloss is recognition.

Distractor rationales must describe the actual error: a wrong grammatical form, another morpheme, a misleading pattern or a genuinely opposite meaning. Do not label a distractor “opposite” just because it occupies the first wrong-answer slot. Present and past alternatives require an explicit time cue whenever both would otherwise fit.

## 21. Antonyms & Synonyms (`antonyms_synonyms`)

Level 1 units: `antonym_concrete`, `synonym_concrete`, `antonym_picture`, `synonym_picture`. The last two are stable historical unit IDs; their current evidence is printed word relations and short contexts, not subjective picture pairs. Level 2: `antonym_precise`, `synonym_shade`, `antonym_in_context`, `synonym_in_context`.

Level 1 uses `LANGUAGE_PAIR_TEXT_CHOICE` and `WORD_RELATION_TEXT_CHOICE`. Level 2 uses text choice and `WORD_IN_SENTENCE_SWAP`. These are word/sentence tasks, not passage comprehension.

Antonym sets contain one true opposite and plausible same-domain alternatives. Synonym sets contain one best same-meaning choice, a true antonym and related non-equivalents. A weaker but defensible opposite must not compete with the key: cold/cool is an unsafe answer pair for opposite-of-hot. Degree, grammatical sense and the supplied context must make the key unique. Reversing a familiar word pair with the same competing meanings is not a new retention probe. Rationale labels describe the actual relationship, not a fixed option-position recipe.

## 22. Homophones & Homonyms (`homophones_homonyms`)

Level 1 sets: `sea_see`, `sun_son`, `be_bee`, `no_know`, `one_won`, `ate_eight`, `hear_here`, `blue_blew`. Level 2: `to_two_too`, `there_their`, `right_write`, `new_knew`, `hour_our`, `flower_flour`, `would_wood`, `made_maid`.

Both levels use `HOMOPHONE_MEANING` and `HOMOPHONE_CONTEXT_CLOZE`, with natural, varied contexts. The paired homophone is a necessary distractor; other options must be real, plausible forms without providing a second correct completion. Contrasting know/knew, eat/ate or make/made requires an explicit tense anchor. Homonym bat/ring exposure is marked `nonGating` and cannot supply homophone mastery or retention evidence.

Format coverage is a content requirement. Completion, score and progression use the single shared phase policy; historical per-unit attempt quotas and separate percentage thresholds are not active mastery rules.
