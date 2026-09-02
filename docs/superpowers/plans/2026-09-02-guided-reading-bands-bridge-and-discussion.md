# Guided Reading Bands, Willow Street Readers, and Teacher Discussion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire scored Guided Reading comprehension, split Level C into honest standard and extended shelves, add teacher-only book-specific discussion support, and publish the complete 20-book Willow Street Readers collection with final media and audio.

**Architecture:** Keep the existing A/B/C catalogue and progress stores, but add full-catalogue editorial metadata and discussion authorities keyed by book ID. Child completion becomes a direct save-and-return/level-up transition; teacher discussion support is read-only and never enters learner evidence. A separate bridge-book authoring source feeds the existing runtime, media, narration, provenance, and release pipelines.

**Tech Stack:** React 19, Vite 7, JavaScript ES modules, Node test runner, Playwright, existing Guided Reading content/media/audio tools, image-generation tooling, ESLint, Git.

**Spec:** `docs/superpowers/specs/2026-09-02-guided-reading-bands-bridge-and-discussion-design.md`

## Global Constraints

- A/B/C remain internal levels; product copy and metadata shown to users must not name or imply a crosswalk to an outside reading programme.
- Level C has exactly two shelf bands named `C Standard` and `C Extended / Read Together`; all Moonwood books are extended/read-together.
- Every runtime book has one `readingBandProfile` value (`standard` or `extended`) and one `readingMode` value (`decodable`, `predictable-levelled`, or `supported-read-together`).
- `decodable` is allowed only when explicit full-text phonics-scope evidence proves the claim.
- Child completion writes no `quizScore`, `quizTotal`, `quizAt`, replacement score, proficiency claim, or comprehension evidence.
- Historical quiz fields stay intact in raw persisted records but are not consumed by current shelves, reports, exports, or recommendations.
- Every runtime book has exactly one teacher-only oral prompt and one teacher-only image-grounded visual prompt with a valid reading-page reference and private listen/look-for note.
- The child DOM contains no teacher discussion prompt text and no quiz, generic question drawer, score, or quiz-derived stars.
- Willow Street Readers contains exactly 20 Level C Standard books: six everyday-fiction, four culture/community, four procedure, and six photorealistic-nonfiction titles.
- Every Willow Street book has exactly 8 reading pages, excluding its title page, and every reading page has 6–12 visible words; this is the approved 8–10-page constraint at its stable lower bound.
- Legacy `type` is `fiction` for the six everyday and four culture/community books, and `nonfiction` for the four procedure and six photorealistic factual books; `bridgeGenre` retains the exact 6/4/4/6 distinction.
- The 14 illustrated books use the recurring Maya, Samir, Leo, and Zoe visual world; the six nonfiction books use newly created photorealistic images.
- Final art contains no baked-in book text or visible brand marks. Page text, art, narration, word support, page order, and provenance bind to the same final manuscript.
- Newly generated visual-review records require direct page-by-page inspection; generated file existence is not approval.
- Automated audio checks are not reported as direct human listening, and browser emulation is not reported as physical-device testing.
- Preserve unrelated working-tree changes, historical migrations, unrelated question systems, and shared components used outside Guided Reading.

---

### Task 1: Retire the scored child quiz and preserve direct completion

**Files:**
- Delete: `src/components/guided-reading/BookQuiz.jsx`
- Delete: `src/utils/guidedReading/bookQuizQuestions.js`
- Delete: `src/policy/guidedReadingBigIdeaPolicy.js`
- Delete: `src/data/generated/guidedReadingQuizzes.generated.js`
- Delete: `public/guided-reading/quizzes/*.json`
- Delete: `tools/generateGuidedReadingQuizIndex.js`
- Delete: `tools/auditGuidedReadingQuestions.js`
- Delete: `tools/guidedReadingQuestionAuditLib.js`
- Delete: `tools/rebuildGuidedReadingQuizzes.js`
- Delete: `tools/generateGuidedReadingWorldExpansionQuizzes.mjs`
- Delete: `tools/upgradeGuidedReadingQuizSchema.js`
- Delete: `tests/unit/guidedReadingQuizRuntime.test.js`
- Delete: `tests/unit/guidedReadingQuestionBank.test.js`
- Rename: `tests/smoke/guided-reading-quiz.spec.js` to `tests/smoke/guided-reading-reader.spec.js`
- Modify: `src/components/guided-reading/GuidedReadingPage.jsx`
- Modify: `src/guided-reading-preview.jsx`
- Modify: `src/components/AppSurface.jsx`
- Modify: `src/components/StudentBooksPage.jsx`
- Modify: `src/policy/childLibraryPolicy.js`
- Modify: `src/utils/guidedReading/completionPolicy.js`
- Modify: `src/utils/reportSections.js`
- Modify: `src/data/studentReportingWorkspaceModel.js`
- Modify: `src/components/reports/StudentReportViews.jsx`
- Modify: `src/App.jsx`
- Modify: `src/App.css`
- Modify: `src/styles/comic-theme.css`
- Modify: `src/styles/sage-soft.generated.css`
- Modify: `src/styles/kids-library.css`
- Modify: `src/data/knowledgeJourneys.js`
- Modify: `src/utils/guidedReading/phonicsPageAnalyzer.js`
- Modify: `package.json`
- Modify: `vite.config.js`
- Modify: `tools/releaseGate.mjs`
- Modify: `tools/checkQuestionDesignPolicy.mjs`
- Modify: `.github/workflows/ci.yml`
- Modify: `tests/unit/guidedReadingCompletionPolicy.test.js`
- Modify: `tests/unit/childLibraryPolicy.test.js`
- Modify: `tests/unit/reportSections.test.js`
- Modify: `tests/unit/studentReportingWorkspaceModel.test.js`
- Modify: `tests/unit/literacyExperiencePolicy.test.js`
- Modify: `tests/fixtures/guided-reading-support-report.jsx`
- Modify: `tests/smoke/guided-reading-reader.spec.js`

**Interfaces:**
- Consumes: existing completion persistence, reread accounting, daily-mission return, `shouldShowGuidedReadingScoreSummary({ mode, studentId })`, and level-completion summary behavior.
- Produces: `completeBook()` that persists completion and immediately invokes the existing post-completion transition without a quiz; `bookReadingProgress()` without a `stars` field; reporting models with no Guided Reading quiz-derived evidence.

