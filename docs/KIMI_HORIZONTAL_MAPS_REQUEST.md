# Kimi Art Request — Horizontal (landscape) adventure maps

We want the Skills Quest maps to read **left-to-right** like a journey, with the
child starting at the way in and finishing at the destination. On a laptop or
projector a wide map makes far more sense than the current tall one. We will show
the **horizontal** map on laptop/desktop/projector, and keep a **vertical** map on
phones and iPads.

This request is for the three **horizontal (landscape)** maps. Keep the existing
vertical maps as they are.

## Format
- **Aspect ratio: 16:9 landscape** (e.g. 1920 × 1080). One image per world.
- Same painted-cartoon style and palette as the current maps — realistic cartoon,
  rich and warm, not babyish, no rainbows, **no faces on any objects**.
- A single clear **winding dirt path** that travels **left → right** across the
  scene, passing each landmark in order, with gentle curves (not straight).
- Leave the painted path wide and unobstructed so a character can walk along it.

## The three worlds (landmarks in journey order, left → right)

**1. Meadow Farm** — start at the **farm gate / entrance on the LEFT**, finish at
the **farmhouse / big barn on the RIGHT**. Along the path, left to right:
farm gate → carrot patch → duck pond → flower meadow → orchard → haystacks →
sheep pen → strawberry field → **the big barn (farmhouse) at the end**.

**2. Dinosaur Valley** — start at a **valley entrance / mud pits on the LEFT**,
finish at the **volcano on the RIGHT**. Along the path: mud pits → green valley →
giant ferns → fossil creek → eggshell rocks → stomping grounds → lava lookout →
**the volcano at the end**. (No cartoon face on the volcano.)

**3. Moonwood Forest** — start at the **forest edge on the LEFT**, finish at the
**moon tower on the RIGHT**. Along the path: glow-mushroom grove → firefly hollow →
whispering trees → moonlit pond → starfall clearing → crystal cave → owl's lookout
→ **the moon tower at the end**.

## Filenames (drop into `public/images/pals/maps/`)
- `meadow-map-wide.webp`
- `dino-map-wide.webp`
- `moonwood-map-wide.webp`

(Keep the current `meadow-map.webp`, `dino-map.webp`, `moonwood-map.webp` for the
vertical/mobile view.)

---

**What happens after you generate these:** send me the three wide images (or drop
them in a "new kimi maps" folder in the project like before). I'll then:
1. Import and compress them.
2. Add the horizontal layout with stop coordinates pinned to the new art.
3. Make the app automatically show the **wide map on laptop/projector** and the
   **tall map on phone/iPad**, with the avatar walking the path from the entrance
   to the final landmark.
