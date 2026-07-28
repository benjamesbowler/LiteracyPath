import { useEffect, useMemo, useRef, useState } from "react";

import {
  loadClassAccessLog,
  loadClassAccessSummary,
  saveClassCodeExpiry
} from "../../data/classAccessSecurity.js";
import { pushRouteHash } from "../../appState/appRuntimeServices.js";
import {
  readTeacherSettingsSection,
  teacherSettingsHash
} from "../../appState/teacherSettingsRoutes.js";
import { getClassListReadView } from "../../appState/classListReadState.js";
import { getStudentRosterReadView } from "../../appState/studentRosterReadState.js";
import { TEACHER_COPY } from "../../copy/teacherCopy.js";
import { LearnerDataRightsDialog } from "./LearnerDataRightsDialog.jsx";
import { ConfirmActionDialog } from "./TeacherAdminDialogs.jsx";
import { studentsForSettingsClass } from "./teacherSettingsModel.js";
import {
  TeacherPageHeader,
  TeacherPageShell
} from "./ui/TeacherPrimitives.jsx";

const SETTINGS_SECTIONS = Object.freeze([
  { id: "school", label: "School information" },
  { id: "site", label: "Class sign-in" },
  { id: "privacy", label: "Student privacy" },
  { id: "account", label: "Teacher account" }
]);

