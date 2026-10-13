# Simple student and teacher task flows

Owner-approved implementation direction, 30 September 2026, updated for the
teacher simplification on 13 October 2026. This extends the
[blue and simpler Hollow direction](BLUE_UI_AND_SIMPLE_HOLLOW.md). The owner
approved the full over-complication audit recommendations S01–S16, T01–T11 and
C01. The complete research report and screenshots remain local review evidence
under `.artifacts/overcomplication-audit`; the later teacher audit and its
implementation evidence also remain under ignored `.artifacts/`. This document
records current product decisions, not a production-release certificate.

## Students

- Home shows a compact real continuation above eight picture destinations:
  Map, Books, Stories, Arcade, Letters, Words, Sounds and Hollow. Every destination
  is visible without a disclosure. Smaller screens use one native catalogue
  scroll; recommendations retain one promoted action. Optional transfer practice
  remains eligible and reachable through Words, with its taught-letter checks.
- A new child may play with a temporary Fluff suggestion, or deliberately choose a
  different Guide. Saved/hydrated choices take precedence. Subsequent changes
  remain in Hollow under its earned-star rules.
- Letters begins with the current recommended letter and a few familiar review
  choices. The full alphabet remains available through paged browsing. Trace,
  Watch and help must clearly distinguish the child's response from a model.
- Adventure Map's Carry on opens the next unfinished main station directly.
  The station menu remains available for that same eligible stop. Its four-
  station mixed quest gate and teacher-assigned cycle restrictions remain.
- Books begins with a compact saved-page continuation and the complete eligible
  cover gallery. Picture categories are visible; Find a book opens optional
  series and topic filters without shrinking or hiding the catalogue. Reviewed app text levels appear in both child and teacher libraries, as the
  owner requested on 1 October 2026. Levels describe books and never label the
  child’s ability. Official Lexile measures remain pending until measured. Teacher eligibility, quarantine,
  read ticks and canonical same-book cover/error resolution remain intact.
- Reading tasks distinguish page audio from whole-book audio and hearing a
  word. Return controls name their destination. Teacher word marking has
  explicit touch actions for hearing, correction, help and undo.
- Home exposes all eight picture destinations, including Words as a direct
  shortcut to the existing prerequisite-checked Word Workshop.
- The promoted continuation comes first in reading and keyboard order. Its
  current stop and reason are described together and can be heard again. The
  existing recommendation selector and saved progression decide that action;
  visual prominence must not introduce another progression or reward rule.
  Reduced-choice support is an explicit, reversible per-student setting, not
  the default way to simplify the catalogue.
- Arcade begins with the complete eligible gallery and one in-card recommended
  cue. Growing catalogues use one native vertical scroller above navigation. Child progress shows personal, scoped records and makes no
  peer-ranking request. Instructions include a short real demonstration and
  accurate recorded speech where available.
- Sound Seekers' Help resident handoff remains separate from Find's navigation
  assistance. Current eligible places lead; the complete authored campaign is
  reachable through a quieter journey view.
- Each task explains one local denominator. Paused Cycle Practice offers one
  resume action and excludes paused time from its unchanged 30-minute,
  36-distinct-item, construct-coverage and independent check requirements.
- Teachers can prepare class-entry links containing only an existing class code
  in a URL fragment. Server expiry/revocation checks and picture authentication
  remain required. Manual entry and remembered-device re-verification remain.

## Teachers

- The five daily navigation entries are **Dashboard, Teach, Students,
  Assessments and Reports**. Settings is a named utility, and privileged Admin
  remains separate. Existing Resources and Checks bookmarks resolve to their
  current destinations with class, student and result context preserved. The
  shared context bar keeps class/sign-in, Open lesson and Help available;
  it does not put a competing assessment action above every task.
- Dashboard presents named useful actions before metrics. Missing evidence,
  operational preparation and difficulty evidence are distinct reasons. A shared
  next-action selector uses conclusions already evaluated by their evidence
  owner: plan focused practice for a supported teaching need, assess when
  current independent evidence is insufficient, and review conflicting results.
  Continue teaching opens Teach. Session recovery remains visible in the live
  session controls. Missing reads are not zero results, and a sparse sample
  cannot create a deficit claim or a teaching group.
- Teach owns the class teaching cycle and the named tasks **Present, Send
  practice, Read and Worksheets**. Browse books opens the canonical library;
  the nonfiction shelf is browsing, not a personalised next-book claim.
  Help with teaching tools names specialist destinations. The complete eligible
  book, game and printable catalogues remain reachable.
- A launch has explicit class, audience, selected student IDs, content, purpose,
  administration and return destination. Viewing a student does not select that
  student for a group activity. Whole class is resolved against the active
  roster by the existing server operation; stale or unavailable members block
  dispatch. Confirmation shows exact content, audience and duration. The client
  summary never substitutes for server ownership and assignment validation.
- Student sessions begin with **Practise, Assess or Read together**. Literacy
  practice uses the supported practice profile. Independent literacy snapshot
  uses the existing independent profile without teaching feedback; its results
  remain descriptive and do not change Skills mastery or placement. Skills
  assessment, teacher-observed assessments and Mixed literacy mock retain their
  own administration and reporting rules. The activity name and meaning remain
  consistent in setup, the live session and saved history.
