export const TEACHER_SURFACE_IDS = Object.freeze([
  "today",
  "classes",
  "assess",
  "progress",
  "resources"
]);

export const TEACHER_SURFACE_STATE_IDS = Object.freeze([
  "loading",
  "empty",
  "partial",
  "offline",
  "denied",
  "conflict",
  "expired",
  "retry-success"
]);

const SHARED_STATE_META = Object.freeze({
  loading: {
    marker: "Loading",
    tone: "pending",
    role: "status",
    live: "polite",
    busy: true
  },
  empty: {
    marker: "Ready to begin",
    tone: "neutral",
    role: "status",
    live: "polite"
  },
  partial: {
    marker: "Some data available",
    tone: "warning",
    role: "status",
    live: "polite"
  },
  offline: {
    marker: "Offline",
    tone: "warning",
    role: "status",
    live: "polite"
  },
  denied: {
    marker: "Access needed",
    tone: "danger",
    role: "alert",
    live: "assertive"
  },
  conflict: {
    marker: "Review required",
    tone: "danger",
    role: "alert",
    live: "assertive"
  },
  expired: {
    marker: "Session ended",
    tone: "danger",
    role: "alert",
    live: "assertive"
  },
  "retry-success": {
    marker: "Up to date",
    tone: "success",
    role: "status",
    live: "polite"
  }
});

