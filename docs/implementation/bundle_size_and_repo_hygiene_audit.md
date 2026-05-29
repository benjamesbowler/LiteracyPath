# Bundle Size and Repo Hygiene Audit

Generated: 2026-05-29

Scope: audit only. No app behavior, assessment logic, guided reading content, Supabase/auth, teacher dashboard features, or question-bank data was intentionally changed in this pass.

## Current Build Output

Existing `dist/` output was inspected instead of running a fresh full build.

### JavaScript and CSS Chunks

| Chunk | Size | Notes |
| --- | ---: | --- |
| `dist/assets/index-IjEGnPps.js` | 1.6 MB | Main app entry. Still imports broad runtime data and core app state. |
| `dist/assets/admin-media-inventory-KGaxYUct.js` | 1.3 MB | Admin/media inventory is split, but should only load in admin media tooling. |
| `dist/assets/guided-reading-data-CfnXl8mu.js` | 1.0 MB | Guided reading metadata/page text is split, but still one large guided-reading data chunk. |
| `dist/assets/exceljs.min-CjgIwHka.js` | 908 KB | Export dependency is chunked. Verify it is only dynamically loaded from export actions. |
| `dist/assets/question-bank-extra-CLZ6zgkC.js` | 902 KB | Late/extra question banks are split but still broad. |
| `dist/assets/audio-manifest-BCfLNgTG.js` | 758 KB | Audio preferences/manifests are bundled as one large chunk. |
| `dist/assets/generated-early-skills-DY3YEyCB.js` | 538 KB | Early generated questions are split, but not skill-level lazy loaded. |
| `dist/assets/vendor-react-DOkSYiZU.js` | 316 KB | Expected. |
| `dist/assets/vendor-supabase-w3O5B6Bf.js` | 196 KB | Expected for auth/data access. |
| `dist/assets/index-DFff-5WG.css` | 130 KB | Manageable. |
| `dist/assets/AdminDashboardPage-BCy74Fnc.js` | 79 KB | Admin page itself is lazy-loaded. |

`dist/assets/` totals about 7.8 MB. Static guided-reading assets under `dist/guided-reading/` are about 1.3 GB, and the whole `dist/` folder is about 2.2 GB.

### Largest Static Asset Areas

| Area | Size | Notes |
| --- | ---: | --- |
| `public/guided-reading/` | 1.0 GB | Main static payload risk. Many page images are PNGs around 1.8-2.1 MB each. |
| `public/images/` | 539 MB | Includes large child-mode UI images and other static art. |
| `public/media/` | 130 MB | Assessment vocabulary/media. |
| `public/audio/` | 8.9 MB | Small compared with images. |
| `LP Assets/` | 879 MB | Tracked source/archive assets inside repo. This is a repo-hygiene risk, not an app runtime chunk by itself. |

Largest tracked/public files include repeated large guided-reading PNGs and duplicated `LP Assets` copies. The biggest tracked non-media docs include `docs/imports/kimi_phonics_dataset7.json` and `docs/assets/usable_vocab_media_inventory.json`.

## Likely Bundle Causes

| Cause | Risk | Why it matters |
| --- | --- | --- |
| Guided reading metadata is grouped into one data chunk | Medium | Opening any guided-reading path can pull a large data module. Split by level/series later. |
| Generated question banks are imported eagerly by `src/App.jsx` | Medium | Student assessment startup can carry more question data than the active skill needs. |
| Audio preference manifest is imported by many runtime utilities | Medium | The manifest chunk is large and reused broadly. Student runtime likely needs a small approved subset, not audit/history data. |
| Admin media inventory exists as a large chunk | Low to medium | It is already manually chunked, but accidental imports from student flow would be costly. |
| ExcelJS is a large chunk | Low | It is already dynamically imported in export helpers; keep it that way. |
| Static guided-reading images are huge | High for deployment/storage/load | Not JS, but this dominates build size and deploy upload time. |

## Repo Hygiene Findings

The working tree was clean at the start of this audit. `.gitignore` already includes:

- `/dist/`
- `/dist_stuck_*/`
- `/_DELETE_ME_*/`
- `raw/`
- `*.zip`
- local source pack folder names

Findings:

