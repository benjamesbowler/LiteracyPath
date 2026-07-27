# Child surface rules

**Version:** 2026.07.24

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
| Adventure Map | PASS | PASS | PASS | PASS | PASS | Added completed-stop progress, directs the child to “you are here,” and promotes only the recommended stop. |
| Sound Seekers | PASS | PASS | PASS | PASS | PASS | The fresh-state creature builder names the task, part step, choices, and one hatch action inside the Sound Seekers root. |
| Story Quests | PASS | PASS | PASS | PASS | PASS | Added a single Start/Continue recommendation and a text title fallback that remains visible when the raster logo is suppressed. |
| Reading Library | PASS | PASS | PASS | PASS | PASS | Ranks Continue, Recommended, Already Read, then first available book; only the selected next book is promoted. Added a visible text title fallback. |
| My Hollow | PASS | PASS | PASS | PASS | PASS | The first empty placement spot is the recommended action; when the room is full, changing the world becomes the single fallback action. |

## Verification

The unit contract proves registry coverage for every `STUDENT_ALLOWED_VIEWS` entry plus sign-in and the Arcade mode. The browser contract mounts the real component for all nine rows at 1280 × 900 and requires the route root, all five visible regions, exactly one `h1`, exactly one primary action, and zero page errors.
