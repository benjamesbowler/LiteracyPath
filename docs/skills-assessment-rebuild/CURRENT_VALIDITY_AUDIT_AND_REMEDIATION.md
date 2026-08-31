# Skills Assessment Release Audit

**Audit completed:** 2026-08-14

**Current corpus refresh:** 2026-08-31

**Runtime surface:** the 30 published v3 Skills Assessment banks selected by `src/data/loadAssessmentSkillBank.js`

**Current standard:** `v3-2026.08-validity-3`

**Decision:** **content and implementation release candidate — all ten automated release gates pass for all 30 skills**

This document records the completed remediation of the assessment-validity, media-policy, audio-coverage, and compact-window defects reported on 2026-08-13. It replaces the pre-fix audit that correctly blocked the earlier bank.

The release decision is deliberately bounded. The authored corpus, runtime media wiring, image policy, audio-file coverage, interaction shell, and automated construct checks are clean. That is not the same as a psychometric validation study. A child pilot and human listening of newly generated speech remain human-evidence activities, not hidden software failures and not claims this audit invents.

## 1. Outcome

| Release measure | Current result |
| --- | ---: |
| Published skills | 30 |
| Authored questions | 2,512 |
| Live/selectable questions | 2,169 |
| Retention-only questions | 343 |
| Explicit item-level media decisions | 2,512 |
| Active unique assessment image paths | 1,321 |
| Hash-bound image style decisions | 1,339 |
| Existing images restyled to the current policy | 516 |
| New media-completion images | 823 |
| New independent Sentence Comprehension scenes | 10 |
| Rejected legacy comprehension scenes removed | 258 |
| Assessment LEDA gap-map clips | 312 |
| Gap-map files that decode correctly | 312/312 |
| Assessment rebuild gates | 30/30 pass G1–G10 |
| Question-design policy | 4,929/4,929 tasks pass |

The four defects shown in the supplied screenshots are closed across their whole defect families:

1. `hot` no longer presents both `cold` and `cool` as competing answers. The keyed opposite is unique.
2. The `little → small` item no longer repeats the stimulus picture on the correct answer card. It is now a text relation task.
3. Sentence Comprehension no longer displays a written `Scene:` description that restates the answer. Ten independent cartoon scenes are scoring evidence.
4. The assessment shell now scrolls only its intended content region and keeps controls, answer content, and speaker buttons reachable at compact MacBook browser heights.

## 2. Audit method and evidence

The remediation covered the authored source, generated banks, runtime controller, rendered assessment shell, production media, and release checks.

- Every authoring item was rebuilt from `tools/assessmentRebuild/authoring/*.mjs`; generated banks were not hand-edited.
- Every one of the 2,512 active item IDs has an explicit role, explicit path list, construct review, and answer-neutrality decision. Approved text-only and audio-only items declare `paths: []`; visual roles additionally require non-answer-revealing alt text.
- Every one of the 1,321 active image paths has an exact SHA-256-bound visual decision. The style registry contains 1,339 reviewed rows, including 18 retained decisions for assets that are no longer active after the Q removal and text-only conversions. A changed pixel invalidates the approval until the image is reviewed again.
- All active assessment art was visually reviewed in 53 full contact sheets. A final direct-pixel and rendered-browser critique found eleven false approvals that metadata alone had missed (`block`, `chain`, `boiling`, `fur`, `proud`, `sleepy`, `glad`, `hot`, `warm`, `wet`, and `sad`). Those old hashes are now permanently rejected, their bright flat-cartoon replacements are hash-bound, and any later attempt to restore the rejected pixels fails G10. Thirty-eight questionable cells were quarantined, regenerated, and re-reviewed across the complete repair sequence.
- The 258 old comprehension scenes were reviewed as a complete corpus. They were not restored because many showed the answer, outcome, inferred emotion, clue meaning, or theme. After reference checks confirmed they were inactive, they were removed instead of being retained as an unsafe fallback.
- Browser coverage exercises the real assessment renderer, image loading, hidden-label rules, Sentence Comprehension scenes, speaker controls, and compact-window scrolling.
- Audio coverage resolves every current assessment string through production mappings. The current gap map contains 312 `en-US-Chirp3-HD-Leda` clips; all decode as valid mono audio. The 2026-08-31 phonics refresh added 36 prompt clips without replacing existing mappings.

