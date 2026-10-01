# Student emphasis budget

**Version:** 2026.10.01

**Scope:** every child route at desktop and small-phone widths

**Permanent gate:** `npm run check:student-emphasis-budget`

The recommended learning action is the only tier-three element on a child surface. Tier three may use the page's strongest action scale, colour contrast, persistent label, or purposeful motion. Selected filters and location context are tier two. Alternative activities, reward totals, progress panels, decoration, and navigation are tier one. A surface fails when reward art or an alternative choice looks more actionable than the next learning step. Emphasis does not hide discovery: Home shows all eight destinations, and Arcade shows every entitled game together. The Arcade recommendation is a badge inside its real game card, without a separate feature panel.

## Screenshot review checklist

Review each row at 1280 × 900 and 390 × 844 with reduced motion enabled. PASS requires one visible tier-three action, a visible cue naming what happens next, subordinate alternatives, no competing continuous motion, and no primary action clipped outside the viewport. The table describes the current required treatment; actual review evidence comes from the browser gate and its inspected screenshot baselines.

| Route | One tier-three action | Visible next-step cue | Alternatives subordinate | Motion reserved | Desktop | Phone | Correction verified |
|---|---:|---:|---:|---:|---:|---:|---|
| Student sign in | PASS | PASS | PASS | PASS | PASS | PASS | Filled Go remains dominant; the teacher escape is textual and smaller. |
| Student home | PASS | PASS | PASS | PASS | PASS | PASS | One compact Play or Carry on row retains its exact saved point and reason. All eight complete picture destinations and their separate replay controls remain visible; only the explicit reduced-choice preference narrows the selection. |
| Phonics | PASS | PASS | PASS | PASS | PASS | PASS | The current letter owns one cobalt Practise action. Familiar review and the complete paged alphabet are quieter choices. |
| Arcade | PASS | PASS | PASS | PASS | PASS | PASS | One next-game badge sits inside the recommended card. All entitled games, currently 24 for the full catalogue, appear together with native scrolling when needed. Settings and personal progress remain optional utilities; sample and teacher restrictions are preserved. |
| Adventure Map | PASS | PASS | PASS | PASS | PASS | PASS | One Carry on action opens the next unfinished station. Another eligible game remains a quieter deliberate choice. |
| Skills trail | PASS | PASS | PASS | PASS | PASS | PASS | One named Play or Carry on action stays in the initial usable pane and remains sticky during exploration. Five pictured area choices, complete skill lists, and selected-location cues stay quieter, with native vertical scrolling. Hear this skill, harder questions, progress and navigation remain subordinate. |
| Sound Seekers | PASS | PASS | PASS | PASS | PASS | PASS | The expanded campaign's named start or carry-on action owns the strongest emphasis; Woodland remains reachable. |
| Story Quests | PASS | PASS | PASS | PASS | PASS | PASS | The named start/continue button is larger and deeper than level filters and cover cards. |
| Reading Library | PASS | PASS | PASS | PASS | PASS | PASS | One Start reading or Keep reading action leads. The full eligible cover gallery and Find a book preserve complete discovery. |
| My Hollow | PASS | PASS | PASS | PASS | PASS | PASS | Entry has one gift or decorating task and three quiet picture choices. Editing highlights one placement or make-space spot without continuous motion. |

## Automated contract

The browser gate mounts every real child surface at both review widths. It requires exactly one primary element, `data-child-emphasis="primary"`, computed tier three, a visible next-step cue, no other tier-three action, a viewport-visible primary control, and a reviewed screenshot baseline. The unit gate prevents routes, review widths, cue expectations, or treatment notes from silently disappearing.
