# Art Request — Arcade Game Icons (2026-07-06)

Six icons for the redesigned Arcade cards. They sit on **dark** cards over a
coloured gradient tile, so each icon reads as a bold, simple illustrated glyph.
Fulfillable by Adobe Firefly (if connected) or the Kimi import pipeline.

## Global art direction (applies to all six)
- **Style:** realistic-cartoon, clean vector-illustration feel — confident and
  premium, **not babyish**, no rainbows, no faces on inanimate objects.
- **Format:** `.webp`, **512×512**, transparent background (the card supplies the
  coloured tile behind it). Centered subject with ~12% padding.
- **Palette per icon:** mostly white/light subject with one or two accent pops so
  it pops on a dark card; keep it cohesive across the set (same line weight, same
  light source, same rounded-corner language).
- **Readable at 56px** — no fine detail that disappears when small.
- Do **not** overwrite any existing file; write to the exact new paths below.

## The six icons

| # | Target path | Subject / scene |
|---|-------------|-----------------|
| 1 | `public/images/learn-games/icon-rocket-run.webp` | A sleek little rocket ship climbing, gold body with coral fins and a cyan thruster glow. Space. |
| 2 | `public/images/learn-games/icon-word-climb.webp` | A curling green beanstalk/vine with a few leafy ledges stepping upward; a small glowing climber token near the top. Nature/fantasy. |
| 3 | `public/images/learn-games/icon-sound-muncher.webp` | A rounded muncher creature (abstract, no cartoon face) mid-chomp inside a simple glowing maze corner. Reef/cave teal. |
| 4 | `public/images/learn-games/icon-word-leap.webp` | A dynamic side-on jumper silhouette leaping over a gap between two blocks, motion lines. Jungle green/amber. |
| 5 | `public/images/learn-games/icon-bubble-blaster.webp` | A small launcher/cannon aimed up with one glowing bubble leaving it. Deep-sea blue. |
| 6 | `public/images/learn-games/icon-star-catcher.webp` | A basket/net catching a falling star-word, a couple of stars streaking down. Night-meadow indigo. |

## After delivery
- Update each `GAME_LIST` entry's `icon:` to its new path (currently the new
  games reuse `icon-pop-word.png` as a placeholder).
- Icons must exist on disk before merge (guarded like the quest covers test).
