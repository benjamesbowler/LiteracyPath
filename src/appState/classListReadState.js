export const CLASS_LIST_READ_STATUS = Object.freeze({
  IDLE: "idle",
  LOADING: "loading",
  COMPLETE: "complete",
  ERROR: "error",
  TRUNCATED: "truncated"
});

export function createClassListReadState() {
  return {
    status: CLASS_LIST_READ_STATUS.IDLE,
    teacherId: "",
    lastCompleteTeacherId: "",
    completedAt: "",
    attempt: 0
  };
}

export function beginClassListRead(previous, teacherId) {
  const current = previous || createClassListReadState();
  return {
    ...current,
    status: CLASS_LIST_READ_STATUS.LOADING,
    teacherId: String(teacherId || ""),
    attempt: Number(current.attempt || 0) + 1
  };
}

export function completeClassListRead(
  previous,
  teacherId,
  completedAt = new Date().toISOString()
) {
  const current = previous || createClassListReadState();
  const ownerId = String(teacherId || "");
  return {
    ...current,
    status: CLASS_LIST_READ_STATUS.COMPLETE,
    teacherId: ownerId,
    lastCompleteTeacherId: ownerId,
    completedAt
  };
}

export function failClassListRead(previous, teacherId, reason = "error") {
  const current = previous || createClassListReadState();
  return {
    ...current,
    status: reason === "truncated"
      ? CLASS_LIST_READ_STATUS.TRUNCATED
      : CLASS_LIST_READ_STATUS.ERROR,
    teacherId: String(teacherId || "")
  };
}

export function resetClassListRead() {
  return createClassListReadState();
}

export function getClassListReadView({
  readState,
  teacherId,
  legacyLoading = false
} = {}) {
  // Story renders and older isolated component tests still pass the original
  // boolean. Runtime App always supplies the explicit state.
  if (!readState?.status) {
    const status = legacyLoading
      ? CLASS_LIST_READ_STATUS.LOADING
      : CLASS_LIST_READ_STATUS.COMPLETE;
    return {
      status,
      idle: false,
      loading: status === CLASS_LIST_READ_STATUS.LOADING,
      complete: status === CLASS_LIST_READ_STATUS.COMPLETE,
      error: false,
      truncated: false,
      failed: false,
      rowsVerified: status === CLASS_LIST_READ_STATUS.COMPLETE
    };
  }

  const recordedStatus = Object.values(CLASS_LIST_READ_STATUS).includes(readState.status)
    ? readState.status
    : CLASS_LIST_READ_STATUS.ERROR;
  const recordedTeacherId = String(readState.teacherId || "");
  const currentTeacherId = teacherId === undefined
    ? recordedTeacherId
    : String(teacherId || "");
  const stateOwnsTeacher = Boolean(
    currentTeacherId
    && recordedTeacherId === currentTeacherId
  );
  const status = stateOwnsTeacher
    ? recordedStatus
    : CLASS_LIST_READ_STATUS.LOADING;
  const rowsVerified = Boolean(
    stateOwnsTeacher
    && String(readState.lastCompleteTeacherId || "") === currentTeacherId
  );

  return {
    status,
    idle: status === CLASS_LIST_READ_STATUS.IDLE,
    loading: status === CLASS_LIST_READ_STATUS.LOADING
      || status === CLASS_LIST_READ_STATUS.IDLE,
    complete: status === CLASS_LIST_READ_STATUS.COMPLETE,
    error: status === CLASS_LIST_READ_STATUS.ERROR,
    truncated: status === CLASS_LIST_READ_STATUS.TRUNCATED,
    failed: status === CLASS_LIST_READ_STATUS.ERROR
      || status === CLASS_LIST_READ_STATUS.TRUNCATED,
    rowsVerified
  };
}
