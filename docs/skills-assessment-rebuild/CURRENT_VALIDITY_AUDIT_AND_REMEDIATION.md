# Skills Assessment Validity Audit and Remediation Plan

**Current audit date:** 2026-08-13

**Surface audited:** the 30 published v3 Skills Assessment banks selected by `src/data/loadAssessmentSkillBank.js`

**Decision:** **not valid for unrestricted mastery decisions in its current form**

The assessment is mechanically complete but not yet educationally safe. The existing publication gate reports all 30 skills as `READY`, and every current image-required reference resolves, but those checks miss several ways a child can obtain the keyed answer without demonstrating the named skill. The supplied screenshots are real examples of those failures, not isolated presentation mistakes.

This document is the current validity remediation authority. It supersedes the deleted Level 1 media-count audit as a release decision, while retaining `AUTHORING_STANDARDS.md`, the skill blueprints, and `MASTERY_SYSTEM.md` as the normative rules.

## 1. Executive findings

The current authored source contains 2,518 questions. Of these, 2,149 are live/selectable and 369 are retention-only. The audit found five immediate families of invalid or contaminated evidence:

1. **More than one defensible answer.** The live `hot` item keys `cold` while presenting `cool` as wrong. A child can reasonably choose either.
2. **The visual stimulus discloses the key.** The live `little → small` item repeats the exact stimulus asset on the correct answer card. It can be solved by matching pictures.
3. **The passage restates the keyed answer.** All eight live Sentence Comprehension `picture_match` questions display a written `Scene:` description instead of a scene image, then offer a near-verbatim sentence as the key.
4. **The visible modality changes the construct.** Sixty-three live Level 1 rhyming picture questions print the answer labels even though their blueprint requires no printed labels. Fifty live initial-sound pair items and 12 live final-sound pair items have the same label shortcut and therefore produce mixed print-pattern evidence, not clean phonological evidence.
5. **Several question formats are copying tasks presented as mastery.** One hundred live HFW `Find the word: X` items print X and place the same X among the choices. Twenty-four live Level 1 picture-sequencing items keep the complete event order visible and print the same event labels under the cards.

These are validity failures: a correct response is not reliable evidence of the claimed skill. They must not be repaired only by changing styling or adding more images.

## 2. Scope, method, and evidence boundary

### What was inspected

- All 30 current v3 authoring files and their 2,518 generated questions.
- Live-versus-retention status, level, format, prompt, passage, key, distractors, media tier, image paths, image-card paths, and sequence-card paths.
- The current authoring standards and all relevant phonological, phonics, HFW, language, and comprehension blueprints.
- The assessment renderer, including the branches that print visual-card and sequence-card labels.
- The current full assessment publication gate. It passed all 30 skills, which proves that the present gate does not detect the failures documented here.
- The four supplied runtime screenshots.
- A local browser rendering of the current assessment question shell and image-card layout. This confirmed that labels are visibly rendered beneath picture options by default.
- All 258 files under `public/images/assessment/scenes` in four full contact sheets, grouped as Cause and Effect, Context Clues, Inference, and Theme/Higher Comprehension.
- Git history for the earlier automatic scene-image wiring and its later removal.

### What the counts mean

| Measure | Current result |
|---|---:|
| Authored v3 questions | 2,518 |
| Live/selectable questions | 2,149 |
| Retention-only questions | 369 |
| Live Level 1 | 1,122 |
| Live Level 2 | 1,027 |
| Existing comprehension scene files | 258 |
| Scene files referenced by current banks | 0 |
| Authored questions with an exact scene filename match | 256 |
| Live questions with an exact scene filename match | 192 |
| Missing files among currently referenced media | 0 |

The structural scan also produced these review queues. These are not all automatically invalid; they identify where human construct review is required.

