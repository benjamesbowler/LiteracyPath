# LiteracyPath EL-aligned benchmark assessment suite

Date: 2026-07-21
Source reviewed: `Skills-Block-Benchmark-Assessments-Overview.pdf` (six pages)
Implementation status: original LiteracyPath instruments aligned to the overview; not official EL Education assessment forms

## Product boundary

The overview defines five benchmark evidence areas: Letter Identification, Phonological and Phonemic Awareness, Encoding, Decoding, and Fluency. LiteracyPath keeps its established **Assessment 1: Letter Name and Sound Recognition** and **Assessment 2: Advanced Phonics Patterns** unchanged. This release adds the other four areas as **Assessments 3–6**; Assessment 2 remains a supplemental diagnostic rather than a replacement benchmark.

The supplied overview does not contain the licensed item forms, detailed scoring manuals, encoding cut scores, a timed definition of decoding automaticity, exact placement conversion tables, or fluency norms. LiteracyPath therefore:

- uses original, versioned words, oral prompts, and passages;
- records the evidence the overview calls for without inventing missing official rules;
- labels any microphase/cycle route as a **LiteracyPath provisional suggestion**;
- keeps candidate placement, teacher-confirmed placement, and a teacher override reason separate;
- never averages the four domains into an “official EL placement”; and
- can replace its provisional content/rules cleanly if licensed manuals are supplied later.

“EL” in this feature means EL Education Skills Block. These checks are not English-language-proficiency tests and do not diagnose dyslexia, speech, hearing, or language disorders.

## Benchmark path

| Grade/window | Default evidence path |
| --- | --- |
| Kindergarten BOY | Letter Identification → Phonological/Phonemic Awareness |
| Kindergarten MOY | Letter Identification → Phonological/Phonemic Awareness; Encoding → Decoding only when letter sounds are secure |
| Kindergarten EOY | Letter Identification → Phonological/Phonemic Awareness; Encoding → Decoding when the prerequisite is met |
| Grade 1 BOY | Encoding (Early Partial–Late Partial) → Decoding → Fluency → Phonological/Phonemic Awareness |
| Grade 1 MOY | Encoding (Late Partial–Middle Full) → Decoding → Fluency → Phonological/Phonemic Awareness |
| Grade 1 EOY | Encoding (Early Full–Late Full) → Decoding → Fluency → Phonological/Phonemic Awareness |
| Grade 2 BOY | Encoding (Middle Full–Early Consolidated) → Decoding → Fluency → Phonological/Phonemic Awareness |
| Grade 2 MOY | Encoding (Late Full–Middle Consolidated) → Decoding → Fluency → Phonological/Phonemic Awareness |
| Grade 2 EOY | Encoding (Early Consolidated–Late Consolidated) → Decoding → Fluency → Phonological/Phonemic Awareness |

Teachers may choose a different starting path when prior evidence supports it. Stopping for frustration produces a saved `discontinued` attempt; unadministered items are not counted wrong.

## Grade/window anchors

| Grade | BOY | MOY | EOY |
| --- | --- | --- | --- |
| Kindergarten | Cycle 1 · Middle Pre-Alphabetic | Cycle 15 · Early Partial | Cycle 25 · Middle Partial |
| Grade 1 | Cycle 26 · Late Partial | Cycle 39 · Middle Full | Cycle 50 · Late Full |
| Grade 2 | Cycle 51 · Early Consolidated | Cycle 61 · Middle Consolidated | Cycle 75 · Late Consolidated |

These anchors provide comparison context, not a normed pass/fail label.

## Assessment 3: Phonological and Phonemic Awareness

- Administration: one-to-one, oral only, generally 1–5 minutes.
- Evidence strands: rhyme, syllables, onset-rime, phoneme isolation, blending, segmentation, deletion, and substitution.
- The teacher gives the authored oral prompt; scoring guidance is separated from the prompt and only revealed on request.
- Response states: correct, not yet, no response, and not scorable, with required exact-response evidence for attempted items. Partial and discontinued administrations remain distinct at attempt level.
- Reporting provides a strand-by-strand profile plus the exact item evidence. This evidence refines instruction; it cannot independently raise a placement.

## Assessment 4: Encoding

- Source guidance permits whole-group or small-group/whole-class administration, generally about 15 minutes. LiteracyPath stores and completes one selected student's record at a time, so paper responses from a group administration must be entered student by student.
- The teacher says the word, a context sentence, then the word again. The spelling remains hidden until the teacher chooses to reveal it for scoring.
- The learner writes on paper; the teacher transcribes the spelling into the record.
- Response states distinguish exact conventional spelling, phonologically plausible spelling, not yet, and not scorable.
- Reporting preserves the actual spelling and feature/error evidence (representation, vowel, blend/digraph, vowel pattern, ending, syllable, omission, addition, substitution, reversal/transcription concern).
- Because the source does not supply a conversion table, the teacher confirms a Decoding starting band and records a rationale; LiteracyPath does not invent an automatic Encoding-to-Decoding conversion.

## Assessment 5: Decoding

- Administration: one-to-one, generally 5–10 minutes.
- One isolated real word appears at a time, with no picture, sentence context, or spoken model.
- The teacher records automatic-and-accurate, accurate-after-sounding-out, incorrect, or not scorable, plus exact response, self-correction, and error type.
- Each administered band contains eight stable items. The runner records the overview’s stopping evidence when five or fewer are read automatically; it does not invent a millisecond automaticity threshold.
- Reporting separates accuracy from automaticity and preserves the band plus its published cycle anchor where administration stopped; the custom bank does not claim a cycle-specific form result.

## Assessment 6: Oral Reading Fluency

- Administration: one-to-one for Grade 1 and Grade 2 after Decoding establishes a starting point; it is not on the routine Kindergarten path.
- The learner reads an original, versioned passage for one minute.
- The teacher records words attempted, uncorrected errors, self-corrections, an explicit passage-accuracy judgment, and optional prosody/phrasing (1–4).
- The report calculates words attempted, words correct, accuracy, and words correct per minute (WCPM).
- No normed WCPM cut score is claimed. Fluency can identify connected-text support but cannot promote placement above Decoding evidence.

## Shared data and reporting contract

Every saved attempt carries:

- framework, assessment and form version;
- grade path and BOY/MOY/EOY window;
- starting microphase and route reason;
- correct, incorrect/not-yet, no-response, not-administered, not-scorable, partial, and discontinued states;
- per-item evidence and domain metrics;
- provisional candidate placement, confirmed placement, source, and override reason;
- start/completion timestamps, student/class/teacher ownership, and schema version.

Reports provide student detail, class matrices, domain profiles, exact item evidence, and Excel sheets. Incorrect, not administered, discontinued, and not scorable remain distinct throughout storage and export.

## Validity and review gates

Before any item/form is described as an official EL benchmark, LiteracyPath requires the matching licensed administration/scoring manual and an educator review of content, pronunciation, difficulty, alternate-form equivalence, and placement conversion. Until then all UI and reports must retain the “EL-aligned” and “provisional” labels.
