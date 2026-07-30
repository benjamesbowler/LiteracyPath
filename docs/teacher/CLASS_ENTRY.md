# Teacher class-entry contract

Teacher work is class-scoped. An explicit teacher sign-in therefore begins
with one verified class decision before the normal navigation, context bar or
Today dashboard appears.

## Existing teachers

- Load the complete, teacher-owned class list before claiming that a class
  exists or does not exist.
- When at least one class exists, show a focused **Choose your class** screen.
- Do not restore a class from an old profile or stale route after an explicit
  sign-in. The teacher must make the new-session choice.
- Choosing a class clears prior class and learner state, loads that class's
  roster and dashboard evidence, and then opens the normal teacher shell.
- Session restoration without a new sign-in may retain a valid owned deep
  route. This keeps reloads and bookmarks useful without bypassing the
  explicit-login gate.

## New teachers

- A complete, verified empty class list opens **Create your first class**
  directly. Class creation must not be hidden in Students or a setup
  disclosure.
- The first-class form requires a non-empty class name of at most 120
  characters and reports failures inline.
- A successfully created class becomes the active class immediately. The
  teacher can then add students and prepare sign-in cards through the normal
  setup checklist.

## Loading and failure

- Loading is not an empty account.
- Failed or safety-limited class reads show a retry state and never expose the
  first-class form.
- The teacher sidebar, context bar and footer stay out of the way until a class
  is selected or created.

## Automated evidence

- `tests/unit/teacherLoadingStates.test.js` renders existing-teacher,
  new-teacher, loading and failed-read entry states.
- `tests/unit/kidsExperienceShipPass.test.js` pins the focused shell, direct
  creation wiring and explicit-login route reset.
