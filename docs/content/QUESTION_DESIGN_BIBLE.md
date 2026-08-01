# LiteracyPath Question Design Bible

**Policy version:** `2026-08-01.1`  
**Applies to:** assessments, Guided Reading quizzes, Story Quest questions, EL Quest stations, arcade literacy tasks, worksheets, future poems/animations with scored questions, and teacher-authored question generators.  
**Permanent gate:** `npm run check:question-design-policy`

This is the canonical standard for writing and reviewing LiteracyPath questions for learners aged 4–12. It supersedes any older rule that conflicts with it. A question is not publishable because it looks plausible or because an adult can infer the intended answer. It is publishable only when it measures the intended literacy construct, has one defensible answer, removes avoidable language and access barriers, and passes the evidence checks in this document.

The policy is enforced by code and evidence reports. **Routine human sign-off is not a publication requirement.** Targeted child observation, teacher feedback and psychometric review remain useful sources of improvement, but absence of an individual sign-off cannot block otherwise complete content and a name in a review field cannot rescue a failing item.

---

## Part I — Research base

### 1. What the evidence says literacy questions should measure

The US What Works Clearinghouse identifies a connected early-reading progression: academic language and vocabulary; awareness of speech sounds linked to letters; decoding, word-part analysis, writing and word recognition; and daily connected-text reading. The evidence rating is strong for sound–letter work and decoding/word analysis, and moderate for connected text. Questions therefore need to distinguish phonological awareness, grapheme–phoneme knowledge, decoding, spelling, fluency, vocabulary and comprehension instead of treating “reading” as one undifferentiated score. [IES/WWC Foundational Skills, K–3](https://ies.ed.gov/ncee/wwc/PracticeGuide/21/Published)

For learners in grades 4–9, the WWC gives strong-evidence recommendations for complex multisyllabic decoding, purposeful fluency work and a routine set of comprehension practices: build word/world knowledge, ask and answer questions, determine gist and monitor understanding. Older questions should therefore increase the thinking demand and text complexity, not simply lengthen the same early-years prompt. [IES/WWC Reading Interventions, Grades 4–9](https://ies.ed.gov/ncee/WWC/PracticeGuide/29)

The National Reading Panel’s evidence review groups effective reading instruction around phonemic awareness, phonics, fluency, vocabulary and text comprehension. LiteracyPath uses those as separate evidence families and never reports one as proof of another. [NICHD National Reading Panel publications](https://www.nichd.nih.gov/about/org/der/branches/cdbb/nationalreadingpanelpubs)

EEF describes literacy as both word-level skill (spelling and word reading) and text-level skill (comprehension and composition). Its guidance for ages 5–7 and 7–11 stresses purposeful speaking/listening, vocabulary, decoding, fluency and comprehension. Oral language support is therefore access to the task, not evidence that the child independently read the printed answer. [EEF Key Stage 1](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/literacy-ks-1) and [EEF Key Stage 2](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/literacy-ks2)

### 2. What the evidence says about phonics items

The English Year 1 phonics framework separates decoding from vocabulary memory by combining real words and clearly marked pseudo-words. It begins with practice/easier items, controls grapheme–phoneme content and word structure, avoids pseudo-word homophones, considers orthographic neighbourhoods and permits valid alternative pronunciations. LiteracyPath therefore uses explicit phonics targets, controlled word structures, accent-safe scoring and clearly signalled imaginary words; a child is never tricked into treating a pseudo-word as a known vocabulary word. [DfE Year 1 phonics item framework](https://www.gov.uk/government/publications/assessment-framework-for-the-development-of-the-year-1-phonics-screening-check/assessment-framework-for-the-development-of-the-year-1-phonics-screening-check)

The framework also shows why spelling and sound must be named precisely. `d`, `nd`, `l` and `ll` are not interchangeable answer labels: a prompt must say whether it asks for the final phoneme, final grapheme or final letter sequence. A distractor that is also true under the child’s ordinary interpretation is invalid even if the author intended a narrower technical meaning.

### 3. What the evidence says about young and multilingual learners

Cambridge Young Learners tasks use examples before each part, familiar topics, short instructions, pictures, three-picture choices, picture–sentence verification, one-word answers, spelling tasks and picture stories. These are not decorative choices: they reduce irrelevant reading load while keeping the target skill visible. LiteracyPath follows the same principle for entry ESL and ages 4–7: one action per prompt, automatic/replayable audio, strong visual context and concrete response choices. [Cambridge Pre A1 Starters format](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/starters/format/)

WWC guidance for English learners recommends intensive academic vocabulary and integrating oral and written English. Questions must not confuse unfamiliar task language with weak literacy knowledge; essential non-target vocabulary is taught or pictured, while the target word remains measurable. [IES/WWC English Learners practice guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/19)

### 4. What measurement research says about item quality

The joint AERA/APA/NCME testing standards treat validity, reliability/precision and fairness as fundamental. In practice, every LiteracyPath score needs evidence that the item measures the stated construct and that unrelated language, disability, cultural or interface barriers have been minimized. [Standards for Educational and Psychological Testing](https://www.testingstandards.net/)

Haladyna, Downing and Rodriguez derived 31 multiple-choice guidelines from consensus across 27 testing texts and evidence from 27 studies/reviews. The recurring principles are used here: important content, clear stems, simple vocabulary, independent items, one best answer, plausible homogeneous distractors, no trick wording, no answer cues and no “all/none of the above.” [Haladyna et al. review](https://www.tandfonline.com/doi/abs/10.1207/S15324818AME1503_5)

Rodriguez’s meta-analysis found that three-option multiple-choice items are generally optimal. LiteracyPath therefore allows three strong options instead of forcing a fourth weak distractor. Four options remain valid when all three distractors are plausible and diagnostic. [Rodriguez, 2005](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1745-3992.2005.00006.x)

ETS describes professional item development as matching every item to the objective, intended difficulty and cognitive level, with accessibility, fairness and editorial checks. The same alignment is required in every LiteracyPath item record and generator. [ETS K–12 item development](https://www.ets.org/k12/capabilities/item-development.html)

---

## Part II — The LiteracyPath standard

## 5. Age and difficulty bands

Age is a design constraint, not a substitute for the learner’s actual reading level. Older English learners may need Band A language with age-respectful subject matter.

| Band | Typical age | Question design | Reading demand | Response design |
|---|---:|---|---|---|
| A — Entry | 4–6 | one concrete action; oral-first; no unexplained metalanguage | 0–9 words in a displayed sentence; prompt normally ≤12 words | large picture/letter/word choices; 2–4 options; no typing required to prove recognition |
| B — Early | 6–8 | one step, or two visibly separated steps; simple why/how | sentence normally ≤12 words; prompt ≤16 words; short passage ≤110 words | pictures remain available where they carry context; 3–4 options or short construction |
| C — Developing | 8–10 | explicit evidence, comparison, morphology, main idea and supported inference | short multi-paragraph text; vocabulary supported by context | answer plus evidence, ordering, short response or 3–4 plausible choices |
| D — Extending | 10–12 | synthesis, author choice, nuanced vocabulary/grammar, multi-step reasoning | longer/denser text with controlled unfamiliar vocabulary | selected or constructed response; scoring rule identifies required evidence |

For the 30 two-level assessment skills:

- **Level 1 = Band A / kindergarten-entry ESL.** Concrete, image-led, automatically speakable, one action, familiar words. It establishes access to the construct.
- **Level 2 = Band B / Grade 1 extension.** A visible increase in word structure, grammatical contrast, text evidence or transfer. It is never the same question with swapped nouns or a longer sentence.
- Each level has Phase 1 and Phase 2. A phase is passed at 70%; otherwise it repeats. Passing Level 1 Phase 2 offers the learner either the next skill or harder Level 2 work. The item bank must not make access to later skills depend on completing Level 2.

## 6. The non-negotiable item contract

Every scored question must satisfy all of these:

1. **One construct.** The intended skill, unit, level and evidence claim are explicit. Incidental decoding, vocabulary, memory or motor demand may not determine the score.
2. **One defensible key.** Under the literal prompt, supplied image/audio/text and the child’s likely interpretation, exactly one answer is correct.
3. **A complete stimulus.** Nothing needed to answer exists only in the author’s imagination. Spatial, sequence and visual-detail questions show the scene. Reading questions supply the relevant text or image.
4. **Clear language.** The stem asks a direct question or gives one direct action. Remove unnecessary story dressing, technical labels and adult vocabulary.
5. **Accessible delivery.** Every child-facing question has a speaker/replay path. All 30 assessment skills also have at least one meaningful image per question; a passage illustration or a complete set of picture choices counts.
6. **Independent options.** Options are mutually exclusive, grammatically parallel, similar in length/register and independently plausible to a learner with the named misconception.
7. **Recorded rationale.** Assessment distractors name the misconception they diagnose. If runtime enrichment changes an option, it must update its rationale in the same operation.
8. **No leakage.** Capitalization, option length, repeated prompt words, image quality, grammar or answer position must not reveal the key.
9. **No tricks.** Ban hidden negatives, double negatives, “all of the above,” “none of the above,” overlapping answer ranges and trivia unrelated to the construct.
10. **Traceable evidence.** The item has a stable ID and belongs to the real runtime bank or generator checked by the release gate.

## 7. Stem and instruction rules

- Put the full task in the stem; a child should understand the task before looking at options.
- Use positive wording. Negative stems are allowed only when negation is the intended age-appropriate comparison, the learner is Band B or above, and **NOT/EXCEPT** is visibly and audibly emphasized. Never use a negative stem in Level 1.
- Use one verb: “Tap,” “Choose,” “Build,” “Put,” “Read,” or “Listen.”
- Do not say “Wait for it to flash” unless the tested interface deterministically flashes and the event is verified by a browser test.
- Do not ask a sound question with a spelling answer. Name the unit: “last sound,” “last letter,” “ending letters,” “vowel team” or “word part.”
- Provide a worked, unscored example when the response mechanic changes or is unfamiliar.
- Spoken instructions and visible instructions must require the same action. Audio may clarify pronunciation; it may not add a clue absent from the visual task.

## 8. Answer and distractor rules

- Use **three options by default**; use four only when the fourth is as plausible and diagnostic as the others.
- Normalize case and punctuation when checking semantic duplicates. Preserve the exact feature only when case or punctuation is the declared construct (for example, a capital-letter or apostrophe item). Two visually different strings that mean the same thing are duplicate answers unless that visible difference is precisely what the item measures.
- Every distractor must be wrong for a specific reason visible in the evidence. “Silly” is not a rationale.
- Do not place `d` beside `nd`, `l` beside `ll`, `s` beside `ss`, or another overlapping unit when the stem merely says “sound.”
- In a cloze, test grammar with every option inserted. If two produce a grammatical and plausible sentence, add context or replace one.
- Do not offer multiple true categories: “Both ___ lost a tooth” cannot use both *children* and *women* as options.
- Do not ask an unillustrated location sentence where several places could be imagined: “We live ___ the school” cannot distinguish *near*, *behind* and *in*.
- Balance key positions across a bank. Never use a deterministic answer position.
- Replace the complete option set on every new round; do not leave two old distractors while replacing only the previous key.

## 9. Media and accessibility rules

- **Assessment image rule:** every assessment item has a meaningful target, scene, sequence or answer-card image. Decorative icons do not count.
- **Rendering rule:** assessment art uses a clean, smooth storybook-cartoon finish: crisp contours, simple readable silhouettes, flat-to-soft shading and controlled detail. Do not use canvas/paper grain, embossed or bevelled edges, gritty noise, faux paint texture, photoreal material texture or heavy cinematic surface effects.
- At child-viewing size, the relevant object, action or relationship must remain obvious. Texture and decoration may never compete with the evidence needed for the question.
- **Audio rule:** every question exposes a speaker button; Band A instructions can auto-play once and always remain replayable. Target-word audio and instruction audio are separate roles.
- Audio uses an approved human-quality recording where available. Browser speech may be an access fallback, never the only evidence for a pronunciation-sensitive release claim.
- Image alt text identifies the object or scene without announcing the answer. If the image itself is the assessed stimulus, accessible alternatives must preserve the construct rather than leak the key.
- Images must be unambiguous at child-device size, culturally ordinary, answer-neutral and consistent with the named object/action.
- Choice hit areas, focus order and labels must work without colour alone. Time limits do not score reading knowledge unless fluency is explicitly the construct.

## 10. Construct-specific standards

### 10.1 Phonological awareness

- Spoken stimulus first; print is optional and may not reveal the rime/onset being tested.
- Initial/final/medial sound questions use pictures or audio with an approved pronunciation.
- Rhyming compares spoken word endings, not merely matching printed letter chunks.
- Accent-dependent pairs are excluded or accept all valid pronunciations.

### 10.2 Phonics and decoding

- Every word maps to the taught grapheme–phoneme correspondence and permitted word structure.
- Pseudo-words are phonotactically legal, clearly marked as imaginary and never homophones of real words.
- Word difficulty progresses through grapheme complexity, blending load, syllables and neighbourhood—not obscure vocabulary.
- A decoding item cannot be solved from a picture alone; the picture supports meaning while print remains necessary.

### 10.3 Spelling and word building

- Boxes show the number and order of required letters/graphemes.
- The displayed progress updates after each choice.
- Available tiles contain everything needed and no alternative valid spelling unless alternatives are accepted.
- A “build the word” instruction always builds a complete word; a single-letter task says “find/tap the letter.”

### 10.4 High-frequency words

- Recognition, spelling and contextual use are separate formats and evidence claims.
- Cloze distractors share a grammatical function so syntax alone does not reveal the answer.
- Irregular parts may be highlighted during teaching, but not highlighted as a scoring cue in assessment.

### 10.5 Vocabulary and morphology

- Context is sufficient to determine the intended meaning without specialist background knowledge.
- Synonym/antonym options match part of speech and sense.
- Prefix/suffix questions distinguish form, meaning and transfer to a new word.
- Homophone questions supply meaning-bearing context; audio alone cannot distinguish spellings.

### 10.6 Grammar and punctuation

- Test one feature at a time unless integration is the declared higher-level construct.
- Every option is inserted into the full sentence during validation.
- Punctuation questions make sentence purpose clear through wording and audio prosody without making the answer visually automatic.
- Error-recognition items may show a developmental error only when the child is asked to identify/fix it; false forms are not presented as ordinary vocabulary.

### 10.7 Reading comprehension

- The answer is supported by the supplied text/image. Direct questions cite explicit evidence; inference questions have at least two converging clues.
- Main-idea distractors may be true details but cannot also summarize the whole text.
- Sequence options use events that actually occurred, with only order changed.
- Cause/effect questions distinguish correlation, cause and result.
- Context-clue questions include usable definition, example, contrast or restatement clues.
- Theme questions distinguish transferable message from plot summary and avoid preachy abstractions beyond the age band.
- Question wording is no harder than the passage unless understanding that language is the construct.

## 11. Feedback and scoring

- Score the response before showing feedback.
- Say **Correct** or **Not yet/Incorrect**, give one brief construct-linked reason, then move automatically to the next item. Do not require a second “Continue” click.
- Never let a child change a scored answer after seeing the key.
- A skip, supported answer and unattempted item are different states and are not silently counted as wrong.
- Accuracy alone does not justify a broad mastery claim. Use the versioned learning/mastery policy, evidence diversity and recency rules.

## 12. Generation and release workflow

1. Declare construct, age band, level, phase, format and evidence unit.
2. Draft the key and the evidence that proves it.
3. Draft two or three distractors from named misconceptions.
4. Add exact visual/audio requirements and verify files/roles.
5. Run adversarial ambiguity review: argue for every distractor as if it were correct.
6. Run the permanent policy gate over the **runtime output**, not just authoring source.
7. Run the relevant browser/unit tests and generated audit report.
8. Publish only with zero hard failures. Observational data can improve the next policy version without becoming a universal sign-off gate.

No generator may “fix” a failure by weakening this policy, suppressing a surface, changing the expected count or adding a waiver without a versioned policy decision.

## 13. Machine-checkable release criteria

The permanent gate checks:

- all 30 assessment skills are present and non-empty;
- stable IDs, levels, phases, prompts, answer membership and unique options;
- Level 1/2 language ceilings and visible difficulty separation;
- assessment speaker text and meaningful visual evidence on every item;
- distractor rationales after runtime enrichment;
- banned option/stem patterns and negative-stem restrictions;
- media paths and accessible labels where applicable;
- all Guided Reading quizzes, Story Quest cover questions, numbered EL Quest stations, every level of all 11 visible arcade literacy games, the Sentence Fix bank and worksheet image-backed missing-letter rules;
- existing specialist gates for story evidence, narration, visual alignment, phonics eligibility, mastery and no-repeat behavior.

Passing means the machine-verifiable policy checks found zero failures. It does **not** claim that software can prove every nuance of validity for every child; it means all declared requirements have evidence and any future observed problem becomes a new test and policy revision.

## 14. Quick author checklist

- What exact skill does this answer prove?
- Can a child answer without guessing what I imagined?
- Is exactly one option true?
- Could grammar, length, picture quality or repeated letters reveal the key?
- Are the distractors plausible but clearly false?
- Is the wording inside the learner band?
- Does Level 2 require genuinely harder thinking than Level 1?
- Is audio available and is the visual meaningful?
- Do sound/spelling terms name the same unit the answers use?
- Will the full runtime item—not merely its source template—pass the gate?

---

## Sources consulted

- [IES/WWC: Foundational Skills to Support Reading for Understanding in Kindergarten Through 3rd Grade](https://ies.ed.gov/ncee/wwc/PracticeGuide/21/Published)
- [IES/WWC: Improving Reading Comprehension in Kindergarten Through 3rd Grade](https://ies.ed.gov/ncee/WWC/PracticeGuide/14/Published)
- [IES/WWC: Providing Reading Interventions for Students in Grades 4–9](https://ies.ed.gov/ncee/WWC/PracticeGuide/29)
- [IES/WWC: Teaching Academic Content and Literacy to English Learners](https://ies.ed.gov/ncee/wwc/PracticeGuide/19)
- [NICHD: National Reading Panel reports](https://www.nichd.nih.gov/about/org/der/branches/cdbb/nationalreadingpanelpubs)
- [UK DfE: The Reading Framework](https://www.gov.uk/government/publications/the-reading-framework-teaching-the-foundations-of-literacy)
- [UK DfE: Year 1 phonics screening item framework](https://www.gov.uk/government/publications/assessment-framework-for-the-development-of-the-year-1-phonics-screening-check/assessment-framework-for-the-development-of-the-year-1-phonics-screening-check)
- [UK DfE: English national curriculum, Key Stages 1 and 2](https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study/national-curriculum-in-england-english-programmes-of-study)
- [EEF: Improving Literacy in Key Stage 1](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/literacy-ks-1)
- [EEF: Improving Literacy in Key Stage 2](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/literacy-ks2)
- [AERA/APA/NCME: Standards for Educational and Psychological Testing](https://www.testingstandards.net/)
- [Haladyna, Downing & Rodriguez: Multiple-choice item-writing guidelines](https://www.tandfonline.com/doi/abs/10.1207/S15324818AME1503_5)
- [Rodriguez: Three Options Are Optimal for Multiple-Choice Items](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1745-3992.2005.00006.x)
- [ETS: K–12 Item Development](https://www.ets.org/k12/capabilities/item-development.html)
- [Cambridge English: Pre A1 Starters exam format](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/starters/format/)
- [Cambridge English: Young Learners handbook](https://www.cambridgeenglish.org/vn/images/153612-yle-handbook-for-teachers.pdf)
