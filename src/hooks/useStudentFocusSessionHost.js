import { useCallback, useEffect, useRef, useState } from "react";

import {
  endStudentFocusSession,
  getTeacherStudentFocusSession
} from "../data/studentFocusSessionCore.js";

export async function readTeacherFocusWithTimeout(options, timeoutMs = 10000) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      getTeacherStudentFocusSession({ ...options, signal: controller.signal }),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error("teacher_focus_timeout")); }, timeoutMs); })
    ]);
  } finally { clearTimeout(timer); }
}

export function teacherFocusSnapshot(data, teacherId) {
  const owned = data?.session?.teacher_id === teacherId ? data.session : null;
  const members = Array.isArray(data?.members) ? data.members : [];
  return {
    active: owned?.status === 'active' ? owned : null,
    completed: owned && ['ended', 'expired'].includes(owned.status) ? { session: owned, members } : null,
    members,
  };
}

export function useStudentFocusSessionHost({ client, teacherId = "", enabled = true }) {
  const [session, setSession] = useState(null);
  const [members, setMembers] = useState([]);
  const [lastCompleted, setLastCompleted] = useState(null);
  const generationRef = useRef(0);
  const [connection, setConnection] = useState("idle");
  const timerRef = useRef(null);
  const pollingRef = useRef(false);
  const sessionRef = useRef(session);
  const pollRef = useRef(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const poll = useCallback(async () => {
    if (!enabled || !client || !teacherId || pollingRef.current || document.hidden) return;
    const generation = generationRef.current;
    pollingRef.current = true;
    window.clearTimeout(timerRef.current);
    try {
      const data = await readTeacherFocusWithTimeout({
        client,
        sessionId: sessionRef.current?.teacher_id === teacherId ? sessionRef.current.id : null
      });
      if (generation !== generationRef.current) return;
      if (data?.ok !== true && data?.error !== "session_not_found") {
        throw new Error(data.error || "teacher_focus_poll_failed");
      }
      // Explicit session lookup also serves ended-session evidence exports.
      // The live control bar must only adopt an active session.
      const snapshot = teacherFocusSnapshot(data, teacherId);
      const activeSession = snapshot.active;
      if (snapshot.completed) setLastCompleted(snapshot.completed);
      else if (data?.session?.teacher_id === teacherId) setLastCompleted(null);
      sessionRef.current = activeSession;
      setSession(activeSession);
      setMembers(activeSession ? snapshot.members : []);
      setConnection(activeSession ? "connected" : "idle");
    } catch {
      if (generation !== generationRef.current) return;
      setConnection(sessionRef.current ? "reconnecting" : "unavailable");
    } finally {
      if (generation === generationRef.current) {
        pollingRef.current = false;
        timerRef.current = window.setTimeout(
          () => void pollRef.current?.(),
          sessionRef.current ? 2000 : 5000
        );
      }
    }
  }, [client, enabled, teacherId]);

  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  useEffect(() => {
    generationRef.current += 1;
    pollingRef.current = false;
    if (!enabled || !client || !teacherId) return undefined;
    void poll();
    const wake = () => {
      window.clearTimeout(timerRef.current);
      if (!document.hidden) void poll();
    };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("online", wake);
    return () => {
      generationRef.current += 1;
      window.clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
    };
  }, [client, enabled, poll, teacherId]);

  const adoptSession = useCallback(nextSession => {
    generationRef.current += 1;
    pollingRef.current = false;
    sessionRef.current = nextSession || null;
    setLastCompleted(null);
    setSession(nextSession || null);
    setMembers(Array.isArray(nextSession?.members) ? nextSession.members : []);
    setConnection(nextSession ? "connected" : "idle");
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => void pollRef.current?.(), 0);
  }, []);

  const end = useCallback(async endAction => {
    if (!sessionRef.current?.id) return false;
    const endingSession = sessionRef.current;
    const generation = generationRef.current;
    const data = await endStudentFocusSession({
      client,
      sessionId: sessionRef.current.id,
      endAction
    });
    if (data?.ok !== true || generation !== generationRef.current || sessionRef.current?.id !== endingSession.id) return false;
    generationRef.current += 1;
    pollingRef.current = false;
    sessionRef.current = null;
    setSession(null);
    setMembers([]);
    setConnection("idle");
    const endedGeneration = generationRef.current;
    setLastCompleted({ session: { ...endingSession, status: "ended" }, members: [], awaitingResults: true });
    try {
      const result = await readTeacherFocusWithTimeout({ client, sessionId: endingSession.id });
      if (endedGeneration === generationRef.current && result?.ok === true && result.session?.id === endingSession.id && result.session.teacher_id === teacherId) setLastCompleted({ session: result.session, members: result.members || [], awaitingResults: false });
    } catch { /* End was acknowledged; results can be recovered separately. */ }
    timerRef.current = window.setTimeout(() => void pollRef.current?.(), 0);
    return true;
  }, [client, teacherId]);

  const sessionBelongsToTeacher = session?.teacher_id === teacherId;

  return enabled
    ? {
        session: sessionBelongsToTeacher ? session : null,
        members: sessionBelongsToTeacher ? members : [],
        connection: sessionBelongsToTeacher ? connection : "idle",
        lastCompleted: lastCompleted?.session?.teacher_id === teacherId ? lastCompleted : null,
        dismissCompleted: () => setLastCompleted(null),
        adoptSession,
        end,
        refresh: poll
      }
    : { session: null, members: [], lastCompleted: null, dismissCompleted: () => setLastCompleted(null), connection: "idle", adoptSession, end, refresh: poll };
}
