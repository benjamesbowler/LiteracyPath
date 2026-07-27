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
const CLASS_ONLY_INTENTS = ["today", "dashboard", "settings", "reports/class"];

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
  const intentPath = path.startsWith("teacher/") ? path.slice("teacher/".length) : "";
  const intent = intentPath.startsWith("settings/")
    ? "settings"
    : intentPath;
  const appView = TEACHER_PATH_VIEWS[intent];
  if (!appView) return null;
  return {
    appView,
    classId: params.get("class") || "",
    groupId: CLASS_ONLY_INTENTS.includes(intent)
      ? "all"
      : params.get("group") || "all",
    learnerId: CLASS_ONLY_INTENTS.includes(intent)
      ? ""
      : params.get("learner") || "",
    reportView: ""
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
  actions
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
    setView
  ] = actions;
  const ownedClasses = await loadClasses();
  const requestedClass = route.classId
    ? ownedClasses.find(classRow => classRow.id === route.classId)
    : null;
  const fallbackView = route.appView === APP_VIEWS.FINISHED
    ? APP_VIEWS.REPORTS
    : route.appView;
  const clearLearner = () => {
    setStudent(null, "");
    setNameSaved(false);
  };
  const reject = () => {
    clearLearner();
    setView(fallbackView);
    setMessage("That link is unavailable. Choose a class and a student under Reports.");
    return false;
  };

  setClass(requestedClass?.id || null);
  setGroup(route.groupId || "all");
  if ((route.classId || route.learnerId) && !requestedClass) return reject();

  if (!route.learnerId) {
    clearLearner();
    if (requestedClass) {
      await Promise.all([
        loadStudents(requestedClass.id),
        loadClassDashboard(requestedClass.id)
      ]);
    } else {
      clearClassData();
    }
    setView(route.appView);
    return true;
  }

  const ownedStudents = await loadStudents(requestedClass.id);
  const learner = ownedStudents.find(student => student.id === route.learnerId);
  if (!learner) return reject();
  if (route.reportView) setReport(route.reportView);
  await Promise.all([
    loadStudentProgress(learner.id, learner.name, {
      navigate: false,
      classId: requestedClass.id
    }),
    loadClassDashboard(requestedClass.id)
  ]);
  setView(route.appView);
  return true;
}

export {
  hydrateTeacherRouteContext as hydrate,
  parseTeacherRouteHash as parse
};
