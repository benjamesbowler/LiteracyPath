# Child surface rules

**Version:** 2026.10.03

**Scope:** every route a child can reach before or after sign-in

**Permanent gate:** `npm run check:child-surface-rules`

These rules keep each child-facing screen understandable without relying on trial and error, audio, or an adult standing nearby. A route passes only when the rendered surface contains all five required regions and its primary action area is clear.

## Required regions

1. **Title** — exactly one visible `h1` names the current place. A logo may support the title but must not be its only accessible or visible text fallback.
2. **Instruction** — at least one short, plain-language instruction states what to do now. It should describe one task in no more than two short sentences and must remain understandable with sound off.
3. **Choices** — related choices are visibly grouped and have a programmatic group name where the grouping is not already obvious from native structure.
4. **Progress** — at least one visible measure shows meaningful learning, journey, task, or collection progress. Decoration and points without context do not count.
5. **Primary action** — exactly one visible action is promoted as the clearest next step. Secondary actions must be visually subordinate. Two controls that route to the same next step count as a duplicate primary and fail. Letters and Words are free-choice practice catalogues: their complete chooser is the primary action area, with equally available cards rather than a promoted recommendation.

The implementation exposes these regions as `data-child-title`, `data-child-instruction`, `data-child-choices`, `data-child-progress`, and `data-child-primary`. The route root exposes `data-child-surface`.

## Viewport and navigation rules

- Home, Books, Arcade, Hollow collections and Words use native visual-viewport
  geometry at scale 1. Shell identity and bottom navigation remain stable.
  Each collection owns one visible vertical scroll area when needed. The body
  and shell do not overflow horizontally; content is never silently clipped.
- Home exposes eight picture destinations: Map, Books, Stories, Arcade,
  Letters, Words, Sounds and Hollow. An optional reduced-choice accessibility
  setting remains an explicit learner preference, not the default.
- Arcade opens on the complete eligible game roster. Recommendation is an
  in-card cue; progress and settings are optional utilities. No More gate,
  category knowledge or text pager is needed to find another game. Picture
  cards grow with the available gallery width and height, keeping full artwork
  above complete names. All 24 games and both section headings fit without
  scrolling on laptop and tablet viewports. Small phones retain one continuous
  scroll area to preserve readable names and the child touch-target floor.
- Books opens on a compact exact-book continuation and a continuous eligible
  cover gallery with complete titles and picture categories. Detailed filters
  can be an optional sheet; opening them must not shrink the gallery cards.
- Every catalogue card contains its full art, title, price/status and action.
  Natural row heights grow with text. Whole creatures/objects remain visible;
  intentional cover/thumbnail cropping is restricted to their art frames.
- Learning engines may retain a bounded authored canvas when all required
  controls fit. Letters shows all 26 freely selectable letters in one grid with Complete or
  Try again statuses. Small screens retain a continuous scroll path when the
  touch floor prevents fitting every card; no alphabet paging or reveal gate.
  Words offers every family without prerequisite locks. Story Quests retains
  its paged world grid. Viewport
  scaling must compensate touch floors and use Safari's visible viewport.
- The Adventure Map is a forward journey, not a level picker. A new child
  starts at Meadow cycle 1, then progresses through Meadow, Dino and Moonwood.
  Only the first unfinished stop is interactive; completed and future stops
  are progress/context only. Carry on opens its next unfinished main station
  directly, retaining the mixed quest gate. Choose another game opens the
  station menu for that same eligible stop.
- An active teacher-controlled Adventure Map session is the one temporary
  exception to that forward route. It exposes only the server-assigned stop,
  removes the map/path chooser and alternate exits. Normal forward progression
  resumes when the session ends, with completed learning still saved. A teacher
  may assign one shared stop or snapshot each learner's current saved stop at
  session start.

## Background audio rules

- Music defaults off. Spoken teaching audio and game sounds retain their
  independent settings. Music controls remain available for opt-in. Older
  saved activity-music defaults migrate to off once; subsequent activity
  choices carry `musicPreferenceVersion` through saves and sync.

- Child Home music is optional, non-instructional and deliberately quieter
  than activity music. Its visible header control always says whether music is
  on, off, waiting for a tap, or unavailable.
- Home opens with music off on every visit, including when an older saved
  preference says on. Only the Home music control may start or retry its song.
  If playback is blocked, the control says **Play music**; unrelated taps or
  keys never start it.
- Home music respects the learner's lower-audio-intensity setting and stops at
  the child audio lifecycle boundary, page hide or unmount. Returning to Home
  or the browser tab requires a fresh music-control tap. It must never
  continue into a reader, quest, assessment or game.
- Tracks live in `src/data/childHomeMusic.js`. With one registered track it
  loops; when more are registered the same player advances through the list.

## Identity and collection rules

