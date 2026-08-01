# Item Authoring Standards v3 — how every new question is written and proven

**Standard.** Companion to MASTERY_SYSTEM.md. Every item authored in the rebuild must satisfy this file, the canonical `docs/content/QUESTION_DESIGN_BIBLE.md`, and its skill's blueprint. These standards extend (never contradict) `docs/instructional/instructional_standards.md` — the anchor words, banned formats, ESL rules, and PTD rules there remain binding; this file adds the machine-checkable layer the old bank never had. If an older example conflicts with the Question Design Bible, the Bible wins.

The one-sentence version: **an item is a hand-written measurement instrument with a paper trail — original content, one defensible key, three diagnosable wrong answers, and lints that prove it.**

---

## 1. Item schema v3 (bankStandardVersion: 3)

```jsonc
{
  "id": "lp3.rhyming.l1.A.at.v1",        // lp3.<skill>.<l1|l2>.<form>.<unitKey>.<variant>
  "bankStandardVersion": 3,
  "skillId": "rhyming",
  "level": 1,
  "form": "A",                            // A | B | C | R
  "itemType": "rhyming_family",           // existing itemType vocabulary, per blueprint
  "itemKey": "at",                        // THE EVIDENCE UNIT. Never a per-question key.
  "secondaryKeys": [],                    // optional extra units evidenced (rare; both must be defensible)
  "cell": null,                           // comprehension only: "fiction.explicit_detail" etc.
  "formatType": "LISTEN_FIND_RHYME",      // from the blueprint's allowed list
  "mediaTier": "image-optional",          // text | image-optional | image-required | audio-required
  "difficultyBand": 1,                    // 1 = on-level entry, 2 = on-level stretch (within its Level)
  "prompt": "Which picture rhymes with cat?",
  "spokenPrompt": "Which one rhymes with cat?",  // required whenever mediaTier != text
  "passage": null,                        // comprehension only; counted words recorded below
  "choices": [
    { "text": "bat", "isKey": true,  "rationale": "KEY" },
    { "text": "bed", "isKey": false, "rationale": "D-VOWEL"   },   // same onset family feel, vowel changes
    { "text": "cap", "isKey": false, "rationale": "D-ONSET"   },   // shares onset with target, no rime
    { "text": "sun", "isKey": false, "rationale": "D-SEMANTIC" }   // topically adjacent, phonologically far
  ],
  "answer": "bat",
  "readability": { "promptWords": 5, "passageWords": 0, "maxSentenceWords": 5 },
  "provenance": { "author": "opus", "wave": "W3", "date": "2026-08-xx",
                  "reviewedBy": [], "signedOffBy": null },
  "notes": "why this item exists / what misconception it separates (1 line, author-facing)"
}
```

Hard schema rules (lint `L-SCHEMA`):

- Exactly one `isKey: true`. 4 choices for choice formats (spelling/typing formats have `choices: []` and a `letterBank` per their blueprint).
- `itemKey` must be in the blueprint's unit inventory for that skill+level; `formatType` in its allowed list; `cell` in its cell list (comprehension).
- Every distractor carries a `rationale` code from §4, valid for that skill family.
- `id` embeds skill/level/form/unit — collisions and cross-filed items become impossible to miss.

---

## 2. Originality rules (the anti-slop core)

Verified context for why these exist: in the current published bank, Main Idea's 92 "different" passages reduce to **2** skeletons once names/locations are stripped ("Owen and Aunt Jo spent the morning at the fire station…" → "Ruby and Mr. Patel spent the morning at the forest trail…", same sentences, same answer); Inference L2 story 1 is Inference L1 story 1 with swapped tokens; Rhyming has 222 duplicate prompt+answer groups. None of the following is aspirational — each is a lint.

