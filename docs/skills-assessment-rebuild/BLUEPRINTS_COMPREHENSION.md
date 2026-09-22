# Blueprints — Comprehension (skills 23–30)

**Standard.** Sentence Comprehension, Key Details, Sequencing, Main Idea, Inference, Cause & Effect, Context Clues, Theme. Read MASTERY_SYSTEM.md + AUTHORING_STANDARDS.md first. Every passage is individually written. The active authoring files and shared v3 runtime define the current corpus; historical pre-rebuild counts are not deployment evidence.

---

## Family-wide rules

**Rule family C (cells).** Units are cells = `textType × focus`. A cell passes on 2 correct · 2 distinct passages · 2 days · latest correct (MASTERY_SYSTEM, Evidence units). Sitting = 8. Phase progression uses the one shared 70% rule; cell evidence supports teacher detail and review rather than adding another level-pass threshold.

**Text types.** `fiction` (narrative with characters), `info` (simple informational/how-things-work), `everyday` (school/home scene, no plot arc). Every level's cell grid spans ≥2 text types — check the actual cell labels against each passage, rather than assuming that a story-like paragraph is informational text.

**Passage law.**
1. Written one at a time, single-use (O-6), unique topic registry per skill (no two passages share topic+setting; a `topics.md` sidecar per skill lists every used topic — collision = rewrite).
2. L1: 30–60 words, 1 clear paragraph, sentence ≤ 9 words. L2: 70–110 words, may span 2 paragraphs, sentence ≤ 12 words (`L-READ`).
3. L2 difficulty comes from the **reasoning**, never length alone: two-step inference, competing plausible candidates, information split across sentences, mild misdirection a careful reader resolves. Every L2 item's author note names its added demand (O-3).
4. Names/settings draw from a 60-name diverse roster with no name reused within a skill+level; cultural load screened (ESL rules).
5. Question independence: the item must be unanswerable without the passage (SIM-SCANNER strategy 5 guard: key never lexically copies a passage phrase unless all four options do).

**Distractors.** Every alternative has the accurate semantic code from AUTHORING_STANDARDS §4, with comparable language/register. Multiple alternatives may diagnose the same misconception; two different code labels are not themselves evidence of quality. Negative questions use `D-SUPPORTED-DETAIL` for true facts incorrectly selected as missing, and causal-chain questions use `D-CAUSE-STEP` for a real event at the wrong link. Do not relabel true evidence as unsupported. No automated register classifier replaces literal editorial review.

**Bank per skill (uniform).** Each level has 32 ordinary items: 16 per phase, enough for an eight-item initial sitting and a fresh eight-item retry. Eight additional Level-specific reserve items use form R. That is **40 per level, 80 per skill, 640 across the family**. Runtime ordinary forms A/B/C are identity/distribution labels; the full sitting is composed for the requested phase. Reserves never fill an ordinary retry.

**Media.** Passage-based items supply readable text and replayable recordings under their explicit reviewed media decisions. Sentence Comprehension picture-match/visual-detail cells require the actual scene: here the scene is scored evidence and cannot be removed. Optional support must not supply a shortcut to an otherwise text-based key. Use the current Question Design Bible §9 and the exact item-media registry; neither decoration nor a blanket text-only declaration substitutes for required evidence.

---

## 23. Sentence Comprehension (`sentence_comprehension`)

**Construct.** Extract meaning from ONE sentence (bridge skill: decoding → passage comprehension).

**Cells.** L1: `literal_who_what × 2 textTypes`, `literal_where_when`, `picture_match` (choose the sentence that matches the scene) — 4 cells. L2: `two_clause` (because/so/but sentences), `pronoun_reference` (who does *she* mean?), `best_restatement` (which says the same thing?) — 3 cells.

**Passage = the sentence** (8–14 words L1, 12–18 L2). The current L1+stock-sentence→L2 cloning (46 duplicate pairs) dies; L2 cells are structurally different tasks, not longer L1s.

**Exemplar (L2 pronoun_reference).**
```json
{"id":"lp3.sentence_comprehension.l2.A.pronoun_reference.v1","cell":"everyday.pronoun_reference",
 "passage":"Sam put the jug beside the cups before filling it with cold water.",
 "prompt":"Which item did Sam fill?",
 "choices":[{"text":"the jug","isKey":true,"rationale":"KEY"},{"text":"the cups","isKey":false,"rationale":"D-OPPOSITE"},
 {"text":"a bottle","isKey":false,"rationale":"D-PLAUSIBLE-UNSUPPORTED"},{"text":"a bowl","isKey":false,"rationale":"D-PLAUSIBLE-UNSUPPORTED"}],
 "answer":"the jug","notes":"Resolve singular it to jug despite the nearer plural cups; connect the reference to the filling action."}
```

## 24. Key Details (`key_details`)

**Authoring.** Classify each passage by its actual text type and question demand. Preserve useful independent contexts, strengthen weak evidence and alternatives, and meet the current 80-item inventory and passage lengths. Recheck every completed task after revision.

**Cells.** L1: `who`, `what_happened`, `where`, `number_detail` (4). L2: `detail_across_sentences` (answer assembled from 2 sentences), `which_is_NOT` (verified negative — careful-reading pressure), `precise_detail` (distractors differ by one attribute) (3).

## 25. Sequencing (`sequencing`)

**Construct.** Order and ordinal language over events with real temporal/causal structure. The six rotating action-chains die.

**Cells.** L1: `first_event`, `last_event`, `middle_event` × fiction/everyday (explicit ordinal wording per instructional standards — never bare "next" on an unfinished sequence). L2: `before_after_relation` ("What happened right BEFORE the cake fell?"), `implied_order` (steps described out of narrative order — reader reconstructs), `process_order` (info text: how a seed grows).

**Craft.** Every passage's events must have a necessary order (causal or conventional), not arbitrary lists — `D-SEQUENCE-SWAP` distractors only bite when order is meaningful. Each L1 passage: exactly 3 orderable events; L2: 4.

## 26. Main Idea (`main_idea`)

**Construct.** Distinguish what a text is mostly about from its details and its topic. Current bank = 2 skeletons × 92 → total rebuild.

**Cells.** L1: `mostly_about × fiction/info/everyday` (3). L2: `best_title`, `main_idea_vs_detail` (whole-text point versus details and plausible misreadings), `summary_choice` (which one-sentence summary fits) (3).

**Distractor law.** Apply Question Design Bible §10.7: true details may be alternatives, but none may also summarize the whole text. Choose plausible details, topic overreach or evidence-contradicted readings to fit the actual passage, with accurate rationale codes. Do not force an unrelated alternative or a fixed code quota. Reject word-overlap and length shortcuts in the final rendered choices.

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
