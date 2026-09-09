# Child surface rules

**Version:** 2026.09.01

**Scope:** every route a child can reach before or after sign-in

**Permanent gate:** `npm run check:child-surface-rules`

These rules keep each child-facing screen understandable without relying on trial and error, audio, or an adult standing nearby. A route passes only when the rendered surface contains all five required regions and its strongest action is singular.

## Required regions

1. **Title** — exactly one visible `h1` names the current place. A logo may support the title but must not be its only accessible or visible text fallback.
2. **Instruction** — at least one short, plain-language instruction states what to do now. It should describe one task in no more than two short sentences and must remain understandable with sound off.
3. **Choices** — related choices are visibly grouped and have a programmatic group name where the grouping is not already obvious from native structure.
4. **Progress** — at least one visible measure shows meaningful learning, journey, task, or collection progress. Decoration and points without context do not count.
5. **Primary action** — exactly one visible action is promoted as the clearest next step. Secondary actions must be visually subordinate. Two controls that route to the same next step count as a duplicate primary and fail.

The implementation exposes these regions as `data-child-title`, `data-child-instruction`, `data-child-choices`, `data-child-progress`, and `data-child-primary`. The route root exposes `data-child-surface`.

## Viewport and navigation rules

- Signed-in child hubs are one-screen experiences. At the supported landscape
  viewport the browser page, glass stage, content pane and route root must all
  have equal client and scroll dimensions. The marketing landing page is the
  explicit scrolling exception.
- Arcade and Letters must additionally prove complete-content fit at the common
  1366×768 laptop viewport: every Arcade title and star row, all 26 letter
  choices, and the Letters progress panel remain above the persistent tab bar.
- The stage keeps a fixed 834-design-pixel height but follows the available
  viewport width. A narrow centred band or decorative empty side gutters on an
  ordinary laptop, tablet or 21:9 review display are defects.
- Dense collections page inside the available stage: Arcade uses a 6×2 game
  page, Story Quests a 3×2 quest page, Reading Library an 8-book page, and My
  Hollow uses room/shelf tabs. Do not restore a child-page scrollbar.
- The Adventure Map is a forward journey, not a level picker. A new child
  starts at Meadow cycle 1, then progresses through Meadow, Dino and Moonwood.
  Only the first unfinished stop is interactive; completed and future stops
  are progress/context only.
- An active teacher-controlled Adventure Map session is the one temporary
  exception to that forward route. It exposes only the server-assigned stop,
  removes the map/path chooser and alternate exits. Normal forward progression
  resumes when the session ends, with completed learning still saved. A teacher
  may assign one shared stop or snapshot each learner's current saved stop at
  session start.

## Background audio rules

- Music defaults off outside the main menu. Spoken teaching audio and game
  sounds retain their independent settings. Music controls remain available
  for opt-in, and saved explicit music preferences are respected. The main
  menu A–Z song alone keeps its music-on default.

- Child Home music is optional, non-instructional and deliberately quieter
  than activity music. Its visible header control always says whether music is
  on, off, waiting for a tap, or unavailable.
- A saved on preference may request playback when Home opens, but browser
  autoplay blocking must remain truthful: the control changes to **Play music**
  and the next child interaction retries it.
- Home music respects the learner's lower-audio-intensity setting and stops at
  the child audio lifecycle boundary. It must never continue into a reader,
  quest, assessment or game.
- Tracks live in `src/data/childHomeMusic.js`. With one registered track it
  loops; when more are registered the same player advances through the list.

## Identity and collection rules

- “Little Literacy Guide” is the child-facing name for the persistent
  companion. The child chooses once from characters in LiteracyPath's reader
  series. The chosen Guide appears on Home and in the signed-in header.
- Later Guide changes live only in **My Hollow → My Guide** and cost 10 earned
  stars. Choosing the current Guide again never spends stars.
- Hatched beasties remain visible in the main Hollow's **Beastie nook** and
  open the complete Beasties collection when tapped.
- Reading Library disclosure order is **Fiction / Non-fiction → series → book**.
  Series are meaningful reader groups (including Bob and Nan), not a flat
  cover wall. Completed books carry a visible and accessible read tick.

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
| Student home | PASS | PASS | PASS | PASS | PASS | Removed the duplicate top-bar continuation; the recommended activity card now owns the one named continuation action. |
| Phonics | PASS | PASS | PASS | PASS | PASS | Added a route title contract and promotes the first available unfinished letter while keeping the island switcher subordinate. |
| Arcade | PASS | PASS | PASS | PASS | PASS | Added a direct instruction and marks the first unplayed game as “Play next”; the rest remain ordinary choices. |
| Adventure Map | PASS | PASS | PASS | PASS | PASS | Forward-only Meadow → Dino → Moonwood path; only the first unfinished stop opens outside a temporary, single-stop teacher session. |
| Sound Seekers | PASS | PASS | PASS | PASS | PASS | The fresh-state creature builder names the task, part step, choices, and one hatch action inside the Sound Seekers root. |
| Story Quests | PASS | PASS | PASS | PASS | PASS | Added a single Start/Continue recommendation and a text title fallback that remains visible when the raster logo is suppressed. |
| Reading Library | PASS | PASS | PASS | PASS | PASS | Fiction/non-fiction, then series, then paged books; completed books show a read tick. |
| My Hollow | PASS | PASS | PASS | PASS | PASS | Guide changes and hatched beasties have permanent homes; room and market collections page without child scrolling. |

## Verification

The unit contract proves registry coverage for every `STUDENT_ALLOWED_VIEWS`
entry plus sign-in and Arcade, as well as the forward-map, persistent-Guide,
library hierarchy, Beastie nook and teacher class-entry contracts. The browser
contract mounts the real component for all nine child rows and requires the
route root, all five visible regions, exactly one `h1`, exactly one primary
action, and zero page errors. The 1280×720 ship check additionally requires
equal client and scroll dimensions for every signed-in child hub. The visual
regression contract separately measures Arcade and Letters at 1366×768 and
fails if any named tile, progress row, or letter choice is clipped.
