import { useCallback, useEffect, useReducer, useRef } from "react";

import {
  getStudentFocusSession,
  STUDENT_FOCUS_CONTENT_VERSION
} from "../data/studentFocusSessionCore.js";

export const INITIAL_STUDENT_FOCUS_STATE = Object.freeze({
  connection: "idle",
  session: null,
  endAction: "",
  endedSessionId: "",
  failureCount: 0,
  lastContactAt: ""
});

export function focusSessionRetryDelay(failureCount) {
  return Math.min(8000, Math.max(1000, 1000 * (2 ** Math.max(0, failureCount - 1))));
}

export function focusSessionContentOkForPoll(
  session,
  contentReport,
  contentVersion = STUDENT_FOCUS_CONTENT_VERSION
) {
  if (!session?.id) return true;
  if (session.content_version !== contentVersion) return false;
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

export function useStudentFocusSession({
  client,
  token = "",
  currentView = "",
  enabled = true,
  contentVersion = STUDENT_FOCUS_CONTENT_VERSION,
  contentReport = null
}) {
  const [state, dispatch] = useReducer(reduceStudentFocusState, INITIAL_STUDENT_FOCUS_STATE);
  const stateRef = useRef(state);
  const timerRef = useRef(null);
  const pollingRef = useRef(false);
  const stoppedRef = useRef(false);
  const pollRef = useRef(null);
  const wakeLockRef = useRef(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const requestWakeLock = useCallback(async () => {
    if (!stateRef.current.session || document.hidden || !navigator.wakeLock?.request) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch {
      wakeLockRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    if (stoppedRef.current || pollingRef.current || document.hidden || !enabled || !token) return;
    pollingRef.current = true;
    window.clearTimeout(timerRef.current);
    try {
      const data = await getStudentFocusSession({
        client,
        token,
        currentView,
        contentOk: focusSessionContentOkForPoll(
          stateRef.current.session,
          contentReport,
          contentVersion
        )
      });
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
        session,
        endAction: data?.end_action || "",
        endedSessionId: data?.ended_session_id || "",
        at: new Date().toISOString()
      });
      if (session) void requestWakeLock();
      timerRef.current = window.setTimeout(() => void pollRef.current?.(), 1000);
    } catch {
      const failureCount = stateRef.current.failureCount + 1;
      dispatch({ type: "failure" });
      timerRef.current = window.setTimeout(
        () => void pollRef.current?.(),
        focusSessionRetryDelay(failureCount)
      );
    } finally {
      pollingRef.current = false;
    }
  }, [client, contentReport, contentVersion, currentView, enabled, requestWakeLock, token]);

  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  useEffect(() => {
    stoppedRef.current = false;
    if (enabled && token && !document.hidden) void poll();
    const wake = () => {
      window.clearTimeout(timerRef.current);
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
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
      void wakeLockRef.current?.release?.().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [enabled, poll, requestWakeLock, token]);

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

  return state;
}
