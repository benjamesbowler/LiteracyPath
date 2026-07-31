# Group Guided Reading — implementation plan

**Date:** 2026-07-30 · **Status:** approved-for-build plan, nothing implemented yet
**Written against:** `main` @ `7d466885` (verified via a source snapshot taken from the Mac working tree on 2026-07-30)
**Design contract:** `SYNCED_GUIDED_READING_SPEC_2026-07-27.md` (the full design spec written 2026-07-27 against `9aa08d97`; imported into `docs/` alongside this plan). This plan does not repeat the spec — it re-verifies its anchors against today's tree, records what changed in the 28 commits since, updates the decisions Ben refined on 2026-07-30, and sequences the build into shippable batches with named gates.

**The answer first:** the feature is buildable now, as four phases. The architecture the spec chose (students poll one RPC ~1×/second; no realtime, no new auth) is still the right one — re-verified today: the app still has zero push infrastructure, the Supabase facade still default-denies `realtime`/`channel`, and children still authenticate with opaque tokens, not JWTs. Two things must happen before feature code: the guided-reading record storage keys must be unified (the reader and the cloud sync still write/read different localStorage keys — confirmed live today), and the current uncommitted docs batch on the Mac must be committed so the tree is clean. After that: Phase 1 ships synced page-turning end to end, Phase 2 ships per-child marking + notes, Phase 3 hardens for real classroom Wi-Fi, Phase 4 is an optional latency upgrade that will probably never be needed.

---

## 1. What we are building (Ben's flow, restated)

From Ben's 2026-07-30 description, which this plan treats as the requirement:

1. Teacher opens **Resources** on the teacher dashboard and chooses **Group Guided Reading**.
2. Teacher picks a **book**.
3. Teacher picks **which children** are in today's group (up to 6 — the cap decided 2026-07-27, matching real guided-reading group size).
4. Children sign in on their iPads as normal. Their Home screen shows a **"Read with your teacher"** call — they tap it and land on the teacher's chosen book.
5. The **teacher turns the pages for everyone**. Children's iPads show the page full screen with nothing tappable; page turns follow the teacher within about a second.
6. Children read aloud. The teacher **marks words and jots a quick note per child** while listening — tap a child's chip, tap words they read or needed help with, add a note. Everything lands in that child's ordinary guided-reading record, so existing reports and exports show it with no new report work.
7. Teacher ends the session; children get "All done reading!" and return to their Home screen.

How a lesson feels: the teacher says "turn the page" out loud as she taps — the ~1-second sync lag is invisible inside that ritual. A child whose iPad slept rejoins silently on wake, on the right page. Nothing the children see is ever phrased as an error.

### Decisions updated 2026-07-30 (supersede the spec where they differ)

| # | Decision | What changed vs the spec |
|---|---|---|
| U1 | **Entry point is the Resources → Guided reading card.** The card's primary action becomes "Start a group reading session" (book → children → start). The Level C shelf tiles on the same page keep their current behaviour — open the whole-class read-aloud directly. | Spec §8.1 proposed entry from the Students roster and Today. The Resources page (`TeacherIntentPage.jsx`, rebuilt 2026-07-28) is where Ben wants it, and it is where the teacher-side guided reading destination already lives (`APP_VIEWS.TEACHER_GUIDED_READING`, route `#teacher/resources/guided-reading`). |
| U2 | **Children join by tapping a visible call on their Home screen**, not by automatic takeover. Once joined, reconnects/rejoins are silent and automatic (spec decision 4 unchanged). | Spec §8.3 implied the follower takes over when a session appears. Ben's flow names a button; a tap is also kinder to a child mid-thought. |
| U3 | **In-session capture = word marks AND a quick per-child note.** Both already exist in the solo reader (`cycleWordMark`, `updatePageNote`); the group session routes them at the chip-selected child. | Spec Phase 2 covered word marks only. Ben's message says "make notes per selected kid" — the note field ships in the same phase, same record shape (`pages[i].note`), same RPC. |

Everything else in the spec's decision table (6-child cap, image+text with automatic text degrade, abandoned sessions keep their marks, silent rejoin, reader + persistent session bar for the teacher, **no audio in the session** — the child is doing the decoding) stands as decided on 2026-07-27. Do not re-litigate them mid-build.

---

## 2. The world moved: verified delta since the spec (9aa08d97 → 7d466885)

The spec's own working condition #1 said: *re-verify every anchor before editing.* Done, 2026-07-30, against a full source snapshot. Labels: **observed** = seen in today's source; **derived** = follows mechanically from observed code.

