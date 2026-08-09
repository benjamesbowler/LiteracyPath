import { useCallback, useEffect, useRef, useState } from "react";
import {
  createLiveLessonEventId,
  getStudentLiveLesson,
  submitLiveLessonResponse
} from "../data/liveLessonCore.js";

const INITIAL = Object.freeze({
  session: null,
  connection: "idle",
  error: "",
  submittedPromptId: "",
  submitting: false
});

export function useLiveLessonFollower({ client, token = "", enabled = true }) {
  const [state, setState] = useState(INITIAL);
  const timerRef = useRef(null);
  const stoppedRef = useRef(false);
  const pollingRef = useRef(false);
  const pollRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => { sessionRef.current = state.session; }, [state.session]);

  const poll = useCallback(async () => {
    window.clearTimeout(timerRef.current);
    if (!enabled || !client || !token || stoppedRef.current || document.hidden || pollingRef.current) return;
    pollingRef.current = true;
    try {
      const current = sessionRef.current;
      const data = await getStudentLiveLesson({
        client,
        token,
        slideIndex: current?.current_slide_index ?? null,
        contentOk: true
      });
      if (data?.ok === false) throw new Error(data.error || "live_lesson_poll_failed");
      const next = data?.session || null;
      setState(previous => ({
        ...previous,
        session: next,
        connection: next ? "connected" : previous.session ? "ended" : "idle",
        error: "",
        submittedPromptId: previous.session?.id === next?.id
          ? previous.submittedPromptId
          : ""
      }));
      timerRef.current = window.setTimeout(() => void pollRef.current?.(), 1000);
    } catch {
      setState(previous => ({ ...previous, connection: "reconnecting", error: "Trying to reconnect…" }));
      timerRef.current = window.setTimeout(() => void pollRef.current?.(), 2500);
    } finally {
      pollingRef.current = false;
    }
  }, [client, enabled, token]);

  useEffect(() => { pollRef.current = poll; }, [poll]);

  useEffect(() => {
    stoppedRef.current = false;
    if (enabled && token && !document.hidden) void poll();
    function resume() {
      window.clearTimeout(timerRef.current);
      if (!document.hidden) void poll();
    }
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    return () => {
      stoppedRef.current = true;
      window.clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
    };
  }, [enabled, poll, token]);

  const submit = useCallback(async response => {
    const session = sessionRef.current;
    const prompt = session?.prompt;
    if (!session?.id || !prompt?.id || state.submitting || state.submittedPromptId === prompt.id) return false;
    setState(previous => ({ ...previous, submitting: true, error: "" }));
    try {
      const data = await submitLiveLessonResponse({
        client,
        token,
        sessionId: session.id,
        promptId: prompt.id,
        response,
        clientEventId: createLiveLessonEventId("response")
      });
      if (data?.ok === false) throw new Error(data.error || "response_not_saved");
      setState(previous => ({ ...previous, submitting: false, submittedPromptId: prompt.id }));
      return true;
    } catch {
      setState(previous => ({ ...previous, submitting: false, error: "Your answer did not send. Tap try again." }));
      return false;
    }
  }, [client, state.submittedPromptId, state.submitting, token]);

  return { ...state, submit, retry: poll };
}
