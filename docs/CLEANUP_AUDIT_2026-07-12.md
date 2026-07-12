# Project Folder Cleanup Audit — 2026-07-12

Branch: `comic-redesign-audit-fixes`.

## ✅ EXECUTED in this pass

**Tier 1 (below) — 3.16 GB freed.** `dist/`, `src/graphify-out/`, `graphify-out/cache/` + all dated snapshots, `test-results/`, `tmp/`, `raw/`, `.cache/`, `build.log`, both Word `~$` lock files, `public_domain_books/`, `Design Reference Folder - Style - layout/`, and the two empty `Phonics app extension/* 2/` folders.

**Learn Decks — code killed, media kept.** Deleted the 8-file dead player chain (`LearnDeckPlayer.jsx`, `LearnDeckInteractionLayer.jsx`, `learn/SortCardsGame.jsx`, `learn/WordWallGame.jsx`, `learn/TurnCardReveal.jsx`, `learn/LearnCardMedia.jsx`, `learn/SoundSafariGame.jsx`, `utils/mediaResolver.js`) plus the two check scripts that existed only to guard it (`tools/checkLearnDeckContracts.js`, `tools/checkMediaResolverContracts.js` — neither was wired into an npm script).

**Deliberately kept:** `public/learn-decks/` (84 MB) and `src/data/learnDecks.js`. The manifest is the only thing that maps that media to lessons — binning it would make the kept media unusable if you ever rebuild the feature.

**Checks:** `node --test tests/unit/*.test.js` → **378/378 pass**. `eslint src tools` → **0 errors** (10 pre-existing warnings in `AdventureGame.jsx`, unrelated). Full `npm run build` can't run in the sandbox — it's in the push command below.

Tracked files removed (these show as git deletions): the 8 src files, the 2 tools, `~$teracyPath_ImageAuditReport.docx`, `tmp/imagegen/reel-read-{boat,fish}.png`. Everything else was gitignored.

## Still on the table (not done)

Tier 2 (215 MB of committed duplicates), Tier 3 (the rest of the dead `src/` code, ~15 MB), and the `LP Assets/` 580 MB. Details below.

---

Repo folder on disk: **~12 GB**. Roughly **8 GB of that is regenerable or duplicate**.

| Dir | Size | Verdict |
|---|---|---|
| `.git` | 4.6 GB | Keep (media history lives here) |
| `dist/` | 3.0 GB | **Trash** — gitignored build output |
| `public/` | 2.6 GB | Keep — the shipped media |
| `LP Assets/` | 878 MB | **Mostly trash** — gitignored import staging, 580 MB already copied into `public/` |
| `node_modules/` | 228 MB | Keep |
| `docs/` | 196 MB | Keep, minus 122 MB of duplicate files |
| `graphify-out/` | 168 MB | **Mostly trash** — 93 MB of it is committed churn |
| `src/` | 63 MB | 15 MB is a stray gitignored `src/graphify-out/`; ~15 MB dead code |
| `Phonics app extension/` | 20 MB | **Review** — separate vendored app, nothing imports it |

---

## TIER 1 — Safe to delete now (regenerable, gitignored, zero git impact)

| Item | Size | Why it's trash |
|---|---|---|
| `dist/` | 3.0 GB | Vite build output. Gitignored. `npm run build` regenerates it. |
| `src/graphify-out/` | 15 MB | Stray nested graphify run. Already gitignored (`/src/graphify-out/`). |
| `graphify-out/cache/` + `graphify-out/2026-07-0*` `2026-07-11` | ~50 MB | Dated run snapshots + cache. Gitignored. `graph.json` is the current one. |
| `test-results/` | 68 KB | Playwright output (incl. 4 stale `trace.zip`). Gitignored. |
| `.cache/`, `tmp/`, `raw/`, `build.log` | ~350 KB | Dev scratch. |
| `~$teracyPath_ImageAuditReport.docx` + `docs/audio-recording/~$LiteracyPath_Recording_Script.docx` | 2 KB | Word crash-lock files. The first one is **committed to git** by mistake. |
| `public_domain_books/` | 0 B | Four empty folders. |
| `Design Reference Folder - Style - layout/` | 0 B | Empty folder. |
| `Phonics app extension/public 2/`, `.../src 2/` | 0 B | Empty macOS duplicate folders. |

**Total: ~3.1 GB**, none of it tracked in git.

---

## TIER 2 — Duplicate files (tracked in git — deleting these actually shrinks the repo)

### 2a. Committed graphify churn — 93 MB

`graph 2.json` … `graph 9.json` are eight near-identical ~11.6 MB copies of `graph.json`, all **committed to git**. Only `graph.json`, `GRAPH_REPORT.md`, `manifest.json` are meant to be kept (your own `.gitignore` comment says so).

### 2b. macOS " 2" duplicate files — 183 files, 122 MB

- **170 files are byte-identical to their original** (29.5 MB) — pure trash. Mostly `docs/**` (`… 2.md`, `… 2.csv`, `… 2.html`, `… 2.xlsx`).
- **5 files differ from their original** and are older drafts worth a 10-second glance before deleting:
  - `docs/validation/checkpoint_integrity_audit 2.json`
  - `docs/validation/repo_hygiene_audit 2.md`
  - `docs/QUEST_DESIGN_PLAN_2026-07-11 2.md`
  - `docs/QUEST_SLICE_1_SPEC_2026-07-11 2.md`
  - `docs/validation/app_image_inventory 2.csv`

