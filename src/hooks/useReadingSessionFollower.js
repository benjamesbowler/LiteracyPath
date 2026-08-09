import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  getStudentReadingSession,
  READING_SESSION_CONTENT_VERSION
} from "../data/readingSessionCore.js";
import { warmQuestOfflineAssets } from "../utils/offlineShell.js";
import {
  followerRetryDelay,
  INITIAL_READING_FOLLOWER_STATE,
  reduceReadingFollowerState,
  resolveFollowerPage
} from "./readingSessionFollowerState.js";

export function useReadingSessionFollower({
  client,
  token = "",
  books = [],
  enabled = true,
  contentVersion = READING_SESSION_CONTENT_VERSION
}) {
  const [state, dispatch] = useReducer(
    reduceReadingFollowerState,
    INITIAL_READING_FOLLOWER_STATE
  );
  const stateRef = useRef(state);
  const timerRef = useRef(null);
  const stoppedRef = useRef(false);
  const pollingRef = useRef(false);
  const pollRef = useRef(null);
  const warmedSessionRef = useRef("");
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
      const current = stateRef.current;
      const data = await getStudentReadingSession({
        client,
        token,
        pageIndex: current.session?.page_index ?? null,
        contentOk: current.contentOk
      });
      if (data?.ok === false) throw new Error(data.error || "reading_session_poll_failed");
      const session = data?.session || null;
      const resolved = resolveFollowerPage({ books, session, contentVersion });
      dispatch({ type: "session", session, ...resolved });
      if (session && warmedSessionRef.current !== session.id) {
        warmedSessionRef.current = session.id;
        const { readingSessionMediaUrls } = await import("../data/readingSession.js");
        void warmQuestOfflineAssets(
          readingSessionMediaUrls(resolved.book, session.page_numbers),
          { chapterId: `reading-${session.id}` }
        );
        void requestWakeLock();
      }
      timerRef.current = window.setTimeout(() => void pollRef.current?.(), 1000);
    } catch {
      const failureCount = stateRef.current.failureCount + 1;
      dispatch({ type: "failure" });
      timerRef.current = window.setTimeout(
        () => void pollRef.current?.(),
        followerRetryDelay(failureCount)
      );
    } finally {
      pollingRef.current = false;
    }
  }, [books, client, contentVersion, enabled, requestWakeLock, token]);

  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  useEffect(() => {
    stoppedRef.current = false;
    if (enabled && token && !document.hidden) void poll();
    function handleVisibilityChange() {
      window.clearTimeout(timerRef.current);
      if (!document.hidden) {
        void requestWakeLock();
        void poll();
      }
    }
    function handleOnline() {
      if (!document.hidden) void poll();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    return () => {
      stoppedRef.current = true;
      window.clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      void wakeLockRef.current?.release?.().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [enabled, poll, requestWakeLock, token]);

  useEffect(() => {
    if (state.connection !== "ended") return undefined;
    const timer = window.setTimeout(() => dispatch({ type: "reset" }), 1800);
    return () => window.clearTimeout(timer);
  }, [state.connection]);

  useEffect(() => {
    if (state.session) return undefined;
    void wakeLockRef.current?.release?.().catch(() => {});
    wakeLockRef.current = null;
    return undefined;
  }, [state.session]);

  return state;
}
