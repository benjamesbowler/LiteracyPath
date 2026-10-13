export const TEACHER_WORKFLOW_COPY = Object.freeze({
  next: Object.freeze({
    resume: { label: "Resume session", reason: "Return to the unfinished activity before starting another." },
    retry: { label: "Try loading results", reason: "Some results could not be loaded. Reload them before choosing the next step." },
    review: { label: "Review results", reason: "Review the saved results together before choosing a teaching focus." },
    assess: { label: "Start assessment", reason: "Collect current independent answers before choosing what to teach next." },
    teach: { label: "Plan focused practice", reason: focus => `Model ${focus}, practise together, then try independently. A later assessment checks learning.` },
    continue: { label: "Continue teaching", reason: "No teaching need is flagged in these results. Continue teaching and assess a new skill when useful." }
  }),
  signIn: "Student sign-in",
  lesson: "Open lesson",
  help: "Help",
  cycle: "Class teaching cycle",
  cycleHint: "Used for new lessons and practice. Student progression stays separate.",
  practice: { kind: "Student devices", title: "Send practice", body: "Choose an activity for the class or a group. Review the students and activity before sending.", action: "Choose practice" },
  readingTogether: "Read together",
  readingTogetherHint: "Teacher turns the pages · up to six students",
  browse: "Browse books",
  support: "Learning support",
  record: "Student record",
  chooseSupport: "Choose a student to change learning support.",
  chooseSignIn: "Choose a student to manage sign-in, or print class sign-in cards.",
  classManagement: "Manage class",
  maintenanceHint: "Viewing a student does not select them for a group activity. Use the row checkboxes to choose a group.",
  reducedChoiceHint: "Reduced choices keeps Sound Seekers, Letters and Books on the student's home screen. This changes navigation, not learning records. Choose Use all student choices to restore every destination."
});