- `dist/` exists locally and is ignored. Safe to remove locally when disk/build speed becomes a problem.
- `raw/` and `public_domain_books/raw` are present but empty; neither is tracked.
- `literacy-src-only.zip` is 280 MB in the repo folder but ignored and not tracked.
- `LP Assets/` is tracked: 1,497 files and about 879 MB. This is the largest repo hygiene risk. Do not delete it blindly; decide whether it is a canonical archive or should be moved out of Git/LFS-managed separately.
- `docs/` contains 165 tracked files under generated-audit-heavy areas: `docs/assets`, `docs/guided-reading`, `docs/validation`, and `docs/implementation`.
- Recent docs churn is high: more than 100 docs files were modified within the last two days.

## Generated Docs Churn

Commands that likely rewrite tracked docs include:

- guided reading validators and alignment checks
- skill-bank validators
- assessment integrity / production readiness audits
- media coverage and Kimi request generators
- question-bank audits

Suggested policy:

| Doc type | Recommendation |
| --- | --- |
| Human decision records, import audits, schema/setup notes | Keep tracked. |
| Current canonical Kimi request files | Keep tracked while active, archive once fulfilled. |
| Large machine-generated JSON inventories | Move to `docs/generated/` or ignore unless needed for review. |
| Rewritten validation reports | Keep only milestone snapshots or generate intentionally before release. |
| Routine local validation outputs | Prefer ignored `tmp/reports/` or `docs/generated/local/`. |

Do not change tracking in bulk yet. The safe next move is to classify docs by owner/use before removing anything from Git.

## Safe Code-Splitting Plan

Recommended future tasks, in low-risk order:

1. Keep ExcelJS dynamic-only. It already appears chunked; add a guard/test that no static `import ExcelJS` enters app startup.
2. Verify `AdminDashboardPage` and admin media tools are only lazy-loaded from teacher/admin paths.
3. Split guided reading data by series or level: shelf summaries first, full page arrays only when opening a book.
4. Split student assessment question banks by skill group, then load the active skill bank on demand.
5. Split audio manifests into runtime-approved minimal maps versus admin/audit/replacement history.
6. Move admin media inventory behind a dynamic import within admin media QA only.
7. Optimize guided-reading PNGs to WebP/AVIF where quality allows, prioritizing 1.8-2.1 MB page images.

What should not be changed yet:

- Do not rewrite assessment selectors during this cleanup pass.
- Do not change guided reading book data or paths until a dedicated asset optimization pass has a visual QA plan.
- Do not remove `LP Assets/` until the team decides whether it is still a required archive.
- Do not ignore all docs blindly; several docs are active QA handoff artifacts.

## Build and Codex Stability

Likely causes of slow/hanging work:

- `dist/` is 2.2 GB locally, so scans/build-output listing can be slow.
- `public/` is 1.7 GB, dominated by guided reading images.
- `LP Assets/` is tracked and large, increasing Git/status/history operations.
- Validation commands rewrite many docs and can produce very large output.
- Broad searches over `src public docs tools` can accidentally traverse thousands of large media/report files.

Recommended workflow rules:

- Prefer targeted checks over full validation suites during coding.
- Human or CI should run full `npm run build` before commit/release; Codex should run it only when explicitly requested or after runtime-affecting changes.
- Never use `git add .`; stage exact files.
- Commit feature groups separately: assessment, guided reading, dashboard, media, docs.
- Before committing, run `git status --short` and review generated docs separately.
- Keep source packs and generated media delivery folders outside the repo.
- Remove local `dist/` when troubleshooting build hangs, but do not commit build output.

## Suggested Pre-Commit Commands

Lightweight:

```bash
git status --short
git diff --check
```

Feature-specific:

```bash
npm run build
node tools/checkAssessmentRuntimeSafety.js
node tools/checkRuntimeQuestionCoverage.js
npm run validate:skill-banks
npm run check:skill-progression
```

Guided-reading-specific:

```bash
node tools/checkGuidedReadingSeriesBooks.js
node tools/checkGuidedReadingVisibility.js
node tools/checkGuidedReadingExperience.js
node tools/checkGuidedReadingTitlePages.js
node tools/checkGuidedReadingImageTextAlignment.js
```

## Tiny Safe Changes Made

Only this audit document was added. No runtime code, app data, question banks, guided reading content, Supabase/auth code, or dashboard behavior was changed.
