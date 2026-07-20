# Student UI — Style & Layout Consistency Audit

**Date:** 2026-07-19
**Method:** walked the live student app in Chrome (Home → Phonics → Adventure Map → Reading Library → My Hollow → Story Quests → Grown-ups menu), then traced what I saw back to the stylesheets.
**Scope:** every student surface **except the Arcade**, which is deliberately its own world.

---

## The one-line diagnosis

**The sage migration changed the colours and left the shapes.** `sage-subpages.css` says so in its own header:

> *"the sub-pages keep their layouts, sizes and images and ONLY the palette moves … zero layout properties in this file, by rule."*

That rule is the bug. **What reads as "comic pop art" is not the palette — it is the FORM**: hard 3px black borders, hard offset drop shadows, rotated starburst stickers with halftone dots, and ALL-CAPS condensed display type. Recolouring a comic book does not stop it being a comic book.

In `comic-theme.css` today: **29 hard offset shadows, 7 thick hard borders, 5 rotated/skewed elements, 45 uppercase rules.** None of those are colour. All of them survived the migration untouched, which is exactly why the home page feels like a different product from everything one tap beneath it.

There is a second, larger problem underneath it, and it costs more than the styling: **the sidebar disappears on every sub-page.**

---

## What the home page establishes (the target)

| Token | Value | Role |
|---|---|---|
| `--hs-cream` | `#FBF4EA` | page ground |
| `--hs-sage` | `#5CA091` | persistent left rail |
| `--hs-forest` | `#2E4B3E` | primary ink / dark actions |
| `--hs-line` | `#E9E1D4` | **1px** hairline borders |
| `--hs-tan` / `--hs-promo` | `#C98F54` / `#D9924E` | muted accent pills |
| `--hs-sky` | `#BFE3D8` | card media wells |

Form language: **soft** — ~16–20px radii, 1px hairlines, diffuse low-opacity shadows, sentence case, generous whitespace, a fixed left rail carrying identity (avatar, name, coins) and navigation.

---

## Section by section

### 1. Phonics — worst offender
**Sees:** pure white ground (not cream), hard black 3px borders with offset shadows, saturated `#F5D045` yellow tab, near-black navy ink. **The sidebar is gone**, replaced by a floating black-bordered "Back" chip in the corner.

**Wrong:**
- White instead of cream breaks the ground continuity in one step.
- The yellow is unmapped — `--comic-yellow` should be remapping to sage and visibly is not on this surface (see "Why the remap misses" below).
- Hard offset shadows are the single loudest comic signal on the page.
- Letter tiles are the right idea but wear comic chrome; they should be soft cards.

### 2. Adventure Map
**Sees:** a busy photographic bookshelf backdrop; a **rotated green "ADVENTURE MAP" sticker** with hard black outline; tabs with hard borders + offset shadows.

**Wrong:**
- The rotated sticker is pure pop-art form — it cannot be recoloured into calm.
- **Clipped content:** the "Strawberry Field / REVIEW" marker label is cut off mid-word, and the avatar overlaps it.
- The photographic backdrop competes with the map art, which is itself the content.

### 3. Reading Library — most visually loud
**Sees:** a literal **comic-burst logo with halftone dots**, hard black outline, rotated; ALL-CAPS condensed lettering; a saturated orange "READING GOAL" panel; hard-bordered book tiles.

**Wrong:**
- The halftone starburst is a *raster/SVG asset*, so no CSS variable will ever soften it. It must be replaced.
- **Book covers are missing** — five empty white boxes where art should be.
- Large dead space below the fold; the layout doesn't fill the viewport.

### 4. Story Quests
**Sees:** a **red comic starburst** "STORY QUESTS" logo; ALL-CAPS labels ("READ · DISCOVER · ADVENTURE", "LEVEL A ADVENTURES", "CONTINUE"); hard borders and offset shadows throughout.

**Wrong:**
- **Palette incoherence is worst here** — teal, pale yellow, red-orange, purple and olive all in one viewport, with card title bars in three unrelated colours.
- Cover art missing (gradient placeholders).
- **Clipped text:** "4 quests" is cut off at the panel edge.

### 5. My Hollow
**Sees:** a dark, immersive painted interior with a floating top bar.

**Verdict: mostly leave it.** Like Sound Seekers, it is a *place*, and immersion is the point. It is explicitly exempt in `sage-subpages.css` alongside the Arcade. Two real issues though:
- Its **chrome** (Back chip, pill tabs, currency pills) is a third distinct treatment — that should match the shared component set even when the world inside doesn't.
- A **stray clipped yellow rectangle** on the right edge (~y=443) — looks like an element bleeding out of the viewport.

### 6. Home
The reference, and it's good. Two defects:
- **Three of six card images fail to appear** (Sound Seekers, Story Quests, Reading Library show empty `--hs-sky` wells). Phonics and Arcade eventually load, so this is slow/failed image loading, not missing markup.
- The floating dark circular button on the right edge is unlabelled and unexplained.

---

## Why the colour remap misses

