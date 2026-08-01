# Blueprints — Comprehension (skills 23–30)

**Standard.** Sentence Comprehension, Key Details, Sequencing, Main Idea, Inference, Cause & Effect, Context Clues, Theme. Read MASTERY_SYSTEM.md + AUTHORING_STANDARDS.md first. This family is the product's template-inflation ground zero (Main Idea: 92 passages → 2 skeletons; six-item rotations everywhere except Key Details) and is rebuilt with **every passage individually written**.

---

## Family-wide rules

**Rule family C (cells).** Units are cells = `textType × focus`. A cell passes on 2 correct · 2 distinct passages · 2 days · latest correct (MASTERY_SYSTEM §3.2). Sitting = 8. Level pass adds ≥16 scored · ≥85% · latest sitting ≥80%.

**Text types.** `fiction` (narrative with characters), `info` (simple informational/how-things-work), `everyday` (school/home scene, no plot arc). Every level's cell grid spans ≥2 text types — the current banks are 100% same-flavor narrative.

**Passage law.**
1. Written one at a time, single-use (O-6), unique topic registry per skill (no two passages share topic+setting; a `topics.md` sidecar per skill lists every used topic — collision = rewrite).
2. L1: 30–60 words, 1 clear paragraph, sentence ≤ 9 words. L2: 70–110 words, may span 2 paragraphs, sentence ≤ 12 words (`L-READ`).
3. L2 difficulty comes from the **reasoning**, never length alone: two-step inference, competing plausible candidates, information split across sentences, mild misdirection a careful reader resolves. Every L2 item's author note names its added demand (O-3).
4. Names/settings draw from a 60-name diverse roster with no name reused within a skill+level; cultural load screened (ESL rules).
5. Question independence: the item must be unanswerable without the passage (SIM-SCANNER strategy 5 guard: key never lexically copies a passage phrase unless all four options do).

**Distractors.** From the comprehension codes (§4 of AUTHORING_STANDARDS): every item carries ≥2 of `D-DETAIL-AS-MAIN / D-TOPIC-ADJACENT / D-SEQUENCE-SWAP / D-CAUSE-REVERSE / D-PLAUSIBLE-UNSUPPORTED / D-OPPOSITE`; register-matched (no "very sleepy / silly and giggly" filler — `L-DIST-REGISTER`).

**Bank per skill (uniform).** Per level: 3 sitting-forms × 8 + form R 8 = **32 items = 32 passages**. Per skill: **64**. Family total: 512 authored passages (the honest price of killing the template mill; Key Details salvages ~half of its existing 93).

**Media.** Whole family ships `mediaTier: "text"` (an optional scene image may illustrate L1 fiction but must never carry answer information — C-2 lint strips images and re-checks answerability).

---

## 23. Sentence Comprehension (`sentence_comprehension`)

**Construct.** Extract meaning from ONE sentence (bridge skill: decoding → passage comprehension).

**Cells.** L1: `literal_who_what × 2 textTypes`, `literal_where_when`, `picture_match` (choose the sentence that matches the scene) — 4 cells. L2: `two_clause` (because/so/but sentences), `pronoun_reference` (who does *she* mean?), `best_restatement` (which says the same thing?) — 3 cells.

**Passage = the sentence** (8–14 words L1, 12–18 L2). The current L1+stock-sentence→L2 cloning (46 duplicate pairs) dies; L2 cells are structurally different tasks, not longer L1s.

**Exemplar (L2 pronoun_reference).**
```json
{"id":"lp3.sentence_comprehension.l2.A.pronoun_reference.v1","cell":"fiction.pronoun_reference",
 "passage":"Maya handed the brush to Elena because she wanted the fence painted blue.",
 "prompt":"Who wanted the fence painted blue?",
 "choices":[{"text":"Maya","isKey":true,"rationale":"KEY"},{"text":"Elena","isKey":false,"rationale":"D-PLAUSIBLE-UNSUPPORTED"},
 {"text":"the painter","isKey":false,"rationale":"D-TOPIC-ADJACENT"},{"text":"the fence owner","isKey":false,"rationale":"D-TOPIC-ADJACENT"}],
 "answer":"Maya","notes":"two-step: resolve 'she' against handing-direction"}
```

## 24. Key Details (`key_details`)

**Status: KEEP & RETAG.** The one genuinely authored bank (93/93 distinct skeletons, verified). Work: map each existing item into cells (`fiction/info/everyday × who/what/where/when/how-many`), fill empty cells with new passages, split into forms, trim to the 64-item structure keeping the strongest, apply distractor-rationale tags, run all lints (expect real attrition — some items will fail `L-READ` or register rules; replace those). No wholesale rewrite.

**Cells.** L1: `who`, `what_happened`, `where`, `number_detail` (4). L2: `detail_across_sentences` (answer assembled from 2 sentences), `which_is_NOT` (verified negative — careful-reading pressure), `precise_detail` (distractors differ by one attribute) (3).

## 25. Sequencing (`sequencing`)

**Construct.** Order and ordinal language over events with real temporal/causal structure. The six rotating action-chains die.

