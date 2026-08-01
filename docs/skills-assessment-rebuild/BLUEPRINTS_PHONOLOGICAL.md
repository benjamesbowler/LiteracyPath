# Blueprints — Phonological Awareness (skills 1–3)

**Standard.** Per-skill authoring specs. Read MASTERY_SYSTEM.md (rules) and AUTHORING_STANDARDS.md (item craft) first; this file only states what is specific to each skill. Counts marked *(bank)* are minimums the gates enforce.

Shared for this family: itemTypes already in use (`initial_sound`, `final_sound`, `rhyming_family`) are kept so existing ledger rows survive. Sitting = 10. All three skills carry the **"print-pattern evidence"** qualifier until the audio tier ships (MASTERY_SYSTEM §7); every item below is written audio-first-ready (spokenPrompt present, no printed giveaway) so the later media pass adds recordings without rewriting content.

---

## 1. Initial Sounds (`initial_sounds`)

**Construct.** Isolate the first sound of a spoken/pictured word and link it to its letter.

**Units.** 25 letters (a–z minus x, per `coverageExpectations` — keep that decision and its note). Rule family **D-large**: unit passed = 2 correct · 2 distinct items · 2 days · latest correct.

**Levels.** L1: CVC/CCVC concrete imageable words, single clear onset (sun, map, dog). L2: longer/multisyllable imageable words with the same single-onset task (sunflower, mountain) plus onset-neighbor distractor pressure (s/z, b/p, m/n).

**Formats.** Text tier: `FIRST_SOUND` (word+image → 4 letter choices), `INITIAL_SOUND_PAIR_SELECT` (which picture starts like ⟨anchor⟩ — uses existing images). Audio tier (deferred): spoken-word-only variants of both. Keep the existing letter-coverage selector machinery (initialSoundSelector) — it already tracks per-letter mastery; it plugs into the new reducer.

**Bank.** Per level: 25 units × 3 variants = **75** (forms A/B/C = one variant of every unit each) + form R 16 items. Current published: 92 total with 13/25 units under-formatted → this is a top-up + re-tag wave, not a rebuild; the existing 92 items are candidates for reuse where they pass the lints (most FIRST_SOUND items will).

