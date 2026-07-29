export function countPhrase(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function progressPhrase(value, total) {
  return `${value} of ${total}`;
}

const GUIDED_READING_NEED_LABELS = Object.freeze({
  "initial-sounds": "initial sounds",
  "final-sounds": "final sounds",
  rhyming: "rhyming",
  "cvc-short-vowels": "CVC words and short vowels",
  "high-frequency-words": "high-frequency words",
  digraphs: "digraphs",
  blends: "blends",
  "long-vowels": "long vowels and silent e",
  "vowel-teams": "vowel teams",
  "r-controlled-vowels": "r-controlled vowels"
});

const GUIDED_READING_MICROPHASE_LABELS = Object.freeze({
  "digraphs-and-blends": "Digraphs and blends",
  "cvc-short-vowels": "CVC words and short vowels",
  "high-frequency-fluency": "High-frequency-word fluency",
  "early-reading": "Early reading"
});

function guidedReadingPatternLabel(value = "") {
  const pattern = String(value || "").trim().toLowerCase().replace(/_/g, "-");
  if (!pattern || pattern === "other") return "";
  if (pattern === "cvc") return "CVC words";
  if (pattern === "short-vowel-cvc") return "short-vowel CVC words";
  if (pattern === "initial-blend") return "initial blends";
  if (pattern === "final-blend") return "final blends";
  if (pattern === "initial-digraph") return "initial digraphs";
  if (pattern === "final-digraph") return "final digraphs";
  if (pattern === "complex-final-sound") return "complex final sounds";
  if (pattern === "silent-e") return "silent e";
  if (pattern === "vowel-team") return "vowel teams";
  if (pattern === "bossy-r" || pattern === "r-controlled") return "r-controlled vowels";

  const shortVowel = pattern.match(/^short-([aeiou])$/u);
  if (shortVowel) return `short ${shortVowel[1]} words`;

  const digraph = pattern.match(/^digraph-([a-z]+)$/u);
  if (digraph) return `“${digraph[1]}” digraph`;

  const initialBlend = pattern.match(/^initial-blend-([a-z]+)$/u);
  if (initialBlend) return `“${initialBlend[1]}” initial blend`;

  const finalBlend = pattern.match(/^final-blend-([a-z]+)$/u);
  if (finalBlend) return `“${finalBlend[1]}” final blend`;

  const vowelTeam = pattern.match(/^vowel-team-([a-z]+)$/u);
  if (vowelTeam) return `“${vowelTeam[1]}” vowel team`;

  const rControlled = pattern.match(/^r-controlled-([a-z]+)$/u);
  if (rControlled) return `“${rControlled[1]}” r-controlled vowel`;

  return "";
}

export const TEACHER_COPY = Object.freeze({
  common: Object.freeze({
    students: "students",
    student: "student",
    signIn: "Sign-in",
    results: "Results",
    check: "Assess",
    tryAgain: "Try again",
    nothingLost: "Nothing is lost.",
    showAll: count => `Show all ${count}`,
    showFewer: "Show fewer"
  }),
  today: Object.freeze({
    title: "Start with these students",
    description: "Two urgent lists, capped at three names each. Everything else is one click away.",
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
    completeBody: "Your class, students, sign-in pictures, and first saved assessment are ready.",
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
        id: "assessment",
        title: "Do your first assessment with one student",
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
    unavailable: "Can't connect right now",
    error: "We couldn't confirm whether recent results reached this dashboard. Reconnect the shared device and try again before relying on these figures.",
    delivered: "Saved",
    pending: "Waiting to retry",
    recovered: "Saved after retry",
    possibleLoss: "May not be saved",
    noRecentData: "No recent device information is available yet.",
    healthy: "Results waiting to sync will retry automatically.",
    delayed: hours => `Some saved results have waited ${hours} hours to reach the dashboard.`,
    alert: "Some results may not have reached the dashboard. Make sure the shared device is online."
  }),
  reportShell: Object.freeze({
    productLabel: "Student results",
    navLabel: "Student reports",
    fallbackStudent: "Selected student",
    viewLabel: "Choose a report",
    viewHelp: "Start with Summary. Open detail only when you need it.",
    aboutTitle: "About this report",
    aboutBody: "Review the student, class, result dates and information included in this report."
  }),
  reports: Object.freeze({
    accuracyFooter: "Answer accuracy and learning status are shown separately. A high percentage alone does not prove that learning is secure.",
    masteredDescription: "Enough saved results currently support a secure judgement.",
    developingDescription: "The student has started this and is still building consistency.",
    yetToLearnDescription: "This has not been checked yet.",
    needsTeachingTitle: "Needs support",
    needsTeachingDescription: "Review these first and assess again after giving support.",
    practisingTitle: "Developing",
    practisingDescription: "The student is making progress but is not secure yet.",
    masteredTitle: "Secure",
    notEnoughYetTitle: "Not enough results",
    notEnoughYetDescription: "There are some answers, but not enough for a learning judgement.",
    yetToLearnTitle: "Not checked",
    overviewReconcile: (checked, total) => (
      `${checked} of ${total} items have saved answers. Every item appears in exactly one group below.`
    ),
    descriptiveElHelp: "These assessments are reported separately. They do not change the Secure, Developing, or Not checked totals.",
    skillsIntro: (seen, total) => (
      `${seen} of ${total} listed skills have saved results. Each item shows answer accuracy and learning status separately.`
    ),
    hfwIntro: (seen, total) => (
      `${seen} of ${total} listed word assessments have saved results. Reading, sentence and spelling results stay separate.`
    ),
    noSavedResults: "No saved results yet",
    unseenHelp: "Items not checked yet are grouped below.",
    skillsWithResults: "Skills with saved results",
    skillsNotSeen: "Skills not checked yet",
    hfwWithResults: "High-frequency words with saved results",
    hfwNotSeen: "High-frequency words not checked yet",
    // ── Class report (Reports › whole class) ──────────────────────────────
    // The five-way split on the class report counts STUDENTS, so its notes
    // name students rather than reusing the single-student wording above.
    classSplitReconcile: (assessed, total) => (
      `${assessed} of ${total} students have saved answers. Every student appears in exactly one group.`
    ),
    classStatusNotes: Object.freeze({
      needs_support: "Review these first and assess again after giving support.",
      developing: "Making progress but not secure yet.",
      on_track: "Enough saved results support a secure judgement.",
      not_enough_evidence: "Some answers, but not enough for a judgement.",
      not_started: "These students have not been assessed yet."
    }),
    accuracySeparateNote: "Accuracy and learning status are shown separately.",
    classAccuracyUnavailable: "No class accuracy figure yet.",
    classSkillsAssessed: (assessed, total) => `${assessed} of ${total}`,
    elBenchmarkFooter: "EL benchmark assessments are reported separately. They do not change the Secure, Developing or Not checked totals."
  }),
  formalEl: Object.freeze({
    choosePeriodIntro: "Choose one grade and time of year before creating a class PDF or spreadsheet.",
    savedAssessmentCount: count => countPhrase(
      count,
      "saved EL assessment",
      "saved EL assessments"
    ),
    noMatchingAssessments: "No matching saved EL assessments",
    noCompletedAssessments: "No completed EL assessments",
    periodOptionCount: count => countPhrase(
      count,
      "saved assessment",
      "saved assessments"
    ),
    resultsIncludedTitle: "Results included",
    resultsIncludedBody: "This document includes only saved EL assessments for the selected grade and time of year.",
    gradeAndTimeLabel: "Grade and time of year",
    savedAssessmentsIncludedLabel: "Saved EL assessments included",
    latestResultBody: "Latest saved result for the selected grade and time of year. “Not checked” means there is no matching saved assessment.",
    noStudentsForPeriod: "No students are available for this class, grade and time of year.",
    suggestedStageNote: "A suggested reading stage is provisional until a teacher confirms it.",
    includedEvidenceBody: (scopeLabel, periodLabel) => {
      const period = String(periodLabel || "").trim();
      const periodText = !period || /^all(?:\s+time|\s+matching.*)?$/iu.test(period)
        ? ""
        : ` during ${period.toLocaleLowerCase()}`;
      return `Only saved EL results for ${scopeLabel}${periodText} are included.`;
    },
    assessmentPlanLabel: "Assessment plan",
    assessmentPlanAriaLabel: "Assessment plan and progress",
    startingReadingStage: (period, stage) => (
      `${period} · starting reading stage: ${stage || "Provisional"}`
    ),
    confirmedReadingStage: stage => `Teacher-confirmed reading stage: ${stage}`,
    suggestedReadingStage: stage => `Suggested reading stage: ${stage} (not yet confirmed)`,
    readingStageLabel: "Reading stage",
    nextStepDecisionLabel: "Next-step decision",
    nextStepDecisionAvailableLabel: "Next-step decision available"
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
      `A class average appears once at least ${minimum} students have done enough assessments to be measured fairly.`
    ),
    comparable: "Both class accuracy views use enough saved results to be compared fairly."
  }),
  intents: Object.freeze({
    resources: Object.freeze({
      eyebrow: "Resources",
      title: "Teach, print, project",
      // The teaching cycle comes from the shared context bar above the page, so
      // the subheading names it instead of making the teacher look it up.
      description: cycleLabel => (
        cycleLabel
          ? `Whole-class tools, already set to ${cycleLabel}. Per-student tools live in the Student panel.`
          : "Whole-class tools for the class in the bar above. Per-student tools live in the Student panel."
      ),
      tools: Object.freeze({
        present: Object.freeze({
          kind: "Whole class",
          title: "Present",
          body: "Projector-ready slides for the current teaching cycle. Opens full screen with keyboard control.",
          bullets: Object.freeze([
            "Sound cards, blending, dictation",
            "Class word bank from saved results",
            "Works on an interactive whiteboard"
          ]),
          action: cycleNumber => (
            cycleNumber ? `Open Cycle ${cycleNumber} slides` : "Open the slides"
          )
        }),
        worksheets: Object.freeze({
          kind: "Print",
          title: "Worksheets",
          body: "Printable practice built from what the class has actually been taught. Every word is decodable at the chosen stop.",
          bullets: Object.freeze([
            "Whole class or a suggested group",
            "Prints at the lowest member's stop",
            "Answer sheet included"
          ]),
          action: "Build a worksheet"
        }),
        guidedReading: Object.freeze({
          kind: "Small group",
          title: "Guided reading",
          body: "Levelled books matched to saved reading history and word difficulty, with teacher notes and line focus.",
          bullets: Object.freeze([
            "Levels A to F",
            "Teacher notes and word taps",
            "Saves a reading record"
          ]),
          action: "Open the reader"
        })
      }),
      shelfTitle: "Suggested next books — Level C",
      shelfAction: "Open reader",
      shelfActionFor: title => `Open reader: ${title}`,
      shelfLoading: "Getting the book list...",
      // A book list that failed to arrive is not a book list that is empty.
      shelfFailed: "The book list could not be loaded. The reader still opens from the Guided reading card above.",
      shelfEmpty: "No Level C books are ready to suggest yet.",
      toolsLabel: "Whole-class tools"
    }),
    contextLabel: "Current teaching context",
    chooseClass: "Choose a class",
    classFieldLabel: "Class",
    noClassesTitle: "Create your class first",
    noClassesBody: "Everything on this page works on one class at a time. Make a class, add your students, and these tools open up.",
    noClassesAction: "Create your class",
    chooseClassTitle: "Choose a class",
    chooseClassBody: "Pick the class you are working with and its students appear here."
  }),
  groups: Object.freeze({
    ariaLabel: "Class groups",
    label: "Groups",
    description: "Tap a group to see just those students",
    everyone: "Everyone",
    needsHelp: "Needs help",
    notStarted: "No scored answers",
    playedToday: "Played today",
    suggested: "Suggested group",
    showAll: "Show everyone"
  }),
  roster: Object.freeze({
    manageTitle: "Add students and set up sign-in",
    manageBody: "Open only when the class list or sign-in pictures need changing.",
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
    archivedSummary: count => `Archived students (${count})`,
    archivedHelp: "Archived students cannot sign in, but their saved results remain. Restore a student to return them to this class.",
    archivedSearchLabel: "Search archived students",
    archivedSearchPlaceholder: "Search archived display names",
    archivedShowing: (start, end, total) => (
      `Showing ${start}–${end} of ${total} matching archived students`
    ),
    archivedNoMatchesTitle: "No archived students found",
    archivedNoMatches: "No archived students match this search.",
    archivedClearSearch: "Clear archived search",
    firstTitle: className => `Add your first student to ${className}.`,
    firstBody: "Add one student above, or import a whole class list.",
    firstAction: "Add your first student"
  }),
  guidedReading: Object.freeze({
    suggestionLabel: "Suggested next",
    suggestionTitle: "Books to consider next",
    descriptionWithFocus: (studentName, focus, level) => (
      `These Level ${level} books fit ${studentName}'s current focus: ${focus}. `
      + "Saved reading history and word difficulty are also considered."
    ),
    descriptionWithoutFocus: level => (
      `These Level ${level} books use saved reading history and word difficulty. `
      + "Choose another level if your own reading work points elsewhere."
    ),
    descriptionWithoutResults: level => (
      `Saved assessment results are not available. These Level ${level} suggestions use reading history and word difficulty only. `
      + "Choose another level if needed."
    ),
    needLabel: value => GUIDED_READING_NEED_LABELS[value] || "",
    microphaseLabel: value => GUIDED_READING_MICROPHASE_LABELS[value] || "Early reading",
    patternLabel: guidedReadingPatternLabel,
    bookFocus: labels => `Book focus: ${labels.join(" · ")}`,
    levelReason: (level, source) => (
      source === "teacher-set"
        ? `Level ${level} was chosen for this student.`
        : source === "saved-reading"
          ? `Level ${level} matches the student's latest saved reading.`
          : `Level ${level} is used because no earlier reading level is saved.`
    ),
    matchedFocusReason: labels => (
      labels.length
        ? `The book supports ${labels.join(" and ")}.`
        : "No exact skill match is claimed for this book."
    ),
    confidenceWithResults: "This is a starting suggestion based on saved results and book features. Compare it with what you notice while reading together.",
    confidenceWithoutResults: "No assessment result was used for this suggestion. Review the level and book fit before using it.",
    nextStep: "Read together, note any words that need support, and use the saved reading record when choosing the next book.",
    unavailableTitle: "No reviewed guided reading books are available right now",
    unavailableBody: "The book library is temporarily unavailable while content is reviewed. No reading records are affected. Try again later.",
    summarySaved: "Reading summary saved.",
    controls: Object.freeze({
      loadingPage: "Loading page",
      stopReading: "Stop reading",
      readPage: "Read page",
      loadingBook: "Loading book",
      stopBook: "Stop book",
      readWholeBook: "Read whole book",
      teacherNotes: "Teacher notes",
      lineFocus: "Line focus",
      fullScreen: "Full screen",
      exitFullScreen: "Exit",
      closeReader: "Close reader",
      readingMode: "Reading mode",
      markingMode: "Marking mode",
      previousPage: "Previous page",
      nextPage: "Next page",
      finishBook: "Finish book",
      backToLibrary: "Back to library"
    })
  }),
  help: Object.freeze({
    checkGuide: "What each assessment measures",
    checkGuideClose: "Close assessment guide",
    checkGuideLabel: "Assessment help",
    checkGuideBody: "Plain explanations of what each assessment shows and what a missed answer may mean."
  }),
  errors: Object.freeze({
    pageLoad: "We couldn't load this page. Your class data is safe — make sure you're online and try again.",
    classesLoad: "We couldn't load your classes. Nothing is lost — make sure you're online and try again.",
    childrenLoad: "We couldn't load the students. Nothing is lost — make sure you're online and try again.",
    checkPaused: "This assessment paused.",
    checkPausedHelp: "Nothing is lost. Return to the student overview and start this assessment again."
  }),
  privacy: Object.freeze({
    title: name => `Export or delete ${name}'s data`,
    intro: days => `Review the request against school records before continuing. Aim to respond within ${days} days, or sooner where required.`,
    exportTitle: "Download a copy",
    exportBody: "Creates a copy of the student's saved information and records that the school completed the request.",
    exportAction: "Download student data",
    deleteTitle: "Delete permanently",
    deleteBody: "This removes the student and all saved results, reports, activity and progress. The school keeps only the date, outcome and reason for the request.",
    deleteComplete: name => (
      `${name}'s data and saved results were deleted permanently. `
      + "The school keeps only the date, outcome and reason for the deletion request."
    ),
    prepareDelete: "Review deletion request",
    deleteAction: "Delete all student data",
    trackingTitle: "Privacy request history",
    trackingLoading: "Loading privacy request history…",
    trackingUnavailable: "We couldn't load the privacy request history. Nothing is lost. Try again before continuing.",
    trackingEmpty: "No earlier privacy requests are recorded for this student."
  }),
  admin: Object.freeze({
    resetTitle: "Reset practice progress",
    resetBody: name => `This clears ${name}'s current skill and practice progress. They will need to sign in again.`,
    resetKeeps: "Completed assessments and reports, the student profile, class, sign-in pictures, Guided Reading and Story Quest progress stay in place.",
    resetConfirm: "Type RESET to turn on the final button.",
    resetAction: "Reset practice progress"
  })
});
