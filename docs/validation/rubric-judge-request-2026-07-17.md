# Content rubric — LLM-as-judge request · 2026-07-17

**How to run:** paste this whole document into Claude. It will return ONE JSON
array of verdicts. Save that array as
`docs/validation/rubric-judge-verdict-2026-07-17.json` and commit both files.
Score each ITEM against each applicable criterion; skip criteria whose
Conditional column doesn't match the item's grade/subject.

Sample: 40 items, deterministic stride across 3 runtime banks.

---

## Judge system prompt (verbatim, tools/rubrics/judge-prompt.txt)

```
You are a rigorous educational content evaluator. Your job is to assess whether
AI-generated lesson plan documents meet specific rubric criteria.

You will receive:
  1. The lesson-plan documents as attached files.
  2. The model's final chat response (the text it sent back to the user).
  3. A rubric with criteria to judge against.

Grading rules:
  - Judge criteria in the `M` (Model Scaffolding) bucket against the chat
    response. Judge all other criteria against the attached documents — the
    content must actually be present in the documents, not merely claimed in
    the chat response.
  - Pass means the criterion is clearly and fully met. Fail means it is absent,
    incomplete, or only partially met.

Respond ONLY with a valid JSON array — no preamble, no markdown fences, no
trailing text. Each element: {"id": "...", "pass": true|false,
"explanation": "one sentence"}.
```

## Rubric — shared criteria (tools/rubrics/shared.csv)

