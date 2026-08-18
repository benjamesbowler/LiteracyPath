import { useState } from "react";
import { SchoolNameInput } from "./SchoolNameInput.jsx";
import { PRODUCT_NAME } from "../data/teacherBrand.js";

export function AuthPage({
  authMode = "login",
  setAuthMode,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
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
  logInDemoTeacher,
  // The address a signup or sign-in is waiting on. Empty most of the time; when
  // set, it is the only thing standing between this person and an account, so
  // the way out gets its own button rather than a line of advice.
  awaitingEmailConfirmation = "",
  resendEmailConfirmation
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isForgotPassword = authMode === "forgotPassword";
  const isResetPassword = authMode === "resetPassword";
  const isSignup = authMode === "signup";
  const submitCurrentMode = event => {
    event.preventDefault();
    if (authLoading) return;
    if (isForgotPassword) requestPasswordReset();
    else if (isResetPassword) completePasswordReset();
    else if (isSignup) signUpTeacher();
    else logInTeacher();
  };

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
                : "Open your classes, assessments, reports and reading records."}
        </p>
      </div>

      <form className="auth-form" onSubmit={submitCurrentMode}>
        {!isResetPassword && (
          <label className="auth-field">
            <strong>Email address</strong>
            <input
              autoComplete="email"
              inputMode="email"
              value={authEmail}
              placeholder="teacher@example.com"
              onChange={event => setAuthEmail(event.target.value)}
              required
              type="email"
            />
          </label>
        )}

        {isSignup && (
          <>
            <label className="auth-field">
              <strong>Name shown in {PRODUCT_NAME} <span className="muted-text">(optional)</span></strong>
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
              <span className="muted-text auth-field-hint">Choose an existing school from the list when you can.</span>
            </label>
          </>
        )}

        {!isForgotPassword && (
          <div className="auth-field">
            <label htmlFor="teacher-auth-password">
              <strong>{isResetPassword ? "New password" : "Password"}</strong>
            </label>
            <div className="auth-password-control">
              <input
                id="teacher-auth-password"
                autoComplete={isResetPassword || isSignup ? "new-password" : "current-password"}
                value={authPassword}
                placeholder={isResetPassword ? "New password" : "Password"}
                onChange={event => setAuthPassword(event.target.value)}
                required
                type={showPassword ? "text" : "password"}
              />
              <button
                aria-pressed={showPassword}
                className="auth-password-toggle"
                disabled={authLoading}
                onClick={() => setShowPassword(current => !current)}
                type="button"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        )}

        <div className="button-row auth-actions">
          <button className="main-button" disabled={authLoading} type="submit">
            {isForgotPassword
              ? "Send reset email"
              : isResetPassword
                ? "Update password"
                : isSignup
                  ? "Submit request"
                  : "Sign in"}
          </button>

          {(isForgotPassword || isResetPassword || isSignup) && (
            <button className="report-button" disabled={authLoading} onClick={() => setAuthMode("login")} type="button">
              {isResetPassword ? "Cancel" : "Back to sign-in"}
            </button>
          )}

          {!isForgotPassword && !isResetPassword && !isSignup && (
            <>
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
      </form>

      {!isForgotPassword && !isResetPassword && !isSignup && (
        <button className="auth-reset-link" disabled={authLoading} onClick={() => setAuthMode("forgotPassword")} type="button">
          Forgot password?
        </button>
      )}

      {authMessage && <p className="message auth-message" role="status" aria-live="polite">{authMessage}</p>}

      {awaitingEmailConfirmation && (
        <div className="auth-confirm-pending">
          <p>
            <strong>Confirm your email address to finish.</strong> We sent a link to{" "}
            {awaitingEmailConfirmation}. Your request only reaches an administrator once you
            have clicked it.
          </p>
          <p className="muted-text">
            Not arrived? Look in the spam folder first — then send it again.
          </p>
          <button
            className="report-button"
            disabled={authLoading || !resendEmailConfirmation}
            onClick={resendEmailConfirmation}
            type="button"
          >
            Send the link again
          </button>
        </div>
      )}

      {!isForgotPassword && !isResetPassword && !isSignup && (
        <p className="auth-footnote">Secure classroom access for teachers and reading specialists.</p>
      )}

      <p className="auth-privacy-note">
        <a href="/privacy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
      </p>
    </div>
  );
}
