export function countPhrase(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function progressPhrase(value, total) {
  return `${value} of ${total}`;
}

export const TEACHER_COPY = Object.freeze({
  common: Object.freeze({
    children: "children",
    child: "child",
    signIn: "Sign-in",
    results: "Results",
    check: "Check",
    tryAgain: "Try again",
    nothingLost: "Nothing is lost."
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
    label: "Classes",
    title: "Your class",
    descriptionWithClass: className => (
      `Add children, set up sign-in, and see how ${className} is doing.`
    ),
    descriptionWithoutClass: "Choose or create a class to begin.",
    contextLabel: "Current school and class",
    childCount: count => countPhrase(count, "child", "children")
  }),
  setup: Object.freeze({
    ariaLabel: "Class setup checklist",
    firstLabel: "Get set up",
    completeLabel: "Setup complete",
    firstTitle: "Get set up in four steps",
    completeTitle: "Your class is ready",
    firstBody: "Do these once, and results appear on their own.",
    completeBody: "Your class, children, sign-in pictures, and first saved check are ready.",
    completeState: "Done",
    nextState: "Next",
    laterState: "Later",
    progressLabel: (complete, total) => `${complete} of ${total} setup steps complete`,
    progressValue: (complete, total) => progressPhrase(complete, total),
    steps: Object.freeze([
      Object.freeze({
        id: "class",
        title: "Create your class",
        description: "Use the name your children know, like “Willow Class”."
      }),
      Object.freeze({
        id: "children",
        title: "Add your children",
        description: "Use first names or nicknames only, no surnames."
      }),
      Object.freeze({
        id: "sign-in",
        title: "Choose sign-in pictures",
        description: "Each child signs in by tapping three pictures. You choose them."
      }),
      Object.freeze({
        id: "check",
        title: "Do your first check with one child",
        description: "Results appear as soon as you save it."
      })
    ])
  }),
  classCode: Object.freeze({
    label: "Class code",
    help: "Children enter this on their device to sign in. Keep it inside the classroom.",
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
    privacy: "Children appear under friendly made-up nicknames — never real names.",
    toggle: "Show the whole school's board",
    toggleHelp: "Off means your class only.",
    confirm: "Show nickname-only scores from other classes at this school? No real names are shown."
  }),
  sync: Object.freeze({
    ariaLabel: "Saving and syncing",
    label: "Saving & syncing",
    title: "Are children's results reaching your dashboard?",
    range: days => `Devices used in the last ${days} days`,
    checking: "Checking",
    unavailable: "Can't check right now",
    error: "We couldn't reach the server. Nothing is lost: results are safe on the children's devices.",
    delivered: "Saved",
    pending: "Waiting to retry",
    recovered: "Saved after retry",
    possibleLoss: "May not be saved",
    noRecentData: "No recent device information is available yet.",
    healthy: "Results waiting to sync will retry automatically.",
    delayed: hours => `Some saved results have waited ${hours} hours to reach the dashboard.`,
    alert: "Some results may not have reached the dashboard. Check the shared device and its internet connection."
  }),
  metrics: Object.freeze({
    summaryAriaLabel: "Class summary",
    children: "Children",
    readyToSignIn: "Ready to sign in",
    havePlayed: "Have played",
    playedToday: "Played today",
    classAccuracy: "Class accuracy",
    notEnough: "Not enough results yet",
    equalChildren: "Averaging children equally",
    equalAnswers: "Averaging every answer equally",
    fairAverage: minimum => (
      `A class average appears once at least ${minimum} children have done enough checks to be measured fairly.`
    ),
    comparable: "Both class accuracy views use enough saved results to be compared fairly."
  }),
  groups: Object.freeze({
    ariaLabel: "Class groups",
    label: "Groups",
    description: "Tap a group to see just those children",
    everyone: "Everyone",
    needsHelp: "Needs help",
    notStarted: "Not started yet",
    playedToday: "Played today",
    suggested: "Suggested group",
    showAll: "Show everyone"
  }),
  roster: Object.freeze({
    manageTitle: "Manage children",
    manageBody: "Add, move, or archive children, and change their sign-in.",
    activeCount: count => countPhrase(count, "child", "children"),
    panelLabel: "Children",
    panelTitle: className => `Children${className ? ` — ${className}` : ""}`,
    inClass: count => `${countPhrase(count, "child", "children")} in this class.`,
    chooseClass: "Choose a class to load children.",
    privacy: "Use a familiar first name or classroom nickname. Do not enter a surname or other personal details.",
    displayName: "Child's display name",
    displayNamePlaceholder: "First name or classroom nickname",
    add: "Add child",
    childPreview: "Child preview",
    importTitle: "Import a class list",
    importBody: "Use a first column named “name”, or paste one display name per line. Add up to 40 children and remove surnames first.",
    namesLabel: "Children's names",
    activeFilter: "All children",
    signInMissingFilter: "Sign-in pictures missing",
    showing: (shown, total) => `Showing ${shown} of ${total} children`,
    firstTitle: className => `Add your first child to ${className}.`,
    firstBody: "Add one child above, or import a whole class list.",
    firstAction: "Add your first child"
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
    childrenLoad: "We couldn't load the children. Nothing is lost — check your internet and try again.",
    checkPaused: "This check paused.",
    checkPausedHelp: "Nothing is lost. Return to the child overview and start this check again."
  }),
  privacy: Object.freeze({
    title: name => `Export or delete ${name}'s data`,
    intro: days => `Check the request against school records before continuing. Aim to respond within ${days} days, or sooner where required.`,
    exportTitle: "Download a copy",
    exportBody: "Downloads a copy of the child's saved data and records that the request was completed.",
    exportAction: "Download child data",
    deleteTitle: "Delete permanently",
    deleteBody: "This removes the child and all saved results, reports, activity and progress. A minimal record of the request is kept.",
    prepareDelete: "Check deletion request",
    deleteAction: "Delete all child data",
    trackingTitle: "Request history",
    trackingLoading: "Loading request history…",
    trackingUnavailable: "We couldn't load request history. Nothing is lost. Try again before continuing.",
    trackingEmpty: "No earlier requests are recorded for this child."
  }),
  admin: Object.freeze({
    resetTitle: "Reset check results",
    resetBody: name => `This removes all saved check results, scores and progress for ${name}.`,
    resetKeeps: "The child, class, sign-in pictures, Guided Reading and Story Quest progress stay in place.",
    resetConfirm: "Type RESET to turn on the final button.",
    resetAction: "Reset check results"
  })
});
