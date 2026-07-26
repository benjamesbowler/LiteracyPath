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
  student: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm-7 16c.6-4 3.3-6 7-6s6.4 2 7 6H5Z" />
    </svg>
  ),
  phonics: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19 9 5h2l5 14h-2.4l-1-3H7.4l-1 3H4Zm4.1-5h3.8L10 8.4 8.1 14Z" />
      <path d="M15.5 5h2v14h-2V5Zm3.5 0h1.8L18.4 12l2.7 7h-2l-2.4-6.7L19 5Z" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 20V5h2v15H5Zm4 0v-8h2v8H9Zm4 0V8h2v12h-2Zm4 0v-5h2v5h-2Z" />
    </svg>
  ),
  worksheets: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 2h8l4 4v16H6V2Zm7 1.5V7h3.5L13 3.5ZM8 11h8v1.6H8V11Zm0 3.4h8V16H8v-1.6Zm0 3.4h5.5v1.6H8v-1.6Z" />
    </svg>
  ),
  present: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 4h18v2H3V4Zm1 3h16v9H13v2l3 2v1H8v-1l3-2v-2H4V7Z" />
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
  chevron: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.7 6.3 9 12l5.7 5.7-1.4 1.4L6.9 12l6.4-7.1 1.4 1.4Z" />
    </svg>
  )
};

const TEACHER_INTENT_NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "dashboard",
    views: [APP_VIEWS.SELECT, APP_VIEWS.TEACHER_DASHBOARD],
    modules: []
  },
  {
    id: "children",
    label: "Children",
    icon: "student",
    views: [APP_VIEWS.TEACHER_CLASSES, APP_VIEWS.STUDENT_HOME],
    modules: []
  },
  {
    id: "checks",
    label: "Checks",
    icon: "assessment",
    views: [
      APP_VIEWS.TEACHER_ASSESS,
      APP_VIEWS.OVERVIEW,
      APP_VIEWS.SKILLS,
      APP_VIEWS.ASSESSMENT,
      APP_VIEWS.CHECKPOINT,
      APP_VIEWS.LETTERS,
      APP_VIEWS.ADVANCED_PHONICS,
      APP_VIEWS.EL_ASSESSMENTS,
      APP_VIEWS.EL_BENCHMARK
    ],
    modules: []
  },
  {
    id: "reports",
    label: "Reports",
    icon: "reports",
    views: [APP_VIEWS.TEACHER_PROGRESS, APP_VIEWS.REPORTS, APP_VIEWS.FINISHED],
    modules: []
  },
  {
    id: "resources",
    label: "Resources",
    icon: "worksheets",
    views: [
      APP_VIEWS.TEACHER_RESOURCES,
      APP_VIEWS.GUIDED_READING,
      APP_VIEWS.LEARN,
      APP_VIEWS.PRESENT,
      APP_VIEWS.WORKSHEETS
    ],
    modules: []
  },
  {
    id: "settings",
    label: "Settings",
    icon: "admin",
    views: [APP_VIEWS.TEACHER_SETTINGS],
    modules: []
  },
];

export function Sidebar({
  appView,
  nameSaved = true,
  studentName,
  className,
  teacherEmail,
  goToStudentHome,
  goToGuidedReading,
  goToLearn,
  goToWorksheets,
  goToPresent,
  goToTeacherDashboard,
  goToTeacherClasses,
  goToTeacherAssess,
  goToTeacherProgress,
  goToTeacherResources,
  goToTeacherSettings,
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
      case "children":    return goToTeacherClasses?.();
      case "checks":      return goToTeacherAssess?.();
      case "reports":     return goToTeacherProgress?.();
      case "resources":   return goToTeacherResources?.();
      case "settings":    return goToTeacherSettings?.();
      case "studentHome": return goToStudentHome?.();
      case "assessment-hub": return goToTeacherAssess?.();
      case "reading":     return goToGuidedReading?.();
      case "learn":       return goToLearn?.();
      case "worksheets":  return goToWorksheets?.();
      case "present":     return goToPresent?.();
      default:            return null;
    }
  }

  function isActive(item) {
    return item.views.includes(appView);
  }

  function getItemTitle(item) {
    if (item.requiresStudent && !nameSaved) return "Select a student first";
    if (collapsed) return item.description ? `${item.label} - ${item.description}` : item.label;
    return item.description || undefined;
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
        {className || (studentName ? `Child: ${studentName}` : "No class selected")}
      </div>

      {/* ── Nav items ── */}
      <nav className="lg-sb-nav" aria-label="App sections">
        <div data-testid="teacher-primary-nav" role="group" aria-label="Teacher primary">
          {TEACHER_INTENT_NAV_ITEMS.map(item => (
            <div key={item.id} className="lg-sb-intent">
              <button
                className={`lg-sb-item${isActive(item) ? " active" : ""}`}
                onClick={() => handleNavClick(item)}
                aria-current={isActive(item) ? "page" : undefined}
                aria-label={item.label}
                title={getItemTitle(item)}
              >
                <span className="lg-sb-item-icon">{ICONS[item.icon]}</span>
                <span className="lg-sb-item-label">{item.label}</span>
                <span className="lg-sb-tooltip" aria-hidden="true">
                  {item.label}
                </span>
              </button>
              {!collapsed && isActive(item) && item.modules.length > 0 && (
                <div
                  className="lg-sb-context-nav"
                  aria-label={`${item.label} tools`}
                  role="navigation"
                >
                  {item.modules.map(module => (
                    <button
                      key={module.id}
                      className={`lg-sb-context-item${isActive(module) ? " active" : ""}`}
                      disabled={module.requiresStudent && !nameSaved}
                      onClick={() => handleNavClick(module)}
                      aria-current={isActive(module) ? "page" : undefined}
                      title={getItemTitle(module)}
                      type="button"
                    >
                      {module.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

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

      {/* ── Footer: teacher info ── */}
      <div className="lg-sb-footer">
        {teacherEmail && (
          <button
            className="lg-sb-item"
            onClick={logOutTeacher}
            aria-label={`Sign out ${teacherEmail}`}
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
      </div>
    </aside>
  );
}