- [ ] **Step 1: Write failing completion and evidence tests**

Add assertions that a completed student book transitions immediately, that persisted completion input has no quiz fields, that the child-library model exposes no stars, and that reporting ignores legacy fields:

```js
test("Guided Reading completion is not comprehension evidence", () => {
  const rows = buildGuidedReadingReportRows(
    { "book-1": { completed: true, completedPages: 2, quizScore: 3, quizTotal: 3 } },
    {
      guidedReadingBooks: [{ id: "book-1", title: "Book One", level: "C", pages: [{}, {}] }],
      getGuidedReadingProgress: () => ({ completed: true, completedPages: 2 })
    }
  );
  assert.equal("quizScore" in rows[0], false);
  assert.equal("quizTotal" in rows[0], false);
  assert.equal("quizRows" in buildGuidedReadingSummary(rows), false);
});

test("book progress does not project legacy quiz stars", () => {
  const progress = bookReadingProgress(
    { id: "book-1", pages: [{}, {}] },
    { completed: true, quizScore: 3, quizTotal: 3 }
  );
  assert.equal("stars" in progress, false);
});
```

Add a storage-merge regression showing that a reread preserves historical `quizScore`, `quizTotal`, and `quizAt` already present in the raw record while the new completion patch does not add those keys to a clean record.

In the smoke test, retain reader navigation coverage and replace the quiz expectation with:

```js
await page.getByRole("button", { name: /finish book/i }).click();
await expect(page.getByRole("dialog", { name: /quiz|questions/i })).toHaveCount(0);
await expect(page.getByText(/talk and write/i)).toHaveCount(0);
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```bash
node --test tests/unit/guidedReadingCompletionPolicy.test.js tests/unit/childLibraryPolicy.test.js tests/unit/reportSections.test.js tests/unit/studentReportingWorkspaceModel.test.js
```

Expected: failures show quiz-derived stars/report evidence and the current quiz-dependent completion path.

- [ ] **Step 3: Refactor completion before deleting the quiz**

Add this pure helper to `completionPolicy.js`, then move the level-completion and close/return behavior currently owned by `handleQuizFinish` into `completeBook()` using it:

```js
export function getGuidedReadingCompletionMilestone({ book, levelBooks = [], records = {} } = {}) {
  const allDone = levelBooks.length > 1 && levelBooks.every(candidate =>
    candidate.id === book?.id || Boolean(records[candidate.id]?.completed || records[candidate.id]?.completedAt)
  );
  return allDone ? { level: book.level, count: levelBooks.length } : null;
}
```

Call it directly after the existing completion/reread and daily-mission persistence succeeds; play the fanfare and set `levelUp` when it returns a milestone, otherwise show the named-teacher completion summary or close the reader exactly as the former handler did. Rename `shouldShowGuidedReadingScoreSummary` to `shouldShowGuidedReadingCompletionSummary`. Preserve teacher conference summaries and existing error handling. Remove `showQuiz`, `setShowQuiz`, `handleQuizFinish`, quiz render guards, `?quiz=1`, and all quiz imports. Update the preview route and stale AppSurface quiz-preservation comment.

- [ ] **Step 4: Remove generic child questions and quiz-derived consumers**

Remove the final-page question drawer and stop attaching `comprehensionQuestionSeeds` in `phonicsPageAnalyzer.js`. Remove `buildMeaningPrompts` only if `rg` proves it has no non-Guided-Reading consumer; otherwise retain the general helper but remove this surface's consumption. Remove the quiz-star projection and its explanatory comments from `childLibraryPolicy.js` and `StudentBooksPage.jsx`. Remove legacy quiz reads from report sections, workspace models, report views, and Excel exports without deleting raw record fields during storage merges.

- [ ] **Step 5: Delete quiz-only assets and remove build/gate hooks**

Delete the listed quiz files and all 206 JSON records. Remove the quiz generator from `prebuild`, the `check:validate:guided-reading-questions` script, the manual Vite quiz chunk, the Guided Reading question audit from the shared question-design gate, and exact-three-question CI/release assumptions. Retain all non-Guided-Reading question audits.

- [ ] **Step 6: Remove only quiz-specific CSS**

Use selectors and import references to remove BookQuiz, result-card, and quiz-star styling. Verify shared `ProgressStars`, speech helpers, game sound effects, and unrelated quiz/question styles remain referenced by their other surfaces.

- [ ] **Step 7: Run focused tests and smoke check GREEN**

Run:

```bash
node --test tests/unit/guidedReadingCompletionPolicy.test.js tests/unit/childLibraryPolicy.test.js tests/unit/reportSections.test.js tests/unit/studentReportingWorkspaceModel.test.js tests/unit/literacyExperiencePolicy.test.js
npx playwright test tests/smoke/guided-reading-reader.spec.js --project=desktop
rg -n "BookQuiz|guidedReadingQuizzes|quizScore|quizTotal|quizAt|Talk and write|Comprehension prompts" src tools tests package.json vite.config.js .github/workflows/ci.yml
```

Expected: focused tests and smoke pass; remaining quiz-field matches are storage compatibility or historical fixtures explicitly proven not to be runtime consumption.

- [ ] **Step 8: Commit**

```bash
git add src tests tools public/guided-reading/quizzes package.json vite.config.js .github/workflows/ci.yml
git commit -m "feat: retire guided reading quizzes"
```

---

### Task 2: Add full-catalogue reading metadata and split Level C

**Files:**
- Create: `src/data/guidedReadingBookMetadata.js`
- Create: `src/policy/guidedReadingCatalogPolicy.js`
- Create: `tests/unit/guidedReadingBookMetadata.test.js`
- Modify: `src/utils/guidedReading/normalizeReadableBook.js`
- Modify: `src/utils/guidedReading/runtimeBooks.js`
- Modify: `src/data/sourceOfTruthRegistry.js`
- Modify: `src/policy/childLibraryPolicy.js`
- Modify: `src/components/StudentBooksPage.jsx`
- Modify: `src/components/guided-reading/GuidedReadingPage.jsx`
- Modify: `src/components/guided-reading/ReadingSessionSetup.jsx`
- Modify: `src/components/guided-reading/ReadingSessionBar.jsx`
- Modify: `src/components/student-sessions/StudentSessionSetup.jsx`
- Modify: `src/components/admin/GuidedReadingReviewPanel.jsx`
- Modify: `src/components/teacher/teacherResourceShelf.js`
- Modify: `src/policy/guidedReadingMeasure.js`
- Modify: `src/content/storyContentPolicy.js`
- Modify: `src/utils/guidedReading/recommendBooksForStudent.js`
- Modify: `tests/unit/childLibraryPolicy.test.js`
- Modify: `tests/unit/guidedReadingMeasure.test.js`
- Modify: `tests/unit/guidedReadingRecommendations.test.js`
- Modify: `tests/release/guided-reading-measure.spec.js`
- Modify: `tests/release/guided-reading-control-hierarchy.spec.js`
- Modify: `tests/release/student-device-matrix.spec.js`
- Modify: `tests/release/student-emphasis-budget.spec.js`
- Modify: `tests/release/key-route-visuals.spec.js`

**Interfaces:**
- Consumes: `guidedReadingBooks`, current level/collection filters, learner-specific `independent`/`supported` decoding policy.
- Produces: `GUIDED_READING_READING_MODES`, `GUIDED_READING_BAND_PROFILES`, `GUIDED_READING_BOOK_METADATA`, `getGuidedReadingBookMetadata(bookOrId)`, `guidedReadingBandLabel(profile, level)`, `guidedReadingModeLabel(mode)`, and `splitLevelCBooks(books)`.

- [ ] **Step 1: Write failing catalogue-coverage and band tests**

```js
test("every runtime book has one valid editorial classification", () => {
  assert.deepEqual(
    new Set(Object.keys(GUIDED_READING_BOOK_METADATA)),
    new Set(guidedReadingBooks.map(book => book.id))
  );
  for (const book of guidedReadingBooks) {
    const metadata = getGuidedReadingBookMetadata(book.id);
    assert.ok(GUIDED_READING_BAND_PROFILES.includes(metadata.readingBandProfile));
    assert.ok(GUIDED_READING_READING_MODES.includes(metadata.readingMode));
  }
});

