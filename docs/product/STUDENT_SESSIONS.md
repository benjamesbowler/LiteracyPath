# Teacher-controlled Student Sessions

Student Sessions let a teacher temporarily keep selected signed-in students in
one part of Literacy Guide. The teacher starts and monitors the session from
Today or Students. The same launcher also links into the existing synchronized
Guided Reading flow.

## Available session types

- **Skills Assessment** assigns each selected student the next unresolved
  skill, level, and phase from complete saved assessment evidence. Students
  answer independently; correctness, explanations, skill switching, exit, and
  teacher controls are not shown. Each answer, item-mastery update, and terminal
  immutable attempt is saved through the student's opaque login token and is
  scoped to the teacher-issued assignment.
- **Reading Library** lets students choose, read, hear, and explore approved
  books while removing Home, Story Quests, profile, wallet, grown-up, and tab
  navigation.
- **Letters Practice** opens Letters and Sounds while removing Words, Games,
  Home, profile, wallet, grown-up, and tab navigation.
- **Guided Reading Together** opens the existing teacher-paced shared-book
  setup rather than creating a second reading-session system.

The teacher may target the whole class or a selected group and chooses an
automatic expiry of 30, 60, 90, or 120 minutes. The live teacher bar reports
assigned, connected, completed, content-version mismatch, and reconnecting
states and includes an explicit End session action.

## Control and recovery rules

- The active assignment is polled once per second by a visible student iPad and
  is restored automatically after reload, foregrounding, or reconnection.
- A temporary network failure keeps the last verified lock on screen and backs
  polling off to eight seconds. It does not release the student into the rest
  of the app.
- The client requests the screen Wake Lock API while a focus session is active;
  unsupported or denied wake locks do not break the session.
- Content-version mismatch fails closed on an update/help screen and is visible
  to the teacher.
- A student can be in only one active focus or synchronized reading session.
  A teacher can run only one active focus session. Failed replacement launches
  leave the existing session intact.
- Sessions expire after at most two hours. Ended operational records join the
  existing 30-day administrative cleanup.

## Data and access boundary

`student_focus_sessions` and `student_focus_session_members` are RPC-only
tables with row-level security enabled and no browser table grants. Teacher RPCs
assert approved teacher access and class ownership. Student RPCs derive the
student solely from the opaque login token; they never accept teacher, class,
or student ownership fields from the browser.

Independent assessment payloads are validated against the exact assigned
skill, level, and phase. Server-side writes derive ownership, are idempotent,
and permanently label immutable attempts with `administrationMode:
student_independent`, the focus-session id, and teacher-assigned provenance.

## Device boundary

This is an in-app learning lock, not Apple device management. It prevents app
navigation while Literacy Guide is active. Preventing a student from leaving
Safari or switching iPad apps still requires school-managed Apple Single App
Mode, Assessment Mode, or equivalent MDM controls. Physical-iPad testing remains
required before classroom release.