| Signal | Authored | High-confidence live interpretation |
|---|---:|---|
| Stimulus asset equals keyed answer-card asset | 1 | 1 definite invalid item |
| Phonological picture options with printed labels | 136 | 125 live: 63 rhyme, 50 initial sound, 12 final sound |
| Key text occurs verbatim in passage | 76 | 62 live: 37 Key Details, 22 Sentence Comprehension, 1 each Context Clues, Inference, Sequencing |
| Key has a stronger passage-overlap advantage than every distractor | 55 | 45 live: 19 Key Details, 21 Sentence Comprehension, 5 Context Clues |
| `scene`/`picture` wording without authored stimulus media | 32 | 8 live Sentence Comprehension items are definite; the remaining lexical hits need item review |

### Evidence limitation

This was an exhaustive structural inventory and a complete contact-sheet review of the 258 orphan scene assets. It was not a child trial, a listening review of every audio clip, or an individual full-resolution art approval of every image. No release claim should be made until the child-validity and audio gates in section 9 are completed.

## 3. The four supplied failures, traced to exact live items

| Screenshot failure | Live item | Why it is invalid | Required correction |
|---|---|---|---|
| `hot` can be answered by `cold` or `cool` | `lp3.antonyms_synonyms.l1.B.antonym_concrete.v5` | Violates C-1 and C-1a: the wrong option is defensible under a child's ordinary interpretation. The illustration does not disambiguate a temperature scale. | Withdraw immediately. Replace `cool` with an unrelated same-part-of-speech distractor and re-review the entire scalar-pair set. Prefer clear endpoints and context, e.g. `boiling hot` versus `freezing cold`; never place a near-opposite beside the key. |
| Correct `small` option repeats the stimulus image | `lp3.antonyms_synonyms.l1.C.synonym_concrete.v3` | The target image and the correct option both resolve to `/images/assessment/language/variants/antonyms-synonyms/small-little-01.webp`. A non-reader can match pixels. | Withdraw immediately. Do not use a stimulus image in a word-to-word synonym item, or use semantically related but visually independent stimulus and choice art. Add path, hash, and perceptual-similarity collision gates. |
| Girl/wellies scene is written out and then copied | `lp3.sentence_comprehension.l1.A.picture_match.v1` | There is no picture. The passage says `Scene: a girl in wellies jumping over a puddle`; the key changes only grammar to `A girl in wellies jumps over a puddle.` This tests copying. | Replace the visible passage with a genuinely independent scene image and keep only the instruction. If retained here, label the construct honestly as picture-to-sentence meaning matching; it is not reading comprehension of a passage. |
| Boys/ladder scene is written out and then copied | `lp3.sentence_comprehension.l1.B.picture_match.v2` | Same defect: the complete key is disclosed by the visible `Scene:` text. | Same correction. Create a reviewed scene asset; remove the written description from visible and spoken scoring evidence; make every distractor differ by one meaningful visual feature. |

The same Sentence Comprehension defect affects these six additional live items:

- `lp3.sentence_comprehension.l1.C.picture_match.v3`
- `lp3.sentence_comprehension.l1.A.picture_match.v4`
- `lp3.sentence_comprehension.l1.B.picture_match.v5`
- `lp3.sentence_comprehension.l1.C.picture_match.v6`
- `lp3.sentence_comprehension.l1.A.picture_match.v7`
- `lp3.sentence_comprehension.l1.B.picture_match.v8`

There are two retention-only variants with the same defect. No corresponding Sentence Comprehension scenes currently exist in the scene asset directory, so ten new illustrations are required if that format is retained.

## 4. What happened to the previously created scene images

The images were not deleted. There are 258 files in four directories:

| Skill | Files | Exact authored-question matches | Exact live-question matches | Current references |
|---|---:|---:|---:|---:|
| Cause and Effect | 64 | 64 | 48 | 0 |
| Context Clues | 64 | 64 | 48 | 0 |
| Inference | 66 | 64 | 48 | 0 |
| Theme/Higher Comprehension | 64 | 64 | 48 | 0 |
| **Total** | **258** | **256** | **192** | **0** |