const SURFACE_COPY = Object.freeze({
  today: {
    label: "Today",
    states: {
      loading: {
        title: "Building today's teaching brief",
        body: "We are checking recent learner evidence and preparing the actions that need attention first."
      },
      empty: {
        title: "No urgent actions today",
        body: "There is no recent evidence that needs immediate follow-up. You can review the class or prepare the next lesson.",
        primaryLabel: "Review class activity"
      },
      partial: {
        title: "Today's brief is incomplete",
        body: "Recent evidence is available for some learners, but one or more class updates have not arrived yet.",
        preserved: "The actions shown are based only on the evidence currently available.",
        primaryLabel: "Review available actions",
        secondaryLabel: "Try missing updates again"
      },
      offline: {
        title: "Today's brief cannot refresh offline",
        body: "You can read the last brief saved on this device. New learner activity will appear after the connection returns.",
        preserved: "The last saved brief remains available and will not be overwritten.",
        primaryLabel: "Use saved brief",
        secondaryLabel: "Try connection again"
      },
      denied: {
        title: "You cannot view this class brief",
        body: "Your account no longer has access to the selected class. No learner details have been displayed.",
        primaryLabel: "Choose another class",
        secondaryLabel: "Request access"
      },
      conflict: {
        title: "Today's brief changed on another device",
        body: "A newer class update arrived while this page was open. Review it before acting on the earlier brief.",
        preserved: "Your current notes remain on this device until you choose what to keep.",
        primaryLabel: "Review latest brief",
        secondaryLabel: "Keep my notes"
      },
      expired: {
        title: "Sign in again to view today's brief",
        body: "Your session ended before the latest learner evidence could be confirmed.",
        preserved: "No class data was changed.",
        primaryLabel: "Sign in again",
        secondaryLabel: "Return to teacher home"
      },
      "retry-success": {
        title: "Today's brief is up to date",
        body: "The missing learner updates arrived and today's actions now use the latest evidence.",
        primaryLabel: "Continue to today's actions"
      }
    }
  },
  classes: {
    label: "Classes",
    states: {
      loading: {
        title: "Loading classes and learners",
        body: "We are retrieving the current roster, learner access details, and class settings."
      },
      empty: {
        title: "No classes yet",
        body: "Create a class to add learners, prepare sign-in cards, and begin collecting evidence.",
        primaryLabel: "Create a class"
      },
      partial: {
        title: "Some roster details are missing",
        body: "Learner names are available, but one or more progress, login, or activity fields could not be loaded.",
        preserved: "Available roster details remain usable; missing values are not treated as zero.",
        primaryLabel: "Use available roster",
        secondaryLabel: "Try missing details again"
      },
      offline: {
        title: "Roster changes need a connection",
        body: "You can read the roster saved on this device, but adding, transferring, or archiving learners is paused.",
        preserved: "No queued roster change will be submitted without confirmation.",
        primaryLabel: "View saved roster",
        secondaryLabel: "Try connection again"
      },
      denied: {
        title: "You cannot manage this class",
        body: "Your account does not have roster permission for the selected class. Learner access details remain hidden.",
        primaryLabel: "Choose another class",
        secondaryLabel: "Request roster access"
      },
      conflict: {
        title: "The roster changed while you were editing",
        body: "Another authorised teacher saved a newer version of this class roster.",
        preserved: "Your unsaved names remain available for comparison.",
        primaryLabel: "Compare roster changes",
        secondaryLabel: "Keep my draft"
      },
      expired: {
        title: "Sign in again to manage classes",
        body: "Your session ended before the roster action could be confirmed.",
        preserved: "The roster action was not applied.",
        primaryLabel: "Sign in again",
        secondaryLabel: "Return to teacher home"
      },
      "retry-success": {
        title: "Class roster is up to date",
        body: "The latest learners, access details, and class settings are now available.",
        primaryLabel: "Continue managing class"
      }
    }
  },
  assess: {
    label: "Assess",
    states: {
      loading: {
        title: "Preparing assessment choices",
        body: "We are loading the selected learner's current evidence and the assessments that fit this context."
      },
      empty: {
        title: "No learner selected for assessment",
        body: "Choose a learner before starting a benchmark, diagnostic follow-up, or progress check.",
        primaryLabel: "Choose a learner"
      },
      partial: {
        title: "Assessment context is incomplete",
        body: "The learner and available checks loaded, but some earlier evidence could not be retrieved.",
        preserved: "You can assess now, but comparison guidance will use only the evidence shown.",
        primaryLabel: "Choose an available assessment",
        secondaryLabel: "Try earlier evidence again"
      },
      offline: {
        title: "Assessments cannot start offline",
        body: "Starting now could leave formal evidence incomplete, so assessment controls are paused until the connection returns.",
        preserved: "Previously saved assessment evidence remains unchanged.",
        primaryLabel: "Review saved evidence",
        secondaryLabel: "Try connection again"
      },
      denied: {
        title: "You cannot assess this learner",
        body: "Your account no longer has access to this learner's assessment record. No assessment was started.",
        primaryLabel: "Choose another learner",
        secondaryLabel: "Request assessment access"
      },
      conflict: {
        title: "A newer assessment result is available",
        body: "Another authorised session saved evidence for this learner while this page was open.",
        preserved: "Your unsaved observations remain available until you review the newer result.",
        primaryLabel: "Compare assessment evidence",
        secondaryLabel: "Keep my observations"
      },
      expired: {
        title: "Sign in again before assessing",
        body: "Your session ended before an assessment result could be securely saved.",
        preserved: "No incomplete result was added to the learner record.",
        primaryLabel: "Sign in again",
        secondaryLabel: "Return to assessment hub"
      },
      "retry-success": {
        title: "Assessment context is restored",
        body: "The learner's latest evidence and all eligible assessment choices are now available.",
        primaryLabel: "Continue to assessment"
      }
    }
  },
  progress: {
    label: "Progress",
    states: {
      loading: {
        title: "Loading progress evidence",
        body: "We are combining the selected learner's checks, reading activity, and skill history."
      },
      empty: {
        title: "No progress evidence yet",
        body: "Complete an assessment or learning activity before drawing a progress conclusion for this learner.",
        primaryLabel: "Choose an assessment"
      },
      partial: {
        title: "Progress evidence is incomplete",
        body: "Some results are available, but one or more evidence sources have not loaded.",
        preserved: "Visible totals exclude missing sources instead of counting them as zero.",
        primaryLabel: "Review available evidence",
        secondaryLabel: "Try missing evidence again"
      },
      offline: {
        title: "Progress cannot refresh offline",
        body: "You can read the last report saved on this device, but recent learner activity is not included.",
        preserved: "The saved report is labelled as older evidence and remains read-only.",
        primaryLabel: "View saved report",
        secondaryLabel: "Try connection again"
      },
      denied: {
        title: "You cannot view this progress record",
        body: "Your account does not have access to the selected learner's evidence.",
        primaryLabel: "Choose another learner",
        secondaryLabel: "Request report access"
      },
      conflict: {
        title: "This progress record has newer evidence",
        body: "A result was saved elsewhere while you were reviewing this report.",
        preserved: "Your current filters remain selected for comparison.",
        primaryLabel: "Refresh with latest evidence",
        secondaryLabel: "Keep current comparison"
      },
      expired: {
        title: "Sign in again to view progress",
        body: "Your session ended before the report and export permissions could be confirmed.",
        preserved: "No report was exported.",
        primaryLabel: "Sign in again",
        secondaryLabel: "Return to teacher home"
      },
      "retry-success": {
        title: "Progress evidence is complete",
        body: "The missing results arrived and all progress totals have been recalculated.",
        primaryLabel: "Continue reviewing progress"
      }
    }
  },
  resources: {
    label: "Plan/Resources",
    states: {
      loading: {
        title: "Loading teaching resources",
        body: "We are preparing resources for the selected class, learner, and current curriculum focus."
      },
      empty: {
        title: "No saved plan yet",
        body: "Browse the curriculum to prepare a whole-class lesson, small-group session, or learner practice.",
        primaryLabel: "Browse teaching resources"
      },
      partial: {
        title: "Some resources are unavailable",
        body: "The core teaching materials loaded, but one or more linked files or learner recommendations are missing.",
        preserved: "Available resources are complete files and safe to use.",
        primaryLabel: "Use available resources",
        secondaryLabel: "Try missing resources again"
      },
      offline: {
        title: "Only saved resources are available offline",
        body: "You can open resources already stored on this device. New downloads and assignments are paused.",
        preserved: "Saved teaching files remain available; no assignment will be submitted.",
        primaryLabel: "View saved resources",
        secondaryLabel: "Try connection again"
      },
      denied: {
        title: "You cannot open these resources",
        body: "Your account does not have access to the selected class, learner, or protected teaching file.",
        primaryLabel: "Browse available resources",
        secondaryLabel: "Request resource access"
      },
      conflict: {
        title: "This plan changed on another device",
        body: "A newer version of the teaching plan was saved while you were editing.",
        preserved: "Your unsaved plan remains available for comparison.",
        primaryLabel: "Compare plan versions",
        secondaryLabel: "Keep my draft"
      },
      expired: {
        title: "Sign in again to save this plan",
        body: "Your session ended before the plan or assignment could be confirmed.",
        preserved: "Your draft remains on this device and was not assigned.",
        primaryLabel: "Sign in again",
        secondaryLabel: "Keep draft on this device"
      },
      "retry-success": {
        title: "Teaching resources are restored",
        body: "The missing files and recommendations are available, and your draft is ready to continue.",
        primaryLabel: "Continue planning"
      }
    }
  }
});

export function getTeacherSurfaceState(surfaceId, stateId) {
  const surface = SURFACE_COPY[surfaceId];
  const state = surface?.states?.[stateId];
  const meta = SHARED_STATE_META[stateId];

  if (!surface || !state || !meta) {
    throw new Error(`Unknown teacher surface state: ${surfaceId}/${stateId}`);
  }

  return Object.freeze({
    id: `${surfaceId}:${stateId}`,
    surfaceId,
    surfaceLabel: surface.label,
    stateId,
    ...meta,
    ...state
  });
}

export const TEACHER_SURFACE_STATE_FIXTURES = Object.freeze(
  TEACHER_SURFACE_IDS.flatMap(surfaceId =>
    TEACHER_SURFACE_STATE_IDS.map(stateId =>
      getTeacherSurfaceState(surfaceId, stateId)
    )
  )
);
