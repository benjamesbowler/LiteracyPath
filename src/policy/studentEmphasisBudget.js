import { CHILD_SURFACE_ROUTES } from "./childSurfaceRules.js";

export const STUDENT_EMPHASIS_BUDGET_VERSION = "2026.07.24";

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
    id: "phonics",
    primaryCue: "Start here",
    treatment: "The next available letter has the only warm focus field and explicit start badge."
  }),
  Object.freeze({
    id: "arcade",
    primaryCue: "Play next",
    treatment: "The next unplayed game keeps full-colour art and a double highlight; other covers are visually quieter."
  }),
  Object.freeze({
    id: "adventure-map",
    primaryCue: "Go next",
    treatment: "The current stop alone keeps the persistent sign, double ring, avatar, and go-next badge."
  }),
  Object.freeze({
    id: "sound-seekers",
    primaryCue: "Hatch my creature",
    treatment: "The full-width hatch action remains the strongest colour and scale after creature choices."
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
