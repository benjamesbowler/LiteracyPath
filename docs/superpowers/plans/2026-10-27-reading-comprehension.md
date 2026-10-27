# Reading Comprehension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Approved build is executed inline; perform one fresh final review.

**Goal:** Deliver the approved 24-passage comprehension area, three modes and matching black-and-white print resources.
**Architecture:** One authored bank, a pure scoped practice state model, a lazy shared React workspace, and deterministic print builders. Existing teacher and Books entry points open the same area.
**Tech Stack:** Existing React/Vite, Node tests and browser/PDF verification; no dependencies or hosted changes.
**Spec:** ../specs/2026-10-27-reading-comprehension-design.md

## Global Constraints

- 24 original passages: four short-vowel/CVC, four consonant digraph/blend, six silent-e and ten vowel-team passages.
- Whole group, Small group, Student practice; teacher notes/keys stay private.
- Roughly 30-90 words; explicit target/support words and prerequisites; no inferred calibrated reading level.
- Black/white outline art, embedded Andika, >=14pt child print text, >=12mm margins.
- One read/question sheet and one draw/retell extension per passage, separate teacher guide.
- No mastery, reading placement or hosted score mutations; preserve focus-session restrictions.

## Review Focus

- Changing learner must not restore another learner's practice; test scope isolation.
- Corrupt/unsupported storage must safely start fresh; test validation and unavailable storage.
- Student routes must not expose teacher notes or teacher print keys; test rendered controls and route guard.
- Mixed/empty filters and invalid passage IDs must be recoverable; test catalogue and print validation.
- Print assets/popups can fail; test failure states and all 24 printed layouts.

### Task 1: Authored bank and practice model

Files: create src/content/comprehension/passages.js, practice.js; tests/unit/comprehension.test.js.
Interfaces: COMPREHENSION_PASSAGES; passageById(id); initialPractice(passage); reducePractice(passage,state,action); readPractice(storage,scope,passage); savePractice(storage,scope,passage,state).
- [x] Write failing bank/state tests for counts, unique stories, evidence, target occurrence, choice uniqueness, first attempt, retry, completion and scope isolation.
- [x] Implement 24 original records with explicit phonics metadata and three evidenced questions each.
- [x] Implement validated learner-scoped session storage, reset and rereading checks; run focused tests.
- [x] Commit named bank/model/test files.

### Task 2: Deterministic print resources

Files: create src/content/comprehension/print.js; extend comprehension unit tests and add tools/checkComprehensionPrint.mjs.
Interfaces: buildComprehensionDocument({passageIds,variant}) -> {html,title,pages}; variants worksheet, extension, pair, teacher.
- [x] Test invalid/empty selections, deterministic HTML, separated answer keys and metadata.
- [x] Build A4 print pages with shared font/art embedding and source-derived answers; integrate exact shadow preview.
- [x] Render every variant for all 24 passages; require exact physical page counts and no overflow/missing assets; inspect representative PDFs.
- [x] Commit builder and meaningful checks.

### Task 3: Shared workspace and navigation

Files: create src/components/comprehension/ComprehensionPage.jsx and comprehension.css; modify AppSurface.jsx, appViews.js, appViewHelpers.js, routes.js, pageMetadata.js, TeacherIntentPage.jsx, StudentBooksPage.jsx, WorksheetGeneratorPage.jsx.
Interfaces: ComprehensionPage({teacher,scope,onBack}); entry callbacks onOpenComprehension.
- [x] Test new teacher/child route reachability, focused-session protection and teacher-only affordances.
- [x] Build catalogue, filters, three modes, evidence/retry, rereading, device-voice support, print/batch/preview and graceful errors.
- [x] Wire real Teach, Worksheets and Books entries; keep student Home destinations unchanged.
- [x] Exercise actual navigation and all controls at phone/tablet/desktop widths; inspect screenshots.
- [x] Commit scoped runtime changes.

### Task 4: Final checks and handoff

Files: update Worksheet Bible, docs/INDEX.md, cleanup record and approved spec status.
- [x] Document fixed passage resources separately from unchanged six-stage cycle recipes.
- [x] Run question-contracts, regression, required worksheet and affected UI/navigation gates; resolve changed-scope failures.
- [x] Fresh reviewer checks full diff and educational/print acceptance; fix substantive findings with regressions.
- [x] Perform protected-root-aware cleanup, retain verified PDFs and evidence.
- [ ] Publish after explicit authorization: remote main was integrated and named scope committed; automatic approval review rejected the branch push as outside the accepted build authorization. No remote code was published.
