import { SchoolNameInput } from "./SchoolNameInput.jsx";

export function AuthPage({
  authMode = "login",
  setAuthMode,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authUsername,
  setAuthUsername,
  authDisplayName,
  setAuthDisplayName,
  authSchoolName,
  setAuthSchoolName,
  authLoading,
  authMessage,
  signUpTeacher,
  logInTeacher,
  requestPasswordReset,
  completePasswordReset,
  demoTeacherEnabled = false,
  logInDemoTeacher
}) {
  const isForgotPassword = authMode === "forgotPassword";
  const isResetPassword = authMode === "resetPassword";
  const isSignup = authMode === "signup";

  return (
    <div className="card page-card page-stack auth-card" aria-busy={authLoading}>
      <div className="auth-heading">
        <h2>{isResetPassword ? "Set new password" : isForgotPassword ? "Reset password" : isSignup ? "Create teacher account" : "Teacher sign-in"}</h2>
        <p className="muted-text">
          {isResetPassword
            ? "Enter a new password for your account."
            : isForgotPassword
              ? "Enter your email and we will send a password reset link."
              : isSignup
                ? "Create an account request for your school. Approval is required before access opens."
                : "Open your classes, checks, reports and reading records."}
        </p>
      </div>

      {!isResetPassword && (
        <label className="auth-field">
          <strong>Email</strong>
          <input
            autoComplete="email"
            inputMode="email"
            value={authEmail}
            placeholder="teacher@example.com"
            onChange={event => setAuthEmail(event.target.value)}
            type="email"
          />
        </label>
      )}

      {isSignup && (
        <>
          <label className="auth-field">
            <strong>Username</strong>
            <input
              autoComplete="username"
              value={authUsername}
              placeholder="teacher name"
              onChange={event => setAuthUsername(event.target.value)}
              type="text"
            />
          </label>
          <label className="auth-field">
            <strong>Display name <span className="muted-text">(optional)</span></strong>
            <input
              autoComplete="name"
              value={authDisplayName}
              placeholder="Ms. Rivera"
              onChange={event => setAuthDisplayName(event.target.value)}
              type="text"
            />
          </label>
          <label className="auth-field">
            <strong>School</strong>
            <SchoolNameInput
              autoComplete="organization"
              value={authSchoolName}
              placeholder="Choose your school or type a new one"
              onChange={setAuthSchoolName}
            />
            <span className="muted-text auth-field-hint">If your school is already listed, pick it - don't retype it.</span>
          </label>
        </>
      )}

      {!isForgotPassword && (
        <label className="auth-field">
          <strong>{isResetPassword ? "New Password" : "Password"}</strong>
          <input
            autoComplete={isResetPassword || isSignup ? "new-password" : "current-password"}
            value={authPassword}
            placeholder={isResetPassword ? "New password" : "Password"}
            onChange={event => setAuthPassword(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter") {
                if (isResetPassword) completePasswordReset();
                else if (isSignup) signUpTeacher();
                else logInTeacher();
              }
            }}
            type="password"
          />
        </label>
      )}

      <div className="button-row auth-actions">
        {isForgotPassword ? (
          <>
            <button className="main-button" disabled={authLoading} onClick={requestPasswordReset} type="button">
              Send reset email
            </button>
            <button className="report-button" disabled={authLoading} onClick={() => setAuthMode("login")} type="button">
              Back to sign-in
            </button>
          </>
        ) : isResetPassword ? (
          <>
            <button className="main-button" disabled={authLoading} onClick={completePasswordReset} type="button">
              Update password
            </button>
            <button className="report-button" disabled={authLoading} onClick={() => setAuthMode("login")} type="button">
              Cancel
            </button>
          </>
        ) : isSignup ? (
          <>
            <button className="main-button" disabled={authLoading} onClick={signUpTeacher} type="button">
              Submit request
            </button>
            <button className="report-button" disabled={authLoading} onClick={() => setAuthMode("login")} type="button">
              Back to sign-in
            </button>
          </>
        ) : (
          <>
            <button className="main-button" disabled={authLoading} onClick={logInTeacher} type="button">
              Log in
            </button>

            <button className="report-button" disabled={authLoading} onClick={() => setAuthMode("signup")} type="button">
              Create account
            </button>

            {demoTeacherEnabled && (
              <button className="report-button" disabled={authLoading} onClick={logInDemoTeacher} type="button">
                Demo teacher (preview)
              </button>
            )}
          </>
        )}
      </div>

      {!isForgotPassword && !isResetPassword && !isSignup && (
        <button className="auth-reset-link" disabled={authLoading} onClick={() => setAuthMode("forgotPassword")} type="button">
          Forgot password?
        </button>
      )}

      {authMessage && <p className="message auth-message" role="status" aria-live="polite">{authMessage}</p>}

      {!isForgotPassword && !isResetPassword && !isSignup && (
        <p className="auth-footnote">Secure classroom access for teachers and reading specialists.</p>
      )}

      <p className="auth-privacy-note">
        <a href="/privacy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
      </p>
    </div>
  );
}
