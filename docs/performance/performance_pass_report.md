# Performance Pass Report

Date: 2026-05-26

## Result

The largest single startup JavaScript file was reduced from about 5.16 MB to about 323 KB in the build output, and about 316 KB on disk.

## Before

| Asset | Size | Gzip |
|---|---:|---:|
| `assets/index-*.js` | 5,161.82 kB | 748.46 kB |
| `assets/exceljs.min-*.js` | 929.91 kB | 256.43 kB |
| `assets/AdminDashboardPage-*.js` | 33.29 kB | 8.51 kB |

## After

| Asset | Load type | Size | Gzip |
|---|---|---:|---:|
| `assets/index-*.js` | entry | 323.45 kB | 78.21 kB |
| `assets/vendor-react-*.js` | startup vendor | 324.07 kB | 102.97 kB |
| `assets/vendor-supabase-*.js` | startup vendor | 200.30 kB | 51.54 kB |
| `assets/guided-reading-data-*.js` | split data chunk | 514.59 kB | 104.33 kB |
| `assets/generated-early-skills-*.js` | split data chunk | 552.34 kB | 25.01 kB |
| `assets/question-bank-extra-*.js` | split data chunk | 755.38 kB | 108.65 kB |
| `assets/audio-manifest-*.js` | dynamic fallback audio | 776.37 kB | 201.80 kB |
| `assets/admin-media-inventory-*.js` | admin-only media QA | 1,714.55 kB | 72.99 kB |
| `assets/exceljs.min-*.js` | export-only dynamic import | 929.92 kB | 256.44 kB |

## What Changed

- Full public media inventory no longer loads with the student app. It is loaded by the lazy admin dashboard for Image QA and Audio QA only.
- Full audio manifest no longer loads at app startup. It is dynamically imported only if static/preferred audio lookup falls through to the legacy audio manifest.
- Generated early-skill questions are physically split by skill and re-exported through a small compatibility aggregator.
- Vite manual chunks now separate:
  - React/motion vendor
  - Supabase vendor
  - Guided Reading data
  - generated early skill banks
  - extra question banks
  - audio fallback manifest
  - admin media inventory
  - Excel export dependency

## Validation

- `ANALYZE_BUNDLE=true npm run build` passed.
- `npm run build` passed.
- `node tools/checkMediaQualityManifest.js` passed.
- `node tools/checkRuntimeQuestionCoverage.js` passed.
- `node tools/auditQuestionBank.js` still reports existing content-quality issues unrelated to this performance split, including two Level 1 ending-sound items without approved word audio and legacy invalid final-sound seed items for `ship`/`shop`.

## Remaining High-Risk Bottlenecks

- `guided-reading-data`, `generated-early-skills`, and `question-bank-extra` are still module-preloaded because `App.jsx` and `AppPages.jsx` still statically depend on them.
- To cut true first-login network work further, the next pass should:
  - extract `GuidedReadingPage` out of `AppPages.jsx`
  - extract `TeacherReportsPage` out of `AppPages.jsx`
  - lazy-load the assessment question bank after teacher login/student selection
  - load per-skill generated banks only when that skill starts

This pass reduces browser parse pressure and removes the worst admin/audio payloads from the main app file, but the app still needs a deeper route/data extraction pass for low-bandwidth schools.
