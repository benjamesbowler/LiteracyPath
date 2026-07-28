export const STUDENT_ROSTER_READ_STATUS = Object.freeze({
  IDLE: "idle",
  LOADING: "loading",
  COMPLETE: "complete",
  ERROR: "error",
  TRUNCATED: "truncated"
});

export function createStudentRosterReadState() {
  return {
    status: STUDENT_ROSTER_READ_STATUS.IDLE,
    classId: "",
    lastCompleteClassId: "",
    completedAt: "",
    reason: "",
    attempt: 0
  };
}

export function beginStudentRosterRead(previous, classId) {
  const current = previous || createStudentRosterReadState();
  return {
    ...current,
    status: STUDENT_ROSTER_READ_STATUS.LOADING,
    classId: String(classId || ""),
    reason: "",
    attempt: Number(current.attempt || 0) + 1
  };
}

export function completeStudentRosterRead(previous, classId, completedAt = new Date().toISOString()) {
  const current = previous || createStudentRosterReadState();
  return {
    ...current,
    status: STUDENT_ROSTER_READ_STATUS.COMPLETE,
    classId: String(classId || ""),
    lastCompleteClassId: String(classId || ""),
    completedAt,
    reason: ""
  };
}

export function failStudentRosterRead(previous, classId, reason = "unavailable") {
  const current = previous || createStudentRosterReadState();
  return {
    ...current,
    status: reason === "truncated"
      ? STUDENT_ROSTER_READ_STATUS.TRUNCATED
      : STUDENT_ROSTER_READ_STATUS.ERROR,
    classId: String(classId || ""),
    reason: reason === "truncated" ? "truncated" : "unavailable"
  };
}

export function resetStudentRosterRead() {
  return createStudentRosterReadState();
}

export function getStudentRosterReadView({
  readState,
  classId,
  legacyLoading = false
} = {}) {
  const selectedClassId = String(classId || "");
  if (!selectedClassId) {
    return {
      status: STUDENT_ROSTER_READ_STATUS.IDLE,
      complete: false,
      incomplete: false,
      error: false,
      truncated: false,
      loading: false,
      rowsBelongToClass: false,
      reason: ""
    };
  }

  // Component-level and story renders written before the explicit read-state
  // contract still pass the old boolean. Runtime App always supplies readState.
  if (!readState?.status) {
    const status = legacyLoading
      ? STUDENT_ROSTER_READ_STATUS.LOADING
      : STUDENT_ROSTER_READ_STATUS.COMPLETE;
    return {
      status,
      complete: status === STUDENT_ROSTER_READ_STATUS.COMPLETE,
      incomplete: false,
      error: false,
      truncated: false,
      loading: status === STUDENT_ROSTER_READ_STATUS.LOADING,
      rowsBelongToClass: status === STUDENT_ROSTER_READ_STATUS.COMPLETE,
      reason: ""
    };
  }

  const stateOwnsSelection = String(readState.classId || "") === selectedClassId;
  const recordedStatus = readState.status === "incomplete"
    ? readState.reason === "truncated"
      ? STUDENT_ROSTER_READ_STATUS.TRUNCATED
      : STUDENT_ROSTER_READ_STATUS.ERROR
    : readState.status;
  const status = stateOwnsSelection
    ? recordedStatus
    : STUDENT_ROSTER_READ_STATUS.LOADING;
  return {
    status,
    complete: status === STUDENT_ROSTER_READ_STATUS.COMPLETE,
    incomplete: status === STUDENT_ROSTER_READ_STATUS.ERROR
      || status === STUDENT_ROSTER_READ_STATUS.TRUNCATED,
    error: status === STUDENT_ROSTER_READ_STATUS.ERROR,
    truncated: status === STUDENT_ROSTER_READ_STATUS.TRUNCATED,
    loading: status === STUDENT_ROSTER_READ_STATUS.LOADING
      || status === STUDENT_ROSTER_READ_STATUS.IDLE,
    rowsBelongToClass: String(readState.lastCompleteClassId || "") === selectedClassId,
    reason: stateOwnsSelection ? String(readState.reason || "") : ""
  };
}