```csv
ID,Bucket,Criterion,What pass requires,Notes,Conditional
P1,P — Pedagogy,Standard named verbatim,"The target standard appears as the full standard text in the lesson plan header — a complete standard statement, not a bare code, an abbreviation, or a paraphrase. Wherever the standard is restated in any artifact, the wording matches the header word-for-word. Pass = full text in header and consistent verbatim usage throughout. Fail = code-only citation, paraphrase, or wording that drifts between header and body.",,
P2,P — Pedagogy,Prerequisite / prior standard named,"A prior standard or explicitly named prerequisite concept is identified with enough specificity that a teacher knows what prior knowledge to check. Pass = a named standard code (e.g., '3.NF.1') or a specific skill description (e.g., 'students can solve result-unknown addition within 20'). Fail = vague reference (e.g., 'students should have some background in fractions').",,
P3,P — Pedagogy,Learning goal separates Big Idea from SWBAT,"The lesson distinguishes between an enduring understanding (Big Idea) and specific observable student behaviors (SWBAT - students will be able to""). Pass = two distinct components. Fail = one merged statement like 'students will learn about fractions'.""",,
P4a,P — Pedagogy,Anticipated challenges — minimum count,At least 3 misconceptions or anticipated challenges are named. Pass = 3 or more entries. Fail = fewer than 3.,,
P4b,P — Pedagogy,Anticipated challenges — each entry is complete,"Each challenge entry names (a) what students do, (b) why it happens, and (c) a specific teacher move. Pass = all three components present in every entry. Fail = any entry is missing a component, or teacher moves are generic ('re-teach', 'check for understanding').",,
P5,P — Pedagogy,Lesson phases present and sequenced correctly,"The lesson has a recognizable instructional arc appropriate to the domain with time allocations on each phase. Pass = all required phases present with times. Fail = phases missing, merged, or unlabeled.",,
P6a,P — Pedagogy,Look-fors — minimum count,At least 3 look-fors are named for the main practice or work phase. Pass = 3 or more entries. Fail = fewer than 3.,,
P6b,P — Pedagogy,Look-fors — each entry describes observable student behavior,"Each look-for describes a specific observable student behavior — what the teacher is watching for — explains why it matters, and gives a teacher move. Additionally, FIRST classify the anchor task yourself: does it genuinely admit multiple correct responses (e.g., several valid equations or interpretations can fit)? Only if it does, the look-fors must also include explicit guidance that multiple correct responses can match the anchor task; if the anchor has a single correct answer this requirement is waived — do NOT fail for missing multi-correct guidance. State your classification in the explanation. Fail = any look-for reads as a teacher instruction ('circulate and check for understanding') rather than an observable student behavior, or required multi-correct guidance is absent.",,
P7,P — Pedagogy,Visual scaffolds with rationale,"Visual or representational choices are pedagogically informed WITH stated rationale — e.g., a drawing-first option, an intentional choice not to pre-print a diagram, or guidance on when to introduce a visual model and why. Pass = at least one visual or representational choice with explicit reasoning. Fail = visuals appear without rationale, or no visual/representational thinking is evident in the plan.",,
P8,P — Pedagogy,Student engagement hook,"At least one task is designed to generate genuine student curiosity or interest — an unexpected or novel context, an open-ended question, a real-world scenario students would care about, or productive-struggle design. A generic word problem or comprehension task does not count; there must be a deliberate hook. Not every task needs this quality — one is sufficient.",,
P9,P — Pedagogy,Timing is realistic,"The work assigned in each phase is plausibly completable in the allotted minutes by students at this grade level. Count the tasks in each phase and estimate minutes per task. Pass = every phase's workload fits its time. Fail = any phase assigns clearly more work than its time allows (e.g., 12 problems in a 20-minute block that also includes discussion).",,
R1,R — Rigor,Grade-level demand is maintained,"No scaffolding in the lesson reduces the cognitive demand below the standard's level. Supports provide access without simplifying the task. Pass = all student work targets the standard's complexity. Fail = problems are simplified to below-grade content, or the hardest part of the standard is avoided.",,
R2,R — Rigor,At least one task demands student reasoning,"A student who only memorizes or follows steps cannot complete at least one task. Pass = one or more tasks require explanation, justification, comparison, or argumentation. Fail = every task is recall or procedural with a single right answer.",,
R3,R — Rigor,Exit ticket targets the hardest case,"The exit ticket targets the structurally hardest version of the standard — not the easiest. FIRST determine the standard's structurally hardest case yourself (e.g., start-unknown for operations word problems, counterclaim handling for argument writing, mechanism-level reasoning for explanatory models). THEN classify the exit-ticket task: quote it and state which case or demand it targets. Pass only if the two match. Show both classifications in the explanation.",,
R4,R — Rigor,Student agency prompt on worksheet,"The student-facing worksheet itself includes at least one prompt inviting student reasoning or choice: a self-assessment question, a reflection prompt, an open-ended extension, or a 'show/explain your thinking' prompt attached to a task (these count even when embedded in task items). Teacher-led discussion prompts in the lesson plan do NOT count. Judge the student materials only.",,
O2,O — Output / Formatting,Student materials contain no teacher-only content,"Student-facing materials contain no teacher-only content: no look-fors, no misconception or points-of-difficulty notes, no assessment rationale, no answer keys, no instructions directed at the teacher ('the teacher places…', 'circulate and…'), no stage directions written TO the teacher ('Show…', 'Display…', 'Read aloud…', 'Distribute…'), and no third-person narration of student activity ('Students work in pairs…', 'Students blend the sounds…'). Scaffolding addressed TO STUDENTS in second person (hints, 'Remember:' reminders, sentence frames, worked examples) is student content and is fine — do NOT fail for it. Judge the student materials only; content in the lesson plan or observation sheet is irrelevant here.",,
O3,O — Output / Formatting,Observation template rows are usable in the field,"Row labels are specific student behaviors traceable to SWBAT ('student will be able to') — not generic phase names — and each row has adequate writing space. Pass = behavior-specific labels and sufficient writing space throughout. Fail = rows labeled 'Phase 1 / Phase 2', or table is so compressed a teacher couldn't write in it.",,
O3b,O — Output / Formatting,Observation template exit ticket section is present and specific,"The observation template includes exit ticket sort buckets with explicit criteria for each bucket (e.g., what a 'got it' response looks like vs. a 'not yet' response). Pass = sort buckets present with specific distinguishing criteria. Fail = exit ticket section absent, or buckets present but unlabeled / undifferentiated.",,
O4,O — Output / Formatting,Lesson plan is concise and scannable,Teacher-facing plan uses clear headers and the instructional sequence is findable at a glance — a teacher can locate the next action within 10 seconds of scanning the page. Pass = action sequence is visually distinct from rationale. Fail = instructional steps are embedded in paragraphs of rationale so that the sequence isn't findable without reading closely.,,
O5,O — Output / Formatting,Universal Design access features,"At least two Universal Design representation features are present in the base materials, such as: sentence stems or frames, clarification of symbols and vocabulary, multiple forms of representation (visual + symbolic + verbal), a culturally open task context, or choice in how students show their work. Name the features found in the explanation.",,
O6,O — Output / Formatting,Teacher and student materials describe the same tasks,"The student materials' tasks ARE the same tasks the lesson plan describes — same contexts, same numbers and specifics, same count — and the observation sheet's look-fors are the ones the lesson plan names. Direction 1: every activity named in the plan has a corresponding student-facing version. Direction 2: nothing in the student materials is unaccounted for in the plan. List every mismatch found; pass only if BOTH directions are clean.",,
O7,O — Output / Formatting,Teacher adaptation rationale notes,"The lesson plan includes one or two brief rationale notes identifying which elements must be PRESERVED to maintain alignment and rigor (non-negotiables such as curriculum sequence, grade-level demand, discourse structure) and why. Generic praise ('this lesson is well-structured') does not count.",,
O8,O — Output / Formatting,Outputs are specific not generic,"Misconceptions, look-fors, and prerequisite references are specific to this standard's content — a reader could not transplant them unchanged to an unrelated topic. The standard text quoted in body text matches the header word-for-word wherever it appears. Fail = boilerplate misconceptions ('students may get confused'), generic look-fors, or a standard subtly reworded between header and body.",,
O9,O — Output / Formatting,Narrative coherence across artifacts,"Contexts, names, numbers, grade level, and timing references agree across all artifacts. No artifact narrates a context, example, or task that the others do not have. Judge all artifacts together.",,
O10,O — Output / Formatting,No contradictions across artifacts,"No conflicting counts, durations, units, instructions, or directions between any two artifacts. Quote any contradiction found in the explanation.",,
O11,O — Output / Formatting,Lesson plan is internally consistent,"The plan never contradicts itself about which task or case is hardest; discussion and closing phases anchor on the case the rationale identifies as most important; and any task types the prose promises (e.g., 'students will work start-unknown problems') actually exist in the materials. Fail = the plan promises content that never appears, or different sections disagree about emphasis.",,
O12,O — Output / Formatting,Closing phase introduces nothing new,"Every concept, case, or notation appearing in the synthesis/closing phase was investigated by students in an earlier phase. Nothing appears for the first time in the closing. Fail = the summary introduces a case, term, or representation students never worked with.",,
M3,M — Model Scaffolding,Follow-up options offered,"After delivering the lesson plan, the model offers at least two meaningful follow-up options (e.g., differentiation, multi-lingual learner layer, state-specific adaptation). Pass = two or more specific options. Fail = none, or options are generic ('let me know if you want changes').",,
M5,M — Model Scaffolding,No curriculum-specific terminology for non-curriculum teachers,For teachers who did not indicate they use a named curriculum (IM etc.): the lesson plan contains no proprietary terminology from a specific program. Pass = no curriculum-specific language for teachers without that curriculum signal. Fail = any curriculum-proprietary term appears in output for a teacher who didn't indicate that curriculum.,,
O13,O — Output / Formatting,Information density,"Artifacts favor structure over prose: paragraphs stay within roughly 3 sentences; parallel content (per-group supports, per-phase variants, look-fors) appears in tables or bullet lists rather than stacked multi-sentence paragraphs; bullets are one-idea fragments rather than chained clauses. Fail = any wall-of-text paragraph or parallel variants written as back-to-back prose paragraphs.",,
O14,O — Output / Formatting,Writing space matches demand,"Every student-facing prompt that demands written work (problems, exit ticket, reflection) is followed by visible blank writing space proportionate to the expected response and grade level — younger students get more room, multi-sentence answers get generous space, fill-in items get a line or two. Fail = any prompt with no adjacent writing space or space plainly too small for the expected response.",,
P10,P — Pedagogy,Standards economy,"The target standard's full text appears exactly once (header or standards callout). Prerequisite and forward standards are referenced by code plus a short gist, never pasted in full. Fail = the full target standard repeated elsewhere, or prerequisite/forward standard text quoted verbatim.",,
O15,O — Output / Formatting,Document set fits the lesson,"The package contains a lesson plan and student materials. Student materials may be absent only when the lesson is genuinely oral or teacher-led end to end AND the lesson plan says so plainly (this is rare — when in doubt, student materials should exist). Documents beyond the standard set (lesson plan, student materials, observation template) — a source packet, a data sheet — are used by a lesson phase. Fail = no student materials without an explicit oral-lesson rationale in the plan, or an extra document no phase uses. The observation template never fails this criterion.",,
```