- **O-1 One idea, one item.** No two items in a skill may share a sentence skeleton. Lint `L-UNIQ-SKEL`: strip proper nouns → 4-gram Jaccard between any two prompts+passages in the same skill < **0.35**. (The current Main Idea bank scores ~1.0 pairwise inside its clusters.)
- **O-2 No token-swap variants.** Changing name/place/object does not create a new item. If a reviewer can produce item B from item A with find-and-replace, both die.
- **O-3 Level 2 changes the thinking, not the wallpaper.** For every L2 item the author note must name the added cognitive demand (two-step inference, competing plausible theme, harder rime neighborhood, morphological transfer word…). "L1 passage + one extra sentence" is banned; lint `L-UNIQ-XLEVEL` runs O-1 across levels too.
- **O-4 Option sets are unique** within a skill (lint reuses `getRepeatOptionSetSignature`). No stock distractor pools ("very sleepy / hungry / silly and giggly" appears in dozens of current Inference items — that pattern is dead).
- **O-5 Answers rotate.** Across each skill+level+form: each choice position is key roughly equally (max share 35%) and no answer STRING keys more than 3× per form (lint `L-KEY-BALANCE`). (Current bank: "solving a small problem" keys 8 Main Idea items.)
- **O-6 Passages are single-use.** One passage evidences one item, ever, across the whole product (comprehension blueprint relaxes this only for Sentence Comprehension's two-question sets, which the blueprint explicitly structures).

---

## 3. Correctness rules (one defensible key)

- **C-1** The key must be uniquely correct under a literal reading. Adversarial check at review: try to argue each distractor as correct; any semi-defensible distractor is replaced. (Current counter-example, Prepositions: `underneath` keyed against distractor `under` for "directly under something" — indefensible.)
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
- **C-2** No construct leakage: an item may only require its own skill. Long Vowels items must not require vowel-team knowledge (the current L2 tests `ai/ay` inside "Long Vowels and Silent E" — moved to Vowel Teams by the blueprints); grammar items must not hinge on reading stamina; comprehension keys must not hinge on one vocabulary word unless the skill is Context Clues.
- **C-3** Every phonics/word mapping is validated against a **human-approved pronunciation lexicon** (new file `content/lexicon/approvedPhonics.json`, seeded from the blueprint word lists, each entry `{word, pattern, dialectNote?}` reviewed by Ben once). Lint `L-LEX` fails any item whose target word→pattern mapping is not in the lexicon. This is what makes `apple → a_e`-class errors impossible to publish.
- **C-4** Prompts pass a grammar/wording lint `L-GRAM`: article agreement ("a adjective" — 30 published Adjectives prompts currently fail this), no truncated frames ("Choose the precise word means…" — 19 published Prepositions prompts), no meta-language at L1 where the standards require child words ("which word names a thing", not "which word is a noun"), explicit ordinals for sequencing.
- **C-5** Reading load caps (ESL rule made checkable, `L-READ`): L1 prompt ≤ 12 words, sentence ≤ 9 words, passage ≤ 60 words; L2 prompt ≤ 16, sentence ≤ 12, passage ≤ 110. Vocabulary outside the K-2 familiar list needs a blueprint justification (Context Clues targets are the sanctioned exception).

---

## 4. Distractor taxonomy (three diagnosable wrong answers)

Every distractor must (a) be a real word / real sentence (no invented non-words — `staries`, `cloudies`, `boxies`, `foxs` all currently published in Plurals; lint `L-REALWORD` validates against the lexicon), (b) be the same part of speech / format class as the key, (c) encode a **named misconception**. Approved rationale codes:

**Phonological/phonics** · `D-ONSET` shares onset, wrong rime · `D-RIME-NEAR` neighboring rime (cot→cat trap) · `D-VOWEL` vowel substitution · `D-PATTERN-TRAP` (PTD) contains the target letters without the target sound (*said* for `ai`) — required at L2 per instructional standards, capped at 1/item · `D-POSITION` right sound, wrong position (final vs initial) · `D-VISUAL-NEIGHBOR` letter-shape confusion (b/d, m/n) at L1 only.

**Word knowledge (HFW, vocabulary, homophones, morphology)** · `D-FUNCTION-SWAP` same function class, wrong meaning slot (the current HFW banks' grammatically impossible fillers are replaced by these: every HFW cloze distractor must be the same part of speech as the key so grammar alone can't solve it — lint `L-CLOZE-FIT` machine-checks that each distractor parses in the frame) · `D-HOMOPHONE` sound-alike wrong spelling for the context · `D-MORPH-LITERAL` plausible but wrong morpheme reading (*careful* = "full of car" style traps at L2 only) · `D-DEVELOPMENTAL` attested child error from the approved error list (`content/lexicon/approvedDevErrors.json`: *foots, mouses, runned, goed, sheeps, mans* …) — the ONLY sanctioned non-standard forms, allowed solely in error-recognition formats the blueprint names.

**Comprehension** · `D-DETAIL-AS-MAIN` true detail from the passage posing as main idea · `D-TOPIC-ADJACENT` right topic, unsupported claim · `D-SEQUENCE-SWAP` real events, wrong order · `D-CAUSE-REVERSE` effect posing as cause · `D-PLAUSIBLE-UNSUPPORTED` sensible inference the text doesn't license · `D-OPPOSITE` contradicted by the text (max 1 per item; never the "obviously silly" register — "very sleepy / silly and giggly" filler is banned by `L-DIST-REGISTER`, which flags distractors ≥2 register bands below the key).

Per item: three distractors, ≥ 2 distinct codes, no code twice unless the blueprint says the format demands it. The SIM-SCANNER oracle (MASTERY_SYSTEM §9) is the runtime proof that the set doesn't leak; this taxonomy is the author-time recipe for passing it.

---

## 5. The authoring loop (how Opus actually writes these)

Per skill, per level, in chunks of ~8 items:

1. Read the skill blueprint. Open the unit/cell checklist for the form being filled.
2. Draft 8 items directly in schema v3, each with its author note naming the misconception it separates.
3. Self-review against §2–§4 (the checklist in §7 verbatim).
4. Run the lints locally (`npm run check:bank-lints -- --skill rhyming`). Fix reds. **Never weaken a lint to pass it** — a lint change is a standards change and needs Ben.
5. Run SIM-SCANNER + SIM-NOREPEAT for the skill once a form completes.
6. Commit the chunk with the lint output in the message. Move to the next chunk.
7. When the skill's forms are complete, run the full gate (`check:audit:assessment-rebuild -- --skill X`) and the permanent Question Design Policy gate. Publish only when every machine-verifiable content, simulation, media and runtime check passes.

Chunked authoring matters: 8 items is small enough to keep each one genuinely distinct (the failure mode this whole rebuild exists to kill is "generate 92 at once").

---

## 6. SIM-SCANNER leak oracle (what "no shortcuts" means, concretely)

The oracle answers items using only these strategies — each must fail to beat chance overall:

1. Pick the option sharing the longest letter-chunk with a word in the prompt (kills printed-rime giveaway: current Rhyming "Which word rhymes with cat? → bat/bed/leg/ten" is solvable by `-at` matching).
2. Pick the only option that is grammatical in the cloze frame (kills HFW function giveaways).
3. Pick the option whose pattern letters appear in the prompt (kills "Choose the word that uses the 'ch' digraph" — the current Digraphs L1 template names its own answer).
4. Pick the longest/most-detailed option (classic test-taking tell).
5. Pick the option that repeats a passage word (comprehension surface-match).

Blueprints are designed so the honest strategy is the only reliable one; authors should mentally run the oracle before submitting a chunk.

---

## 7. Review evidence pack

One markdown file per skill, generated by tooling: every item rendered (prompt, choices with rationale codes, key marked), lint summary, simulation results, unit-coverage matrix, and three flagged-for-attention lists (hardest items, any policy-change requests, any lexicon additions). Named reviews may be recorded as useful evidence, but routine human sign-off is not a publication gate and cannot rescue a failing item.

---

## 8. Banned patterns — the wall of shame (all verbatim from the current published bank, 2026-07-29)

Kept here so no future generation pass reinvents them:

- Token-swap cloning: *"Owen and Aunt Jo spent the morning at the fire station…"* / *"Ruby and Mr. Patel spent the morning at the forest trail…"* — same skeleton, same key, published as L1 AND L2.
- Stock emotion sets: Inference's `proud / angry / very sleepy / hungry` rotated across 92 items.
- Self-answering prompts: *"Choose the word that uses the "ch" digraph"* (answer contains `ch`, distractors don't).
- Printed-rime giveaway: *"Which word rhymes with cat?"* with `-at` visible in exactly one choice, all 656 Rhyming items one format, audio suppressed.
- Non-word distractors: `boxs`, `boxies`, `staries`, `foxies`, `dishies` (Plurals).
- Broken frames: *"Choose the precise word means facing across from something?"* (×19, Prepositions L2); *"Tap the picture that shows a adjective."* (×30, Adjectives L1).
- Near-synonym key/distractor pairs: `underneath` keyed against `under`.
- Per-question evidence keys: `the_HFWQ-0001` … six variants of "the" as six different skills.
- Quota-driven counts: 46-per-level padding regardless of construct (Rhyming 656 published while Digraphs has 6 units; Prepositions 303 with 19 malformed).
- Cross-construct leakage: `ai`/`ay` vowel-team completions published inside Long Vowels & Silent E Level 2.
