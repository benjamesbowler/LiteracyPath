import { APP_VIEWS } from "./appViews.js";
import { STUDENT_REPORT_VIEWS } from "../components/reports/studentReportUiUtils.js";

// ── ONE HASH PER TEACHER SECTION ────────────────────────────────────────────
//
// Six sections, six paths. The older names below still resolve because they are
// sitting in teachers' bookmarks and in saved sessions; each one lands on the
// section that inherited its job rather than on a dead route.
const TEACHER_PATH_VIEWS = Object.freeze({
  dashboard: APP_VIEWS.TEACHER_DASHBOARD,
  today: APP_VIEWS.TEACHER_DASHBOARD,
  children: APP_VIEWS.TEACHER_CLASSES,
  classes: APP_VIEWS.TEACHER_CLASSES,
  assessments: APP_VIEWS.ASSESSMENTS,
  // Legacy: both of these used to dump the teacher on the roster.
  checks: APP_VIEWS.ASSESSMENTS,
  assess: APP_VIEWS.ASSESSMENTS,
  reports: APP_VIEWS.REPORTS,
  // Legacy: the class report and the report picker are steps in one funnel now.
  "reports/class": APP_VIEWS.REPORTS,
  progress: APP_VIEWS.REPORTS,
  resources: APP_VIEWS.TEACHER_RESOURCES,
  "resources/worksheets": APP_VIEWS.WORKSHEETS,
  "resources/present": APP_VIEWS.PRESENT,
  "resources/guided-reading": APP_VIEWS.TEACHER_GUIDED_READING,
  settings: APP_VIEWS.TEACHER_SETTINGS
});

// Deep links must round-trip EVERY report style the report page can show.
//
// This was a hand-kept list of four while the report page offered six, so
// `guided-reading` and `other-learning` were silently rewritten to `whole-child`
// on reload: the teacher opened a link to the guided reading report and got the
// overview with no explanation. Deriving it from the one list of styles means a
// seventh style cannot reintroduce the bug.
const TEACHER_REPORT_VIEWS = new Set(STUDENT_REPORT_VIEWS.map(view => view.id));

// Sections that are about a whole class, so a learner in the URL is noise.
const CLASS_ONLY_INTENTS = [
  "today",
  "dashboard",
  "resources",
  "resources/worksheets",
  "resources/present",
  "resources/guided-reading",
  "maths/teacher",
  "settings",
  "reports/class"
];

