import { CHILD_SURFACE_ROUTES } from "./childSurfaceRules.js";

export const STUDENT_EMPHASIS_BUDGET_VERSION = "2026.08.15";

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
    primaryCue: "Play",
    treatment: "The recommended activity owns the only tier-three Play action; its title, exact continuation point, state, and recommendation reason stay in the same hero."
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
  // Adventure Map the named action is the current stop's card ("This is your
  // next unfinished stop"); the amber marker above it is the same destination
  // drawn on the plate, and it is the only thing on the screen that moves. On
  // the Sound Trail the fresh-child route opens the character creator, whose
  // named start action is the primary cue. The old cues described the surfaces
  // these two front doors now open onto — the Skills Quest's own map ("Go
  // next") and Sound Seekers' creature hatch ("Hatch my creature") — which a
  // child no longer lands on first.
  Object.freeze({
    id: "adventure-map",
    primaryCue: "This is your next unfinished stop",
    treatment: "The next unfinished stop's card is the one named action; only its marker on the map pulses, and it leads to the same stop."
  }),
  Object.freeze({
    id: "cycle-practice",
    primaryCue: "Choose the best answer",
    treatment: "The current cycle question owns the single clear response action; practice timing and progress remain visible without competing with the answer."
  }),
  Object.freeze({
    id: "sound-seekers",
    primaryCue: "Start my adventure",
    treatment: "A new child gets one named Start my adventure action; customisation options stay quieter and do not compete with it."
  }),
  Object.freeze({
    id: "story-quests",
    primaryCue: "Start story",
    treatment: "The first recommended cover names its Start story or Carry on action; world filters and other covers remain quieter choices."
  }),
  Object.freeze({
    id: "reading-library",
    primaryCue: "Start reading",
    treatment: "The recommended book owns the one Start reading or Keep reading action; the shelf and reading goal remain quieter."
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
