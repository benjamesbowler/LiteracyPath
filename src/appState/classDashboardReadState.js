export const CLASS_DASHBOARD_READ_STATUS = Object.freeze({
  IDLE: "idle",
  LOADING: "loading",
  COMPLETE: "complete",
  ERROR: "error",
  TRUNCATED: "truncated"
});

export function createClassDashboardReadState() {
  return {
    status: CLASS_DASHBOARD_READ_STATUS.IDLE,
    classId: "",
    lastCompleteClassId: "",
    completedAt: "",
    reason: "",
    attempt: 0
  };
}

export function beginClassDashboardRead(previous, classId) {
  const current = previous || createClassDashboardReadState();
  return {
    ...current,
    status: CLASS_DASHBOARD_READ_STATUS.LOADING,
    classId: String(classId || ""),
    reason: "",
    attempt: Number(current.attempt || 0) + 1
  };
}

export function completeClassDashboardRead(
  previous,
  classId,
  completedAt = new Date().toISOString()
) {
  const current = previous || createClassDashboardReadState();
  const ownerId = String(classId || "");
  return {
    ...current,
    status: CLASS_DASHBOARD_READ_STATUS.COMPLETE,
    classId: ownerId,
    lastCompleteClassId: ownerId,
    completedAt,
    reason: ""
  };
}

export function failClassDashboardRead(previous, classId, reason = "error") {
  const current = previous || createClassDashboardReadState();
  return {
    ...current,
    status: reason === "truncated"
      ? CLASS_DASHBOARD_READ_STATUS.TRUNCATED
      : CLASS_DASHBOARD_READ_STATUS.ERROR,
    classId: String(classId || ""),
    reason: reason === "truncated" ? "truncated" : "unavailable"
  };
}

export function resetClassDashboardRead() {
  return createClassDashboardReadState();
}

export function getClassDashboardReadView({
  readState,
  classId,
  legacyLoading = false
} = {}) {
  const selectedClassId = String(classId || "");
  if (!selectedClassId) {
    return {
      status: CLASS_DASHBOARD_READ_STATUS.IDLE,
      complete: false,
      error: false,
      truncated: false,
      failed: false,
      loading: false,
      rowsBelongToClass: false,
      reason: ""
    };
  }

  if (!readState?.status) {
    const status = legacyLoading
      ? CLASS_DASHBOARD_READ_STATUS.LOADING
      : CLASS_DASHBOARD_READ_STATUS.COMPLETE;
    return {
      status,
      complete: status === CLASS_DASHBOARD_READ_STATUS.COMPLETE,
      error: false,
      truncated: false,
      failed: false,
      loading: status === CLASS_DASHBOARD_READ_STATUS.LOADING,
      rowsBelongToClass: status === CLASS_DASHBOARD_READ_STATUS.COMPLETE,
      reason: ""
    };
  }

  const stateOwnsSelection = String(readState.classId || "") === selectedClassId;
  const status = stateOwnsSelection
    ? readState.status
    : CLASS_DASHBOARD_READ_STATUS.LOADING;
  const error = status === CLASS_DASHBOARD_READ_STATUS.ERROR;
  const truncated = status === CLASS_DASHBOARD_READ_STATUS.TRUNCATED;
  return {
    status,
    complete: status === CLASS_DASHBOARD_READ_STATUS.COMPLETE,
    error,
    truncated,
    failed: error || truncated,
    loading: status === CLASS_DASHBOARD_READ_STATUS.LOADING
      || status === CLASS_DASHBOARD_READ_STATUS.IDLE,
    rowsBelongToClass: String(readState.lastCompleteClassId || "") === selectedClassId,
    reason: stateOwnsSelection ? String(readState.reason || "") : ""
  };
}
