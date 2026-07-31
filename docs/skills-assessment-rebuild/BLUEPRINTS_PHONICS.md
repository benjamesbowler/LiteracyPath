# Blueprints — Phonics (skills 4–5, 10–14)

**Standard.** CVC Short Vowels, Short Vowel Discrimination, Blends, Digraphs, Long Vowels & Silent E, Vowel Teams, R-Controlled Vowels. Read MASTERY_SYSTEM.md + AUTHORING_STANDARDS.md first.

Shared: itemType `short_vowel` / `phonics_pattern` kept. Sitting = 10. Every word→pattern mapping must exist in the approved pronunciation lexicon (`L-LEX`) — this family is where the factual errors live today. All decodable words come from the K-2 imageable list; no `against/almost/august`-class abstracts in child-facing choices.

---

## 4. CVC Short Vowels (`cvc_short_vowels`)

**Construct.** Decode/encode CVC words around their medial short vowel.

**Units.** 5: `short_a short_e short_i short_o short_u` (both levels — L2 hardens words, not units). Family **D-small**: 3 correct · 2 items · ≥2 formats · 2 days.

**Levels.** L1: clean CVC (cat, bed, pig, pot, sun family words). L2: CCVC/CVCC with short vowels (flag, tent, milk) + minimal-pair distractor pressure.

**Formats.** Text tier (all exist): `MISSING_VOWEL_CVC` (c_t + image), `PICTURE_TO_PRINT_CVC/MATCH` (image → 4 printed words), `SHORT_VOWEL_WORD`, `PUT_SOUNDS_IN_ORDER` (L2). Audio tier: `HEARD_WORD_TO_PRINT_MINIMAL_PAIR` upgrades. Each unit's variants span ≥2 formats per form-set.