test("Moonwood is extended read-together and other current C books are standard", () => {
  for (const book of guidedReadingBooks.filter(book => book.id.startsWith("moonwood-tales-"))) {
    assert.deepEqual(getGuidedReadingBookMetadata(book.id), {
      readingBandProfile: "extended",
      readingMode: "supported-read-together"
    });
  }
});

test("the reviewed current catalogue has the exact honest mode split", () => {
  const rows = guidedReadingBooks.map(book => getGuidedReadingBookMetadata(book.id));
  assert.equal(rows.filter(row => row.readingBandProfile === "standard").length, 171);
  assert.equal(rows.filter(row => row.readingBandProfile === "extended").length, 35);
  assert.equal(rows.filter(row => row.readingMode === "predictable-levelled").length, 171);
  assert.equal(rows.filter(row => row.readingMode === "supported-read-together").length, 35);
  assert.equal(rows.filter(row => row.readingMode === "decodable").length, 0);
});
```

Add a test that any metadata row with `readingMode: "decodable"` corresponds to explicit full-text decoding evidence already present on that book; rows without that evidence must be `predictable-levelled` or `supported-read-together`.

- [ ] **Step 2: Run the new unit test and confirm RED**

Run:

```bash
node --test tests/unit/guidedReadingBookMetadata.test.js
```

Expected: module-not-found failure.

- [ ] **Step 3: Author the complete current-catalogue metadata authority**

Create a static, frozen map containing every current book ID. Use source evidence, not title inference. Required API:

```js
export const GUIDED_READING_BAND_PROFILES = Object.freeze(["standard", "extended"]);
export const GUIDED_READING_READING_MODES = Object.freeze([
  "decodable",
  "predictable-levelled",
  "supported-read-together"
]);