The two extra Inference files are duplicate filename variants for the same `feeling-from-evidence` scene and have identical content.

### Why they became orphaned

Commit `cb3670473ef26a9931182940a87107644bffbc81` (2026-08-01) added broad semantic fallback logic to `tools/assessmentRebuild/lib.mjs`. It automatically invented a scene key for comprehension questions, marked questions image-required, and attached matching files even when the authoring item had not declared a media role.

Commit `69aa00b7543ea15adc84ca0083535da47f752649` later removed that blanket behaviour and returned media truth to authored `img`/`supportImg` fields. That was the correct architectural direction: the automatic fallback was also responsible for answer-bearing and duplicate visual evidence. However, the Cause and Effect, Context Clues, Inference, and Theme authoring files were left as `media: "text"` and were never given an explicit per-item decision. The images therefore remained on disk but dropped out of the banks.

### Why the fix is not to reconnect all 258 images

The visual review found that many images disclose the construct:

- Cause and Effect scenes visibly show the cause and its outcome.
- Context Clues scenes visibly depict the target word's meaning, allowing the word to be inferred without using context.
- Inference scenes often make the emotion, location, evidence, or likely event visually explicit.
- Theme scenes depict the decisive act, consequence, or story resolution and can strongly cue the moral.

Restoring all images would improve appearance while weakening reading validity. Each existing image must receive one of four explicit roles:

1. `scoring-evidence`: the child is intentionally meant to reason from the image; the item belongs to a named visual-comprehension construct.
2. `neutral-support`: the image aids access but cannot identify the key without reading.
3. `post-answer`: shown only after response as feedback or enrichment.
4. `reject`: unsuitable because it leaks the key, conflicts with text, or is visually ambiguous.

For text-reading constructs, use an image-only ablation review: reviewers see the image, prompt, and choices but not the passage. If they can identify the key above chance, the image cannot be `neutral-support` for a scored item.

## 5. Immediate release blocks

The following evidence must be removed from mastery/progression calculations before any claim that the v3 bank is valid:

### P0 — withdraw or demote now

| Family | Live affected | Immediate action |
|---|---:|---|
| Ambiguous `hot → cold/cool` | 1 | Withdraw item; audit every antonym set for near-opposite distractors. |
| Identical `little/small` stimulus and key art | 1 | Withdraw item; enforce stimulus/choice media independence. |
| Sentence Comprehension `picture_match` with written `Scene:` | 8 | Withdraw all eight; include two retention variants in rewrite queue. |
| Level 1 `RHYME_MATCH_PICTURE` with printed labels | 63 | Do not count as phonological mastery until labels are hidden and approved word audio is present. |
| HFW `HFW_READ_FIND_WORD` exact-copy items | 100 | Retain only as guided practice; replace the mastery probe with spoken-target-to-print selection or delayed recognition. |
| Level 1 picture sequencing with visible ordered passage and event labels | 24 | Retain only as supported practice; hide/remove the copying source before using as sequencing mastery evidence. |

### P1 — rewrite, split the evidence label, or review before scoring

