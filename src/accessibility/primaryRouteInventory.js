export const A11Y_VIEWPORTS = Object.freeze([
  Object.freeze({ id: "desktop", width: 1280, height: 900 }),
  Object.freeze({ id: "tablet-portrait", width: 768, height: 1024 }),
  Object.freeze({ id: "tablet-landscape", width: 1024, height: 768 })
]);

export const A11Y_PRIMARY_ROUTES = Object.freeze([
  Object.freeze({ id: "student-login", audience: "student", url: "/preview/child-surfaces.html?surface=student-login" }),
  Object.freeze({ id: "student-home", audience: "student", url: "/preview/child-surfaces.html?surface=student-home" }),
  Object.freeze({
    id: "phonics",
    audience: "student",
    url: "/preview/child-surfaces.html?surface=phonics",
    settledSelector: ".phonics-picker h1"
  }),
  Object.freeze({ id: "arcade", audience: "student", url: "/preview/child-surfaces.html?surface=arcade" }),
  Object.freeze({ id: "adventure-map", audience: "student", url: "/preview/child-surfaces.html?surface=adventure-map" }),
  Object.freeze({ id: "sound-seekers", audience: "student", url: "/preview/child-surfaces.html?surface=sound-seekers" }),
  Object.freeze({ id: "story-quests", audience: "student", url: "/preview/child-surfaces.html?surface=story-quests" }),
  Object.freeze({ id: "reading-library", audience: "student", url: "/preview/child-surfaces.html?surface=reading-library" }),
  Object.freeze({ id: "my-hollow", audience: "student", url: "/preview/child-surfaces.html?surface=my-hollow" }),
  Object.freeze({ id: "teacher-dashboard", audience: "teacher", url: "/preview/teacher-a11y.html?surface=today" }),
  Object.freeze({ id: "teacher-children", audience: "teacher", url: "/preview/teacher-a11y.html?surface=classes" }),
  Object.freeze({ id: "teacher-checks", audience: "teacher", url: "/preview/teacher-a11y.html?surface=assess" }),
  Object.freeze({ id: "teacher-reports", audience: "teacher", url: "/preview/teacher-a11y.html?surface=progress" }),
  Object.freeze({ id: "teacher-resources", audience: "teacher", url: "/preview/teacher-a11y.html?surface=resources" }),
  Object.freeze({ id: "teacher-settings", audience: "teacher", url: "/preview/teacher-a11y.html?surface=settings" }),
  Object.freeze({ id: "teacher-report", audience: "teacher", url: "/preview/teacher-a11y.html?surface=report" }),
  Object.freeze({ id: "teacher-assessment", audience: "teacher", url: "/preview/teacher-a11y.html?surface=assessment" }),
  Object.freeze({ id: "teacher-guided-reading", audience: "teacher", url: "/preview/teacher-a11y.html?surface=guided-reading" })
]);

export const A11Y_KEY_MODAL_STATES = Object.freeze([
  Object.freeze({
    id: "teacher-question-guide",
    url: "/preview/teacher-a11y.html?surface=classes",
    openSummary: "Groups and assessment guide",
    openControl: "What each assessment measures",
    dialogName: "What each assessment measures"
  }),
  // The student panel is no longer a drawer dialog: the v2 Students screen puts
  // it beside the roster as a labelled region, so selecting a row swaps it with
  // no layer, no focus move and no scroll jump.
  Object.freeze({
    id: "teacher-learner-drawer",
    url: "/preview/teacher-a11y.html?surface=classes&learner=1",
    dialogName: "Student details: Aarav",
    regionRole: true
  }),
  Object.freeze({
    id: "teacher-child-options",
    url: "/preview/teacher-a11y.html?surface=classes&learner=1",
    openSummary: "More for Aarav",
    openControl: "Student settings",
    dialogName: "Options for Aarav"
  }),
  Object.freeze({
    id: "teacher-assessment-discontinue",
    url: "/preview/teacher-a11y.html?surface=assessment",
    openSummary: "More options",
    openControl: "Stop assessment early",
    dialogName: "Discontinue and save",
    regionRole: true
  }),
  Object.freeze({
    id: "sound-seekers-creator",
    url: "/preview/child-surfaces.html?surface=sound-seekers",
    dialogName: "Who will you be?"
  }),
  Object.freeze({
    id: "arcade-game",
    url: "/preview/game-overlay.html?game=sound-racer",
    dialogName: "Sound Racer"
  }),
  Object.freeze({
    id: "arcade-resume",
    url: "/preview/game-overlay.html?game=sound-racer&resume=1",
    dialogName: "Resume Sound Racer",
    alertDialog: true
  })
]);

export const A11Y_KEY_INTERACTIONS = Object.freeze([
  Object.freeze({
    id: "arcade-high-scores",
    url: "/preview/child-surfaces.html?surface=arcade",
    triggerName: "High Scores",
    regionName: "High scores"
  })
]);

export function validateA11yInventory() {
  const rows = [...A11Y_PRIMARY_ROUTES, ...A11Y_KEY_MODAL_STATES, ...A11Y_KEY_INTERACTIONS];
  const ids = rows.map(row => row.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Accessibility inventory ids must be unique.");
  }
  if (!A11Y_PRIMARY_ROUTES.some(row => row.audience === "student")) {
    throw new Error("Accessibility inventory must include student routes.");
  }
  if (!A11Y_PRIMARY_ROUTES.some(row => row.audience === "teacher")) {
    throw new Error("Accessibility inventory must include teacher routes.");
  }
  if (A11Y_VIEWPORTS.length !== 3 || !A11Y_VIEWPORTS.some(row => row.id === "desktop")
    || !A11Y_VIEWPORTS.some(row => row.id === "tablet-portrait")
    || !A11Y_VIEWPORTS.some(row => row.id === "tablet-landscape")) {
    throw new Error("Accessibility inventory must cover laptop and both iPad orientations.");
  }
  return true;
}
