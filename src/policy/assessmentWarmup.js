/** A teacher-started mock owns the slow link; independent checks load on demand. */
export function assessmentBankWarmupAllowed({sessionMode,focusSession,lastContactAt}={}) {
  return sessionMode !== 'student' || Boolean(lastContactAt) && focusSession?.resolved_config?.plan_kind !== 'mock';
}
