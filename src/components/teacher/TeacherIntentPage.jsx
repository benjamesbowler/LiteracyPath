import { APP_VIEWS } from "../../appState/appViews.js";
import { TeacherSurfaceState } from "./ui/TeacherSurfaceState.jsx";
import {
  TeacherPageHeader,
  TeacherPageShell
} from "./ui/TeacherPrimitives.jsx";
import { TeacherProgressOverview } from "./TeacherProgressOverview.jsx";

const INTENT_COPY = Object.freeze({
  assess: {
    eyebrow: "Assessment hub",
    title: "Choose an assessment purpose",
    description: "Start with why you need evidence. The hub then opens the right route without asking you to learn internal product labels."
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
  onOpenAssessment,
  onOpenView,
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
        label: "Find the learner's starting point",
        description: "Use the shared literacy sequence to establish a consistent starting point across the class.",
        requiresStudent: true,
        onOpen: () => onOpenAssessment?.(false)
      },
      {
        id: "diagnostic-follow-up",
        category: "Diagnostic follow-up",
        label: "Investigate a specific gap",
        description: "Choose one skill when existing evidence points to a gap that needs a closer look.",
        requiresStudent: true,
        onOpen: () => onOpenAssessment?.(true)
      },
      {
        id: "progress-monitoring",
        category: "Progress monitoring",
        label: "Check change over time",
        description: "Use a consistent grade and assessment window to collect comparable follow-up evidence.",
        requiresStudent: true,
        onOpen: () => onOpenView?.(APP_VIEWS.EL_ASSESSMENTS)
      },
      {
        id: "practice",
        category: "Practice",
        label: "Plan practice, not a test",
        description: "Move to teaching resources and assigned rehearsal. Practice can guide support, but it is not formal assessment evidence.",
        requiresStudent: false,
        onOpen: () => onOpenView?.(APP_VIEWS.TEACHER_RESOURCES)
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
  classList = [],
  selectedClassId = "",
  onSelectClass,
  progressRows = [],
  selectedLearnerId = "",
  studentName = "",
  onSelectLearner,
  onClearLearner,
  onOpenAssessment,
  onOpenView,
  onOpenReports,
  onOpenGuidedReading,
  onOpenStoryQuests,
  onOpenWorksheets,
  onOpenPresent,
  surfaceState = "",
  surfaceStateDetail = "",
  onSurfaceStatePrimary,
  onSurfaceStateSecondary
}) {
  const copy = INTENT_COPY[intent];
  if (!copy) return null;
  const actions = buildIntentActions({
    intent,
    onOpenAssessment,
    onOpenView,
    onOpenReports,
    onOpenGuidedReading,
    onOpenStoryQuests,
    onOpenWorksheets,
    onOpenPresent
  });

  return (
    <TeacherPageShell
      className="teacher-intent-page"
      intent={intent}
    >
      <TeacherPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      >
        <div className="teacher-dashboard-context" aria-label="Current teaching context">
          <span>Current context</span>
          <strong>{className || "Choose a class"}</strong>
          <small>{studentName ? `Learner: ${studentName}` : "No learner selected"}</small>
        </div>
      </TeacherPageHeader>

      {surfaceState ? (
        <TeacherSurfaceState
          surface={intent}
          state={surfaceState}
          detail={surfaceStateDetail}
          onPrimaryAction={onSurfaceStatePrimary}
          onSecondaryAction={onSurfaceStateSecondary}
        />
      ) : (
        <>
          {intent === "progress" ? (
            <TeacherProgressOverview
              className={className}
              classList={classList}
              selectedClassId={selectedClassId}
              onSelectClass={onSelectClass}
              rows={progressRows}
              selectedLearnerId={selectedLearnerId}
              onSelectLearner={onSelectLearner}
              onClearLearner={onClearLearner}
              onOpenReports={onOpenReports}
            />
          ) : (
            <section className="teacher-intent-actions" aria-label={`${copy.eyebrow} tools`}>
              {actions.map(action => {
                const needsLearner = action.requiresStudent && !studentName;
                return (
                  <article className="teacher-action-card" key={action.id}>
                    <div>
                      <p className="panel-label">{action.category}</p>
                      <h3>{action.label}</h3>
                      <p>{action.description}</p>
                      {needsLearner && (
                        <small className="muted-text">Choose a learner to continue.</small>
                      )}
                    </div>
                    <button
                      className="lp-button lp-button-secondary"
                      disabled={needsLearner && !onOpenView}
                      onClick={needsLearner
                        ? () => onOpenView(APP_VIEWS.TEACHER_CLASSES)
                        : action.onOpen}
                      type="button"
                    >
                      {needsLearner ? "Choose learner" : "Open"}
                    </button>
                  </article>
                );
              })}
            </section>
          )}

          {intent === "assess" && (
            <details className="teacher-assessment-language-guide">
              <summary>Assessment language guide</summary>
              <div>
                <p>
                  Older records and training materials may use the labels below. The hub groups them by the
                  teacher decision they support.
                </p>
                <dl>
                  <div>
                    <dt>Checkpoints</dt>
                    <dd>Use Universal benchmark for a shared starting point or Diagnostic follow-up for one specific gap.</dd>
                  </div>
                  <div>
                    <dt>EL Checks</dt>
                    <dd>Use Progress monitoring when you need comparable evidence across a grade and assessment window.</dd>
                  </div>
                  <div>
                    <dt>Advanced Phonics</dt>
                    <dd>Use Diagnostic follow-up when a learner needs a closer look at phonics patterns.</dd>
                  </div>
                </dl>
              </div>
            </details>
          )}
        </>
      )}
    </TeacherPageShell>
  );
}
