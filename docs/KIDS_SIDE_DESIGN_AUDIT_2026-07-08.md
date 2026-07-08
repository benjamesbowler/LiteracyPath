# Kids Side — Design & Layout Audit (2026-07-08)

Live walkthrough of literacy.guide on the Aaron test account, desktop 1920×1080, branch `comic-redesign` in production. Every finding below was observed on screen (screenshots taken per area); items marked *inferred* are my read of the mechanism, not directly proven.

**Bottom line:** the comic home shell is strong, but the app currently reads as two different products stitched together, repeats the same stats and labels 2–4× per screen, leaks curriculum/debug jargon onto kid-facing surfaces, and has one page (Reading Library) with visibly broken components. The single biggest UX drag is artwork loading: on every fresh visit the home page paints as empty gradients and a black void, story covers appear as blank colour blocks, and 10 of 11 companions render as empty white cards for several seconds.

---

## A. Systemic issues (seen on most screens)

1. **Slow, uncached artwork everywhere — Critical.** Home tiles (Arcade = solid black void, Phonics = plain gradient, daily-task thumbnails = blank squares) on *every* navigation back to home; Story Quest covers blank, load late, and are blank again on return; companion picker images take ~3–5 s. *Inferred:* hero images are heavy and re-fetched per mount with no cache/preload/placeholder strategy. This makes the most-visited screens look broken.
2. **Two visual languages.** Comic style (home, Story Quests, Arcade) vs the old cream/rounded style (Treasure Den, Phonics, cycle stations, both readers, Letter Garden). Even the Back button has three designs (black comic chip, white pill, green pill). Feels like two apps.
3. **Exit/navigation chaos.**
   - Phonics activities show **two stacked Back buttons** (comic Back top-left + green Back under it).
   - The story reader shows two "Back"s with *different meanings* (app-exit vs previous-page).
   - Exit is variously labelled Back / Stop / X / Back to Library / Map — and "Back to Library" from a Story Quest returns to Story Quests, not the Reading Library (mislabel).
   - Back from mid-station silently discards the activity and jumps all the way home, while arcade games properly ask "Leave this game?". Inconsistent protection.
4. **Meter overload.** Flame (1), gems (37), coins (569), shield "4", XP bar (8%), arcade points (120), per-game stars, "words found". That is ~8 numeric systems for a 4–7-year-old. Coins never appear spendable anywhere in the tour; the shield and flame are unlabelled; arcade points exist only in the arcade.
5. **Header XP bar is a dead end.** "View progress" (Level 4, 8%) opens the Treasure Den — which shows gems only and never mentions level or XP.
6. **ALL-CAPS everywhere.** Comic caps are fine for section logos, but story titles, instructions ("HI AARON. PICK YOUR STOP…"), and buttons are all caps too. All-caps text removes word shape — hardest format for the emerging readers the app teaches, and the app itself teaches "big F / small f" while its own UI is caps-only.
7. **Curriculum/debug jargon on kid surfaces.** "EL", "Cycle 4", "Ff Dd", "CVC and Short Vowels - short a CVC + HFW 1-25", "digraphs-and-blends", "matches cvc · matches other", "STUDENT READER", "approved word audio", "Decodable story". None of this is for children; some of it is for developers.
8. **Accessibility.** Most home tiles are unnamed buttons (no accessible labels — confirmed via accessibility tree); icon-only buttons (flame, shield, sound, fullscreen, green ◀) have no labels/tooltips; several low-contrast text cases listed below.

---

## B. Per-area findings

### Home
- **Phonics tile chips lie.** LETTERS / WRITING / SOUNDS / WORDS look like buttons, aren't clickable, and the page behind has only two tabs (Letters, Words). Promise ≠ destination.
- **"Start next task" doesn't start the task.** For a quest task it drops the kid on the map page, still 2 taps and a decision away (find marker → pick 1 of 9 stations). Clicking a *game* task card deep-links straight into gameplay. Same strip, opposite behaviours.
- **Truncation in the daily strip:** "Muddy and Splashy…", "Letter Garden · Spell…", "Practise your Ff and Dd…" — 3 of 6 lines cut in the app's primary call-to-action.
- **Stale reward toast.** "You earned the Spark Gem! +7 more waiting" overlaps the Story Quests tile; the Den shows the Spark Gem was earned ages ago (5 trail items owned) and only 5 remain — wrong item celebrated, wrong count. *Mechanism inferred; counts observed.*
- Header companion icon didn't match the selected companion (showed fox on first load, then a green pal; selected = Dino Pal).

