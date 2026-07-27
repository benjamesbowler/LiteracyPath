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
        title: "Preparing today's class view",
        body: "We are checking recent results and putting the most useful actions first."
      },
      empty: {
        title: "No urgent actions today",
        body: "No recent result needs immediate follow-up. You can review the class or prepare the next lesson.",
        primaryLabel: "Review class activity"
      },
      partial: {
        title: "Some results are still arriving",
        body: "Recent results are available for some children, but one or more updates have not arrived yet.",
        preserved: "The actions shown use only the results available now.",
        primaryLabel: "Review available actions",
        secondaryLabel: "Try missing updates again"
      },
      offline: {
        title: "Today's view cannot refresh offline",
        body: "You can read the last view saved on this device. New child activity will appear when the connection returns.",
        preserved: "The last saved view remains available and will not be overwritten.",
        primaryLabel: "Use saved view",
        secondaryLabel: "Try connection again"
      },
      denied: {
        title: "You cannot view this class",
        body: "Your account no longer has access to the selected class. No child details have been shown.",
        primaryLabel: "Choose another class",
        secondaryLabel: "Request access"
      },
      conflict: {
        title: "Today's view changed on another device",
        body: "A newer class update arrived while this page was open. Review it before using the earlier view.",
        preserved: "Your current notes remain on this device until you choose what to keep.",
        primaryLabel: "Review latest view",
        secondaryLabel: "Keep my notes"
      },
      expired: {
        title: "Sign in again to view today",
        body: "Your session ended before the latest child results could be confirmed.",
        preserved: "No class data was changed.",
        primaryLabel: "Sign in again",
        secondaryLabel: "Return to teacher home"
      },
      "retry-success": {
        title: "Today's view is up to date",
        body: "The missing child updates arrived and today's actions now use the latest results.",
        primaryLabel: "Continue to today's actions"
      }
    }
  },
  classes: {
    label: "Classes",
    states: {
      loading: {
        title: "Loading classes and children",
        body: "We are loading the current children, sign-in details, and class settings."
      },
      empty: {
        title: "No classes yet",
        body: "Create a class to add children, prepare sign-in cards, and save the first results.",
        primaryLabel: "Create a class"
      },
      partial: {
        title: "Some child details are missing",
        body: "Names are available, but some progress, sign-in, or activity details could not be loaded.",
        preserved: "Available details remain usable. Missing values are not counted as zero.",
        primaryLabel: "Use available details",
        secondaryLabel: "Try missing details again"
      },
      offline: {
        title: "Changes need a connection",
        body: "You can read the children saved on this device, but adding, moving, or archiving is paused.",
        preserved: "No change will be sent without confirmation.",
        primaryLabel: "View saved children",
        secondaryLabel: "Try connection again"
      },
      denied: {
        title: "You cannot manage this class",
        body: "Your account cannot manage the selected class. Child sign-in details remain hidden.",
        primaryLabel: "Choose another class",
        secondaryLabel: "Request class access"
      },
      conflict: {
        title: "The class changed while you were editing",
        body: "Another authorised teacher saved a newer version of this class list.",
        preserved: "Your unsaved names remain available for comparison.",
        primaryLabel: "Compare class changes",
        secondaryLabel: "Keep my draft"
      },
      expired: {
        title: "Sign in again to manage classes",
        body: "Your session ended before the class change could be confirmed.",
        preserved: "The change was not applied.",
        primaryLabel: "Sign in again",
        secondaryLabel: "Return to teacher home"
      },
      "retry-success": {
        title: "Class list is up to date",
        body: "The latest children, sign-in details, and class settings are now available.",
        primaryLabel: "Continue managing the class"
      }
    }
  },
  assess: {
    label: "Check",
    states: {
      loading: {
        title: "Preparing check choices",
        body: "We are loading the selected child's current results and the checks that fit."
      },
      empty: {
        title: "Make your class first",
        body: "A check is always saved against one class. Make a class, add your students, then come back and start a check.",
        primaryLabel: "Make your class"
      },
      partial: {
        title: "Some earlier results are missing",
        body: "The child and available checks loaded, but some earlier results could not be retrieved.",
        preserved: "You can check now. Comparisons will use only the results shown.",
        primaryLabel: "Choose an available check",
        secondaryLabel: "Try earlier results again"
      },
      offline: {
        title: "Checks cannot start offline",
        body: "Starting now may leave a result incomplete, so checks are paused until the connection returns.",
        preserved: "Previously saved results remain unchanged.",
        primaryLabel: "Review saved results",
        secondaryLabel: "Try connection again"
      },
      denied: {
        title: "You cannot check this child",
        body: "Your account no longer has access to this child's results. No check was started.",
        primaryLabel: "Choose another child",
        secondaryLabel: "Request access"
      },
      conflict: {
        title: "A newer check result is available",
        body: "Another authorised session saved a result for this child while this page was open.",
        preserved: "Your unsaved observations remain available until you review the newer result.",
        primaryLabel: "Compare check results",
        secondaryLabel: "Keep my observations"
      },
      expired: {
        title: "Sign in again before checking",
        body: "Your session ended before the check result could be saved.",
        preserved: "No incomplete result was added to the child's record.",
        primaryLabel: "Sign in again",
        secondaryLabel: "Return to checks"
      },
      "retry-success": {
        title: "Check choices are restored",
        body: "The child's latest results and all available check choices are ready.",
        primaryLabel: "Continue to check"
      }
    }
  },
  progress: {
    label: "Progress",
    states: {
      loading: {
        title: "Loading progress",
        body: "We are combining the selected child's checks, reading activity, and skill history."
      },
      empty: {
        title: "No progress results yet",
        body: "Complete a check or reading activity before reviewing this child's progress.",
        primaryLabel: "Choose a check"
      },
      partial: {
        title: "Some progress results are missing",
        body: "Some results are available, but one or more parts have not loaded.",
        preserved: "Visible totals exclude missing sources instead of counting them as zero.",
        primaryLabel: "Review available results",
        secondaryLabel: "Try missing results again"
      },
      offline: {
        title: "Progress cannot refresh offline",
        body: "You can read the last report saved on this device, but recent child activity is not included.",
        preserved: "The saved report is labelled as older and remains read-only.",
        primaryLabel: "View saved report",
        secondaryLabel: "Try connection again"
      },
      denied: {
        title: "You cannot view this progress record",
        body: "Your account does not have access to the selected child's results.",
        primaryLabel: "Choose another child",
        secondaryLabel: "Request report access"
      },
      conflict: {
        title: "This progress record has newer results",
        body: "A result was saved elsewhere while you were reviewing this report.",
        preserved: "Your current filters remain selected for comparison.",
        primaryLabel: "Refresh with latest results",
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
        title: "Progress results are complete",
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
        body: "We are preparing resources for the selected class, child, and current curriculum focus."
      },
      empty: {
        title: "No saved plan yet",
        body: "Browse the curriculum to prepare a whole-class lesson, small-group session, or child practice.",
        primaryLabel: "Browse teaching resources"
      },
      partial: {
        title: "Some resources are unavailable",
        body: "The main teaching materials loaded, but one or more linked files or child suggestions are missing.",
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
        body: "Your account does not have access to the selected class, child, or protected teaching file.",
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
