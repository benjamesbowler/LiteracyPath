# LOOP PROMPT — Student/Teacher restructure + full audio recording document

You are working in the **LiteracyPath** repo on branch **`pristine-v2-3d`** (create it from current if missing; never touch `main`). This is a live children's literacy app. Work in a **self-verifying loop**: inspect → make the smallest correct change → run the full gate → verify against the acceptance checklist by **observation, not assumption** → fix → re-run. **Repeat until 100% of the checklist passes. Expect many passes. Do not claim done until every box is verified.**

---

## 0. NON-NEGOTIABLE GROUND RULES (do not break any of these)

1. **Content is frozen.** Do NOT change any curriculum text, words, sounds, sentences, cycle data, quest content, or book content. This task only changes **layout, navigation/structure, and theming** — plus produces one new audio document. If a task seems to require changing content, stop and leave a note instead.
2. **Never generate or fake audio.** All audio is human-recorded. Do not add TTS/synthetic audio. The audio **blocklist is load-bearing** — blocklisted words must resolve to NO audio; never “fix” that by adding a clip, and exclude blocklisted items from the recording document.
3. **Never overwrite or delete approved media** in `public/`. The new audio doc is a text deliverable only; it does not touch media files.
4. **Progress/points stay derived**, never stored — do not change how rewards/points are computed (they derive from progress).
5. **Art direction:** modern, clean, kid-friendly but **NOT babyish** (reference bar: Khan Academy Kids / Prodigy / Duolingo Kids polish — confident, not cutesy). Themes are **meadow / dino / moonwood**. No rainbow motifs, no faces on inanimate objects, no clip-art. Use modern rounded sans fonts already in the project; do not introduce childish fonts.
6. **Keep the gate green the entire time.** After every change run the full gate below and keep tests/lint/checks passing. Add tests where this prompt says to.

**The full gate (run from repo root, must pass before any commit):**
```
rm -rf dist && npm run build && npm run test:unit && npm run lint \
  && npm run check:approved-runtime-sources && npm run check:distractor-onset-giveaway \
  && npm run audit:app-image-inventory && npm run check:media-overwrite-risk \
  && npm run check:repo-hygiene
```

---

## 1. DISCOVERY FIRST (do this before editing anything)

Map the current app and write findings to `docs/RESTRUCTURE_DISCOVERY_2026-07-06.md` before making changes:
- The **student home/landing** component and how it renders the current sections/tiles, and the router/state that switches between areas.
- Where each section lives: **Daily Challenge, Phonics Learning, EL Map Quests, Arcade (`GameArcadeHub`), Story Quests, Reading Library, Points/Progress.**
- The **teacher area** entry points and its navigation (find where EL Map Quests and Phonics Learning are exposed to teachers, and where the “present” slides live).
- The **authoritative data sources for spoken audio**: phonics graphemes/letter-sounds, decodable/CVC word banks per cycle, sight/high-frequency words, quest sentences & poems, guided-reading words/sentences, game vocabulary — anything the app plays as audio. Note the audio-resolution path (e.g. grapheme→audio, word→audio) and the blocklist location.
- The existing arcade dark theme (`src/styles/arcade-dark.css`) as the reference “jet-black arcade” look.

Do not proceed to a phase until you can name the exact files it will touch.

---

## 2. DELIVERABLE A — Student home: even 4-across tile layout

Rebuild the **student home** as a clean, evenly-spaced tile grid of these **7 sections**:

1. **Daily Challenge** — surfaces today’s **3 tasks**.
2. **Phonics Learning** — letters/writing, sound learning, word building. **Remove all games from this section** (games now live only in Arcade; the phonics area keeps teaching activities: letter writing, sound learning, word building — no arcade/worksheet games).
3. **EL Map Quests** — map-based EL, unchanged in behaviour.
4. **Arcade** — the single home for **all games**.
5. **Story Quests** — unchanged in behaviour.
6. **Reading Library** — unchanged in behaviour.
7. **Points / Progress** — the rewards/progress area.