### Treasure Den
- Only reachable reward hub, yet **not comic-themed** — style break from its only entry point.
- **Badge Wall is filler.** 10 near-identical gem badges including exact duplicates (Sky ×3, Dawn ×3, Storm ×2, Tide ×2) with no context (what/when); three smiley "1/2/3" medals with unexplained star rows. As a trophy case it communicates nothing.
- **"Decorate your den" overpromises.** It's a 3-option banner-theme picker; there is no den to decorate and nothing else changes.
- Copy conflict: header says "Every star you earn anywhere becomes a gem here", but the earn cards include "Read a book = 1 gem" (not a star) and story quests = 2 gems.
- **Data conflict with Reading Library:** Den says "Read a book — 5 so far"; Library goal card says "0 BOOKS READ".

### Phonics Learning
- Bottom ~45% of every screen is empty; content floats at the top. (Letter grid, Word Workshop, trace, word-build all the same.)
- Letter grid has three marker states (green ✓, teal dot, orange dot) with **no legend**.
- "7/26 letters learned ⭐⭐⭐" pill repeats the tab's own "7/26 complete", and the three stars mean nothing stated.
- Trace screen: the audio button is a **green ◀ icon that reads as "back"**; "Use your finger to trace" on a mouse device; the two stacked Back buttons live here.
- **Four labels for one action** across the app: "Audio", "Listen", "Replay Audio", "Hear word".
- Every screen fades in over ~2 s (ghost UI) — combined with slow assets it feels broken. Word Workshop: locked nests are low-contrast grey; the -ug nest shows three empty white circles (missing emojis); "Workshop"/"nest" is a mixed metaphor with no nest imagery.

### EL Map Quests
- **Three names for one feature:** EL MAP QUESTS (home) → SKILLS QUEST (banner) → "Your sound and word path" (title). "EL" means nothing to a child.
- Map markers inconsistent: done = unnumbered gold star coins, future = white numbered circles starting at 5; the current stop's label ("Apple Orchard FF DD") is overlapped by the pal sprite standing on it.
- Zoom +/− controls are of dubious value on a fixed illustration; the − sits disabled and near-invisible.
- **Cycle station page has no progress state.** Nine identical-looking stations; nothing marks done/next, so a kid can't see where to resume. 4-4-1 grid leaves an orphan; station icons are tiny grey blobs; header card is ~90% empty; **Map button and Back button both exit** with no stated difference.
- The map art itself is excellent — best visual in the app.

### Story Quests
- **Stats duplicated twice each on one screen:** "6/123 words found" (header pill + sidebar card) and "0 complete / 2 in progress" (header pills + sidebar card).
- **"LEVEL A" printed up to 4×:** top pill, section pill, section heading, plus a ribbon on *every* card inside the section.
- "LEVEL A 0/5 COMPLETE" — dark blue text on bright red: unreadable.
- **Covers missing.** Level B and C cards are solid colour blocks; Level A loads late (one never loaded); on returning to the page all covers are blank again. Pre-readers choose books by picture.
- Layout waste: each section row ends with ~40% empty pastel; the right rail is empty below two small cards.
- **Reader:** choice buttons ("Go to the van" / "See the cat") are the palest, most disabled-looking elements on screen yet are the core mechanic; page progress shown twice (bar + 10 dots); "2/9 words found" shown twice (top-right + chips panel); "CVC and Short Vowels - short a CVC + HFW 1-25" subtitle; story text renders light grey pre-audio (weak contrast); illustration leaves wide empty flanks.

### Arcade
- **Letter Leap and Word Bridge have pixel-identical thumbnails.** Two different games, same art.
- **"AI生成" watermark visible on the Sound Racer thumbnail** (live), and faint AI-watermark lettering is baked into the Rocket Run space background (visible in-game, upper sky). The import watermark patch missed these.
- Sound Racer art (toddler playground slide) mismatches the name "racer" and skews babyish vs the art direction; thumbnail styles clash (3D renders vs flat vector) on one shelf.
- Cards are mostly empty dark space — small square thumb in a tall frame with a bare title row.
- **"ALL LITERACY GAMES LIVE HERE" is false.** Letter Garden (the daily game task) is not in the Arcade; a kid who enjoyed it has no way to find it again.
- Global Easy/Medium/Hard pills: unclear they apply to all games; unlabelled icon button beside them; "120" next to Rocket Run's stars is tiny and unexplained; header currencies (gems/coins) disappear inside the Arcade, so game rewards have no visible destination.
- In-game: instruction shown twice at once (pill + centre overlay); round title low-contrast over the busy background.
- Positives: consistent "Leave this game?" guards, countdown, compact hearts/stars HUD.
- Letter Garden: the round tracker literally renders the word **"Seed Seed Seed Seed Seed"** — looks like a text bug, duplicates the header's "1/5", and expects a pre-reader to read it. Icons, not words.

