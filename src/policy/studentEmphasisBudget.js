import { CHILD_SURFACE_ROUTES } from "./childSurfaceRules.js";

export const STUDENT_EMPHASIS_BUDGET_VERSION = "2026.08.13";

export const STUDENT_EMPHASIS_VIEWPORTS = Object.freeze([
  Object.freeze({ id: "desktop", width: 1280, height: 900 }),
  Object.freeze({ id: "phone", width: 390, height: 844 })
]);

export const STUDENT_EMPHASIS_ROUTES = Object.freeze([
  Object.freeze({
    id: "student-login",
    primaryCue: "Go",
    treatment: "The filled Go button is the only tier-three control; the teacher escape stays textual."
  }),
  Object.freeze({
    id: "student-home",
    primaryCue: "Continue Adventure Map",
    treatment: "The recommended learning card owns the largest card, named action bar, and continuation copy."
  }),
  Object.freeze({
    id: "maths-home",
    primaryCue: "Continue lesson",
    treatment: "The recommended lesson owns the strongest action; checks, stories, Arcade and tool exploration remain quieter alternatives."
  }),
  Object.freeze({
    id: "maths-lesson",
    primaryCue: "Use the model and choose a note",
    treatment: "The one strongest action names both required learning actions until the model is valid, then becomes Next or Finish; previous and manipulative controls remain quiet."
  }),
  Object.freeze({
    id: "maths-check",
    primaryCue: "Start the check",
    treatment: "One calm start action explains the untimed check before six equally weighted answer groups; progress stays informational."
  }),
  Object.freeze({
    id: "maths-stories",
    primaryCue: "Read next",
    treatment: "The recommended story is named Read next; other released covers remain quieter choices. One green next or finish action leads the open page."
  }),
  Object.freeze({
    id: "maths-arcade",
    primaryCue: "Play next",
    treatment: "The recommended game is named Play next; other games remain quieter choices. During play there is no timer or speed score."
  }),
  Object.freeze({
    id: "phonics",
    primaryCue: "Start here",
    treatment: "The next available letter has the only warm focus field and explicit start badge."
  }),
  Object.freeze({
    id: "arcade",
    primaryCue: "Play next",
    treatment: "The next unplayed game keeps full-colour art and a double highlight; other covers are visually quieter."
  }),
  // 2026-07-29, phase C: both of these routes gained a redesigned front door,
  // so the cue each one is reviewed against moved with the screen. On the
  // Adventure Map the named action is the current stop's card ("Your pal is
  // here"); the amber marker above it is the same destination drawn on the
  // plate, and it is the only thing on the screen that moves. On the Sound
  // Trail it is the accent Go. The old cues described the surfaces these two
  // front doors now open onto — the Skills Quest's own map ("Go next") and
  // Sound Seekers' creature hatch ("Hatch my creature") — which a child no
  // longer lands on first.
  Object.freeze({
    id: "adventure-map",
    primaryCue: "Your pal is here",
    treatment: "The current stop's card is the one named action; only its marker on the map pulses, and it leads to the same stop."
  }),
  Object.freeze({
    id: "sound-seekers",
    primaryCue: "Go",
    treatment: "The accent Go beside the next stop is the only tier-three control; the trail markers and sound chips are read-only."
  }),
  Object.freeze({
    id: "story-quests",
    primaryCue: "Start",
    treatment: "The named start or continue action is larger and deeper than level filters and story covers."
  }),
  Object.freeze({
    id: "reading-library",
    primaryCue: "Start next",
    treatment: "The next book is enlarged and double-framed; the reading goal is informative and visually secondary."
  }),
  Object.freeze({
    id: "my-hollow",
    primaryCue: "Place next",
    treatment: "Only the recommended placement spot pulses and it is larger, double-ringed, and explicitly named."
  })
]);

export function validateStudentEmphasisBudgetRegistry(entries = STUDENT_EMPHASIS_ROUTES) {
  const expectedIds = CHILD_SURFACE_ROUTES.map(route => route.id);
  const actualIds = entries.map(route => route.id);
  const missing = expectedIds.filter(id => !actualIds.includes(id));
  const unexpected = actualIds.filter(id => !expectedIds.includes(id));
  const duplicates = actualIds.filter((id, index) => actualIds.indexOf(id) !== index);
  const incomplete = entries
    .filter(entry => !entry.primaryCue?.trim() || !entry.treatment?.trim())
    .map(entry => entry.id);

  return Object.freeze({
    pass: missing.length === 0
      && unexpected.length === 0
      && duplicates.length === 0
      && incomplete.length === 0,
    missing: Object.freeze(missing),
    unexpected: Object.freeze(unexpected),
    duplicates: Object.freeze([...new Set(duplicates)]),
    incomplete: Object.freeze(incomplete)
  });
}