| Family | Live affected | Required decision |
|---|---:|---|
| Remaining Level 1 Sentence Comprehension literal retrieval | 24 | Twenty-one current live Sentence Comprehension items have a surface-copy advantage. Rewrite gating items to require paraphrase or two-feature integration; keep a small literal-entry diagnostic only if reported honestly. |
| Key Details with copy advantage | 19 | Keep literal detail as a construct, but equalise lexical overlap across all options and require integration of two details for mastery evidence. |
| Initial-sound picture pairs with printed labels | 50 | Current result is print-pattern evidence. Ship audio-first, label-hidden versions before calling it sound isolation. |
| Final-sound picture pairs with printed labels | 12 | Same action as Initial Sounds. |
| Vowel Teams `PTD` with invented spellings | 27 | Replace fake forms such as `snale/snayl/snaile` with real-word pattern traps or reclassify as a specifically approved spelling-error format. Current items conflict with the real-word authoring rule. |
| Prefix/Suffix items labelled `MORPHEME_TRANSFER` | 21 | Most simply translate an explicit gloss (`not fair` → `unfair`, `again` → `re-`). Retag as meaning recognition or create genuine unseen-base transfer tasks. |
| Adjective image/world-knowledge items | 9 | Questions such as `Which one is very big?` among unrelated objects depend on world knowledge and imagined scale. Use same-object contrasts or sentence-based adjective function for gating. |
| Existing orphan comprehension scenes | 192 live matches | Do not wire automatically. Review each against the four media roles and image-only ablation test. |

## 6. Per-skill audit of all 30 banks

`Pass with review` below means no P0 defect was found by the current structural/visual scan; it does not mean child-validity approval.

