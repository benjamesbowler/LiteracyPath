export function countPhrase(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function progressPhrase(value, total) {
  return `${value} of ${total}`;
}

export const TEACHER_COPY = Object.freeze({
  common: Object.freeze({
    students: "students",
    student: "student",
    signIn: "Sign-in",
    results: "Results",
    check: "Check",
    tryAgain: "Try again",
    nothingLost: "Nothing is lost.",
    showAll: count => `Show all ${count}`,
    showFewer: "Show fewer"
  }),
  today: Object.freeze({
    label: "Today",
    title: "Today",
    descriptionWithClass: className => (
      `See what ${className} needs today and choose the next action.`
    ),
    descriptionWithoutClass: "Choose a class to see today's next actions."
  }),
  classes: Object.freeze({
    label: "Students",
    title: "Students",
    descriptionWithClass: className => (
      `Add, update, move, or archive students in ${className}.`
    ),
    descriptionWithoutClass: "Choose or create a class to begin.",
    contextLabel: "Current school and class",
    childCount: count => countPhrase(count, "student", "students")
  }),
  setup: Object.freeze({
    ariaLabel: "Class setup checklist",
    firstLabel: "Get set up",
    completeLabel: "Setup complete",
    firstTitle: "Get set up in four steps",
    completeTitle: "Your class is ready",
    firstBody: "Do these once, and results appear on their own.",
    completeBody: "Your class, students, sign-in pictures, and first saved check are ready.",
    completeState: "Done",
    nextState: "Next",
    laterState: "Later",
    progressLabel: (complete, total) => `${complete} of ${total} setup steps complete`,
    progressValue: (complete, total) => progressPhrase(complete, total),
    signInGapTitle: count => (
      `${countPhrase(count, "student", "students")} still need sign-in pictures`
    ),
    signInGapBody: "They cannot sign in until each one has a set of pictures.",
    signInGapAction: "Give everyone sign-in pictures",
    steps: Object.freeze([
      Object.freeze({
        id: "class",
        title: "Create your class",
        description: "Use the name your students know, like “Willow Class”."
      }),
      Object.freeze({
        id: "students",
        title: "Add your students",
        description: "Use first names or nicknames only, no surnames."
      }),
      Object.freeze({
        id: "sign-in",
        title: "Choose sign-in pictures",
        description: "Each student signs in by tapping three pictures. You choose them."
      }),
      Object.freeze({
        id: "check",
        title: "Do your first check with one student",
        description: "Results appear as soon as you save it."
      })
    ])
  }),
  classCode: Object.freeze({
    label: "Class code",
    help: "Students enter this on their device to sign in. Keep it inside the classroom.",
    expiryLabel: "Code expires",
    expiryAriaLabel: "Choose when the class code expires",
    never: "Never",
    afterDays: days => `After ${days} days`,
    expiresAt: value => `Expires ${value}`,
    checking: "Checking recent sign-ins…",
    historyShow: "See sign-in history",
    historyHide: "Hide sign-in history",
    historyTitle: "Recent sign-ins",
    historyAriaLabel: "Class sign-in history",
    historyLoading: "Loading sign-in history…",
    historyEmpty: "No sign-ins recorded yet.",
    unusualTitle: "Unusual sign-in activity",
    safeSummary: accepted => `${accepted} accepted in the last 24 hours · no unusual activity`
  }),
  board: Object.freeze({
    label: "High-score board",
    classLabel: "Your class",
    schoolLabel: "Whole school",
    privacy: "Students appear under friendly made-up nicknames — never real names.",
    toggle: "Show the whole school's board",
    toggleHelp: "Off means your class only.",
    confirm: "Show nickname-only scores from other classes at this school? No real names are shown."
  }),
  sync: Object.freeze({
    ariaLabel: "Saving and syncing",
    label: "Saving & syncing",
    title: "Are students' results reaching your dashboard?",
    range: days => `Devices used in the last ${days} days`,
    checking: "Checking",
    unavailable: "Can't check right now",
    error: "We couldn't reach the server. Nothing is lost: results are safe on the students' devices.",
    delivered: "Saved",
    pending: "Waiting to retry",
    recovered: "Saved after retry",
    possibleLoss: "May not be saved",
    noRecentData: "No recent device information is available yet.",
    healthy: "Results waiting to sync will retry automatically.",
    delayed: hours => `Some saved results have waited ${hours} hours to reach the dashboard.`,
    alert: "Some results may not have reached the dashboard. Check the shared device and its internet connection."
  }),
  reportShell: Object.freeze({
    productLabel: "Student reports",
    navLabel: "Student reports",
    fallbackStudent: "Selected student",
    viewLabel: "Report view",
    viewHelp: "Choose the results you need.",
    aboutTitle: "About this report",
    aboutBody: "This shows which student, class, dates, results and privacy choices are included."
  }),
  reports: Object.freeze({
    accuracyFooter: "Accuracy colours show answer accuracy. Mastery also considers how often and how independently the student answered.",
    masteredDescription: "Secure across enough recent, independent answers.",
    developingDescription: "Seen, but not yet mastered.",
    yetToLearnDescription: "No saved results yet.",
    needsTeachingTitle: "Needs teaching",
    needsTeachingDescription: "Teach these next. Answers are below the level we can call developing.",
    practisingTitle: "Practising",
    practisingDescription: "On the way. Keep practising, no re-teaching needed yet.",
    masteredTitle: "Mastered",
    notEnoughYetTitle: "Not enough yet",
    notEnoughYetDescription: "Answered, but too few times to say either way. Not a gap.",
    yetToLearnTitle: "Yet to learn",
    overviewReconcile: (checked, total) => (
      `${checked} of ${total} items have saved answers. Every item appears in exactly one group below.`
    ),
    descriptiveElHelp: "These checks are reported separately. They do not change the Mastered, Practising, or Yet to learn totals.",
    skillsIntro: (seen, total) => (
      `${seen} of ${total} listed skills have saved results. Colours show answer accuracy. The status line also considers how often and how independently the student answered.`
    ),
    hfwIntro: seen => `${seen} of 100 high-frequency words have saved results.`,
    noSavedResults: "No saved results yet",
    unseenHelp: "Items not checked yet are grouped below.",
    skillsWithResults: "Skills with saved results",
    skillsNotSeen: "Skills not seen yet",
    hfwWithResults: "High-frequency words with saved results",
    hfwNotSeen: "High-frequency words not seen yet"
  }),
  metrics: Object.freeze({
    summaryAriaLabel: "Class summary",
    students: "Students",
    readyToSignIn: "Ready to sign in",
    havePlayed: "Have played",
    playedToday: "Played today",
    classAccuracy: "Class accuracy",
    notEnough: "Not enough results yet",
    equalChildren: "Averaging students equally",
    equalAnswers: "Averaging every answer equally",
    fairAverage: minimum => (
      `A class average appears once at least ${minimum} students have done enough checks to be measured fairly.`
    ),
    comparable: "Both class accuracy views use enough saved results to be compared fairly."
  }),
  intents: Object.freeze({
    progress: Object.freeze({
      eyebrow: "Reports",
      title: "Choose a student's report",
      description: "Open one simple report at a time. The EL formal report stays separate."
    }),
    resources: Object.freeze({
      eyebrow: "Resources",
      title: "Choose a teaching resource",
      description: "Open whole-class teaching resources. Per-student tools live in the Student panel."
    }),
    contextLabel: "Current teaching context",
    chooseClass: "Choose a class",
    classFieldLabel: "Class",
    studentFieldLabel: "Choose a student",
    studentPlaceholder: "Choose a student…",
    noStudentSelected: "No student selected",
    selectedStudent: name => `Student: ${name}`,
    clearStudent: "Clear selected student",
    noClassesTitle: "Create your class first",
    noClassesBody: "Everything on this page works on one class at a time. Make a class, add your students, and these tools open up.",
    noClassesAction: "Create your class",
    chooseClassTitle: "Choose a class",
    chooseClassBody: "Pick the class you are working with and its students appear here.",
    noStudentsTitle: className => `No students in ${className} yet`,
    noStudentsBody: "Add your students on the Students page, then come back.",
    noStudentsAction: "Add your students",
    classSummary: (className, count) => (
      `${className} · ${countPhrase(count, "student", "students")}`
    )
  }),
  groups: Object.freeze({
    ariaLabel: "Class groups",
    label: "Groups",
    description: "Tap a group to see just those students",
    everyone: "Everyone",
    needsHelp: "Needs help",
    notStarted: "Not started yet",
    playedToday: "Played today",
    suggested: "Suggested group",
    showAll: "Show everyone"
  }),
  roster: Object.freeze({
    manageTitle: "Manage students",
    manageBody: "Add, move, or archive students, and change their sign-in.",
    activeCount: count => countPhrase(count, "student", "students"),
    panelLabel: "Students",
    panelTitle: className => `Students${className ? ` — ${className}` : ""}`,
    inClass: count => `${countPhrase(count, "student", "students")} in this class.`,
    chooseClass: "Choose a class to load students.",
    privacy: "Use a familiar first name or classroom nickname. Do not enter a surname or other personal details.",
    displayName: "Student's display name",
    displayNamePlaceholder: "First name or classroom nickname",
    add: "Add student",
    childPreview: "Student preview",
    importTitle: "Import a class list",
    importBody: "Use a first column named “name”, or paste one display name per line. Add up to 40 students and remove surnames first.",
    namesLabel: "Students' names",
    activeFilter: "All students",
    signInMissingFilter: "Sign-in pictures missing",
    showing: (shown, total) => `Showing ${shown} of ${total} students`,
    firstTitle: className => `Add your first student to ${className}.`,
    firstBody: "Add one student above, or import a whole class list.",
    firstAction: "Add your first student"
  }),
  help: Object.freeze({
    checkGuide: "What each check measures",
    checkGuideClose: "Close check guide",
    checkGuideLabel: "Check help",
    checkGuideBody: "Plain explanations of what each check shows and what a missed answer may mean."
  }),
  errors: Object.freeze({
    pageLoad: "We couldn't load this page. Your class data is safe — check your internet and try again.",
    classesLoad: "We couldn't load your classes. Nothing is lost — check your internet and try again.",
    childrenLoad: "We couldn't load the students. Nothing is lost — check your internet and try again.",
    checkPaused: "This check paused.",
    checkPausedHelp: "Nothing is lost. Return to the student overview and start this check again."
  }),
  privacy: Object.freeze({
    title: name => `Export or delete ${name}'s data`,
    intro: days => `Check the request against school records before continuing. Aim to respond within ${days} days, or sooner where required.`,
    exportTitle: "Download a copy",
    exportBody: "Downloads a copy of the student's saved data and records that the request was completed.",
    exportAction: "Download student data",
    deleteTitle: "Delete permanently",
    deleteBody: "This removes the student and all saved results, reports, activity and progress. A minimal record of the request is kept.",
    prepareDelete: "Check deletion request",
    deleteAction: "Delete all student data",
    trackingTitle: "Request history",
    trackingLoading: "Loading request history…",
    trackingUnavailable: "We couldn't load request history. Nothing is lost. Try again before continuing.",
    trackingEmpty: "No earlier requests are recorded for this student."
  }),
  admin: Object.freeze({
    resetTitle: "Reset check results",
    resetBody: name => `This removes all saved check results, scores and progress for ${name}.`,
    resetKeeps: "The student, class, sign-in pictures, Guided Reading and Story Quest progress stay in place.",
    resetConfirm: "Type RESET to turn on the final button.",
    resetAction: "Reset check results"
  })
});
