# Little Literacy Guides SEL Books 1-10

This is the draft-only Social Emotional Learning collection: 10 books at Level A,
10 at Level B and 10 at Level C. The manuscripts live in
`src/data/guidedReadingSelBooks.draft.js` and are not imported by the live Guided
Reading catalogue until the publication gate is complete.

## Current production state

- Manuscripts: complete — 30 books, 10 per level.
- Text-band gate: passing with `npm run check:sel-book-drafts`.
- Page art: complete — 240 story-page images at 1376x768 WEBP.
- Covers: complete — 30 titleless covers at 1376x768 WEBP.
- Visual review: every book was reviewed as a complete sequence against its
  manuscript, character/world canon, location, scale, carried props and state.
  Continuity and anatomy failures found during review were regenerated before
  acceptance.
- Media manifest: generated at `docs/content/sel-books/SEL_MEDIA_MANIFEST.json`
  with exact-text image/audio records for all 240 pages plus 30 cover records.
- Narration: all 240 page clips have been generated with
  `en-US-Chirp3-HD-Leda` and are awaiting listening review.
- Publication: hidden/draft-only. No book is child-visible.

## Media rules

Every page image must preserve the canon ID, relative scale, location, prop state,
emotion and exact story beat. Images contain no embedded text. Every narration file
must match the final page text word for word and pass intelligibility, pacing,
pronunciation, rights and listening review. Generative media is a candidate until
those checks are complete.

The five sequence sheets in
`public/images/guided-reading/sel-books/reference/` are the retained visual
continuity authorities for the human, Meadow and Moonwood casts. They are source
references, not child-facing book media.

Run `npm run build:sel-book-media-manifest` after manuscript or media-path changes.
Use `npm run build:sel-book-media-manifest -- --mark-images-reviewed` only after a
new direct sequence review has actually completed. The draft gate checks all 270
book images, their dimensions, manifest alignment, unused files in each book
directory and the presence of all 240 generated Leda clips. It does not replace
the still-pending human listen to every narration clip or the separate publication
gate.
