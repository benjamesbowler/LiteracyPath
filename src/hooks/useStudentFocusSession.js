import { useCallback, useEffect, useReducer, useRef } from "react";

import {
  getStudentFocusSession,
  STUDENT_FOCUS_CONTENT_VERSION
} from "../data/studentFocusSessionCore.js";
import { LITERACY_DOMAINS, LITERACY_PRACTICE_VERSION } from "../policy/literacyPracticePolicy.js";
import { LITERACY_MOCK_SUPPORTED_VERSIONS } from "../data/literacyMockSessionCore.js";

// Frozen independent-check content remains resumable after the practice
// upgrade. Keep its bank lazy-loaded by the check page, not by every app boot.
const LEGACY_PROGRESS_BANK_VERSION = "progress-2026-10-02.1-1edfb1409c13";
const LEGACY_PROGRESS_TRACKS = ["hear_sounds", "printed_words", "common_words", "word_meaning", "listening_stories", "reading_stories"];

function progressAssignmentContentOk(session) {
  const config = session.resolved_config;
  if (!config || typeof config !== "object" || Array.isArray(config)
    || Object.keys(config).some(key => !["plan_kind", "track_id", "bank_version"].includes(key))
    || config.bank_version !== session.content_version) return false;
  if (config.plan_kind === "practice") {
    return config.bank_version === LITERACY_PRACTICE_VERSION
      && ["all", ...LITERACY_DOMAINS.map(domain => domain.id)].includes(config.track_id);
  }
  if (config.plan_kind === "mock") return LITERACY_MOCK_SUPPORTED_VERSIONS.includes(config.bank_version) && config.track_id === "all";
  return config.bank_version === LEGACY_PROGRESS_BANK_VERSION
    && ((config.plan_kind === "broad_profile" && !config.track_id)
      || (config.plan_kind === "focused" && LEGACY_PROGRESS_TRACKS.includes(config.track_id)));
}

export const INITIAL_STUDENT_FOCUS_STATE = Object.freeze({
  connection: "idle",
  session: null,
  endAction: "",
  endedSessionId: "",
  failureCount: 0,
  lastContactAt: ""
});

export const STUDENT_FOCUS_POLL_TIMEOUT_MS = 10_000;

export function pollStudentFocusSession(options, {
  controller = new AbortController(),
  timeoutMs = STUDENT_FOCUS_POLL_TIMEOUT_MS
} = {}) {
  return new Promise((resolve, reject) => {
    let timeout;
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      controller.signal.removeEventListener("abort", cancel);
      callback(value);
    };
    const cancel = () => finish(reject, new Error("student_focus_poll_cancelled"));
    controller.signal.addEventListener("abort", cancel, { once: true });
    if (controller.signal.aborted) { cancel(); return; }
    timeout = setTimeout(() => {
      finish(reject, new Error("student_focus_poll_timeout"));
      controller.abort();
    }, timeoutMs);
    getStudentFocusSession({ ...options, signal: controller.signal }).then(
      data => finish(resolve, data),
      error => finish(reject, error)
    );
  });
}

export function focusSessionRetryDelay(failureCount) {
  return Math.min(8000, Math.max(1000, 1000 * (2 ** Math.max(0, failureCount - 1))));
}

export function focusSessionContentOkForPoll(
  session,
  contentReport,
  contentVersion = STUDENT_FOCUS_CONTENT_VERSION
) {
  if (!session?.id) return true;
  if (session.target === "progress_check" && session.content_version !== contentVersion) {
    if (!progressAssignmentContentOk(session)) return false;
  } else if (session.content_version !== contentVersion) return false;
  if (contentReport?.sessionId !== session.id) return true;
  return contentReport.contentOk !== false;
}

export function reduceStudentFocusState(state, action) {
  switch (action.type) {
    case "session":
      return {
        connection: action.session
          ? "connected"
          : state.session || action.endAction
            ? "ended"
            : "idle",
        session: action.session,
        endAction: action.endAction || "",
        endedSessionId: action.endedSessionId || "",
        failureCount: 0,
        lastContactAt: action.at
      };
    case "failure":
      return {
        ...state,
        connection: state.session ? "reconnecting" : "connecting",
        failureCount: state.failureCount + 1
      };
    case "reset":
      return INITIAL_STUDENT_FOCUS_STATE;
    default:
      return state;
  }
}