| # | Skill | Live | Current validity finding | Exact remediation |
|---:|---|---:|---|---|
| 1 | Initial Sounds | 150 | **Mixed evidence.** The 50 live pair-select items print card labels, so a child can compare first letters. The 100 `FIRST_SOUND` items are explicitly print-linked, not pure listening evidence. | Set `hideWrittenLabels: true` for audio-first mastery variants; require target/card Leda audio; report current pair results as `printPatternEvidence` until replaced. Add a rendered-DOM no-label gate. |
| 2 | Final Sounds | 72 | **Mixed evidence.** Twelve live pair-select items print labels. Other ending-sound formats are mainly print-pattern tasks. | Apply the same audio-first split and evidence label as Initial Sounds; retain print forms for orthographic transfer, not phonological isolation. |
| 3 | Rhyming | 135 | **P0.** All 63 live Level 1 picture-rhyme items visibly print labels, directly violating the blueprint's no-label rule and enabling rime-chunk matching. Level 2 printed-rhyme formats are intentional. | Hide Level 1 labels; provide target and option audio; preserve Level 2 as print-linked rhyme; verify in the rendered browser DOM, not only bank JSON. |
| 4 | CVC Short Vowels | 60 | **Pass with review.** Image-supported missing-vowel and picture-to-print formats align with decoding/spelling. | Human-check every target image and dialect mapping; keep image identity independent of key position; verify PUT_SOUNDS_IN_ORDER interaction and audio. |
| 5 | Short Vowel Discrimination | 60 | **Pass with modality review.** `LISTEN_CHOOSE_VOWEL` is valid only when the approved audio, not visible spelling or a naming label, supplies the target. | Assert audio-required behaviour at runtime; prevent browser speech fallback from becoming release evidence; visually verify the 10 live image-group items have only one defensible vowel family. |
| 6 | HFW 1–25 | 125 | **P0 format.** Twenty-five live `Find the word: X` items show X twice and test shape matching. | Spoken target only, then choose printed word; or brief display followed by delayed choice. Keep 50 cloze and 25 spelling/build probes after same-function distractor review. |
| 7 | HFW 26–50 | 125 | Same 25-item exact-copy defect. | Same correction. |
| 8 | HFW 51–75 | 125 | Same 25-item exact-copy defect. | Same correction. |
| 9 | HFW 76–100 | 125 | Same 25-item exact-copy defect. | Same correction. |
| 10 | Blends | 96 | **Pass with evidence split.** Image choices and word completions mainly test grapheme-pattern decoding; they are not pure auditory blend recognition. | Keep as phonics/print evidence; add audio-first blend discrimination if auditory blending is claimed; check every image label and blend position. |
| 11 | Digraphs | 48 | **Pass with evidence split.** Image-choice labels can make this a printed digraph scan, which is acceptable only when reported as grapheme knowledge. | State the modality in the blueprint/report; add an audio-to-pattern counterpart for sound evidence; ensure one key per pronunciation/dialect. |
| 12 | Long Vowels and Silent E | 52 | **Pass with review.** Silent-e transforms and contrasts fit the skill. | Check images disambiguate real words without giving the written pattern; validate pronunciation and preserve vowel-team separation. |
| 13 | Vowel Teams | 78 | **P1.** Twenty-seven live PTD items use obvious invented spellings despite the current rule that distractors be real words except approved developmental-error formats. They may measure familiarity rather than vowel-team transfer. | Replace with real-word pattern traps (`said`-type exceptions where appropriate), contextual spelling choice, or explicitly author and approve a spelling-error construct with its own evidence label. |
| 14 | R-Controlled Vowels | 60 | **Pass with modality review.** Pattern and CPS items are print-based; 15 live picture/audio items can supply auditory evidence if audio is approved. | Separate print-pattern and auditory evidence in reporting; validate `ar/or/er/ir/ur` pronunciation and dialect uniqueness. |
| 15 | Nouns | 48 | **Low-discrimination Level 1 risk.** Some image choices contrast one person/thing with actions, so the grammar category may be visually obvious. | Use four same-register candidates and ask category/function in a sentence; keep picture classification as an entry diagnostic, not sole mastery evidence. |
| 16 | Verbs | 48 | **Low-discrimination Level 1 risk.** One action picture among static objects can be chosen without understanding a verb's sentence role. | Use multiple actions/actors and matched image complexity; require choosing the action word that fits a sentence for gating. |
| 17 | Adjectives | 48 | **P1.** Nine live image choices include absolute world-knowledge questions such as `Which one is very big?` among unrelated objects. Object scale is not controlled. | Compare the same object type in one scene (`larger ball`, `shorter tower`) or assess adjective function/meaning in a sentence. Reject any choice that can be true under a plausible real-world scale. |
| 18 | Prepositions of Place | 64 | **Image-dependent and ambiguity-sensitive.** All 76 authored items have images, but spatial alternatives such as `over/past/near` can overlap. File existence is not enough. | Human-review each depicted relation; require every distractor to be false in the actual image; add multi-rater C-1a approval and alt-text/image agreement checks. |
| 19 | Plurals | 48 | **Mostly aligned.** Error-recognition forms may legitimately include approved child forms; other formats must not use invented fillers. | Enforce approved-developmental-error allow-list only in named error formats; pronunciation-check irregular and `-s/-es` endings; preserve context-based choice. |
| 20 | Prefixes and Suffixes | 66 | **P1 construct labelling.** Twenty-one live transfer-labelled items mostly repeat an explicit gloss. Some build choices also use unapproved malformed forms. | Retag direct gloss items as meaning recognition; author unseen-base application for transfer; prohibit invented forms unless the blueprint explicitly approves error recognition. |
| 21 | Antonyms and Synonyms | 48 | **P0.** One live scalar antonym has two defensible answers; one live synonym repeats the stimulus image as the key. Other scalar and image-led items need adversarial review. | Withdraw the two named items; use unambiguous relations/context; enforce media independence; run a child-language relation review over all 48 live items. |
| 22 | Homophones and Homonyms | 68 | **Pass with dialect review.** Context cloze and meaning distinctions generally require the intended skill; no missing-image problem exists because text is the evidence. | Validate pronunciation/dialect and make all cloze alternatives grammatically possible so meaning, not grammar, selects the key. Do not add decorative answer-bearing images. |
| 23 | Sentence Comprehension | 56 | **P0/P1.** Eight live picture items have no pictures and disclose the key in `Scene:` text. Twenty-one live items show a surface-copy advantage; 22 contain the keyed answer verbatim. | Remove all `Scene:` scoring text; create 10 independent scenes if picture matching remains; rewrite mastery items around paraphrase, pronoun resolution, negation, conjunctions, and two-feature integration. Keep a small literal diagnostic separate from mastery. |
| 24 | Key Details | 56 | **P1.** Thirty-seven live keys occur verbatim in passages and 19 have greater lexical overlap than every distractor. Literal retrieval is valid, but current success can often come from scanning. | Make every option reuse comparable passage vocabulary; require selection across two details or a paraphrase for gating; demote simple one-span retrieval to entry/practice evidence. |
| 25 | Sequencing | 48 | **P0 Level 1 format.** All 24 live picture sequences leave the already ordered sentence visible and print the same event labels on the cards. This is transcription of order, not independent sequencing. Level 2 before/after and implied-order items are substantially stronger. | For Level 1, play/read once, then hide the ordered passage; hide card labels for picture sequencing or make labels non-verbatim; use causal/conventional sequences and ask first/middle/last relations. Preserve stronger Level 2 items after distractor review. |
| 26 | Main Idea | 48 | **Pass with review.** No systematic surface-copy or missing-media defect was found. Text-only is appropriate when the construct is passage synthesis. | Keep scoring text-led; ensure distractors are true details or plausible adjacent topics rather than silly answers; do not add decorative scenes that reveal the topic. |
| 27 | Inference | 48 | **Text bank viable; orphan images unsafe by default.** Sixty-four exact scene matches exist, 48 live, but many pictures visibly supply the inference. | Keep current scoring items text-only until each image passes image-only ablation. Put visual-inference items in a separately named construct rather than contaminating text inference. |
| 28 | Cause and Effect | 48 | **Text bank viable; orphan images unsafe by default.** Sixty-four exact scenes exist, 48 live, and many show both cause and outcome. | Keep text-reading items text-only unless a scene is demonstrably neutral. Create separate visual cause/effect tasks when the picture is intended evidence. |
| 29 | Context Clues | 48 | **Text bank viable; images often answer-bearing.** Five live definition-clue items have copy advantage, sometimes legitimately because the clue states the meaning. The 64 orphan images commonly depict the target meaning. | Do not attach meaning-revealing art. If support is needed, use neutral setting art. Preserve definition-clue items as that named clue type, but balance with synonym, antonym, example, and inference clues. |
| 30 | Theme/Higher Comprehension | 48 | **Text bank viable; orphan images high-risk.** Sixty-four exact scenes exist, 48 live; many show the decisive action or resolution. | Require passage synthesis and competing plausible themes; reject or delay images that reveal the moral/ending; create separate visual-story theme tasks if desired. |

