# Guided Reading

The live book modules are the authority:

- `src/data/guidedReadingBooks.js`
- `src/data/guidedReadingRegenBooks.js`
- `src/data/guidedStoryBooks.js`
- `src/data/firstFactsActualLevelABooks.js`

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

Child publication is fail-closed and controlled by the app-admin role. A book with
no review row is awaiting review and is hidden from every child surface. A passed
book has an `approved` row and becomes available immediately. A failed book has a
`quarantined` row with a required repair note and remains hidden until it passes a
later review. The current authority for this gate is:

- `supabase/migrations/20260803120000_guided_reading_publication_gate.sql`
- `supabase/migrations/20260809090000_guided_reading_fail_closed_publication.sql`
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
session. Only approved books can start a new child-followed shared-reading session.

Import receipts, contact sheets, text-revision queues, audio inventories, replacement
manifests, and provider-specific handoff reports are retired. They must not be restored
or used to override the live book modules.
