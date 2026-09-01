# Blueprints — High-Frequency Words (skills 6–9)

**Standard.** Four bands (`hfw_1_25`, `hfw_26_50`, `hfw_51_75`, `hfw_76_100`), 25 approved words each (source of truth stays `hfwApprovedCoverageWords.js`). One blueprint, four instantiations. Read MASTERY_SYSTEM.md + AUTHORING_STANDARDS.md first.

---

## The P0 fix: evidence keys

Every published HFW item currently carries `itemKey: "the_HFWQ-0001"`-style per-question keys — 147–149 keys per band, matching **0** of the 25 configured word keys, so word coverage can never complete. In v3:

```
itemType: "sight_word"
itemKey:  "the"            // the word — THE unit
id:       "lp3.hfw_1_25.l1.A.the.v1"   // variant identity lives in the id, nowhere else
```

Current evidence keys are the canonical HFW words themselves. Historical per-question key migration logic has been permanently removed and is not part of the runtime standard.

**Construct.** Instant recognition (L1) and spelling (L2) of the band's 25 words, evidenced in meaning-bearing context — never visual spotting (per instructional standards' sight-word section).

**Units.** The 25 words. Rule family **D-large**: word passed = 2 correct · 2 distinct items · 2 days · latest correct. Sitting = 12. Runtime progression always uses the sitting length and 70% phase rule defined in the current blueprint/policy modules.

**Levels.**
- **L1 — read & choose.** `HFW_SENTENCE_CLOZE` (printed sentence, 4 word tiles) and `HFW_READ_FIND_WORD` (find the word ⟨said⟩ among 4 printed HFW neighbors — legitimate here: the construct IS print recognition; distractors are same-band visual neighbors: said/sand/says/side-class, all real words).
- **L2 — spell.** `HFW_LETTER_BUILD` (letter tiles, existing panel) and `HFW_SENTENCE_SPELL` (sentence with blank, type/build the word). L2 keeps the listen-and-spell frame but each item ships `sentenceText` for on-screen display until recorded audio lands (mediaTier `audio-required` items run in the interim as read-and-spell — honest per MASTERY_SYSTEM §7; do NOT rely on browser TTS as the primary carrier, per the audit).

**The cloze quality bar** (this is where the current bank fails — 50 duplicate sentence groups per band, grammar-giveaway distractor sets):

1. Sentence frames are original per item (O-1/O-2 lints run on sentences).
2. Distractors use the same grammatical slot wherever the cumulative approved HFW inventory supplies three viable alternatives (`L-CLOZE-FIT`). Band 1 has a documented closed-inventory exception: its approved verbs, articles, and pronouns cannot always supply a four-option set in which every form agrees. In those cases, use only developmentally plausible agreement/form errors, label them `D-DEVELOPMENTAL`, and keep the sentence short and natural. Never import arbitrary non-HFW fillers or switch to a metalinguistic definition merely to make four options parse.
3. All four options come from the same or earlier band (no future-band words; no non-HFW content words as fillers).
4. Function-word meaning is carried by the sentence, not the option ("She **said** hello." vs "She **saw** hello." — the distractor must make the sentence wrong, not impossible).
5. Frames use only decodable-or-earlier-band supporting words so the child's decoding load doesn't gate word recognition.

**Bank per band.** L1: 25 words × 3 = **75** (forms A/B/C complete). L2: 25 × 2 = **50** (forms A/B). R: 16 mixed. = 141/band, 564 total (current 588 published all replaced). Reuse: `hfwCuratedSentences.generated.js` (770KB of vetted sentence material) may be mined as raw sentence candidates, but every reused sentence still passes the full lint set as if new.

**Distractors.** `D-FUNCTION-SWAP` (same POS, wrong meaning — aim for ×2 whenever the cumulative HFW inventory permits it), `D-DEVELOPMENTAL` for the explicit Band 1 agreement/form exception above, `D-VISUAL-NEIGHBOR` (was/saw, of/for, the/they — the real confusions, from the band lists), and `D-HOMOPHONE` where the band supplies one (to/two, there/their in bands 1–2).

**Exemplars (band 1, unit "was").**
```json
{"id":"lp3.hfw_1_25.l1.B.was.v2","itemKey":"was","formatType":"HFW_SENTENCE_CLOZE",
 "prompt":"The cat ___ on the bed.","choices":[{"text":"was","isKey":true,"rationale":"KEY"},
 {"text":"is","isKey":false,"rationale":"D-FUNCTION-SWAP"},{"text":"saw","isKey":false,"rationale":"D-VISUAL-NEIGHBOR"},
 {"text":"has","isKey":false,"rationale":"D-FUNCTION-SWAP"}],"answer":"was",
 "notes":"all four verbs parse; only tense/meaning picks was — saw is the reversal error"}

{"id":"lp3.hfw_1_25.l2.A.was.v1","itemKey":"was","formatType":"HFW_LETTER_BUILD","mediaTier":"audio-required",
 "prompt":"Build the missing word: The soup ___ hot.","sentenceText":"The soup was hot.",
 "letterBank":["w","a","s","z","o"],"choices":[],"answer":"was"}
```

**Per-band notes.**
- Band 1 (a…you): shortest words, highest visual-neighbor density — `D-VISUAL-NEIGHBOR` mandatory in every L1 item.
- Band 2 (all…your): includes said/each/which — the classic irregular spellings; L2 letter banks always include the tempting phonetic wrong letters (sed → s,e,d present).
- Band 3 (about…write): would/write silent letters get double R-form coverage (retention targets the known-fragile words).
- Band 4 (been…who): `oil/number/water` behave like content words — clozes must still make them function meaningfully; `who` pairs with `how` as mutual visual neighbors.

**Dies from current bank.** Per-question keys; 50 duplicate sentence groups per band; grammar-giveaway option sets; browser-TTS-only L2 audio dependency; the `hfw-level-2.high-frequency-words-51-100` orphan shard (51–75 and 76–100 get real L2 banks of their own).
