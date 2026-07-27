import { useEffect, useMemo, useState } from "react";

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
import { LearnerDataRightsDialog } from "./LearnerDataRightsDialog.jsx";
import { ConfirmActionDialog } from "./TeacherAdminDialogs.jsx";
import {
  TeacherPageHeader,
  TeacherPageShell
} from "./ui/TeacherPrimitives.jsx";

const SETTINGS_SECTIONS = Object.freeze([
  { id: "school", label: "School information" },
  { id: "site", label: "Site settings" },
  { id: "privacy", label: "Privacy settings" },
  { id: "account", label: "Account" }
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

export function TeacherSettingsPage({
  client,
  classList = [],
  selectedClassId = "",
  onSelectClass,
  studentList = [],
  archivedStudentList = [],
  schoolName = "",
  onSaveSchool,
  onRegenerateClassCode,
  onReloadStudents,
  teacherEmail = "",
  onSignOut
}) {
  const [section, setSection] = useState(() => readTeacherSettingsSection(
    typeof window === "undefined" ? "" : window.location.hash
  ));
  const [schoolBusy, setSchoolBusy] = useState(false);
  const [siteBusy, setSiteBusy] = useState("");
  const [status, setStatus] = useState("");
  const [privacyStudentId, setPrivacyStudentId] = useState("");
  const [privacyStudent, setPrivacyStudent] = useState(null);
  const [scopeOverrides, setScopeOverrides] = useState({});
  const [expiryOverrides, setExpiryOverrides] = useState({});
  const [accessSummary, setAccessSummary] = useState(null);
  const [accessLog, setAccessLog] = useState([]);
  const [accessLogOpen, setAccessLogOpen] = useState(false);
  const [accessBusy, setAccessBusy] = useState(false);
  const [accessError, setAccessError] = useState(null);
  const [newCodeConfirmOpen, setNewCodeConfirmOpen] = useState(false);

  const allStudents = useMemo(
    () => [...studentList, ...archivedStudentList],
    [archivedStudentList, studentList]
  );
  const selectedClass = classList.find(row => row.id === selectedClassId) || null;
  const selectedScope = scopeOverrides[selectedClassId]
    || selectedClass?.leaderboard_scope
    || "class";
  const selectedExpiry = expiryOverrides[selectedClassId]
    ?? selectedClass?.access_code_expires_at
    ?? null;
  const selectedExpiryLabel = formatExpiryDate(selectedExpiry);
  const visibleAccessSummary = accessSummary && accessSummary.classId === selectedClass?.id
    ? accessSummary.data
    : null;
  const visibleAccessError = accessError && accessError.classId === selectedClass?.id
    ? accessError.message
    : "";

  useEffect(() => {
    const handleHashChange = () => setSection(readTeacherSettingsSection(window.location.hash));
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!selectedClass?.id || !client) return undefined;

    (async () => {
      const result = await loadClassAccessSummary({
        client,
        classId: selectedClass.id
      });
      if (cancelled) return;
      if (result.error) {
        setAccessError({
          classId: selectedClass.id,
          message: "Sign-in activity is temporarily unavailable."
        });
        return;
      }
      setAccessSummary({ classId: selectedClass.id, data: result.data });
    })();

    return () => {
      cancelled = true;
    };
  }, [client, selectedClass?.id]);

  function openSection(nextSection) {
    setSection(nextSection);
    pushRouteHash(teacherSettingsHash(nextSection, selectedClassId));
    setStatus("");
  }

  function changeSelectedClass(classId) {
    setAccessLog([]);
    setAccessLogOpen(false);
    setAccessError(null);
    onSelectClass?.(classId || null);
  }

  async function saveSchool(event) {
    event.preventDefault();
    const cleanName = String(
      new FormData(event.currentTarget).get("schoolName") || ""
    ).trim();
    if (!cleanName) {
      setStatus("Enter a school name.");
      return;
    }
    setSchoolBusy(true);
    setStatus("");
    const saved = await onSaveSchool?.(cleanName);
    setSchoolBusy(false);
    setStatus(saved
      ? "School information saved."
      : "School information was not changed.");
  }

  function askToRegenerateCode() {
    if (!selectedClass?.id || siteBusy) return;
    setNewCodeConfirmOpen(true);
  }

  async function regenerateCode() {
    if (!selectedClass?.id || siteBusy) return;
    setSiteBusy("code");
    setStatus("Making a new class code…");
    const result = await onRegenerateClassCode?.(selectedClass.id);
    setSiteBusy("");
    setNewCodeConfirmOpen(false);
    setStatus(result?.ok
      ? `New class code ${result.accessCode} is ready.`
      : "The class code was not changed.");
  }

  async function copyCode() {
    const code = selectedClass?.access_code;
    if (!code) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(code);
      setStatus(`Class code ${code} copied.`);
    } catch {
      setStatus(`Copy is unavailable. Select the visible code ${code} to copy it manually.`);
    }
  }

  async function toggleAccessLog() {
    if (!selectedClass?.id || accessBusy) return;
    if (accessLogOpen) {
      setAccessLogOpen(false);
      return;
    }
    setAccessLogOpen(true);
    setAccessBusy(true);
    setAccessError(null);
    const result = await loadClassAccessLog({
      client,
      classId: selectedClass.id,
      limit: 20
    });
    setAccessBusy(false);
    if (result.error) {
      setAccessLog([]);
      setAccessError({
        classId: selectedClass.id,
        message: "Sign-in activity is temporarily unavailable."
      });
      return;
    }
    setAccessLog(result.data);
  }

  async function changeExpiry(days) {
    if (!selectedClass?.id || siteBusy) return;
    // Only a real number of days may reach the save. Anything else (for example the
    // option that describes the expiry already in place) must never be read as
    // "remove the expiry".
    const dayCount = Number(days);
    if (!Number.isFinite(dayCount) || dayCount < 0) return;
    const expiresAt = dayCount > 0
      ? new Date(Date.now() + dayCount * 86400000).toISOString()
      : null;
    setSiteBusy("expiry");
    setStatus("Saving class-code expiry…");
    const result = await saveClassCodeExpiry({
      client,
      classId: selectedClass.id,
      expiresAt
    });
    setSiteBusy("");
    if (result.error) {
      setStatus("The class-code expiry was not changed.");
      return;
    }
    setExpiryOverrides(previous => ({
      ...previous,
      [selectedClass.id]: result.data.access_code_expires_at || null
    }));
    setStatus(result.data.access_code_expires_at
      ? "Class-code expiry saved."
      : "This class code will not expire automatically.");
  }

  async function changeLeaderboardScope(scope) {
    if (!selectedClass?.id || siteBusy) return;
    setSiteBusy("leaderboard");
    setStatus("Saving leaderboard visibility…");
    const { data, error } = await client.call("teacher_set_class_leaderboard_scope", {
      p_class_id: selectedClass.id,
      p_scope: scope
    });
    setSiteBusy("");
    if (error || data?.[0]?.leaderboard_scope !== scope) {
      setStatus("Leaderboard visibility was not changed.");
      return;
    }
    setScopeOverrides(previous => ({ ...previous, [selectedClass.id]: scope }));
    setStatus(scope === "school"
      ? "The leaderboard now shows school-wide first names."
      : "The leaderboard now stays inside this class.");
  }

  return (
    <TeacherPageShell className="teacher-settings-page" intent="settings">
      <TeacherPageHeader
        eyebrow="Settings"
        title="Settings"
        description="Choose an area to update school, site, privacy, or account details."
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

        <section className="teacher-settings-panel">
          {section === "school" && (
            <form className="page-stack" onSubmit={saveSchool}>
              <header>
                <p className="panel-label">School information</p>
                <h2>School name</h2>
                <p>This appears in teacher context and school-owned records.</p>
              </header>
              <label>
                <span>School name</span>
                <input
                  key={schoolName}
                  name="schoolName"
                  defaultValue={schoolName}
                  maxLength={120}
                  disabled={schoolBusy}
                />
              </label>
              <div>
                <button className="lp-button lp-button-primary" disabled={schoolBusy} type="submit">
                  {schoolBusy ? "Saving…" : "Save school information"}
                </button>
              </div>
            </form>
          )}

          {section === "site" && (
            <div className="page-stack teacher-site-settings">
              <header>
                <p className="panel-label">Site settings</p>
                <h2>Class sign-in and visibility</h2>
                <p>These settings affect how students enter the app and what a class leaderboard can show.</p>
              </header>
              <label>
                <span>Class</span>
                <select
                  value={selectedClassId || ""}
                  onChange={event => changeSelectedClass(event.target.value)}
                >
                  <option value="">Choose a class</option>
                  {classList.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
                </select>
              </label>
              {selectedClass ? (
                <>
                  <div className="teacher-site-settings-grid">
                    <div className="page-stack">
                      <div className="teacher-settings-card">
                        <div>
                          <h3>Student sign-in code</h3>
                          <p className="teacher-settings-code">{selectedClass.access_code || "Not available"}</p>
                          <small>Making a new code stops the old code immediately.</small>
                        </div>
                        <div className="teacher-settings-card-actions">
                          <button
                            className="lp-button lp-button-secondary"
                            type="button"
                            disabled={Boolean(siteBusy) || !selectedClass.access_code}
                            onClick={copyCode}
                          >
                            Copy code
                          </button>
                          <button
                            className="lp-button lp-button-secondary"
                            type="button"
                            disabled={Boolean(siteBusy)}
                            onClick={askToRegenerateCode}
                          >
                            {siteBusy === "code" ? "Making code…" : "New code"}
                          </button>
                        </div>
                      </div>
                      <label>
                        <span>Code expiry</span>
                        <select
                          value={selectedExpiry ? "current" : "0"}
                          disabled={Boolean(siteBusy)}
                          onChange={event => changeExpiry(event.target.value)}
                        >
                          {selectedExpiry && (
                            <option disabled value="current">
                              {selectedExpiryLabel
                                ? `Stops working on ${selectedExpiryLabel}`
                                : "An expiry is already set"}
                            </option>
                          )}
                          <option value="0">No automatic expiry</option>
                          <option value="1">In 1 day</option>
                          <option value="7">In 7 days</option>
                          <option value="30">In 30 days</option>
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
                            disabled={Boolean(siteBusy)}
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
                            disabled={Boolean(siteBusy)}
                            onChange={() => changeLeaderboardScope("school")}
                          />
                          Whole school
                        </label>
                      </fieldset>
                      <section
                        className={`teacher-class-access-summary${visibleAccessSummary?.anomaly ? " anomaly" : ""}`}
                        role={visibleAccessSummary?.anomaly ? "alert" : undefined}
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
                        ) : (
                          <span>
                            {visibleAccessSummary
                              ? `${visibleAccessSummary.allowed} successful sign-in${visibleAccessSummary.allowed === 1 ? "" : "s"} in the last 24 hours.`
                              : visibleAccessError || "Checking recent sign-in activity…"}
                          </span>
                        )}
                      </section>
                      <div>
                        <button
                          className="lp-button lp-button-secondary"
                          type="button"
                          aria-expanded={accessLogOpen}
                          disabled={accessBusy}
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
                      {accessBusy ? (
                        <p role="status">Loading sign-in activity…</p>
                      ) : visibleAccessError ? (
                        <p role="alert">{visibleAccessError}</p>
                      ) : accessLog.length === 0 ? (
                        <p>No recent sign-in activity.</p>
                      ) : (
                        <ol>
                          {accessLog.map((event, index) => (
                            <li
                              className={`outcome-${event.outcome}`}
                              key={`${event.occurredAt}-${event.eventType}-${index}`}
                            >
                              <strong>{event.label}</strong>
                              <span>{event.deviceLabel} · {formatAccessTime(event.occurredAt)}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </section>
                  )}
                </>
              ) : (
                <p className="teacher-settings-empty">Choose a class to change site settings.</p>
              )}
            </div>
          )}

          {section === "privacy" && (
            <div className="page-stack">
              <header>
                <p className="panel-label">Privacy and data</p>
                <h2>Student data requests</h2>
                <p>Download or permanently delete one student's saved data after the school verifies the request.</p>
              </header>
              <label>
                <span>Student</span>
                <select
                  value={privacyStudentId}
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
              <div>
                <button
                  className="lp-button lp-button-primary"
                  type="button"
                  disabled={!privacyStudentId}
                  onClick={() => setPrivacyStudent(
                    allStudents.find(row => row.id === privacyStudentId) || null
                  )}
                >
                  Open privacy request
                </button>
              </div>
              <p className="muted-text">To correct a name, sign-in pictures, accessibility, or archive status, use Students → More.</p>
            </div>
          )}

          {section === "account" && (
            <div className="page-stack">
              <header>
                <p className="panel-label">Account</p>
                <h2>Teacher account</h2>
                <p>Signed in as <strong>{teacherEmail || "Teacher"}</strong>.</p>
              </header>
              <div>
                <button className="lp-button lp-button-secondary" type="button" onClick={onSignOut}>
                  Sign out
                </button>
              </div>
            </div>
          )}

          {status && <p className="teacher-inline-status" role="status">{status}</p>}
        </section>
      </div>

      <ConfirmActionDialog
        open={newCodeConfirmOpen}
        busy={siteBusy === "code"}
        title="Make a new class code?"
        body={`The old code for ${selectedClass?.name || "this class"} stops working straight away, so every child in the class needs the new code before they can sign in again.`}
        confirmLabel="Make a new code"
        onCancel={() => setNewCodeConfirmOpen(false)}
        onConfirm={regenerateCode}
      />

      <LearnerDataRightsDialog
        key={privacyStudent?.id || "closed-settings-privacy"}
        client={client}
        learner={privacyStudent}
        open={Boolean(privacyStudent)}
        onClose={() => setPrivacyStudent(null)}
        onDeleted={async () => {
          setPrivacyStudent(null);
          setPrivacyStudentId("");
          await onReloadStudents?.(selectedClassId);
          setStatus("The student's data has been deleted.");
        }}
      />
    </TeacherPageShell>
  );
}
