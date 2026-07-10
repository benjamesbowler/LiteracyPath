# Kids-Side Audit — Fix Handoff (2026-07-08)

Fixes for `KIDS_SIDE_DESIGN_AUDIT_2026-07-08.md`. All code changes below are **verified green in-sandbox**: `eslint .` = 0 errors (24 pre-existing warnings, unchanged), `npm test` = 148/148 pass, `check:story-quests` + `check:guided-reading-visibility` pass.

**Two things I could NOT verify from here, by design:**
1. **The production build** (`npm run build`) — the sandbox can't run it (rolldown linux-arm64 binding is blocked). The gated command below runs it on your machine.
2. **The rendered pixels** — the live site still runs the old code, so I can't see my changes rendered. That's why this goes to a **preview** first (matches your "preview-only for unverifiable visual changes" policy). Eyeball checklist is below.

---

## What's fixed (code-complete)

**P0.1 — Reading Library** (`GuidedReadingPage.jsx`, `comic-theme.css`, `treasureTrail.js`)
- Badge-over-title overlap: root cause was covers collapsing on cold load (huge page-001 webp, no reserved height). Cover box now has `min-height` + a placeholder background so the card never collapses and the Level badge can't land on the title.
- Removed the duplicate "UP NEXT" panel in student mode (it re-rendered the same 5 books with raw metadata like "matches cvc · matches other"). The clean "Recommended" shelf remains.
- Removed the duplicate page title (hid the "AARON READING LIBRARY" text hero + "STUDENT READER" pill in student mode; the comic logo stays).
- Reading Goal now has a real target + progress bar ("3 of 5 books", "Read 2 more to reach 5!").
- **Book-count conflict fixed at the source**: the Library now counts books with the *same* `countBooksRead` function the Treasure Den uses (exported and shared), so "Books Read" matches the Den by construction (no more 0-vs-5).
- Student reader cleaned: hid the desktop Auto-advance checkbox, removed the duplicate/jargon "approved word audio" mode line, made the adult "focused reader…" empty-state kid-friendly.
- **Level filter grid (found in preview walkthrough):** picking a level (A/B/C) rendered the books in a flex-wrap row with `width: auto` cards, so once a huge cover image loaded a card ballooned to the image's natural width (2752px) — giant stacked thumbnails. Switched that view to a constrained grid (`repeat(auto-fill, minmax(150px, 1fr))`); cards are now uniform ~180px thumbnails, 4 per row. Verified live in-browser: card width went from ballooning to a steady 179×140.

**P0.2 — Image loading** (`StudentHomePage.jsx`, `preloadAssets.js`, `LearnAreaPage.jsx`, `GuidedReadingPage.jsx`)
- Root cause: the 5 home tiles are heavy webp (150–230 KB each) set to `loading="lazy"` and **not** in the warm-preload set — so every cold home paint showed the CSS fallback (arcade = black, phonics = gradient) until they fetched.
- Home tiles + daily-mission tiles + story-quest covers now `loading="eager"` + `decoding="async"`.
- Warm-preload now also caches the 5 home tile backgrounds **and** the companion faces (the picker was 10/11 blank cards).
- Story-quest + library covers got placeholder backgrounds so blank/loading covers are a soft colored block, not a white sliver.

