# Task 3 report — teacher-only Guided Reading discussions

## Outcome

Implemented one static, frozen discussion record for every one of the 206 current Guided Reading books. Each record contains exactly one book-specific oral move and one image-grounded visual move. Teacher, teacher-led class, and admin-review readers mount a collapsed `Discuss this book` panel; student readers do not mount or serialize its private prompt text. The visual move's button navigates to its referenced reading page. The panel accepts no learner identity and has no persistence, scoring, result, or response-capture API.

Feature commit: `d5932080cd457c1f0fea9ebc0706b0b5e98afdb2` (`feat: add teacher guided reading discussions`)

Nothing was pushed.

## RED evidence

Tests were added before the implementation.

- `node --test tests/unit/guidedReadingDiscussionPrompts.test.js`
  - Failed with `ERR_MODULE_NOT_FOUND` for `src/data/guidedReadingDiscussionPrompts.js`.
- `npx playwright test tests/release/guided-reading-control-hierarchy.spec.js --project=desktop --grep 'teacher discussion support|student Guided Reading does not mount'`
  - Teacher test failed because the `Discuss this book` panel did not exist.
  - The pre-existing student surface already contained no discussion copy.

## GREEN evidence

- `node --test tests/unit/guidedReadingDiscussionPrompts.test.js`
  - 6/6 passed.
- `npm run check:guided-reading-discussion-prompts`
  - 206 static book records passed.
- `npx playwright test tests/release/guided-reading-control-hierarchy.spec.js tests/release/guided-reading-decoding-support.spec.js --project=desktop`
  - 8/8 passed, including collapsed teacher panel, book-specific copy, visual-page navigation, child-DOM privacy, existing control hierarchy, child target geometry, whole-book audio, and teacher decoding-support report coverage.
- Scoped ESLint over all changed JavaScript/JSX source, tool, and test files
  - Passed with no findings.
- `git diff --cached --check`
  - Passed before the feature commit.

The browser run emitted the repository's expected preview warning that Supabase frontend environment variables were absent. The discussion panel performs no hosted or learner-data writes, and the browser assertions completed successfully.

## Prompt-quality evidence

- 206 records for 206 current books; no missing or orphan IDs.
- 206 unique oral prompt sentences and 206 unique visual prompt sentences.
- 206/206 visual moves reference active reading pages with final media.
- All 144 exact page-text fragments quoted by oral prompts match active readable text after punctuation normalization.
- Every visual prompt/cue shares at least two concrete content terms with that page's final text, image alt, page description, or illustration prompt.
- Gate rejects empty moves, generic prompts, excessive duplicate/opening reuse, missing/orphan records, inactive or missing visual pages/media, unsupported visual evidence, unknown schema fields, mutable records, and assessment-like keys.
- Zero quiz, answer, choice, score, correctness, result, mastery, proficiency, total, or threshold fields are authored.
- The one-time authoring helper was removed after producing the checked-in static authority. Runtime prompt inference was not added.

## Changed files

- `src/data/guidedReadingDiscussionPrompts.js`
- `src/components/guided-reading/BookDiscussionPanel.jsx`
- `src/components/guided-reading/GuidedReadingPage.jsx`
- `src/utils/guidedReading/normalizeReadableBook.js`
- `src/data/sourceOfTruthRegistry.js`
- `src/guided-reading-preview.jsx`
- `src/App.css`
- `tools/checkGuidedReadingDiscussionPrompts.mjs`
- `tests/unit/guidedReadingDiscussionPrompts.test.js`
- `tests/release/guided-reading-control-hierarchy.spec.js`
- `package.json`

## Residual concerns

- Verification was focused desktop-browser and source-integrity coverage. It did not include physical-iPad testing or authenticated hosted Supabase use.
- No learner response or discussion-result persistence exists by design, so there was no hosted-data mutation to verify.
