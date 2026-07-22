# Kimi Media Request - Superseded Child Brand Pack (EXACT characters)

> **Brand update (2026-07-22):** The old umbrella name and logo request are
> superseded by **Little Literacy Guides by literacy.guide** and
> `public/images/pals/little-literacy-guides-logo.webp`. The exact-character
> pose-pack requirements below remain valid. See
> `docs/LITTLE_LITERACY_GUIDES_BRAND_DECISION_2026-07-22.md`.

CRITICAL INSTRUCTION FOR EVERY IMAGE: attach the listed reference file(s)
from the project and tell Kimi: "These exact characters. Match their
design, colours, proportions and faces precisely - do not invent
similar-looking characters." If a result drifts from the references,
regenerate. No text in images unless specified.

Reference files live in the project folder:
- Meadow Pals: `public/guided-reading/series/meadow-pals/book-01/cover.webp` (plus book-05, book-12 covers for more poses)
- Dino Pals: `public/guided-reading/series/dino-pals/book-01/cover.webp` (plus book-03, book-08)
- Moonwood: `public/guided-reading/series/moonwood-tales/book-01/cover.webp` (plus book-02, book-06)

## 1. Retired logo request - do not generate

The old logo job is cancelled. Use the approved
`public/images/pals/little-literacy-guides-logo.webp` and
`public/images/pals/little-literacy-guides-mark.webp` assets instead.

## 2. Exact-character pose packs (12 files) -> public/images/pals/poses/

For EACH series (attach that series' covers), 4 poses, ~800px tall,
transparent PNG, full body, exact character:

`<world>-wave.png` `<world>-think.png` `<world>-celebrate.png` `<world>-read.png`
where `<world>` is `meadow`, `dino`, `moonwood`.

(The celebrate/point cutouts we already have stay in use; these add
variety so the same character isn't frozen in one pose everywhere.)

## 3. Animation sprites (3 files) -> public/images/pals/sprites/

Animation itself is done in the app with CSS (already live: scene drift,
bobbing, pops). What we need is sprite sheets to animate:

| Filename | Spec |
|---|---|
| `meadow-idle-4.png` | One Meadow Pal, 4 frames side by side (2400x600, transparent): standing, slight bounce, blink, standing. Identical framing per frame. |
| `dino-idle-4.png` | Same spec, one Dino Pal |
| `moonwood-idle-4.png` | Same spec, one Moonwood character |

These give us truly animated companions (frame-stepped via CSS) on the
home page and celebrations.

## Delivery
Folders as listed, push as usual, tell Claude - the logo slots into the
child area header, poses into celebrations/empty states, sprites get a
small CSS animation step I'll add on arrival.
