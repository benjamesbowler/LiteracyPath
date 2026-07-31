# Shared Reading Session — working spec

**Feature:** a teacher runs a guided reading session on their iPad. Up to 8 children follow on their own iPads: the book page, full screen, no controls. The teacher turns the page for everyone. The teacher marks words each child knows or needs help with, live, as they read.

**Status:** design spec, not yet implemented. Written 2026-07-27 against `main` @ `9aa08d97`.

**Read this first — two working conditions:**

1. **The working tree is dirty.** An agent run is mid-flight (45 modified files, 4 new). `progressSync.js`, `useAppSessionController.js` and `App.jsx` are all in that set and all matter here. Do not start implementation until that run lands and is committed. Re-verify every anchor in this spec against the committed tree before editing.
2. **Anchors in this spec are durable identifiers, not line numbers** — function names, exported constants, exact string literals, file paths. Line numbers rot; these do not. Where a line number appears it is marked *(as at 9aa08d97, re-check)*.

---

## 1. Why this is achievable

Three of the four hard parts already exist.

**Word tokens exist for every page.** All 1,617 pages across 176 books carry a `words[]` array of `{ text, audioPath }` objects, built in `src/data/guidedReadingBooks.js`. Per-word marking needs no content work.

**A student reading view already exists.** `src/components/guided-reading/GuidedReadingPage.jsx` takes `mode="student"` (`isStudentMode`), and `APP_VIEWS.GUIDED_READING` is already in `STUDENT_ALLOWED_VIEWS` in `src/appState/appViewHelpers.js`. A child can already open a book on their own iPad today.

**Navigation has one choke point.** Buttons, arrow keys and swipe all funnel through `turnReaderPage` in `GuidedReadingPage.jsx`. One function to intercept.

**Word marking already works** — `cycleWordMark` cycles `"" → "correct" → "support" → ""`, stored as a sparse `{ wordIndex: mark }` map per page.

What does not exist: any server-push mechanism at all. Grepping `src/` for `WebSocket`, `EventSource`, `realtime`, `.channel(`, `broadcast`, `presence` returns zero application hits, and no component polls the server. This will be the app's first.

---

## 2. The constraint that decides the architecture

**A signed-in child holds an opaque app token, not a Supabase JWT.** `student_login` returns a plain text token; the Postgres role stays `anon`; every child RPC passes the token as a `text` argument and validates it inside the function body via `public.student_from_token(p_token)`.

Supabase Realtime authorises channels by JWT. A child has no JWT. Separately, the boundary facade in `src/data/boundaries/facade.js` default-denies every property of the raw SDK client and names `realtime` and `channel` explicitly in its comment as things it intends to block.

So realtime would require either issuing children real Supabase JWTs (a large auth change touching the whole boundary), or an edge function trading the opaque token for a channel grant, plus a reviewed facade amendment.

### Decision: poll, don't push

A student device calls one new RPC on a ~1 s interval. This fits the existing anon + opaque-token model exactly:

- no auth change
- no facade architecture change (only additions to the RPC allowlist, which is the normal, reviewed path)
- no CSP change
- one new table, six new RPCs

Five children at 1 Hz over a 20-minute session is ~6,000 RPC calls — negligible. Sub-second lag is invisible when the teacher says "turn the page" out loud anyway.

**Ruled out — LAN / peer-to-peer.** School networks commonly enable client isolation, so two iPads on the same Wi-Fi often cannot address each other at all. Any design where the teacher's iPad serves the students directly will fail unpredictably per school.

**Deferred — Supabase Broadcast.** Worth revisiting in Phase 4 *if* 1 s lag proves annoying. It is cheaper than it looks here because **the sync payload contains no child data** — a book id and a page number. A Broadcast channel named with an unguessable session id, subscribed with the anon key, leaks at worst "some class is on page 4." `vercel.json` already allows `wss://*.supabase.co` in `connect-src`. The only real cost is the deliberate facade amendment. Do not do this in Phase 1.

---

## 3. Data model

Two new tables. Modelled on `supabase/migrations/20260723231500_teacher_instructional_groups.sql`, which is the house pattern for a teacher-owned, class-scoped table — note the composite `(class_id, teacher_id)` foreign key, which is what makes cross-tenant access structurally impossible rather than merely checked.

