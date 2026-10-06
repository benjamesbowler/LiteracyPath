# MAP preparation: literacy practice and evidence

**Authority:** current practice coverage, response modes and reporting boundaries.

**Audience:** kindergarten through Grade 2, with harder extensions for children ready for them.

**Sources:** `src/policy/literacyPracticePolicy.js`, `src/data/literacyPracticeBank.js`, and `src/data/literacyPracticeExtensions.js`.

This is original LiteracyPath practice for broad literacy preparation. It helps children practise and gives adults a specific record of what they answered independently, what needed teaching, and what remains unsampled. It is not an NWEA test, an endorsed replica, or a prediction of an official result. Do not produce a RIT score, percentile, grade equivalent, proficiency judgment or aggregate accuracy percentage across changing levels.

## Research and coverage decisions

NWEA's official [2025 CCSS instructional-area chart](https://www.nwea.org/uploads/CCSS_2025.pdf), pages 2, 3 and 5, identifies foundations, language/writing, literary and informational comprehension, and vocabulary in the K–2 scope. The Reading 2–5 and Language 2+ outlines informed harder work involving text structure, evidence, perspective, audience, organization and editing. The official [K–2 concepts reference](https://teach.mapnwea.org/assist/help_map/Content/Data/RIT2ConceptK2.htm) helped identify gaps such as print navigation, text features, sound manipulation and writing decisions. These public sources were checked on 6 October 2026. No NWEA test questions, answer sets or scored examples were copied.

The eight reporting areas below are LiteracyPath's practical grouping of these demands and its existing skills. They are not a reproduction of NWEA's score categories. Listening and independent reading stay separate because hearing a passage changes the evidence. Coverage describes the concepts represented in this catalogue, not equivalence to every standard, test form or official test difficulty.

| Practice area | Skills in this product | Count |
|---|---|---:|
| Sounds in words | Initial sounds; final sounds; rhyme; short-vowel discrimination; syllables; blending, adding, deleting and substituting sounds | 6 |
| Phonics and word recognition | CVC words; blends; digraphs; long vowels; vowel teams; r-controlled vowels; four existing high-frequency-word bands | 10 |
| Vocabulary and word structure | Prefixes/suffixes; antonyms/synonyms; homophones; context clues | 4 |
| Listening comprehension | Details; sequence; main idea; inference; cause/effect; theme, from spoken passages | 6 |
| Reading comprehension | The same six comprehension skills from printed passages; informational features/evidence; literary craft | 8 |
| Grammar and language | Nouns; verbs; adjectives; prepositions; plurals; sentence comprehension | 6 |
| Print and book knowledge | Letter names/case correspondence; print and book concepts | 2 |
| Writing and conventions | Capitalization; punctuation; purpose/audience; planning/organization; revision | 5 |
| **Total** | **30 existing skills, six distinct listening variants, eleven supplemental skills** | **47** |

Level 1 uses short, concrete examples: spoken letter names, words and syllables, visible book credits, simple headings, explicit facts, complete sentences and everyday messages. Level 2 increases the reasoning or language demand through phoneme operations, return sweeps, glossary context, supporting evidence, comparison, narrators, sensory/figurative language, audience, paragraph organization and editing. These are internal practice levels, not grade placements or calibrated ability estimates.

## Authored stock and transfer

The supplemental source currently contains 322 questions, including 61 newly authored partners for narrow constructs. It reuses reviewed public Drum Trail word recordings/counts and unambiguous Sentence Fix capitalization/punctuation material with explicit provenance. Public practice familiarity must be retained; it is not unseen assessment evidence. Reserved retention and progress-check questions are excluded.

Each item has one literal key, plausible alternatives with specific misconception rationales, a teaching explanation, an explicit construct and response mode, exact required audio cues, and a reviewed media decision. Pictures are used only when they carry required evidence. The new book/print tasks provide actual titles, bylines, line breaks, page information and text features; decorative artwork cannot stand in for that evidence.