- “Little Literacy Guide” is the child-facing name for the persistent
  companion. The first Play with Fluff action accepts a suggested Guide after profile
  hydration; optional Choose your Guide offers the complete character set. No
  forced six-way choice precedes learning. Existing Guide choices are preserved. The chosen Guide appears on Home and in the signed-in header.
- Later Guide changes live only in **My Hollow → My Guide** and cost 10 earned
  stars. Choosing the current Guide again never spends stars.
- Hollow follows [the owner-approved blue and simpler Hollow direction](BLUE_UI_AND_SIMPLE_HOLLOW.md).
  The permanent Beasties picture doorway opens the owned collection. Entry
  shows one task and Decorate / My Guide / Beasties; placement controls, shop
  shelves and currencies appear inside the relevant task.
- Books offers one compact real continuation plus the complete eligible cover gallery. Find a book opens
  stories/facts, topic and series filters (including Bob and Nan). Completed books
  keep a visible and accessible read tick. The owner’s 1 October 2026 direction
  adds app text-level shelves and neutral book labels in both libraries. These
  editorial levels describe books, never the child; teacher eligibility and
  publication quarantine stay. Official Lexile measures remain pending.
- Child game progress is personal and scoped to the signed-in learner. No peer
  ranking fetch runs from the child Arcade.
- A teacher-prepared class link uses the existing roster code in a URL fragment;
  it still passes server code validation and normal picture authentication.
  Manual entry and remembered-class re-verification remain available.

## State rules

- Loading, error, empty, completed, and resumed states retain the route title and explain what the child can do next.
- A primary action may be disabled only when the screen clearly shows the missing input, as on the blank class-code step.
- A focused game, reader, or quest activity inherits its route context. Full-screen overlay naming and exit behavior are enforced separately by the A2.10 gate.
- Extra choices may be disclosed progressively, but the next step cannot be hidden inside disclosure.
- Visual emphasis and DOM metadata must agree. Metadata alone never makes an action primary.

## Route audit

| Route | Title | Instruction | Choices | Progress | One primary action | Status and correction |
|---|---:|---:|---:|---:|---:|---|
| Student sign in | PASS | PASS | PASS | PASS | PASS | Step title, recovery instruction, stepper, code choices, and one contextual Go action are explicit. |
| Student home | PASS | PASS | PASS | PASS | PASS | Removed the duplicate top-bar continuation; the compact continuation owns the one named action above eight visible picture destinations. |
| Phonics | PASS | PASS | PASS | PASS | PASS | Shows all 26 selectable letters in one grid, with Complete and Try again states; all eight word families are open picture-backed choices. |
| Arcade | PASS | PASS | PASS | PASS | PASS | Added a direct instruction and marks the first unplayed game as “Play next”; the rest remain ordinary choices. |
| Adventure Map | PASS | PASS | PASS | PASS | PASS | Forward-only Meadow → Dino → Moonwood path; only the first unfinished stop opens outside a temporary, single-stop teacher session. |
| Sound Seekers | PASS | PASS | PASS | PASS | PASS | The fresh-state creature builder names the task, part step, choices, and one hatch action inside the Sound Seekers root. |
| Story Quests | PASS | PASS | PASS | PASS | PASS | Added a single Start/Continue recommendation and a text title fallback that remains visible when the raster logo is suppressed. |
| Reading Library | PASS | PASS | PASS | PASS | PASS | Compact continuation, complete eligible covers and visible picture categories; optional filters open separately. Completed books show a read tick. |
| My Hollow | PASS | PASS | PASS | PASS | PASS | Entry offers the available gift, then decorating; three picture doorways disclose the remaining tasks. Purchase, placement and feeding save automatically. Owned Beasties and Guide changes remain reachable. |

## Verification

The unit contract proves registry coverage for every `STUDENT_ALLOWED_VIEWS`
entry plus sign-in and Arcade, as well as the forward-map, persistent-Guide,
library hierarchy, Beasties doorway and teacher class-entry contracts. The browser
contract mounts the real component for all nine child rows and requires the
route root, all five visible regions, exactly one `h1`, exactly one primary
action, and zero page errors. The ship checks distinguish native catalogues from bounded learning activities.
They check the actual painted art, text, prices and controls, row intersections,
clipping ancestors, keyboard focus and last-card reachability. Native catalogue
scrolling is intentional; zero body scrolling alone does not establish fit.
The device matrix includes 320×568, 568×320, 768×1024, 1024×768, 1366×768 and
1920×1080. Physical iPad and classroom/listening observations remain separate
from emulation and automated ordering evidence.

Voluntary Kids activities stay open. Daily tasks guide children without locking
Games, Letters or Words; Adventure Map and Sound Seekers keep their authored
progression. Exact teacher assignments and account entitlements remain enforced.