## Rubric — ELA overlay (tools/rubrics/ela.csv)

```csv
ID,Bucket,Criterion,What pass requires,Notes,Conditional
P-E1,P — Pedagogy,Anchor text is grade-level complex,"Text selected or suggested falls within the Common Core State Standards for ELA Lexile band for the grade. Pass = Lexile confirmed within grade band (e.g., 740–1010L for grade 6), or a [suggested] flag with a plausible estimate. Fail = text described as 'accessible' or 'adapted for accessibility' with no Lexile provided, or text clearly below the grade band.",Lexile is a quantitative score. Ideally texts are also evaluated against qualitative measures of complexity.,comprehension
P-E2,P — Pedagogy,Discussion demands analysis not summary,"Grades 6-12: at least two discussion questions require students to make an arguable claim about the text (e.g., how the author develops an idea, why a word choice matters) rather than retrieve a fact. Grades 3-5: at least one question moves beyond literal retrieval (e.g., a key-detail inference or vocabulary-in-context question). Grades K-2: pass when discussion questions are text-dependent and grade-appropriate (key details, vocabulary, simple inference); the analytical-claim bar does not apply. Fail (any grade) = every question is personal response with no text dependence. Infer the grade band from the standard or prompt.",,comprehension
P-E3,P — Pedagogy,Writing task requires text-dependent evidence,"The writing prompt cannot be answered from prior knowledge or personal opinion alone — students must cite or paraphrase the text. Pass = prompt specifies text evidence required. Fail = prompt is answerable without reading (e.g., 'write about a time you felt…').",,comprehension
P-E4,P — Pedagogy,No three-cueing strategies,"The lesson contains no instruction to use picture cues, context cues, or initial-letter prompting to identify unknown words. Pass = these strategies are absent. Fail = any mention of these strategies, however framed.",Only applies to K–2 phonics lessons,K-2-phonics
P-E5,P — Pedagogy,Decodable text used for phonics practice,The student-facing phonics practice text uses only phonics patterns already taught plus known high-frequency words. Pass = decodable text specified. Fail = leveled or predictable text used as the decoding vehicle.,Only applies to K–2 phonics lessons,K-2-phonics
P-E6,P — Pedagogy,Counterclaim required in argument writing prompt,For grade 8+ argument writing tasks: the writing prompt explicitly requires acknowledgment of a counterclaim. Pass = counterclaim required in the prompt. Fail = argument task with no counterclaim requirement for grades 8 and above.,Only applies to Gr 8+ argument writing tasks,Gr8+-argument-writing
R-E1,R — Rigor,Student writes before speaking in every discussion,"Every discussion round is preceded by a written formulation step (Think-Write-Pair-Share, quick-write, or equivalent). Pass = every discussion in the lesson plan includes a write-first step. Fail = any whole-class discussion launches without a prior individual writing step.",,comprehension
```

