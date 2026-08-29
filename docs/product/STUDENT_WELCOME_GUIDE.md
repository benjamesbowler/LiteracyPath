# Student welcome guide

The student welcome guide gives a new child a short orientation without adding
another learning destination or competing with the Home page's single primary
action.

## Student experience

- On the first real student sign-in on a device, a three-step tour opens after
  the child has chosen their Little Literacy Guide.
- The tour explains the large recommended Play action, the picture cards and
  bottom navigation, and the speaker and Help controls.
- Each step has one short idea, Back/Next controls, **Skip for now**, and a
  **Hear this** action through the existing child speech pathway.
- The second and third distinct sign-ins show a small **Want a quick tour?**
  reminder instead of reopening the blocking tour.
- From the fourth sign-in onward, no help opens automatically.
- A visible **Help** control remains on every unlocked student page that uses
  the shared navigation header. From one of those subpages it returns to Home
  and opens the tour. Full-screen activities keep their own focused controls.

## Session and teacher rules

- A restored session or route remount is the same sign-in and must not advance
  the three-visit sequence.
- Teacher preview does not create onboarding history.
- Anonymous try mode may replay Help but does not receive an automatic tour or
  write real learner state.
- Teacher-controlled Student Sessions hide Help and suppress the tour so the
  guide cannot let a child escape or obscure an assigned activity.

## Storage and privacy

The record is a device-local navigation preference keyed to the learner's
progress scope. It stores only a bounded visit count, the non-secret session
expiry marker used for idempotency, and whether the current prompt was
dismissed. It is not assessment evidence, engagement evidence, or synced cloud
progress.

The key is included in verified local learner cleanup, so removing a learner's
local data also removes their welcome-guide history.

## Accessibility and evidence boundary

The full tour is a labelled modal dialog. It moves focus to each step heading,
contains keyboard focus, closes with Escape, restores prior focus, and makes the
underlying header, page, and bottom navigation inert while open. Controls keep
the child surface's physical 44-pixel minimum.

Automated unit and browser checks cover visit policy, cleanup, modal semantics,
focus, spoken-copy wiring, replay, and reminder expiry. Chromium viewport review
covers the supported small and large landscape layouts. Physical-iPad behavior
and first-use comprehension, prompting, fatigue, and recovery still require
direct device testing and observed child-usability review under the manual
accessibility program.