| Spec assumption (2026-07-27) | Today (2026-07-30) | Consequence for the build |
|---|---|---|
| No teacher-side guided reading destination existed; entry points had to be invented | **Observed:** `APP_VIEWS.TEACHER_GUIDED_READING` now exists, route `#teacher/resources/guided-reading`, rendered by `AppSurface.jsx` (~line 1335) as `<GuidedReadingPage mode="class" …>` with empty records and a no-op save. The Resources card (`TeacherIntentPage.jsx`) and its Level C shelf both route here. | The session **host mounts inside this existing view** — no new view, no new route. `ReadingSessionSetup` renders in this view when no session is active; the reader + session bar render once one starts. Smaller change than the spec assumed. |
| Reader had modes `teacher` / `student` | **Observed:** a third mode `"class"` exists — `isClassMode`, `canRecord = !isStudentMode && !isClassMode` (GuidedReadingPage ~573-579). Class mode deliberately discards capture ("a note with nobody to save it against is discarded silently"). | The group host is **not** class mode: it must capture, per child. Host keeps `mode="class"`'s presentation basics but a non-null `sessionHost` prop re-enables capture routed through `onMark`/`onNote` instead of `saveGuidedReadingRecord`. `canRecord` stays false so the *solo-record* affordances stay hidden. |
| Child home = old layout; follower placement flexible | **Observed:** the whole kids side was rebuilt 2026-07-29 (`StudentGlassShell.jsx`, `StudentHomePage.jsx`, `StudentRailNav`); Home enforces **exactly one loud action** — one element carries `data-child-primary`; a second is called out in the file header as a regression. | The join call cannot be an extra loud button. While a session is live for this child, the Home hero's primary slot **becomes** the "Read with your teacher" action (it temporarily replaces the Play recommendation and carries `data-child-primary`). One primary invariant preserved; add a unit assertion for it. |
| Deletion path = `teacher_delete_learner_data` | **Observed:** deletion is now a staged pipeline: `teacher_prepare_learner_deletion`, `teacher_delete_learner_data_staged`, `teacher_complete_learner_deletion`, plus `teacher_export_learner_data`, `admin_list_deletion_propagation` / `admin_verify_deletion_propagation`, and `perform_verified_learner_deletion` (re-guarded in the 2026-07-28 boundary migration). | New tables must join the **staged** pipeline: delete blocks, residual-records proof, propagation verifier, and the data-rights export. The spec's warning stands — `assessment_sessions` being missed by deletion is a logged Critical; do not repeat it with `reading_sessions`/`reading_session_presence`. |
| Newest migration `20260727130000_security_definer_boundary.sql` | **Observed:** newest is `20260728129000_hosted_schema_drift_cleanup.sql`; boundary refreshes now at `20260728125000` and `20260728128000`. | Number the new migration after whatever `ls supabase/migrations/ | tail -1` says at implementation time; add the six RPCs to the **next** boundary refresh and to `tests/unit/databasePolicyContract.test.js`. |
| Storage-key divergence (§7): reader writes `guidedReadingAssessment:{teacherId}:{studentId}`, cloud hydrates `literacyPath.guidedReadingRecords.{studentId}`, reader never reads the hydrated key | **Observed, still true:** `useAppSessionController.js` `loadGuidedReadingRecords`/`saveGuidedReadingRecord` (~lines 300-334) read/write the legacy key via `getGuidedReadingStorageKey` (`studentSessionHelpers.js:7`) and queue cloud writes with `queueProgressSave("guided_reading", bookId, …, { scopeKey: studentId })`; `progressKeys.js:20` maps hydration to `literacyPath.guidedReadingRecords.{scope}`; the rebuilt `StudentHomePage.jsx` reads the **hydrated** key (`readJsonArea("guided_reading", scopeKey)`). | **Phase 0 is mandatory.** Cloud-synced marks are invisible to the reader on a second device today; the child Home's "reading library" progress and the teacher reader can already disagree. Building group marking on top would multiply the confusion by five. Fix first, alone, as its own commit. |
| `queueProgressSave` silently drops writes for any student other than the active session's | **Observed, unchanged:** `progressSync.js:532` — `if (!activeSession?.studentId || activeSession.studentId !== scopeKey) return;` | Still the reason `teacher_save_reading_marks` (server-side, per-child) must exist. The teacher device never writes group marks through `queueProgressSave`. |
| No realtime anywhere; facade default-denies | **Observed, unchanged:** zero application hits for `WebSocket`/`EventSource`/`.channel(`/`broadcast`; `facade.js` proxies only `table`/`call`/`auth` and throws on everything else, explicitly including `realtime`/`channel`. | Poll-don't-push stands. Phase 4 (Broadcast) remains deferred and optional. |
| Students never had a Supabase JWT | **Observed, unchanged:** `student_login` flow; opaque token validated server-side per call (`student_from_token`, most recently redefined in `20260727090000_data_rights_and_lifecycle_fixes.sql`); student session object carries `{ token, studentId }`. | The one student-callable RPC keeps the exact `p_token` pattern of the six existing `student_*` functions. |
| Copy-gate audiences | **Observed, unchanged:** `tools/checkAppCopy.js` `audienceFor()` — `^components/(?:Student|Hollow)` → child; `components/teacher/` → teacher; `components/guided-reading/` → no audience. | `StudentReadingFollower.jsx` still belongs at `src/components/` top level, deliberately opting into the child copy gate. Teacher-facing strings for the setup/bar live in `teacherCopy.js` (gated) rather than as literals in `guided-reading/` files (ungated blind spot). |
| Working tree dirty with an in-flight agent run | **Observed today:** `src/` is clean; `docs/` carries the uncommitted skills-assessment-rebuild batch (staged adds) plus a few modified validation/docs files, and CI workflow tweaks. | Commit the docs batch (plus this plan) before Phase 0 code lands, so every feature commit is small and revertable. |
| Push policy: agents cannot push | **Observed, changed 2026-07-28:** `AGENTS.md` — agents SHOULD push from a cloud clone chained on green checks using `LP_GITHUB_PUSH_TOKEN` from `.env.local`; never from the device VM; no-token fallback = commit locally and hand Ben the push command. | Each phase below ends with the landing recipe under this policy. |