Layout requirements:
- A **tile grid, 4 tiles across on desktop**, tidy and **evenly sized/spaced** (equal gutters, aligned rows). Responsive: 4 columns desktop → 2 columns tablet → 1 column mobile. With 7 sections, balance the grid so it reads as intentional (e.g. a 4 + 3 arrangement with the last row centered, or make **Points/Progress a full-width banner tile** above/below a clean 3×2 of the six activity tiles — choose whichever looks the most balanced, then verify it visually).
- **Clean background** (see theming in Deliverable B), generous whitespace, modern rounded-sans typography, clear tile titles + a short subtitle + an icon/thumbnail per tile, obvious tap target, subtle hover/press.
- Each tile shows a small progress hint where it makes sense (e.g. Daily Challenge “1/3”, Phonics “Cycle 4”), pulled from existing progress — do not invent new data.
- Tapping a tile opens that section exactly as it works today (do not re-route or rename existing screens).

Acceptance: the home is visually even and balanced at desktop/tablet/mobile widths; all 7 tiles present; Phonics tile contains no games; Arcade is the only games entry; every tile navigates correctly.

---

## 3. DELIVERABLE B — Theming (backgrounds + style per area)

- **Arcade = jet-black “arcade” look** — reuse/extend the existing `arcade-dark.css` direction (deep near-black background, neon/gold accents, glowing tactile game cards). This area is the dark exception.
- **Every OTHER student area = white/bright** — clean **white background, colourful and bright, blocky** cards/tiles, using the meadow/dino/moonwood theme colours as accents. Bright and confident, **not babyish**, no rainbow gradients, no clip-art.
- The **student home** uses the white/bright/blocky language (not the dark arcade look).
- Keep it cohesive: one shared set of tokens for the bright areas (spacing, radius, shadow, type scale) so all bright areas match. Scope changes so they’re reversible and don’t leak into the dark arcade.

Acceptance: arcade renders jet-black; home + all other areas render white/bright/blocky/on-theme; nothing looks babyish; styling is consistent across the bright areas.

---

## 4. DELIVERABLE C — Teacher area (kept separate, trimmed)

- Teachers are a **separate area** — do not merge with the student home.
- **Remove from the teacher area: EL Map Quests and Phonics Learning** (nav entries, routes, and any teacher-only screens for them). Everything teachers need for those is delivered through the **“present” slides**, so confirm the present-slides flow still covers letters/sound/word-building teaching and is reachable.
- Do **not** break any remaining teacher features (class management, guided reading records, reports, assessments, present slides). Remove only the two named sections and any now-dead links to them.

Acceptance: teacher area no longer exposes EL Map Quests or Phonics Learning; present-slides flow works and covers the teaching content; no broken routes, dead buttons, or console errors anywhere in the teacher area.

---

## 5. DELIVERABLE D — Audio recording document(s) for the voice artist

Produce Word document(s) listing **every word, sound, and sentence the app needs recorded**, so a non-technical person can record them cleanly.

Method (must be reproducible, not hand-typed):
1. Write a **deterministic extraction script** (committed under `tools/`) that reads the app’s data and outputs three deduplicated, ordered lists: **SOUNDS** (individual phonemes/graphemes/letter-sounds), **WORDS** (decodable + sight/high-frequency + game vocabulary), **SENTENCES** (quest/poem/guided-reading sentences). Source these from the real curriculum/data files found in Discovery — this must reflect what the app actually speaks.
2. **Deduplicate** case-insensitively; **exclude every blocklisted item** (those must never be recorded). Print counts for each list and a total.
3. Generate the deliverable as **.docx** into `docs/audio-recording/`:
   - **Keep SOUNDS and SENTENCES in separate files — never mix categories in one file** (this was explicitly requested to avoid confusion). Put WORDS in their own file(s) too.
   - Split the total into about **10 MP3-sized parts**, balanced by item count/length, each part = one intended MP3. A part must contain only one category. Name/label each part clearly, e.g. `SOUNDS — File 1 of N`, `WORDS — File 1 of N`, `SENTENCES — File 1 of N`, and give the exact filename to save as (e.g. `sounds-01.mp3`).
   - Every item is **numbered**, one per line, in the order to be read.
   - **Front page = recording instructions**: quiet room, say each item once, clearly, in the app’s single warm narrator voice; **leave ~2 seconds of silence between each item**; save each file with the matching name; do the files in order.
   - Add a **summary table**: file name → category → number of items.
