/* eslint-disable react-hooks/set-state-in-effect -- LEGACY-LINT: this page syncs route state from browser history. */
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { SchoolNameInput } from "./SchoolNameInput.jsx";
import { readErrorLog, clearErrorLog } from "../utils/errorLog.js";
import { QuestionFlagReviewPage } from "./admin/QuestionFlagReviewPage.jsx";
import { SchoolRetentionPolicyPanel } from "./admin/SchoolRetentionPolicyPanel.jsx";
import { GuidedReadingReviewPanel } from "./admin/GuidedReadingReviewPanel.jsx";
import { TeacherActivitySyncHealth } from "./teacher/TeacherActivitySyncHealth.jsx";
import { TeacherDialog } from "./teacher/ui/TeacherDialog.jsx";
import { LearnerDataRightsDialog } from "./teacher/LearnerDataRightsDialog.jsx";
import { clearLocalElAssessmentDataForStudent } from "../utils/elAssessmentReset.js";
import { clearAndVerifyLocalProgressForStudent } from "../utils/progressSync.js";
import {
  FLEET_ERROR_BUDGET_POLICY,
  evaluateFleetErrorBudget
} from "../policy/fleetErrorBudget.js";
import {
  ADMIN_SECTION_ROUTES,
  adminPathForSection,
  adminQaHistoryState,
  adminRouteForPath,
  shouldCloseAdminQaWithHistoryBack,
  withoutAdminQaHistoryState
} from "../appState/adminQaNavigation.js";
import {
  TEACHER_ACCOUNT_DECISION_STATUSES,
  resolveTeacherAccountSchool,
  validateTeacherAccountDecision
} from "../appState/adminAccountDecision.js";
import {
  loadTeacherAccountDecisionHistory
} from "../data/teacherAccountDecisionHistory.js";

function getTeacherAccountApprovalStatus(account = {}) {
  return String(account.approval_status || account.status || "pending").toLowerCase();
}

function isPendingTeacherAccount(account = {}) {
  return getTeacherAccountApprovalStatus(account) === "pending";
}