## 7. Exact question-design replacements

### A. Antonyms and synonyms

Bad pattern:

> The picture shows something hot. Pick the opposite of hot.
>
> `cold` / `wet` / `boiling` / `cool`

Replacement rules:

- A near-opposite or weaker point on the same scale may not be a distractor.
- Scalar pairs require a context that establishes endpoints, or must be replaced by a less ambiguous relation.
- Stimulus and choice art must be visually independent.
- For every distractor, the reviewer must write one sentence explaining why a child cannot reasonably defend it.

Acceptable shape:

> The soup is boiling hot. Which word describes ice from the freezer?
>
> `cold` / `boiling` / `wet` / `loud`

This assesses the hot/cold relation without asking the child to distinguish `cold` from the defensible `cool`.

### B. Picture-to-sentence meaning

If the format is retained:

- The stimulus is an image, not a written image description.
- The scene description may exist as author metadata and accessible alt text, but must not be displayed or spoken to a sighted child as scoring evidence.
- The four sentences share vocabulary and syntax; each wrong answer changes exactly one depicted feature such as actor, action, object, number, or location.
- A reviewer must answer using the image and choices, then confirm the key is uniquely visible.
- The result is reported as picture-to-sentence meaning matching, not passage comprehension.

For the wellies scene, a valid matched set would hold `girl`, `wellies`, and `puddle` constant while changing the relation/action, for example `jumps over`, `stands beside`, `sits in`, `walks away from`, provided the final illustration makes only one true.

