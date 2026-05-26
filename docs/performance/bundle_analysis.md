# Bundle Analysis

Date: 2026-05-26

## Baseline

Before this pass, the production build emitted one dangerous application entry chunk:

| Chunk | Size | Gzip |
|---|---:|---:|
| `assets/index-*.js` | 5,161.82 kB | 748.46 kB |
| `assets/exceljs.min-*.js` | 929.91 kB | 256.43 kB |
| `assets/AdminDashboardPage-*.js` | 33.29 kB | 8.51 kB |

The bundle analysis showed the largest modules inside the entry chunk were:

| Module | Rendered size |
|---|---:|
| `src/data/publicMediaInventory.js` | 2,169,474 bytes |
| `src/data/audioManifest.js` | 942,314 bytes |
| `src/data/generated/earlySkillQuestions.generated.js` | 705,826 bytes |
| `src/data/guidedReadingRegenBooks.js` | 370,985 bytes |
| `src/data/generatedQuestions.js` | 184,596 bytes |
| `src/data/guidedReadingBooks.js` | 145,579 bytes |

## Root Causes

- Student runtime imported the full public media inventory through `mediaQaManifest.js`.
- Student runtime imported the full audio fallback manifest even when no fallback audio was needed.
- Generated early-skill questions were stored in one large file.
- Guided Reading page/data are still coupled to `AppPages.jsx`, so they are not yet fully route-lazy.
- The main question-bank arrays are still statically available to the assessment runtime.

## Split Points Implemented

- `publicMediaInventory.js` moved out of student runtime and into the lazy admin dashboard chunk.
- `audioManifest.js` now loads dynamically only when fallback audio lookup is needed.
- Vite manual chunks now split vendor, Supabase, guided-reading data, generated early skills, extra question banks, audio manifest, Excel, and admin media inventory.
- `earlySkillQuestions.generated.js` is now a small aggregator over split generated files:
  - `finalSounds.generated.js`
  - `cvc.generated.js`
  - `shortVowel.generated.js`
  - `rhyming.generated.js`

## Remaining Bottlenecks

- `AppPages.jsx` still statically imports Guided Reading helpers and data because multiple page components live in one large module.
- `generatedEarlySkillQuestions` and the extra question-bank chunk are still initial dependencies because the assessment runtime constructs the question pool synchronously.
- The next meaningful pass should extract `GuidedReadingPage` and `TeacherReportsPage` into separate modules and load the assessment bank asynchronously after login/student selection.