function parseTeacherRouteHash(hash = "") {
  const normalized = String(hash || "").replace(/^#/, "");
  const [path, query = ""] = normalized.split("?");
  const params = new URLSearchParams(query);
  if (path === "teacher/reports/report" || path === "teacher/progress/report") {
    const classId = params.get("class") || "";
    const learnerId = params.get("learner") || "";
    if (!classId || !learnerId) return null;
    const requestedReport = params.get("report") || "whole-child";
    return {
      appView: APP_VIEWS.FINISHED,
      classId,
      groupId: "all",
      learnerId,
      reportView: TEACHER_REPORT_VIEWS.has(requestedReport)
        ? requestedReport
        : "whole-child"
    };
  }
  const isMathsTeacherHome = path === "maths/teacher";
  const intentPath = path.startsWith("teacher/") ? path.slice("teacher/".length) : "";
  const intent = isMathsTeacherHome
    ? "maths/teacher"
    : intentPath.startsWith("settings/")
      ? "settings"
      : intentPath;
  const appView = isMathsTeacherHome
    ? APP_VIEWS.MATHS_TEACHER_DASHBOARD
    : TEACHER_PATH_VIEWS[intent];
  if (!appView) return null;
  const learnerId = CLASS_ONLY_INTENTS.includes(intent)
    ? ""
    : params.get("learner") || "";
  const requestedReport = params.get("report") || "";
  return {
    appView,
    classId: params.get("class") || "",
    groupId: CLASS_ONLY_INTENTS.includes(intent)
      ? "all"
      : params.get("group") || "all",
    learnerId,
    // The Reports funnel embeds the same report shell as the standalone route.
    // Its report tab therefore belongs to navigation history too. Keep it
    // only when a student is present; whole-class reports have one fixed view.
    reportView: appView === APP_VIEWS.REPORTS
      && learnerId
      && TEACHER_REPORT_VIEWS.has(requestedReport)
      ? requestedReport
      : ""
  };
}

export function readTeacherReportRouteView() {
  if (typeof window === "undefined") return "";
  return parseTeacherRouteHash(window.location.hash)?.reportView || "";
}

async function hydrateTeacherRouteContext([
  route,
  teacherId,
  sessionMode,
  loadClasses,
  loadStudents,
  loadClassDashboard,
  loadStudentProgress,
  actions,
  currentClassId = ""
]) {
  if (!route || !teacherId || sessionMode === "student") return false;
  const [
    clearClassData,
    setClass,
    setGroup,
    setMessage,
    setNameSaved,
    setReport,
    setStudent,
    setView,
    isRouteCurrent = () => true,
    setRetryableRoute = () => {}
  ] = actions;
  const fallbackView = route.appView === APP_VIEWS.FINISHED
    ? APP_VIEWS.REPORTS
    : route.appView;
  const ownedClasses = await loadClasses();
  // Route hydration includes real cloud reads. A teacher can use Back, a
  // breadcrumb, or the sidebar while those reads are still in flight. Once
  // the URL has moved, the old request must not put its page back on screen.
  if (!isRouteCurrent()) return false;
  // A failed or truncated read returns null. It has not proved that the deep
  // link is unowned, so retain the requested context and let the destination's
  // retry state recover it. Only a complete array may reject an absent class.
  if (!Array.isArray(ownedClasses)) {
    setRetryableRoute({
      fallbackView,
      retryStage: "classes",
      route
    });
    setView(fallbackView);
    setMessage("We couldn't confirm the classes for this link. Nothing has been treated as missing. Try loading again.");
    return false;
  }
  const requestedClassId = route.classId || currentClassId;
  const requestedClass = requestedClassId
    ? ownedClasses.find(classRow => classRow.id === requestedClassId)
    : null;
  const clearLearner = () => {
    setStudent(null, "");
    setNameSaved(false);
  };
  const reject = () => {
    // A complete ownership read is authoritative. Clear any earlier
    // retryable copy of this route before moving to the safe chooser; keeping
    // it here would turn a genuine denial into an endless retry loop.
    setRetryableRoute(null);
    clearLearner();
    setView(fallbackView);
    // Reports now owns recovery inside its three visible steps. Showing a
    // global route error above that valid chooser made the page look broken
    // even though the teacher could continue safely.
    setMessage(fallbackView === APP_VIEWS.REPORTS
      ? ""
      : "That link is unavailable. Choose a class and a student under Reports.");
    return false;
  };

  if (requestedClass && requestedClass.id !== currentClassId) {
    clearClassData();
  }
  setClass(requestedClass?.id || null);
  setGroup(route.groupId || "all");
  if ((route.classId || route.learnerId) && !requestedClass) return reject();

  if (!route.learnerId) {
    clearLearner();
    if (route.appView === APP_VIEWS.REPORTS) setReport("");
    if (requestedClass) {
      await Promise.all([
        loadStudents(requestedClass.id),
        loadClassDashboard(requestedClass.id)
      ]);
      if (!isRouteCurrent()) return false;
    } else {
      clearClassData();
    }
    setRetryableRoute(null);
    setView(route.appView);
    return true;
  }

  const ownedStudents = await loadStudents(requestedClass.id);
  if (!isRouteCurrent()) return false;
  if (!Array.isArray(ownedStudents)) {
    setRetryableRoute({
      fallbackView,
      retryStage: "students",
      route
    });
    setView(fallbackView);
    setMessage("We couldn't confirm the students for this link. Nothing has been treated as missing. Try loading again.");
    return false;
  }
  const learner = ownedStudents.find(student => student.id === route.learnerId);
  if (!learner) return reject();
  if (route.appView === APP_VIEWS.REPORTS) {
    setReport(route.reportView || "");
  } else if (route.reportView) {
    setReport(route.reportView);
  }
  await Promise.all([
    loadStudentProgress(learner.id, learner.name, {
      navigate: false,
      classId: requestedClass.id
    }),
    loadClassDashboard(requestedClass.id)
  ]);
  if (!isRouteCurrent()) return false;
  setRetryableRoute(null);
  setView(route.appView);
  return true;
}

export {
  hydrateTeacherRouteContext as hydrate,
  parseTeacherRouteHash as parse
};