function formatAccessTime(value) {
  if (!value) return "No recent activity";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Time unavailable";
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function formatExpiryDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function friendlyAccessEventLabel(event = {}) {
  const label = String(event.label || "").toLowerCase();
  if (label.includes("abusive burst") || label.includes("rate limit")) {
    return "Too many sign-in attempts";
  }
  if (label.includes("rejected") || label.includes("denied")) {
    return "Sign-in details were not accepted";
  }
  if (label.includes("accepted") || label.includes("allowed")) {
    return "Student signed in";
  }
  if (label.includes("code expiry")) return "Class code expiry changed";
  if (label.includes("code")) return "Class code checked";
  return event.label || "Class sign-in activity";
}

function friendlyDeviceLabel(value = "") {
  const label = String(value || "").trim();
  if (!label || /^device\s+[a-z0-9-]+$/i.test(label)) return "Classroom device";
  return label.replace(/\bdevice\s+[a-z0-9-]+\b/i, "Classroom device");
}

function SettingsReadState({
  kind,
  truncated = false,
  onRetry,
  busy = false
}) {
  const loading = kind === "classes-loading"
    || kind === "students-loading"
    || kind === "profile-loading"
    || kind === "school-loading";
  const copy = {
    "classes-loading": {
      title: "Loading classes…",
      body: "Class choices and class sign-in changes will be available when the current list is confirmed."
    },
    "classes-failed": {
      title: truncated
        ? "We couldn't load every class"
        : "We couldn't load the class list",
      body: truncated
        ? "The complete class list was not returned. No missing class is being treated as absent, and class changes are paused."
        : "Previously loaded class details are not available for changes until the list loads successfully."
    },
    "students-loading": {
      title: "Loading students…",
      body: "Privacy actions will be available when this class's current student list is confirmed."
    },
    "students-failed": {
      title: truncated
        ? "We couldn't load every student"
        : "We couldn't load the student list",
      body: truncated
        ? "The complete student list was not returned. No missing student is being treated as absent, and privacy actions are paused."
        : "An empty class has not been assumed. Privacy actions are paused until the student list loads successfully."
    },
    "profile-loading": {
      title: "Loading account details…",
      body: "Saved school and account information will appear when your teacher account is ready."
    },
    "school-loading": {
      title: "Loading school information…",
      body: "The saved school name will appear when the current school record is confirmed."
    },
    "school-failed": {
      title: "We couldn't load the saved school name",
      body: "A blank school name has not been assumed. School changes are paused until the saved information loads successfully."
    }
  }[kind];

  return (
    <section
      className={loading
        ? "teacher-settings-read-state teacher-inline-status"
        : "teacher-settings-read-state teacher-inline-error"}
      role={loading ? "status" : "alert"}
      aria-busy={loading || undefined}
    >
      <strong>{copy.title}</strong>
      <span>{copy.body}</span>
      {!loading && onRetry && (
        <button
          className="lp-button lp-button-secondary"
          type="button"
          disabled={busy}
          onClick={onRetry}
        >
          {busy ? "Trying again…" : "Try again"}
        </button>
      )}
    </section>
  );
}

export function TeacherSettingsPage({
  client,
  classList = [],
  classListReadState,
  loadingClasses = false,
  onRetryClasses,
  teacherId = "",
  selectedClassId = "",
  onSelectClass,
  studentList = [],
  studentListReadState,
  loadingStudents = false,
  archivedStudentList = [],
  schoolName = "",
  schoolNameReadState = null,
  onRetrySchoolName,
  onRegenerateClassCode,
  onReloadStudents,
  teacherEmail = "",
  profileLoaded = true,
  onSignOut
}) {
  const [section, setSection] = useState(() => readTeacherSettingsSection(
    typeof window === "undefined" ? "" : window.location.hash
  ));
  const [siteBusy, setSiteBusy] = useState({});
  const [status, setStatusState] = useState({
    message: "",
    kind: "status",
    sectionId: "",
    classId: "",
    retry: ""
  });
  const [statusRetryBusy, setStatusRetryBusy] = useState(false);
  const [privacyStudentId, setPrivacyStudentId] = useState("");
  const [privacyStudent, setPrivacyStudent] = useState(null);
  const [deletedStudentIds, setDeletedStudentIds] = useState([]);
  const [codeOverrides, setCodeOverrides] = useState({});
  const [scopeOverrides, setScopeOverrides] = useState({});
  const [expiryOverrides, setExpiryOverrides] = useState({});
  const [accessSummaryRead, setAccessSummaryRead] = useState({
    classId: "",
    status: "idle",
    data: null,
    error: ""
  });
  const [accessLogRead, setAccessLogRead] = useState({
    classId: "",
    status: "idle",
    data: [],
    error: ""
  });
  const [accessLogOpen, setAccessLogOpen] = useState(false);
  const [accessSummaryReloadToken, setAccessSummaryReloadToken] = useState(0);
  const [newCodeConfirmOpen, setNewCodeConfirmOpen] = useState(false);
  const [newCodeError, setNewCodeError] = useState("");
  const selectedClassIdRef = useRef(selectedClassId);

  const allStudents = useMemo(
    () => {
      const removed = new Set(deletedStudentIds);
      return studentsForSettingsClass({
        studentList,
        archivedStudentList,
        selectedClassId
      }).filter(row => !removed.has(row.id));
    },
    [archivedStudentList, deletedStudentIds, selectedClassId, studentList]
  );
  const selectedPrivacyStudent = allStudents.find(
    row => row.id === privacyStudentId
  ) || null;
  const visiblePrivacyStudent = privacyStudent
    && String(privacyStudent.class_id || "") === String(selectedClassId)
    ? privacyStudent
    : null;
  const selectedClass = classList.find(row => row.id === selectedClassId) || null;
  const classRead = getClassListReadView({
    readState: classListReadState,
    teacherId,
    legacyLoading: loadingClasses
  });
  const classRowsReady = classRead.complete && classRead.rowsVerified;
  const rosterRead = getStudentRosterReadView({
    readState: studentListReadState,
    classId: selectedClassId,
    legacyLoading: loadingStudents
  });
  const rosterRowsReady = rosterRead.complete && rosterRead.rowsBelongToClass;
  const actionableClass = classRowsReady ? selectedClass : null;
  const actionableClassId = actionableClass?.id || "";
  const visibleSiteBusy = siteBusy[selectedClassId] || "";
  const visibleAccessSummaryRead = accessSummaryRead.classId === actionableClass?.id
    ? accessSummaryRead
    : {
        classId: actionableClass?.id || "",
        status: actionableClass ? "loading" : "idle",
        data: null,
        error: ""
      };
  const visibleAccessLogRead = accessLogRead.classId === selectedClassId
    ? accessLogRead
    : {
        classId: selectedClassId,
        status: "idle",
        data: [],
        error: ""
      };
  const visibleAccessBusy = visibleAccessLogRead.status === "loading";
  const selectedOverrideCode = codeOverrides[selectedClassId] || "";
  const selectedAccessCode = selectedOverrideCode
    || actionableClass?.access_code
    || "";
  const selectedScope = scopeOverrides[selectedClassId]
    || actionableClass?.leaderboard_scope
    || "class";
  const hasSelectedExpiryOverride = Object.prototype.hasOwnProperty.call(
    expiryOverrides,
    selectedClassId
  );
  const selectedExpiry = hasSelectedExpiryOverride
    ? expiryOverrides[selectedClassId]
    : actionableClass?.access_code_expires_at ?? null;
  const selectedExpiryLabel = formatExpiryDate(selectedExpiry);
  const visibleAccessSummary = visibleAccessSummaryRead.data;
  const visibleAccessSummaryError = visibleAccessSummaryRead.error;
  const visibleAccessLog = visibleAccessLogRead.data;
  const visibleAccessLogError = visibleAccessLogRead.error;
  const scopedSchoolNameReadStatus = schoolNameReadState
    ? (
        String(schoolNameReadState.teacherId || "") === String(teacherId || "")
          ? schoolNameReadState.status
          : "loading"
      )
    : profileLoaded ? "complete" : "loading";
  const visibleStatus = (
    (!status.sectionId || status.sectionId === section)
    && (!status.classId || status.classId === selectedClassId)
  ) ? status : null;

  function setStatus(
    message = "",
    kind = "",
    {
      sectionId = "",
      classId = "",
      retry = ""
    } = {}
  ) {
    const text = String(message || "");
    const inferredKind = kind || (
      /\b(?:couldn(?:'|’)t|could not|not changed|was not changed|unavailable|enter a|unchanged)\b/i.test(text)
        ? "error"
        : "status"
    );
    setStatusState({
      message: text,
      kind: inferredKind,
      sectionId,
      classId,
      retry
    });
  }

  useEffect(() => {
    const handleHashChange = () => setSection(readTeacherSettingsSection(window.location.hash));
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    selectedClassIdRef.current = selectedClassId;
  }, [selectedClassId]);

  useEffect(() => {
    let cancelled = false;
    if (!actionableClassId || !client) return undefined;

    (async () => {
      setAccessSummaryRead({
        classId: actionableClassId,
        status: "loading",
        data: null,
        error: ""
      });
      try {
        const result = await loadClassAccessSummary({
          client,
          classId: actionableClassId
        });
        if (cancelled) return;
        if (result.error) {
          setAccessSummaryRead({
            classId: actionableClassId,
            status: "error",
            data: null,
            error: "Sign-in activity is temporarily unavailable."
          });
          return;
        }
        setAccessSummaryRead({
          classId: actionableClassId,
          status: "complete",
          data: result.data,
          error: ""
        });
      } catch {
        if (cancelled) return;
        setAccessSummaryRead({
          classId: actionableClassId,
          status: "error",
          data: null,
          error: "Sign-in activity is temporarily unavailable."
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessSummaryReloadToken, actionableClassId, client]);

  function openSection(nextSection) {
    setSection(nextSection);
    pushRouteHash(teacherSettingsHash(nextSection, selectedClassId));
    setStatus("");
  }

  function changeSelectedClass(classId) {
    // Every control below is scoped to one class. Reset before asking the
    // parent to load another class so stale rows or dialogs cannot be applied
    // under the new heading if that refresh fails.
    setPrivacyStudentId("");
    setPrivacyStudent(null);
    setAccessLogRead({
      classId: "",
      status: "idle",
      data: [],
      error: ""
    });
    setAccessLogOpen(false);
    setNewCodeConfirmOpen(false);
    setNewCodeError("");
    setStatus("");
    selectedClassIdRef.current = classId || "";
    pushRouteHash(teacherSettingsHash(section, classId || ""));
    onSelectClass?.(classId || null);
  }

  function askToRegenerateCode() {
    if (!actionableClass?.id || visibleSiteBusy) return;
    setNewCodeError("");
    setNewCodeConfirmOpen(true);
  }

  async function regenerateCode() {
    if (!actionableClass?.id || visibleSiteBusy) return;
    const mutationClassId = actionableClass.id;
    setSiteBusy(previous => ({ ...previous, [mutationClassId]: "code" }));
    setStatus("Making a new class code…", "status", {
      sectionId: "site",
      classId: mutationClassId
    });
    try {
      const result = await onRegenerateClassCode?.(mutationClassId);
      if (result?.ok) {
        setCodeOverrides(previous => ({
          ...previous,
          [mutationClassId]: result.accessCode
        }));
        if (selectedClassIdRef.current === mutationClassId) {
          setNewCodeConfirmOpen(false);
          setNewCodeError("");
          setStatus(
            result.refreshComplete === false
              ? `New class code ${result.accessCode} is ready. We couldn't refresh the class list, so the new code is shown here. Try loading classes again.`
              : `New class code ${result.accessCode} is ready.`,
            result.refreshComplete === false ? "error" : "status",
            {
              sectionId: "site",
              classId: mutationClassId,
              retry: result.refreshComplete === false ? "classes" : ""
            }
          );
        }
      } else {
        const message = "The class code was not changed. The current code still works.";
        if (selectedClassIdRef.current === mutationClassId) {
          setNewCodeError(message);
          setStatus(message, "error", {
            sectionId: "site",
            classId: mutationClassId
          });
        }
      }
    } catch {
      const message = "We couldn't make a new class code. The current code still works.";
      if (selectedClassIdRef.current === mutationClassId) {
        setNewCodeError(message);
        setStatus(message, "error", {
          sectionId: "site",
          classId: mutationClassId
        });
      }
    } finally {
      setSiteBusy(previous => {
        if (previous[mutationClassId] !== "code") return previous;
        const next = { ...previous };
        delete next[mutationClassId];
        return next;
      });
    }
  }

  async function copyCode() {
    const mutationClassId = actionableClass?.id
      || (selectedOverrideCode ? selectedClassId : "");
    const code = selectedAccessCode;
    if (!code) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(code);
      setStatus(`Class code ${code} copied.`, "status", {
        sectionId: "site",
        classId: mutationClassId
      });
    } catch {
      setStatus(
        `Copy is unavailable. Select the visible code ${code} to copy it manually.`,
        "error",
        {
          sectionId: "site",
          classId: mutationClassId
        }
      );
    }
  }

  async function toggleAccessLog() {
    if (!actionableClass?.id || visibleAccessBusy) return;
    if (accessLogOpen) {
      setAccessLogOpen(false);
      return;
    }
    const requestClassId = actionableClass.id;
    setAccessLogOpen(true);
    setAccessLogRead({
      classId: requestClassId,
      status: "loading",
      data: [],
      error: ""
    });
    try {
      const result = await loadClassAccessLog({
        client,
        classId: requestClassId,
        limit: 20
      });
      if (selectedClassIdRef.current !== requestClassId) return;
      if (result.error) {
        setAccessLogRead({
          classId: requestClassId,
          status: "error",
          data: [],
          error: "Sign-in activity is temporarily unavailable."
        });
        return;
      }
      setAccessLogRead({
        classId: requestClassId,
        status: "complete",
        data: result.data,
        error: ""
      });
    } catch {
      if (selectedClassIdRef.current !== requestClassId) return;
      setAccessLogRead({
        classId: requestClassId,
        status: "error",
        data: [],
        error: "Sign-in activity is temporarily unavailable."
      });
    }
  }

  async function changeExpiry(days) {
    if (!actionableClass?.id || visibleSiteBusy) return;
    // Only a real number of days may reach the save. Anything else (for example the
    // option that describes the expiry already in place) must never be read as
    // "remove the expiry".
    const dayCount = Number(days);
    if (!Number.isFinite(dayCount) || dayCount < 0) return;
    const expiresAt = dayCount > 0
      ? new Date(Date.now() + dayCount * 86400000).toISOString()
      : null;
    const mutationClassId = actionableClass.id;
    setSiteBusy(previous => ({ ...previous, [mutationClassId]: "expiry" }));
    setStatus("Saving class-code expiry…", "status", {
      sectionId: "site",
      classId: mutationClassId
    });
    try {
      const result = await saveClassCodeExpiry({
        client,
        classId: mutationClassId,
        expiresAt
      });
      if (result.error) {
        if (selectedClassIdRef.current === mutationClassId) {
          setStatus("The class-code expiry was not changed.", "error", {
            sectionId: "site",
            classId: mutationClassId
          });
        }
        return;
      }
      setExpiryOverrides(previous => ({
        ...previous,
        [mutationClassId]: result.data.access_code_expires_at || null
      }));
      if (selectedClassIdRef.current === mutationClassId) {
        setStatus(result.data.access_code_expires_at
          ? "Class-code expiry saved."
          : "This class code will not expire automatically.", "status", {
          sectionId: "site",
          classId: mutationClassId
        });
      }
    } catch {
      if (selectedClassIdRef.current !== mutationClassId) return;
      setStatus(
        "We couldn't change the class-code expiry. The current setting is unchanged.",
        "error",
        {
          sectionId: "site",
          classId: mutationClassId
        }
      );
    } finally {
      setSiteBusy(previous => {
        if (previous[mutationClassId] !== "expiry") return previous;
        const next = { ...previous };
        delete next[mutationClassId];
        return next;
      });
    }
  }

  async function changeLeaderboardScope(scope) {
    if (!actionableClass?.id || visibleSiteBusy) return;
    const mutationClassId = actionableClass.id;
    setSiteBusy(previous => ({ ...previous, [mutationClassId]: "leaderboard" }));
    setStatus("Saving leaderboard visibility…", "status", {
      sectionId: "site",
      classId: mutationClassId
    });
    try {
      const { data, error } = await client.call("teacher_set_class_leaderboard_scope", {
        p_class_id: mutationClassId,
        p_scope: scope
      });
      if (error || data?.[0]?.leaderboard_scope !== scope) {
        if (selectedClassIdRef.current === mutationClassId) {
          setStatus("Leaderboard visibility was not changed.", "error", {
            sectionId: "site",
            classId: mutationClassId
          });
        }
        return;
      }
      setScopeOverrides(previous => ({ ...previous, [mutationClassId]: scope }));
      if (selectedClassIdRef.current === mutationClassId) {
        setStatus(scope === "school"
          ? "The leaderboard now includes made-up student nicknames from this school."
          : "The leaderboard now stays inside this class.", "status", {
          sectionId: "site",
          classId: mutationClassId
        });
      }
    } catch {
      if (selectedClassIdRef.current !== mutationClassId) return;
      setStatus(
        "We couldn't change leaderboard visibility. The current setting is unchanged.",
        "error",
        {
          sectionId: "site",
          classId: mutationClassId
        }
      );
    } finally {
      setSiteBusy(previous => {
        if (previous[mutationClassId] !== "leaderboard") return previous;
        const next = { ...previous };
        delete next[mutationClassId];
        return next;
      });
    }
  }

  async function retryStatusRead() {
    if (!visibleStatus?.retry || statusRetryBusy) return;
    const retryClassId = visibleStatus.classId || selectedClassId;
    const retryKind = visibleStatus.retry;
    setStatusRetryBusy(true);
    try {
      const result = retryKind === "classes"
        ? await onRetryClasses?.()
        : await onReloadStudents?.(retryClassId);
      if (result === null) {
        setStatus(
          retryKind === "classes"
            ? "We still couldn't refresh the class list. The new class code shown here remains the current code."
            : "The student was deleted, but the student list still could not refresh. The deleted student remains unavailable here.",
          "error",
          {
            sectionId: retryKind === "classes" ? "site" : "privacy",
            classId: retryClassId,
            retry: retryKind
          }
        );
        return;
      }
      setStatus(
        retryKind === "classes"
          ? "Class list refreshed."
          : "Student list refreshed.",
        "status",
        {
          sectionId: retryKind === "classes" ? "site" : "privacy",
          classId: retryClassId
        }
      );
    } catch {
      setStatus(
        retryKind === "classes"
          ? "We still couldn't refresh the class list. The new class code shown here remains the current code."
          : "The student was deleted, but the student list still could not refresh. The deleted student remains unavailable here.",
        "error",
        {
          sectionId: retryKind === "classes" ? "site" : "privacy",
          classId: retryClassId,
          retry: retryKind
        }
      );
    } finally {
      setStatusRetryBusy(false);
    }
  }

  return (
    <TeacherPageShell className="teacher-settings-page" intent="settings">
      <TeacherPageHeader
        eyebrow="Settings"
        title="Settings"
        description="School details, class sign-in, student privacy and your teacher account each have their own page."
      />

      <div className="teacher-settings-layout">
        <nav className="teacher-settings-nav" aria-label="Settings sections">
          {SETTINGS_SECTIONS.map(item => (
            <button
              key={item.id}
              className={section === item.id ? "active" : ""}
              type="button"
              aria-current={section === item.id ? "page" : undefined}
              onClick={() => openSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <section className="teacher-settings-panel" aria-busy={Boolean(visibleSiteBusy) || undefined}>
          {visibleStatus?.message && (
            <div
              className={visibleStatus.kind === "error"
                ? "teacher-settings-status teacher-inline-error"
                : "teacher-settings-status teacher-inline-status"}
              role={visibleStatus.kind === "error" ? "alert" : "status"}
            >
              <span>{visibleStatus.message}</span>
              {visibleStatus.retry && (
                <button
                  className="lp-button lp-button-secondary"
                  type="button"
                  disabled={statusRetryBusy}
                  onClick={retryStatusRead}
                >
                  {statusRetryBusy ? "Trying again…" : "Try again"}
                </button>
              )}
            </div>
          )}
          {section === "school" && (
            !profileLoaded || scopedSchoolNameReadStatus === "loading" || scopedSchoolNameReadStatus === "idle" ? (
              <SettingsReadState
                kind={profileLoaded ? "school-loading" : "profile-loading"}
              />
            ) : scopedSchoolNameReadStatus === "error" ? (
              <SettingsReadState
                kind="school-failed"
                busy={false}
                onRetry={onRetrySchoolName}
              />
            ) : (
              <div className="page-stack">
                <header>
                  <p className="panel-label">School information</p>
                  <h2>School name</h2>
                  <p>This is the school linked to your teacher account, classes and student records.</p>
                </header>
                <div className="teacher-settings-card">
                  <div>
                    <h3>Current school</h3>
                    <p>{schoolName || "No school is linked"}</p>
                    <small>
                      Ask an administrator to correct this if it is wrong.
                      Moving a teacher account also moves access to its classes and student records,
                      so it cannot be changed here.
                    </small>
                  </div>
                </div>
              </div>
            )
          )}

          {section === "site" && (
            <div className="page-stack teacher-site-settings">
              <header>
                <p className="panel-label">Class sign-in</p>
                <h2>Code expiry and leaderboard</h2>
                <p>Choose a class, then manage how students sign in and where made-up student nicknames appear.</p>
              </header>
              <label>
                <span>Class</span>
                <select
                  value={selectedClassId || ""}
                  disabled={!classRowsReady}
                  onChange={event => changeSelectedClass(event.target.value)}
                >
                  <option value="">Choose a class</option>
                  {classList.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
                </select>
              </label>
              {classRead.loading ? (
                <SettingsReadState kind="classes-loading" />
              ) : classRead.failed || !classRowsReady ? (
                <>
                  {selectedOverrideCode && (
                    <div className="teacher-settings-card">
                      <div>
                        <h3>New student sign-in code</h3>
                        <p className="teacher-settings-code">{selectedOverrideCode}</p>
                        <small>
                          This is the new code returned when the old code was replaced.
                          Other class settings stay paused until the class list refreshes.
                        </small>
                      </div>
                      <div className="teacher-settings-card-actions">
                        <button
                          className="lp-button lp-button-secondary"
                          type="button"
                          onClick={copyCode}
                        >
                          Copy code
                        </button>
                      </div>
                    </div>
                  )}
                  <SettingsReadState
                    kind="classes-failed"
                    truncated={classRead.truncated}
                    busy={loadingClasses}
                    onRetry={visibleStatus?.retry === "classes"
                      ? null
                      : onRetryClasses}
                  />
                </>
              ) : actionableClass ? (
                <>
                  <div className="teacher-site-settings-grid">
                    <div className="page-stack">
                      <div className="teacher-settings-card">
                        <div>
                          <h3>Student sign-in code</h3>
                          <p className="teacher-settings-code">{selectedAccessCode || "Not available"}</p>
                          <small>Making a new code stops the old code immediately.</small>
                        </div>
                        <div className="teacher-settings-card-actions">
                          <button
                            className="lp-button lp-button-secondary"
                            type="button"
                            disabled={Boolean(visibleSiteBusy) || !selectedAccessCode}
                            onClick={copyCode}
                          >
                            Copy code
                          </button>
                          <button
                            className="lp-button lp-button-secondary"
                            type="button"
                            disabled={Boolean(visibleSiteBusy)}
                            onClick={askToRegenerateCode}
                          >
                            {visibleSiteBusy === "code" ? "Making code…" : "New code"}
                          </button>
                        </div>
                      </div>
                      <label>
                        <span>Code expires</span>
                        <select
                          value={selectedExpiry ? "current" : "0"}
                          disabled={Boolean(visibleSiteBusy)}
                          onChange={event => changeExpiry(event.target.value)}
                        >
                          {selectedExpiry && (
                            <option disabled value="current">
                              {selectedExpiryLabel
                                ? `Stops working on ${selectedExpiryLabel}`
                                : "An expiry is already set"}
                            </option>
                          )}
                          <option value="0">Never</option>
                          <option value="1">After 1 day</option>
                          <option value="7">After 7 days</option>
                          <option value="30">After 30 days</option>
                          <option value="90">After 90 days</option>
                        </select>
                      </label>
                      {selectedExpiry && (
                        <p className="muted-text">
                          {selectedExpiryLabel
                            ? `This code stops working on ${selectedExpiryLabel}. Pick another option to change it.`
                            : "This code has an expiry set. Pick another option to change it."}
                        </p>
                      )}
                    </div>
                    <div className="page-stack">
                      <fieldset>
                        <legend>Leaderboard visibility</legend>
                        <label>
                          <input
                            type="radio"
                            name="leaderboard-scope"
                            value="class"
                            checked={selectedScope === "class"}
                            disabled={Boolean(visibleSiteBusy)}
                            onChange={() => changeLeaderboardScope("class")}
                          />
                          This class only
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="leaderboard-scope"
                            value="school"
                            checked={selectedScope === "school"}
                            disabled={Boolean(visibleSiteBusy)}
                            onChange={() => changeLeaderboardScope("school")}
                          />
                          Whole school
                        </label>
                      </fieldset>
                      <section
                        className={`teacher-class-access-summary${visibleAccessSummary?.anomaly ? " anomaly" : ""}${visibleAccessSummaryError ? " error" : ""}`}
                        role={visibleAccessSummary?.anomaly || visibleAccessSummaryError ? "alert" : "status"}
                        aria-live="polite"
                      >
                        {visibleAccessSummary?.anomaly ? (
                          <>
                            <strong>Unusual sign-in activity</strong>
                            <span>
                              {visibleAccessSummary.blocked} blocked and {visibleAccessSummary.denied} rejected
                              {" "}attempt{visibleAccessSummary.blocked + visibleAccessSummary.denied === 1 ? "" : "s"} in 24 hours.
                              Consider making a new code.
                            </span>
                          </>
                        ) : visibleAccessSummaryError ? (
                          <>
                            <strong>We couldn&apos;t load recent sign-in activity.</strong>
                            <span>Nothing was changed. Make sure this device is online, then try again.</span>
                            <button
                              className="lp-button lp-button-secondary"
                              type="button"
                              onClick={() => setAccessSummaryReloadToken(value => value + 1)}
                            >
                              Try again
                            </button>
                          </>
                        ) : visibleAccessSummaryRead.status === "loading" ? (
                          <span>Checking recent sign-in activity…</span>
                        ) : (
                          <span>
                            {visibleAccessSummary
                              ? `${visibleAccessSummary.allowed} successful sign-in${visibleAccessSummary.allowed === 1 ? "" : "s"} in the last 24 hours.`
                              : "No sign-in summary is available."}
                          </span>
                        )}
                      </section>
                      <div>
                        <button
                          className="lp-button lp-button-secondary"
                          type="button"
                          aria-expanded={accessLogOpen}
                          disabled={visibleAccessBusy}
                          onClick={toggleAccessLog}
                        >
                          {accessLogOpen ? "Hide sign-in history" : "See sign-in history"}
                        </button>
                      </div>
                    </div>
                  </div>
                  {accessLogOpen && (
                    <section
                      className="teacher-class-access-log"
                      aria-label="Class sign-in history"
                    >
                      <h3>Class sign-in history</h3>
                      <p>No student names, passwords, class codes, device IDs, or network addresses are stored here.</p>
                      {visibleAccessLogRead.status === "loading" ? (
                        <p role="status">Loading sign-in activity…</p>
                      ) : visibleAccessLogError ? (
                        <p role="alert">{visibleAccessLogError}</p>
                      ) : visibleAccessLog.length === 0 ? (
                        <p>No recent sign-in activity.</p>
                      ) : (
                        <ol>
                          {visibleAccessLog.map((event, index) => (
                            <li
                              className={`outcome-${event.outcome}`}
                              key={`${event.occurredAt}-${event.eventType}-${index}`}
                            >
                              <strong>{friendlyAccessEventLabel(event)}</strong>
                              <span>{friendlyDeviceLabel(event.deviceLabel)} · {formatAccessTime(event.occurredAt)}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </section>
                  )}
                </>
              ) : (
                <p className="teacher-settings-empty">
                  {classList.length
                    ? "Choose a class to manage sign-in."
                    : "No classes yet. Create a class on the Students page first."}
                </p>
              )}
            </div>
          )}

          {section === "privacy" && (
            <div className="page-stack">
              <header>
                <p className="panel-label">Student privacy</p>
                <h2>Download or delete student data</h2>
                <p>Download or permanently delete one student's saved data after the school verifies the request.</p>
              </header>
              <label>
                <span>Class</span>
                <select
                  value={selectedClassId || ""}
                  disabled={!classRowsReady}
                  onChange={event => {
                    setPrivacyStudentId("");
                    changeSelectedClass(event.target.value);
                  }}
                >
                  <option value="">Choose a class</option>
                  {classList.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
                </select>
              </label>
              {classRead.loading ? (
                <SettingsReadState kind="classes-loading" />
              ) : classRead.failed || !classRowsReady ? (
                <SettingsReadState
                  kind="classes-failed"
                  truncated={classRead.truncated}
                  busy={loadingClasses}
                  onRetry={onRetryClasses}
                />
              ) : !selectedClassId ? (
                <p className="teacher-settings-empty">
                  {classList.length
                    ? "Choose a class to manage student privacy."
                    : "No classes yet. Create a class on the Students page first."}
                </p>
              ) : rosterRead.loading ? (
                <SettingsReadState kind="students-loading" />
              ) : rosterRead.incomplete || !rosterRowsReady ? (
                <SettingsReadState
                  kind="students-failed"
                  truncated={rosterRead.truncated}
                  busy={loadingStudents}
                  onRetry={() => onReloadStudents?.(selectedClassId)}
                />
              ) : (
                <>
                  <label>
                    <span>Student</span>
                    <select
                      value={selectedPrivacyStudent?.id || ""}
                      disabled={!rosterRowsReady || allStudents.length === 0}
                      onChange={event => setPrivacyStudentId(event.target.value)}
                    >
                      <option value="">Choose a student</option>
                      {allStudents.map(row => (
                        <option key={row.id} value={row.id}>
                          {row.name}{row.archived_at ? " (archived)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  {allStudents.length === 0 && (
                    <p className="teacher-settings-empty">
                      No students are currently recorded in this class.
                    </p>
                  )}
                  <div>
                    <button
                      className="lp-button lp-button-primary"
                      type="button"
                      disabled={!selectedPrivacyStudent}
                      onClick={() => setPrivacyStudent(selectedPrivacyStudent)}
                    >
                      Open privacy request
                    </button>
                  </div>
                  <p className="muted-text">For names, sign-in pictures, accessibility or archiving, open the student on the Students page.</p>
                </>
              )}
            </div>
          )}

          {section === "account" && (
            <div className="page-stack">
              <header>
                <p className="panel-label">Teacher account</p>
                <h2>Teacher account</h2>
                {profileLoaded && teacherEmail ? (
                  <p>Signed in as <strong>{teacherEmail}</strong>.</p>
                ) : (
                  <p>Account details are still loading.</p>
                )}
              </header>
              {!profileLoaded && <SettingsReadState kind="profile-loading" />}
              <div>
                <button className="lp-button lp-button-secondary" type="button" onClick={onSignOut}>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <ConfirmActionDialog
        open={newCodeConfirmOpen}
        busy={visibleSiteBusy === "code"}
        title="Make a new class code?"
        body={`The old code for ${actionableClass?.name || "this class"} stops working straight away, so every student in the class needs the new code before they can sign in again.`}
        confirmLabel="Make a new code"
        error={newCodeError}
        onCancel={() => {
          setNewCodeConfirmOpen(false);
          setNewCodeError("");
        }}
        onConfirm={regenerateCode}
      />

      <LearnerDataRightsDialog
        key={visiblePrivacyStudent?.id || "closed-settings-privacy"}
        client={client}
        learner={visiblePrivacyStudent}
        open={Boolean(visiblePrivacyStudent)}
        onClose={() => setPrivacyStudent(null)}
        onDeleted={async learner => {
          const deletedClassId = String(learner?.class_id || selectedClassId || "");
          const deletedStudentId = learner?.id || "";
          if (deletedStudentId) {
            setDeletedStudentIds(previous => (
              previous.includes(deletedStudentId)
                ? previous
                : [...previous, deletedStudentId]
            ));
          }
          setPrivacyStudent(null);
          setPrivacyStudentId("");
          let refreshed;
          try {
            refreshed = await onReloadStudents?.(deletedClassId);
          } catch {
            refreshed = null;
          }
          setStatus(
            refreshed === null
              ? `${TEACHER_COPY.privacy.deleteComplete(learner?.name || "The student")} We couldn't refresh the student list, so the deleted student has been removed from this page. Try loading the list again.`
              : TEACHER_COPY.privacy.deleteComplete(learner?.name || "The student"),
            refreshed === null ? "error" : "status",
            {
              sectionId: "privacy",
              classId: deletedClassId,
              retry: refreshed === null ? "students" : ""
            }
          );
        }}
      />
    </TeacherPageShell>
  );
}
