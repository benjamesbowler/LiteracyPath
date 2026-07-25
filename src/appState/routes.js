import { APP_VIEWS } from "./appViews.js";

const TEACHER_PATH_VIEWS = Object.freeze({
  today: APP_VIEWS.TEACHER_DASHBOARD,
  classes: APP_VIEWS.TEACHER_CLASSES,
  assess: APP_VIEWS.TEACHER_ASSESS,
  progress: APP_VIEWS.TEACHER_PROGRESS,
  resources: APP_VIEWS.TEACHER_RESOURCES
});
const TEACHER_REPORT_VIEWS = new Set([
  "whole-child",
  "el-assessments",
  "guided-reading",
  "skills-check",
  "other-learning"
]);

function parseTeacherRouteHash(hash = "") {
  const normalized = String(hash || "").replace(/^#/, "");
  const [path, query = ""] = normalized.split("?");
  const params = new URLSearchParams(query);
  if (path === "teacher/progress/report") {
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
  const intent = path.startsWith("teacher/") ? path.slice("teacher/".length) : "";
  const appView = TEACHER_PATH_VIEWS[intent];
  if (!appView) return null;
  return {
    appView,
    classId: params.get("class") || "",
    groupId: intent === "today" ? "all" : params.get("group") || "all",
    learnerId: intent === "today" ? "" : params.get("learner") || "",
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
    ? APP_VIEWS.TEACHER_PROGRESS
    : route.appView;
  const clearLearner = () => {
    setStudent(null, "");
    setNameSaved(false);
  };
  const reject = () => {
    clearLearner();
    setView(fallbackView);
    setMessage("That link is unavailable. Choose a class and child from Progress.");
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