- Generic Browse books is a class browsing/preview mode, regardless of the last
  student selected. A book offers explicit Preview, Read with a student, Read
  together and independent assignment actions where eligible. Student-specific
  reading uses a named student and return destination. Preview never saves
  student results. Read together opens the existing book/group selector directly,
  explains that the teacher turns pages, carries valid selections, and requires
  the teacher to reduce a group over six; it never silently truncates the group.
- Book badges, recommendation selection and reasons use the same reviewed App
  A–H text metadata and current text fingerprint. Legacy instructional
  eligibility remains a separate constraint. Reasons may describe an available
  book or taught-code match only when supported; an oral-language focus does
  not establish a text-level match. App levels describe texts, not children.
  Measurement provenance remains in book details; no Lexile measure is invented.
- Present, worksheets and Cycle Practice use the explicit task choice, deliberate
  saved-lesson choice, then confirmed current class cycle. Unknown context asks
  the teacher to choose; an old saved workspace cannot silently override a new
  lesson's class cycle. Present's Use saved lesson deliberately restores its
  cycle/day and opens from the beginning. The class cycle is teacher/class scoped
  and separate from each student's independent progression and cycle exceptions.
- Session presentation shares **Prepare, Live and Results**, with separate
  adapters for focus sessions, synchronised reading and mixed mocks. Available
  controls come from the underlying protocol. Persistent session strips return
  to the correct running work; session members with connection/content problems
  lead the operational view. Prepared is not running, paused is not finished,
  and completed answering is not proof of a saved result. Coverage, provenance
  and supported/independent details remain named and accessible.
- Read failures preserve verified context and offer local retry; stale responses
  cannot replace a newer class/session. Reading writes retain their original
  event IDs through retry/reload, and ending waits for acknowledgement. An
  explicit resume validates ownership and active state. A rejected recovery
  remains visibly unsaved and can be downloaded; it must never be presented as
  a confirmed result. The session rules remain in
  [Student Sessions](../product/STUDENT_SESSIONS.md).
- Students owns the roster and one student panel: current focus, evidence date,
  the appropriate next action, reading and report links lead. **Student sign-in,
  Learning support and Student record** name maintenance tasks; **Manage class**
  owns class operations. Selection for viewing is distinct from checked rows for
  bulk actions. Settings shortcuts open the exact task and request a student
  when needed. Archive, permissions and data-rights protections remain intact.
- Reports opens a class summary directly, or a student summary when that student
  is explicitly selected. The teaching implication leads; **Detailed reports**,
  **View all results and assessment details**, **Saved activity history** and
  **Export** preserve the depth. Not checked, insufficient, mixed and needs-support
  results stay distinct. Exports use the existing serializers with explicit
  scope; their Data worksheet retains the complete ledger and stable identifiers.
- Saved activity history filters assessment/practice/mock records by type, date
  and student. Original assessment IDs open only that saved attempt, including
  retained responses and its existing detailed renderer; original mock IDs open
  the existing mock report. Cursor pages have stable ordering and deduplication.
  Older history not loaded, no matching loaded results and failed reads are
  different states. Last-saved mock snapshots are labelled as such. Browsing
  old history does not make it current learning evidence. Reading and game
  histories remain named in the student's detailed reports.
- **Share with family** is a compact status with **Preview family update** and
  **Manage guardian access**. Preview captures the family-safe snapshot once
  and renders the canonical family sections. Explicit release persists that
  exact object even if teacher evidence refreshes while it is open. Changing
  student closes the old draft; opening a report never shares it. Invitations,
  access revocation and withdrawal retain their existing authorised model.
- Insight practice plans retain their exact targets and original reasoning on
  teacher-owned records. The source cannot be rewritten, and removing a student
  erases their embedded source. These plans do not alter child game progress.
- Present opens the chosen cycle/day with one Present action. The daily lesson
  structure is owned by the [Present contract](../PRESENT_REDESIGN_2026-07-28.md);
  there is no second format or console chooser.
- Worksheets starts with a cycle/focus-based existing recipe and its reason.
  Browse all activities exposes the complete searchable catalogue; changing
  the suggestion does not hide the exact preview or direct print action. Pack
  length is an explicit remembered preference. Taught-content, layout and
  separate teacher-answer rules remain owned by the worksheet standard.
- Verbs describe the immediate action: Choose assessment selects; Start
  assessment starts; Open lesson opens setup; Present opens projection. Return
  controls name their destination. Completion offers the applicable saved result,
  teaching continuation or class return, derived from the actual protocol, and
  never relaunches or duplicates work merely because the teacher returns.

## Shared task frame

Use cobalt #3454C8 for the promoted interface action, navy #18263E for readable
text, canvas #F7F8FA, selected #E9EDF9, divider #DFE3EB and opaque white panels.
Preserve teaching glyphs and canonical scenery/art. Tasks retain a title, short
instruction, grouped response area, local progress, named replay/help and an
accurate return. Use Play for games, Carry on for continuation, Hear again for
instruction replay and Back to Books for that destination. Instruction, target
sound and answer-option audio remain separate when required by the construct.

## Evidence

Run the current [changed-surface gates](../verification/TASK_GATES.md), relevant
product checks and focused regressions. Verify closed and disclosed browsing,
complete catalogue reachability, teacher assignment scope, pause timing, actual
exports and live route/assets. Pixel baselines change only after rendered review.
Automated browser checks establish browser behavior; physical iPads, classroom
independence and human listening retain their separate evidence boundaries.
