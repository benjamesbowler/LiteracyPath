# Item Authoring Standards v3 — how every new question is written and proven

**Standard.** Companion to MASTERY_SYSTEM.md. Every item authored in the rebuild must satisfy this file plus its skill's blueprint and the current Question Design Bible. `docs/instructional/instructional_standards.md` governs the boundaries between teaching, supported practice and independent assessment; the active blueprint governs the skill's units and formats. This file distinguishes the checks implemented in `tools/assessmentRebuild/lib.mjs` and `gate.mjs` from the editorial judgments those checks cannot make.

Every item needs original content, one defensible key, plausible distractors tied to actual misconceptions, and evidence from the applicable checks. A passing lint is not proof of meaning, child clarity or educational validity.

---

## 1. Authoring source and runtime schema v3

Write compact items in `tools/assessmentRebuild/authoring/<skill>.mjs`. For example:

```jsonc
{
  "u": "at",                             // blueprint evidence unit, not a per-question key
  "lvl": 1,
  "ph": 1,
  "v": 1,
  "fmt": "RHYME_MATCH_PICTURE",
  "media": "image-required",
  "evidenceModality": "audio+image",
  "constructClaim": "spoken_rhyme_discrimination",
  "prompt": "Which word rhymes with the word you hear?",
  "spoken": "Cat. Which word rhymes with it?",
  "target": "cat",                       // authored stimulus; never inferred from answer
  "hideWrittenLabels": true,
  "cards": ["hat", "cake", "pot", "jam"], // exact image paths resolved and reviewed separately
  "choices": [
    { "t": "hat", "k": true, "r": "KEY" },
    { "t": "cake", "r": "D-ONSET" },
    { "t": "pot", "r": "D-VOWEL" },
    { "t": "jam", "r": "D-RIME-NEAR" }
  ],
  "note": "Compare spoken endings; cake shares the onset but not the rime."
}
```

`expandBank` derives the stable ID, `bankStandardVersion: 3`, form, runtime string choices, `answer`, `distractorRationales`, media paths and other runtime fields. Do not hand-edit `src/data/v3/banks/*.v3.generated.js`.

Authoring requirements and current schema checks:

- Mark exactly one authored choice with `k: true`. Ordinary choice formats use 4 choices except the scoped Sequencing Level 1 `COMPREHENSION` format with `constructClaim: "story_event_order"`, which uses 3: the three actual events in the supplied story. Its two distractors are true events at the wrong ordinal position; never invent a fourth event to fill a quota. This implements the Question Design Bible's existing three-or-four-option rule. Construction formats supply their required `soundTiles` or `letterTiles`; follow the current format's source and blueprint rather than forcing a multiple-choice shape.
- Use the correct blueprint unit, level, phase, format and comprehension cell. `L-SCHEMA` checks duplicate IDs, answer membership, supported option counts, construction-tile coverage, unit membership in the skill inventory and allowed formats for the level. It does not replace review of whether the item actually measures that unit/cell.
- Every distractor has an accurate `r` code. `L-DIST` checks that runtime rationale codes are present and recognized, plus the antonym/synonym restrictions described in §4; it does not infer the semantic rationale from the wording.
- IDs embed skill/level/form/unit. Duplicate detection catches ID collisions; authors must still check that the content is filed under the correct construct.

---

## 2. Originality rules (the anti-slop core)

Fresh content must change the evidence or thinking, not merely its ID or surface wording. Structural duplicate checks catch some repeated material; editorial comparison is still required for renamed stories, near-paraphrases and cosmetic Level 2 variants.

