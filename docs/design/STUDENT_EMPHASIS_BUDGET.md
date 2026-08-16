# Student emphasis budget

**Version:** 2026.08.12

**Scope:** every child route at desktop and small-phone widths

**Permanent gate:** `npm run check:student-emphasis-budget`

The recommended learning action is the only tier-three element on a child surface. Tier three may use the page's strongest action scale, colour contrast, persistent label, or purposeful motion. Selected filters and location context are tier two. Alternative activities, reward totals, progress panels, decoration, and navigation are tier one. A surface fails when reward art or an alternative choice looks more actionable than the next learning step.

## Screenshot review checklist

Each row was reviewed at 1280 × 900 and 390 × 844 with reduced motion enabled. PASS requires one visible tier-three action, a visible cue naming what happens next, subordinate alternatives, no competing continuous motion, and no primary action clipped outside the viewport.

| Route | One tier-three action | Visible next-step cue | Alternatives subordinate | Motion reserved | Desktop | Phone | Correction verified |
|---|---:|---:|---:|---:|---:|---:|---|
| Student sign in | PASS | PASS | PASS | PASS | PASS | PASS | Filled Go remains dominant; the teacher escape is textual and smaller. |
| Student home | PASS | PASS | PASS | PASS | PASS | PASS | The recommended learning card owns the largest area and named continuation bar. |
| Phonics | PASS | PASS | PASS | PASS | PASS | PASS | The next letter alone has a warm field, strong ring, and Start here badge. |
| Arcade | PASS | PASS | PASS | PASS | PASS | PASS | Alternative game art is quietened; the next unplayed game keeps full colour, double highlight, and Play next. |
| Adventure Map | PASS | PASS | PASS | PASS | PASS | PASS | The current stop alone keeps its sign, double ring, avatar, and Go next badge. |
| Sound Seekers | PASS | PASS | PASS | PASS | PASS | PASS | The full-width hatch action remains stronger than creature-part choices. |
| Story Quests | PASS | PASS | PASS | PASS | PASS | PASS | The named start/continue button is larger and deeper than level filters and cover cards. |
| Reading Library | PASS | PASS | PASS | PASS | PASS | PASS | The next book is enlarged and double-framed; the goal panel is quieter support. |
| My Hollow | PASS | PASS | PASS | PASS | PASS | PASS | Only the recommended placement spot pulses; it is larger, double-ringed, and says Place next. |

## Automated contract

The browser gate mounts every real child surface at both review widths. It requires exactly one primary element, `data-child-emphasis="primary"`, computed tier three, a visible next-step cue, no other tier-three action, a viewport-visible primary control, and a reviewed screenshot baseline. The unit gate prevents routes, review widths, cue expectations, or treatment notes from silently disappearing.
