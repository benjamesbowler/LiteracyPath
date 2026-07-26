import { APP_VIEWS } from "../../appState/appViews.js";
import { TeacherSurfaceState } from "./ui/TeacherSurfaceState.jsx";
import {
  TeacherPageHeader,
  TeacherPageShell
} from "./ui/TeacherPrimitives.jsx";
import { TeacherProgressOverview } from "./TeacherProgressOverview.jsx";

const INTENT_COPY = Object.freeze({
  assess: {
    eyebrow: "Checks",
    title: "Choose one check",
    description: "Each option has one purpose. Choose a child first, then begin."
  },
  progress: {
    eyebrow: "Reports",
    title: "Choose a child’s report",
    description: "Open one simple report at a time. The EL formal report remains separate."
  },
  resources: {
    eyebrow: "Resources",
    title: "Choose a teaching resource",
    description: "Open classroom resources, with child-specific tools when a child is selected."
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
        id: "skills-check",
        category: "Literacy skills",
        label: "Skills check",
        description: "Check one child against the literacy sequence and save the exact answers.",
        actionLabel: "Open Skills check",
        requiresStudent: true,
        onOpen: () => onOpenAssessment?.(false)
      },
      {
        id: "el-formal",
        category: "School record",
        label: "EL formal check",
        description: "Run or review the standalone EL check required for school records.",
        actionLabel: "Open EL check",
        requiresStudent: true,
        onOpen: () => onOpenView?.(APP_VIEWS.EL_ASSESSMENTS)
      },
      {
        id: "focused-follow-up",
        category: "Specific teaching question",
        label: "Focused follow-up",
        description: "Check one known gap without running a broad check.",
        actionLabel: "Choose a skill",
        requiresStudent: true,
        onOpen: () => onOpenAssessment?.(true)
      },
      {
        id: "practice",
        category: "Practice",
        label: "Teaching and practice",
        description: "Open resources when you want to teach or rehearse, not record a check.",
        actionLabel: "Open resources",
        requiresStudent: false,
        onOpen: () => onOpenView?.(APP_VIEWS.TEACHER_RESOURCES)
      }
    ];
  }
  if (intent === "progress") {
    return [
      {
        id: "learner-reports",
        category: "Child results",
        label: "Reports and downloads",
        description: "Open Overview, Skills, HFW/sight words, or the standalone EL formal report.",
        actionLabel: "Open report",
        requiresStudent: true,
        onOpen: onOpenReports
      }
    ];
  }
  return [
    {
      id: "guided-reading",
      category: "Small-group teaching",
      label: "Guided reading",
      description: "Open the selected child's connected-text reading record and book tools.",
      requiresStudent: true,
      onOpen: onOpenGuidedReading
    },
    {
      id: "story-quests",
      category: "Assigned practice",
      label: "Story Quests",
      description: "Preview the selected child's story practice and comprehension route.",
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
  supabase,
  teacherId = "",
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
          <small>{studentName ? `Child: ${studentName}` : "No child selected"}</small>
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
              supabase={supabase}
              teacherId={teacherId}
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
                        <small className="muted-text">Choose a child to continue.</small>
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
                      {needsLearner ? "Choose child" : action.actionLabel || "Open"}
                    </button>
                  </article>
                );
              })}
            </section>
          )}

        </>
      )}
    </TeacherPageShell>
  );
}
