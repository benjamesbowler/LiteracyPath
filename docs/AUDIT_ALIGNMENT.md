# Alignment & Typography Audit

*Code-verified across all 9 stylesheets.*

## What's consistent (good)

- Font families are 95% tokenized: Lexend for reading/display, Inter for
  UI, via design tokens. The candy fonts (Fredoka/Nunito) are gone.
- Spacing and components follow the token system on all surfaces built
  or rebuilt in the last two weeks (home, mission, quest, arcade, games,
  quizzes, certificates, Literacy Pals theming).

## What's NOT consistent (ranked)

1. **75 distinct text colors.** Four different "almost black" inks are
   used interchangeably: #0F172A (26x), #172033 (7x), #111827 (7x),
   #101828 (token). Plus a rogue navy #1A3A6B used 40x in assessment
   styles. Readers can't see the difference consciously - but it's why
   screens feel subtly "off" next to each other.
   **Fix:** one ink token, one muted token, one subtle token; mass
   replace. (Safe, mechanical - I can do this next round.)
2. **68 distinct font sizes.** A proper scale needs ~9. Most strays are
   0.8125rem/0.86rem/0.875rem-style near-duplicates.
   **Fix:** snap to a 9-step scale (11/12/13/14/16/18/22/28/36).
3. **12 border radii** (4,6,7,8,10,12,14,16,18,20,24,999). Cards alone
   use 8, 12, 14, 16, 18, and 20.
   **Fix:** 4-step scale: 8 (inputs), 12 (tiles), 16 (cards), 999 (pills).
4. **Stray fonts:** Arial in 2 places (print/login-cards windows),
   2 raw "Lexend" literals instead of the token.
5. **Shadow styles:** 3 generations coexist (flat 2006-era, brand
   tokens, new glass). Teacher pages still mostly on generation 2 -
   acceptable, but the assessment area mixes all three.

## Recommendation

One mechanical "normalization pass" (find/replace to tokens, no visual
redesign) clears items 1-4 across the whole app in a single round.