**Do not reuse `teacher_instructional_groups`.** Its `criteria` column is `not null` with a hard CHECK requiring `sourceId`, `kind`, `label`, `basis` and `policy` as strings — it models *evidence-derived* grouping. A teacher hand-picking five children for today's book has none of those, and you would be fabricating values to satisfy a constraint. Membership also lives in append-only review snapshots, which is a heavier read than a live session wants.

```sql
-- A live shared reading session. One active session per teacher at a time.
create table if not exists public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  book_id text not null check (char_length(btrim(book_id)) between 1 and 120),

  -- The page list is FROZEN at session start. See §4 for why this is essential.
  page_numbers integer[] not null check (
    cardinality(page_numbers) between 1 and 60
  ),
  page_index integer not null default 0,

  -- Which children are in the session. Cap of 6 is a product decision
  -- (2026-07-27): it matches guided reading group size and keeps the chip
  -- strip readable at 768px. Raising it later is a one-line migration.
  student_ids uuid[] not null check (
    cardinality(student_ids) between 1 and 6
  ),

  -- Guards a student device running a stale cached build. See §9.8.
  content_version text not null,

  status text not null default 'active' check (status in ('active', 'ended')),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz,

  constraint reading_sessions_page_index_range check (
    page_index >= 0 and page_index < cardinality(page_numbers)
  ),
  constraint reading_sessions_class_teacher_fk
    foreign key (class_id, teacher_id)
    references public.classes(id, teacher_id)
    on delete cascade,
  constraint reading_sessions_owner_key unique (id, teacher_id)
);

-- At most one active session per teacher.
create unique index if not exists reading_sessions_one_active_per_teacher_idx
  on public.reading_sessions (teacher_id)
  where status = 'active';

-- Student lookup: "is there an active session containing me?"
create index if not exists reading_sessions_active_students_idx
  on public.reading_sessions using gin (student_ids)
  where status = 'active';

-- Heartbeat, written by the student poll. Ephemeral by nature.
create table if not exists public.reading_session_presence (
  session_id uuid not null references public.reading_sessions(id) on delete cascade,
  student_id uuid not null,
  page_index integer,
  content_ok boolean not null default true,
  last_seen_at timestamptz not null default now(),
  primary key (session_id, student_id)
);
```

**Membership integrity.** Add a trigger mirroring `teacher_instructional_groups`' membership trigger: every uuid in `student_ids` must be an active student in `(class_id, teacher_id)`. Do not trust the client array.

**RLS.** Enable on both tables. `reading_sessions`: teachers select/insert/update/delete their own rows (`teacher_id = auth.uid()`). `reading_session_presence`: **no policies at all**, grants revoked — it is touched only by SECURITY DEFINER functions. This is the existing house pattern for `student_sessions` and `class_access_rate_limits`; follow it exactly.

**Retention.** These rows are operational, not evidence. Add an expiry sweep alongside the existing `admin_purge_expired_error_events` pattern: delete `ended` sessions older than 30 days and their presence rows. Add both tables to `teacher_delete_learner_data`'s delete block **and to its residual-records proof** — the omission of `assessment_sessions` from that proof is an open Critical finding in the teacher-side critique and must not be repeated here.

---

## 4. Why the page list is frozen

`getRuntimeGuidedReadingBooks()` in `GuidedReadingPage.jsx` filters pages by `active !== false && qaStatus === "approved"`, and applies **device-local level overrides and deletion state** read from localStorage (`bookLevelOverrides.js`).

Two iPads can therefore compute *different page arrays for the same book id*. "Page index 3" would mean different pages on different devices — silently, with no error.

Freezing `page_numbers` at session start removes this entirely. The student device resolves:

```js
const pageNumber = session.pageNumbers[session.pageIndex];
const page = book.pages.find(p => p.pageNumber === pageNumber);
```

If `page` is undefined, the student shows a calm holding state and reports `content_ok: false` in its next heartbeat, which surfaces on the teacher's panel as "this iPad needs refreshing" (§9.9). It never renders the wrong page.

**Word index alignment.** Word indices are derived by re-tokenising `page.text` at render time via `tokenizeReadingText` / `sentenceParts`, not stored. This is a genuine hazard *in general*, but not for Phase 1: **students never mark**, so the only device computing word indices is the teacher's, which is self-consistent. Do not send word indices across the wire. If a future phase lets a child tap a word, freeze the token list into the session row at that point.

