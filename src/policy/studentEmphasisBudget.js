import { CHILD_SURFACE_ROUTES } from "./childSurfaceRules.js";

export const STUDENT_EMPHASIS_BUDGET_VERSION = "2026.10.01";

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
    primaryCue: "Play|Carry on",
    treatment: "One compact continuation row holds the recommended Play or Carry on action, exact saved point, state and reason. All eight picture destinations remain visible, with a separate replay target on each; the explicit reduced-choice preference preserves its smaller selection."
  }),
  Object.freeze({
    id: "phonics",
    primaryCue: "Practise",
    treatment: "The recommended current letter owns one cobalt Practise action; familiar review and the paged full alphabet remain quieter choices."
  }),
  Object.freeze({
    id: "arcade",
    primaryCue: "Play next|Carry on",
    treatment: "The recommended game's actual card carries the single next-game badge. The full entitled source catalogue stays visible together, with native vertical scrolling on smaller screens. Settings and personal progress are optional utilities; sample and teacher assignment restrictions remain intact."
  }),
  Object.freeze({
    id: "adventure-map",
    primaryCue: "This is your next unfinished stop",
    treatment: "One Carry on action opens the next unfinished station; the map marker names that same stop and other eligible games remain quieter."
  }),
  Object.freeze({
    id: "cycle-practice",
    primaryCue: "\\S",
    treatment: "The current cycle question owns the single clear response action; practice timing and progress remain visible without competing with the answer."
  }),
  Object.freeze({
    id: "skills-practice",
    primaryCue: "Play|Carry on",
    treatment: "One named Play or Carry on action stays in the initial usable pane and remains sticky while the child explores. Five pictured area choices and their complete skill lists use quieter selected-location cues and native vertical scrolling. Hear this skill, harder questions, progress and navigation stay subordinate."
  }),
  Object.freeze({
    id: "sound-seekers",
    primaryCue: "Start exploring|Carry on",
    treatment: "The campaign gives a new child one named Start exploring action; Woodland and navigation remain quieter alternatives."
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
    primaryCue: "Open your gift|Decorate",
    treatment: "One task leads the Hollow entry; three picture choices stay quiet. Placement controls appear only after Decorate."
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
