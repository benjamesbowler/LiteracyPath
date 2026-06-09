import { useState, useEffect } from "react";
import logomarkUrl from "../assets/logo.svg";
import { APP_VIEWS } from "../appState/appViews.js";

const STORAGE_KEY = "lg_sidebar_collapsed";

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h6v7h-7v-5.5Z" />
      <path d="M13.5 4h3A1.5 1.5 0 0 1 18 5.5V18h-4.5V4Z" />
      <path d="M4 13.5h7V18H5.5A1.5 1.5 0 0 1 4 16.5v-3Z" />
    </svg>
  ),
  assessment: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4h8l1 2h2v16H5V6h2l1-2Zm1.2 2-.4.8h6.4l-.4-.8H9.2Z" />
      <path d="m9 13 2 2 4-5 1.6 1.2-5.5 6.8-3.7-3.7L9 13Z" />
    </svg>
  ),
  el: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19 9 5h2l5 14h-2.4l-1-3H7.4l-1 3H4Zm4.1-5h3.8L10 8.4 8.1 14Z" />
      <path d="M16 8h2v3h3v2h-3v3h-2v-3h-3v-2h3V8Z" />
    </svg>
  ),
  reading: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11c1 0 1.8.3 2.5 1A3.6 3.6 0 0 1 16 4h2.5c.8 0 1.5.7 1.5 1.5v14c0 .4-.3.7-.7.7H16c-1 0-1.9.3-2.6.8-.2.2-.6.2-.8 0-.7-.5-1.6-.8-2.6-.8H4.7c-.4 0-.7-.3-.7-.7v-14Zm2 1.5v11.2h4c.8 0 1.5.1 2.1.4V7c-.4-.6-1.1-1-2.1-1H6Zm8.9 0v11.6c.6-.3 1.3-.4 2.1-.4h2V6h-2c-1 0-1.7.4-2.1 1Z" />
    </svg>
  ),
  learn: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 2.5 8 12 13l9.5-5L12 3Zm-6 9.2v4.2c0 1.7 3 3.1 6 3.1s6-1.4 6-3.1v-4.2l-6 3.1-6-3.1Z" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 20V5h2v15H5Zm4 0v-8h2v8H9Zm4 0V8h2v12h-2Zm4 0v-5h2v5h-2Z" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 20 6v6c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Zm-1 12.2 5-5-1.4-1.4L11 12.4 9.4 10.8 8 12.2l3 3Z" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h9v2H6v12h7v2H4V4Zm11.6 4.4L20.2 13l-4.6 4.6-1.4-1.4 2.2-2.2H10v-2h6.4l-2.2-2.2 1.4-1.4Z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10.8 3h2.4l.5 2.4c.5.2 1 .4 1.4.6l2.1-1.3 1.7 1.7-1.3 2.1c.3.5.5.9.6 1.4l2.4.5v2.4l-2.4.5c-.2.5-.4 1-.6 1.4l1.3 2.1-1.7 1.7-2.1-1.3c-.5.3-.9.5-1.4.6l-.5 2.4h-2.4l-.5-2.4c-.5-.2-1-.4-1.4-.6l-2.1 1.3-1.7-1.7 1.3-2.1c-.3-.5-.5-.9-.6-1.4l-2.4-.5v-2.4l2.4-.5c.2-.5.4-1 .6-1.4L5.1 6.4l1.7-1.7L8.9 6c.5-.3.9-.5 1.4-.6L10.8 3Zm1.2 7.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.7 6.3 9 12l5.7 5.7-1.4 1.4L6.9 12l6.4-7.1 1.4 1.4Z" />
    </svg>
  )
};

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "dashboard",
    views: [APP_VIEWS.SELECT, APP_VIEWS.TEACHER_DASHBOARD],
  },
  {
    id: "assessment",
    label: "Assessment",
    icon: "assessment",
    views: [APP_VIEWS.OVERVIEW, APP_VIEWS.SKILLS, APP_VIEWS.ASSESSMENT,
            APP_VIEWS.CHECKPOINT, APP_VIEWS.FINISHED, APP_VIEWS.LETTERS,
            APP_VIEWS.ADVANCED_PHONICS],
    requiresStudent: true,
  },
  {
    id: "el",
    label: "EL Assessments",
    icon: "el",
    views: [APP_VIEWS.EL_ASSESSMENTS],
    requiresStudent: true,
  },
  {
    id: "reading",
    label: "Guided reading",
    icon: "reading",
    views: [APP_VIEWS.GUIDED_READING],
    requiresStudent: true,
  },
  {
    id: "learn",
    label: "Story Quests",
    icon: "learn",
    views: [APP_VIEWS.LEARN],
    requiresStudent: true,
  },
  {
    id: "reports",
    label: "Reports",
    icon: "reports",
    views: [APP_VIEWS.REPORTS],
    requiresStudent: true,
  },
];