`sage-subpages.css` scopes everything to `.student-mode-app.lp-skin-sage`, applied at `App.jsx:8038`. Anything that **renders outside that subtree keeps raw comic values** — the file's own header admits this for the fullscreen `GamePlayer`, and `QuestRoot` portals to `document.body` for the same reason.

That is why Phonics still shows unmapped `--comic-yellow`. **Any surface that portals, goes fullscreen, or mounts outside the student shell silently opts out of the entire skin.** A remap that depends on DOM position is a remap that will keep springing leaks.

---

## The fix

### Principle
**Stop skinning the comic theme. Extract a shared component layer that owns form as well as colour, and move surfaces onto it one at a time.**

### Step 1 — Promote the home tokens to a real design system (small)
Move the `--hs-*` set out of `home-sage.css` into a root-level token file loaded by the app shell — **not** scoped to a class, so portalled and fullscreen surfaces inherit it too. Add the missing *form* tokens, which are the ones that actually matter here:

```css
:root {
  --lp-radius-card: 18px;
  --lp-radius-pill: 999px;
  --lp-border: 1px solid var(--hs-line);
  --lp-shadow-card: 0 2px 10px rgba(24,38,32,.06);
  --lp-shadow-raised: 0 8px 24px rgba(24,38,32,.10);
  /* deliberately absent: hard offset shadows, 3px borders, rotation */
}
```

### Step 2 — Build four shared components (the real work)
Every sub-page reimplements these four things in comic form. Build them once in sage form and swap them in:

1. **`<PageShell>`** — cream ground, **keeps the sidebar**, page title, optional back affordance.
2. **`<SectionHeader>`** — title + subtitle in sentence case. **Replaces every starburst logo.**
3. **`<Card>`** — 18px radius, 1px hairline, soft shadow, media well, pill row.
4. **`<Pill>` / `<Tab>`** — soft filled or hairline-outlined, sentence case, no offset shadow.

### Step 3 — Kill the four comic tells, globally
- Replace `box-shadow: Npx Npx 0` offsets → `--lp-shadow-card`
- Replace `border: 3-6px solid` → `--lp-border`
- Delete `rotate()` / `skew()` on chrome (keep it for playful *content* only)
- Replace `text-transform: uppercase` on headings/labels with sentence case

Those four search-and-replaces alone remove most of what you're reacting to.

### Step 4 — Replace the three starburst logos
Reading Library, Story Quests and Adventure Map each use a raster/vector comic sticker. **No CSS change will fix these.** Replace with `<SectionHeader>` text, or commission three soft badge marks in the sage palette.

### Step 5 — Fix the content bugs found on the way
- Missing book covers (Reading Library) and quest covers (Story Quests)
- Missing home card images (3 of 6)
- Clipped text: "Strawberry Field / REVIEW", "4 quests"
- Stray clipped yellow element in My Hollow
- Label the unexplained floating circular button

### Step 6 — Retire the switch
Once the sub-pages are genuinely on the new system, **"Back to classic look" becomes a trap** — it would drop a child back into an inconsistent half-migrated app. Remove it, delete `comic-theme.css` and `student-vibrant.css`, and keep the Arcade/Hollow looks as their own scoped files.

---

## The thing worth fixing before any of the styling

**The sidebar disappears on every sub-page.** Phonics, Adventure Map, Reading Library and Story Quests all replace it with a small floating "Back" chip in the top-left corner.

For a 4–7 year old that is worse than a style inconsistency:
- They lose the only persistent map of where they are and what else exists.
- Their identity anchor — avatar, name, coin count — vanishes.
- Moving between two sections costs **two taps and a context switch** instead of one tap.
- The "Back" chip is ~44px, in the hardest corner to reach on a tablet held two-handed.

**Keeping the sage rail on every non-immersive sub-page is the single highest-impact change on this list**, and it makes the visual consistency largely self-solving — the rail forces the cream ground, the type scale and the spacing to agree.

Immersive *worlds* (Sound Seekers, My Hollow, Arcade, and a book while it's open) should keep going fullscreen. Everything that is a *menu* — Phonics, Adventure Map, Reading Library, Story Quests — should keep the rail.

---

## Suggested order

| # | Work | Impact | Effort |
|---|---|---|---|
| 1 | Keep the sidebar on the four menu sub-pages | Highest | M |
| 2 | Global purge of the four comic tells (shadow/border/rotate/caps) | High | S |
| 3 | Promote `--hs-*` + form tokens to unscoped `:root` | High | S |
| 4 | Replace the three starburst logos with `<SectionHeader>` | High | S–M |
| 5 | Build `<PageShell>` / `<Card>` / `<Pill>` and migrate the four pages | High | L |
| 6 | Fix missing images and clipped text | Medium | S |
| 7 | Normalise Hollow chrome to the shared components | Medium | S |
| 8 | Remove the classic-look switch, delete the dead themes | Medium | S |

---

## What NOT to touch

- **The Arcade** — its own world by design and by owner decision.
- **Inside My Hollow and Sound Seekers** — immersive places; only their *chrome* should conform.
- **`--comic-star` / `--comic-gem`** — coins, stars and gems keep their identity across both skins, and that's correct.
