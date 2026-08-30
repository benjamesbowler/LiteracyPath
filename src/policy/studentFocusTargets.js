import { APP_VIEWS } from "../appState/appViews.js";

export const STUDENT_FOCUS_TARGETS = Object.freeze({
  ASSIGNED_BOOK: "assigned_book",
  ARCADE_GAME: "arcade_game",
  READING_LIBRARY: "reading_library",
  LETTERS_PRACTICE: "letters_practice",
  SKILLS_ASSESSMENT: "skills_assessment"
});

export const STUDENT_FOCUS_TARGET_OPTIONS = Object.freeze([
  Object.freeze({
    id: STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT,
    label: "Skills Assessment",
    description: "Each student completes one assigned skills round independently."
  }),
  Object.freeze({
    id: STUDENT_FOCUS_TARGETS.ASSIGNED_BOOK,
    label: "One Guided Reading Book",
    description: "Every selected student reads the same book independently."
  }),
  Object.freeze({
    id: STUDENT_FOCUS_TARGETS.ARCADE_GAME,
    label: "One Learning Game",
    description: "Every selected student plays the same learning game."
  }),
  Object.freeze({
    id: STUDENT_FOCUS_TARGETS.READING_LIBRARY,
    label: "Reading Library",
    description: "Students can choose and read books, but cannot leave the library."
  }),
  Object.freeze({
    id: STUDENT_FOCUS_TARGETS.LETTERS_PRACTICE,
    label: "Letters Practice",
    description: "Students can practise letters and sounds, without Words or Games."
  })
]);

export function studentFocusTargetView(target) {
  switch (target) {
    case STUDENT_FOCUS_TARGETS.ASSIGNED_BOOK:
    case STUDENT_FOCUS_TARGETS.READING_LIBRARY:
      return APP_VIEWS.GUIDED_READING;
    case STUDENT_FOCUS_TARGETS.ARCADE_GAME:
    case STUDENT_FOCUS_TARGETS.LETTERS_PRACTICE:
      return APP_VIEWS.PHONICS_LEARN;
    case STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT:
      return APP_VIEWS.ASSESSMENT;
    default:
      return APP_VIEWS.STUDENT_HOME;
  }
}

export function isActiveStudentFocusSession(session) {
  if (!session || session.status !== "active") return false;
  const expiresAt = Date.parse(session.expires_at || session.expiresAt || "");
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function enforceStudentFocusView(requestedView, session) {
  if (!isActiveStudentFocusSession(session)) return requestedView;
  if (
    session.target === STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT
    && [APP_VIEWS.ASSESSMENT, APP_VIEWS.CHECKPOINT].includes(requestedView)
  ) {
    return requestedView;
  }
  return studentFocusTargetView(session.target);
}

export function studentFocusLabel(target) {
  return STUDENT_FOCUS_TARGET_OPTIONS.find(option => option.id === target)?.label || "Student session";
}