### Reading Library — weakest page
- **RECOMMENDED cards are visually broken:** the LEVEL badge overlaps and hides the titles ("My Pet" → "y Pet", "Pets" → "'ets"); cards are tiny white slivers with no covers.
- Section name shown twice back-to-back (text header "AARON READING LIBRARY" + READING LIBRARY logo image).
- **"READING GOAL — 0 BOOKS READ"** has no target ("Keep reading to reach your goal" of… what?), and contradicts the Den's "5 so far".
- **UP NEXT cards render raw matching metadata** — "Level A · digraphs-and-blends", "matches cvc · matches other" — developer strings on a kid's screen — and the list duplicates the exact same 5 books as RECOMMENDED directly above. Two lists, same content, both broken.
- Bottom explainer addresses adults ("…optional teacher marking tools").
- **Book reader:** toolbar wraps badly ("Back to Library" orphaned on a second row); an **Auto-advance checkbox** (desktop form control, tiny label, default on) sits in a kids' toolbar; "Page 1 of 7" is styled as a button; the mode strip repeats itself ("Tap words to hear them." + "Tap a word to hear it when approved word audio is available."); the illustration floats small in a tall grey panel with big voids above/below; the text panel is ~80% empty.

### Companion picker & account
- 10 of 11 companions render as **blank white cards** for the first seconds (image lag) — unusable for a child choosing by picture.
- Mixed naming scheme: world pals ("Meadow Pal, Dino Pal, Moonwood Pal") + plain animals ("Fox, Bear…") + one name ("Phinny"); pixel-art pals clash with the app's art styles; the selected state is a faint mint tint.
- "Change companion" exists in both the avatar chip *and* the account menu; **Sign out is one mis-tap deep with no guard** — with a picture password, a kid signing out means a parent must rescue.

---

## C. What works well

- The comic home (once images load) is bold, legible, and exciting; five clear sections is the right IA.
- The farm map is the best screen in the product — path metaphor, warmth, clarity.
- Letter Spot is model activity design: one question, one Listen button, three big targets.
- Kid-facing reading text (reader body, word chips) is the right size and font; the words-found chips are genuinely motivating.
- Daily "three quick tasks" is a strong ritual; Cycle Check's "play 4 more stations to open" gives a clear goal; game leave-guards are correct.

---

## D. Priorities

**P0 — broken or embarrassing on live**
1. Reading Library: fix badge-over-title overlap, remove the metadata strings, merge RECOMMENDED/UP NEXT into one list with covers, give the goal a real target, reconcile the 0-vs-5 books stat.
2. Image pipeline: preload/cache hero art, covers, and pal images; ship real placeholders (blurred thumb or icon), not black voids and white cards. *(This one fix improves nearly every screen.)*
3. Arcade art: replace the watermarked Sound Racer thumb, patch the watermarked Rocket Run background, give Letter Leap and Word Bridge distinct art.
4. Jargon purge on kid surfaces (CVC/HFW/digraphs/matches/STUDENT READER/EL/Cycle labels → plain kid words or hide behind parent view).

**P1 — coherence**
5. One navigation model: single Back per screen, one exit vocabulary, guard mid-activity exits everywhere, fix "Back to Library" label, make "Start next task" deep-link into the actual next station.
6. De-duplicate stats/labels on Story Quests (each stat once) and reader (progress once, words-found once); make choice buttons the strongest element on the reader page.
7. Currency diet: pick gems + stars, retire or hide coins/points/flame/shield until they do something; make the XP bar link somewhere that shows XP.
8. Sentence-case for anything a child must read (story titles, instructions); keep caps for logos only.

**P2 — polish**
9. Use the dead bottom half of Phonics/cycle screens (bigger targets, mascot, progress path); add a letter-state legend; one audio label + speaker icon everywhere.
10. Treasure Den: comic reskin, meaningful badges (what/when), reframe "Decorate your den" as "Choose your world", align earn-copy with reality.
11. Map: one naming (drop "EL" from kid view), consistent markers, unnumbered-vs-numbered resolved, station done-states, drop zoom buttons, orphan-proof station grid.
12. Letter Garden: seed icons instead of the word "Seed" ×5; add Letter Garden to the Arcade shelf or stop claiming all games live there.

---

*Verification note: all findings re-checked against captured screenshots this session. Not tested: audio output, touch devices/tablet layout, mid-game scoring flows, Medium/Hard game variants, parent-side pages.*
