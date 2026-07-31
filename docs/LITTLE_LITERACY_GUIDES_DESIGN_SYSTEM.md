# Little Literacy Guides - Child Area Design System

> Approved child-area identity from 2026-07-22. Existing `pal-*` technical
> identifiers and the Meadow Pals / Dino Pals book-series names remain stable;
> they are implementation and story-series names, not the umbrella brand.

*The complete design plan for every child-facing screen. Goal: the
production quality of Teach Your Monster / Raz-Kids, built on our own
book worlds instead of generic UI.*

## The big idea

The child area is **Little Literacy Guides by literacy.guide**. Children don't move through "easy,
medium, hard". They move through three worlds they already know from
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
current production scenes when they exist.

## Screen-by-screen plan

1. **Entry ("Student" card)**: branded **Little Literacy Guides**, with the
   three world characters peeking from the card art.
2. **Child login** (school → class → name → pictures): Meadow world
   theme (gentlest), characters watching from the corners, frosted card.
3. **Home**: header becomes the Little Literacy Guides lodge, with the child's
   saved Little Literacy Guide avatar plus only stars and coins. Mission tiles
   carry the world art of the content they point to. Explore cards = world
   doorways.
4. **Skills Quest map**: cycles 1–9 ride through the Meadow, 10–18
   through Dino valley, 19–27 into Moonwood. This is a forward path: only
   the first unfinished stop opens; completed and future stops cannot be
   selected. Stations and round cards inherit the active world.
5. **Game arcade**: difficulty switch = world switch. Easy shows the
   Meadow header art and accents; Medium goes Dino; Hard goes Moonwood.
   Game cards keep their art but frames/buttons take world accents.
6. **In-game**: stage backdrop = soft world mesh + world corner art;
   balloons/tiles/meters take world accents automatically via tokens.
7. **Reading Library**: starts with Fiction / Non-fiction, then reader series,
   then an eight-book page. Read books carry a tick. World theming remains a
   supporting cue rather than replacing the category/series hierarchy.
8. **Story Quests**: already character-driven; aligns to world tokens.
9. **Celebrations/overlays**: confetti colors, gem colors, and Phinny
   poses tinted per world.
10. **My Hollow**: owns Little Literacy Guide changes and the permanent
    Beastie nook. The first Guide choice is free; later changes cost 10 earned
    stars. Guide choices are book characters only. Every hatched beastie is
    reachable from the nook or the Beasties tab.

## Persistent Little Literacy Guide policy

- A child chooses a Guide once, after their first profile hydration. There is
  no skip action and no repeat chooser at later sign-ins.
- The choices are Fluff (Bob and Nan), Chips (James and Anna), Socks (Aiden and
  Betty), Chompy (Dino Pals), Muddy (Meadow Pals), and Pip (Moonwood Tales).
- Home and the child header always read the saved Guide from the student
  profile. They never substitute a random mascot.
- Changes are made only in **My Hollow → My Guide**. A later change costs 10
  available earned stars and the spend is stored in the synced profile.

## One-screen child layout policy

The signed-in child area uses a fixed 834-design-pixel height and a fluid stage
width up to a defensive 3200-design-pixel ceiling. At ordinary landscape
viewports it fills the screen edge to edge and child hubs do not scroll. Dense
content uses bounded grids and explicit paging. The public marketing landing
page remains the deliberate scrolling exception.

## Asset plan

**Have today (ship immediately):** 70 book covers, hundreds of page
scenes, character art on every page, Phinny poses, gems, word images.

**Optional future production assets:**
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

- **Round 1 (now):** theme token system + world attribute; Little Literacy Guides
  branding; arcade difficulty→world switching; home + login themed
  with existing cover art; quest map world bands.
- **Round 2:** in-game world backdrops, library world shelves,
  level-up world-travel ceremony, celebrations per world.
- **Round 3 (only when current production art is added):** swap cover-art banners
  for the panoramas, then add emblems and character cutouts where the live design
  calls for them.