---

## 5. RPC contracts

Six functions. All `security definer`, all `set search_path = public`, all validating ownership.

### 5.1 The default-grant trap — read before writing the migration

**A newly created function in Postgres grants EXECUTE to `PUBLIC` by default.** The boundary migration revoke-then-grant loop ran at its own point in time; it does not retroactively protect functions created after it. Every one of these six functions must therefore, in the same migration:

```sql
revoke all on function public.<name>(<args>) from public, anon, authenticated;
grant execute on function public.<name>(<args>) to <the one role that needs it>;
```

Then add all six to the next `*_security_definer_boundary.sql` grant lists, and to `tests/unit/databasePolicyContract.test.js`'s expected counts. Getting this wrong is precisely the failure mode this repo has logged three times.

Note the migration timeline is moving — `20260727130000_security_definer_boundary.sql` is the latest as at writing and Codex has been adding more. **Check `ls supabase/migrations/ | tail -3` and number after the newest at implementation time.**

### 5.2 Teacher functions — `to authenticated`

**`teacher_start_reading_session(p_class_id uuid, p_book_id text, p_page_numbers integer[], p_student_ids uuid[], p_content_version text) returns json`**

1. Assert `p_class_id` belongs to `auth.uid()`.
2. Assert every `p_student_ids` entry is an active student in that class (reject with `student_not_in_class`, naming the offending id).
3. Reject if any selected child is already in another teacher's active session → `{ ok: false, error: 'student_busy', student_id, teacher_name }` (§9.6).
4. End any existing active session for this teacher (`status='ended', ended_at=now()`) — the partial unique index enforces this anyway; do it explicitly so it is intentional, not an error.
5. Insert and return `{ ok: true, session: {...} }`.

**`teacher_set_reading_session_page(p_session_id uuid, p_page_index integer) returns json`**
Assert ownership and `status='active'`; assert `p_page_index` in range; set `page_index`, `updated_at = now()`. Return `{ ok, page_index, updated_at }`. Must be **idempotent** — setting the same index twice is a success, not an error (retries depend on this).

**`teacher_end_reading_session(p_session_id uuid) returns json`**
Ownership; `status='ended'`, `ended_at=now()`. Idempotent.

**`teacher_get_reading_session_presence(p_session_id uuid) returns json`**
Ownership. Returns one row per student in `student_ids`: `{ student_id, page_index, content_ok, last_seen_at, connected }` where `connected = last_seen_at > now() - interval '6 seconds'`. Compute `connected` **server-side** so client clock skew cannot lie to the teacher.

**`teacher_save_reading_marks(p_session_id uuid, p_student_id uuid, p_page_index integer, p_marks jsonb, p_client_event_id text) returns json`**
Ownership; `p_student_id` must be in `student_ids`. Writes into the existing `student_progress` row for `(student_id, 'guided_reading', book_id)`, merging the page's `wordMarks`. `p_client_event_id` dedupes retries — mirror the `client_event_id` idempotency pattern the in-flight `20260727120000_assessment_data_integrity_boundary.sql` migration introduces for `answers`.

This function is the answer to §7's blocker. It is the only way a teacher device can write progress for five different children.

### 5.3 Student function — `to anon, authenticated`

**`student_get_reading_session(p_token text, p_page_index integer default null, p_content_ok boolean default true) returns json`**

```sql
v_student := public.student_from_token(p_token);
if v_student.id is null then
  return json_build_object('ok', false, 'error', 'invalid_session');
end if;
```

Then:
1. Find the active session where `v_student.id = any(student_ids)`.
2. If none → `{ ok: true, session: null }`. This is the normal, quiet case — most of the time no session is running. It must not be an error.
3. Upsert presence: `(session_id, v_student.id, p_page_index, p_content_ok, now())`.
4. Return `{ ok: true, session: { id, book_id, page_numbers, page_index, content_version, updated_at } }`.

**Do not return other children's names, ids, marks or presence.** A child's device has no business knowing who else is in the group. The response contains a book id, a page list, an index and a version string — nothing about any person.

