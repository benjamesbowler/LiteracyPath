# Student emphasis budget

**Version:** 2026.10.01

**Scope:** every child route at desktop and small-phone widths

**Permanent gate:** `npm run check:student-emphasis-budget`

The recommended learning action is the only tier-three element on a child surface. Tier three may use the page's strongest action scale, colour contrast, persistent label, or purposeful motion. Selected filters and location context are tier two. Alternative activities, reward totals, progress panels, decoration, and navigation are tier one. A surface fails when reward art or an alternative choice looks more actionable than the next learning step.

## Screenshot review checklist

Each row was reviewed at 1280 × 900 and 390 × 844 with reduced motion enabled. PASS requires one visible tier-three action, a visible cue naming what happens next, subordinate alternatives, no competing continuous motion, and no primary action clipped outside the viewport.

| Route | One tier-three action | Visible next-step cue | Alternatives subordinate | Motion reserved | Desktop | Phone | Correction verified |
|---|---:|---:|---:|---:|---:|---:|---|
| Student sign in | PASS | PASS | PASS | PASS | PASS | PASS | Filled Go remains dominant; the teacher escape is textual and smaller. |
| Student home | PASS | PASS | PASS | PASS | PASS | PASS | One named Play or Carry on action leads. Six complete picture doors are disclosed by Choose something else. |
| Phonics | PASS | PASS | PASS | PASS | PASS | PASS | The current letter owns one cobalt Practise action. Familiar review and the complete paged alphabet are quieter choices. |
| Arcade | PASS | PASS | PASS | PASS | PASS | PASS | One recommended game leads. Three alternatives, the complete catalogue and optional settings are progressively disclosed. |
| Adventure Map | PASS | PASS | PASS | PASS | PASS | PASS | One Carry on action opens the next unfinished station. Another eligible game remains a quieter deliberate choice. |
| Sound Seekers | PASS | PASS | PASS | PASS | PASS | PASS | The expanded campaign's named start or carry-on action owns the strongest emphasis; Woodland remains reachable. |
| Story Quests | PASS | PASS | PASS | PASS | PASS | PASS | The named start/continue button is larger and deeper than level filters and cover cards. |
| Reading Library | PASS | PASS | PASS | PASS | PASS | PASS | One Start reading or Keep reading action leads. A paged shelf and Find a book preserve complete discovery. |
| My Hollow | PASS | PASS | PASS | PASS | PASS | PASS | Entry has one gift or decorating task and three quiet picture choices. Editing highlights one placement or make-space spot without continuous motion. |

## Automated contract

The browser gate mounts every real child surface at both review widths. It requires exactly one primary element, `data-child-emphasis="primary"`, computed tier three, a visible next-step cue, no other tier-three action, a viewport-visible primary control, and a reviewed screenshot baseline. The unit gate prevents routes, review widths, cue expectations, or treatment notes from silently disappearing.