- **O-1 One idea, one item.** Do not clone a sentence or story skeleton. `L-UNIQ-SKEL` compares normalized four-word shingles of qualifying passages/sentences within a skill, including across levels, and flags Jaccard similarity at or above the existing **0.35** cutoff. Its capitalization-based name normalization is a heuristic; it neither compares every short prompt nor understands whether two stories have the same underlying idea.
- **O-2 No token-swap variants.** Changing name/place/object does not create a new item. Reject variants that a reviewer could produce by replacing a few tokens in the same story or sentence.
- **O-3 Level 2 changes the thinking, not the wallpaper.** For every L2 item the author note must name the added cognitive demand (two-step inference, competing plausible theme, harder rime neighborhood, morphological transfer word…). "L1 passage + one extra sentence" is banned. The skeleton comparison can catch text reuse across levels; judging the added demand remains an editorial responsibility, not a separate `L-UNIQ-XLEVEL` check.
- **O-4 Option sets are unique in open-set formats.** `L-UNIQ-OPT` uses `optionSetSignature` to detect recycled sets. Fixed sound, letter or relation inventories listed in `CLOSED_SET_FORMATS` necessarily reuse some options; construction tiles are also excluded from this comparison. Those exceptions do not permit cloned stimuli or stock padding. `L-UNIQ-PA` separately checks the combined prompt, passage, sentence, answer, target and option-set signature.
- **O-5 Answers rotate.** `L-KEY-BALANCE` checks four-choice key positions within level/form buckets using the existing ceiling and the attainable rounding needed for small buckets. It also checks answer-string concentration at the level where the blueprint has a larger unit inventory. This is not a universal three-uses-per-form rule. Keep the exact limits in `lib.mjs`; runtime shuffling and a balanced bank do not establish answer validity.
- **O-6 Passages are single-use.** Do not reuse a passage for another item unless the comprehension blueprint explicitly structures a permitted Sentence Comprehension set. Current duplicate/skeleton checks operate within the skill being built; they do not prove product-wide passage independence. Check intended reuse and other relevant banks editorially.
- **O-7 A fresh retry is a complete sitting.** Each skill, level and phase must support two full sittings at the existing blueprint length: the initial sitting and a fresh retry. Count eligible phase questions separately from retention reserves. New IDs, renamed characters, swapped nouns or recycled option sets do not create new content. The fresh-retry check must compose both sittings without repeated item or prompt/answer signatures; all originality and option-set checks still apply.

---

## 3. Correctness rules (one defensible key)

- **C-1** The key must be uniquely correct under a literal reading. Adversarial check at review: try to argue each distractor as correct; any semi-defensible distractor is replaced. For example, `underneath` cannot be keyed against `under` for "directly under something." Targeted ambiguity checks catch known failure patterns; they are not a general proof that every distractor is false.
- **C-1a Child interpretation wins.** A distinction that is technically
  recoverable by an adult is still ambiguous if a five- or six-year-old can
  answer the printed or spoken wording literally. Never put bare `d` beside
  `nd`, one `l` beside `ll`, or a second noun/preposition that truthfully fits
  the scene or sentence. Scanner resistance never outranks one defensible key.
- **C-1b A grammatical sentence is not enough.** Cloze distractors may be
  grammatical only when the surrounding words or required image make them
  clearly false. Frames such as “Both ___ lost a tooth” cannot offer two
  plausible plural people words; location frames cannot rely on an
  unillustrated imagined scene.