**Rate limiting.** This is an `anon`-callable function on a 1 s loop. Add a cheap guard: if the same token calls more than ~4×/second, return the cached row without writing presence. Also cap `p_page_index` to a sane integer range. Follow the shape of the existing `class_access_rate_limits` work rather than inventing a new mechanism.

---

## 6. Client architecture

### 6.1 Facade registration

`src/data/boundaries/facade.js` — add all six names to the `RPCS` set.
`src/data/boundaries/classes.js` — add them to `CLASS_RPCS` and extend `validateClassRpcData` with a `reading_session` shape check (assert `page_numbers` is an array of integers and `page_index` an integer *before* it reaches React; a malformed payload must fail at the boundary, not in a render).
`tools/checkSupabaseDomainBoundaries.mjs` will pass unchanged — you are adding through the allowlist, not around it.

### 6.2 New files

```
src/data/readingSession.js              — RPC wrappers, no React
src/hooks/useReadingSessionFollower.js  — student: poll + backoff + visibility
src/hooks/useReadingSessionHost.js      — teacher: optimistic turn + retry queue + presence poll
src/components/guided-reading/ReadingSessionBar.jsx      — teacher session controls
src/components/guided-reading/ReadingSessionSetup.jsx    — pick book + children
src/components/StudentReadingFollower.jsx                — the child's full-screen view
```

**Why `StudentReadingFollower.jsx` sits at `src/components/` and not in `guided-reading/`:** `audienceFor()` in `tools/checkAppCopy.js` maps `^components/(?:Student|Hollow)` to the **child** audience, and maps `components/guided-reading/` to no audience at all. Putting the child's screen at `components/StudentReadingFollower.jsx` opts it into the child copy gate deliberately. See §10.

### 6.3 The follower hook

```js
// useReadingSessionFollower.js — behaviour contract
//
// Poll cadence:      1000 ms while visible and connected
// On error:          1000 → 2000 → 4000 → 8000 ms, cap 8000
// On visibilitychange to visible: poll IMMEDIATELY, then resume cadence
// On document hidden: stop entirely (an iPad in a bag must not poll)
// Consecutive failures >= 3: surface `connection: "reconnecting"` to the UI
// Never: throw into render. Every failure resolves to a state, not an exception.
//
// Returns:
//   { session, page, connection: "idle"|"live"|"reconnecting"|"ended", contentOk }
```

Reuse, do not reinvent: `progressSync.js` already contains identity-keyed debounce, in-flight dedup via `inFlightFlushes`, offline detection with re-queue, and a `window "online"` re-flush. Model the retry behaviour on it.

### 6.4 The host hook

Teacher turns are **optimistic and never blocking**. The local page changes instantly; the RPC is fire-and-forget with a retry queue. If the write has not landed after ~4 s, show an unobtrusive "not sent yet" marker in the session bar — never a modal, never a blocked page turn. A teacher mid-lesson with five children watching must not be interrupted by a network dialog.

Presence poll: 3 s. Pause when the document is hidden.

### 6.5 Changes to `GuidedReadingPage.jsx`

**Do not refactor this component.** It is ~2,400 lines with ~25 `useState` hooks and no container/presentational split. A rewrite is a separate project and must not be bundled into this feature. Add two narrow props instead.

**`sessionFollower`** (student side) — `{ pageNumbers, pageIndex, connection } | null`. When non-null:

- `pageIndex` becomes controlled: a `useEffect` syncs local page state from the prop.
- `turnReaderPage` returns early — it is the single choke point, so this disables buttons, arrow keys and swipe in one edit.
- Hide the mode bar, marking legend, note drawers and page actions (the fullscreen path already hides all of these; reuse that condition rather than adding a parallel one).
- Add `pointer-events: none` on the page content wrapper as belt-and-braces so a child cannot fire a word-audio tap.

**`sessionHost`** (teacher side) — `{ session, presence, markTarget, onTurn, onMark, onEnd } | null`. When non-null:

- `turnReaderPage` additionally calls `onTurn(nextIndex)` after updating local state.
- `cycleWordMark` routes through `onMark(markTarget.studentId, pageIndex, wordIndex, nextMark)` instead of writing to the single-student record.
- Render `<ReadingSessionBar />` above the reader.

