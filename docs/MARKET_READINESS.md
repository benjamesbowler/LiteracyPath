# Market Readiness — 2026-07-04 (Loops 1–5 verdict)

## Shipped this pass
- **Gold-voice letter audio fully replaced**: 90 hash-verified recordings imported
  (all sounds, digraphs, names); defective-clip blocklist emptied. **Benjamin's
  ear-check of `docs/previews/letter_audio_audit.html` is the last gate.**
- **Loop 1 (layout)**: den page half-screen void fixed; CVC flow, arcade hub and
  sentence games widened for projectors; den companion no longer covers content.
- **Loop 2 (competitor parity)**: `docs/COMPETITOR_NOTES.md` (Raz-Kids, TYM,
  Starfall, Khan Kids, Duolingo ABC, cited). Implemented: one-tap "Start today's
  quest", per-answer sparkle celebrations, wrong-answer sound coaching (cue
  replays before retry), pulsing next-stop / dimmed done stops on maps.
- **Loop 3 (games)**: playthrough simulations for every station × every cycle ×3
  runs are now unit tests. Found & fixed: cycle 24's "ff ss zz ll" bundled focus
  row broke Sound Hunt (empty station) and degraded its cues — split into
  per-grapheme entries with a never-empty fallback. Arcade data pools
  (rhymes, families, sentences, fixes) all rule-checked.
- **Loop 4 (education)**: Word Build now prefers words built only from TAUGHT
  letters (same rule as worksheets, safe fallback); "tap"-only child language and
  curriculum-order rules locked in as tests. Suite: 60 → 80 tests.
- **Loop 5 (resilience)**: double-tap during round transitions could
  double-count/skip — fixed with an answer lock.

## Outstanding before "world-class" sign-off
1. **Ear-check the 90 new audio clips** (2 minutes, audit page) — AI-generated
   voice; nothing else validates actual pronunciation.
2. **Flagship new game** — three concepts pitched, awaiting Benjamin's pick.
3. **Remaining competitor gaps** (in COMPETITOR_NOTES): choice-based rewards,
   per-phoneme error re-surfacing, daily return bonus, teacher strongest/weakest
   sound panel, learning-goal voiceover at cycle start.
4. **Performance**: main bundle ~1.08MB (225KB gz) is acceptable but the
   generated question banks (2–3MB chunks) should move to on-demand loading in a
   dedicated session (touching the loader is risky to rush).
5. **Poem v2 narrations** still unrecorded (request doc ready); poems are silent
   until then by design.
6. **Visual verification on real devices**: code-level layout rules are tested,
   but nothing replaces 10 minutes on the live site with a projector + iPad.
7. Backlog unchanged: alt-text metadata, HFW curated migration, QA-variant image
   compression, media-registry re-registration, Dolch/Fry band decision.

## Verdict
Educationally safe to deploy: no wrong audio can play, no station can open
empty, no round is unwinnable, curriculum order is enforced by tests. "Market
polish" now depends on the human checks above (audio ears, device eyes) and the
queued art/audio pipeline items — not on known code defects.
