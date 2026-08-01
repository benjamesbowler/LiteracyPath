# Guided Reading

The live book modules are the authority:

- `src/data/guidedReadingBooks.js`
- `src/data/guidedReadingRegenBooks.js`
- `src/data/guidedStoryBooks.js`
- `src/data/firstFactsActualLevelABooks.js`

Every readable word and page narration must resolve through the current production
audio paths. Continuous reading follows page order and page timing. Current automated
coverage tests enforce these contracts.

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
session.

Import receipts, contact sheets, text-revision queues, audio inventories, replacement
manifests, and provider-specific handoff reports are retired. They must not be restored
or used to override the live book modules.