export function getGuidedReadingBookMetadata(bookOrId) {
  const id = typeof bookOrId === "string" ? bookOrId : bookOrId?.id;
  return GUIDED_READING_BOOK_METADATA[id] || null;
}
```

Author the reviewed current split exactly: 171 non-Moonwood books are `standard` + `predictable-levelled`; all 35 `moonwood-tales-c-*` books are `extended` + `supported-read-together`; zero current books are `decodable` because no current source supplies full-text decoding-scope evidence. The existing C Standard set is the ten `ab-c-*` books plus the ten `level-c-nonfiction-*` books. Runtime level overrides must never mutate the immutable editorial profile.

- [ ] **Step 4: Preserve metadata through normalization and runtime aggregation**

Attach the metadata before normalization or copy it explicitly in `normalizeReadableBook`:

```js
readingBandProfile: book.readingBandProfile || metadata?.readingBandProfile || "",
readingMode: book.readingMode || metadata?.readingMode || ""
```

Register the authoring source in `sourceOfTruthRegistry.js`. Fail closed during tests for missing metadata; do not silently infer a production default.

- [ ] **Step 5: Add policy labels, C grouping, and band-aware progression**

Implement:

```js
export function splitLevelCBooks(books = []) {
  const levelC = books.filter(book => book.level === "C");
  return {
    standard: levelC.filter(book => book.readingBandProfile === "standard"),
    extended: levelC.filter(book => book.readingBandProfile === "extended")
  };
}
```

Use shared label helpers so teacher surfaces show `Decodable`, `Predictable / Levelled`, or `Supported Read-Together`. Child cards use brief friendly copy plus the existing learner-specific independent/support decision. Add `Willow Street Readers` to `BOOK_COLLECTIONS` now so Task 4 records have a stable destination.

Make Level C completion count standard-band books only. Extended completions remain stored and visible but never block standard advancement.

- [ ] **Step 6: Add C Standard and C Extended reader measures**

Extend `guidedReadingMeasure.js` and `storyContentPolicy.js` with explicit `C_STANDARD` and `C_EXTENDED` profiles. Standard retains the compact stable-print measure. Extended preserves Moonwood's longer read-together layout without pretending it meets compact-page rules. If `GuidedReadingPage.jsx` has a local interaction state named `readingMode`, rename it to `readerInteractionMode` before consuming the book's editorial `readingMode`.

- [ ] **Step 7: Run unit and browser tests GREEN**

Run:

```bash
node --test tests/unit/guidedReadingBookMetadata.test.js tests/unit/childLibraryPolicy.test.js tests/unit/guidedReadingMeasure.test.js tests/unit/guidedReadingRecommendations.test.js
npx playwright test tests/release/guided-reading-measure.spec.js tests/release/guided-reading-control-hierarchy.spec.js tests/release/student-device-matrix.spec.js tests/release/student-emphasis-budget.spec.js tests/release/key-route-visuals.spec.js --project=desktop
```

Expected: all pass with Level C snapshots/expectations covering both bands.

- [ ] **Step 8: Commit**

```bash
git add src/data/guidedReadingBookMetadata.js src/policy/guidedReadingCatalogPolicy.js src tests
git commit -m "feat: split guided reading level C bands"
```

---

### Task 3: Add curated teacher-only discussion prompts for the current catalogue

**Files:**
- Create: `src/data/guidedReadingDiscussionPrompts.js`
- Create: `src/components/guided-reading/BookDiscussionPanel.jsx`
- Create: `tools/checkGuidedReadingDiscussionPrompts.mjs`
- Create: `tests/unit/guidedReadingDiscussionPrompts.test.js`
- Modify: `src/components/guided-reading/GuidedReadingPage.jsx`
- Modify: `src/utils/guidedReading/normalizeReadableBook.js`
- Modify: `src/data/sourceOfTruthRegistry.js`
- Modify: `src/App.css`
- Modify: `package.json`
- Modify: `tests/release/guided-reading-control-hierarchy.spec.js`
- Modify: `tests/release/guided-reading-decoding-support.spec.js`

**Interfaces:**
- Consumes: final current-catalogue titles, reading-page text, image/page numbers, and the editorial metadata from Task 2.
- Produces: `GUIDED_READING_DISCUSSION_PROMPTS`, `getGuidedReadingDiscussion(bookOrId)`, and `<BookDiscussionPanel discussion={record} onGoToPage={fn} />` mounted only in teacher, whole-class teacher-led, and admin context.

- [ ] **Step 1: Write failing full-coverage, specificity, and privacy tests**

```js
test("every current runtime book has one oral and one valid visual prompt", () => {
  assert.deepEqual(
    new Set(Object.keys(GUIDED_READING_DISCUSSION_PROMPTS)),
    new Set(guidedReadingBooks.map(book => book.id))
  );
  for (const book of guidedReadingBooks) {
    const discussion = getGuidedReadingDiscussion(book.id);
    assert.match(discussion.oral.prompt, /\S/);
    assert.match(discussion.oral.listenFor, /\S/);
    assert.ok(book.pages.some(page => page.pageNumber === discussion.visual.page));
    assert.match(discussion.visual.prompt, /\S/);
    assert.match(discussion.visual.lookFor, /\S/);
  }
});
```

Add duplicate-rate tests that reject one generic sentence repeated across a family, reject empty answer cues, reject visual prompts whose named evidence is absent from that page's final text/image brief, and reject quiz fields/options/answers/scores in the schema.

Add browser assertions that teacher context renders the selected book's prompt after opening `Discuss this book`, while student context contains neither prompt string in the DOM.

- [ ] **Step 2: Run new tests and confirm RED**

Run:

```bash
node --test tests/unit/guidedReadingDiscussionPrompts.test.js
npx playwright test tests/release/guided-reading-control-hierarchy.spec.js --project=desktop
```

Expected: missing module and missing panel failures.

- [ ] **Step 3: Author one static discussion record for every current book**

Read each book's final pages and write a concise book-specific record. Do not generate a three-question template or derive prompts at runtime. Use this exact frozen record shape:

```js
"book-id": Object.freeze({
  oral: Object.freeze({
    prompt: "What changed after the character tried the second plan?",
    listenFor: "The child names the second action and its result."
  }),
  visual: Object.freeze({
    page: 4,
    prompt: "What in this picture shows that the weather changed?",
    lookFor: "The child points to the bent trees and moving picnic cloth."
  })
})
```

The example wording illustrates the schema only; every stored prompt must name evidence that is actually present in its own book and visual page.

- [ ] **Step 4: Implement the teacher-only panel**

`BookDiscussionPanel.jsx` renders a collapsed `<details>` labelled `Discuss this book`, two numbered teacher moves, private `Listen for`/`Look for` notes, and a button for the visual page. It accepts no student ID and performs no writes:

```jsx
export default function BookDiscussionPanel({ discussion, onGoToPage }) {
  if (!discussion) return null;
  return (
    <details className="guided-reading-discussion">
      <summary>Discuss this book</summary>
      <p><strong>Ask aloud:</strong> {discussion.oral.prompt}</p>
      <p className="teacher-note"><strong>Listen for:</strong> {discussion.oral.listenFor}</p>
      <button type="button" onClick={() => onGoToPage(discussion.visual.page)}>
        Look again at page {discussion.visual.page}
      </button>
      <p><strong>Ask about the picture:</strong> {discussion.visual.prompt}</p>
      <p className="teacher-note"><strong>Look for:</strong> {discussion.visual.lookFor}</p>
    </details>
  );
}
```

Mount only for teacher, whole-class teacher-led, and admin modes. Keep student prompt data out of rendered markup. Add `check:guided-reading-discussion-prompts` to `package.json` and make the tool fail for missing/orphan IDs, invalid pages/art, empty fields, or assessment-like score/answer/choice keys.

- [ ] **Step 5: Run focused tests GREEN**

Run:

```bash
node --test tests/unit/guidedReadingDiscussionPrompts.test.js
npx playwright test tests/release/guided-reading-control-hierarchy.spec.js tests/release/guided-reading-decoding-support.spec.js --project=desktop
```

Expected: all current books covered; teacher panel works; child privacy assertion passes.

- [ ] **Step 6: Commit**

```bash
git add src/data/guidedReadingDiscussionPrompts.js src/components/guided-reading/BookDiscussionPanel.jsx src/components/guided-reading/GuidedReadingPage.jsx src/utils/guidedReading/normalizeReadableBook.js src/data/sourceOfTruthRegistry.js src/App.css tests
git commit -m "feat: add teacher guided reading discussions"
```

---

### Task 4: Author the complete Willow Street Readers manuscripts

**Files:**
- Create: `src/data/guidedReadingBridgeBooks.js`
- Create: `src/data/guidedReadingBridgeBooks.manifest.js`
- Create: `docs/guided-reading/WILLOW_STREET_CONTENT_BIBLE.md`
- Create: `docs/guided-reading/WILLOW_STREET_VISUAL_CONTINUITY.md`
- Create: `tests/unit/guidedReadingBridgeBooks.test.js`
- Modify: `src/data/guidedReadingBooks.js`
- Modify: `src/data/guidedReadingBookMetadata.js`
- Modify: `src/data/guidedReadingDiscussionPrompts.js`
- Modify: `src/policy/childLibraryPolicy.js`
- Modify: `src/policy/freeTierContent.js`
- Modify: `src/data/sourceOfTruthRegistry.js`
- Modify: `tools/auditGuidedReadingContent.js`
- Modify: `tools/checkGuidedReadingStoryBible.mjs`
- Modify: `tools/checkStoryContentPolicy.mjs`
- Modify: `tests/unit/guidedReadingBookMetadata.test.js`
- Modify: `tests/unit/guidedReadingDiscussionPrompts.test.js`
- Modify: `tests/unit/freeTierContent.test.js`

**Interfaces:**
- Consumes: the existing book/page record schema, metadata/discussion APIs from Tasks 2–3, and current Story Bible review fields.
- Produces: `GUIDED_READING_BRIDGE_BOOKS` with exactly 20 final manuscripts; `WILLOW_STREET_BOOK_MANIFEST` with stable IDs, genres, visual treatment, cast, page count, and media directory.

- [ ] **Step 1: Write failing collection-contract tests**

```js
test("Willow Street has the approved 20-title genre mix", () => {
  assert.equal(GUIDED_READING_BRIDGE_BOOKS.length, 20);
  const genreCounts = GUIDED_READING_BRIDGE_BOOKS.reduce((counts, book) => ({
    ...counts,
    [book.bridgeGenre]: (counts[book.bridgeGenre] || 0) + 1
  }), {});
  assert.deepEqual(genreCounts, {
    "everyday-fiction": 6,
    "culture-community": 4,
    procedure: 4,
    "photorealistic-nonfiction": 6
  });
});