**Bank.** Per level: 5 units × 6 (2 formats × 3 variants) = **30** + R 16. Current 412 published → prune to ~92 best (this bank is healthy; it's oversized and 12 units of its 42 published keys are stray non-vowel keys that get re-tagged or dropped — published keys must be exactly the 5 vowels).

**Distractors.** `D-VOWEL` (medial swap: cat→cot→cut, mandatory ×2 in every item), `D-RIME-NEAR`. Never a consonant swap posing as vowel work.

**Exemplar (L1, unit short_o).**
```json
{"id":"lp3.cvc_short_vowels.l1.A.short_o.v1","itemKey":"short_o","formatType":"MISSING_VOWEL_CVC",
 "prompt":"Finish the word: p_t (picture: cooking pot)","choices":[{"text":"o","isKey":true,"rationale":"KEY"},
 {"text":"a","isKey":false,"rationale":"D-VOWEL"},{"text":"e","isKey":false,"rationale":"D-VOWEL"},{"text":"i","isKey":false,"rationale":"D-VOWEL"}],
 "answer":"o","mediaTier":"image-required"}
```

---

## 5. Short Vowel Discrimination (`short_vowel_discrimination`)

**Construct.** Hear/compare medial short vowels across words (the contrastive sibling of skill 4).

**Units.** Same 5 vowels. Family **D-small**. Keep this bank's shape — it is the audit's "strongest early phonics logic" (5/5 units, 2 formats). Work = prune 299 → ~60 (5 × 6 per level), kill the 23 duplicate groups, re-lint, add `D-VOWEL` near-pair pressure at L2 (e/i, o/u confusions get 2 slots), tag formal-feedback removal (system-wide anyway).

**Formats.** `LISTEN_CHOOSE_VOWEL` (tier: audio-required — runs now with on-screen word+image interim per MASTERY_SYSTEM §7), `PICTURE_TO_PRINT_MATCH`, plus new text-tier `SHORT_VOWEL_IMAGE_GROUP_SELECT` (which picture has the same middle sound as ⟨anchor⟩ — anchors from instructional standards: cat/bed/pig/pot/sun).

---

## 10. Blends (`blends`) — REBUILD

**Verified faults.** 97 published items over 38 configured pattern keys → 0 keys can meet any multi-evidence rule; two formats but each unit sees ~1 item per format; no audio.

**Units — curated down.** L1: 12 beginning blends `bl cl fl pl sl br cr dr fr gr st sw` (drop the long tail; 38 units at 3 attempts each is an unpassable level). L2: 6 beginning (`sc sk sm sn sp tr`) + 6 final (`st nd nt mp nk lt` — final blends belong here, coordinated with Final Sounds L2 which keeps its own sound-isolation framing; the same letters can appear in both skills because the tasks differ: isolate-the-sound vs decode-the-cluster). Family **D-small** per level (12 units).

**Formats.** Text tier: `BLEND_COMPLETE_WORD` (__og + image → bl/cl/fr/gr), `BLEND_IMAGE_CHOICE` (which picture starts with /bl/ — spoken-ready), new `BLEND_ODD_ONE_OUT` (L2: flag, flip, frog, fog — which does not start with a blend). Audio tier: segmentation (`BLEND_SOUNDS`) upgrades.

**Bank.** L1: 12 × 4 = 48 + R. L2: 12 × 4 = 48 + R. (4 variants per unit: D-small needs 4 no-repeat attempts — the digraphs/final_sounds arithmetic.) Words: real, decodable, imageable (blue, clock, flag, plum, sled, brush, crab, drum, frog, green, star, swim seed L1 — extend in-lexicon).

**Distractors.** `D-ONSET` single-consonant reduction (fog for frog — THE blend error, mandatory), `D-PATTERN-TRAP` other blend sharing a letter (fl for fr), `D-RIME-NEAR`.

---

## 11. Digraphs (`digraphs`) — REBUILD PROMPTS

**Verified faults.** All 60 L1 prompts name the answer ("Choose the word that uses the *ch* digraph" with only one ch-word visible) — pure chunk spotting; 6/6 units have 2 formats but only 1/6 passes the current rule because final-position exposure is missing.

**Units.** 6: `sh ch th wh ph` + `ck` (ALL_DIGRAPH_PATTERNS as configured; ng lives in Final Sounds L2). Family **D-small**, with the position requirement kept: each unit's variants must include ≥1 **final-position** item (wish, catch, bath) — wh/ph exempt (initial-only in child vocabulary; record the exemption in the blueprint data so `isMasteryEligible`'s successor reads it from config, not regex).

**Levels.** L1 initial position, anchor-word prompts; L2 final/medial position + digraph-vs-blend contrast.

**Formats.** Text tier: `DIGRAPH_IMAGE_CHOICE` reworded — "Which picture starts like **shell**?" (anchor word, never naming the pattern), `DIGRAPH_COMPLETE_WORD` (fi__ + image → sh/ch/th/ck). Audio tier: spoken-anchor upgrades.

**Bank.** Per level: 6 × 4 (2 formats × 2 variants, ≥1 final-position among them) = **24** + R 12. Current 120 → ~72.

**Distractors.** `D-PATTERN-TRAP` other digraph (mandatory), `D-ONSET` single letter of the pair (s for sh — the decomposition error), `D-POSITION` at L2.

---

## 12. Long Vowels & Silent E (`long_vowels_silent_e`) — WITHDRAW & REBUILD (P0)

**Verified faults.** L2 published items complete `ai/ay/ie/ew` vowel-team words inside this skill (construct leak into skill 13, by design of `skillLevelDepthConfig` — the config itself is wrong); audit found lexicon errors (`apple→a_e`-class) in the candidate pipeline; 0/20 keys mastery-eligible; r-influenced words (care, fire, chore) contaminate the pattern.

**Construct, restated.** Silent-e (VCe) ONLY. Vowel teams move wholly to skill 13. This is the one skill whose published bank is withdrawn (release flag off) until its wave completes.

**Units.** 4 mastery units: `a_e i_e o_e u_e`. `e_e` = recognition-only exposure items, excluded from pass computation (blueprint marks it `nonGating: true`) — matching the audit's "sparingly, approved examples only".

