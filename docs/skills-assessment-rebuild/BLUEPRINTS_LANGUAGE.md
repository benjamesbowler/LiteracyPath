# Blueprints — Grammar & Language (skills 15–22)

**Standard.** Nouns, Verbs, Adjectives, Prepositions of Place, Plurals, Prefixes & Suffixes, Antonyms & Synonyms, Homophones & Homonyms. Read MASTERY_SYSTEM.md + AUTHORING_STANDARDS.md first.

**The family-wide re-keying.** Nouns currently has 86 item keys (one per word), Verbs 59, Prepositions 55 — word-keys make coverage sprawl and mastery meaningless. v3 keys grammar skills by **concept unit** (`itemType: "grammar_concept"`), small honest inventories. A child masters "nouns name people/places/things", not the word "air". Prepositions, Plurals, Prefixes/Suffixes, Homophones keep word/morpheme/set-shaped units because there the specific word IS the concept.

Child-facing wording rule (from instructional standards): L1 prompts use meaning words — "naming word / doing word / describing word"; the terms noun/verb/adjective may appear at L2 alongside the meaning gloss, never alone.

---

## 15. Nouns (`nouns`)

**Units (grammar_concept).** L1: `noun_person`, `noun_animal`, `noun_place`, `noun_thing` (4). L2: `noun_in_sentence` (choose the noun that completes/identifies within a sentence), `noun_vs_verb` (contrast: "Which word names a thing — jump / bed / run / go?"), `noun_two_step` (which sentence names TWO things). Family **D-small**.

**Formats.** L1 `GRAMMAR_IMAGE_CHOICE` (4 picture cards, one names the target category — distractors are actions/qualities pictured, `D-FUNCTION-SWAP`), L2 `GRAMMAR_SENTENCE_FIT` + `GRAMMAR_CONTRAST`. Imageability rule: L1 picture nouns from the concrete list only — `air`, `idea`-class unimageable words banned at L1 (lint via lexicon `imageable: true` flag).

**Bank.** L1: 4 × 6 = 24 + R 12; L2: 3 × 8 = 24 + R 12. Total 72 (current 146 pruned/rebuilt; the 70 GRAMMAR_IMAGE_CHOICE L1 items are salvage candidates after re-keying).

---

## 16. Verbs (`verbs`)

**Units.** L1: `verb_action_body` (run, jump), `verb_action_object` (cut, pour), `verb_everyday` (eat, sleep, read) (3). L2: `verb_in_sentence`, `verb_vs_noun`, `verb_precision` (choose the BEST verb: the dog ___ over the fence — jumped/walked/slept/sat where two are grammatical but one matches the picture/sense) (3). Family **D-small**.

**Craft notes.** The audit's "The picture shows what happens when someone can…" generic-copy pattern is banned (O-2); every L1 item names a real depicted action scene. L2 `verb_precision` distractors are grammatical-but-wrong (`D-PLAUSIBLE-UNSUPPORTED` register) — this is what makes L2 harder thinking, not longer text.

**Bank.** 3 × 8 = 24 + R 12 per level. Total 72 (current 111 replaced/pruned).

---

## 17. Adjectives (`adjectives`)

**Units.** L1: `adj_size`, `adj_color`, `adj_texture_state` (wet, soft, hot), `adj_feeling` (happy, tired) (4). L2: `adj_in_sentence`, `adj_precision` (closest describing word for the scene), `adj_vs_noun_verb` (3). Family **D-small**.

**Craft notes.** Every one of the 30 published "a adjective" prompts dies (`L-GRAM`). L2's current five-target repetition (brave/bumpy/calm/crisp/cute rotations) is replaced by the semantic-dimension units above — breadth comes from dimensions, not from recycling five words.

**Bank.** L1: 4 × 6 = 24 + R 12; L2: 3 × 8 = 24 + R 12. Total 72 (current 110 replaced).

---

## 18. Prepositions of Place (`prepositions_of_place`) — PRUNE 303 → 76

**Units (word-shaped, curated).** L1 (9): `in on under behind next_to between in_front_of above below`… exactly the 9 concrete spatial words a K-1 child needs (drop the 55-key sprawl). L2 (7): `over through near opposite among around inside_outside_contrast`. Family **D-small**.

**Formats.** L1: `PREPOSITION_SCENE_CHOICE` — ONE drawn scene, question about the relation ("Where is the cat? — in the box / on the box / under the box / behind the box"; options differ ONLY by preposition, `D-FUNCTION-SWAP` ×3 by construction). L2: `PREPOSITION_SENTENCE_FIT` (cloze with 4 prepositions) + `PREPOSITION_PRECISION` (two are spatially possible, one is exact — distractor note must defend why the key is uniquely right, C-1 pressure is highest here: no more `underneath` vs `under`).

**Craft notes.** The 19 malformed "Choose the precise word means…" prompts die. `prepositionClozeScenes.js` scene inventory is reusable raw material. Every L1 item's four options are the same scene-relation family; a child who knows the WORD, not the picture convention, answers.

**Bank.** L1: 9 × 3 = 27 + R 12; L2: 7 × 4 = 28 + R 12. Total 79.

---

## 19. Plurals (`plurals`)

**Units (rule-shaped).** L1 (3): `plural_add_s`, `plural_add_es` (x/ch/sh/ss endings), `plural_concept` (one↔many picture match). L2 (4): `plural_y_to_ies`, `plural_irregular` (men, children, feet, teeth, mice, sheep), `plural_f_to_ves` (leaf/leaves, wolf/wolves), `plural_in_sentence`. Family **D-small**.

