const INTENT_COPY = Object.freeze({
  assess: {
    eyebrow: "Assess",
    title: "Choose the evidence you need",
    description: "Start with the purpose of the check, then open the right tool for the selected learner."
  },
  progress: {
    eyebrow: "Progress",
    title: "Turn evidence into a clear next step",
    description: "Review current evidence, formal reports, and complete exports without changing the selected class."
  },
  resources: {
    eyebrow: "Plan/Resources",
    title: "Prepare teaching and practice",
    description: "Open classroom resources in context, with learner-specific tools available when a learner is selected."
  }
});

function buildIntentActions({
  intent,
  onOpenCheckpoint,
  onOpenElBenchmark,
  onOpenReports,
  onOpenGuidedReading,
  onOpenStoryQuests,
  onOpenWorksheets,
  onOpenPresent
}) {
  if (intent === "assess") {
    return [
      {
        id: "universal-benchmark",
        category: "Universal benchmark",
        label: "Start or review a checkpoint",
        description: "Use the shared literacy sequence to establish the learner's current starting point.",
        requiresStudent: true,
        onOpen: onOpenCheckpoint
      },
      {
        id: "diagnostic-follow-up",
        category: "Diagnostic follow-up",
        label: "Investigate a specific gap",
        description: "Open the learner checkpoint workspace and choose the skill that needs closer evidence.",
        requiresStudent: true,
        onOpen: onOpenCheckpoint
      },
      {
        id: "progress-monitoring",
        category: "Progress monitoring",
        label: "Run an EL benchmark",
        description: "Use the formal grade-and-window assessment route for comparable follow-up evidence.",
        requiresStudent: true,
        onOpen: onOpenElBenchmark
      }
    ];
  }
  if (intent === "progress") {
    return [
      {
        id: "learner-reports",
        category: "Learner evidence",
        label: "Reports and formal exports",
        description: "Review the learner's evidence areas, formal EL reports, and complete downloads.",
        requiresStudent: true,
        onOpen: onOpenReports
      }
    ];
  }
  return [
    {
      id: "guided-reading",
      category: "Small-group teaching",
      label: "Guided Reading",
      description: "Open the selected learner's connected-text reading record and book tools.",
      requiresStudent: true,
      onOpen: onOpenGuidedReading
    },
    {
      id: "story-quests",
      category: "Assigned practice",
      label: "Story Quests",
      description: "Preview the selected learner's story practice and comprehension route.",
      requiresStudent: true,
      onOpen: onOpenStoryQuests
    },
    {
      id: "worksheets",
      category: "Print",
      label: "Worksheets",
      description: "Create printable practice directly from the curriculum sequence.",
      requiresStudent: false,
      onOpen: onOpenWorksheets
    },
    {
      id: "present",
      category: "Whole class",
      label: "Present",
      description: "Open projector-ready teaching slides for the current cycle.",
      requiresStudent: false,
      onOpen: onOpenPresent
    }
  ];
}

export function TeacherIntentPage({
  intent,
  className = "",
  studentName = "",
  onOpenCheckpoint,
  onOpenElBenchmark,
  onOpenReports,
  onOpenGuidedReading,
  onOpenStoryQuests,
  onOpenWorksheets,
  onOpenPresent
}) {
  const copy = INTENT_COPY[intent];
  if (!copy) return null;
  const actions = buildIntentActions({
    intent,
    onOpenCheckpoint,
    onOpenElBenchmark,
    onOpenReports,
    onOpenGuidedReading,
    onOpenStoryQuests,
    onOpenWorksheets,
    onOpenPresent
  });

  return (
    <main
      className="teacher-product-page teacher-intent-page"
      data-teacher-intent={intent}
    >
      <section className="teacher-page-header">
        <div>
          <p className="panel-label">{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <div className="teacher-dashboard-context" aria-label="Current teaching context">
          <span>Current context</span>
          <strong>{className || "Choose a class"}</strong>
          <small>{studentName ? `Learner: ${studentName}` : "No learner selected"}</small>
        </div>
      </section>

      <section className="teacher-intent-actions" aria-label={`${copy.eyebrow} tools`}>
        {actions.map(action => (
          <article className="teacher-action-card" key={action.id}>
            <div>
              <p className="panel-label">{action.category}</p>
              <h3>{action.label}</h3>
              <p>{action.description}</p>
              {action.requiresStudent && !studentName && (
                <small className="muted-text">Select a learner from Classes to use this tool.</small>
              )}
            </div>
            <button
              className="lp-button lp-button-secondary"
              disabled={action.requiresStudent && !studentName}
              onClick={action.onOpen}
              type="button"
            >
              Open
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
