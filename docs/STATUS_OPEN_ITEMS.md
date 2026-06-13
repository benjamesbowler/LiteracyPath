# Literacy Pals — honest open items (13 Jun 2026)

Verified against the actual code and files, not memory.

## Media: ALL DELIVERED AND LIVE (13 Jun)
The KIMI_NEXT_MEDIA_RUN batch arrived complete: 12 pattern sounds,
26 letter names (wired into Letter Spot), 3 painted adventure maps
(stops pinned to the landmarks; tweak coordinates after a visual pass),
and all 458 Story Quest narrations in the gold voice.
No outstanding media requests.

## Genuinely not finished (build side)
1. **Family digest v0** — planned in the product phases, never built.
2. **Alignment normalization pass** — audit exists
   (docs/AUDIT_ALIGNMENT.md), mechanical pass approved, not executed.
3. **Big LEGACY-LINT files** — suppressed with tags, not refactored.
   Teacher-side, working.

## Verified done (today's deploy pending push)
- Original good phoneme set restored (bad batch discarded; n and short_i
  byte-verified against the pre-batch versions).
- All 27 poem narrations imported and wired into Poem Time.
- Dino think pose + idle sprite delivered and live.
- 4 bespoke home banners delivered and wired.
- All 6 Sentence Fix-It hard clips delivered.
- Sound Hunt pictures disk-verified (0 unverifiable tiles in 1,158 rounds).
- Book quiz no longer interrupted; quest mission = full cycle; stations
  auto-advance with a stop option; mission book level-matched.

## Process rule learned
Audio batches that REPLACE existing known-good files get spot-listened
before import. The import pipeline treats replacements as a red flag.