### C. Sentence comprehension

Literal retrieval can be an entry diagnostic, but mastery items must require a transformation:

- **Paraphrase:** passage says `Milo received...`; key says `the dentist gave Milo...`.
- **Two-feature integration:** all options contain the same people and objects; only one preserves both who and what/where.
- **Pronoun reference:** resolve `he/she/it/they` across two clauses.
- **Connective meaning:** distinguish before/after, because/so, although/but.
- **Negation and contrast:** understand what did not happen without using trick wording.
- **Sentence-picture verification:** image is primary evidence and no text describes it first.

The surface-match oracle must score at or below chance. A keyed option may reuse passage vocabulary only when distractors reuse an equivalent amount.

### D. HFW recognition

Replace `Find the word: and` with one of:

- approved audio says `and`; child selects `and` from printed near-neighbours;
- word is flashed briefly, removed, then child identifies it;
- child completes a sentence in which all options have the same grammatical function;
- child builds/spells the word from controlled letters.

The printed target and printed answer may not be simultaneously visible in a mastery probe.

### E. Sequencing

The current Level 1 sequence contains three copies of the same information: ordered passage, labelled pictures, and selected-order labels. Replace it with:

1. play/read the short event sequence once;
2. remove the passage from view;
3. show three unlabelled, independently clear pictures in a deterministic shuffle;
4. have the child order them;
5. optionally replay the passage, but record whether replay was used;
6. report supported versus independent sequencing separately.

Alternatively, leave the passage visible but ask a specific relation (`What happened just before...?`) with lexically balanced answers. Do not call visible copying independent sequence construction.

## 8. Required implementation changes

All content corrections must be made in `tools/assessmentRebuild/authoring/*.mjs`, never by hand-editing `src/data/v3/banks/*.generated.js`.

### 8.1 New item/media fields

Add and validate:

- `evidenceModality`: `audio`, `print`, `image`, `audio+image`, `print+image`.
- `evidenceRole`: `mastery`, `entry-diagnostic`, `supported-practice`, `retention`.
- `mediaRole`: `scoring-evidence`, `neutral-support`, `post-answer`, `none`.
- `hideWrittenLabels`: required `true` for Level 1 audio-first rhyme/sound image cards.
- `stimulusMediaId` and option `mediaId`: stable identities for collision checks.
- `displayPassageDuringResponse`: `false` for independent Level 1 sequencing.
- `constructClaim`: the exact claim reporting is allowed to make from a correct answer.

### 8.2 New hard gates

Add the following to `tools/assessmentRebuild/gate.mjs` and the associated libraries/tests:

| Gate | Failure condition |
|---|---|
| `L-SEMANTIC-UNIQUE` | A key and distractor are synonyms, near-synonyms, overlapping scalar answers, or both defensible under the prompt. Use a curated relation file plus human approval for child-ambiguous pairs. |
| `L-MEDIA-ROLE-COLLISION` | Stimulus and any answer option share a path, content hash, or near-duplicate perceptual hash. |
| `L-MEDIA-CONSTRUCT` | A question names a picture/scene without scoring image media, or attaches an image without an explicit role. |
| `L-MODALITY` | A listening/phonological item exposes printed target/choice labels, lacks approved audio, or is reported under a stronger construct than it measures. |
| `L-COMPREHENSION-COPY` | The key has materially higher token/lemma overlap with the passage than every distractor, unless the blueprint explicitly marks a non-gating literal-entry exception. |
| `L-HFW-COPY` | The visible target string is simultaneously present as a visible answer option in a mastery item. |
| `L-SEQUENCE-COPY` | A sequence's ordered passage and matching ordered event labels remain visible during an independent-order response. |
| `L-REALWORD` expansion | PTD and morphology choice sets use unapproved invented forms outside explicitly sanctioned error-recognition formats. |
| `L-RENDERED-CONTRACT` | Browser DOM/screenshots show forbidden labels, missing required images, clipped choices, or hidden response controls at supported viewport sizes. |