## 3. Construct-validity remediation

### 3.1 Answer ambiguity and answer leakage

The bank now rejects more than the two reported examples.

- Scalar antonyms cannot put a weaker but defensible opposite beside the key. `hot` now keys `cold` without the ambiguous `cool`; the remaining choices are plausible heat/physical-state near-misses rather than random colours or sounds.
- Stimulus and answer-card media are declared separately. The release gate fails an undeclared or role-mismatched image.
- The previous duplicate `little/small` asset route was removed from the item; the question is now a word-to-word synonym decision.
- Surface-match analysis no longer allows literal comprehension keys to win by copying the most passage text. Key Details and Sentence Comprehension use paraphrase, causal result, two-feature integration, pronoun resolution, time/location reasoning, or best restatement.
- Distractors remain plausible and in the same semantic/grammatical register. Antonym/Synonym items now require `D-SAME-DOMAIN` and reject generic `D-SEMANTIC` padding; choices such as `green`, `pink`, `red`, and `blue` can no longer make a meaning relation visible through category alone.

### 3.2 Phonological evidence

Level 1 sound tasks no longer show the written labels that let a child compare first letters, final letters, or rime chunks.

- Initial Sounds pair items declare `audio+image`, claim `initial_sound_discrimination`, and require `hideWrittenLabels: true`.
- Final Sounds pair items declare `audio+image`, claim `final_sound_discrimination`, and require `hideWrittenLabels: true`.
- Level 1 Rhyming picture items hide labels and rely on production audio plus pictures.
- Runtime tests inspect the rendered DOM, not only bank metadata, so a CSS or component regression that exposes labels is caught.

### 3.3 High-frequency words

The 100 simultaneous copy tasks were replaced across all four HFW bands.

- The prompt is now `Tap sound. Pick its match.` and never prints the target word.
- The production recording supplies the target.
- The child selects among printed, visually plausible near-neighbours.
- The construct claim is spoken-to-print high-frequency-word recognition.
- The media picker preserves the authored v3 target and answer-card media exactly; HFW paths are no longer stripped or silently replaced by legacy media.

### 3.4 Sentence and passage comprehension

The original `Scene: ...` items measured sentence matching, not comprehension. That complete pattern was removed.

- Ten `picture_match` items now use ten independent, child-readable scene illustrations.
- Scene descriptions remain metadata/alt text; they are not displayed as answer-bearing passage text.
- Each answer set varies meaningful scene features rather than repeating the image description.
- Literal Sentence Comprehension and Key Details items were rewritten so the key paraphrases the evidence or requires a relationship between details.
- The surface-copy oracle now applies to these families rather than being bypassed with `scannerExpected`.

### 3.5 Sequencing

Level 1 sequencing previously showed the ordered source passage and repeated its event labels on already descriptive cards.

- The child now hears the story, then orders images.
- `displayPassageDuringResponse` is false.
- Written card labels are hidden.
- The evidence claim is heard-story event order, not copying.
- Sequence media has its own explicit role and is checked separately from ordinary answer cards.

### 3.6 Grammar and vocabulary

- Adjectives no longer depend on world knowledge such as choosing a whale as “big” from unrelated objects. Controlled sentence contexts make adjective meaning and function the evidence.
- Noun and verb Level 1 tasks no longer expose the grammatical category by showing one action among static objects or one object among actions. Sentence contexts and same-register choices provide the evidence.
- Prefix/Suffix direct-gloss items were reclassified or rewritten so transfer claims require application rather than copying a gloss.
- Vowel Team fake spellings such as `snale`, `paynt`, or `snaile` were replaced with real-word picture-to-print pattern choices.
- R-Controlled Vowels now uses a concrete `fork` target instead of the abstract/directionally ambiguous `north` image prompt.

## 4. Media policy: bright, bold, clean cartoon art

The current image policy is not advisory. It is encoded as the G10 release gate.

Every active assessment image must be:

- a bright, bold, classic flat 2D cartoon;
- clear at child-facing card size;
- built from crisp contours and smooth solid surfaces;
- free of paper/canvas texture and visible grain;
- free of embossing, bevelled edges, faux 3D, photorealism, and painterly rendering;
- stored within the assessment media namespace;
- attached to an explicit item role with non-empty alt text;
- hash-identical to the visually reviewed file.

G10 fails release for any of the following:

- missing item-level media decision;
- missing referenced image or file on disk;
- path outside the assessment namespace;
- missing alt text;
- role mismatch between the authored item and its media decision;
- image without a visual-policy decision;
- image hash changed since review;
- review not approved;
- any policy field permitting grain, texture, embossing, bevel, faux 3D, photography, or painterly art.

The image-generation skill was directed with this exact policy. Generation was followed by visual review and repair; generation output alone was never treated as approval.

## 5. Completed per-skill audit

| # | Skill | Final result | Completed remediation |
| ---: | --- | --- | --- |
| 1 | Initial Sounds | Pass | Audio+image evidence declared; written labels hidden; exact v3 media preserved. |
| 2 | Final Sounds | Pass | Same audio-first and hidden-label correction for final-sound discrimination. |
| 3 | Rhyming | Pass | Level 1 picture labels hidden; audio and media requirements enforced. |
| 4 | CVC Short Vowels | Pass | Image-required targets complete; one-key and distractor checks pass. |
| 5 | Short Vowel Discrimination | Pass | Production audio coverage complete; visual groups and target roles declared. |
| 6 | HFW 1–25 | Pass | Printed-copy probes replaced by audio-to-print recognition. |
| 7 | HFW 26–50 | Pass | Printed-copy probes replaced by audio-to-print recognition. |
| 8 | HFW 51–75 | Pass | Printed-copy probes replaced by audio-to-print recognition. |
| 9 | HFW 76–100 | Pass | Printed-copy probes replaced by audio-to-print recognition. |
| 10 | Blends | Pass | Required word/card art completed and bound to explicit roles. |
| 11 | Digraphs | Pass | Required word/card art completed; position and media gates pass. |
| 12 | Long Vowels and Silent E | Pass | Complete target visuals; pattern and real-word checks pass. |
| 13 | Vowel Teams | Pass | Invented-spelling PTD replaced with real-word picture-to-print choices. |
| 14 | R-Controlled Vowels | Pass | Abstract `north` image target replaced with concrete `fork`; audio/media complete. |
| 15 | Nouns | Pass | Category-revealing image shortcuts replaced with language-context evidence. |
| 16 | Verbs | Pass | Static/action picture shortcut replaced with sentence-fit evidence. |
| 17 | Adjectives | Pass | Uncontrolled real-world scale questions replaced with controlled sentence contexts. |
| 18 | Prepositions of Place | Pass | All scoring scenes explicitly declared and visually reviewed for the intended relation. |
| 19 | Plurals | Pass | Media complete; approved error formats remain isolated from ordinary real-word choices. |
| 20 | Prefixes and Suffixes | Pass | Recognition/transfer claims aligned; malformed distractor leakage removed. |
| 21 | Antonyms and Synonyms | Pass | `cold/cool` ambiguity, repeated-image answer leakage, and unrelated filler distractors removed across all 60 items; same-domain policy and regression tests added. |
| 22 | Homophones and Homonyms | Pass | Context-led evidence retained; answer-bearing decoration excluded. |
| 23 | Sentence Comprehension | Pass | Ten real scenes added; `Scene:` answer text removed; literal-copy items rewritten. |
| 24 | Key Details | Pass | Literal answers paraphrased; lexical-overlap shortcut removed. |
| 25 | Sequencing | Pass | Passage hidden during response; card labels hidden; sequence visuals completed. |
| 26 | Main Idea | Pass | Text-led synthesis retained; neutral visual roles prevent topic disclosure. |
| 27 | Inference | Pass | Unsafe legacy scenes rejected; text-led evidence and neutral support roles enforced. |
| 28 | Cause and Effect | Pass | Unsafe outcome-revealing legacy scenes rejected; neutral support only. |
| 29 | Context Clues | Pass | Meaning-revealing legacy scenes rejected; clue use remains necessary. |
| 30 | Theme/Higher Comprehension | Pass | Moral/ending-revealing legacy scenes rejected; synthesis remains text-led. |