- **C-2** No construct leakage: an item may only require its own skill. Long Vowels and Silent E items must not require the vowel-team knowledge assigned to Vowel Teams by the blueprints; grammar items must not hinge on reading stamina; comprehension keys must not hinge on one vocabulary word unless the skill is Context Clues.
- **C-2a Audio roles are authored evidence.** Instruction, passage, target and choice audio have separate roles. A target replay may speak only the explicitly authored `audioText` or `targetWord`; it must never fall back to `answer`, a correct-choice label or an image filename. If the item has no spoken target, omit that target replay; use `suppressStimulusAudio: true` when an image/scene identifier would otherwise be treated as speech. Keep instruction and passage replay available.
- **C-2b Spoken rhyme stays spoken.** Hide the anchor's printed spelling and the written choice labels during the response. Exact, unambiguous picture choices may support the spoken words. A spoken-only item must explicitly declare `evidenceModality: "audio"`, `hideWrittenLabels: true` and its spoken-rhyme construct, with approved recordings for the authored target (where the format has one) and every choice. Numbered replay/select cards must not reveal the spelling or automatically identify the key. Apply the construct-specific media requirements in the Question Design Bible; missing or ambiguous required pictures cannot be silently downgraded to audio.
- **C-3** Verify every phonics mapping against the taught correspondence and approved pronunciation. The current lexicon is `src/content/lexicon/approvedWords.json`, with `words`, `approvedDevErrors` and `phonics` fields. `L-LEX` checks a supplied target when its unit has an approved `phonics` list, including the explicit silent-e short-partner contract; it does not validate every pronunciation or every option automatically. Authors must review uncovered mappings and accent-dependent cases. Lexicon changes pass the same applicable content gates as bank changes; no personal approval flag controls publication.
- **C-4** Use complete, grammatical, child-friendly prompts and explicit ordinals for sequencing. `L-GRAM` detects specific article patterns, the broken "precise word means" frame, double spaces and missing cloze blanks in applicable formats. The gate also runs targeted `L-PROMPT-WORDING` rules. Neither is a general grammar parser or proof of age-appropriate wording; read the full prompt and every completed option aloud during editorial review.
- **C-5** `L-READ` counts prompt, sentence and passage words, including the longest passage sentence: L1 prompt ≤ 12 words, sentence ≤ 9 words, passage ≤ 60 words; L2 prompt ≤ 16, sentence ≤ 12, passage ≤ 110. Authors must also justify unfamiliar non-target vocabulary against the learner band and blueprint. Word counts and lexicon membership do not measure vocabulary familiarity or comprehension difficulty.

---

## 4. Distractor taxonomy (diagnosable wrong answers)

Every distractor must (a) be a real word or well-formed sentence except a blueprint-permitted developmental error, (b) match the part of speech or response class required by the construct, and (c) encode an actual misconception. `L-REALWORD` checks single-word options in the implemented word-choice formats against the loaded lexicon; it does not check every phrase, parse sentences or determine meaning. A recognized rationale code records the author's claim; it does not prove that claim. The accepted code list lives in `RATIONALE_CODES` in `lib.mjs`. Principal uses are:

**Phonological/phonics** · `D-ONSET` shares onset, wrong rime · `D-RIME-NEAR` neighboring rime (cot→cat trap) · `D-VOWEL` vowel substitution · `D-PATTERN-TRAP` (PTD) contains the target letters without the target sound (*said* for `ai`); use it only where the taught contrast and current format justify that misconception · `D-POSITION` right sound, wrong position (final vs initial) · `D-VISUAL-NEIGHBOR` letter-shape confusion (b/d, m/n) appropriate to the learner's taught inventory · `D-SEMANTIC` may provide a topic control in a phonological item only, where meaning is deliberately irrelevant and the choice remains a real word. These codes do not by themselves establish the suitability or difficulty of an option.

**Word knowledge (HFW, vocabulary, homophones, morphology)** · `D-FUNCTION-SWAP` same function class, wrong meaning slot: insert every HFW cloze option into the full sentence and check grammar and meaning editorially so syntax alone cannot reveal the key; there is no general `L-CLOZE-FIT` parser · `D-HOMOPHONE` sound-alike wrong spelling for the context · `D-MORPH-LITERAL` plausible but wrong morpheme reading at Level 2 · `D-SAME-DOMAIN` a real, same-part-of-speech word from the same semantic field that is neither the requested relation nor an absurd category giveaway (for *hot*: *warm* or *steaming*, never *green*) · `D-DEVELOPMENTAL` an attested child error listed in the `approvedDevErrors` field of `src/content/lexicon/approvedWords.json`; this permits only the error-recognition use named by the blueprint, not presenting an incorrect form as ordinary vocabulary.

For antonym and synonym items, `D-SEMANTIC` and unrelated same-part-of-speech padding are forbidden. Every wrong answer must test the relation inside the same meaning domain; a colour, sound, action, or object from another domain makes the correct answer visible without measuring vocabulary.

