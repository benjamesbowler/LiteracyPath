# Independent literacy-expert review protocol

## 1. Objective

Obtain independent, attributable judgments about LiteracyPath’s curriculum
sequence, item validity, instructional modeling, assessment use, language,
accessibility and risk before interpreting child pilot outcomes.

Automated tests and the product team’s own review are inputs, not substitutes
for this external review.

## 2. Reviewer eligibility and independence

Recruit at least two reviewers when practical. At least one must have current
expertise in early literacy instruction and assessment for the target age range.
Collect:

- role and relevant qualification;
- years and setting of practice;
- languages and multilingual-learner expertise;
- accessibility/SEND expertise;
- financial, authorship or advisory conflicts;
- prior involvement with LiteracyPath;
- signed independence and confidentiality declarations.

A reviewer must not rate material they authored. A product-team member may
answer factual questions but may not change a reviewer’s score or wording.

## 3. Frozen review bundle

Provide each reviewer the same versioned bundle:

- release ID and pack commit;
- curriculum map and learning-policy definitions;
- all 30 skill inventories and release states;
- representative items from every level and format, including blocked examples;
- answer/scoring rules and support behavior;
- approved media and audio policy;
- Guided Reading ladder and teacher reports;
- assessment administration guidance;
- automated audit summaries with known limitations;
- the rubric and issue form below.

Record every clarification issued to one reviewer and issue it to all reviewers.

## 4. Review sequence

1. Reviewer signs independence/conflict statement.
2. Reviewer completes the rubric independently without seeing another rating.
3. Reviewer logs every critical or major finding at item/skill/system level.
4. Study owner checks forms for missing fields only; the owner does not rewrite
   ratings.
5. Reviewers meet to discuss disagreements. Preserve original ratings.
6. Unresolved disagreements remain visible and default to the more cautious
   release decision when child educational safety is involved.
7. Product team creates dispositions through `REVISION_WORKFLOW.md`.
8. Reviewers re-check changed critical/major material and record a new dated
   decision.

## 5. Rating scale

Use one rating for every rubric row:

| Rating | Meaning |
|---|---|
| 4 · Meets | Appropriate, accurate and release-ready for the declared age/construct |
| 3 · Minor revision | Sound overall; bounded change improves clarity or consistency |
| 2 · Major revision | Material weakness may distort learning, evidence or access |
| 1 · Critical | Wrong/unsafe instruction, invalid evidence, harmful bias or release-blocking defect |
| N/A | Outside scope, with a written reason |

Confidence: `high`, `medium`, or `low`. Evidence basis:
`direct inspection`, `professional standard`, `research source`, or
`requires empirical calibration`.

## 6. Complete review rubric

Every applicable row requires rating, confidence, evidence and comment.

