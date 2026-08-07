function errorText(error) {
  return `${error?.code || ""} ${error?.status || ""} ${error?.message || ""}`.toLowerCase();
}

function isNetworkFailure(error) {
  return error instanceof TypeError
    || /failed to fetch|networkerror|network error|load failed|fetch failed|timed? out|offline/.test(
      errorText(error)
    );
}

function isRateLimited(error) {
  return Number(error?.status) === 429
    || /rate.?limit|too many requests|over_email_send_rate_limit|429/.test(errorText(error));
}

/**
 * An unconfirmed address is an unfinished sign-up, not a failed sign-in. The
 * caller uses this to offer a resend rather than leaving the person to guess
 * that the email they never received is the problem.
 */
export function isUnconfirmedEmailError(error) {
  return /email not confirmed|email_not_confirmed/.test(errorText(error));
}

function sharedFailureMessage(error) {
  if (isNetworkFailure(error)) {
    return "We couldn't reach the server. Check your internet and try again.";
  }
  if (isRateLimited(error)) {
    return "There have been too many attempts. Wait a few minutes, then try again.";
  }
  return "";
}

export function teacherAuthErrorMessage(error, action) {
  const shared = sharedFailureMessage(error);
  if (shared) return shared;
  const text = errorText(error);

  if (action === "login" || action === "demo_login") {
    if (/invalid login credentials|invalid credentials|wrong password|email.*password/.test(text)) {
      return "That email or password was not recognised. Check both and try again.";
    }
    if (isUnconfirmedEmailError(error)) {
      return "This account still needs its email address confirmed. Check your inbox for the link, or send it again below.";
    }
    return "We couldn't sign you in. Nothing changed. Check your details and try again.";
  }

  if (action === "signup") {
    if (/weak password|password.*(short|characters|strength)/.test(text)) {
      return "Choose a stronger password and try again.";
    }
    return "We couldn't submit the account request. Nothing changed. Try again.";
  }

  if (action === "password_reset_email") {
    return "We couldn't send the password reset email. Nothing changed. Try again.";
  }

  if (action === "password_update") {
    if (/same password|different password|weak password|password.*(short|characters|strength)/.test(text)) {
      return "Choose a different password with at least 6 characters, then try again.";
    }
    return "We couldn't update the password. Nothing changed. Try again.";
  }

  return "We couldn't complete that sign-in action. Nothing changed. Try again.";
}

export function teacherMutationErrorMessage(error, action, subject = "") {
  const shared = sharedFailureMessage(error);
  if (shared) return shared;
  const text = errorText(error);

  if (action === "save_school") {
    if (error?.code === "PGRST202" || /teacher_set_school|schema cache|function.*not found/.test(text)) {
      return "We couldn't save the school because this site needs an update. Nothing changed. Ask whoever manages the site to check it, then try again.";
    }
    return "We couldn't save the school. Nothing changed. Try again.";
  }

  if (action === "create_student") {
    if (/duplicate|unique/.test(text)) {
      return `A student named "${subject}" already exists in this class.`;
    }
    return "We couldn't add the student. Nothing changed. Try again.";
  }

  return "We couldn't save that change. Nothing changed. Try again.";
}