## Items under review

```json
[
 {
  "source": "languageSkillQuestions.generated.js",
  "id": "workbook_nouns_apple_0",
  "grade": null,
  "skill": "nouns",
  "passage": null,
  "question": "Choose the word that fits the sentence.",
  "choices": [
   "apple",
   "cup",
   "book",
   "ball"
  ],
  "answer": "apple"
 },
 {
  "source": "languageSkillQuestions.generated.js",
  "id": "workbook_nouns_pencil_83",
  "grade": null,
  "skill": "nouns",
  "passage": null,
  "question": "Choose the word that fits the sentence.",
  "choices": [
   "pencil",
   "cup",
   "book",
   "ball"
  ],
  "answer": "pencil"
 },
 {
  "source": "languageSkillQuestions.generated.js",
  "id": "workbook_verbs_make_166",
  "grade": null,
  "skill": "verbs",
  "passage": null,
  "question": "Choose the word that fits the sentence.",
  "choices": [
   "make",
   "clap",
   "wash",
   "brush"
  ],
  "answer": "make"
 },
 {
  "source": "languageSkillQuestions.generated.js",
  "id": "workbook_verbs_label_249",
  "grade": null,
  "skill": "verbs",
  "passage": null,
  "question": "Choose the word that fits the sentence.",
  "choices": [
   "label",
   "grow",
   "help",
   "hide"
  ],
  "answer": "label"
 },
 {
  "source": "languageSkillQuestions.generated.js",
  "id": "workbook_adjectives_white_332",
  "grade": null,
  "skill": "adjectives",
  "passage": null,
  "question": "Choose the adjective that fits the sentence.",
  "choices": [
   "white",
   "sticky",
   "noisy",
   "sour"
  ],
  "answer": "white"
 },
 {
  "source": "languageSkillQuestions.generated.js",
  "id": "workbook_prepositions_in_17",
  "grade": null,
  "skill": "prepositions_of_place",
  "passage": null,
  "question": "Choose the word that fits the sentence.",
  "choices": [
   "under",
   "out of",
   "on",
   "in"
  ],
  "answer": "in"
 },
 {
  "source": "languageSkillQuestions.generated.js",
  "id": "workbook_prepositions_below_100",
  "grade": null,
  "skill": "prepositions_of_place",
  "passage": null,
  "question": "Choose the word that fits the sentence.",
  "choices": [
   "below",
   "between",
   "behind",
   "in front of"
  ],
  "answer": "below"
 },
 {
  "source": "languageSkillQuestions.generated.js",
  "id": "workbook_prepositions_into_183",
  "grade": null,
  "skill": "prepositions_of_place",
  "passage": null,
  "question": "Choose the word that fits the sentence.",
  "choices": [
   "across",
   "into",
   "around",
   "through"
  ],
  "answer": "into"
 },
 {
  "source": "languageSkillQuestions.generated.js",
  "id": "workbook_plurals_chair_66",
  "grade": null,
  "skill": "plurals",
  "passage": null,
  "question": "Choose the plural of chair.",
  "choices": [
   "doors",
   "windows",
   "chairs",
   "tables"
  ],
  "answer": "chairs"
 },
 {
  "source": "languageSkillQuestions.generated.js",
  "id": "workbook_prefix_misspell_47",
  "grade": null,
  "skill": "prefixes_suffixes",
  "passage": null,
  "question": "Choose the prefix in misspell.",
  "choices": [
   "tri-",
   "mis-",
   "non-",
   "bi-"
  ],
  "answer": "mis-"
 },
 {
  "source": "languageSkillQuestions.generated.js",
  "id": "workbook_suffix_landed_28",
  "grade": null,
  "skill": "prefixes_suffixes",
  "passage": null,
  "question": "Choose the suffix in landed.",
  "choices": [
   "-ed",
   "-ful",
   "-less",
   "-ness"
  ],
  "answer": "-ed"
 },
 {
  "source": "languageSkillQuestions.generated.js",
  "id": "workbook_suffix_statement_111",
  "grade": null,
  "skill": "prefixes_suffixes",
  "passage": null,
  "question": "Choose the suffix in statement.",
  "choices": [
   "-ing",
   "-ment",
   "-es",
   "-ed"
  ],
  "answer": "-ment"
 },
 {
  "source": "languageSkillQuestions.generated.js",
  "id": "workbook_antonym_healthy_71",
  "grade": null,
  "skill": "antonyms_synonyms",
  "passage": null,
  "question": "Choose a word that means the opposite of healthy.",
  "choices": [
   "bad",
   "sick",
   "lose",
   "good"
  ],
  "answer": "sick"
 },
 {
  "source": "languageSkillQuestions.generated.js",
  "id": "workbook_synonym_messy_154",
  "grade": null,
  "skill": "antonyms_synonyms",
  "passage": null,
  "question": "Choose a word that means the same as messy.",
  "choices": [
   "over",
   "above",
   "untidy",
   "below"
  ],
  "answer": "untidy"
 },
 {
  "source": "languageSkillQuestions.generated.js",
  "id": "approved_homophone_057",
  "grade": null,
  "skill": "homophones_homonyms",
  "passage": null,
  "question": "Choose the word that fits the sentence.",
  "choices": [
   "sail",
   "sale"
  ],
  "answer": "sail"
 },
 {
  "source": "rhyming.generated.js",
  "id": "gen_rhyme_at_cat_bat_0_0",
  "grade": null,
  "skill": "Rhyming",
  "passage": null,
  "question": "Which word rhymes with cat?",
  "choices": [
   "bat",
   "big",
   "cup",
   "dog"
  ],
  "answer": "bat"
 },
 {
  "source": "rhyming.generated.js",
  "id": "gen_rhyme_an_fan_can_1_1",
  "grade": null,
  "skill": "Rhyming",
  "passage": null,
  "question": "Which word rhymes with fan?",
  "choices": [
   "can",
   "cake",
   "fell",
   "big"
  ],
  "answer": "can"
 },
 {
  "source": "rhyming.generated.js",
  "id": "gen_rhyme_ap_gap_nap_3_1",
  "grade": null,
  "skill": "Rhyming",
  "passage": null,
  "question": "Which word rhymes with gap?",
  "choices": [
   "nap",
   "name",
   "goat",
   "dig"
  ],
  "answer": "nap"
 },
 {
  "source": "rhyming.generated.js",
  "id": "gen_rhyme_ag_tag_bag_1_0",
  "grade": null,
  "skill": "Rhyming",
  "passage": null,
  "question": "Which word rhymes with tag?",
  "choices": [
   "bag",
   "big",
   "tall",
   "fox"
  ],
  "answer": "bag"
 },
 {
  "source": "rhyming.generated.js",
  "id": "gen_rhyme_ad_pad_bad_4_0",
  "grade": null,
  "skill": "Rhyming",
  "passage": null,
  "question": "Which word rhymes with pad?",
  "choices": [
   "bad",
   "big",
   "pan",
   "lock"
  ],
  "answer": "bad"
 },
 {
  "source": "rhyming.generated.js",
  "id": "gen_rhyme_eg_egg_peg_1_1",
  "grade": null,
  "skill": "Rhyming",
  "passage": null,
  "question": "Which word rhymes with egg?",
  "choices": [
   "peg",
   "pin",
   "train",
   "up"
  ],
  "answer": "peg"
 },
 {
  "source": "rhyming.generated.js",
  "id": "gen_rhyme_in_pin_bin_0_2",
  "grade": null,
  "skill": "Rhyming",
  "passage": null,
  "question": "Which word rhymes with pin?",
  "choices": [
   "bin",
   "back",
   "peg",
   "clock"
  ],
  "answer": "bin"
 },
 {
  "source": "rhyming.generated.js",
  "id": "gen_rhyme_it_hit_pit_1_1",
  "grade": null,
  "skill": "Rhyming",
  "passage": null,
  "question": "Which word rhymes with hit?",
  "choices": [
   "pit",
   "pad",
   "hen",
   "clock"
  ],
  "answer": "pit"
 },
 {
  "source": "rhyming.generated.js",
  "id": "gen_rhyme_ot_dot_cot_2_2",
  "grade": null,
  "skill": "Rhyming",
  "passage": null,
  "question": "Which word rhymes with dot?",
  "choices": [
   "cot",
   "cup",
   "dog",
   "pan"
  ],
  "answer": "cot"
 },
 {
  "source": "rhyming.generated.js",
  "id": "gen_rhyme_un_bun_sun_3_0",
  "grade": null,
  "skill": "Rhyming",
  "passage": null,
  "question": "Which word rhymes with bun?",
  "choices": [
   "sun",
   "sack",
   "big",
   "red"
  ],
  "answer": "sun"
 },
 {
  "source": "rhyming.generated.js",
  "id": "gen_rhyme_ang_rang_bang_2_0",
  "grade": null,
  "skill": "Rhyming",
  "passage": null,
  "question": "Which word rhymes with rang?",
  "choices": [
   "bang",
   "bug",
   "red",
   "mop"
  ],
  "answer": "bang"
 },
 {
  "source": "rhyming.generated.js",
  "id": "gen_rhyme_ick_brick_kick_1_0",
  "grade": null,
  "skill": "Rhyming",
  "passage": null,
  "question": "Which word rhymes with brick?",
  "choices": [
   "kick",
   "king",
   "box",
   "hut"
  ],
  "answer": "kick"
 },
 {
  "source": "rhyming.generated.js",
  "id": "gen_rhyme_ell_well_fell_3_1",
  "grade": null,
  "skill": "Rhyming",
  "passage": null,
  "question": "Which word rhymes with well?",
  "choices": [
   "fell",
   "fin",
   "wag",
   "top"
  ],
  "answer": "fell"
 },
 {
  "source": "rhyming.generated.js",
  "id": "gen_rhyme_ide_hide_slide_2_1",
  "grade": null,
  "skill": "Rhyming",
  "passage": null,
  "question": "Which word rhymes with hide?",
  "choices": [
   "slide",
   "sack",
   "hen",
   "fin"
  ],
  "answer": "slide"
 },
 {
  "source": "rhyming.generated.js",
  "id": "gen_rhyme_ar_jar_car_2_0",
  "grade": null,
  "skill": "Rhyming",
  "passage": null,
  "question": "Which word rhymes with jar?",
  "choices": [
   "car",
   "cup",
   "jam",
   "wing"
  ],
  "answer": "car"
 },
 {
  "source": "hfwApprovedQuestionBank.generated.js",
  "id": "hfwApprovedQuestionBank.generated.js#0",
  "grade": null,
  "skill": "hfw_1_25",
  "passage": null,
  "question": "Read the sentence. Choose the word that fits.",
  "choices": null,
  "answer": null
 },
 {
  "source": "hfwApprovedQuestionBank.generated.js",
  "id": "hfwApprovedQuestionBank.generated.js#42",
  "grade": null,
  "skill": "hfw_1_25",
  "passage": null,
  "question": "Read the sentence. Choose the word that fits.",
  "choices": null,
  "answer": null
 },
 {
  "source": "hfwApprovedQuestionBank.generated.js",
  "id": "hfwApprovedQuestionBank.generated.js#84",
  "grade": null,
  "skill": "hfw_1_25",
  "passage": null,
  "question": "Read the sentence. Choose the word that fits.",
  "choices": null,
  "answer": null
 },
 {
  "source": "hfwApprovedQuestionBank.generated.js",
  "id": "hfwApprovedQuestionBank.generated.js#126",
  "grade": null,
  "skill": "hfw_1_25",
  "passage": null,
  "question": "Read the sentence. Choose the word that fits.",
  "choices": null,
  "answer": null
 },
 {
  "source": "hfwApprovedQuestionBank.generated.js",
  "id": "hfwApprovedQuestionBank.generated.js#168",
  "grade": null,
  "skill": "hfw_26_50",
  "passage": null,
  "question": "Read the sentence. Choose the word that fits.",
  "choices": null,
  "answer": null
 },
 {
  "source": "hfwApprovedQuestionBank.generated.js",
  "id": "hfwApprovedQuestionBank.generated.js#210",
  "grade": null,
  "skill": "hfw_26_50",
  "passage": null,
  "question": "Read the sentence. Choose the word that fits.",
  "choices": null,
  "answer": null
 },
 {
  "source": "hfwApprovedQuestionBank.generated.js",
  "id": "hfwApprovedQuestionBank.generated.js#252",
  "grade": null,
  "skill": "hfw_26_50",
  "passage": null,
  "question": "Read the sentence. Choose the word that fits.",
  "choices": null,
  "answer": null
 },
 {
  "source": "hfwApprovedQuestionBank.generated.js",
  "id": "hfwApprovedQuestionBank.generated.js#294",
  "grade": null,
  "skill": "hfw_26_50",
  "passage": null,
  "question": "Read the sentence. Choose the word that fits.",
  "choices": null,
  "answer": null
 },
 {
  "source": "hfwApprovedQuestionBank.generated.js",
  "id": "hfwApprovedQuestionBank.generated.js#336",
  "grade": null,
  "skill": "hfw_51_75",
  "passage": null,
  "question": "Read the sentence. Choose the word that fits.",
  "choices": null,
  "answer": null
 },
 {
  "source": "hfwApprovedQuestionBank.generated.js",
  "id": "hfwApprovedQuestionBank.generated.js#378",
  "grade": null,
  "skill": "hfw_51_75",
  "passage": null,
  "question": "Read the sentence. Choose the word that fits.",
  "choices": null,
  "answer": null
 }
]
```