| ID | Domain | Review question |
|---|---|---|
| CUR-01 | Scope/sequence | Are prerequisite relations explicit and educationally defensible? |
| CUR-02 | Scope/sequence | Does difficulty rise through content complexity rather than irrelevant interface demand? |
| CUR-03 | Scope/sequence | Are review, spacing, retention and transfer opportunities adequate? |
| CUR-04 | Scope/sequence | Are ages/grades presented as guidance rather than unsupported diagnosis? |
| PHO-01 | Phonological awareness | Are tasks keyed to sounds/phonemes rather than misleading letter labels? |
| PHO-02 | Phonological awareness | Are rhyme, initial, final, blending and segmenting prompts unambiguous when spoken? |
| PHO-03 | Phonological awareness | Are dialect and accent variants handled without marking legitimate speech wrong? |
| PHI-01 | Phonics | Are grapheme–phoneme correspondences and pronunciations accurate for the declared variety? |
| PHI-02 | Phonics | Do examples isolate the taught correspondence without hidden advanced demands? |
| PHI-03 | Phonics | Are blends, digraphs, vowel teams, split digraphs and alternatives represented accurately? |
| PHI-04 | Phonics | Does support use letters and sounds without picture/context guessing? |
| DEC-01 | Decoding | Are word lists decodable from taught knowledge at the assigned point? |
| DEC-02 | Decoding | Are irregular/high-frequency words identified and handled honestly? |
| DEC-03 | Decoding | Does word and sentence difficulty avoid confounding vocabulary or syntax? |
| ENC-01 | Encoding | Do dictation scripts, expected spellings and self-correction rules measure the intended construct? |
| FLU-01 | Fluency | Are timing, passage difficulty, prosody and error rules age-appropriate and interpretable? |
| COM-01 | Comprehension | Are literal, sequence, inference, cause/effect and theme demands distinguishable? |
| COM-02 | Comprehension | Can questions be answered from the text without world-knowledge or image leakage? |
| VOC-01 | Language | Are vocabulary, grammar and instructions developmentally clear and culturally respectful? |
| MLL-01 | Multilingual learners | Are language load and construct knowledge distinguished where possible? |
| MLL-02 | Multilingual learners | Are names, settings, speech varieties and examples inclusive without stereotyping? |
| ASM-01 | Assessment validity | Does every scored response map to a declared construct and administration state? |
| ASM-02 | Assessment validity | Are evidence thresholds and labels proportionate to attempts, diversity and recency? |
| ASM-03 | Assessment validity | Are supported practice, teacher observation and direct assessment kept distinct? |
| ASM-04 | Assessment validity | Do incomplete, skipped and not-administered states remain distinct from incorrect? |
| ASM-05 | Assessment validity | Are recommendations justified by visible evidence and appropriately cautious? |
| MED-01 | Media/audio | Are target-word and phoneme recordings accurate, intelligible and role-correct? |
| MED-02 | Media/audio | Are images factually accurate, non-leading, safe and relevant? |
| MED-03 | Media/audio | Are media failures handled without substituting an unapproved teaching cue? |
| GR-01 | Guided Reading | Do text, image, level, target patterns, audio and questions agree page by page? |
| GR-02 | Guided Reading | Is the decoding-support ladder instructionally appropriate and correctly logged? |
| GR-03 | Guided Reading | Do teacher marks and support events avoid overstating mastery? |
| A11Y-01 | Accessibility | Can critical instruction and response be completed using keyboard and assistive technology? |
| A11Y-02 | Accessibility | Do visual, audio, motor and cognitive alternatives preserve the construct? |
| A11Y-03 | Accessibility | Are focus, target size, contrast, motion and reading layout suitable for the target age? |
| FAIR-01 | Fairness | Could any item systematically disadvantage a declared subgroup for construct-irrelevant reasons? |
| FAIR-02 | Fairness | Are subgroup claims withheld when data are sparse or uncalibrated? |
| SAFE-01 | Safety | Are child instructions, imagery, identity handling and adult controls safe? |
| REP-01 | Reporting | Can a teacher trace every status to attempts, denominator, date and source? |
| REP-02 | Reporting | Are export wording, time zones, missingness and contradictions honest? |

## 7. Finding form

Complete one block for each finding:

| Field | Required entry |
|---|---|
| Finding ID | Reviewer code plus sequential number |
| Rubric ID | One rubric row |
| Scope | Item key, skill/level, page, workflow or system |
| Severity | Critical, major, minor or observation |
| Evidence | Exact stimulus, behavior or report output |
| Educational consequence | What a child/teacher may learn, infer or do incorrectly |
| Affected groups | All or named group; no unsupported assumption |
| Required correction | Testable outcome, not preferred implementation |
| Release recommendation | Block, restrict, revise next release or accept |
| Confidence | High, medium or low |
| Reviewer/date/version | Attributable human record |

## 8. Skill-level decision

For all 30 skills, record:

- sample/items reviewed and coverage limits;
- lowest rubric rating;
- open critical and major finding counts;
- pronunciation/dialect scope;
- recommended release state: `ready`, `restricted`, `blocked`, or
  `requires empirical calibration`;
- reviewer signature/date.

Any open critical finding makes the skill `blocked`. A major finding requires
documented independent disposition before `ready`.

## 9. System sign-off

The final human report must state:

- reviewer identities/qualifications and conflicts;
- versions reviewed;
- coverage and sampling limitations;
- unresolved disagreements;
- skill decisions;
- system-wide findings;
- required pilot safeguards;
- whether the reviewer recommends proceeding to the bounded pilot.

Only the reviewer may sign their judgment. The product team records the document
as evidence; it does not convert “requires calibration” into approval.