test("each bridge manuscript keeps compact stable print", () => {
  for (const book of GUIDED_READING_BRIDGE_BOOKS) {
    assert.equal(book.level, "C");
    assert.equal(book.pages.length, 8);
    for (const page of book.pages) {
      const words = page.text.trim().split(/\s+/u);
      assert.ok(words.length >= 6 && words.length <= 12, `${book.id} page ${page.pageNumber}`);
    }
  }
});
```

Also assert exact approved titles, unique IDs/media paths, safe procedure order, final punctuation, no question pages, no external crosswalk terms, no quiz fields, and no prohibited topic/political copy.

- [ ] **Step 2: Run the new tests and confirm RED**

Run:

```bash
node --test tests/unit/guidedReadingBridgeBooks.test.js
```

Expected: missing modules.

- [ ] **Step 3: Freeze the cast, setting, and content rules**

Write the content and visual continuity documents with concrete recurring details: child ages/proportions, hair/skin/clothing palette, family associations, Willow Street library/garden/kitchen/park landmarks, prop continuity, safe adult-supervision cues, illustration palette, photorealistic nonfiction camera/lighting rules, and per-title factual sources. These documents are authoring authorities, not product copy.

- [ ] **Step 4: Author all 20 final manuscripts and page briefs**

Give every record final text, exactly eight reading pages, an exact page-specific visual brief, stable `pageNumber`, `image`, and `audio` paths, Story Bible review evidence, `bridgeGenre`, `collection: "Willow Street Readers"`, and `visualTreatment`. Set legacy `type: "fiction"` on the ten everyday/culture books and `type: "nonfiction"` on the four procedures plus six factual books.

Use IDs and paths in this form:

```js
{
  id: "willow-street-the-lunchbox-mix-up",
  title: "The Lunchbox Mix-Up",
  level: "C",
  collection: "Willow Street Readers",
  bridgeGenre: "everyday-fiction",
  visualTreatment: "willow-street-illustrated",
  pages: [{
    pageNumber: 1,
    text: "Maya opens her lunchbox and finds Samir's blue cup.",
    pageAudioText: "Maya opens her lunchbox and finds Samir's blue cup.",
    image: "/guided-reading/willow-street/the-lunchbox-mix-up/page-01.webp",
    imageBrief: "Maya at the lunch table opening a lunchbox; Samir's blue cup is clearly visible."
  }]
}
```

The shown first-page record fixes the interface and path pattern. Finish every book with exactly eight genuinely book-specific pages; do not copy the example sentence into another title.

- [ ] **Step 5: Add metadata and two discussion prompts per new book**

Add all 20 IDs to the full-catalogue authorities as `standard` + `predictable-levelled`, unless an explicit full-text phonics evidence record justifies `decodable`. Author one oral and one visual teacher prompt for each final manuscript using the Task 3 schema.

- [ ] **Step 6: Generalise profile-aware content gates**

Replace hard-coded Level C/Moonwood exceptions in Story Bible and content policy checks with `readingBandProfile`. Standard bridge books must meet compact page/word-load rules; extended books must meet the extended read-together profile. Preserve stricter existing A/B rules.

- [ ] **Step 7: Run content tests and gates GREEN**

Run:

```bash
node --test tests/unit/guidedReadingBridgeBooks.test.js tests/unit/guidedReadingBookMetadata.test.js tests/unit/guidedReadingDiscussionPrompts.test.js tests/unit/freeTierContent.test.js
npm run check:validate:guided-reading
npm run check:guided-reading-story-bible
npm run check:story-content-policy
```

Expected: 226 runtime books; exact metadata/discussion coverage; all 20 manuscripts meet their profile.

- [ ] **Step 8: Commit**

```bash
git add src/data/guidedReadingBridgeBooks.js src/data/guidedReadingBridgeBooks.manifest.js src/data/guidedReadingBooks.js src/data/guidedReadingBookMetadata.js src/data/guidedReadingDiscussionPrompts.js src/policy src/data/sourceOfTruthRegistry.js tools tests docs/guided-reading/WILLOW_STREET_CONTENT_BIBLE.md docs/guided-reading/WILLOW_STREET_VISUAL_CONTINUITY.md
git commit -m "feat: author Willow Street Readers"
```

---

### Task 5: Create and install the 14-book recurring-cast illustrated media set

**Files:**
- Create: `public/guided-reading/willow-street/<14-illustrated-title-slugs>/cover.webp`
- Create: `public/guided-reading/willow-street/<14-illustrated-title-slugs>/page-01.webp` through each final reading page
- Create: `docs/guided-reading/willow-street-illustrated-media-manifest.json`
- Create: `tests/unit/guidedReadingBridgeMedia.test.js`
- Modify: `src/data/guidedReadingBridgeBooks.js` only if a generated asset reveals a manuscript/art mismatch that must be resolved before approval

**Interfaces:**
- Consumes: final Task 4 image briefs and `WILLOW_STREET_VISUAL_CONTINUITY.md`.
- Produces: 126 unique text-free images (14 covers plus 112 reading pages), plus a manifest binding path, SHA-256, dimensions, visual treatment, book ID, and page number.

- [ ] **Step 1: Write the failing illustrated-media inventory test**

```js
import { access } from "node:fs/promises";
import { resolve } from "node:path";