**One existing bug to fix while you are here:** the Marking Mode toggle and legend are hidden in fullscreen while `readingMode` state persists, so a teacher in fullscreen can still mark with no visible affordance and no legend. The teacher's session view is fullscreen-adjacent; fix this rather than inheriting it.

---

## 7. Marking five children from one device — the hard part

**The blocker.** `queueProgressSave` in `src/utils/progressSync.js` hard-gates on `activeSession.studentId !== scopeKey` and silently drops writes for any other student. A teacher device holding one active student session **cannot** write progress for the other four through the existing path. Silently. This is why `teacher_save_reading_marks` exists.

**The existing store divergence, which must be fixed first.** Guided reading records are written to localStorage under `guidedReadingAssessment:${teacherId}:${studentId}`, but cloud data hydrates into a *different* key — `literacyPath.guidedReadingRecords.${studentId}` — which `GuidedReadingPage` never reads. So cloud marks are invisible to the reader, and a teacher on a second iPad sees nothing. Building group marking on top of that will multiply the confusion by five.

**Sequence:** unify the key first (make the reader read the hydrated key, migrate any existing local records into it on first load), *then* add group marking. Do not do these in one change.

**Data shape.** Group marking writes the *same* per-child record shape that exists today — one `student_progress` row per child, area `guided_reading`, key `bookId`. No new shape. The session is the input mechanism, not a new kind of evidence. This keeps every existing report and export working unchanged, and means an abandoned session leaves normal marks behind rather than orphaned rows.

**Merge semantics.** `progressMerge.js` treats `guided_reading` as forward-only merge, never wipe. For a session where the teacher is the sole writer this is exactly right. Preserve it.

### The "who am I marking?" problem

This is the highest-risk UX in the feature: a teacher marks five words against the wrong child and the evidence is quietly wrong.

**Design:** a persistent child-chip strip in the session bar. One chip per child. Exactly one is the active mark target, shown with a strong, high-contrast active treatment — not a subtle tint.

Three rules:

1. **No default target.** On session start and **on every page turn**, the target clears. The first word tap on a new page with no target selected does not mark — it flashes the chip strip and shows "Choose who is reading". One extra tap per page is a cheap price for never mis-attributing.
2. **The active child's name is rendered next to the marking legend**, not only in the chip. Two places, so a glance confirms.
3. **Undo.** The last mark is undoable for 10 s from the session bar. `cycleWordMark` already cycles rather than sets, so a stray tap is recoverable by tapping twice more — but a teacher will not reason that out mid-lesson. Give them an explicit Undo.

Pedagogically this matches reality: in guided reading the teacher listens to one child at a time while the others read on. The chip strip *is* "who I am listening to now".

---

## 8. UI/UX

### 8.1 Teacher — starting

Entry points: a "Start a shared reading session" action on the Students roster and on Today. Both open `ReadingSessionSetup`.

Two steps, reusing the existing `TeacherFunnelStep` pattern so it is learned once:

**Step 1 — Choose the book.** Reuse the existing book picker. Show level and page count.
**Step 2 — Choose who is reading.** Checkbox list of the class, **max 6**, with each child's sign-in status. Once 6 are selected the remaining checkboxes disable with a plain reason ("A reading group can have up to 6 children") rather than silently refusing the tap. Children already in another teacher's session are shown disabled with the reason.

Then a single **Start reading** button. On success the teacher lands in the reader with the session bar attached.

Build from `src/components/teacher/ui/TeacherPrimitives.jsx` (`TeacherPageShell`, `TeacherPageHeader`) and `teacherTokens.css`. Respect `--teacher-ui-target-min: 44px` for every control — note `.lp-button` currently forces `min-height: 40px !important`, which is an existing violation; do not copy it.

### 8.2 Teacher — the session bar

A persistent strip above the reader:

```
┌──────────────────────────────────────────────────────────────────┐
│  Reading together · Pets (Level B)          Page 3 of 9          │
│  ● Amina   ● Ben   ● Chloe   ○ Dev   ● Elsie      [End session]  │
│    ▲ listening to Amina                          Undo last mark  │
└──────────────────────────────────────────────────────────────────┘
```

