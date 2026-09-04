# Task 2 Report

Date: 2026-09-02
Worktree: `guided-reading-c-standard-bridge`
Status: Complete for Task 2 scope; local commit only, not pushed

## Scope delivered

- Added immutable full-catalogue Guided Reading metadata authority for all 206 current runtime books.
- Preserved editorial `readingBandProfile` and `readingMode` through runtime aggregation and normalization.
- Split Level C into `C Standard` and `C Extended / Read Together` across child, teacher, and admin Guided Reading surfaces.
- Kept C progression standard-band-only while preserving extended completion history.
- Added explicit `C_STANDARD` and `C_EXTENDED` reader/content policy handling.
- Added focused unit and browser coverage for the Level C split and metadata invariants.

## Invariants verified

- 206 metadata rows exactly matched 206 runtime Guided Reading books.
- `171` books are `standard` + `predictable-levelled`.
- `35` books are `extended` + `supported-read-together`.
- `0` current books are labelled `decodable`.
- Standard Level C progression excludes Moonwood and keeps learner-specific independent/support logic separate.
- No Willow Street rows were introduced yet; only the stable collection destination was added.

## Inherited red from the required full browser run

The required one-pass browser set ended with five failures:

1. `tests/release/guided-reading-measure.spec.js`
   - Real Task 2 issue.
   - Cause: the Level C release check measured the current page image before the image had reported natural dimensions, producing `NaN` in the full-image-fit assertion.
   - Resolution: fixed the release test to wait for the reader image to be fully ready before geometry assertions.
2. `tests/release/student-device-matrix.spec.js` fullscreen transitions at `small-phone-landscape`, `tablet-portrait`, `chromebook-landscape`, and `projector-landscape`
   - Not a Task 2 code regression.
   - Cause: the existing missing Supabase frontend environment warning is emitted as a page error and fails the fullscreen matrix runtime-error assertion.
   - No code change made in Task 2 scope.

## Fresh green evidence

- `node --test tests/unit/guidedReadingBookMetadata.test.js tests/unit/childLibraryPolicy.test.js tests/unit/guidedReadingMeasure.test.js tests/unit/guidedReadingRecommendations.test.js tests/unit/guidedReadingCompletionPolicy.test.js tests/unit/teacherBusyWorkflow.test.js`
  - Passed: `92/92`
- `npm test`
  - Passed: `2487/2487`
- Scoped lint on Task 2 files
  - Passed
- Focused rerun after the Level C test-fix:
  - `npx playwright test tests/release/guided-reading-measure.spec.js --project=desktop`
  - Passed: `5/5`

## Files included in the local Task 2 commit

- `src/data/guidedReadingBookMetadata.js`
- `src/policy/guidedReadingCatalogPolicy.js`
- `src/utils/guidedReading/runtimeBooks.js`
- `src/utils/guidedReading/normalizeReadableBook.js`
- `src/utils/guidedReading/recommendBooksForStudent.js`
- `src/utils/guidedReading/completionPolicy.js`
- `src/policy/guidedReadingMeasure.js`
- `src/content/storyContentPolicy.js`
- `src/policy/childLibraryPolicy.js`
- `src/data/sourceOfTruthRegistry.js`
- `src/components/StudentBooksPage.jsx`
- `src/components/guided-reading/GuidedReadingPage.jsx`
- `src/components/guided-reading/ReadingSessionBar.jsx`
- `src/components/guided-reading/ReadingSessionSetup.jsx`
- `src/components/student-sessions/StudentSessionSetup.jsx`
- `src/components/admin/GuidedReadingReviewPanel.jsx`
- `src/components/teacher/teacherResourceShelf.js`
- `src/App.css`
- `tests/unit/guidedReadingBookMetadata.test.js`
- `tests/unit/childLibraryPolicy.test.js`
- `tests/unit/guidedReadingCompletionPolicy.test.js`
- `tests/unit/guidedReadingMeasure.test.js`
- `tests/unit/guidedReadingRecommendations.test.js`
- `tests/unit/teacherBusyWorkflow.test.js`
- `tests/release/guided-reading-measure.spec.js`
- `tests/release/student-device-matrix.spec.js`

## Remaining concern outside Task 2 scope

- The fullscreen matrix release check still reports the existing missing Supabase frontend environment warning as a runtime error in browser runs without `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