Also relevant, from the hosted-database side (recorded 2026-07-27, unresolved unless Ben has since applied it): `npm run check:live-database` (`tools/verifyLiveDatabaseFunctions.mjs`) probes RPC **existence**, not grants. The deploy runbook in §9 therefore ships with the `pg_proc` grant probe and expected outputs — run it before and after applying the new migration.

---

## 3. Build order at a glance

| Phase | Ships | What Ben sees when it lands | Size (focused sessions) |
|---|---|---|---|
| **0 — Runway** | Commit outstanding docs batch; **unify the guided-reading record keys**; export a guided-reading `content_version` | Nothing visible. Marks made on one device finally appear on another after sync — worth spot-checking with one child record. | 1 |
| **1 — Synced reading** | Tables + 6 RPCs + boundary refresh; follower + host hooks; setup flow on the Resources card; teacher session bar (no marking yet); child Home join call + follower screen; presence dots; the two-context Playwright proof | The full lesson flow works: pick book, pick children, children tap in, pages turn together, dots show who's connected, End session returns everyone home. Nobody is marked yet. **Independently useful and shippable.** | 2-3 |
| **2 — Per-child capture** | Chip strip with no-default-target rule; word marks + quick note per child; Undo; `teacher_save_reading_marks` with idempotent retries | During the session the teacher taps a child's chip, taps words, adds a note. Afterwards the marks/notes sit in each child's normal guided-reading record — reports, exports, Home progress all just show them. | 1-2 |
| **3 — Classroom hardening** | Service-worker prefixes + whole-book pre-warm at session start; wake lock; 2-second image-degrade-to-text rule | Same feature, but it survives real school Wi-Fi and sleepy iPads. Test on the actual classroom network. | 1 |
| **4 — Optional, probably never** | Supabase Broadcast fast path *if* 1 s lag annoys in practice | Page turns feel instant instead of ~1 s. Measure a real lesson first; the spec's bet is this is not needed. | 1 (only if measured need) |

New surfaces (all phases):

```
supabase/migrations/<next>_reading_sessions.sql        — tables, trigger, RLS, RPCs, grants
supabase/migrations/<next>_security_definer_boundary.sql — refreshed grant lists incl. the six
src/data/readingSession.js                             — RPC wrappers, no React
src/hooks/useReadingSessionFollower.js                 — student: poll + backoff + visibility
src/hooks/useReadingSessionHost.js                     — teacher: optimistic turn + retry queue + presence poll
src/components/guided-reading/ReadingSessionSetup.jsx  — book → children → start
src/components/guided-reading/ReadingSessionBar.jsx    — chips, presence, page count, End, Undo
src/components/StudentReadingFollower.jsx              — child's full-screen controlled view (child copy gate)
tests/unit/readingSession*.test.js (4 suites)          — see §8
tests/release/reading-session.spec.js                  — the two/three-context Playwright proof
```

Changed: `GuidedReadingPage.jsx` (two narrow props — **no refactor** of its 2,458 lines), `AppSurface.jsx` (both mount points), `useAppSessionController.js` (Phase 0 key fix + session state), `StudentHomePage.jsx` (hero swap while live), `TeacherIntentPage.jsx` (card action), `teacherCopy.js` / `childCopy.js`, `src/data/boundaries/facade.js` + `classes.js` (registration), `tests/unit/databasePolicyContract.test.js`, and in Phase 3 `tools/viteQuestOfflinePlugin.mjs`.

---

## 4. Phase 0 — runway (do these before any feature code)

### 4.0 Land the outstanding batch

The Mac tree currently carries the skills-assessment-rebuild docs (staged) and assorted modified docs/CI files. Commit and push that batch first (or Ben does), so Phase 0/1 commits are clean, small, and individually revertable. This plan and the imported spec join that docs commit.