**P1.6 — Story Quests de-dup + reader** (`LearnAreaPage.jsx`, `StoryQuestPlayer.jsx`, CSS)
- Removed the duplicate sidebar (the same complete / in-progress / words-found stats shown twice) — this also fills the wasted empty right rail (grid now spans full width).
- "Level A" cut from 4× → 2× (dropped the section kicker and the per-card ribbon; kept the level menu button + section heading).
- Fixed the unreadable "0/5 COMPLETE" (forced the whole active level chip white so it's never dark-blue-on-red).
- Reader: choice buttons are now the **strongest** element (solid fill, white bold, shadow) instead of the palest; page progress shown once (dropped the duplicate page-dots); words-found shown once (dropped the header count, kept the chips); story text forced to firm dark ink; removed the "CVC and Short Vowels…" curriculum subtitle.

**P1.7 — Currency diet** (`StudentHomePage.jsx`, `comic-theme.css`)
- Topbar now shows **gems only** + a progress bar. Removed the flame streak, the coins/points, and the shield/level (all were placeholders derived from gems).
- The progress bar is now meaningful and **links to the Den it matches**: it shows real progress to your next treasure ("💎 3 to go") and opens the Treasure Den, which shows exactly that (fixes the old "XP bar → Den shows gems, never XP" dead-end).

**P0.4 — Jargon purge** (multiple files) — EL→"Adventure Map"; "Cycle 4 · Ff Dd"→"Your next stop"; arcade "all literacy games live here"→"Jump into a learning game"; "Student reader"/"Teacher"/"type · Level" pills hidden from kids; dev-facing paused/empty states rewritten for kids; "approved word audio"→"read aloud"; story-reader curriculum subtitle removed.

**P2.12 — Letter Garden** — the round tracker rendered the literal word "Seed Seed Seed Seed Seed"; now a seed icon (🌱) matching the garden's flower icons.

**Partial (see the task list for exactly what's done vs left):** P1.5 nav (Back buttons disambiguated; deep-link/guards not done), P1.8 sentence-case (map + story titles done; broader button caps not), P2.9 phonics (audio icon + trace text fixed; layout/legend not), P2.10 Den (copy fixed; reskin/badges not), P2.11 map (naming + zoom-buttons-removed; markers/done-states not).

**Handoff — needs your art pipeline:** P0.3 arcade art (details in the task card). In short: `art/letter-leap.webp`, `art/word-bridge.webp`, `art/sound-racer.webp`, `art/sound-beat.webp` are missing, so those cards fall back to a shared icon (Letter Leap = Word Bridge) and the watermarked `icon-sound-slide.png`. Dropping those four files auto-fixes the cards. The watermarks (`icon-sound-slide.png` + Rocket Run's in-game background) need your Kimi/watermark pass — I didn't hand-edit them because the watermark overlaps the art's soft shadow and art goes through your pipeline.

---

## Flags before you push

- **Your working folder has other uncommitted work that ISN'T mine** (SoundBeat/PS1/RhymePop/SoundSafari/StarGallery game files + a new test, and `.claude` skill tweaks). The command below stages **only my 18 files**, so that WIP is left untouched.
- **Two repo checks were already failing at HEAD, not because of me:** `check:learn-games` (flags emoji in `AdventureGame.jsx` — the garden flowers `🌼🌷🌻…` were already emoji; my seed follows the same pattern) and `check:practice-surface-regressions` (3 `GameArcadeHub` needles that are absent at HEAD, from that arcade WIP). I updated that check's one *intended* string (Story Quest "Back to Library"→"Back to Quests").
- Run `graphify update .` after this (I couldn't — graphify isn't in the sandbox).

---

## Gated preview push (copy-paste)

This makes a **preview branch**, commits only my 18 files, and pushes **only if the build passes** (nothing ships on a build failure):

```bash
cd ~/Desktop/LiteracyPath && \
git checkout -b comic-redesign-audit-fixes && \
git add src/components/LearnAreaPage.jsx src/components/RewardsPage.jsx src/components/StoryQuestPlayer.css src/components/StoryQuestPlayer.jsx src/components/StudentHomePage.jsx src/components/elQuest/ElSkillsQuest.jsx src/components/guided-reading/GuidedReadingPage.jsx src/components/learn/games/games/AdventureGame.jsx src/components/learn/phonics/PhonicsLearningFlow.jsx src/components/learn/phonics/components/AudioButton.jsx src/components/learn/phonics/components/learning/StepTracer.jsx src/components/learn/phonics/cvc/CvcLearningFlow.jsx src/styles/comic-theme.css src/styles/student-vibrant.css src/utils/dailyMission.js src/utils/preloadAssets.js src/utils/treasureTrail.js tools/checkPracticeSurfaceRegressions.js && \
git commit -m "Kids-side design audit fixes (P0/P1 + P2 polish)" && \
npm run build && \
git push -u origin comic-redesign-audit-fixes
```

Vercel will give you a preview URL for that branch. If the command **stops at `npm run build`** with errors, paste them to me — they're most likely from the in-progress arcade files already in your folder, not these fixes. Once the preview looks right, merge `comic-redesign-audit-fixes` into `comic-redesign` to go live.

---

## Eyeball checklist on the preview (log in as Aaron: cat, dog, fish)

- **Home** — top bar shows only gems + a progress bar (no flame/coins/shield); the progress bar opens the Den; the "EL Map Quests" tile now says "Adventure Map"; the Phonics tile has no fake LETTERS/WRITING/SOUNDS/WORDS chips; daily task lines aren't cut off; tiles paint art (not a black arcade void / plain phonics gradient), especially on a **second** visit.
- **Reading Library** — Level badges sit on the covers, not over the titles; covers show (not white slivers); only one book list; no "matches cvc / digraphs-and-blends" text; goal shows "X of Y books" with a bar. Picking a level (A/B/C) shows a neat 4-per-row grid of thumbnails, not giant stacked covers.
- **Story Quests** — each stat appears once; "Level A" not repeated on every card; the active level chip is readable (white on red); covers show. In a story: the two coloured **choice buttons** are the boldest thing on screen; page progress + words-found each shown once; the Back buttons read "Previous" and "Back to Quests".
- **Adventure Map** — banner says "Adventure Map"; the "Hi Aaron, pick your stop" line is sentence case, not ALL-CAPS; no zoom +/- buttons.
- **Phonics** (open a letter) — the sound button is a clear speaker-with-waves (not a green ◀); the activity Back says "Back to letters"; heading says "Trace the letter".
- **Arcade** — Letter Garden's tracker shows seed icons, not the word "Seed". (Letter Leap/Word Bridge still share art and Sound Racer still shows the watermark — that's the P0.3 art handoff.)
- **Treasure Den** — header says "Every star, book, and quest you finish earns a gem"; the theme picker says "Choose your world".
