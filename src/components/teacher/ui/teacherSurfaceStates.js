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
  "partial"
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
    marker: "Some information unavailable",
    tone: "warning",
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
      partial: {
        title: "Some class information could not be loaded",
        body: "Today's suggestions are paused because the student list or saved results could not be read completely.",
        preserved: "Missing students and results are not counted as zero. Class and student records are unchanged.",
        primaryLabel: "Try loading again"
      }
    }
  },
  classes: {
    label: "Students",
    states: {
      loading: {
        title: "Loading classes and students",
        body: "We are loading the current students, sign-in details, and class settings."
      },
      empty: {
        title: "No classes yet",
        body: "Create a class to add students, prepare sign-in cards, and save the first results.",
        primaryLabel: "Create a class"
      },
      partial: {
        title: "Some class information could not be loaded",
        body: "The class is selected, but its full student list or saved results could not be loaded completely.",
        preserved: "Missing students and results are not counted as zero. If the student list loaded, names and sign-in can still be managed.",
        primaryLabel: "Try loading again"
      }
    }
  },
  assess: {
    label: "Assessments",
    states: {
      loading: {
        title: "Preparing assessment choices",
        body: "We are loading the current class and the assessments that are available."
      },
      empty: {
        title: "Make your class first",
        body: "An assessment is saved against one class. Make a class, add your students, then come back to start an assessment.",
        primaryLabel: "Make your class"
      },
      partial: {
        title: "Some assessment information could not be loaded",
        body: "The class list or saved results could not be confirmed completely, so starting an assessment is paused.",
        preserved: "Missing information is not counted as zero, and no assessment starts from an unconfirmed record.",
        primaryLabel: "Try loading again"
      }
    }
  },
  progress: {
    label: "Reports",
    states: {
      loading: {
        title: "Loading the complete report",
        body: "We are checking the student list and every saved result before showing any figures."
      },
      partial: {
        title: "Some report information could not be loaded",
        body: "The class list, student list or saved results could not be confirmed completely, so opening a report is paused.",
        preserved: "Missing students and results are not counted as zero, and an earlier class is not reused.",
        primaryLabel: "Try loading again"
      }
    }
  },
  resources: {
    label: "Resources",
    states: {
      loading: {
        title: "Loading teaching resources",
        body: "We are preparing resources for the selected class and current teaching focus."
      },
      partial: {
        title: "Class information could not be loaded",
        body: "The full class list could not be confirmed, so class teaching tools are paused.",
        preserved: "Previously verified class names may remain visible, but no missing class is treated as absent.",
        primaryLabel: "Try loading again"
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
  Object.entries(SURFACE_COPY).flatMap(([surfaceId, surface]) =>
    Object.keys(surface.states).map(stateId =>
      getTeacherSurfaceState(surfaceId, stateId)
    )
  )
);