After an error, the shared learning-response system preserves the original response and choice set while teaching the contrast. A fresh transfer must preserve the construct and format, use a new stimulus and choice set, and be no harder than the original. Changing only an ID or option order is not fresh practice. The planner reserves transfer partners outside its planned first-response questions. A correct supported transfer is useful practice evidence, not independent mastery.

## Audio and response boundaries

Required instruction and target cues use exact canonical Leda recordings. Blending plays reviewed isolated phonemes in order. Raw phoneme notation must not be submitted as ordinary speech. Missing or failed required audio makes the task unavailable; no approximate recording or browser speech may replace it. Each required cue must complete before the learner's response can count as delivered-audio evidence.

Worked models have separate spoken teaching cues for the actual construct, alongside each item's specific written explanation. These 61 compact explanations cover all supplemental items. They play after the first response and must not become hints before it. A teaching replay of a letter name must use its letter-name recording; an isolated phoneme is not interchangeable. Reading a worked answer after a response does not change that original response into supported or correct evidence.

Printed reading passages and printed recognition choices remain silent. Listening passages are hidden during the response. Sound-manipulation choices are spoken with written word labels hidden; syllable tasks do not expose the target spelling. A recorded letter name is not interchangeable with the spoken word that happens to share its spelling.

Most new tasks require a choice. They show recognition and reasoning about print, language and writing decisions. They do **not** measure oral reading rate, prosody, pronunciation quality, independent oral production, handwriting, spelling from unprompted composition, or the quality of a freely composed text. Teachers need oral reading and actual writing samples for those claims. Existing word-building responses remain evidence for their particular prompted task, not general composition.

## Descriptive reports

Record the exact question, skill, level, modality, response role, support, familiarity, time and audio delivery. Show recent independent correct/incorrect first responses by skill and level alongside supported work, fresh transfers, repeated/familiar questions, unavailable media, skips and unanswered work. Reading and listening must not be merged into a single comprehension score.

An unsampled area is not a weakness. Small or old samples cannot establish proficiency; show their coverage and recency rather than inferring a status. Next-practice suggestions point to the specific skill and a new example. Follow the [Reporting Bible](../reporting/REPORTING_BIBLE.md) and shared response policy when deciding which evidence is eligible for a report.

## Assignments and saving

Teachers can assign a twelve-turn mixed adventure or six turns within any one of the eight areas. A child's assignment fixes that area and is bound to the learner, assignment and practice version. Free practice and older assignments cannot satisfy a new classroom assignment. A locally persisted terminal checkpoint and a positive cloud-save receipt must precede the teacher's completion notification; reconnection and reload retry the same finished session.

The forward migration `20261005093000_literacy_practice_assignments.sql` extends only `lp_progress_config_valid(jsonb,text)` to accept these exact practice configurations. It preserves legacy independent-check validation and restricted helper access. With user authorization, it was applied to the Literacy Guide production project on 6 October 2026 as migration `20261006013056_literacy_practice_assignments`. Hosted synthetic validation accepted mixed/reading practice and the existing independent bank, rejected unknown areas, wrong versions and null configuration, and confirmed the private function grants and fixed search path. No learner records were inserted or rewritten by this verification.

## Permanent release checks

The existing `npm run check:question-design-policy` audits the complete supplemental authoring source, including items unavailable to a session. `tools/lib/literacyPracticeContracts.mjs` checks all 47 descriptors, eight areas, both levels, literal keys/rationales, source provenance, reviewed media decisions, audio source identity, response-mode boundaries and genuine transfer stock. Runtime filtering cannot hide unfinished authoring from this gate.

`node tools/checkAssessmentLedaAudioAudibility.mjs` includes every required supplemental cue in its existing decode/peak checks. `--literacy-practice-only` selects just this audio scope; `--progress-check-only` retains the existing Progress Check scope. Run the supplemental content and contract unit tests, shared question-policy regression tests, relevant practice/reporting tests, and the rendered literacy-practice release tests. Follow the [Question Design Bible](../content/QUESTION_DESIGN_BIBLE.md), [authoring standards](../skills-assessment-rebuild/AUTHORING_STANDARDS.md) and [task verification gates](../verification/TASK_GATES.md). Automated checks do not constitute child observation, physical-device proof, or human listening evidence.