- Filled dot = connected in the last 6 s. Hollow = not connected. Server-computed.
- Tapping a chip makes that child the mark target.
- "Page 3 of 9" — written with the word "of". The copy gate's `FRACTION` rule bans `3 / 9`.
- End session asks for confirmation via `TeacherDialog` (which has a real focus trap) — **not** `window.confirm`. The only current `window.confirm` in the teacher area is a known finding; do not add a second.

A disconnected child needs a plain-English recovery line, not a status code: *"Dev's iPad isn't connected. Ask Dev to open the app again."*

### 8.3 Student — the follower screen

The whole point is that it is boring and does nothing.

- The page image and text, full bleed, maximum legible size.
- No navigation, no buttons, no menu, no page number. Nothing tappable.
- A single small connection dot, bottom corner, low contrast — enough for an adult to diagnose across the table, not enough to distract a five-year-old.

Four states, all calm, none phrased as an error:

| State | Screen |
|---|---|
| No session running | The child's normal home screen. The follower does not take over until a session exists. |
| Session live | The book page, full screen — image and text, exactly as the reader shows it today. |
| Image slow to load | **Automatic degrade.** If the page image has not painted within 2,000 ms, render the page text alone at large size and keep going. The text is already in the JS bundle, so this always succeeds. If the image arrives later, swap it in — do not re-layout abruptly mid-sentence. Per-page, never sticky: the next page tries the image again. |
| Reconnecting | The **last page stays on screen**, dimmed very slightly, with a small "Waiting for your teacher" line. Never blank the book. |
| Session ended | "All done reading!" then return to the home screen after a beat. |

**Screen wake.** iPads sleep mid-session and a sleeping iPad is the most likely real-world failure. Request a `navigator.wakeLock` screen lock on session start; re-request on `visibilitychange` (iOS drops it on backgrounding). Feature-detect — it is Safari 16.4+. If unavailable, degrade silently; §9.2 covers the recovery.

**Orientation and size.** Assume landscape iPad but do not lock it. The page must remain legible at the smallest supported width; test at 768 px.

### 8.4 Accessibility

- The follower page needs `aria-live="polite"` on a visually-hidden region announcing "Page 3 of 9" on each turn, so a child using VoiceOver knows the page moved.
- The teacher's chip strip is a `role="radiogroup"` with the mark target as the checked radio — it is a single-choice control and should behave like one under keyboard and VoiceOver.
- Connection dots must not encode state in colour alone: pair with shape (filled/hollow) and an accessible name ("Amina, connected").
- Run the existing axe gate (`tests/release/teacher-accessibility.spec.js`) over the new teacher surfaces.

---

## 9. Failure modes

Each row is a required behaviour, not a nice-to-have. A guided reading session has five children watching; anything that stalls the teacher is worse than anything that degrades quietly.

**9.1 A child joins late.** First poll returns the session at its current `page_index`; the follower jumps straight there. No catch-up animation. Already handled by the design — call it out in a test.

**9.2 A child's iPad sleeps or is backgrounded.** Polling stops on `document.hidden`. On resume, poll immediately (do not wait for the interval), then jump to the current page. Combined with the wake lock this is the most common real failure and must be seamless.

**9.3 The teacher loses connection.** Turns remain optimistic and local. The retry queue drains when connectivity returns. Session bar shows "not sent yet" after ~4 s. **The teacher is never blocked and never sees a modal.** Students hold their last page and show "Waiting for your teacher".

**9.4 A child loses connection.** Follower shows the reconnecting state, keeps the last page, backs off to 8 s. Teacher sees the dot go hollow. No sound, no alert on the child's device.

**9.5 The teacher closes the tab / the session is abandoned.** `ended_at` would stay null forever. Two guards: treat a session with `updated_at < now() - interval '90 minutes'` as ended in every read path; and on the teacher's next visit, if an active session exists, show "You have a reading session still open — End it?".

**9.6 The same child in two sessions.** `teacher_start_reading_session` rejects with `student_busy` naming the child and the other teacher. Do not silently steal the child from another teacher's session.

**9.7 Marks attributed to the wrong child.** Mitigated by §7's no-default-target rule, the doubled name display, and Undo. Add a unit test asserting that a word tap with no target selected writes nothing.

**9.8 A student iPad runs a stale cached build.** `content_version` mismatch → follower shows the holding state and reports `content_ok: false`; the teacher's chip shows a distinct marker with "Dev's iPad needs to be refreshed." Source the version from the existing provenance module rather than inventing a new constant.