## 6. Runtime and compact-window behaviour

The assessment page was audited as an application shell, not as an isolated screenshot.

- The top assessment controls remain visible and reachable.
- The assessment question body owns vertical scrolling when its content exceeds available height.
- Answer cards are not clipped by a non-scrollable ancestor.
- Speaker controls remain inside the scrollable content and are reachable at the bottom of tall answer grids.
- Full-screen mode is optional; compact browser windows use the same complete interaction path.
- Child and teacher viewport suites continue to check the wider application for accidental whole-screen clipping.

The final browser acceptance target is a compact MacBook-sized viewport with loaded images, independent Sentence Comprehension scenes, and all speaker controls reachable by scrolling.

## 7. Production audio completion

The current assessment corpus is fully mapped to production audio.

- Voice: `en-US-Chirp3-HD-Leda`.
- Current gap map: 312 clips (`159` isolated-word, `151` assessment-prompt, and `2` assessment-passage clips), including 36 prompts added by the 2026-08-31 phonics refresh.
- Encoding: normalised, filtered, faded, 44.1 kHz mono MP3.
- Decode/probe result: 312/312 valid; approximately 916.36 seconds total.
- Runtime resolution: `src/data/ledaProductionAudio.js` consults the generated assessment gap map before declaring a clip missing.
- Corpus coverage test: pass, with no current assessment text falling through to browser speech as release evidence.

These new files are mechanically verified, provenance-bound and accepted under continuous listening review. Decoding is not treated as listening evidence: any reported pronunciation, prosody or naturalness defect is quarantined and corrected.

## 8. Release gates

| Gate | What it proves | Current result |
| --- | --- | --- |
| G1 | Bank schema and required fields | 30/30 pass |
| G2 | Stable unique item IDs | 30/30 pass |
| G3 | Exactly one defensible keyed answer under encoded rules | 30/30 pass |
| G4 | Blueprint/form/phase coverage | 30/30 pass |
| G5 | Enough distinct content for pass and retention paths | 30/30 pass |
| G6 | Media and modality requirements | 30/30 pass |
| G7 | Mastery-path simulations | 30/30 pass |
| G8 | Construct and distractor policy | 30/30 pass |
| G9 | Surface-copy, leakage, and runtime contract checks | 30/30 pass |
| G10 | Exact item media and visual-style policy | 30/30 pass |

The generated status registry exposes G10 with the other release gates, so an older nine-gate result cannot silently be presented as current readiness.

## 9. Verification record

The following current checks are the release evidence for this remediation:

- `node tools/assessmentRebuild/gate.mjs --write`
- `npm run check:audit:assessment-rebuild`
- `npm run check:assessment-shell-regressions`
- `npm run check:question-design-policy`
- `node --test tests/unit/assessmentImageStyleQa.test.js tests/unit/assessmentMediaPicker.test.js`
- `node --test tests/unit/assessmentLedaAudioCoverage.test.js`
- assessment media and viewport Playwright suites
- `npm run check:app-viewport-visibility`
- `npm run lint`
- `npm run check:repo-hygiene`

The final commit record must state any whole-repository failure caused by an unrelated dirty workstream separately. An unrelated failure may block calling the entire mixed worktree globally green, but it does not erase a passing assessment-specific release gate.

## 10. Human evidence still required after software release

Two activities remain outside what code can truthfully certify:

1. **Listening sample and then full listening queue.** Hear the new LEDA clips for pronunciation, stress, truncation, artefacts, and child-friendly prosody. Any rejected clip is regenerated and remains excluded until accepted.
2. **Child validity pilot.** Observe whether children can understand the instructions, whether any distractor is defensible in ordinary child language, whether images are interpreted as intended, and whether correct answers track the named skill rather than test-taking shortcuts.

These are post-implementation evidence gates. They must be recorded as actual observations when performed; they may not be replaced by generated approval metadata or a green unit test.
