# Literacy Pals — open items (12 Jun 2026)

Everything in the app is built and verified. The only outstanding items
are media deliveries and optional polish:

## Waiting on Kimi
1. **Dino re-draws (2 files)** — `dino-think.png` pose and `dino-idle-4.png`
   sprite sheet (originals corrupted during import; stand-ins in place).
   Specs in `docs/KIMI_LITERACY_PALS_BRAND_REQUEST.md` sections 2-3.
2. **Quest audio quality re-record** — if any of the latest 208 words still
   sound unclear in classroom testing, re-run
   `docs/KIMI_GOLD_VOICE_QUEST_RERECORD.md`.
3. **27 cycle poem narrations** — the Poem Time station shows the poems but
   has no whole-poem narration yet (tapping the Listen button plays the
   target word). Worth a request when convenient; poems live in
   `src/data/elCyclePoems.js`.

## Optional next polish
- Refactor the remaining big `LEGACY-LINT` tagged files (teacher-side,
  working fine; the two small ones are already properly refactored).
- DONE: Sentence Fix-It hard tier expanded to 18 rounds
  (`docs/KIMI_GOLD_VOICE_SENTENCE_FIX_2.md` covers the 6 new clips).
- DONE: Story Stop station - book-character questions in every cycle.

## How deliveries come in
Drop any Kimi folder in the project root and tell Claude - the import
pipeline (watermark patch, quality checks, compression, manifest) is a
standard procedure now.