**Cells.** L1: `first_event`, `last_event`, `middle_event` × fiction/everyday (explicit ordinal wording per instructional standards — never bare "next" on an unfinished sequence). L2: `before_after_relation` ("What happened right BEFORE the cake fell?"), `implied_order` (steps described out of narrative order — reader reconstructs), `process_order` (info text: how a seed grows).

**Craft.** Every passage's events must have a necessary order (causal or conventional), not arbitrary lists — `D-SEQUENCE-SWAP` distractors only bite when order is meaningful. Each L1 passage: exactly 3 orderable events; L2: 4.

## 26. Main Idea (`main_idea`)

**Construct.** Distinguish what a text is mostly about from its details and its topic. Current bank = 2 skeletons × 92 → total rebuild.

**Cells.** L1: `mostly_about × fiction/info/everyday` (3). L2: `best_title`, `main_idea_vs_detail` (four true statements, one is the POINT), `summary_choice` (which one-sentence summary fits) (3).

**Distractor law (the whole skill lives here).** Every set = one true detail (`D-DETAIL-AS-MAIN`), one topic-word overreach (`D-TOPIC-ADJACENT`: right nouns, wrong claim/too broad), one text-contradicted or unrelated (`D-OPPOSITE`/unrelated ≤1). The key never contains the passage's most-repeated content word unless a distractor does too.

## 27. Inference (`inference`)

**Construct.** Conclude what the text implies but never states. The six-emotion rotation with "very sleepy" filler dies.

**Cells.** L1: `feeling_from_evidence` (feeling never named; ≥2 behavioral clues), `where_am_I` (setting inference from details), `what_happens_next` (strongly cued prediction) (3). L2: `why_did_they` (motive from behavior), `what_went_unsaid` (event inference from aftermath: wet umbrella by the door), `evidence_pick` ("Which words in the story tell you Marco was nervous?" — the justification format the audit asked for) (3).

**Craft.** Feelings vocabulary spans ≥12 states across the level (proud, worried, disappointed, relieved, curious, embarrassed, patient, frustrated…), distractors are **competing plausible interpretations** killed by a specific clue — the author note must name the clue that eliminates each distractor.

## 28. Cause & Effect (`cause_effect`)

**Construct.** Link causes to effects in text. Six rotating cause-pairs die.

**Cells.** L1: `find_effect` (cause given), `find_cause` (effect given), `because_sentence` (complete/identify the causal link) (3). L2: `chain` (A→B→C, ask about the middle link), `multiple_causes` (two contributing causes, ask which is NOT one), `reversal_trap` (distractors swap cause and effect — `D-CAUSE-REVERSE` mandatory) (3).

**Craft.** Causal mechanisms must be genuinely diverse across passages (physical, social, biological, weather, mechanical…) — the topic registry enforces spread. No "it rained so the game stopped" appearing 15 times in costume.

## 29. Context Clues (`context_clues`)

**Construct.** Work out an unfamiliar word's meaning from surrounding text. Six rotating targets die; every passage has its own target word.

**Cells = clue types** (audit's list, verbatim): L1: `definition_clue` (text defines it), `example_clue` (examples reveal it), `picture_of_meaning` (sentence action shows it) (3). L2: `synonym_clue`, `antonym_contrast_clue` ("unlike her tidy brother, Rosa was ___-ish"), `inference_clue` (meaning assembled from consequences) (3).

**Craft.** Target words: real, tier-2, one per passage, never from the K-2 familiar list (the sanctioned C-5 exception), never repeated within a level. Key = child-worded meaning; distractors = plausible wrong meanings that fit grammatically (`D-PLAUSIBLE-UNSUPPORTED` ×2). Passage must contain sufficient clue — reviewer test: cover the target, the meaning is still recoverable.

## 30. Theme (`theme_higher_comprehension`)

**Construct.** Lesson/message of a COMPLETE story arc. Six rotating lessons die.

**Cells.** L1: `lesson_learned` (character visibly learns; 3 textTypes→fiction only but 3 arc types: mistake-fixed, kindness-returned, effort-pays) (3). L2: `theme_among_rivals` (two morally plausible themes; evidence across the WHOLE passage picks one), `theme_vs_plot` (distractors are plot summaries — theme≠what-happened discrimination), `apply_theme` ("Which new situation shows the same lesson?" — transfer) (3).

**Craft.** L2 passages need a real arc (setup → tension → resolution) in ≤110 words — the hardest writing in the rebuild; budget it (PLAN wave W2 gives Theme its own chunk cadence: 4 passages per chunk, not 8). Theme statements are concrete child-morals ("ask for help when a job is too big"), never abstract nouns ("perseverance"); banned-list: the current six lessons may each appear at most twice per level, phrased fresh.

---

## Family DoD addition

Beyond the standard gates: generate editorial and measurement evidence in the review pack, and run the cross-skill topic-registry check (no passage topic reused across the 8 skills' passages — the registry is one shared file). Named human sign-off is optional rather than a universal publication gate.