**Distractors.** `D-ONSET` (letter of a similar onset: b for p), `D-VISUAL-NEIGHBOR` (b/d) L1 max 1, `D-POSITION` (letter of the word's FINAL sound — the classic error), fourth slot free choice of codes. Never three random letters.

**Exemplar (L2, unit "m").**
```json
{"id":"lp3.initial_sounds.l2.B.m.v2","itemKey":"m","formatType":"FIRST_SOUND","mediaTier":"image-optional",
 "prompt":"Which letter makes the first sound in mountain?","spokenPrompt":"Mountain. What sound does mountain start with?",
 "choices":[{"text":"m","isKey":true,"rationale":"KEY"},{"text":"n","isKey":false,"rationale":"D-ONSET"},
            {"text":"w","isKey":false,"rationale":"D-VISUAL-NEIGHBOR"},{"text":"t","isKey":false,"rationale":"D-POSITION"}],
 "answer":"m","notes":"m/n nasal discrimination at length; t = final-sound error"}
```

**Dies from current bank.** 12 exact duplicate prompt+answer groups; UNKNOWN-format stragglers (13 items).

---

## 2. Final Sounds (`final_sounds`)

**Construct.** Isolate the final sound of a word. The hardest early-phonology skill — position errors dominate.

**Units.** L1: 8 single-consonant finals `b d g l m n p t` (keep the forbidden-list guard — no /k//s//r//f/ ambiguity at L1). L2: 10 finals `sh th ll ng nd nk st sk ft lt`. Rule family **D-small** (≤10 units): 3 correct · 2 items · 2 days · latest correct.

**Formats.** Text tier: `ENDING_SOUND` (word+image → 4 letter/pattern choices), `FINAL_SOUND_PAIR_SELECT` (which picture ends like ⟨anchor⟩), `ENDING_SOUND_WORD_MATCH` (L1 only). Each unit's 3 form-variants must span ≥2 of these (this is what makes the §3.1 two-format requirement reachable — currently 14/26 units are single-format).

**Bank.** L1: 8 × 4 = 32 + R. L2: 10 × 4 = 40 + R. Total ≤ 86. (4 variants per unit, not 3: D-small requires 4 attempts over 2+ distinct items with zero repeats in the pass budget — a 3-item pool forces a repeat; same arithmetic that sized digraphs at 4.) **Current published is 366 — prune ~75%**, keeping the best lint-passing items (final-sound bank quality is decent; volume is the problem, plus the configured-vs-published scope mismatch the audit flagged: published keys must exactly match the 8+10 inventories, nothing else).

**Distractors.** `D-POSITION` (the word's INITIAL sound — mandatory in every item; it is THE misconception), `D-RIME-NEAR` (final sound of a rhyming neighbor), `D-VOWEL`-adjacent final (d/t, g/k voicing pairs) at L2.

**Exemplar (L2, unit "ng").**
```json
{"id":"lp3.final_sounds.l2.A.ng.v1","itemKey":"ng","formatType":"ENDING_SOUND",
 "prompt":"Which ending finishes the word ri__?","spokenPrompt":"Ring. What sound does ring end with?",
 "choices":[{"text":"ng","isKey":true,"rationale":"KEY"},{"text":"n","isKey":false,"rationale":"D-RIME-NEAR"},
            {"text":"r","isKey":false,"rationale":"D-POSITION"},{"text":"nk","isKey":false,"rationale":"D-PATTERN-TRAP"}],
 "answer":"ng","notes":"n vs ng is the real discrimination; nk is the neighbor cluster"}
```

---

## 3. Rhyming (`rhyming`) — REBUILD (worst construct fault in the product)

**Verified faults.** All 656 published items are one format (`RHYMING_PICTURE`) with the prompt and choices printed, so `-at` chunk-matching solves them without any phonology (SIM-SCANNER strategy 1); audio is deliberately suppressed in the UI; 222 duplicate prompt+answer groups; 0/45 units mastery-eligible; L1/L2 split 476/180 is quota noise.

**Construct, restated.** L1: **hear** that two words rhyme (phonological). L2: work with rhyme in print — recognize written rhyme families and generalize to less-imageable words (orthographic, a legitimately different construct, named honestly).

**Units.** L1: the 21 CVC rime families already configured (`at an ap am ag ad ed en et eg ig in ip it og op ot ug un up ut`). L2: the 24 configured harder families (`ing ang ong ink ock ack ick ill all ell ash ish uck ake ame ide ight oat eep ouse ird urn ar or` — keep the ank/unk media holdout). Rule family **D-large** at L1 (21 units), **D-large** at L2.

**Formats.**
- L1 text tier (interim until audio): `RHYME_MATCH_PICTURE` — spoken-style prompt text ("Which one rhymes with **cat**?"), target word shown, **4 picture choices with NO printed labels**. The checked-in imageability whitelist contains only concrete words whose current assets pass the media gate.
- L1 audio tier (deferred, specced now): same items with recorded target + choice audio and replay buttons; prompt audio un-suppressed.
- L2 text tier: `READ_FIND_RHYME` (printed words, labels intentional — the orthographic construct) and `RHYME_ODD_ONE_OUT` (4 printed words, one doesn't rhyme). Print giveaway is legal here BY DESIGN — but distractors must include a `D-PATTERN-TRAP` (visual rime, different sound: *cow/snow*-class, *ear/bear*) so chunk-matching alone still fails SIM-SCANNER.

**Bank.** L1: 21 × 3 = 63 + R 16. L2: 24 × 3 = 72 + R 16. Total ≤ 167. **Prune 656 → ~167** (75% cut). Rebuild items fresh; the 222-duplicate legacy pool is not worth salvaging item-by-item.

**Distractors (L1).** From `rhymeGroups` neighborhoods: `D-RIME-NEAR` (cot for cat — mandatory), `D-ONSET` (cap for cat), `D-SEMANTIC` (dog for cat) — never two correct-rhyme pictures (lint `L-RHYME-UNIQUE` verifies exactly one choice shares the target rime in the approved lexicon).

**Exemplar (L1, unit "og").**
```json
{"id":"lp3.rhyming.l1.C.og.v3","itemKey":"og","formatType":"RHYME_MATCH_PICTURE","mediaTier":"image-required",
 "prompt":"Which picture rhymes with dog?","spokenPrompt":"Dog. Which one rhymes with dog?",
 "choices":[{"text":"log","isKey":true,"rationale":"KEY"},{"text":"dot","isKey":false,"rationale":"D-RIME-NEAR"},
            {"text":"dish","isKey":false,"rationale":"D-ONSET"},{"text":"cat","isKey":false,"rationale":"D-SEMANTIC"}],
 "answer":"log","notes":"choices render as unlabeled pictures; dot shares og-vowel+onset pressure"}
```

**DoD deltas.** Extra gate: SIM-SCANNER strategy 1 (chunk match) must score < 5% on L1 (it currently scores ~100%). Renderer change (label suppression + replay buttons) ships with the bank, same wave.
