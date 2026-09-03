# Guided Reading Story Bible content audit — refreshed 2 September 2026

**Status:** Current manuscript, media-file and exact-text narration checks pass
**Standard:** `docs/content/STORY_AND_STORY_QUEST_BIBLE.md`
**Scope:** Every active Guided Reading book and reading page

## Current result

- Active books: **226/226 reviewed**
- Active reading pages: **2,021/2,021 reviewed**
- Level A: **65 books / 523 pages**
- Level B: **86 books / 711 pages**
- Level C: **75 books / 787 pages**
- Fiction: **140 books / 1,400 pages**
- Nonfiction: **86 books / 621 pages**
- Exact-current-text Google Leda narration: **2,021/2,021 pages**
- Reading-page images present: **2,021/2,021 pages**
- Open Story Bible manuscript failures: **0**

Scored Guided Reading quizzes are retired. Book completion records participation,
not comprehension. Optional book-specific oral and visual discussion prompts are
available only to teachers, are unscored, and carry private listen-for/look-for
guidance.

## Level C bands

| Band | Books | Active pages | Use |
| --- | ---: | ---: | --- |
| C Standard | 40 | 382 | Compact independent or lightly supported reading |
| C Extended / Read Together | 35 | 405 | Denser supported reading led or shared by an adult |

All Moonwood guided-reading books are C Extended / Read Together. The C Standard
shelf includes the 20-book Willow Street Readers bridge collection.

## Willow Street Readers

Each of the 20 books has exactly eight reading pages with 6–12 words per page,
stable print placement and meaningful repeated language. The collection adds:

- six everyday-fiction books;
- four culture-and-community books;
- four procedural books;
- six self-created photograph-led nonfiction books;
- 14 illustrated books and six photorealistic books;
- 180 final self-created visual assets, including covers;
- 160 exact-current-text page narrations;
- one teacher-only oral prompt and one teacher-only visual prompt per book.

Every Willow manuscript has a fiction story-spine review or a nonfiction concept-
progression review. The two media manifests bind each final asset to its exact
image hash, reading-text hash, page brief, provenance and original-detail review.

## Release semantics

A change to active text, page order, image bytes, image path, narration mapping,
reading band or reading mode invalidates the relevant fingerprint and requires
the current gates to be rerun. A page-turn or completed-book event is never
reported as proof of comprehension, fluency or independent decoding.

## Current gates

- `node tools/checkGuidedReadingStoryBible.mjs` — **226 books, 2,021 pages, 0 failures**
- `node tools/checkGuidedReadingNarrationProvenance.mjs --check` — exact text/audio provenance
- `node tools/checkGuidedReadingVisualAlignment.mjs` — fail-closed page/image hash alignment
- `node tools/checkGuidedReadingDiscussionPrompts.mjs` — teacher-only prompt structure and page evidence
- `node tools/checkGuidedReadingVisibility.js` — **226 active approved books**
- `node tools/checkGuidedReadingImageTextAlignment.js` — **2,037 normalized story pages, 0 failures**
- `node tools/checkGuidedReadingTitlePages.js` — **226 title pages, 0 failures**
- `npm run check:guided-reading-human-voice` — narration voice-policy checks
- `npm run check:question-design-policy` — scored-question systems only; Guided Reading is excluded

Automated audio presence, decoding and provenance do not replace direct human
listening. Physical-device checks are also recorded separately from browser
emulation.

## Related authority and evidence

- `src/data/guidedReadingBridgeBooks.js`
- `src/data/guidedReadingBookMetadata.js`
- `src/data/guidedReadingDiscussionPrompts.js`
- `docs/guided-reading/WILLOW_STREET_CONTENT_BIBLE.md`
- `docs/guided-reading/WILLOW_STREET_VISUAL_CONTINUITY.md`
- `docs/guided-reading/willow-street-illustrated-media-manifest.json`
- `docs/guided-reading/willow-street-photoreal-media-manifest.json`
- `docs/guided-reading/willow-street-visual-review.json`
- `docs/guided-reading/guided_reading_story_bible_visual_alignment_audit_2026-08-01.json`