**9.9 A frozen page number is not found in the student's book.** Same treatment as 9.8. Never render a fallback page.

**9.10 Duplicate mark writes from retries.** `p_client_event_id` on `teacher_save_reading_marks`, unique per `(session, student, page, word, mark)`.

**9.11 Book media does not load.** Two layers. Pre-warm the whole book at session start (§11), and if a page image still has not painted within 2,000 ms, degrade that page to large text automatically (§8.3). Never a broken-image icon, never a blank page, never a spinner the child has to interpret. The teacher is not notified — this is routine, not a fault, and interrupting a lesson for it would be worse than the thing itself.

---

## 10. Copy rules

The child's screen is gated by `CHILD_BANNED`, which blocks — among others — `students?`, `learners?`, `assessments?`, `evidence`, `checkpoints?`, `wrong`, `failed`, `incorrect`. `RAW_TOKEN` blocks snake_case and `level-a` style strings in display text. `FRACTION` blocks `3 / 9`.

Practical consequences:

- The child's screen must never say "students". "Waiting for your teacher" is fine.
- Do not render `book.level` raw ("level-b" trips `RAW_TOKEN`).
- Page counts use "of", never a slash.

The teacher surfaces are gated by `TEACHER_BANNED`, which blocks `evidence`, `telemetry`, `sync health`, `policy`, `learners?`, `logins?`, `scope`, `baseline` among others. So:

- Not "sync status" → "Connected".
- Not "session telemetry" → nothing; do not show it.
- Not "learners" → "children" or names.

Run `node tools/checkAppCopy.js` as part of the acceptance gate. Note the gate has a known blind spot — it does not scan plain string literals in call arguments outside the copy files — so **also** grep the new files manually for banned words in `setMessage(...)` calls.

---

## 11. Media and offline

Guided reading images and audio are **not** service-worker cached. `QUEST_MEDIA_PREFIXES` in the generated `sw.js` covers only `/game-assets/quest-pixel/` and `/audio/music/quest/`. Everything else falls through to the network, relying on the HTTP `Cache-Control` header in `vercel.json`.

On a weak school network a synchronised turn can therefore leave five children staring at a blank page while the teacher has moved on. This is the most visible way the feature can fail in a real classroom.

Two changes:

1. **Extend the SW prefix list** to include `/guided-reading/` in `tools/viteQuestOfflinePlugin.mjs`, with the same stale-while-revalidate strategy. Note `isQuestMedia()` will need to accept the new prefix.
2. **Pre-warm the whole book at session start.** `warmQuestOfflineAssets()` already exists as the mechanism. On the teacher device, warm on session create. On each student device, warm on first successful poll — every page image and page audio for the frozen page list, before the first turn. A ~9-page book is a handful of images; do it once, up front, rather than per turn.

`preloadMediaSet` in `GuidedReadingPage.jsx` already warms adjacent pages at runtime — keep it as a second line of defence.

---

## 12. Tests and acceptance gates

Nothing here is "done" without a named check that ran green. Per the repo's Operating Manual.

**Unit**
- `readingSessionFollower.test.js` — the state machine: idle → live → reconnecting → ended; backoff sequence; immediate poll on visibility; never throws on a failed call.
- `readingSessionHost.test.js` — optimistic turn applied locally before the RPC resolves; retry queue drains in order; "not sent" after the threshold.
- `readingSessionMarkTarget.test.js` — **a word tap with no target selected writes nothing**; target clears on page turn; Undo reverses exactly one mark.
- `readingSessionPageFreeze.test.js` — a student whose local book filtering differs still renders the frozen page number, and reports `content_ok: false` when it cannot.

**Contract**
- Extend `tests/unit/databasePolicyContract.test.js` with the six new RPCs and their exact grant targets. This test reads migration *files*, so it proves intent, not deployment — see below.

**End-to-end (the one that actually proves the feature)**
A Playwright test with **two browser contexts**: a teacher context and a student context. Teacher starts a session, turns to page 3; assert the student context shows page 3 within 3 s. Teacher turns back to page 2; assert the same. Teacher ends; assert the student returns home. Add a third context to prove two students stay in step.

**Accessibility** — run `tests/release/teacher-accessibility.spec.js` over the setup flow and session bar.

