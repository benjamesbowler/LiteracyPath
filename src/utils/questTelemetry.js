const MAX_SESSION_HISTORY = 80;

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export function normalizeQuestTelemetry(raw = {}) {
  const sessions = Array.isArray(raw?.sessions)
    ? raw.sessions.filter(session => session?.id).slice(-MAX_SESSION_HISTORY).map(session => ({
      ...session,
      activeMs: safeNumber(session.activeMs),
      answers: safeNumber(session.answers),
      correct: safeNumber(session.correct),
      stopsCompleted: safeNumber(session.stopsCompleted)
    }))
    : [];
  const current = raw?.current?.id ? {
    ...raw.current,
    activeMs: safeNumber(raw.current.activeMs),
    answers: safeNumber(raw.current.answers),
    correct: safeNumber(raw.current.correct),
    stopsCompleted: safeNumber(raw.current.stopsCompleted)
  } : null;
  return { sessions, current };
}

export function beginQuestSession(state, {
  id = `quest-${Date.now()}`,
  at = new Date().toISOString(),
  mode = "journey",
  qualityTier = "auto",
  stopId = null
} = {}) {
  const telemetry = normalizeQuestTelemetry(state?.telemetry);
  if (telemetry.current?.id) return state;
  return {
    ...state,
    telemetry: {
      ...telemetry,
      current: {
        id,
        startedAt: at,
        lastActiveAt: at,
        mode,
        qualityTier,
        stopId,
        activeMs: 0,
        answers: 0,
        correct: 0,
        stopsCompleted: 0
      }
    }
  };
}

export function addQuestActiveTime(state, milliseconds, at = new Date().toISOString()) {
  const telemetry = normalizeQuestTelemetry(state?.telemetry);
  if (!telemetry.current) return state;
  const delta = Math.min(60000, safeNumber(milliseconds));
  return {
    ...state,
    telemetry: {
      ...telemetry,
      current: {
        ...telemetry.current,
        activeMs: telemetry.current.activeMs + delta,
        lastActiveAt: at
      }
    }
  };
}

export function recordQuestTelemetryAnswer(state, correct) {
  const telemetry = normalizeQuestTelemetry(state?.telemetry);
  if (!telemetry.current) return state;
  return {
    ...state,
    telemetry: {
      ...telemetry,
      current: {
        ...telemetry.current,
        answers: telemetry.current.answers + 1,
        correct: telemetry.current.correct + (correct ? 1 : 0)
      }
    }
  };
}

export function recordQuestTelemetryStop(state, stopId) {
  const telemetry = normalizeQuestTelemetry(state?.telemetry);
  if (!telemetry.current) return state;
  return {
    ...state,
    telemetry: {
      ...telemetry,
      current: {
        ...telemetry.current,
        stopId: stopId || telemetry.current.stopId,
        stopsCompleted: telemetry.current.stopsCompleted + 1
      }
    }
  };
}

export function endQuestSession(state, {
  at = new Date().toISOString(),
  reason = "exit"
} = {}) {
  const telemetry = normalizeQuestTelemetry(state?.telemetry);
  if (!telemetry.current) return state;
  const finished = { ...telemetry.current, endedAt: at, reason };
  return {
    ...state,
    telemetry: {
      current: null,
      sessions: [...telemetry.sessions.filter(session => session.id !== finished.id), finished].slice(-MAX_SESSION_HISTORY)
    }
  };
}

export function questTelemetryTotals(raw = {}) {
  const telemetry = normalizeQuestTelemetry(raw);
  const rows = [...telemetry.sessions, ...(telemetry.current ? [telemetry.current] : [])];
  return rows.reduce((totals, session) => ({
    activeMs: totals.activeMs + safeNumber(session.activeMs),
    answers: totals.answers + safeNumber(session.answers),
    correct: totals.correct + safeNumber(session.correct),
    stopsCompleted: totals.stopsCompleted + safeNumber(session.stopsCompleted),
    sessions: totals.sessions + 1,
    reviewSessions: totals.reviewSessions + (session.mode === "review" ? 1 : 0),
    lastActiveAt: [totals.lastActiveAt, session.lastActiveAt, session.endedAt].filter(Boolean).sort().at(-1) || ""
  }), {
    activeMs: 0,
    answers: 0,
    correct: 0,
    stopsCompleted: 0,
    sessions: 0,
    reviewSessions: 0,
    lastActiveAt: ""
  });
}