test("every illustrated bridge page resolves to a unique reviewed-sized asset", async () => {
  const illustrated = GUIDED_READING_BRIDGE_BOOKS.filter(
    book => book.visualTreatment === "willow-street-illustrated"
  );
  assert.equal(illustrated.length, 14);
  const paths = illustrated.flatMap(book => [book.coverImage, ...book.pages.map(page => page.image)]);
  assert.equal(paths.length, 126);
  assert.equal(new Set(paths).size, paths.length);
  for (const path of paths) {
    await access(resolve("public", path.replace(/^\//, "")));
  }
});
```

- [ ] **Step 2: Run the media test and confirm RED**

Run:

```bash
node --test tests/unit/guidedReadingBridgeMedia.test.js
```

Expected: missing image failures.

- [ ] **Step 3: Generate a locked cast reference before story pages**

Use the image-generation skill to create one neutral, text-free cast/location reference consistent with the Task 4 continuity document. Inspect it directly. If any character design, hands, proportions, clothing, or required landmark is defective, regenerate before page work. Store the approved reference under the collection directory and cite its hash in the illustrated media manifest; do not expose it as a reading page.

- [ ] **Step 4: Generate and inspect the 14 complete book sequences**

For each of the six everyday-fiction, four culture/community, and four procedure titles, generate the cover and every page from the exact final brief. Use the approved cast reference, preserve clothing/prop/location continuity within the book, keep a safe text area, render no letters/labels/logos, and use the same warm editorial illustration language. Inspect every output at original detail before moving to the next page; regenerate defects rather than recording caveats.

- [ ] **Step 5: Convert/install without changing visual content**

Use lossless or high-quality WebP conversion at the existing Guided Reading dimensions and path pattern. Record each installed path, SHA-256, pixel dimensions, book/page identity, prompt fingerprint, and direct-review state in `willow-street-illustrated-media-manifest.json`.

- [ ] **Step 6: Run inventory, image-text alignment, and title-page gates GREEN**

Run:

```bash
node --test tests/unit/guidedReadingBridgeMedia.test.js
node tools/checkGuidedReadingImageTextAlignment.js
node tools/checkGuidedReadingTitlePages.js
```

Expected: all 14 covers and all illustrated reading pages resolve uniquely and align with final page briefs.

- [ ] **Step 7: Commit**

```bash
git add public/guided-reading/willow-street docs/guided-reading/willow-street-illustrated-media-manifest.json tests/unit/guidedReadingBridgeMedia.test.js src/data/guidedReadingBridgeBooks.js
git commit -m "feat: add Willow Street illustrated media"
```

---

### Task 6: Create and install the six-book photorealistic nonfiction media set

**Files:**
- Create: `public/guided-reading/willow-street/<6-nonfiction-title-slugs>/cover.webp`
- Create: `public/guided-reading/willow-street/<6-nonfiction-title-slugs>/page-01.webp` through each final reading page
- Create: `docs/guided-reading/willow-street-photoreal-media-manifest.json`
- Modify: `tests/unit/guidedReadingBridgeMedia.test.js`
- Modify: `src/data/guidedReadingBridgeBooks.js` only if direct factual/visual review requires a final text correction before audio generation

**Interfaces:**
- Consumes: six final nonfiction manuscripts and image briefs from Task 4.
- Produces: 54 unique newly created photorealistic images (6 covers plus 48 reading pages), plus the same identity/hash/dimension/review manifest contract as Task 5.

- [ ] **Step 1: Extend the failing media test for six photorealistic books**

```js
test("the six nonfiction books use self-created photorealistic assets", async () => {
  const nonfiction = GUIDED_READING_BRIDGE_BOOKS.filter(
    book => book.visualTreatment === "self-created-photorealistic"
  );
  assert.equal(nonfiction.length, 6);
  assert.equal(nonfiction.flatMap(book => [book.coverImage, ...book.pages]).length, 54);
  for (const book of nonfiction) {
    assert.equal(book.mediaLicense, "self-created");
    for (const page of book.pages) {
      await access(resolve("public", page.image.replace(/^\//, "")));
    }
  }
});
```

- [ ] **Step 2: Run the media test and confirm RED**

Run:

```bash
node --test tests/unit/guidedReadingBridgeMedia.test.js
```

Expected: missing nonfiction assets and/or metadata.

- [ ] **Step 3: Generate and directly inspect all six sequences**

Use the image-generation skill to create each cover and page as original photorealistic content. Apply these title-specific checks:

- `From Wheat to Bread`: botanically plausible wheat and correct milling/dough/baking sequence.
- `Where Rainwater Goes`: visible drainage path without unsafe flood imagery or false underground claims.
- `Inside a Fire Station`: realistic equipment and child-safe station routines; no emergency victim scene.
- `How Paper Is Recycled`: mechanically plausible sorting, pulping, rolling, and drying stages.
- `A Snail Comes Out at Night`: anatomically plausible land snail, correct tentacles/body, moist nocturnal habitat.
- `How a Book Is Made`: correct editing, printing, folding/binding, trimming, and finished-book sequence.

Reject brand marks, misshapen tools/animals, impossible machinery, fabricated labels, dramatic stock-photo clichés, and any image that does not answer its exact page brief.

- [ ] **Step 4: Install and fingerprint final assets**

Convert and install at the same dimensions and path pattern as Task 5. Record each asset's `mediaLicense: "self-created"`, SHA-256, dimensions, final brief fingerprint, and direct-review state in `willow-street-photoreal-media-manifest.json`.

- [ ] **Step 5: Run media and factual gates GREEN**

Run:

```bash
node --test tests/unit/guidedReadingBridgeMedia.test.js tests/unit/guidedReadingBridgeBooks.test.js
node tools/checkGuidedReadingImageTextAlignment.js
node tools/checkGuidedReadingTitlePages.js
npm run check:guided-reading-story-bible
```

Expected: six complete photorealistic sequences pass asset, alignment, and content contracts.

- [ ] **Step 6: Commit**

```bash
git add public/guided-reading/willow-street docs/guided-reading/willow-street-photoreal-media-manifest.json tests/unit/guidedReadingBridgeMedia.test.js src/data/guidedReadingBridgeBooks.js
git commit -m "feat: add Willow Street nonfiction media"
```

---

### Task 7: Generate exact-current-text audio and provenance for Willow Street

**Files:**
- Create: hashed page narration files under `public/audio/production/en-US/guided_page/`
- Create: hashed exact word-audio files under `public/audio/production/en-US/isolated_word/`
- Modify (generated): `src/data/generated/guidedReadingLedaGaps.generated.js`
- Modify (generated): `src/data/generated/guidedReadingNarrationClearance.generated.js`
- Modify (generated): `src/data/generated/guidedReadingNarrationProvenance.generated.js`
- Modify (generated): `src/data/generated/audioGuidedReadingPaths.generated.js`
- Modify: `tests/unit/guidedReadingLedaAudioCoverage.test.js`
- Modify: `tests/unit/guidedReadingNarrationProvenance.test.js`
- Modify: `tools/guidedReadingAudioPipelineLib.mjs` only if the new collection reveals a general path bug

**Interfaces:**
- Consumes: frozen Task 4 manuscript and installed final page order.
- Produces: page narration and supported word audio whose corpus/provenance fingerprint matches every final Willow Street page.

- [ ] **Step 1: Add failing exact coverage assertions**

```js
test("every Willow Street page has exact-current narration provenance", () => {
  const audit = auditGuidedReadingNarrationProvenance();
  assert.equal(audit.failures.some(item => item.bookId.startsWith("willow-street-")), false);
  assert.equal(audit.wordSequenceMismatchCount, 0);
  assert.equal(audit.missingAudioCount, 0);
  assert.equal(audit.unknownProvenanceCount, 0);
});
```

- [ ] **Step 2: Run audio tests and confirm RED**

Run:

```bash
node --test tests/unit/guidedReadingLedaAudioCoverage.test.js tests/unit/guidedReadingNarrationProvenance.test.js
```

Expected: missing Willow Street narration/provenance.

- [ ] **Step 3: Generate gaps from the frozen manuscript**

Run the existing authoring tools in their required order:

```bash
node tools/generateGuidedReadingLedaGaps.mjs
node tools/refreshGuidedReadingNarrationClearance.mjs --write
node tools/checkGuidedReadingNarrationProvenance.mjs --refresh
node tools/generateAudioManifest.js
```

If credentials or the voice service are unavailable, record the exact blocker rather than substituting browser speech or fabricated files. Do not modify generated indexes by hand.

- [ ] **Step 4: Verify files, corpus text, and audibility mechanically**

Run:

```bash
node --test tests/unit/guidedReadingLedaAudioCoverage.test.js tests/unit/guidedReadingNarrationProvenance.test.js
npm run check:guided-reading-human-voice
node tools/checkGuidedReadingAudioPipelineHardening.mjs
```

Expected: no missing, stale, zero-byte, implausibly short, wrong-format, or fingerprint-mismatched audio.

- [ ] **Step 5: Complete direct listening review where the environment supports it**

Listen to every new page narration in reading order and sample every newly introduced word asset. Record mispronunciations, truncation, wrong text, repeated audio, pacing, and noise against the exact path; regenerate every failure. If direct human listening cannot be performed by the executing environment, leave the human-listening gate explicitly open and do not relabel automated checks as listening.

- [ ] **Step 6: Commit**

```bash
git add public/audio/production/en-US/guided_page public/audio/production/en-US/isolated_word src/data/generated tests/unit/guidedReadingLedaAudioCoverage.test.js tests/unit/guidedReadingNarrationProvenance.test.js tools/guidedReadingAudioPipelineLib.mjs
git commit -m "feat: add Willow Street narration"
```

---

### Task 8: Update catalogue facts, release gates, and live documentation

**Files:**
- Modify: `src/data/productCatalogFacts.js`
- Modify: `tests/unit/productCatalogFacts.test.js`
- Modify: `src/policy/freeTierContent.js`
- Modify: `docs/product/FREE_TIER_SPEC.md`
- Modify: `tools/checkGuidedReadingVisibility.js`
- Modify: `tools/checkGuidedReadingExperience.js`
- Modify: `tools/checkGuidedReadingImageTextAlignment.js`
- Modify: `tools/checkGuidedReadingTitlePages.js`
- Modify: `tools/checkGuidedReadingStoryBible.mjs`
- Delete or retire: `tools/checkMoonwoodExpandedManuscript.mjs` if profile-aware coverage makes it redundant
- Modify: `tools/checkStoryContentPolicy.mjs`
- Modify: `tools/verifyDatabasePoliciesLive.mjs`
- Modify: `docs/guided-reading/INDEX.md`
- Modify: `docs/guided-reading/guided_reading_story_bible_content_audit_2026-08-01.md`
- Modify: `docs/research/EXPERT_REVIEW_PROTOCOL.md`
- Modify: `docs/instructional/instructional_standards.md`
- Modify: `docs/content/STORY_CONTENT_AUTHORING_TEMPLATE.md`
- Modify: `docs/content/STORY_BIBLE_PART_1_WRITING.md`
- Modify: `docs/content/QUESTION_DESIGN_BIBLE.md`
- Modify: `src/data/generated/guidedReadingBookIndex.generated.js`

**Interfaces:**
- Consumes: final 226-book runtime, metadata, prompts, media, and audio.
- Produces: current derived catalogue facts and gates with no exact-three-question or exact-206 assumptions; live docs that describe direct completion, C bands, and teacher-only discussion.

- [ ] **Step 1: Write failing current-fact and gate tests**

Update `productCatalogFacts.test.js` to derive and assert:

```js
assert.equal(PRODUCT_CATALOG_FACTS.guidedReadingBooks, guidedReadingBooks.length);
assert.equal(PRODUCT_CATALOG_FACTS.guidedReadingBooks, 226);
assert.equal(PRODUCT_CATALOG_FACTS.guidedReadingQuizzes, undefined);
assert.equal(
  guidedReadingBooks.filter(book => book.collection === "Willow Street Readers").length,
  20
);
```

Add source scans that reject stale live statements that every book has three quiz questions or that the catalogue contains exactly 206 current books.

- [ ] **Step 2: Run focused tests/gates and confirm RED**

Run:

```bash
node --test tests/unit/productCatalogFacts.test.js
node tools/checkGuidedReadingVisibility.js
node tools/checkGuidedReadingExperience.js
```

Expected: stale counts/question assumptions fail.

- [ ] **Step 3: Generalise gates and refresh generated book index**

Make current counts derive from the imported catalogue. Keep historical migrations untouched. Update database-policy verification to test publication semantics rather than a frozen 206-row assertion. Delete the Moonwood-only expanded-manuscript gate only after its checks are represented in the band-profile gate.

Run the canonical generator:

```bash
node tools/generateBookIndex.js
```

- [ ] **Step 4: Update live documentation and retire stale quiz authority**

Describe scored Guided Reading quizzes as retired, completion as non-comprehension evidence, and discussion prompts as optional teacher-led support. Link the three new content authorities, Willow Street content/visual bibles, and current gates from `docs/guided-reading/INDEX.md`. Remove stale product promises and question-template instructions while retaining unrelated assessment-question standards.

- [ ] **Step 5: Run focused gates GREEN**

Run:

```bash
node --test tests/unit/productCatalogFacts.test.js
node tools/checkGuidedReadingVisibility.js
node tools/checkGuidedReadingExperience.js
node tools/checkGuidedReadingImageTextAlignment.js
node tools/checkGuidedReadingTitlePages.js
npm run check:question-design-policy
```

Expected: gates derive the 226-book current state and contain no Guided Reading quiz assumptions.

- [ ] **Step 6: Commit**

```bash
git add src tests tools docs package.json .github/workflows/ci.yml
git commit -m "docs: align guided reading release authority"
```

---

### Task 9: Verify the complete experience, review every new page, and clean up

**Files:**
- Create or update: `docs/guided-reading/willow-street-visual-review.json`
- Modify: existing app visual-review authority only through its canonical review recorder
- Modify: `tests/release/guided-reading-control-hierarchy.spec.js`
- Modify: `tests/release/guided-reading-measure.spec.js`
- Modify: `tests/release/student-device-matrix.spec.js`
- Modify: `tests/release/key-route-visuals.spec.js`
- Modify: `tests/release/student-emphasis-budget.spec.js`
- Modify: `tests/smoke/guided-reading-reader.spec.js`

**Interfaces:**
- Consumes: the complete branch after Tasks 1–8.
- Produces: direct visual-review evidence, end-to-end browser evidence for child/teacher flows and both C bands, a clean repository, and final verification results.

- [ ] **Step 1: Add final end-to-end acceptance assertions**

The browser suites must prove:

```js
await expect(page.getByRole("heading", { name: "C Standard" })).toBeVisible();
await expect(page.getByRole("heading", { name: "C Extended / Read Together" })).toBeVisible();
await expect(page.getByText("Willow Street Readers")).toBeVisible();
await expect(page.getByText(/quiz|talk and write/i)).toHaveCount(0);
```

They must also complete a standard book, verify persisted completion and mission return, exercise standard level-up without completing Moonwood, open a teacher discussion panel, navigate to its visual page, and prove the same prompt is absent in student mode.

- [ ] **Step 2: Run browser matrix and confirm/fix failures**

Run:

```bash
npx playwright test tests/smoke/guided-reading-reader.spec.js --project=desktop
npx playwright test tests/release/guided-reading-control-hierarchy.spec.js tests/release/guided-reading-measure.spec.js tests/release/student-device-matrix.spec.js tests/release/key-route-visuals.spec.js tests/release/student-emphasis-budget.spec.js --project=desktop
```

Exercise desktop, short-height, and tablet viewports represented by these suites. Any snapshot update requires inspecting the new image, not merely accepting it.

- [ ] **Step 3: Directly review every Willow Street page in runtime**

Open each of the 20 books in reading order and inspect cover, title page, every reading page, final-page completion, text fit, artwork, recurring-cast continuity, factual/procedural accuracy, page order, image/text match, discussion visual-page match, and both C shelf contexts. Record one row per asset in `willow-street-visual-review.json` with reviewer, timestamp, viewport, hash, and disposition. Regenerate or correct every rejected page before recording approval.

- [ ] **Step 4: Run the full scoped and repository verification set**

Run:

```bash
npm test
npm run lint
npm run build
npm run check:validate:guided-reading
npm run check:guided-reading-story-bible
npm run check:guided-reading-writing-evidence
npm run check:guided-reading-human-voice
npm run check:guided-reading-visual-alignment
npm run check:guided-reading-measure
npm run check:guided-reading-control-hierarchy
npm run check:question-design-policy
npm run check:app-visual-review
npm run check:repo-hygiene
```

Expected: all automated gates pass. Report direct human listening and physical-device status separately from these commands.

- [ ] **Step 5: Run cleanup and forbidden-reference scans**

Remove temporary generation files, rejected outputs, obsolete caches created by this task, and superseded quiz artifacts after confirming they are not referenced. Then run:

```bash
git status --short
git diff --check
rg -n "BookQuiz|guidedReadingQuizzes|Talk and write|Comprehension prompts|exactly three questions|quizScore|quizTotal|quizAt" src tools tests docs package.json vite.config.js .github/workflows/ci.yml
rg -ni "reading a-z|raz kids|raz-plus|raz level" src public docs package.json
```

Expected: no unaccounted generated debris, no live Guided Reading quiz/question UI, no runtime quiz-field consumption, and no outside-programme crosswalk copy. Historical compatibility comments/fixtures, if any, must be explicitly identified and non-consuming.

- [ ] **Step 6: Commit final evidence and cleanup**

```bash
git add docs/guided-reading/willow-street-visual-review.json tests public src tools package.json
git commit -m "test: verify guided reading band release"
```
