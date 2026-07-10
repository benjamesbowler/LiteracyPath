# Seedream Image Requests — Hollow trinket shelves + tired-media replacements (2026-07-09)

Two batches. Batch A (7 images) replaces the Hollow room backgrounds with
proper "trinket shelf" interiors — the filenames already match what the code
loads, so they're drop-in: overwrite the files in `public/images/hollow/` and
the page upgrades itself. Batch B is the tired-media audit — places still
reusing the same panorama/meadow art (usually with the rabbit + hedgehog baked
in) where bespoke art would lift the whole area.

## Non-negotiables — put in EVERY prompt

> ABSOLUTELY NO characters, no animals, no creatures, no people, no faces on
> objects. No text, no letters, no numbers, no watermark, no logo. The scene
> must be EMPTY of inhabitants — it is a home waiting for the child to fill it.

(The current scene-moonwood has a fox and an owl baked in — kids will think
they own beasties they don't. That is exactly what we are eliminating.)

## Shared style block — start of every Batch A prompt

> Warm storybook interior illustration, painterly with soft volumetric light,
> rich texture and depth, realistic cartoon style (detailed, not babyish,
> not flat vector), inviting and magical, high detail, 16:9 wide composition.

## Composition spec — CRITICAL, same for all three main interiors

The child places trinkets on six spots. The code puts them at these positions
(percent of image width/height): (10,66) (25,42) (41,72) (57,40) (73,68)
(88,44) — i.e. **two staggered shelf levels: an upper ledge around 40–45%
height and a lower ledge around 65–72% height, alternating across the full
width**. So every prompt must ask for:

> Two clearly readable EMPTY display ledges running across the scene — an
> upper shelf level roughly at the top-middle of the frame and a lower shelf
> level below it — with six distinct empty niches/spots spaced evenly from
> far left to far right. Each niche is a flat, open surface large enough to
> display a single treasured object. Nothing sits on the shelves; they wait
> to be filled. Keep the niches uncluttered and softly spotlit so objects
> placed there will pop.

(If a delivered image's ledges land somewhere else, tell me — the spot
coordinates are one constant in the code and I'll align them to the art.)

## Batch A — the rooms (all 1920×1080 webp, overwrite existing filenames)

### 1. `scene-meadow.webp` — the Barn Shelf (Meadow Farm)
> [style block] + [no-characters block] + [composition spec]
> Interior of a cozy sunlit barn: honey-coloured weathered wooden plank
> walls, two rustic timber shelves built from reclaimed barn boards with
> visible grain and hand-forged iron brackets. Golden afternoon light pours
> through a hay-loft window on the left, dust motes floating in the beams.
> Details between (never ON) the niches: coiled rope on a nail, a small
> stack of hay in a corner, dried wildflower bunches hanging from a beam,
> a red-painted door frame edge at far right, a horseshoe above the shelf.
> Palette: warm honey wood, cream, soft red accents, golden light.

### 2. `scene-dino.webp` — the Cave Shelf (Dinosaur Valley)
> [style block] + [no-characters block] + [composition spec]
> Interior of a prehistoric cave dwelling: smooth sandstone walls in ochre
> and terracotta, two natural rock ledges carved into the stone forming the
> display shelves, edges worn smooth. An ammonite fossil and fern imprints
> embedded in the wall BETWEEN niches, small clusters of glowing orange
> crystals lighting the alcoves from below, a warm firelight glow from an
> unseen source at the left edge, primitive ochre swirl markings (abstract
> patterns only, no letters) high on the wall. A glimpse of jungle ferns
> and volcanic dusk sky through a cave opening at far right.
> Palette: ochre, terracotta, warm amber light, deep brown shadows.

### 3. `scene-moonwood.webp` — the Hollow Tree Shelves (Moonwood Forest)
> [style block] + [no-characters block] + [composition spec]
> Interior of a giant hollowed-out ancient tree: living wood walls with
> swirling grain, two shelf levels formed from natural knotholes, burls and
> polished root ledges growing out of the trunk itself. Bioluminescent blue
> and teal moss veins the bark and softly lights each empty knothole niche;
> tiny motes of silver light drift in the air; a round window opening in
> the trunk at upper right reveals a starry night sky and crescent moon.
> Hanging glow-lanterns on twisted twigs BETWEEN niches, never on them.
> Palette: deep walnut wood, midnight blue, glowing teal and silver.

### 4–7. Expansion rooms (full-stage now, so also 1920×1080)
Each is a new "wing" the child unlocks; same shelf logic but FOUR niches
(positions ~(18,62) (40,42) (63,66) (84,46) — upper/lower alternating).

- `band-garden.webp` — **The Garden Conservatory**: a glass-and-timber
  lean-to greenhouse attached to the hollow; two mossy potting-bench shelves
  with four empty spots, terracotta pots and hanging vines between them,
  fireflies, dusk light through glass panes.
- `band-pond.webp` — **The Pond Grotto**: a sheltered waterside nook; flat
  smooth stepping-stone pedestals and a driftwood shelf at the water's edge
  forming four empty spots, lily pads and cattails around (not on) them,
  moonlight reflecting off gentle ripples.
- `band-cave.webp` — **The Crystal Nook**: a small crystal-lined chamber;
  four empty ledges among clusters of violet and teal crystals that light
  each spot from beneath, stalactites above, a shallow glowing pool below.
- `band-treetop.webp` — **The Treetop Perch**: an open platform high in the
  canopy; four empty spots on railed branch-shelves and a flat stump table,
  rope bridge fading into leaves behind, paper lanterns strung above,
  sunset sky and distant birds-free clouds.

## Batch B — tired-media audit (other areas reusing old art)

Ranked by how often a child sees it. All 1920×1080 unless noted; same
no-characters rule applies to backgrounds (characters belong in sprites we
layer on top, so they can move/change).

1. **Quest activity backdrops** — HIGH. The same meadow-with-rabbit-and-
   hedgehog art sits behind the cycle station list, Letter Spot, the trace
   screen and Letter Garden. The baked-in pals never move and dilute the real
   companion. Three files (needs a small code wire-up from me after):
   - `activity-bg-meadow.webp`: soft-focus rolling meadow with a winding
     path, big open sky, gentle depth blur — designed as a BACKDROP: low
     detail centre-frame so cards and letters sit on top legibly.
   - `activity-bg-dino.webp`: soft-focus fern valley with distant volcano
     and hazy dusk sky, low-detail centre.
   - `activity-bg-moonwood.webp`: soft-focus moonlit forest clearing,
     fireflies at the edges, low-detail centre.
2. **World-picker thumbnails in the Hollow** — automatic win: once Batch A
   lands I'll point the 🌍 picker at the new interiors, so "your world"
   actually previews the room you'll get.
3. **Reading Library backdrop** — MEDIUM. Currently plain cream over the
   meadow. One image: `library-nook.webp` — a cozy window-seat reading nook
   at golden hour, cushions and shelves of colourful (title-less) books,
   soft-focus, low-detail centre for the book cards.
4. **Companion picker pals** — MEDIUM-LOW but high charm: the 11 pals are
   pixel-art style while the whole app is storybook. A regen batch
   (11 images, transparent background, storybook style matching the Batch A
   rooms) would unify them — say the word and I'll write the 11 prompts with
   pose/palette per pal.
5. **Keep as-is (not tired)**: the adventure map, the comic home tiles, the
   Story Quests/Library logos, arcade game art — all bespoke and recent.

## After generation checklist
1. Through the import pipeline with the watermark patch ON.
2. Batch A: overwrite the seven files in `public/images/hollow/` — no code
   change needed; the page picks them up on next deploy/refresh.
3. Check each interior's ledges roughly match the spot positions above —
   if not, send me a screenshot and I'll retune the coordinates.
4. Batch B item 1 needs me to wire the new backdrops into the quest/phonics
   pages — tell me when the files exist and I'll do it gated as usual.
