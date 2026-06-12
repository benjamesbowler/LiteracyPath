# Literacy Pals — Child Area Design System

*The complete design plan for every child-facing screen. Goal: the
production quality of Teach Your Monster / Raz-Kids, built on our own
book worlds instead of generic UI.*

## The big idea

The child area is **Literacy Pals**. Children don't move through "easy,
medium, hard" — they move through three worlds they already know from
our books:

| World | Source series | Used for | Mood / palette |
|---|---|---|---|
| **Meadow Pals** | Meadow Pals books (25) | Beginners — easy games, Levels A shelves, cycles 1–9 | Sunny meadow: spring green `#5FA052`, sky `#8EC9E8`, daisy cream `#FFF9E8`, poppy `#E2725B` |
| **Dino Pals** | Dino Pals books (20) | Middle — medium games, Level B shelves, cycles 10–18 | Warm prehistoric: fern `#3E7C4F`, clay `#D98841`, sandstone `#F5E7D0`, volcano `#C2502E` |
| **Moonwood** | Moonwood Tales books (25) | Advanced — hard games, Levels C–D, cycles 19–27 | Twilight forest: dusk violet `#5E4D9C`, moonlight `#BFD3F2`, deep pine `#1E3A34`, firefly gold `#E8B563` |

One rule everywhere: **the world supplies warmth (backgrounds, accents,
characters); the UI itself stays clean** — frosted glass panels, Lexend/
Inter type, generous touch targets. Themed, never cluttered.

## How the theme is applied (technical)

A single `data-pal-world="meadow|dino|moonwood"` attribute on the page
container switches CSS custom properties: `--pal-accent`, `--pal-accent-soft`,
`--pal-bg` (a layered gradient mesh in world colors), `--pal-art`
(a world banner image). Every child surface reads these tokens, so the
whole screen re-themes from one attribute.

World banner art comes from our own book covers/pages today (with a soft
gradient overlay for legibility) and is replaced by dedicated panoramic
scenes from the Kimi request below when they arrive.

## Screen-by-screen plan

1. **Entry ("Student" card)** → renamed **Literacy Pals**, with the
   three world characters peeking from the card art.
2. **Child login** (school → class → name → pictures): Meadow world
   theme (gentlest), characters watching from the corners, frosted card.
3. **Home**: header becomes the Literacy Pals lodge — companion avatar,
   streak flame, gem count. Mission tiles carry the world art of the
   content they point to. Explore cards = world doorways.
4. **Skills Quest map**: cycles 1–9 ride through the Meadow, 10–18
   through Dino valley, 19–27 into Moonwood — the map background and
   stop styling shift as the child scrolls their path. Stations and
   round cards inherit the active world.
5. **Game arcade**: difficulty switch = world switch. Easy shows the
   Meadow header art and accents; Medium goes Dino; Hard goes Moonwood.
   Game cards keep their art but frames/buttons take world accents.
6. **In-game**: stage backdrop = soft world mesh + world corner art;
   balloons/tiles/meters take world accents automatically via tokens.
7. **Reading Library**: shelves themed by level band (A=Meadow, B=Dino,
   C/D=Moonwood) so "leveling up" literally means traveling to the next
   world. Level-up ceremony shows the next world opening.
8. **Story Quests**: already character-driven; aligns to world tokens.
9. **Celebrations/overlays**: confetti colors, gem colors, and Phinny
   poses tinted per world.

## Asset plan

**Have today (ship immediately):** 70 book covers, hundreds of page
scenes, character art on every page, Phinny poses, gems, word images.

**Kimi request (media — `docs/KIMI_LITERACY_PALS_ART_REQUEST.md`):**
1. Three panoramic background scenes (2400×800, soft detail, characters
   small and in the distance, lots of calm sky/space for UI):
   `meadow-panorama.png`, `dino-panorama.png`, `moonwood-panorama.png`
   → `public/images/pals/`
2. Three world emblem badges (512×512, transparent): a meadow daisy
   ring, a dino footprint ring, a crescent-moon ring → same folder.
3. Character "cheer" cutouts, 2 per world (transparent, 800px): one
   pal celebrating, one pal pointing — used in celebrations and empty
   states.

## Build order

- **Round 1 (now):** theme token system + world attribute; Literacy
  Pals rename; arcade difficulty→world switching; home + login themed
  with existing cover art; quest map world bands.
- **Round 2:** in-game world backdrops, library world shelves,
  level-up world-travel ceremony, celebrations per world.
- **Round 3 (after Kimi art lands):** swap cover-art banners for the
  panoramas, add emblems and character cutouts everywhere planned.
