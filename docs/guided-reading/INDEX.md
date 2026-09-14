# Guided Reading

The live book modules are the authority:

- `src/data/guidedReadingBooks.js`
- `src/data/guidedReadingRegenBooks.js`
- `src/data/guidedStoryBooks.js`
- `src/data/firstFactsActualLevelABooks.js`
- `src/data/guidedReadingBridgeBooks.js`
- `src/data/guidedReadingBookMetadata.js`
- `src/data/guidedReadingDiscussionPrompts.js`
- `src/data/meadowPalsScienceBooks.js`
- `src/data/meadowPalsScienceNarration.js`

The current catalogue contains 227 books: 65 at Level A, 86 at Level B, 75
at Level C, and one science picture book under **Read Together**. Level C is shown in two honest bands:

- **C Standard** for compact independent or lightly supported reading, including
  the 20-book Willow Street Readers collection;
- **C Extended / Read Together** for denser supported reading. All Moonwood
  guided-reading books belong here.

Each shelf card also names its reading mode: **Decodable**,
**Predictable / Levelled**, or **Supported Read-Together**. The letter level is
not a claim that one book is all three.

**The Case of the Missing Sandwich** is a twelve-page Meadow Pals science
read-aloud for interest ages 5–7. Its `READ_ALOUD` placement appears as
**Read Together**, has no independent A/B/C decoding claim, and does not change
a learner's graded-reading placement or level-completion milestones. Its
approved manuscript is fingerprinted in `src/data/meadowPalsScienceBooks.js`.
The exact-page character manifest uses Leda for narration, Muddy's established
Algieba voice for Muddy's dialogue, and Splashy's established Laomedeia voice
for Splashy's dialogue. Every requested word is checked against its intended
speaker; existing Leda-only books retain their current clearance and checks.
The twelve distinct images and separate cover are verified against
`public/guided-reading/science/missing-sandwich/manifest.json`.

Production status on 2026-09-13: twelve page recordings, the title recording and
47 word clips are generated. The pages total 206 seconds. All 60 files pass
decoding, signal and hash checks; page text and ordered character assignments
match the approved manuscript. Independent offline transcription caught and
prompted replacement of two invented dialogue continuations. Tapping **Pffft**
replays Muddy's exact raspberry from page 10; the other 46 new word clips use
Leda. The adapter restricts that character-voice exception to this sound word.
Automated speech evidence is distinct from direct human listening. The book's
review is registered in `src/content/storyContentReviews.js`; existing reviewed
image-conversion and cache-version metadata have been reconciled with their
unchanged source reviews.

Scored Guided Reading quizzes are retired. Finishing a book records completion,
not comprehension. In teacher mode only, a book may expose one optional oral
prompt and one optional visual prompt with private listen-for/look-for guidance.
These prompts are unscored discussion support and never appear in the child
reader.

Whole-class books, child science read-alouds and full-screen reading use the
compact picture-book presentation. The illustration and medium-sized text fill
the reading area below one top transport bar, which contains narration,
pause/resume, page navigation and Exit. The last forward action becomes
**Finish book**. **More** holds line focus and the teacher's optional discussion
support in a dismissible overlay, without reducing the book's space. Pictures
retain their full composition; squarer tablets place the illustration above
the text. Small screens keep longer text scrollable. Teacher conferences and
synchronized marking retain their dedicated teaching controls.

The Willow Street release authorities are:

- `docs/guided-reading/WILLOW_STREET_CONTENT_BIBLE.md`
- `docs/guided-reading/WILLOW_STREET_VISUAL_CONTINUITY.md`
- `docs/guided-reading/willow-street-illustrated-media-manifest.json`
- `docs/guided-reading/willow-street-photoreal-media-manifest.json`
- `docs/guided-reading/willow-street-visual-review.json`
- `npm run check:guided-reading-discussion-prompts`
- `npm run check:guided-reading-story-bible`
- `npm run check:guided-reading-visual-alignment`

The editorial craft evidence used to revise those manuscripts is:

- [`HUMAN_WRITING_EVIDENCE_DATABASE.json`](./HUMAN_WRITING_EVIDENCE_DATABASE.json)

It contains short, source-bounded examples of actual human-written children's-book
language, each analysed for a transferable craft move and rewrite lesson. It is not
a manuscript source or a bank of wording to imitate. `npm run
check:guided-reading-writing-evidence` enforces the 100-example floor, source and
quotation limits, A/B/C coverage, and fiction/nonfiction coverage.

Every readable word and page narration must resolve through the current production
audio paths. Continuous reading follows page order and page timing. Current automated
coverage tests enforce these contracts.

Child publication follows continuous pass-by-exception review and is controlled by
the app-admin role. A missing row or `approved` row is accepted. A `quarantined`
row has a required repair note and removes the book immediately until the repair is
kept accepted. If the quarantine service is unavailable, authenticated libraries
fail closed rather than risk restoring a reported defect. The current authority is:

- `supabase/migrations/20260803120000_guided_reading_publication_gate.sql`
- `supabase/migrations/20260821224000_continuous_guided_reading_review.sql`
- `src/data/guidedReadingPublication.js`
- `src/components/admin/GuidedReadingReviewPanel.jsx`
- the child and shared-reading filters wired through `src/components/AppSurface.jsx`

This is a role-based content publication decision. It does not depend on a named
person, an automated quality score, or a historical approval record.

Teacher-led shared reading is part of the current Guided Reading runtime. Its
authoritative implementation is:

- `supabase/migrations/20260801090000_synced_guided_reading.sql` for the frozen
  session, opaque-token polling, presence, marking, retention and deletion rules
- `src/data/readingSession.js` for the six reviewed RPC calls
- `src/hooks/useReadingSessionFollower.js` and
  `src/hooks/useReadingSessionHost.js` for the follower and host state machines
- `src/components/guided-reading/ReadingSessionSetup.jsx`,
  `ReadingSessionBar.jsx`, and `src/components/StudentReadingFollower.jsx` for
  the teacher and child surfaces

The child token remains opaque. Student devices poll at one-second cadence while
visible; no Realtime, WebSocket, broadcast, or peer-to-peer path is authoritative.
The teacher's frozen page-number list is the only page-alignment source during a
session. Only books not currently quarantined can start a new child-followed shared-reading session.
The shared-reading protocol version changes only for an incompatible frozen-session
contract; ordinary app deployments do not invalidate an active class session.

Import receipts, contact sheets, text-revision queues, audio inventories, replacement
manifests, and provider-specific handoff reports are retired. They must not be restored
or used to override the live book modules.