4. Also emit a plain-text/CSV manifest alongside the .docx (same content) so the split is auditable.

Acceptance: the .docx set exists in `docs/audio-recording/`; sounds and sentences are in separate files; ~10 balanced parts; every item numbered; no duplicates; no blocklisted items; counts in the summary match the lists; the extraction script re-runs and reproduces the same files byte-for-byte.

---

## 6. THE VERIFICATION LOOP (this is the point — run it relentlessly)

For **every** change, and again at the end for the whole task:
1. Run the **full gate** (section 0). If anything fails, fix and re-run from the top.
2. **Add/extend automated tests** for anything testable: home shows exactly the 7 sections; Phonics section exposes no games; Arcade contains all game ids and nothing else; teacher area excludes EL Map Quests + Phonics Learning; audio-doc extractor is deterministic and excludes blocklisted items. These tests must pass in `npm run test:unit`.
3. **Visual verification (required, do not skip):** build and serve the app, then capture screenshots of **student home, phonics, arcade, story quests, reading library, points/progress, and the teacher area** at **desktop (~1440px), tablet (~1024px), and mobile (~390px)** widths (use the project’s preferred headless/browser tooling; if none, add a minimal Playwright screenshot script under `tools/`). **Open and inspect each screenshot** and check it against the acceptance criteria (even tiles, correct backgrounds, arcade jet-black, others white/bright/blocky, not babyish, nothing overflowing/misaligned, no broken images). If a surface can’t be screenshotted, render the component in isolation and verify that.
4. Re-read every **Acceptance** line in sections 2–5 and confirm each by observation. Any miss → fix → restart the loop from step 1.
5. Only when **all** of the checklist below is ticked and verified do you finish.

### Final acceptance checklist (verify each; cite the evidence — screenshot/test/log)
- [ ] Student home shows exactly the 7 sections as even, balanced tiles (desktop 4-across, responsive down to 1 column).
- [ ] Phonics Learning contains letters/writing, sound learning, word building — and **no games**.
- [ ] Arcade is the only games entry and holds all games; renders **jet-black arcade** style.
- [ ] All other student areas + home render **white / bright / blocky / on-theme / not babyish**, consistently.
- [ ] EL Map Quests, Story Quests, Reading Library, Daily Challenge (3 tasks), Points/Progress all present and navigate correctly.
- [ ] Teacher area is separate; **EL Map Quests and Phonics Learning removed**; present-slides cover the teaching content; no broken teacher routes/buttons/console errors.
- [ ] Audio .docx set in `docs/audio-recording/`: sounds/sentences in separate files, ~10 balanced parts, numbered items, instructions + 2-sec-gap note + save-as filenames, summary table, no duplicates, no blocklisted items; extractor is deterministic.
- [ ] Full gate passes; new tests pass; no new lint errors; no content changed.
- [ ] Screenshots at 3 widths captured and inspected for every surface listed above.

---

## 7. DEFINITION OF DONE + HANDOFF

When the checklist is fully green:
1. Commit only the intended files (home/layout, theming CSS, teacher trims, new tests, the audio extractor + generated `docs/audio-recording/` docs, discovery/notes). Do not commit build artifacts, `graphify-out/` churn, or audit-file noise.
2. Push to `pristine-v2-3d`.
3. Reply with: a short summary of what changed per deliverable, the screenshot filenames, the test names added, the audio-doc counts (sounds/words/sentences totals + file list), and the exact **gated push command** used — as a single copy-paste block for the user to re-run if needed.

Remember: **do not report success until you have observed every acceptance item pass.** If in doubt, loop again.
