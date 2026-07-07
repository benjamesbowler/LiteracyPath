# Comic Redesign — Image Generation Prompt Pack (2026-07-07)

Run these through the usual image generator, then import via the **Kimi pipeline**
(watermark patch → duplicate check → `cp -f` with hash verify → compress → manifest → delete folder).
Slots below are the real files the app loads today.

## Rules that apply to every prompt

- **NO text, letters, numbers, or words inside the image** (the app draws all text). The one
  exception is the single display letter in the Phonics art.
- Style must match across the whole set — append the shared style block to every prompt.
- Constraints that still apply: no rainbow motifs, no faces on inanimate objects, not babyish;
  themes = fantasy / sci-fi / nature.
- Keep the main subject in the **right two-thirds** of frame — the app overlays the title on the left.

## Shared style block (append to every prompt)

> bold comic-book illustration, thick black outlines, flat saturated colors, subtle halftone dot
> shading, dynamic white starburst accents, clean composition, child-friendly (age 5–8), no text,
> no letters, no words, no watermark

---

## 1. Phonics hero — `public/images/learn-games/home/home-phonics.webp` — 1133×760

> A giant glossy golden-yellow capital letter "A" with black comic outline and 3D depth, standing on
> a bright green burst background, black action lines radiating around it, small floating sound-wave
> symbols — the letter A is the only glyph in the image

## 2. Arcade hero — NEW file `public/images/learn-games/home/home-arcade.webp` — 1133×760

> A retro arcade cabinet with glowing neon pink and cyan edges on a near-black starry background, a
> small red-and-white cartoon rocket blasting off beside it, pixel-style alien invader shapes and a
> yellow lightning bolt floating nearby, night sky sparkles

## 3. EL Map hero — `public/images/learn-games/home/home-skills-quest.webp` — 1133×760

> An adventure island treasure map seen from above: green island with a winding dashed trail, snowy
> mountain peak, small castle, palm trees, red route flags and a brass compass, surrounded by bright
> blue sea with white wave ticks

## 4. Story Quests hero — `public/images/learn-games/home/home-story-quests.webp` — 1133×760

> A large open storybook with a fairy-tale castle and a friendly green dragon popping out of the
> pages in 3D, a winding path leading into the book, clouds and stars around it

## 5. Reading Library hero — `public/images/learn-games/home/home-reading-library.webp` — 1133×760

> A wooden bookshelf packed with colorful book spines in red, blue, green and yellow, one open book
> lying in front with gently fanned pages, a tiny reading lamp glow

## 6. (Optional) EL Map backdrop — NEW `public/images/el-quest/map-island-comic.webp` — 1600×1000

Only if we later wire it as the `sbq-mapwrap` background:

> A wide adventure island map for a children's quest game: bright blue sea, one large green island
> with distinct zones — beach with palm trees, village with tiny houses, desert with a sand pyramid,
> snowy mountains, waterfall forest, stone temple — connected by a white dashed trail with red flags,
> lighthouse on a small rock, compass rose in a corner, room between zones for UI markers

## 7. Story-quest & library covers (template — one per book)

Keep each book's existing subject; regenerate in the shared style:

> [SUBJECT OF THE BOOK, e.g. "a boy and a girl walking to a red-roofed house on a sunny path"],
> bold comic-book illustration … (shared style block)

Match each cover's current dimensions before import (check with the pipeline's duplicate/size step).

---

**After import:** point the Arcade card at `home-arcade.webp` (Work Order A.1 step 4 in the Codex
prompt), hard-refresh, and eyeball each slot at 1280×800.