The gate must fail publication, not only print a warning, for P0 conditions.

### 8.3 Scene asset manifest

Create a checked-in manifest for all 258 existing scenes with:

- file path and content hash;
- matching skill/item ID;
- visual description;
- text-alignment result;
- answer-bearing risk;
- approved media role;
- reviewer/date;
- replacement or rejection reason.

Do not infer this manifest from filenames at runtime. Authoring items should explicitly opt into an approved manifest entry.

## 9. Remediation order and acceptance gates

### Phase 0 — stop invalid evidence

1. Exclude the named P0 items/formats from mastery and progression calculations.
2. Keep them available only as `supported-practice` if teachers still need continuity.
3. Add a reporting note so historical results from contaminated formats are not presented as clean mastery.

**Exit:** no P0 item can increment mastery.

### Phase 1 — close the gate gaps

1. Add media collision, modality, HFW-copy, sequence-copy, and scene-without-image tests.
2. Add rendered browser fixtures for every question renderer branch.
3. Make the gate fail on violations.

**Exit:** each supplied screenshot defect is represented by a failing regression test before its content is fixed.

### Phase 2 — repair content and media

1. Rewrite the two named Antonyms/Synonyms items and adversarially review all 48 live items.
2. Create and approve 10 Sentence Comprehension scene images or remove the picture-match cell.
3. Rewrite the remaining Level 1 Sentence Comprehension mastery pool.
4. Convert Level 1 rhyme/sound items to audio-first label-hidden variants.
5. Replace 100 HFW copy probes.
6. Rework 24 Level 1 picture sequences.
7. Replace/reclassify the 27 Vowel Team PTD and 21 morphology transfer items.
8. Classify every orphan scene rather than reconnecting by filename.

**Exit:** current authoring and generated banks have zero P0/P1 unresolved items.

### Phase 3 — human construct validation

For every live item:

- one literacy specialist checks construct alignment;
- one second reviewer tries to defend every distractor;
- one visual reviewer checks what can be answered without the intended text/audio;
- a child-language review checks five- and six-year-old interpretation;
- dialect/pronunciation review covers every audio/phonological item;
- a small observed child pilot records strategy, not only correctness.

**Exit:** approval is item-level and role-specific; aggregate `30/30 READY` is insufficient.

### Phase 4 — release proof

Release requires all of the following:

- all automated gates green;
- zero missing or role-colliding media;
- surface-match, image-only, label-only, grammar-only, and longest-option baselines at or below chance for mastery items;
- browser screenshots/DOM evidence at supported desktop and compact heights;
- approved-audio provenance and listening review for audio-required questions;
- item-level human validity decisions complete;
- mastery reports exclude supported-practice and mixed-modality evidence from stronger claims.

## 10. Definition of done

The assessment is ready only when a reviewer can answer **yes** to every statement below:

- Every question has exactly one answer a child can reasonably defend.
- The correct answer cannot be found by copying the prompt/passage, matching an image, spotting a printed sound chunk, picking the only grammatical option, or choosing the visually most detailed card.
- Every image is either necessary scoring evidence, demonstrably neutral support, post-answer content, or explicitly rejected.
- A question that asks about a scene actually contains the reviewed scene.
- A reading-comprehension question cannot normally be answered from its picture alone.
- A phonological question cannot normally be answered from visible spellings alone.
- The evidence label says exactly what the interaction measured.
- Current browser rendering matches the authored contract at all supported viewport sizes.
- Automated gates reproduce the known failures when regression fixtures are introduced.
- Human child-validity and listening review are complete, not inferred from file counts or green code checks.

Until those conditions are met, the current bank may remain useful for guided practice and diagnostic exploration, but the affected formats should not be used as decisive evidence that a child has mastered the named skill.