### 2c. `LP Assets/` — 878 MB, gitignored local staging

552 images. **372 of them (580 MB) already have a same-named file inside `public/`** — i.e. they were imported and the staging copy was never cleaned up (your Kimi pipeline is supposed to delete the folder afterwards). 180 images (307 MB) are *not* in `public/` — those are either unimported or rejected, so leave them alone until you've looked.

Recommendation: hash-verify then delete the 372 already-imported ones.

---

## TIER 3 — Dead code in `src/` (verified by import-graph from `main.jsx`, alias-aware)

418 files in `src/`. **347 reachable from the app. 58 are not.** Of those 58:

### 3a. Truly dead — nothing anywhere imports them (21 files, ~190 KB)

| File | Note |
|---|---|
| `components/learn/games/games/SoundBeatArcadeGame.jsx` | 55 KB. The registry (`games/index.js`) loads `SoundBeatGame.jsx`. This arcade variant is unreachable. |
| `data/qbAssess_hfw1.js`, `data/qbAssess_hfw2.js` | 71 KB. Superseded by the generated HFW banks. |
| `components/SkillsBlockQuestMockup.jsx` | Mockup. |
| `components/quest/TrailMap.jsx`, `quest/world/TrailWalk.jsx` (→ `WorldScene.jsx`) | Old quest map/world. |
| `components/admin/MediaQaReviewPage.jsx` | Not routed anywhere → **drags 10.5 MB of `data/generated/mediaQaReviewItems.generated.js` with it**. |
| `components/LearnDeckPlayer.jsx` (→ `LearnDeckInteractionLayer` → `SortCardsGame`, `WordWallGame`, `TurnCardReveal`, `LearnCardMedia`, `learn/SoundSafariGame.jsx`, `utils/mediaResolver.js`) | The whole Learn Deck player chain. See ⚠️ below. |
| `components/assessment/AssessmentShell.jsx`, `ChoiceGrid.jsx`, `QuestionRenderer.jsx`, `components/questions/index.js` (→ `FirstSoundQuestion.jsx`) | Abandoned refactor scaffold. |
| `content/lexicon/index.js` (→ `queries.js`), `content/initialSounds/index.js` (→ `initialSoundCoverage.js`) | Dead barrel files. `masterWordLexicon.js` itself is live. |
| `content/assessments/assessmentAudioManifest.js` | → **drags 3.9 MB `assessmentAudioInventory.generated.json`** with it. |
| `data/childActivityModels.js`, `skillDomains.js`, `questionTypes.js` | |
| `components/learn/games/shared/StarIcon.jsx`, `LetterTile.jsx`, `WordTile.jsx` | Unused shared bits (`SoundToggle.jsx` IS live). |

**Deleting the whole dead set removes ~15 MB and ~35 files.**

### 3b. Not dead — used only by `tools/` and `tests/` (19 files, 9.2 MB) — **KEEP**

`skillWordBank.generated.js` (6.9 MB), `hfwApprovedQuestionBank.generated.js`, `hfwCuratedSentences.generated.js`, `src/questions.js`, `assessmentSkillContracts.js`, `skillLevelDepthConfig.js`, `studentDetailedReportBuilder.js`, the `content/skillMedia/*` cluster, etc. They don't ship in the bundle but your check scripts import them. Leave them.

---

## ⚠️ Two things that need YOUR call, not mine

1. **Learn Decks looks like a fully dead feature.** `LearnDeckPlayer.jsx` and `data/learnDecks.js` are imported by nothing but a check script — and they are the *only* things pointing at **`public/learn-decks/` (84 MB of slides + pptx)**. Either the feature is dead (delete code + media) or it's parked for later (leave it). I'm not deleting 84 MB of media on a guess.

2. **`Phonics app extension/` (20 MB, 122 files, committed).** A separate Vite/TypeScript app vendored into the repo. Nothing in `src/` imports it and it's excluded from the Vercel build. Reference material, or dead weight?

---

## Nice-to-haves

- **`tools/`**: 216 scripts, 97 wired into npm scripts, the rest referenced from docs/other tools. Only 9 are referenced nowhere at all (~85 KB) — one-shot asset generators that already did their job: `buildStarGalleryAiAssets.mjs`, `convert-ps1-arcade-webp.mjs`, `convert-word-bridge-webp.mjs`, `generate-character-sprites.mjs`, `generate-game-sprites.mjs`, `generate-hollow-images.mjs`, `generateGameMusicLoops.mjs`, `generateStarGalleryAssets.mjs`, `tmp_applyLengthPatches.mjs`.
- **Root preview pages** (`rocket-run-preview.html` etc., 13 of them + their `src/*-preview.jsx`): these are your standalone dev harnesses, reachable via `npm run dev`. Not dead — keep.
- **`public/` media**: every top-level media folder is referenced by live code. No orphan media directories, and the `_replaced` / `_rejected` quarantine folders are already empty. The only questionable one is `learn-decks` (above).
- **`.gitignore` gaps** worth adding: `graphify-out/graph [0-9].json`, `*~$*`, `public_domain_books/`.