export function Sidebar({
  appView,
  nameSaved = true,
  studentName,
  className,
  teacherEmail,
  goToOverview,
  goToElAssessments,
  goToGuidedReading,
  goToLearn,
  goToReports,
  goToTeacherDashboard,
  goToTools,
  logOutTeacher,
  isAdmin,
  openAdminDashboard,
}) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      /* storage unavailable */
    }
  }, [collapsed]);

  function handleNavClick(item) {
    if (item.requiresStudent && !nameSaved) return null;
    switch (item.id) {
      case "dashboard":   return goToTeacherDashboard?.();
      case "assessment":  return goToOverview?.();
      case "el":          return goToElAssessments?.();
      case "reading":     return goToGuidedReading?.();
      case "learn":       return goToLearn?.();
      case "reports":     return goToReports?.();
      default:            return null;
    }
  }

  function isActive(item) {
    return item.views.includes(appView);
  }

  return (
    <aside
      className={`lg-sidebar${collapsed ? " collapsed" : ""}`}
      aria-label="Main navigation"
    >
      {/* ── Logo + toggle ── */}
      <div className="lg-sb-top">
        <div className="lg-sb-logo-mark">
          <div className="lg-sb-icon" aria-hidden="true">
            <img src={logomarkUrl} alt="" width="16" height="16" />
          </div>
          <span className="lg-sb-name" aria-hidden={collapsed}>
            Literacy Guide
          </span>
        </div>
        <button
          className="lg-sb-toggle"
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          <span className="lg-sb-toggle-icon">{ICONS.chevron}</span>
        </button>
      </div>

      {/* ── Class / context label ── */}
      <div className="lg-sb-class" aria-hidden={collapsed}>
        {className || (studentName ? `Student: ${studentName}` : "No class selected")}
      </div>

      {/* ── Nav items ── */}
      <nav className="lg-sb-nav" aria-label="App sections">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`lg-sb-item${isActive(item) ? " active" : ""}`}
            disabled={item.requiresStudent && !nameSaved}
            onClick={() => handleNavClick(item)}
            aria-current={isActive(item) ? "page" : undefined}
            title={collapsed ? item.label : item.requiresStudent && !nameSaved ? "Select a student first" : undefined}
          >
            <span className="lg-sb-item-icon">{ICONS[item.icon]}</span>
            <span className="lg-sb-item-label">{item.label}</span>
            {/* Tooltip shown only when collapsed via CSS */}
            <span className="lg-sb-tooltip" aria-hidden="true">
              {item.label}
            </span>
          </button>
        ))}

        {isAdmin && (
          <button
            className={`lg-sb-item${appView === APP_VIEWS.ADMIN_DASHBOARD ? " active" : ""}`}
            onClick={openAdminDashboard}
            aria-current={appView === APP_VIEWS.ADMIN_DASHBOARD ? "page" : undefined}
            title={collapsed ? "Admin" : undefined}
          >
            <span className="lg-sb-item-icon">{ICONS.admin}</span>
            <span className="lg-sb-item-label">Admin</span>
            <span className="lg-sb-tooltip" aria-hidden="true">Admin</span>
          </button>
        )}
      </nav>

      {/* ── Footer: teacher info + settings ── */}
      <div className="lg-sb-footer">
        {teacherEmail && (
          <button
            className="lg-sb-item"
            onClick={logOutTeacher}
            title={collapsed ? `Sign out (${teacherEmail})` : undefined}
          >
            <span className="lg-sb-item-icon">{ICONS.logout}</span>
            <span className="lg-sb-item-label lg-sb-email">
              {teacherEmail}
            </span>
            <span className="lg-sb-tooltip" aria-hidden="true">
              Sign out
            </span>
          </button>
        )}
        <button
          className="lg-sb-item"
          onClick={goToTools}
          title={collapsed ? "Settings" : undefined}
        >
          <span className="lg-sb-item-icon">{ICONS.settings}</span>
          <span className="lg-sb-item-label">Settings</span>
          <span className="lg-sb-tooltip" aria-hidden="true">Settings</span>
        </button>
      </div>
    </aside>
  );
}
