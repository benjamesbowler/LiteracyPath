# Kids experience ship pass — 2026-07-29

This record closes the post-redesign usability pass requested on 2026-07-29.
It records the shipped behavior; the permanent rules live in
`docs/design/CHILD_SURFACE_RULES.md` and
`docs/LITTLE_LITERACY_GUIDES_DESIGN_SYSTEM.md`.

## Shipped behavior

- The child glass stage now follows the viewport width instead of leaving a
  narrow centre band. Signed-in child hubs are bounded to one screen; Arcade,
  Phonics, Story Quests, Reading Library and My Hollow use compact grids or
  paging rather than browser scrolling.
- The Adventure Map is a single forward Meadow → Dino → Moonwood journey.
  Only the first unfinished cycle is playable. Completed and locked stops are
  progress markers, not level-selection controls.
- “Companion” is now “Little Literacy Guide” in child-facing identity and
  Hollow controls. A Guide is chosen once from six reader-series characters,
  saved per learner, and shown on Home and in the child header. Later changes
  live in My Hollow and cost 10 earned stars.
- Reading Library now discloses Fiction / Non-fiction, then series, then eight
  books per page. Completed books show a tick.
- Teacher Today presents a large “Choose your class” gate before dashboard
  priorities when no class is active.
- The main Hollow room includes a Beastie nook for hatched creatures, linked
  to the full Beasties collection.

## Verification

- Unit contracts cover stage width/overflow, forward-only maps, persistent
  Guide cost and storage, Guide terminology, Beastie nook, library hierarchy
  and the teacher class gate.
- Live browser review at 1280×720 measured equal client/scroll dimensions for
  the page, stage, child content and route root on the map and phonics screens.
  The same check was completed during implementation for Home, Arcade, Story
  Quests, Reading Library and My Hollow.
- Live teacher preview showed the class chooser and no dashboard content before
  class selection.
- The production build and repository gates are recorded in the completing
  task output rather than duplicated here.