function reduceOwnedStudentFocusState(previous, action) {
  return {
    token: action.token ?? previous.token,
    state: reduceStudentFocusState(previous.state, action)
  };
}

export function useStudentFocusSession({
  client,
  token = "",
  currentView = "",
  enabled = true,
  contentVersion = STUDENT_FOCUS_CONTENT_VERSION,
  contentReport = null
}) {
  const [ownedState, dispatch] = useReducer(reduceOwnedStudentFocusState, {
    token, state: INITIAL_STUDENT_FOCUS_STATE
  });
  const state = ownedState.state;
  const stateRef = useRef(state);
  const tokenRef = useRef(token);
  const timerRef = useRef(null);
  const requestRef = useRef(null);
  const stoppedRef = useRef(false);
  const pollRef = useRef(null);
  const wakeLockRef = useRef(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const cancelPoll = useCallback(() => {
    const request = requestRef.current;
    requestRef.current = null;
    request?.controller.abort();
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!stateRef.current.session || document.hidden || !navigator.wakeLock?.request) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch {
      wakeLockRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    if (stoppedRef.current || requestRef.current || document.hidden || !enabled || !token) return;
    const request = { controller: new AbortController() };
    requestRef.current = request;
    window.clearTimeout(timerRef.current);
    try {
      const data = await pollStudentFocusSession({
        client,
        token,
        currentView,
        contentOk: focusSessionContentOkForPoll(
          stateRef.current.session,
          contentReport,
          contentVersion
        )
      }, request);
      if (stoppedRef.current || requestRef.current !== request) return;
      if (data?.ok === false) throw new Error(data.error || "student_focus_poll_failed");
      const session = data?.session
        ? {
            ...data.session,
            // The RPC reports the boolean sent with this poll. Re-evaluate it
            // against the returned session id so a stale result from a session
            // that was just replaced cannot poison the new activity.
            content_ok: focusSessionContentOkForPoll(
              data.session,
              contentReport,
              contentVersion
            )
          }
        : null;
      dispatch({
        type: "session",
        token,
        session,
        endAction: data?.end_action || "",
        endedSessionId: data?.ended_session_id || "",
        at: new Date().toISOString()
      });
      if (session) void requestWakeLock();
      timerRef.current = window.setTimeout(() => void pollRef.current?.(), 1000);
    } catch {
      if (stoppedRef.current || requestRef.current !== request) return;
      const failureCount = stateRef.current.failureCount + 1;
      dispatch({ type: "failure", token });
      timerRef.current = window.setTimeout(
        () => void pollRef.current?.(),
        focusSessionRetryDelay(failureCount)
      );
    } finally {
      if (requestRef.current === request) requestRef.current = null;
    }
  }, [client, contentReport, contentVersion, currentView, enabled, requestWakeLock, token]);

  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  useEffect(() => {
    stoppedRef.current = false;
    if (tokenRef.current !== token || !enabled || !token) {
      tokenRef.current = token;
      stateRef.current = INITIAL_STUDENT_FOCUS_STATE;
      dispatch({ type: "reset", token });
    }
    if (enabled && token && !document.hidden) void poll();
    const wake = () => {
      window.clearTimeout(timerRef.current);
      cancelPoll();
      if (!document.hidden) {
        void requestWakeLock();
        void poll();
      }
    };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("online", wake);
    return () => {
      stoppedRef.current = true;
      window.clearTimeout(timerRef.current);
      cancelPoll();
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
      void wakeLockRef.current?.release?.().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [cancelPoll, enabled, poll, requestWakeLock, token]);

  useEffect(() => {
    if (state.session) return undefined;
    void wakeLockRef.current?.release?.().catch(() => {});
    wakeLockRef.current = null;
    return undefined;
  }, [state.session]);

  useEffect(() => {
    if (state.connection !== "ended") return undefined;
    const timer = window.setTimeout(() => dispatch({ type: "reset" }), 1800);
    return () => window.clearTimeout(timer);
  }, [state.connection]);

  return enabled && token && ownedState.token === token ? state : INITIAL_STUDENT_FOCUS_STATE;
}