export function AdminDashboardPage({
  teachers = [],
  classes = [],
  students = [],
  schools = [],
  setTeacherSchool,
  pendingAccounts = [],
  pendingAccountsWarning = "",
  loading,
  refreshDashboard,
  deleteClass,
  updateTeacherAccountStatus,
  guidedReadingReviews = [],
  guidedReadingReviewStatus = "loading",
  guidedReadingReviewError = null,
  refreshGuidedReadingReviews,
  reviewGuidedReadingBook,
  supabase = null,
  message,
  onLoadStudent
}) {
  const [expandedTeacherId, setExpandedTeacherId] = useState("");
  const [retentionSchoolId, setRetentionSchoolId] = useState("");
  const [teacherSchoolDraft, setTeacherSchoolDraft] = useState("");
  // Per-row school drafts for the signup queue. Keyed by account, because more
  // than one request can be waiting on a school at the same time and a single
  // shared draft would let a fix land on the wrong teacher.
  const [signupSchoolDrafts, setSignupSchoolDrafts] = useState({});
  const initialAdminRoute = typeof window === "undefined"
    ? null
    : adminRouteForPath(window.location.pathname);
  const [activeSection, setActiveSection] = useState(
    initialAdminRoute?.sectionId || "overview"
  );
  const [dataRightsStudent, setDataRightsStudent] = useState(null);
  const [adminNotice, setAdminNotice] = useState("");
  const [showReviewedSignupAccounts, setShowReviewedSignupAccounts] = useState(false);
  const [accountDecision, setAccountDecision] = useState(null);
  const [accountDecisionReason, setAccountDecisionReason] = useState("");
  const [accountDecisionBusy, setAccountDecisionBusy] = useState(false);
  const [accountDecisionError, setAccountDecisionError] = useState("");
  const [accountDecisionNotice, setAccountDecisionNotice] = useState("");
  const [accountDecisionHistoryState, setAccountDecisionHistoryState] = useState({
    error: null,
    rows: [],
    status: "idle"
  });
  const accountDecisionHistorySequenceRef = useRef(0);
  const refreshTeacherAccountDecisionHistory = useCallback(async () => {
    const sequence = accountDecisionHistorySequenceRef.current + 1;
    accountDecisionHistorySequenceRef.current = sequence;
    setAccountDecisionHistoryState(previous => ({
      ...previous,
      error: null,
      status: "loading"
    }));
    const result = await loadTeacherAccountDecisionHistory({
      client: supabase
    });
    if (accountDecisionHistorySequenceRef.current !== sequence) return result;
    setAccountDecisionHistoryState({
      error: result.error || null,
      rows: result.complete ? result.rows : [],
      status: result.status
    });
    return result;
  }, [supabase]);

  useEffect(() => {
    function syncAdminRouteFromHistory() {
      const route = adminRouteForPath(window.location.pathname);
      if (!route) return;
      if (route.redirectFrom) {
        window.history.replaceState(
          withoutAdminQaHistoryState(window.history.state),
          "",
          route.path
        );
      }
      setActiveSection(route.sectionId);
    }
    syncAdminRouteFromHistory();
    window.addEventListener("popstate", syncAdminRouteFromHistory);
    return () => window.removeEventListener("popstate", syncAdminRouteFromHistory);
  }, []);

  useEffect(() => {
    if (activeSection !== "signups") return;
    void refreshTeacherAccountDecisionHistory();
  }, [activeSection, refreshTeacherAccountDecisionHistory]);
  const selectedClassRow = classes[0] || {};
  const selectedClassId = selectedClassRow.id || "";
  function closeAdminQaPage() {
    if (typeof window === "undefined") {
      setActiveSection("operations");
      return;
    }
    if (shouldCloseAdminQaWithHistoryBack(window.history.state)) {
      window.history.back();
      return;
    }
    const nextPath = adminPathForSection("operations");
    const nextState = withoutAdminQaHistoryState(window.history.state);
    window.history.replaceState(
      nextState,
      "",
      nextPath
    );
    setActiveSection("operations");
  }

  async function handleAdminDataRightsDeletion(learner) {
    // LearnerDataRightsDialog only invokes this after both local cleanup
    // layers have been verified and the tracked request is complete.
    setDataRightsStudent(null);
    setAdminNotice(
      `${learner.name}'s data was deleted. The privacy-safe request reference remains in the audit log.`
    );
    await refreshDashboard?.();
  }

  async function handleRetentionLearnersDeleted(studentIds = []) {
    for (const deletedStudentId of studentIds) {
      const learner = students.find(row => row.id === deletedStudentId);
      await clearAndVerifyLocalProgressForStudent(deletedStudentId);
      await clearLocalElAssessmentDataForStudent({
        teacherId: learner?.teacher_id || "",
        studentId: deletedStudentId,
        studentName: learner?.name || ""
      });
    }
  }

  function schoolForTeacherAccount(account = {}) {
    return resolveTeacherAccountSchool(account, schools);
  }

  function openTeacherAccountDecision(account, status) {
    if (!account?.id || !TEACHER_ACCOUNT_DECISION_STATUSES.includes(status)) {
      return;
    }
    setAccountDecision({ account, status });
    setAccountDecisionReason("");
    setAccountDecisionError("");
    setAccountDecisionNotice("");
  }

  function closeTeacherAccountDecision() {
    if (accountDecisionBusy) return;
    setAccountDecision(null);
    setAccountDecisionReason("");
    setAccountDecisionError("");
  }

  async function submitTeacherAccountDecision(event) {
    event.preventDefault();
    if (!accountDecision || accountDecisionBusy) return;

    const { account, status } = accountDecision;
    const validation = validateTeacherAccountDecision({
      account,
      schools,
      status,
      reason: accountDecisionReason
    });
    if (!validation.ok) {
      setAccountDecisionError(validation.errorMessage);
      return;
    }

    setAccountDecisionBusy(true);
    setAccountDecisionError("");
    try {
      const result = await updateTeacherAccountStatus?.(
        account.id,
        status,
        validation.reason
      );
      if (!result?.ok) {
        setAccountDecisionError(
          result?.errorMessage || "The decision was not saved. Try again."
        );
        return;
      }
      const teacherLabel =
        account.display_name || account.name || account.email || "Teacher account";
      setAccountDecisionNotice(
        `${teacherLabel} was ${status}.`
      );
      setAccountDecision(null);
      setAccountDecisionReason("");
      void refreshTeacherAccountDecisionHistory();
    } catch (error) {
      console.error("Teacher account decision failed.", error);
      setAccountDecisionError("The decision was not saved. Try again.");
    } finally {
      setAccountDecisionBusy(false);
    }
  }

  // Ordered by who has been left waiting longest, with anyone who has actually
  // asked first. Nothing in this application tells an administrator a request
  // exists — no mail, no webhook, no realtime — so when the queue is finally
  // opened, the order it appears in is the only prioritisation there is.
  // Alphabetical or insertion order would bury the person who has waited a week.
  const pendingSignupAccounts = [...pendingAccounts.filter(isPendingTeacherAccount)]
    .sort((left, right) => {
      const asked = Number(Boolean(right.nudged_at)) - Number(Boolean(left.nudged_at));
      if (asked !== 0) return asked;
      const leftAt = new Date(left.requested_at || left.created_at || 0).getTime();
      const rightAt = new Date(right.requested_at || right.created_at || 0).getTime();
      return leftAt - rightAt;
    });
  const reviewedSignupAccounts = pendingAccounts.filter(account => !isPendingTeacherAccount(account));
  const visibleSignupCount = pendingSignupAccounts.length;
  // Requests you cannot act on. They are counted in the pill like any other, so
  // without this the number reads as work waiting for a decision when in fact
  // Approve is disabled on them and no decision is possible until the school is
  // set. Surfacing it separately is the difference between "3 to review" and
  // "3 to review, 3 of which are stuck".
  const blockedSignupCount = pendingSignupAccounts
    .filter(account => !schoolForTeacherAccount(account)).length;

  const adminSections = [
    { id: "overview", label: "Overview", count: null },
    { id: "readingBooks", label: "Reading books", count: null },
    { id: "signups", label: "Teacher requests", count: pendingAccountsWarning ? null : visibleSignupCount },
    { id: "schools", label: "Schools", count: schools.length },
    { id: "teachers", label: "Teachers", count: teachers.length },
    { id: "classes", label: "Classes", count: classes.length },
    { id: "students", label: "Student data", count: students.length },
    { id: "operations", label: "Support & safety", count: null }
  ];

  function openAdminSection(sectionId) {
    const route = ADMIN_SECTION_ROUTES[sectionId];
    if (!route) return;
    setActiveSection(sectionId);
    if (
      typeof window !== "undefined"
      && window.location.pathname !== route.path
    ) {
      window.history.pushState(
        adminQaHistoryState(window.history.state, sectionId),
        "",
        route.path
      );
    }
  }

  if (activeSection === "questionFlags") {
    return <QuestionFlagReviewPage onBack={closeAdminQaPage} supabase={supabase} />;
  }

  return (
    <main className="admin-dashboard page-stack">
      <section className="card page-stack">
        <div className="admin-header">
          <div className="admin-page-heading">
            <h2>Admin Dashboard</h2>
            <p className="muted-text">Manage schools, teacher accounts, classes and student data.</p>
          </div>

          <div className="button-row admin-controls">
            {refreshDashboard && (
              <button className="report-button" onClick={refreshDashboard} disabled={loading} type="button">
                {loading ? "Loading..." : "Refresh"}
              </button>
            )}
          </div>
        </div>

        {message && <p className="message">{message}</p>}
        {adminNotice && <p className="message" role="status">{adminNotice}</p>}

        <label className="teacher-section-select">
          Choose an admin page
          <select value={activeSection} onChange={event => openAdminSection(event.target.value)}>
            {adminSections.map(section => (
              <option key={section.id} value={section.id}>{section.label}</option>
            ))}
          </select>
        </label>

        <nav className="admin-section-tabs" aria-label="Admin pages">
          {adminSections.map(section => (
            <button
              className={activeSection === section.id ? "active" : ""}
              aria-current={activeSection === section.id ? "page" : undefined}
              key={section.id}
              onClick={() => openAdminSection(section.id)}
              type="button"
            >
              <span>{section.label}</span>
              {typeof section.count === "number" && <small>{section.count}</small>}
            </button>
          ))}
        </nav>
      </section>

      {activeSection === "overview" && (
        <section className="report-panel page-stack admin-section admin-section-panel">
          <div className="admin-section-heading">
            <div>
              <h3>Dashboard Summary</h3>
              <p className="muted-text">Jump into the admin area you need without scrolling through every tool.</p>
            </div>
          </div>
          <div className="admin-overview-grid">
            {adminSections.filter(section => section.id !== "overview").map(section => (
              <button
                className="admin-overview-card"
                key={section.id}
                onClick={() => openAdminSection(section.id)}
                type="button"
              >
                <span>{section.label}</span>
                <strong>{section.count}</strong>
              </button>
            ))}
          </div>
        </section>
      )}

      {activeSection === "signups" && (
      <section className="card page-stack admin-section admin-section-panel">
        <div className="admin-section-heading">
          <div>
            <h3>Signup Requests</h3>
            <p className="muted-text">Approve or reject teacher account requests. Pending requests are blocked from the app until approved.</p>
            {!pendingAccountsWarning && blockedSignupCount > 0 && (
              <p className="message admin-account-blocked-notice" role="status">
                {blockedSignupCount === 1
                  ? "1 request cannot be approved until its school is set. Set it in the School column."
                  : `${blockedSignupCount} requests cannot be approved until their school is set. Set it in the School column.`}
              </p>
            )}
          </div>
          <span className="admin-count-pill">{pendingAccountsWarning ? "Unavailable" : visibleSignupCount}</span>
        </div>
        {accountDecisionNotice && (
          <p className="message admin-account-decision-notice" role="status">
            {accountDecisionNotice}
          </p>
        )}
        {!pendingAccountsWarning && reviewedSignupAccounts.length > 0 && (
          <label className="admin-inline-toggle">
            <input
              checked={showReviewedSignupAccounts}
              onChange={event => setShowReviewedSignupAccounts(event.target.checked)}
              type="checkbox"
            />
            <span>Show reviewed accounts</span>
          </label>
        )}
        {pendingAccountsWarning ? (
          <div className="admin-section-warning" role="status">
            {pendingAccountsWarning}
          </div>
        ) : pendingSignupAccounts.length === 0 ? (
          <p>No pending signup requests.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="dashboard-table admin-table admin-responsive-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Name</th>
                  <th>School</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Reviewed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingSignupAccounts.map(account => {
                  const accountStatus = getTeacherAccountApprovalStatus(account);
                  const isPending = accountStatus === "pending";
                  const accountSchool = schoolForTeacherAccount(account);
                  const accountKey = account.id || account.user_id || account.email;

                  return (
                    <tr key={accountKey} data-account-blocked={!accountSchool ? "no-school" : undefined}>
                      <td data-label="Email">{account.email || "Email unavailable"}</td>
                      <td data-label="Username">{account.username || "-"}</td>
                      <td data-label="Name">{account.display_name || account.name || "-"}</td>
                      <td data-label="School">
                        {accountSchool ? (
                          accountSchool.name
                        ) : (
                          // An unresolved school used to be a dead end: Approve
                          // was disabled, the only school editor lived in the
                          // Teachers section, and that list is built from
                          // classes/students/answers — which a pending teacher
                          // has none of. The account could only be rescued with
                          // hand-written SQL. This is the way out.
                          <div className="admin-account-school-repair">
                            <span className="admin-account-school-missing">
                              School not resolved — set it to approve
                            </span>
                            <SchoolNameInput
                              value={signupSchoolDrafts[accountKey] ?? ""}
                              placeholder="Choose or type this teacher's school"
                              onChange={value => setSignupSchoolDrafts(drafts => ({
                                ...drafts,
                                [accountKey]: value
                              }))}
                            />
                            <button
                              className="report-button"
                              type="button"
                              disabled={!(signupSchoolDrafts[accountKey] || "").trim() || !account.user_id}
                              onClick={() => setTeacherSchool?.(
                                account.user_id,
                                signupSchoolDrafts[accountKey]
                              )}
                            >
                              Save school
                            </button>
                          </div>
                        )}
                      </td>
                      <td data-label="Status">
                        {accountStatus}
                        {account.nudged_at && (
                          // They pressed "I am still waiting". Shown here rather
                          // than only in the sort order, because a request that
                          // has asked twice is a different thing from one that
                          // has asked once and the order alone cannot say so.
                          <span className="admin-account-nudged" title="This teacher asked about their request">
                            {Number(account.nudge_count) > 1
                              ? `Asked ${account.nudge_count}×`
                              : "Asked"}
                          </span>
                        )}
                      </td>
                      <td data-label="Requested">{(account.requested_at || account.created_at) ? new Date(account.requested_at || account.created_at).toLocaleDateString() : ""}</td>
                      <td data-label="Reviewed">{account.reviewed_at ? new Date(account.reviewed_at).toLocaleDateString() : "Not reviewed"}</td>
                      <td data-label="Actions">
                        {isPending ? (
                          <div className="admin-row-actions">
                            <button
                              className="report-button"
                              disabled={!accountSchool}
                              onClick={() => openTeacherAccountDecision(account, "approved")}
                              title={!accountSchool ? "Resolve the teacher's school before approving access." : undefined}
                              type="button"
                            >
                              Approve
                            </button>
                            <button
                              className="report-button danger"
                              onClick={() => openTeacherAccountDecision(account, "rejected")}
                              type="button"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="muted-text">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!pendingAccountsWarning && showReviewedSignupAccounts && reviewedSignupAccounts.length > 0 && (
          <div className="admin-reviewed-signups">
            <h4>Reviewed accounts</h4>
            <div className="admin-table-wrap">
              <table className="dashboard-table admin-table admin-responsive-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Name</th>
                    <th>School</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Reviewed</th>
                    <th>Decision note</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewedSignupAccounts.map(account => {
                    const accountStatus = getTeacherAccountApprovalStatus(account);
                    const accountSchool = schoolForTeacherAccount(account);
                    const canApprove = Boolean(accountSchool);

                    return (
                      <tr key={account.id || account.user_id || account.email}>
                        <td data-label="Email">{account.email || "Email unavailable"}</td>
                        <td data-label="Username">{account.username || "-"}</td>
                        <td data-label="Name">{account.display_name || account.name || "-"}</td>
                        <td data-label="School">
                          {accountSchool ? (
                            accountSchool.name
                          ) : (
                            <span className="admin-account-school-missing">
                              School not resolved
                            </span>
                          )}
                        </td>
                        <td data-label="Status">{accountStatus}</td>
                        <td data-label="Requested">{(account.requested_at || account.created_at) ? new Date(account.requested_at || account.created_at).toLocaleDateString() : ""}</td>
                        <td data-label="Reviewed">{account.reviewed_at ? new Date(account.reviewed_at).toLocaleDateString() : "Not reviewed"}</td>
                        <td data-label="Decision note">
                          {account.rejection_reason || (
                            accountStatus === "approved"
                              ? "Approved"
                              : "No reason recorded"
                          )}
                        </td>
                        <td data-label="Actions">
                          {accountStatus === "approved" ? (
                            <button
                              className="report-button danger"
                              onClick={() => openTeacherAccountDecision(account, "disabled")}
                              type="button"
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              className="report-button"
                              disabled={!canApprove}
                              onClick={() => openTeacherAccountDecision(account, "approved")}
                              title={!canApprove ? "Resolve the teacher's school before approving access." : undefined}
                              type="button"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <section
          aria-labelledby="admin-account-decision-history-title"
          className="admin-account-decision-history page-stack"
        >
          <div className="admin-section-heading">
            <div>
              <h4 id="admin-account-decision-history-title">
                Account decision history
              </h4>
              <p className="muted-text">
                An append-only record of approvals, rejections and disabled access.
              </p>
            </div>
            <button
              className="report-button"
              disabled={accountDecisionHistoryState.status === "loading"}
              onClick={refreshTeacherAccountDecisionHistory}
              type="button"
            >
              {accountDecisionHistoryState.status === "loading"
                ? "Loading history…"
                : "Refresh history"}
            </button>
          </div>
          {accountDecisionHistoryState.status === "loading" ? (
            <p className="admin-decision-history-state" role="status">
              Loading account decision history…
            </p>
          ) : accountDecisionHistoryState.status === "error" ? (
            <div className="admin-section-warning" role="alert">
              <strong>Decision history could not be loaded.</strong>
              <span>
                The latest account status above is still available, but the history has not been treated as empty. Try again.
              </span>
            </div>
          ) : accountDecisionHistoryState.status === "unavailable" ? (
            <div className="admin-section-warning" role="status">
              <strong>Decision history is unavailable.</strong>
              <span>
                No empty-history conclusion has been made. Reconnect the Admin data service and refresh.
              </span>
            </div>
          ) : accountDecisionHistoryState.status === "complete"
            && accountDecisionHistoryState.rows.length === 0 ? (
              <p className="admin-decision-history-state">
                No account decisions have been recorded yet.
              </p>
            ) : accountDecisionHistoryState.status === "complete" ? (
              <div className="admin-table-wrap">
                <table className="dashboard-table admin-table admin-responsive-table admin-decision-history-table">
                  <thead>
                    <tr>
                      <th>Teacher account</th>
                      <th>Decision</th>
                      <th>Reason</th>
                      <th>School at decision</th>
                      <th>Reviewed</th>
                      <th>Reviewer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountDecisionHistoryState.rows.map(event => {
                      const currentAccount = pendingAccounts.find(account => (
                        account.id === event.account_id
                        || account.user_id === event.teacher_user_id
                      ));
                      const accountLabel = currentAccount?.display_name
                        || currentAccount?.name
                        || currentAccount?.email
                        || `Account ending ${String(event.teacher_user_id || "").slice(-8)}`;
                      const decidedAt = event.decided_at
                        ? new Date(event.decided_at).toLocaleString()
                        : "Time unavailable";
                      const reviewerId = String(event.decided_by || "");
                      const reviewerLabel = reviewerId
                        ? `Admin ID ending ${reviewerId.slice(-8)}`
                        : "Reviewer unavailable";
                      return (
                        <tr key={event.id}>
                          <td data-label="Teacher account">{accountLabel}</td>
                          <td data-label="Decision">
                            <strong>{event.decision_status}</strong>
                            <small>
                              {event.previous_status === "unknown"
                                ? "Earlier status unavailable"
                                : `Previously ${event.previous_status}`}
                            </small>
                          </td>
                          <td data-label="Reason">
                            {event.reason || (
                              event.decision_status === "approved"
                                ? "Not required for approval"
                                : "No reason was recorded"
                            )}
                          </td>
                          <td data-label="School at decision">
                            {event.school_name || "No school snapshot recorded"}
                          </td>
                          <td data-label="Reviewed">{decidedAt}</td>
                          <td data-label="Reviewer">
                            <span title={reviewerId || undefined}>
                              {reviewerLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-decision-history-state" role="status">
                Decision history has not been loaded yet.
              </p>
            )}
        </section>
        {accountDecision && (
          <div
            className="admin-account-decision-overlay"
            onMouseDown={event => {
              if (event.target === event.currentTarget) closeTeacherAccountDecision();
            }}
          >
            <TeacherDialog
              busy={accountDecisionBusy}
              className="admin-account-decision-dialog"
              closeOnEscape={!accountDecisionBusy}
              describedBy="admin-account-decision-summary"
              labelledBy="admin-account-decision-title"
              onClose={closeTeacherAccountDecision}
            >
              <form className="page-stack" onSubmit={submitTeacherAccountDecision}>
                <div>
                  <p className="panel-label">Teacher account decision</p>
                  <h4 id="admin-account-decision-title">
                    Confirm {accountDecision.status === "approved"
                      ? "approval"
                      : accountDecision.status === "rejected"
                        ? "rejection"
                        : "account disable"}
                  </h4>
                </div>
                <p id="admin-account-decision-summary">
                  <strong>
                    {accountDecision.account.display_name
                      || accountDecision.account.name
                      || accountDecision.account.email
                      || "Teacher account"}
                  </strong>
                  {" · "}
                  {accountDecision.account.email || "Email unavailable"}
                  {" · "}
                  {schoolForTeacherAccount(accountDecision.account)?.name
                    || "School not resolved"}
                </p>
                {accountDecision.status === "approved" ? (
                  <p className="muted-text">
                    Approval opens this school&apos;s teacher tools and student data to this account.
                  </p>
                ) : (
                  <label className="auth-field" htmlFor="admin-account-decision-reason">
                    <strong>
                      Reason for {accountDecision.status === "rejected"
                        ? "rejection"
                        : "disabling the account"}
                    </strong>
                    <textarea
                      id="admin-account-decision-reason"
                      maxLength={500}
                      minLength={5}
                      onChange={event => {
                        setAccountDecisionReason(event.target.value);
                        setAccountDecisionError("");
                      }}
                      required
                      rows={4}
                      value={accountDecisionReason}
                    />
                    <span className="muted-text auth-field-hint">
                      Use plain, factual wording. This note is kept with the review record.
                    </span>
                  </label>
                )}
                {accountDecisionError && (
                  <p className="admin-account-decision-error" role="alert">
                    {accountDecisionError}
                  </p>
                )}
                <div className="button-row admin-account-decision-actions">
                  <button
                    className="report-button"
                    data-autofocus
                    disabled={accountDecisionBusy}
                    onClick={closeTeacherAccountDecision}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className={accountDecision.status === "approved"
                      ? "main-button"
                      : "report-button danger"}
                    disabled={accountDecisionBusy || (
                      accountDecision.status !== "approved"
                      && accountDecisionReason.trim().length < 5
                    )}
                    type="submit"
                  >
                    {accountDecisionBusy
                      ? "Saving decision…"
                      : `Confirm ${accountDecision.status === "approved"
                        ? "approval"
                        : accountDecision.status === "rejected"
                          ? "rejection"
                          : "disable"}`}
                  </button>
                </div>
              </form>
            </TeacherDialog>
          </div>
        )}
      </section>
      )}

      {activeSection === "schools" && (
      <section className="card page-stack admin-section admin-section-panel">
        <h3>Schools</h3>
        <p className="muted-text">Every school registered in the system, with its teachers and classes.</p>
        {schools.length === 0 ? (
          <p>No schools registered yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="dashboard-table admin-table">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Teachers</th>
                  <th>Classes</th>
                  <th>Students</th>
                  <th>Created</th>
                  <th>Retention</th>
                </tr>
              </thead>
              <tbody>
                {schools.map(school => {
                  const schoolTeachers = pendingAccounts.filter(account => account.school_id === school.id);
                  const schoolClasses = classes.filter(row => row.school_id === school.id);
                  const schoolStudents = schoolClasses.reduce((sum, row) => sum + (row.studentCount || 0), 0);
                  const retentionOpen = retentionSchoolId === school.id;
                  return (
                    <Fragment key={school.id}>
                      <tr>
                        <td data-label="School"><strong>{school.name}</strong></td>
                        <td data-label="Teachers">
                          {schoolTeachers.length === 0
                            ? "0"
                            : schoolTeachers.map(account => account.display_name || account.username || account.email).join(", ")}
                        </td>
                        <td data-label="Classes">{schoolClasses.length}</td>
                        <td data-label="Students">{schoolStudents}</td>
                        <td data-label="Created">{school.created_at ? new Date(school.created_at).toLocaleDateString() : "-"}</td>
                        <td data-label="Retention">
                          <button
                            className="text-button"
                            type="button"
                            disabled={!supabase}
                            onClick={() => setRetentionSchoolId(retentionOpen ? "" : school.id)}
                          >
                            {retentionOpen ? "Close policy" : "Open policy"}
                          </button>
                        </td>
                      </tr>
                      {retentionOpen && supabase && (
                        <tr className="admin-retention-detail-row">
                          <td colSpan={6}>
                            <SchoolRetentionPolicyPanel
                              client={supabase}
                              school={school}
                              onChanged={refreshDashboard}
                              onLearnersDeleted={handleRetentionLearnersDeleted}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}

      {activeSection === "teachers" && (
      <section className="card page-stack admin-section admin-section-panel">
        <h3>Teachers</h3>
        <p className="muted-text">Tap a teacher to see their classes and move them to another school.</p>
        {teachers.length === 0 ? (
          <p>No teacher data loaded.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="dashboard-table admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>School</th>
                  <th>Classes</th>
                  <th>Students</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(teacher => {
                  const account = pendingAccounts.find(row => row.user_id === teacher.id);
                  const school = schools.find(row => row.id === account?.school_id);
                  const teacherClasses = classes.filter(row => row.teacher_id === teacher.id);
                  const isExpanded = expandedTeacherId === teacher.id;
                  return (
                    <Fragment key={teacher.id}>
                      <tr>
                        <td data-label="Name">{account?.display_name || account?.username || "-"}</td>
                        <td data-label="Email">{teacher.email}</td>
                        <td data-label="School">{school?.name || <em className="muted-text">No school</em>}</td>
                        <td data-label="Classes">{teacher.classes}</td>
                        <td data-label="Students">{teacher.students}</td>
                        <td data-label="Details">
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => {
                              setExpandedTeacherId(isExpanded ? "" : teacher.id);
                              setTeacherSchoolDraft(school?.name || "");
                            }}
                          >
                            {isExpanded ? "Hide" : "Open"}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="admin-teacher-detail-row">
                          <td colSpan={6}>
                            <div className="admin-teacher-detail">
                              <div>
                                <h4>Classes</h4>
                                {teacherClasses.length === 0 ? (
                                  <p className="muted-text">No classes yet.</p>
                                ) : (
                                  <ul className="admin-teacher-class-list">
                                    {teacherClasses.map(row => (
                                      <li key={row.id}>
                                        <strong>{row.name}</strong>
                                        <span>{row.studentCount || 0} student{(row.studentCount || 0) === 1 ? "" : "s"}</span>
                                        <button className="text-button danger" type="button" onClick={() => deleteClass?.(row.id, row.name)}>
                                          Delete
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              <div>
                                <h4>School</h4>
                                <div className="admin-teacher-school-edit">
                                  <SchoolNameInput
                                    value={teacherSchoolDraft}
                                    placeholder="Choose or type a school"
                                    onChange={setTeacherSchoolDraft}
                                  />
                                  <button
                                    className="lp-button lp-button-primary"
                                    type="button"
                                    disabled={!teacherSchoolDraft.trim()}
                                    onClick={() => setTeacherSchool?.(teacher.id, teacherSchoolDraft)}
                                  >
                                    Save School
                                  </button>
                                </div>
                                <p className="muted-text">Moving a teacher also moves all of their classes to the new school.</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}

      {activeSection === "classes" && (
      <section className="report-panel page-stack admin-section admin-section-panel">
        <h3>Classes</h3>
        <div className="admin-table-wrap teacher-scroll-panel">
          <table className="dashboard-table admin-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Teacher</th>
                <th>Students</th>
                <th>Created</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(row => (
                <tr key={row.id}>
                  <td data-label="Name">{row.name}</td>
                  <td data-label="Teacher">{row.teacher_id}</td>
                  <td data-label="Students">{row.studentCount}</td>
                  <td data-label="Created">{row.created_at ? new Date(row.created_at).toLocaleDateString() : ""}</td>
                  <td data-label="Delete">
                    <button className="reset-button" onClick={() => deleteClass(row.id, row.name)} type="button">
                      Delete Class
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {activeSection === "students" && (
      <section className="report-panel page-stack admin-section admin-section-panel">
        <h3>Students</h3>
        <div className="admin-table-wrap teacher-scroll-panel">
          <table className="dashboard-table admin-table admin-responsive-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Teacher</th>
                <th>Created</th>
                {onLoadStudent && <th>Load</th>}
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {students.map(row => (
                <tr key={row.id}>
                  <td data-label="Name">
                    {onLoadStudent ? (
                      <button
                        className="lp-button lp-button-secondary compact-table-action"
                        onClick={() => onLoadStudent(row.id, row.name)}
                        type="button"
                      >
                        {row.name}
                      </button>
                    ) : row.name}
                  </td>
                  <td data-label="Class">{row.className}</td>
                  <td data-label="Teacher">{row.teacher_id}</td>
                  <td data-label="Created">{row.created_at ? new Date(row.created_at).toLocaleDateString() : ""}</td>
                  {onLoadStudent && (
                    <td data-label="Load">
                      <button
                        className="lp-button lp-button-primary compact-table-action"
                        onClick={() => onLoadStudent(row.id, row.name)}
                        type="button"
                      >
                        Load -&gt;
                      </button>
                    </td>
                  )}
                  <td data-label="Delete">
                    <button className="reset-button" onClick={() => setDataRightsStudent(row)} type="button">
                      Export or delete data
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {activeSection === "readingBooks" && (
        <GuidedReadingReviewPanel
          onRefresh={refreshGuidedReadingReviews}
          onReviewBook={reviewGuidedReadingBook}
          reviewError={guidedReadingReviewError}
          reviews={guidedReadingReviews}
          reviewStatus={guidedReadingReviewStatus}
        />
      )}

      {activeSection === "operations" && (
        <>
          <section className="report-panel page-stack admin-section admin-section-panel">
            <div className="admin-section-heading">
              <div>
                <h3>Support &amp; safety</h3>
                <p className="muted-text">
                  Review reported questions, class sync health and redacted app errors.
                </p>
              </div>
              <button
                className="lp-button lp-button-primary"
                onClick={() => openAdminSection("questionFlags")}
                type="button"
              >
                Open reported questions
              </button>
            </div>
          </section>
          {selectedClassId && (
            <TeacherActivitySyncHealth
              supabase={supabase}
              classId={selectedClassId}
              className={selectedClassRow.name || "No class selected"}
            />
          )}
          <RemoteErrorMonitorPanel client={supabase} />
          <CrashLogPanel />
        </>
      )}
      <LearnerDataRightsDialog
        key={dataRightsStudent?.id || "closed-data-rights"}
        client={supabase}
        learner={dataRightsStudent}
        open={Boolean(dataRightsStudent)}
        onClose={() => setDataRightsStudent(null)}
        onDeleted={handleAdminDataRightsDeletion}
      />
    </main>
  );
}

function RemoteErrorMonitorPanel({ client }) {
  const [summary, setSummary] = useState([]);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState(client ? "loading" : "unavailable");

  async function loadMonitor() {
    if (!client?.call) {
      setStatus("unavailable");
      return;
    }
    setStatus("loading");
    const [summaryResult, eventResult] = await Promise.all([
      client.call("admin_error_monitor_summary"),
      client.call("admin_recent_error_events", { p_limit: 25 })
    ]);
    if (summaryResult.error || eventResult.error) {
      setStatus("error");
      return;
    }
    setSummary(Array.isArray(summaryResult.data) ? summaryResult.data : []);
    setEvents(Array.isArray(eventResult.data) ? eventResult.data : []);
    setStatus("ready");
  }

  useEffect(() => {
    void loadMonitor();
    // The client identity is stable for the mounted admin session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  const alertCount = summary.reduce(
    (total, row) => total + Math.max(0, Number(row.alerts_24h) || 0),
    0
  );
  const budgetRows = summary.map(row => ({
    ...row,
    budget: evaluateFleetErrorBudget(row)
  }));

  return (
    <section
      className="card page-stack remote-error-monitor-panel"
      aria-label="Fleet error monitor"
      data-monitor-state={status}
    >
      <div className="admin-monitor-heading">
        <div>
          <p className="panel-label">Operations</p>
          <h2>Fleet error monitor</h2>
          <p className="muted-text">
            Redacted diagnostics only. No student names, answers, class codes, account IDs,
            URLs, or arbitrary message text are collected. Events expire after 30 days.
          </p>
        </div>
        <button className="report-button" type="button" onClick={loadMonitor}>
          Refresh monitor
        </button>
      </div>

      {status === "loading" && <p role="status">Loading remote error health...</p>}
      {status === "unavailable" && (
        <p role="alert">Remote monitoring is unavailable because the backend is not configured.</p>
      )}
      {status === "error" && (
        <p role="alert">Remote monitoring could not be loaded. The on-device fallback remains active.</p>
      )}
      {status === "ready" && (
        <>
          {alertCount > 0 ? (
            <p className="admin-monitor-alert" role="alert">
              {alertCount} fleet alert{alertCount === 1 ? "" : "s"} require review.
            </p>
          ) : (
            <p role="status">No fleet alerts in the last 24 hours.</p>
          )}
          <p className="muted-text">
            Operational error budget: zero fatal or repeat-fingerprint alerts per release
            in a rolling {FLEET_ERROR_BUDGET_POLICY.windowHours}-hour window. This is a
            diagnostic incident budget, not a claim about measured user availability.
          </p>
          {summary.length === 0 ? (
            <p>
              No remote errors recorded in the last 24 hours. Health remains unverified
              until a seeded release event confirms the monitor path.
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <caption>Errors by release in the last 24 hours</caption>
                <thead>
                  <tr>
                    <th scope="col">Release</th>
                    <th scope="col">Events</th>
                    <th scope="col">Fingerprints</th>
                    <th scope="col">Fatal</th>
                    <th scope="col">Alerts</th>
                    <th scope="col">Budget</th>
                    <th scope="col">Latest</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetRows.map(row => (
                    <tr key={row.release_id}>
                      <th scope="row">{row.release_id}</th>
                      <td>{row.events_24h}</td>
                      <td>{row.affected_fingerprints}</td>
                      <td>{row.fatal_events_24h}</td>
                      <td>{row.alerts_24h}</td>
                      <td>
                        <strong data-budget-status={row.budget.status}>
                          {row.budget.label}
                        </strong>
                      </td>
                      <td>{row.latest_at ? new Date(row.latest_at).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <details>
            <summary>Recent redacted events ({events.length})</summary>
            {events.length === 0 ? (
              <p>No retained events.</p>
            ) : (
              <ol className="remote-error-event-list">
                {events.map((event, index) => (
                  <li key={`${event.fingerprint}-${event.occurred_at}-${index}`}>
                    <strong>{event.error_type}</strong>
                    <span>
                      {event.surface} · {event.source} · release {event.release_id}
                    </span>
                    <small>
                      Fingerprint {event.fingerprint} · {new Date(event.occurred_at).toLocaleString()}
                    </small>
                    {Array.isArray(event.stack_frames) && event.stack_frames.length > 0 && (
                      <code>{event.stack_frames[0]}</code>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </details>
        </>
      )}
    </section>
  );
}

// The on-device flight recorder stays as a fallback when remote delivery is
// unavailable. It stores the same redacted fields as the remote monitor.
function CrashLogPanel() {
  const [rows, setRows] = useState(() => readErrorLog());
  if (!rows.length) return null;
  return (
    <section className="card page-stack crash-log-panel">
      <details>
        <summary>
          Recent app errors on this device ({rows.length})
        </summary>
        <p className="muted-text">
          Caught by the in-app safety net. Students saw a friendly &ldquo;try again&rdquo; screen;
          these redacted details remain on this device as a delivery fallback.
        </p>
        <ul className="crash-log-list">
          {rows.map((row, index) => (
            <li key={`${row.at}-${index}`}>
              <strong>{row.label}</strong> · {new Date(row.at).toLocaleString()}
              <div className="crash-log-message">
                {row.message} · release {row.releaseId || "legacy-local"}
              </div>
            </li>
          ))}
        </ul>
        <button
          className="report-button"
          type="button"
          onClick={() => { clearErrorLog(); setRows([]); }}
        >
          Clear log
        </button>
      </details>
    </section>
  );
}
