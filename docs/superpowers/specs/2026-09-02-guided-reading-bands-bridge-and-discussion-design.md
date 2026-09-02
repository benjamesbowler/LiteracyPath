# Guided Reading Bands, Willow Street Readers, and Teacher Discussion Design

**Date:** 2026-09-02  
**Status:** Approved for implementation  
**Surface:** Guided Reading child shelf, reader, teacher preview, reporting, content authority, and release gates

## Outcome

Guided Reading will stop treating a single letter as a claim about text difficulty, decoding control, and independence. The catalogue will keep its familiar A, B, and C levels while adding explicit reading-mode labels and splitting Level C into two honest shelves:

- **C Standard** for compact levelled books, including the new 20-book Willow Street Readers collection.
- **C Extended / Read Together** for longer, language-richer Moonwood books that require adult support.

All scored child comprehension quizzes and generic post-book question drawers will be removed. Finishing a book will save completion immediately and return the child to the appropriate success or shelf flow. Each book will instead have two optional, book-specific prompts visible only to a teacher: one oral prompt and one image-grounded visual prompt, each with a private listen/look-for note. These prompts are discussion support, not scored assessment evidence.

The new Willow Street Readers collection will add 20 Level C Standard books with stable print, meaningful repetition, 8–10 reading pages, and roughly 6–12 words on each reading page. It will retain a recurring cast, coherent stories, culturally grounded everyday experiences, accurate procedures, and accurate nonfiction. Six nonfiction titles will use newly created photorealistic imagery; the remaining books will use a consistent illustrated world and cast.

No product copy, metadata shown to users, or release messaging will name or imply a crosswalk to an outside reading programme.

## Product principles

1. **Letters describe an internal progression, not a universal equivalence.** The existing A/B/C navigation remains familiar, but the band and reading-mode labels make the support expectation explicit.
2. **Instruction may sit in the learner's proximal development.** A teacher may intentionally select a book above the learner's independent reading range. The product must explain the support mode rather than falsely relabel the text.
3. **Decodable is an evidence claim.** A book receives the Decodable label only when its full running text has an explicit taught-code scope and every exception is governed by the current decoding policy. Repetition or short sentences alone are not enough.
4. **Completion is not comprehension evidence.** Reading a final page proves completion only. Optional conversation prompts produce no score, mastery claim, star, or report conclusion.
5. **Prompts are teacher-led.** Children never see a quiz, prompt requirement, score, result, or discussion badge in their own completion flow.
6. **New media is exact-current-text media.** Page art, narration, word support, page order, and provenance bind to the final manuscript. A generated file's existence is not visual or listening approval.

## Catalogue model

Every runtime book will expose two editorial fields in addition to its existing `level`:

```js
{
  readingBandProfile: "standard" | "extended",
  readingMode: "decodable" | "predictable-levelled" | "supported-read-together"
}
```

The fields are authored in a single full-catalogue metadata source keyed by book ID. A release test fails for a missing book, an orphaned metadata row, or an unknown enum value.

### Band rules

- Existing Level A and Level B books use `standard`.
- Existing compact Level C books use `standard`.
- All Moonwood books use `extended` and appear under **C Extended / Read Together**.
- All 20 Willow Street Readers use `standard` and appear under **C Standard**.
- `readingBandProfile` is not a replacement for `level`; it only changes the Level C shelf grouping, measure policy, and support copy.

### Reading-mode rules

- `decodable`: reserved for books whose complete text passes the current explicit phonics-scope evidence gate.
- `predictable-levelled`: short levelled texts supported by stable print, controlled load, repetition, illustration, and familiar language, without claiming complete phonics-code control.
- `supported-read-together`: longer or linguistically richer texts intentionally designed for adult-supported reading.

The teacher catalogue and teacher reader show the exact editorial label. Child cards use friendly phrases derived from these values and the learner's confirmed phonics placement. The existing learner-specific independent/supported policy remains separate: it may say that a predictable book is currently a supported choice for one learner without changing the book's editorial reading mode.

## Level C shelf and navigation

Level C will render two named sections:

1. **C Standard**
2. **C Extended / Read Together**

The split applies in child, teacher-preview, and admin-review catalogues wherever Level C books are grouped. C Standard appears first. Moonwood must never be displayed as an externally equivalent compact Level C text.

Level completion is band-aware. A child can complete the C Standard sequence without being required to complete all extended read-together books. Extended books remain available as teacher-selected enrichment and retain their own completion history, but do not silently block standard progression.

## Child end-of-book flow

The final-page action remains a real saved completion action.

On activation:

1. Persist book completion and reread state using the existing progress path.
2. Credit any applicable daily mission.
3. Do not write `quizScore`, `quizTotal`, `quizAt`, or replacement comprehension fields.
4. If standard-band completion triggers the current level-up policy, show the existing level-completion success flow.
5. Otherwise close the reader and return to the originating shelf or deferred mission destination.

The old scored quiz modal, the generic child “Talk and write” drawer, quiz stars, quiz sound effects, direct quiz preview route, and quiz-derived shelf/report indicators are removed. Shared components or sounds used by other experiences remain.

Historical quiz fields already stored in learner records are preserved as raw historical data. New runtime selectors, teacher summaries, exports, and reports stop reading them and stop converting them into knowledge or comprehension claims.

## Teacher-only discussion support

Each current and new book has one immutable discussion record keyed by book ID:

```js
{
  oral: {
    prompt: "...",
    listenFor: "..."
  },
  visual: {
    page: 4,
    prompt: "...",
    lookFor: "..."
  }
}
```

Requirements:

- The oral prompt asks about a specific event, fact, sequence, cause, comparison, or character decision from that book.
- The visual prompt names or clearly points to one page whose final artwork contains the answer evidence.
- `listenFor` and `lookFor` are concise private teacher cues, never answer keys for a scored interaction.
- Prompts are short enough to use aloud during a real conference.
- No generic three-question pattern, answer option bank, score, proficiency threshold, automatic result, or child-facing requirement is introduced.
- A release test requires exactly one oral and one visual prompt for every runtime book and validates the referenced page.

Teacher preview and teacher/admin reader contexts expose a collapsed **Discuss this book** panel. Student context does not mount the panel or include its prompt text in the DOM. Opening, closing, or using the panel writes no learner result.

## Willow Street Readers

### Collection identity

The collection name is **Willow Street Readers**. Four recurring children anchor the illustrated books:

- Maya
- Samir
- Leo
- Zoe

Character designs, age, clothing palette, family relationships, and key locations are recorded in a compact visual continuity sheet before page generation. The cast remains recognisable from cover to cover without requiring every child in every book.

Content remains centred on childhood, family, community, practical routines, culture, and nature/science. It excludes romance, sexuality, gender-identity themes, identity labels, and political messaging. Cultural details must be concrete, respectful, and integral to the story or factual topic rather than decorative tokens.

### Titles and genres

Everyday fiction:

1. The Lunchbox Mix-Up
2. The Lost Library Book
3. The Windy Picnic
4. The Puddle Plan
5. The Squeaky Wheel
6. The Garden Gate

Culture and community:

7. Nani's Chapati Lunch
8. Dumplings for New Year
9. Drums for Carnival
10. Eid Morning with Samir

Safe procedures:

11. Grow a Bean in a Jar
12. Make a Paper Kite
13. Build a Cardboard Ramp
14. Make Fruit and Yoghurt Cups

Photorealistic nonfiction:

15. From Wheat to Bread
16. Where Rainwater Goes
17. Inside a Fire Station
18. How Paper Is Recycled
19. A Snail Comes Out at Night
20. How a Book Is Made

### Manuscript contract

Each book has:

- 8–10 reading pages, excluding the cover.
- Roughly 6–12 visible words on every reading page.
- Stable print placement and type treatment across the sequence.
- Meaningful repeated language that supports anticipation without reducing the text to a disconnected template.
- A coherent beginning, development, and resolution for narrative texts.
- A complete, correctly ordered process for procedural texts.
- Fact-checked, child-safe claims for nonfiction.
- Page text that can be illustrated exactly and does not ask the image to carry an unstated scoring distinction.
- No question or quiz page appended to the book.

All 20 books use `level: "C"`, `readingBandProfile: "standard"`, and, unless an explicit complete phonics scope proves otherwise, `readingMode: "predictable-levelled"`.

### Illustration contract

The 14 fiction, culture/community, and procedure titles use one coherent illustrated visual world and the approved recurring cast. Procedures depict safe, observable steps and adult support where appropriate.

The six nonfiction titles use newly created photorealistic images. They may depict realistic places, objects, materials, animals, and processes, but must not imitate a named photographer, publication, or living artist. Images must be anatomically and mechanically plausible, culturally respectful, free of visible brand marks, and directly aligned to the page text.

Each cover and reading page receives a unique final asset. Text is rendered by the application, not baked into generated art. Asset manifests record book ID, page number, final text fingerprint, image file, dimensions, and review state.

### Audio contract

