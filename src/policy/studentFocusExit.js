export const STUDENT_FOCUS_END_ACTIONS = Object.freeze({
  RETURN_HOME: "return_home",
  STUDENT_PICKER: "student_picker"
});

export const STUDENT_FOCUS_EXIT_STORAGE_KEY = "lp-student-focus-exits-v1";

function handledSessionIds(storage) {
  try {
    const parsed = JSON.parse(storage?.getItem?.(STUDENT_FOCUS_EXIT_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return [];
  }
}

export function shouldHandleStudentFocusExit({ endAction, endedSessionId } = {}, storage) {
  if (
    endAction !== STUDENT_FOCUS_END_ACTIONS.STUDENT_PICKER
    || !String(endedSessionId || "").trim()
  ) {
    return false;
  }
  return !handledSessionIds(storage).includes(String(endedSessionId));
}

export function markStudentFocusExitHandled(endedSessionId, storage) {
  const sessionId = String(endedSessionId || "").trim();
  if (!sessionId || !storage?.setItem) return false;
  const next = [...new Set([...handledSessionIds(storage), sessionId])].slice(-20);
  try {
    storage.setItem(STUDENT_FOCUS_EXIT_STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}
