# KIMI / CLAUDE-CODE AGENT PROMPT — import recorded audio + restyle student/teacher layout

You are working in the **LiteracyPath** repo on branch **`pristine-v2-3d`** (never touch `main` until the final go-live step). This is a live children's literacy app. Work in a **self-verifying loop**: make the smallest correct change → run the full gate → verify by **observation, not assumption** (including *listening* to audio and *screenshotting* UI) → fix → repeat until every acceptance box is ticked. **Do not report done until you have heard / seen each item pass.**

## GROUND RULES (do not break)
1. **Content is frozen** — no curriculum/word/sound/sentence/quest changes. Only audio files, layout, theming, and the blocklist edits described here.
2. **Human voice only** — never add TTS/synthetic audio. The only new audio is the human recordings staged below.
3. **You MUST ear-check imported audio in the running app** before marking it done. Wrong audio in a kids app is the worst possible bug.
4. Keep the gate green the whole time (build + tests + lint + the `check:*`/`audit:*` scripts). The `check:media-overwrite-risk` gate will flag intentional media changes — review its output and only proceed when the changes are exactly the intended audio replacements.

Full gate:
```
rm -rf dist && npm run build && npm run test:unit && npm run lint \
 && npm run check:approved-runtime-sources && npm run check:distractor-onset-giveaway \
 && npm run audit:app-image-inventory && npm run check:media-overwrite-risk && npm run check:repo-hygiene
```

---

## TASK 1 — Import the human voice recordings

**Staged clips (already split, aligned, trimmed, and loudness-matched to ~−18 dB by `tools/split-recording.py`):**
- `docs/audio-recording/staged/sounds/sound-001.mp3 … sound-058.mp3`
- `docs/audio-recording/staged/words/word-001.mp3 … word-112.mp3`
- `docs/audio-recording/recording_manifest.csv` maps every clip number to its exact spoken item.

**Clip → item mapping (fixed order):**
- SOUNDS: `sound-001..026` = the letter SOUNDS **a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z**; `sound-027..032` = the digraph SOUNDS **sh, ch, th, ng, qu, ck**; `sound-033..058` = the letter NAMES **a..z** (say-the-name).
- WORDS: `word-001..112` = the first 112 rows of `words-01.mp3` in `recording_manifest.csv` (alphabetical: a, above, … cabbage).

**Where each maps (verify every target against the repo before writing):**
- Letter sounds → BOTH `/public/audio/phonemes/<slug>.mp3` and `/public/audio/child-mode/clean-human/graphemes/{short_vowels|consonants}/<slug>.mp3`, where `<slug>` = `short_a/short_e/short_i/short_o/short_u` for the vowels, else the letter. Cross-check `PHONIC_AUDIO_BY_LETTER` in `src/data/phonicsLessons.js` and the `KNOWN_BAD_AUDIO_PATHS` list in `src/data/knownBadWordAudio.js` — those two enumerate the real paths (including any extra copies). Handle the letters missing from `PHONIC_AUDIO_BY_LETTER` (k, q, x) by finding their actual files on disk.
- Digraph sounds → the matching grapheme files under `/public/audio/.../graphemes/` (search the repo for `sh`, `ch`, `th`, `ng`, `qu`, `ck` grapheme mp3s).
- Letter names → `/public/audio/letter-names/<letter>.mp3` (and any other letter-name path the app references).
- Words → resolve each word's audio path(s) via `src/utils/mediaResolver.js` and the vocabulary lexicon `audioPath` in `src/data/kimiVocabulary500Lexicon.js`; copy the clip to **every** path the app plays for that word.

**Procedure (make it a reusable committed script, e.g. `tools/import-recordings.py`):**
1. Build the clip→path map from the app data above. For each mapping, assert the target path currently exists (you are *replacing* defective audio, not creating orphans) — log any target that doesn't resolve and skip it for review rather than guessing.
2. Copy the staged clip over each target path. Where the clip replaces the ONLY defective copy, that copy is overwritten (that is the replacement). **Delete** any now-unreferenced/duplicate old copies of the same item, but never delete a file that other content still points at — verify with a repo grep first.
3. Remove the now-satisfied entries from `KNOWN_BAD_AUDIO_PATHS` and `KNOWN_BAD_WORD_AUDIO` in `src/data/knownBadWordAudio.js` so the app plays the new recordings. Leave entries for anything NOT yet recorded (only sounds-01 + words-01 are in this batch; the other 8 files come later — `words-02`+ and any further sound files).
4. Regenerate the audio manifest (`npm run` prebuild step / `tools/generateAudioManifest.js`).
5. Print a report: every path written, every file deleted, every blocklist entry removed.

**Acceptance (MUST verify, not assume):**
- [ ] `npm run build` then open the app and **listen**: a phonics lesson plays the correct, clear, single warm voice for its letter sound and letter name; a CVC/word game plays the correct word for at least 6 sampled words. Each sampled clip is the RIGHT item and at a consistent volume.
- [ ] The blocklist no longer lists the imported items; items not yet recorded are still blocked (still silent, never wrong).
- [ ] Gate passes; `check:media-overwrite-risk` shows only the intended audio changes.
- [ ] The import script re-runs deterministically.

> Only `sounds-01` and `words-01` are recorded so far. Future batches drop into `docs/audio-recording/incoming/`; run `tools/split-recording.py <file> <count> <prefix> docs/audio-recording/staged/<dir>` then re-run the import for those.

---

## TASK 2 — Restyle the student home + trim the teacher area

Follow the full spec already in the repo: **`docs/CODEX_PROMPT_home_restructure_and_audio_2026-07-06.md`**, Deliverables A–C:
- **A. Student home** = an even 4-across tile grid of the 7 sections (Daily Challenge = 3 tasks, Phonics Learning [no games], EL Map Quests, Arcade [all games], Story Quests, Reading Library, Points/Progress). Responsive 4→2→1 columns.
- **B. Theming** = Arcade stays **jet-black arcade** (reuse `src/styles/arcade-dark.css`); every other student area + the home is **white / bright / blocky / on-theme, not babyish**.
- **C. Teacher area** = remove **EL Map Quests** and **Phonics Learning** (their teaching lives in the "present" slides); break nothing else.

Verify with screenshots at 1440 / 1024 / 390 px, plus the acceptance checklist in that doc. (Ignore that doc's "Deliverable D audio doc" — the audio doc is already built; Task 1 above supersedes it.)

---

## FINAL — go live
When Task 1 (heard) and Task 2 (seen) both pass the full gate:
1. Commit the intended files only (audio files, `knownBadWordAudio.js`, generated manifest, import + split scripts, home/layout components, theming CSS, teacher trims, new tests). No build artifacts or `graphify-out/` churn.
2. Push `pristine-v2-3d`, open the PR, and **merge to `main`** — Vercel deploys production.
3. Reply with: paths written / deleted, blocklist entries removed, the words/sounds you personally heard and confirmed, screenshots captured, and the merge commit.

**Do not merge to `main` until the audio has been heard in-app and the layout seen at all three widths.**