**Levels.** L1: pattern choice + word reading from the current clean lexicon (cake game name gate · bike five time ride · home bone rope nose · cube tune mule cute; no r-influenced, `-ve`/`-ce` soft-ending, or dialect-sensitive words). L2: short↔long contrast pairs (cap/cape, kit/kite, hop/hope, cub/cube — mandatory `D-PATTERN-TRAP` short-vowel twin in every item) + real-vs-distractor VCe decoding.

**Formats.** Text tier: `LONG_VOWEL_SILENT_E_PATTERN` (image+word → pattern), new `SILENT_E_TRANSFORM` (hop + e → ? with image pair — the classic magic-e format), `CVC_VCE_CONTRAST` (which word says /kite/: kit, kite, kitt, kate → real-word rule applies: kit/kite/bite/kate all real). Audio tier: heard-word→spelling upgrades.

**Bank.** L1: 4 × 6 (2 formats × 3 variants) = 24 + e_e exposure 4 + R 12. L2: 4 × 6 = 24 + R 12. Total 76 (current 104, all replaced).

---

## 13. Vowel Teams (`vowel_teams`) — REBUILD

**Verified faults.** 0/18 units eligible; heavy `LONG_VOWEL_TEAM_COMPLETE` repetition (102/141); 28 duplicate groups; absorbs silent-e leakage both directions.

**Units.** L1 (stable, one-sound teams): `ai ay ee ea oa igh` (6). L2 (variable/diphthong): `oo ow ou oi oy ew aw` (7). Family **D-small**. PTD required at L2 per instructional standards (`hadPTDExposure` becomes a blueprint-declared format slot, not an inference).

**Formats.** Text tier: `LONG_VOWEL_TEAM_COMPLETE` (r__n + image → ai/ay/ee/oa), `CPS` cross-pattern select ("Which word has the long a sound? rain / bed / ship / frog" — the instructional-standards CPS exemplar, now actually published), `VOWEL_TEAM_SORT` (L2: which word does NOT say /oo/: moon, book — the two-sounds-of-oo contrast). Audio tier: anchor-word audio upgrades.

**Bank.** L1: 6 × 6 = 36 + R 12. L2: 7 × 6 = 42 + R 12. Total 102 (current 141 replaced). Position rules: `ay/oy/aw` word-final examples, `ai/oa` medial — encode in lexicon entries; `L-LEX` enforces (this kills `birthday→ay`-in-the-wrong-skill and misplaced-team errors at once).

**Distractors.** `D-PATTERN-TRAP` same-sound rival spelling (rain→rane), same-letters-different-sound (bread for ea) — mandatory at L2; `D-VOWEL`.

---

## 14. R-Controlled Vowels (`r_controlled_vowels`)

**Construct sound.** Best advanced bank (5/5 units potentially eligible) — prune + harden, don't rebuild.

**Units.** 5: `ar or er ir ur`. Family **D-small**. L1 recognition in familiar words (car, star, corn, fork, her, bird, girl, turn, hurt); L2: er/ir/ur discrimination (the three-way /ɜr/ spelling choice — mandatory `D-PATTERN-TRAP` sibling spellings ×2 per item) + ar/or contrast.

**Work.** Use 60 construct-sized items (5 × 6 per level + R) with named formats (`R_CONTROLLED_PATTERN`, `CPS`). Dialect notes live in the checked-in lexicon and are enforced by the same release gate. Distractors use plausible, pronounceable sound-based alternatives.

**Exemplar (L2, unit er).**
```json
{"id":"lp3.r_controlled_vowels.l2.B.er.v2","itemKey":"er","formatType":"R_CONTROLLED_PATTERN",
 "prompt":"Finish the word: h__ (she did it — 'it belongs to ___')","choices":[{"text":"er","isKey":true,"rationale":"KEY"},
 {"text":"ir","isKey":false,"rationale":"D-PATTERN-TRAP"},{"text":"ur","isKey":false,"rationale":"D-PATTERN-TRAP"},
 {"text":"or","isKey":false,"rationale":"D-VOWEL"}],"answer":"er"}
```
