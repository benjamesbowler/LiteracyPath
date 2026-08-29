import { localStudentPreferenceStorageKey } from "./progressKeys.js";

export const STUDENT_WELCOME_GUIDE_AUTO_VISITS = 3;

export function studentWelcomeGuideStorageKey(scopeKey) {
  return localStudentPreferenceStorageKey("welcome_guide", scopeKey);
}

function safeRecord(storage, scopeKey) {
  if (!storage) return {};
  try {
    const parsed = JSON.parse(storage.getItem(studentWelcomeGuideStorageKey(scopeKey)) || "null");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveRecord(storage, scopeKey, record) {
  if (!storage) return false;
  try {
    storage.setItem(studentWelcomeGuideStorageKey(scopeKey), JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

function boundedVisitCount(value) {
  return Math.max(0, Math.min(
    STUDENT_WELCOME_GUIDE_AUTO_VISITS + 1,
    Math.floor(Number(value) || 0)
  ));
}

function promptForVisit(visitCount) {
  if (visitCount === 1) return "tour";
  if (visitCount <= STUDENT_WELCOME_GUIDE_AUTO_VISITS) return "reminder";
  return "none";
}

/**
 * Registers one real student sign-in and returns the help prompt to show.
 *
 * The caller provides a non-secret login key (the session expiry timestamp).
 * Reusing that key is idempotent, so route remounts and React StrictMode do not
 * turn one sign-in into several. A dismissed prompt stays dismissed for the
 * rest of that login.
 */
export function beginStudentWelcomeVisit({
  enabled = true,
  loginKey,
  scopeKey,
  storage = globalThis.localStorage
} = {}) {
  const normalizedLoginKey = String(loginKey || "").trim();
  const normalizedScope = String(scopeKey || "").trim();
  if (!enabled || !normalizedLoginKey || !normalizedScope) {
    return { kind: "none", visitCount: 0 };
  }

  const current = safeRecord(storage, normalizedScope);
  if (current.lastLoginKey === normalizedLoginKey) {
    const visitCount = boundedVisitCount(current.visitCount);
    const kind = current.dismissedLoginKey === normalizedLoginKey
      ? "none"
      : ["tour", "reminder", "none"].includes(current.lastPromptKind)
        ? current.lastPromptKind
        : promptForVisit(visitCount);
    return { kind, visitCount };
  }

  const visitCount = Math.min(
    STUDENT_WELCOME_GUIDE_AUTO_VISITS + 1,
    boundedVisitCount(current.visitCount) + 1
  );
  const kind = promptForVisit(visitCount);
  saveRecord(storage, normalizedScope, {
    version: 1,
    visitCount,
    lastLoginKey: normalizedLoginKey,
    lastPromptKind: kind,
    dismissedLoginKey: ""
  });
  return { kind, visitCount };
}

export function dismissStudentWelcomePrompt({
  loginKey,
  scopeKey,
  storage = globalThis.localStorage
} = {}) {
  const normalizedLoginKey = String(loginKey || "").trim();
  const normalizedScope = String(scopeKey || "").trim();
  if (!normalizedLoginKey || !normalizedScope) return false;
  const current = safeRecord(storage, normalizedScope);
  if (current.lastLoginKey !== normalizedLoginKey) return false;
  return saveRecord(storage, normalizedScope, {
    ...current,
    dismissedLoginKey: normalizedLoginKey
  });
}