**Comprehension** · `D-DETAIL-AS-MAIN` true detail from the passage posing as main idea · `D-TOPIC-ADJACENT` right topic, unsupported claim · `D-SEQUENCE-SWAP` real events, wrong order; `D-SEQUENCE-START`, `D-SEQUENCE-END` and `D-SEQUENCE-REVERSE` name the applicable ordinal confusion · `D-CAUSE-REVERSE` effect posing as cause · `D-PLAUSIBLE-UNSUPPORTED` sensible inference the text doesn't license · `D-OPPOSITE` a plausible claim contradicted by the evidence. More than one option may be contradicted when each tests a distinct, credible misreading; there is no one-per-item quota. Authors must reject absurd or conspicuously childish alternatives and match language/register across the options. No `L-DIST-REGISTER` classifier measures register bands.

Per item: three distractors, or two for the three-event Sequencing format in §1. Each must encode a plausible, distinct wrong response with an accurate rationale. Several alternatives may share a misconception family; changing labels just to increase the number of codes adds no validity. Check each response against the literal stimulus, then use the scanner and independent length strategies to find mechanical shortcuts. Passing those checks cannot establish semantic correctness by itself.

---

## 5. The authoring loop

Per skill, per level, in chunks of ~8 items:

1. Read the skill blueprint. Open the unit/cell checklist for the form being filled.
2. Draft 8 compact source items, each with its author note naming the misconception it separates.
3. Self-review against §2–§4 and the Question Design Bible's author checklist.
4. Run the skill gate locally (`node tools/assessmentRebuild/gate.mjs --skill rhyming`) and inspect its item lints. Fix reds. A lint may only change with a documented standards reason and updated tests.
5. Inspect the gate's scanner, independent length, perfect-path, regression and fresh-retry results once a form completes.
6. Keep generated reports in ignored `.artifacts/assessment-rebuild/`; retain only durable rules and handoff information in checked-in documentation. Follow the task's Git authorization when committing source changes.
7. When the skill's forms are complete, run the full gate (`npm run check:audit:assessment-rebuild -- --skill X --write`). It writes generated outputs only through the gate; publication requires every applicable hard gate to pass.

Review each chunk before expanding the bank so that weak templates or ambiguous keys do not spread through later items.

---

## 6. SIM-SCANNER leak oracle (what "no shortcuts" means, concretely)

The current `scannerAnswer` implementation probes visible surface cues:

1. For word/phonics items, prefer a uniquely dominant letter chunk shared with the prompt, or a uniquely matching short prompt pattern.
2. For HFW items, detect the exact target copied into visible question text.
3. For passage items, prefer a dominant passage-word overlap or a conspicuously longer option.
4. Probe option length where the item exposes printed choices. Hidden labels, construction tiles and declared picture-to-sentence evidence are handled according to what the child can actually see.

The gate also evaluates the independent length strategies separately for each level/phase against the existing shared phase-pass rule. Exact scanner limits and exclusions live in `gate.mjs` and `lib.mjs`; there is no separate authoring rule that each strategy must stay below chance. These heuristics do not parse grammar, measure register, understand a story or prove that a word is the only valid synonym. Authors must separately try every option in context and reject semantic shortcuts even when the scanner returns no finding.

---

## 7. Verification evidence

The gate emits machine-readable lint, simulation, coverage and media results with the current standard version under `.artifacts/assessment-rebuild/`. Those reports establish which automated checks ran and passed. Editorial review must also establish one defensible key, actual misconceptions, child clarity, accurate content and suitable images/audio where the checks cannot do so. Routine named sign-off is not a publication requirement, and editorial judgment cannot override a failing hard gate or excuse a known defect.

---

## 8. Banned pattern classes

- Token-swap or skeleton-cloned items.
- Stock distractor padding in open-set formats; fixed blueprint inventories remain subject to the distinct-stimulus rules in O-4.
- Prompts that reveal their own answers.
- Printed-pattern shortcuts in listening constructs.
- Unapproved non-word distractors.
- Grammatically broken or child-ambiguous frames.
- Near-synonym key/distractor pairs with more than one defensible answer.
- Per-question evidence keys instead of construct-shaped units.
- Quota padding unrelated to construct coverage.
- Cross-construct questions filed under the wrong skill.
