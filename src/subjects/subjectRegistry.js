export const SUBJECT_IDS = Object.freeze({
  LITERACY: "literacy",
  MATHS: "maths"
});

export const SUBJECTS = Object.freeze({
  [SUBJECT_IDS.LITERACY]: Object.freeze({
    id: SUBJECT_IDS.LITERACY,
    label: "Literacy",
    icon: "book-open",
    studentHomeView: "studentHome",
    teacherHomeView: "teacherDashboard"
  }),
  [SUBJECT_IDS.MATHS]: Object.freeze({
    id: SUBJECT_IDS.MATHS,
    label: "Maths",
    icon: "shapes",
    studentHomeView: "mathsStudentHome",
    teacherHomeView: "mathsTeacherDashboard"
  })
});

const SUBJECT_BY_VIEW = Object.freeze({
  mathsStudentHome: SUBJECT_IDS.MATHS,
  mathsLearn: SUBJECT_IDS.MATHS,
  mathsStories: SUBJECT_IDS.MATHS,
  mathsArcade: SUBJECT_IDS.MATHS,
  mathsAssessment: SUBJECT_IDS.MATHS,
  mathsTeacherDashboard: SUBJECT_IDS.MATHS,
  mathsTeacherAssessments: SUBJECT_IDS.MATHS,
  mathsTeacherReports: SUBJECT_IDS.MATHS,
  mathsTeacherResources: SUBJECT_IDS.MATHS,
  mathsPresent: SUBJECT_IDS.MATHS,
  mathsWorksheets: SUBJECT_IDS.MATHS,
  mathsSmallGroups: SUBJECT_IDS.MATHS
});

const SUBJECT_HOME_ROUTES = Object.freeze({
  teacher: Object.freeze({
    [SUBJECT_IDS.LITERACY]: "teacher/dashboard",
    [SUBJECT_IDS.MATHS]: "maths/teacher"
  }),
  student: Object.freeze({
    [SUBJECT_IDS.LITERACY]: "student/home",
    [SUBJECT_IDS.MATHS]: "maths/home"
  })
});

function assertAudience(audience) {
  if (audience !== "teacher" && audience !== "student") {
    throw new Error(`Unknown subject audience: ${audience}`);
  }
  return audience;
}

export function assertSubjectId(value) {
  if (!SUBJECTS[value]) throw new Error(`Unknown subject: ${value}`);
  return value;
}

export function subjectForAppView(appView) {
  return SUBJECT_BY_VIEW[appView] || SUBJECT_IDS.LITERACY;
}

export function subjectHomeView(subjectId, audience) {
  const subject = SUBJECTS[assertSubjectId(subjectId)];
  return assertAudience(audience) === "teacher"
    ? subject.teacherHomeView
    : subject.studentHomeView;
}

/**
 * One bookmarkable route for each subject home.
 *
 * Class and learner ids are context only. They are never treated as proof of
 * access: teacher route hydration still checks class ownership, and student
 * routes are only applied after an authenticated picture-code session exists.
 */
export function subjectHomeHash({
  subjectId,
  audience,
  classId = "",
  learnerId = ""
} = {}) {
  const subject = assertSubjectId(subjectId);
  const role = assertAudience(audience);
  const path = SUBJECT_HOME_ROUTES[role][subject];
  const params = new URLSearchParams();
  if (classId) params.set("class", String(classId));
  if (role === "student" && learnerId) params.set("learner", String(learnerId));
  return `#${path}${params.size ? `?${params.toString()}` : ""}`;
}

export function parseSubjectHomeHash(hash = "") {
  const normalized = String(hash || "").replace(/^#/, "");
  const [path, query = ""] = normalized.split("?");
  const params = new URLSearchParams(query);
  for (const [audience, routes] of Object.entries(SUBJECT_HOME_ROUTES)) {
    for (const [subjectId, routePath] of Object.entries(routes)) {
      if (path !== routePath) continue;
      return {
        audience,
        subjectId,
        appView: subjectHomeView(subjectId, audience),
        classId: params.get("class") || "",
        learnerId: audience === "student" ? params.get("learner") || "" : ""
      };
    }
  }
  return null;
}

/**
 * Resolve a landing page only after the caller has established its session.
 * An explicit URL wins, then an assigned/recommended subject, then a cached
 * preference. Unknown stored values fail safely to Literacy.
 */
export function resolveSubjectHomeView({
  audience,
  explicitHash = "",
  assignedSubject = "",
  recommendedSubject = "",
  preferredSubject = ""
} = {}) {
  const role = assertAudience(audience);
  const explicitRoute = parseSubjectHomeHash(explicitHash);
  if (explicitRoute?.audience === role) return explicitRoute.appView;

  const subjectId = [assignedSubject, recommendedSubject, preferredSubject]
    .find(candidate => Boolean(SUBJECTS[candidate])) || SUBJECT_IDS.LITERACY;
  return subjectHomeView(subjectId, role);
}

export const MATHS_APP_VIEWS = Object.freeze(
  Object.keys(SUBJECT_BY_VIEW)
);