### 4.1 Unify the guided-reading record keys (the §7 prerequisite, still open)

**Mechanism of the bug (observed):** the reader's records come from `useAppSessionController` state, loaded by `loadGuidedReadingRecords()` from `guidedReadingAssessment:{teacherId}:{studentId}`; saves write that key and queue a cloud write. Cloud hydration, however, lands rows under `literacyPath.guidedReadingRecords.{studentId}` (`progressKeys.js:20`) — a key the controller never reads. So a mark made on iPad A syncs to the cloud and hydrates on iPad B into a key the reader on iPad B ignores.

**The fix (one commit, no feature code mixed in):**

1. Make `literacyPath.guidedReadingRecords.{studentId}` the single source of truth for load and save in `useAppSessionController` (`loadGuidedReadingRecords`, `saveGuidedReadingRecord`).
2. One-time, per student, on first load: if the legacy `guidedReadingAssessment:{teacherId}:{studentId}` key exists, forward-merge it into the unified key (merge rule = the existing `guided_reading` forward-only merge in `progressMerge.js` — never wipe), then leave the legacy key in place (read-only) for one release as a safety net.
3. Update the two remaining legacy-prefix consumers to the unified key: `src/utils/exportGuidedReadingCompletionExcel.js` (`STORAGE_PREFIX`) and `src/utils/elAssessmentReset.js` (`GUIDED_READING_ASSESSMENT_PREFIX` — keep deleting the legacy key too, so reset still clears both).
4. Note the deliberate scoping change: the unified key is student-scoped, not teacher+student-scoped. Two teachers sharing one browser profile and one child see one record — which is the same record the cloud row holds anyway. Write this down in the commit message.

**Gates:** `npm run test:unit` (run with `TZ=Asia/Shanghai` in cloud sessions — UTC trap logged in the verification-gaps memory), `npm run lint`, `npm run build`, plus a hand check: mark a word on device A, verify it renders on device B after hydration (this is the bug being fixed — prove it dead with your eyes, per the operating manual).

### 4.2 Export a content version

The session row carries `content_version` so a student iPad running a stale cached build can detect mismatch and show the holding state instead of the wrong page list. The source already exists: `GUIDED_READING_MEDIA_VERSION` (`"20260603-continuity-1"`), currently a private const in `GuidedReadingPage.jsx` (~line 49) used by `withGuidedReadingMediaVersion()`. Hoist it into a small exported module (natural home: `src/data/guidedReadingBooks.js`) and have both the reader and the session code import it. Do not invent a second version constant. (Same block also confirms the Phase 3 service-worker prefix: guided-reading media lives under `/guided-reading/`.)

---

## 5. Phase 1 — synced reading, end to end

### 5.1 Database (one migration + one boundary refresh)

The SQL in spec §3 and §5 is current except for the deltas already noted. Restated here as the build contract, updated:

- Tables `reading_sessions` + `reading_session_presence` exactly as spec §3: frozen `page_numbers integer[]` (§4's device-local-filtering hazard is unchanged — `getRuntimeGuidedReadingBooks()` still applies localStorage-driven level overrides, so two iPads can compute different page arrays for the same book id), `page_index`, `student_ids uuid[]` capped 1-6, `content_version text`, `status active|ended`, composite `(class_id, teacher_id)` FK to `classes(id, teacher_id)` (house pattern per `20260723231500_teacher_instructional_groups.sql`), partial unique index = one active session per teacher, GIN index on `student_ids where status='active'`.
- Membership trigger: every id in `student_ids` must be an active student of `(class_id, teacher_id)` — mirror the instructional-groups membership trigger; never trust the client array.
- RLS: `reading_sessions` — teacher-owned CRUD (`teacher_id = auth.uid()`) plus the standard app-admin policy; `reading_session_presence` — **RLS on, zero policies, grants revoked**, touched only by SECURITY DEFINER functions (house pattern: `student_sessions`, `class_access_rate_limits`).
- The six RPCs of spec §5, verbatim contracts: `teacher_start_reading_session` (ownership, membership, `student_busy` rejection naming the other teacher, ends own previous active session, inserts), `teacher_set_reading_session_page` (idempotent), `teacher_end_reading_session` (idempotent), `teacher_get_reading_session_presence` (`connected` computed **server-side** as `last_seen_at > now() - interval '6 seconds'`), `teacher_save_reading_marks` (Phase 2 — see §6), `student_get_reading_session` (`p_token` → `student_from_token`; no-session is a quiet `{ ok: true, session: null }`, never an error; upserts presence; returns **only** `{ id, book_id, page_numbers, page_index, content_version, updated_at }` — no names, no ids of other children, nothing about any person).
- **The default-grant trap, verbatim from spec §5.1** (this repo has logged this failure three times): in the same migration, for every function — `revoke all … from public, anon, authenticated;` then grant execute to exactly one role. Teacher functions → `authenticated`. `student_get_reading_session` → `anon, authenticated`.
- Rate limit on `student_get_reading_session`: same-token calls above ~4/s return the cached session without writing presence; cap `p_page_index` to a sane range. Follow the `class_access_rate_limits` shape (`20260725090000_class_access_security.sql`) — do not invent a new mechanism.
- Retention: sweep `ended` sessions older than 30 days (+ presence rows) alongside the existing purge pattern; add both tables to the **staged deletion pipeline** (`teacher_delete_learner_data_staged` delete block AND its residual-records proof), to `teacher_export_learner_data` (session membership + Phase 2 marks are learner data), and to the `admin_list_deletion_propagation` / `admin_verify_deletion_propagation` coverage. The `assessment_sessions` omission is the logged precedent; its fix and this addition can share a migration review.
- Second file: the next `*_security_definer_boundary.sql` refresh lists all six; `tests/unit/databasePolicyContract.test.js` expected grants/counts updated in the same commit.

### 5.2 Client registration

`src/data/boundaries/facade.js` → add the six names to the `RPCS` string. `src/data/boundaries/classes.js` → add to `CLASS_RPCS` and extend `validateClassRpcData` with a `reading_session` shape check (`page_numbers` array of integers, `page_index` integer — malformed payloads die at the boundary, not in a render). `tools/checkSupabaseDomainBoundaries.mjs` passes unchanged — additions go through the allowlist, not around it.

### 5.3 The two hooks

`src/hooks/useReadingSessionFollower.js` — behaviour contract exactly as spec §6.3: 1000 ms cadence while visible; error backoff 1-2-4-8 s capped; **immediate** poll on `visibilitychange → visible`; full stop while hidden (an iPad in a bag must not poll); ≥3 consecutive failures → `connection: "reconnecting"`; never throws into render. Model retry/dedup/online-reflush on `progressSync.js`'s existing machinery (`inFlightFlushes`, online listener) rather than reinventing.

**Mounted once per signed-in student at the shell level** (AppSurface, student session branch), not per screen — Home consumes it for the join call, the reader consumes it for control, and there is never a second polling loop. While no session is live it may relax to a 3 s cadence; drop to 1 s once `session != null`.

`src/hooks/useReadingSessionHost.js` — optimistic, never-blocking turns (local page changes instantly; RPC is fire-and-forget with an ordered retry queue; "not sent yet" marker after ~4 s — never a modal, never a blocked turn); presence poll every 3 s, paused when hidden; End session flow; auto-end guard (treat `updated_at` older than 90 minutes as ended in every read path, and on next teacher visit offer "You have a reading session still open — End it?").

### 5.4 Teacher UI

- `TeacherIntentPage.jsx`: the guided-reading card's primary action becomes "Start a group reading session" (new handler alongside `onOpenGuidedReading`); the Level C shelf tiles keep opening the plain whole-class read. Card copy gains one line distinguishing the two ("Read together on everyone's iPads" vs "Read aloud to the room").
- `ReadingSessionSetup.jsx`, rendered inside the existing `TEACHER_GUIDED_READING` view when no session is active. Two steps on the learned `TeacherFunnelStep` pattern: choose the book (existing picker, show level + page count), choose the children (class checkbox list, max 6 — at 6 the rest disable with the plain reason; children already in another teacher's active session disabled with the reason). One **Start reading** button. Build from `TeacherPrimitives.jsx` + `teacherTokens.css`; ≥44 px targets (`--teacher-ui-target-min` — and do not copy `.lp-button`'s known 40 px violation).
- `ReadingSessionBar.jsx`, persistent above the reader while a session runs: book title + level, "Page 3 of 9" (the copy gate's FRACTION rule bans "3 / 9"), one chip per child with server-computed filled/hollow connection dots, End session behind `TeacherDialog` confirmation (never `window.confirm` — the one existing instance is a known finding, do not add a second). Disconnected child line in plain English: "Dev's iPad isn't connected. Ask Dev to open the app again." Phase 1 renders the chips as presence only — marking arrives in Phase 2.
- `GuidedReadingPage.jsx` changes are **two narrow props, no refactor** (spec §6.5): `sessionHost` (adds `onTurn` after local turn; renders the bar; keeps stale-solo affordances hidden) and `sessionFollower` (page becomes controlled; `turnReaderPage` — still the single choke point for buttons, arrow keys and swipe — returns early; `pointer-events: none` belt-and-braces on the page content). Fix the one adjacent existing bug while there: the fullscreen marking-mode state persists with no visible affordance/legend — the session view is fullscreen-adjacent and must not inherit that.

### 5.5 Student UI

- **Join call on Home:** while the shell-level follower reports a live session for this child, `StudentHomePage`'s hero primary slot renders "Read with your teacher" (carrying `data-child-primary`) in place of the Play recommendation; the recommendation policy (`selectStudentHomeRecommendation`, `learningPolicy.js`) is untouched — the swap is presentation, in the component, with a unit assertion that **exactly one** `data-child-primary` exists in both states. Tap → `APP_VIEWS.GUIDED_READING` (already in `STUDENT_ALLOWED_VIEWS`) with the follower engaged.
- `StudentReadingFollower.jsx` at `src/components/` (child copy gate, deliberately): the page full bleed — image + text exactly as the reader shows them; no navigation, no page number, nothing tappable; one small low-contrast connection dot. The four calm states from spec §8.3: live / reconnecting ("Waiting for your teacher", last page stays, slightly dimmed — never blank the book) / holding state on `content_version` or page-number mismatch (reports `content_ok:false`, surfaces on the teacher's chip as "needs refreshing") / ended ("All done reading!", then Home after a beat). If the child wanders into the books tab mid-session, the live session wins: `GUIDED_READING` renders the follower whenever `sessionFollower` is non-null, however the child arrived.
- No audio in session (decision 6): the follower plays nothing, and auto-narration stays off in this mode.
- Copy through `childCopy.js` and the gate: never "students", no raw `level-b` tokens, "of" not slashes. Run `node tools/checkAppCopy.js` **plus** the manual grep for banned words in literals the gate cannot see (its known blind spot).
- Accessibility (spec §8.4): `aria-live="polite"` page announcements on the follower; chip strip as `role="radiogroup"` (Phase 2); dots pair shape with colour; run the axe gate over the new teacher surfaces.

### 5.6 Failure modes

All eleven behaviours in spec §9 are Phase 1 acceptance criteria except 9.7/9.10 (marking, Phase 2) and the §11 media hardening (Phase 3, though `preloadMediaSet`'s adjacent-page warming already gives a first line of defence). Late join lands on the current page; sleep/wake polls immediately on visibility; teacher network loss never blocks a turn; the same child in two sessions is rejected loudly at start (`student_busy`); abandoned sessions expire via the 90-minute guard.

### 5.7 Phase 1 gates (named, per the operating manual)

`npm run test:unit` under `TZ=Asia/Shanghai` (includes the new `readingSessionFollower` / `readingSessionHost` / `readingSessionPageFreeze` suites and the updated `databasePolicyContract`), `npm run lint`, `npm run build`, `npm run check:app-copy` + manual banned-word grep, `npm run check:a11y-teacher` (or `test:release-teacher` per current harness), `npm run check:csp` (must pass **unchanged** — srcdoc/frame-src facts from the Present work still bind), and the feature proof: `tests/release/reading-session.spec.js` — two browser contexts (teacher + student): start, turn to page 3, assert the student shows page 3 within 3 s, turn back, end, assert the student lands home; third context proves two students stay in step. In cloud sandboxes remember the Playwright chromium symlink workaround (browser build 1223 → shipped 1194) recorded in the Present-redesign memory.

---

## 6. Phase 2 — marking and notes for five children from one iPad

The hard part, and the reason Phase 0 exists. Design contract = spec §7, unchanged in substance:

- **Server path:** `teacher_save_reading_marks(p_session_id, p_student_id, p_page_index, p_observations jsonb, p_client_event_id)` — ownership + membership asserted; writes into each child's ordinary `student_progress` row (area `guided_reading`, key = book id), forward-only merge (the `progressMerge.js` rule — never wipe); `p_client_event_id` dedupes retries, mirroring the existing `client_event_id` idempotency pattern. `p_observations` carries `{ wordMarks: {index: "correct"|"support"}, note: string }` for that page — the **same shape** the solo reader writes today (`pages[i].wordMarks`, `pages[i].note`), so every existing report, export, and the child-Home progress read work with zero new report code. The session is an input mechanism, not a new kind of evidence; an abandoned session leaves normal marks behind (decision 3).
- **Word-index integrity:** indices are derived by re-tokenising page text at render time (`tokenizeReadingText`/`sentenceParts`). Fine in this phase because only the teacher's device computes indices (self-consistent). **Do not send word indices from student devices**; if a later phase lets a child tap a word, freeze the token list into the session row then.
- **The "who am I marking?" safeguards, all three, non-negotiable** (a mis-attributed mark is permanent): chip strip with one strong active target; **no default target, cleared on every page turn** — first word-tap with no target flashes the strip and says "Choose who is reading", writes nothing; the active child's name doubled next to the marking legend; explicit 10-second Undo in the bar. Chip strip = `role="radiogroup"`.
- **Notes UX (U3):** with a child's chip active, a quick-note field in the bar/drawer writes `pages[currentPage].note` for that child through the same RPC (merge = append-style guard so a group note never clobbers a longer solo note — forward-only). Keep it to one tap + type; the teacher is mid-lesson.
- Client: `cycleWordMark` and `updatePageNote` route through `sessionHost.onMark`/`onNote` when hosting (never through `saveGuidedReadingRecord`, which `progressSync.js:532` would silently drop for four of the five children — the bug class this design exists to avoid).

**Gates:** the `readingSessionMarkTarget` unit suite (word tap with no target writes **nothing**; target clears on turn; Undo reverses exactly one mark), contract test update for the RPC's grants, replay/idempotency unit for `p_client_event_id`, plus the standing Phase 1 gate list. Hand check: run a 3-child session, mark all three, open each child's normal reports/export and see the marks.

---

## 7. Phase 3 — classroom hardening

Spec §11 verbatim, still accurate today (`sw.js` generation still covers only quest media prefixes):

1. Extend the service-worker prefix list in `tools/viteQuestOfflinePlugin.mjs` to include the guided-reading media paths (`isQuestMedia()` accepts the new prefix), stale-while-revalidate.
2. Pre-warm the **whole frozen book** via `warmQuestOfflineAssets()` — teacher device at session create, each student device on first successful poll. A 9-page book is a handful of images; do it up front, not per turn.
3. The 2,000 ms image-degrade rule on the follower (decision 2 made this load-bearing, not optional): page text renders large and reading continues; image swaps in if it arrives; per-page, never sticky; the teacher is **not** notified.
4. `navigator.wakeLock` on session start, re-request on `visibilitychange` (iOS drops it on background), feature-detected (Safari 16.4+), silent degrade — §9.2's immediate-poll-on-wake remains the recovery.

**Gates:** unit for the degrade timer state machine; `test:quest-offline` family still green (the SW plugin changed); manual: aeroplane-mode-then-rejoin on a real iPad; a session run with images throttled to prove text-degrade.

---

## 8. Test matrix (what "done" means, per phase)

| Check | Kind | Phase | Named command |
|---|---|---|---|
| Follower state machine (idle/live/reconnecting/ended, backoff, visibility, never-throws) | unit | 1 | `npm run test:unit` → `tests/unit/readingSessionFollower.test.js` |
| Host optimistic turn + ordered retry + "not sent" threshold | unit | 1 | `…/readingSessionHost.test.js` |
| Frozen-page resolution + `content_ok:false` on mismatch | unit | 1 | `…/readingSessionPageFreeze.test.js` |
| No-target-no-write, target clears on turn, single-mark Undo | unit | 2 | `…/readingSessionMarkTarget.test.js` |
| Six RPCs' grants exactly as intended | contract (files, proves intent not deployment) | 1-2 | `…/databasePolicyContract.test.js` |
| One `data-child-primary` on Home in both hero states | unit | 1 | extend the student-home suite |
| Teacher + 2 students stay in step; end returns home | **the feature proof** | 1 | `tests/release/reading-session.spec.js` |
| New teacher surfaces pass axe | release | 1-2 | `npm run check:a11y-teacher` / `test:release-teacher` |
| Child/teacher copy rules | gate + manual grep | 1-2 | `npm run check:app-copy` + grep |
| CSP unchanged | gate | 1 | `npm run check:csp` |
| Live DB: functions exist | live probe (existence only!) | deploy | `npm run check:live-database` |
| Live DB: **grants** correct | SQL probe (the one that matters) | deploy | §9 SQL below |

Unit runs in cloud sandboxes need `TZ=Asia/Shanghai`; on-device spot-runs work bare (`node --test tests/unit/<suite>` runs without node_modules on the Mac VM).

---

## 9. Deploy runbook (hosted Supabase — copy-paste for Ben or the deploying session)

The repo's gates read migration **files**; the hosted database lags them unless someone applies the SQL. Three logged "every gate green, product broken" incidents came from exactly this gap. So:

1. Apply the new migration(s) in the Supabase SQL editor — follow the house pattern of `docs/ops/APPLY_PENDING_DATABASE_UPDATES_2026-07-27.sql` (a fresh `APPLY_…_<date>.sql` should be generated with the feature, including any still-unapplied earlier boundary SQL).
2. Run the grant probe **before and after**:

```sql
select p.oid::regprocedure as fn,
       has_function_privilege('anon', p.oid, 'execute')          as anon_can_call,
       has_function_privilege('authenticated', p.oid, 'execute') as auth_can_call
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname like '%reading_session%'
order by 1;
```

Expected after: exactly **one** row with `anon_can_call = true` — `student_get_reading_session`. Any other anon-callable row is a defect; `teacher_save_reading_marks` callable by anon would mean anyone can write into any child's record. Also re-run the platform-wide anon census from the security-audit notes (count anon-executable functions in `public`): the count must be **exactly one higher** than the pre-deploy count, and the new name must be `student_get_reading_session`. Do not trust a hardcoded total — the timeline moves.

3. Confirm both new tables report RLS enabled, and `reading_session_presence` has **zero policies with grants revoked** (not zero policies with grants intact):

```sql
select c.relname, c.relrowsecurity
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('reading_sessions','reading_session_presence');

select polname, polrelid::regclass from pg_policy
where polrelid in ('public.reading_sessions'::regclass, 'public.reading_session_presence'::regclass);
```

4. `npm run check:live-database` (existence), then the **two-iPad smoke**: teacher starts a session with one real child account; child taps in; three page turns land within a second or two; sleep the child iPad 30 s, wake it, it lands on the current page; End returns it home. Phase 2 adds: mark three words + a note, then open the child's report and see them.
5. Rollback story: the feature is additive. Disabling = ending active sessions (`update reading_sessions set status='ended', ended_at=now() where status='active';`) and hiding the card action; no data migration to unwind.

---

## 10. Pre-mortem — the ways this fails, and the designed answer

- **A child stares at the wrong page silently** → impossible-by-construction: frozen `page_numbers` at start; mismatch renders the holding state and flags the teacher's chip, never a guessed page (§9.8/9.9).
- **Marks land on the wrong child** → the three §6 safeguards; unit-tested no-default rule; Undo.
- **A teacher RPC ends up anon-callable** (the repo's three-time failure) → revoke-then-grant in the same migration + boundary refresh + contract test + the §9 live probe with expected output.
- **Five children DDoS the poor RPC** → ~6,000 calls per 20-minute session for a 5-child group is negligible; the rate-limit guard caps abuse; presence writes skip when throttled.
- **School Wi-Fi starves images mid-lesson** → Phase 3's pre-warm + text degrade; never a spinner a five-year-old must interpret.
- **The iPad sleeps** → wake lock + immediate-poll-on-visible + silent rejoin (the single most likely real-world failure; §9.2).
- **Another agent "simplifies" polling into realtime through the facade** → the facade throws on `realtime`/`channel` by design; Phase 4 documents the only sanctioned path (deliberate facade amendment, measured need first).
- **New tables become the next `assessment_sessions`** (deleted-child data left behind) → §5.1's deletion-pipeline additions land in the same migration review, with the residual-proof update.
- **Session rows accumulate forever** → 30-day sweep + 90-minute auto-end guard.

---

## 11. Open items Ben can overrule (defaults chosen so building can start)

1. **Capture style (U3):** word marks + quick per-child note, both. Say the word if you want notes-only or marks-only for launch.
2. **Group cap 6** (spec decision 1, matches the "6-iPad sync" framing). Raising it later is a one-line migration + chip-strip layout check.
3. **Join UX (U2):** Home hero temporarily becomes "Read with your teacher" while a session is live. Alternative (rejected for now): a separate banner — it would be a second loud element, which the kids-side redesign explicitly bans.
4. **Sequencing:** this plan slots after the 2026-07-28 punch-list items that remain open. Item 4 of that list ("Resources needs teacher-side guided reading") is **partly delivered already** by the whole-class read; this feature completes it. Item 1 (EL marking yes/no regression) — the "Choose result" dropdown strings are gone from today's source (observed), consistent with the punch list having been addressed; re-verify against the deployed app before treating it as closed.
5. **Naming in the UI:** child-facing "Read with your teacher"; teacher-facing "Group reading session". (The internal/docs name stays Group Guided Reading.)

---

## 12. Landing mechanics (how each phase actually gets onto `main` and the phone-sized details)

Per the 2026-07-28 push policy in `AGENTS.md`: build and verify in a cloud clone; chain the push on green checks; token from the gitignored `.env.local` (`LP_GITHUB_PUSH_TOKEN`), never echoed; **never** push or fetch from the device VM (no network there); if origin moved, rebase and re-run checks; never force. No token reachable → commit locally and end the handover with `git push origin main` for Ben. After a cloud push, the Mac syncs with `git pull --ff-only origin main` — and if the Mac working tree must be touched directly instead, the device-ops recipe applies (sweep `.git/*.lock` files with `mv` before **every** git command; `merge`/`reset --hard` cannot complete on that mount; use the bundle → `git fetch` → `update-ref` → file-overwrite → `git add -A` → both-diffs-empty recipe).

Each phase = one reviewed, pushed batch with its gate list green and named in the commit message. Ben sees a working increment after every phase — nothing rides on a big bang.

---

*Cross-references: design rationale and every UX/failure-mode detail — `SYNCED_GUIDED_READING_SPEC_2026-07-27.md` (imported to `docs/` with this plan). Security ground truth and the anon-grant history — `TEACHER_SIDE_CRITIQUE_2026-07-27.md` §8 and the 2026-07-27 security audit notes. Present-mode CSP/browser facts that constrain any preview work — `docs/PRESENT_REDESIGN_2026-07-28.md`.*