The final manuscript is frozen before narration generation. Each new book receives the same supported narration and exact word-audio treatment required by the current Guided Reading runtime. The narration corpus, page sequence, audio paths, and provenance fingerprints must agree with the final text. Automated generation and waveform checks do not substitute for direct human listening.

## Source architecture

Implementation adds three explicit content authorities:

- `src/data/guidedReadingBookMetadata.js` for full-catalogue band/mode metadata.
- `src/data/guidedReadingDiscussionPrompts.js` for teacher-only oral and visual prompts.
- `src/data/guidedReadingBridgeBooks.js` for the 20 Willow Street Readers manuscripts and book records.

The existing Guided Reading aggregator imports the bridge records, and the runtime normalizer preserves the new metadata. The source-of-truth registry identifies these authoring files. Generated indexes may consume them, but generated files are never edited by hand.

Policy helpers own labels and grouping so child, teacher, admin, reports, and tests do not duplicate strings or infer support from the letter alone. Any existing reader-local variable named `readingMode` is renamed if necessary to avoid collision with the editorial field.

## Gates and tests

### Unit and source-integrity tests

- All runtime books have exactly one metadata row and one discussion record.
- Metadata enums are valid; Moonwood is extended/read-together; Willow Street is standard.
- A Decodable label is impossible without explicit full-text phonics evidence.
- Every visual prompt references an existing reading page.
- Willow Street has exactly 20 approved titles and the four approved genre counts.
- Each Willow Street book has 8–10 reading pages and 6–12 words per reading page.
- Repetition is meaningful, print load is stable, IDs/paths are unique, and no prohibited quiz fields are authored.
- Child completion persists completion/reread/mission progress without writing quiz fields.
- C Standard progression is not blocked by C Extended completion.
- Reporting and export models ignore legacy quiz evidence.

### Browser tests

- C Standard and C Extended / Read Together appear in the right order on desktop, short-height, and tablet layouts.
- Child cards show friendly reading-mode/support copy and no stars from quizzes.
- Finishing a book saves and returns or levels up without a quiz or generic question drawer.
- Teacher preview exposes a collapsed Discuss this book panel with the correct book-specific oral and visual prompts.
- Child reader markup contains no teacher prompt text.
- Visual prompt page links navigate to the referenced page in teacher context.

### Media and release gates

- Story/content policy, image-text alignment, title-page, visibility, measure, human-voice, narration-corpus, provenance, app-visual-review, repository-hygiene, lint, unit, build, and current release checks are updated to understand band profiles and the new collection.
- Quiz-specific generators, generated question banks, question-bank gates, and exact-three-question assumptions are removed rather than left dormant.
- Hard-coded catalogue counts become current derived facts where practical. Historical migrations remain historical.
- New visual-review records are created only after direct page-by-page inspection. They are not bulk-marked approved from file existence.
- Human-listening and physical-device checks remain explicitly separate from automated browser and audio checks.

## Deletions and compatibility

Delete the legacy Guided Reading quiz runtime component, quiz bank/index, 206 quiz JSON files, quiz-only generators, quiz-only policy, quiz-only unit tests, and quiz-only styling. Remove Guided Reading quiz hooks from the build, release gate, CI, question-design audit, reports, exports, and shelf.

Retain unrelated assessment questions, Story Quest questions, shared progress stars used outside Guided Reading, shared speech helpers, and shared sound effects used by other surfaces. Preserve legacy learner JSON fields during merges so historical records are not destructively rewritten; simply stop consuming those fields.

Documentation that still declares scored quizzes or generic post-book questions as live Guided Reading authority is updated or retired. The live Guided Reading index points to the band metadata, discussion prompts, bridge collection, and revised gates.

## Acceptance criteria

The change is complete when:

- The scored Guided Reading quiz feature and generic child post-book questions are absent from runtime, source data, generated data, styles, builds, gates, reports, and exports.
- Completion, rereads, daily missions, standard progression, teacher summaries, and return navigation still work.
- Every live book has an explicit band profile, reading mode, oral prompt, and valid image-grounded visual prompt.
- Level C is visibly and functionally split into C Standard and C Extended / Read Together, with all Moonwood books in the latter.
- All 20 Willow Street Readers exist with final manuscripts, final unique page art, exact-current-text audio, metadata, and discussion prompts.
- The six nonfiction books use newly created, directly reviewed photorealistic imagery; the other 14 maintain recurring-cast continuity.
- No user-facing copy or metadata names an outside reading-programme comparison.
- Relevant unit, browser, content, media, visual, lint, build, and hygiene gates pass.
- Direct visual review and direct human listening are reported honestly; anything not directly exercised is not described as verified.