**Copy** — `node tools/checkAppCopy.js` plus the manual grep from §10.

**Deployment — the gate none of the above provides.** Every check listed reads source files. This repo has logged three separate "every gate green, product broken" incidents caused by exactly that gap. After deploying, run in the Supabase SQL editor:

```sql
select p.oid::regprocedure as fn,
       has_function_privilege('anon', p.oid, 'execute') as anon_can_call,
       has_function_privilege('authenticated', p.oid, 'execute') as auth_can_call
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname like '%reading_session%'
order by 1;
```

Expect exactly one anon-callable row: `student_get_reading_session`. Any other function callable by `anon` is a defect — most importantly `teacher_save_reading_marks`, which would let an anon caller write into any child's record.

Also confirm both new tables report `rls_on = true`, and that `reading_session_presence` has **zero policies with grants revoked** rather than zero policies with grants intact.

---

## 13. Phasing

**Phase 1 — Sync only.** Tables, all six RPCs, follower hook, `sessionFollower` prop, setup flow, session bar without marking, presence dots, all of §9's failure modes. Children read in sync; the teacher marks nobody. This is independently useful and independently shippable.

**Phase 2 — Group marking.** First fix the localStorage key divergence (§7), then `teacher_save_reading_marks`, the chip strip, the no-default-target rule, and Undo.

**Phase 3 — Offline hardening.** SW prefixes, pre-warm, wake lock, the degraded text-only page.

**Phase 4 — Optional.** Revisit Broadcast if 1 s lag proves annoying in a real classroom. Only with a deliberate facade amendment. Measure first; the assumption is that it will not be needed.

**Rough effort.** Phase 1 is the bulk of the new surface but is mostly additive and well-bounded. Phase 2 is smaller in code but carries the correctness risk. Phase 3 is small. Treat the two-context Playwright test as part of Phase 1, not an afterthought — it is the only thing that proves the feature works at all.

---

## 14. Decisions — all resolved 2026-07-27

No open questions. These are settled; the rest of the spec has been updated to match. Do not re-litigate them mid-implementation.

| # | Decision | Consequence in this spec |
|---|---|---|
| 1 | **Group size cap: 6 children.** | `cardinality(student_ids) between 1 and 6` (§3). Setup step 2 disables further checkboxes at 6 with a plain reason (§8.1). Chip strip sized for 6 names at 768px (§8.2). |
| 2 | **Child screen: image + text, with automatic degrade to text-only.** | If a page image has not painted in 2,000 ms, render large text alone and continue; swap the image in if it arrives (§8.3, §9.11). Per-page, never sticky. Makes the pre-warm and service-worker work in §11 load-bearing rather than optional. |
| 3 | **Abandoned sessions keep their marks.** | Marks land in each child's ordinary `guided_reading` record and appear in normal reports and exports. A crashed iPad never costs a teacher their observations (§7, §9.5). No new record shape, no "part session" flag. |
| 4 | **Silent automatic rejoin.** | A returning device resumes polling and jumps to the group's current page with no teacher action and no child action (§9.2, §9.4). No re-admit step, no "Dev is back" toast — the teacher is mid-lesson. |
| 5 | **Teacher sees reader + persistent session bar.** | Not full screen, not split view. The chip strip must be visible at all times, because it is the safeguard against marking the wrong child (§7, §8.2). |
| 6 | **No audio in the session.** | The follower plays nothing and the teacher cannot trigger narration on the group. Guided reading is the child decoding; narration would do the work for them. Children keep audio in their normal solo reading. **Do not add a narration field to the session row** — its absence is deliberate. |

### Consequences worth restating

Decision 2 promotes §11 from housekeeping to a Phase 1 dependency: the degrade rule is only acceptable *because* the book is pre-warmed, otherwise a whole session runs as text-only on slow Wi-Fi and the picture cues the levelling assumes are lost.

Decision 3 means there is no such thing as an invalid session outcome, which removes a whole class of error handling — but it also means §9.7's mark-target safeguards carry the full weight of correctness. A mis-attributed mark is permanent from the moment it is written.

Decision 6 is a standing constraint, not a Phase 1 scope cut. If it is revisited later it should be as a deliberate pedagogical decision with its own rationale, not as a feature request.
