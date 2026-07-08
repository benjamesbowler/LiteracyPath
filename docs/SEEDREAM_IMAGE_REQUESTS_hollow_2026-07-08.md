# Seedream Image Requests — My Hollow (Rewards V2), 2026-07-08

67 images. Every filename below is already referenced by the live code
(`/images/hollow/<filename>.webp`), and every card shows an emoji stand-in until
its file exists — so images can land in any order, no code changes needed.
Run everything through the usual import pipeline (watermark patch, duplicate +
duration checks, compression, manifest).

## Shared style block — paste at the START of every prompt

> Bold pop-art comic book illustration, thick black outlines, halftone dot
> shading, vibrant saturated colors, dynamic lighting, realistic cartoon
> style (not babyish, not cutesy), fantasy storybook subject, single object
> centered, isolated on a plain solid white background, no text, no letters,
> no watermark, no human faces, no faces on objects.

Output: 1024×1024 PNG → pipeline converts to webp with white knocked out.

## 1. Pal gear (14) — worn by the companion animals

| File | Subject (append to style block) |
|---|---|
| gear-meadow-crown | golden crown woven from wheat stalks and tiny wildflowers |
| gear-explorer-pack | small brown leather adventurer backpack with brass buckles and a rolled map |
| gear-acorn-shield | round wooden shield with an acorn emblem carved in the center |
| gear-willow-wand | slender willow-branch magic wand with a soft teal glow at the tip |
| gear-trail-boots | pair of sturdy little leather hiking boots with green laces |
| gear-wizard-hat | midnight-blue pointed wizard hat with silver star embroidery |
| gear-starweave-scarf | flowing deep-purple scarf woven with glowing constellation threads |
| gear-moth-wings | majestic pale-green luna moth wings with moonlit patterns |
| gear-dino-helm | tribal helmet carved from bone shaped like a triceratops skull crest |
| gear-bone-charm | necklace of a small fossil bone on a leather cord |
| gear-raptor-wings | fierce feathered raptor wings, amber and rust colored |
| gear-petal-hood | hooded cape made of layered pink and coral flower petals |
| gear-leaf-cloak | cloak of overlapping green forest leaves with dew drops |
| gear-falcon-wings | powerful falcon wings, slate grey with white flight feathers |

## 2. Hollow decorations (14)

| File | Subject |
|---|---|
| hollow-glow-jar | glass jar full of glowing golden fireflies |
| hollow-mushroom-stool | plump red-capped toadstool used as a stool |
| hollow-moon-lantern | paper lantern shaped like a crescent moon, warm glow |
| hollow-moss-rug | round rug of thick soft green moss with tiny white flowers |
| hollow-star-banner | hanging fabric banner with embroidered gold stars |
| hollow-root-table | low table grown from twisted tree roots |
| hollow-owl-perch | wooden branch perch with moss, built for an owl |
| hollow-story-shelf | crooked bookshelf carved into a tree trunk, full of tiny books |
| hollow-ember-pit | cozy stone fire pit with glowing orange embers |
| hollow-crystal-cluster | cluster of glowing violet crystals growing from rock |
| hollow-dino-skull | ancient weathered dinosaur skull, museum-fossil style |
| hollow-fern-fountain | small stone fountain overgrown with ferns, water trickling |
| hollow-moonwell | small stone well glowing with silver moonlight inside |
| hollow-waterfall | miniature enchanted waterfall over mossy rocks with mist |

## 3. Expansions (4) + eggs (3)

| File | Subject |
|---|---|
| exp-garden | lush magical garden gate opening onto glowing moss beds |
| exp-pond | small forest pond with lily pads and glowing dragonflies |
| exp-cave | crystal cave entrance glowing violet and teal |
| exp-treetop | treetop platform with rope bridge among giant branches |
| egg-bronze | speckled bronze-brown fantasy egg in a small grass nest |
| egg-silver | shimmering silver fantasy egg with faint runes, in a nest |
| egg-gold | radiant gold fantasy egg with glowing star markings, in a nest |

## 4. Beasties (30) — each species at 3 growth stages

Three files per species: `<id>-s1` (baby: big eyes, small, round), `<id>-s2`
(young: half grown, more detail), `<id>-s3` (grand: full grown, impressive,
small glow effects). Keep the SAME character design across the three stages —
same colors and markings, growing older.

| Species (files -s1/-s2/-s3) | Subject |
|---|---|
| beastie-moss-sprite | small forest spirit creature made of moss and leaves (creature body, friendly eyes) |
| beastie-ember-fox | fox with ember-orange fur and a faintly glowing warm tail |
| beastie-pebble-toad | round toad with a back of smooth grey river pebbles |
| beastie-sun-moth | moth with golden sun-patterned wings |
| beastie-fern-snail | snail with a spiral shell overgrown with tiny ferns |
| beastie-star-owl | owl with midnight-blue feathers speckled like a starfield |
| beastie-thorn-stag | young stag with antlers of blackthorn branches and berries |
| beastie-glow-lynx | lynx with pale fur and teal bioluminescent markings |
| beastie-river-dragon | serpentine water dragon, blue-green scales, river spray |
| beastie-moon-wyrm | slender silver dragon with crescent-moon markings, night glow |

## 5. Optional polish (2)

| File | Subject |
|---|---|
| market-merchant | friendly badger merchant character in a travelling cloak beside a wooden caravan cart (character may have a face — it's a creature, not an object) |
| hollow-interior | wide cozy interior of a giant hollow tree home at night, warm lantern light, empty shelves and floor space (16:9, 1920×1080 — scene backdrop, optional: worlds panoramas are used today) |

## Checklist after generation

1. Import via the Kimi pipeline — watermark patch ON (the arcade slipped two watermarked images onto live; don't repeat that).
2. Check the three stages of each beastie are visibly the same character.
3. Drop files into `public/images/hollow/` — cards upgrade from emoji automatically.