**The distractor law.** Fake forms (`boxs, boxies, staries, cloudies, plantes` — 11 published items carry them) are replaced by the **approved developmental-error list** (`D-DEVELOPMENTAL`: foxes→foxs is attested and stays ONLY in the explicit error-spotting format; choice formats otherwise use real competing forms: box/boxes/foxes/dishes). Where a wrong spelling must appear (spell-the-plural), it comes from `approvedDevErrors.json`, never invented.

**Formats.** `PLURAL_IMAGE_SPELLING` (picture of 3 stars → star/stars/stares/starry — all real words), `PLURAL_SPELLING_CONTEXT` (sentence cloze), L2 `PLURAL_ERROR_SPOT` ("Which word is written wrong? — the sanctioned home for developmental errors") + `PLURAL_PRODUCTION` (type/build: one fox, two ___).

**Bank.** L1: 3 × 8 = 24 + R 12; L2: 4 × 6 = 24 + R 12. Total 72 (current 138 replaced).

---

## 20. Prefixes & Suffixes (`prefixes_suffixes`) — REBUILD (single-template today)

**Verified faults.** All 92 published items are one format (`MORPHEME_MEANING_CONTEXT`); 0/19 morphemes eligible; meanings mechanically literal ("careful = full of care").

**Units (morpheme-shaped, curated).** L1 suffixes (5): `-s/-es (verb)`, `-ing`, `-ed`, `-er (person who)`, `-ful`. L2 (6): `un-`, `re-`, `-less`, `-er/-est (compare)`, `-ly`, `pre-`. Family **D-small**.

**Formats — three, all required per unit.** `MORPHEME_BUILD` (jump + ing → ?, tiles/choices), `MORPHEME_MEANING_CONTEXT` (choose what *unlock* means in the sentence — meanings written as natural child glosses, not formula: "open it again"❌ for unlock — the gloss must be right: "open something that was locked"), `MORPHEME_TRANSFER` (L2: apply the morpheme to an unseen word the child has never been taught — the audit's transfer requirement: "If *redo* means do again, what does *refill* mean?").

**Bank.** L1: 5 × 6 (3 formats × 2 variants) = 30 + R 12; L2: 6 × 6 = 36 + R 12. Total 90 (replaces 92).

**Distractors.** `D-MORPH-LITERAL` (wrong-morpheme reading), `D-FUNCTION-SWAP`, opposite-morpheme trap (unlock ↔ relock in the same set = the discrimination that matters).

---

## 21. Antonyms & Synonyms (`antonyms_synonyms`) — SPLIT & REBUILD

**Verified faults.** 0/98 keys eligible; L1/L2 split 60/174 is quota noise; 46 L2 items are re-badged comprehension passages; current release-gate blocker.

**Units (relation × band).** L1 (4): `antonym_concrete` (big/little, hot/cold, up/down…), `synonym_concrete` (big/large, happy/glad…), `antonym_picture` (choose the opposite picture), `synonym_picture`. L2 (4): `antonym_precise` (whisper↔shout not talk), `synonym_shade` (closest in meaning among near-misses), `antonym_in_context`, `synonym_in_context` (sentence-embedded, ≤ 2 sentences — NOT full passages; the passage-format inflation dies here, C-2 construct purity). Family **D-small**.

**Formats.** `LANGUAGE_PAIR_TEXT_CHOICE` (kept, rewritten items), `GRAMMAR_IMAGE_CHOICE` (L1 picture pairs), `WORD_IN_SENTENCE_SWAP` (L2: "Pick the word that means the SAME as *begin* in: We begin school at nine." — start/end/like/near).

**The distractor law.** Every antonym item's set contains the true opposite (key), a same-category non-opposite (`D-TOPIC-ADJACENT`: for hot — warm), an unrelated same-POS word, and NEVER a synonym-of-key unless the format explicitly contrasts same-vs-opposite. Synonym items mirror it (key synonym, true ANTONYM as one distractor — the discrimination that proves the relation is understood, `D-OPPOSITE`).

**Bank.** L1: 4 × 6 = 24 + R 12; L2: 4 × 6 = 24 + R 12. Total 72 (current 234 → 72; the biggest single prune in the family).

---

## 22. Homophones & Homonyms (`homophones_homonyms`)

**Units (set-shaped).** L1 (8 homophone sets): `sea/see, sun/son, be/bee, no/know, one/won, ate/eight, hear/here, blue/blew`. L2 (8): `to/two/too, there/their, right/write, new/knew, hour/our, flower/flour, would/wood, made/maid`. Homonyms (bat/bat, ring/ring) become 2 recognition-only units at L2 (`nonGating: true`) — mixing the two constructs gated mastery today (0/46 eligible); the audit's set-shaped evidence key is exactly this design: `itemKey: "sea_see"`, not per-spelling.

**Formats.** L1 `HOMOPHONE_MEANING` (which word goes with the picture of the ocean — sea/see + 2 same-POS foils), L2 `HOMOPHONE_CONTEXT_CLOZE` (kept — the good format: "We saw a ship on the ___." sea/see/seat/say). Each set's variants must use ≥2 different natural contexts per spelling (the audit's "multiple natural contexts").

**Bank.** L1: 8 × 3 = 24 + R 12; L2: 8 × 3 + 2 homonym exposure ×2 = 28 + R 12. Total 76 (current 116 pruned/rebuilt; the 70 cloze items are the strongest salvage pool in this family).

**Distractors.** The paired homophone (mandatory — it IS the construct), `D-VISUAL-NEIGHBOR` real word, `D-FUNCTION-SWAP`. `L-CLOZE-FIT` relaxed for the homophone itself (it may be ungrammatical in frame — that's the point) but the two fillers must parse.
