import { useCallback, useEffect, useRef, useState } from "react";

import {
  endStudentFocusSession,
  getTeacherStudentFocusSession
} from "../data/studentFocusSessionCore.js";

export function useStudentFocusSessionHost({ client, teacherId = "", enabled = true }) {
  const [session, setSession] = useState(null);
  const [members, setMembers] = useState([]);
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
    pollingRef.current = true;
    window.clearTimeout(timerRef.current);
    try {
      const data = await getTeacherStudentFocusSession({
        client,
        sessionId: sessionRef.current?.id || null
      });
      if (data?.ok === false && data.error !== "session_not_found") {
        throw new Error(data.error || "teacher_focus_poll_failed");
      }
      // Explicit session lookup also serves ended-session evidence exports.
      // The live control bar must only adopt an active session.
      const activeSession = data?.session?.status === "active" ? data.session : null;
      setSession(activeSession);
      setMembers(activeSession && Array.isArray(data?.members) ? data.members : []);
      setConnection(activeSession ? "connected" : "idle");
    } catch {
      setConnection(sessionRef.current ? "reconnecting" : "unavailable");
    } finally {
      pollingRef.current = false;
      timerRef.current = window.setTimeout(
        () => void pollRef.current?.(),
        sessionRef.current ? 2000 : 5000
      );
    }
  }, [client, enabled, teacherId]);

  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  useEffect(() => {
    if (!enabled || !client || !teacherId) return undefined;
    void poll();
    const wake = () => {
      window.clearTimeout(timerRef.current);
      if (!document.hidden) void poll();
    };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("online", wake);
    return () => {
      window.clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
    };
  }, [client, enabled, poll, teacherId]);

  const adoptSession = useCallback(nextSession => {
    setSession(nextSession || null);
    setMembers(Array.isArray(nextSession?.members) ? nextSession.members : []);
    setConnection(nextSession ? "connected" : "idle");
  }, []);

  const end = useCallback(async endAction => {
    if (!sessionRef.current?.id) return false;
    const data = await endStudentFocusSession({
      client,
      sessionId: sessionRef.current.id,
      endAction
    });
    if (data?.ok === false) return false;
    setSession(null);
    setMembers([]);
    setConnection("idle");
    return true;
  }, [client]);

  const sessionBelongsToTeacher = session?.teacher_id === teacherId;

  return enabled
    ? {
        session: sessionBelongsToTeacher ? session : null,
        members: sessionBelongsToTeacher ? members : [],
        connection: sessionBelongsToTeacher ? connection : "idle",
        adoptSession,
        end,
        refresh: poll
      }
    : { session: null, members: [], connection: "idle", adoptSession, end, refresh: poll };
}
