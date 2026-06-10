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
  completePasswordReset
}) {
  const isForgotPassword = authMode === "forgotPassword";
  const isResetPassword = authMode === "resetPassword";
  const isSignup = authMode === "signup";

  return (
    <div className="card page-card page-stack auth-card">
      <div className="auth-heading">
        <h2>{isResetPassword ? "Set New Password" : isForgotPassword ? "Reset Password" : isSignup ? "Request Access" : "Teacher Login"}</h2>
        <p className="muted-text">
          {isResetPassword
            ? "Enter a new password for your account."
            : isForgotPassword
              ? "Enter your email and we will send a Supabase reset link."
              : isSignup
                ? "Create a teacher account request. An administrator must approve it before access opens."
                : "Sign in to view only your own classes and student data."}
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
              placeholder="teacher_name"
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
            <input
              autoComplete="organization"
              value={authSchoolName}
              placeholder="School name"
              onChange={event => setAuthSchoolName(event.target.value)}
              type="text"
            />
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
              Send Reset Email
            </button>
            <button className="report-button" disabled={authLoading} onClick={() => setAuthMode("login")} type="button">
              Back to Login
            </button>
          </>
        ) : isResetPassword ? (
          <>
            <button className="main-button" disabled={authLoading} onClick={completePasswordReset} type="button">
              Update Password
            </button>
            <button className="report-button" disabled={authLoading} onClick={() => setAuthMode("login")} type="button">
              Cancel
            </button>
          </>
        ) : isSignup ? (
          <>
            <button className="main-button" disabled={authLoading} onClick={signUpTeacher} type="button">
              Submit Request
            </button>
            <button className="report-button" disabled={authLoading} onClick={() => setAuthMode("login")} type="button">
              Back to Login
            </button>
          </>
        ) : (
          <>
            <button className="main-button" disabled={authLoading} onClick={logInTeacher} type="button">
              Log In
            </button>

            <button className="report-button" disabled={authLoading} onClick={() => setAuthMode("signup")} type="button">
              Sign Up
            </button>
          </>
        )}
      </div>

      {!isForgotPassword && !isResetPassword && !isSignup && (
        <button className="auth-reset-link" disabled={authLoading} onClick={() => setAuthMode("forgotPassword")} type="button">
          Forgot password?
        </button>
      )}

      {authMessage && <p className="message auth-message">{authMessage}</p>}

      {!isForgotPassword && !isResetPassword && !isSignup && (
        <p className="auth-footnote">Secure classroom access for teachers and reading specialists.</p>
      )}
    </div>
  );
}
