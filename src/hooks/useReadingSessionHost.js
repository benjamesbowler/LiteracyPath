import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  endReadingSession,
  getReadingSessionPresence,
  saveReadingMarks,
  setReadingSessionPage,
  resumeReadingSession
} from "../data/readingSessionCore.js";

function operationDelay(attempt) {
  return Math.min(8000, 1000 * (2 ** Math.max(0, attempt - 1)));
}

export function createReadingSessionRetryQueue({
  send,
  onPendingChange = () => {},
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  now = Date.now,
  initialOperations = [],
  persist = () => {}
}) {
  const queue = initialOperations.map(operation => ({ ...operation, attempt: 0 }));
  let running = false;
  let retryTimer = null;
  let disposed = false;

  function publish() {
    persist(queue.map(({ payload, createdAt }) => ({ payload, createdAt })));
    const oldest = queue[0]?.createdAt || null;
    onPendingChange({
      count: queue.length,
      errorCode: queue.find(operation => operation.errorCode)?.errorCode || "",
      oldestAt: oldest,
      notSent: Boolean(oldest !== null && now() - oldest >= 4000)
    });
  }

  async function flush() {
    if (running || disposed || !queue.length) return;
    running = true;
    clearTimer(retryTimer);
    retryTimer = null;
    while (queue.length && !disposed) {
      const operation = queue[0];
      try {
        await send(operation.payload);
        queue.shift();
        publish();
      } catch (error) {
        operation.errorCode = error?.code || "";
        operation.attempt += 1;
        running = false;
        publish();
        retryTimer = setTimer(() => {
          running = false;
          void flush();
        }, operationDelay(operation.attempt));
        return;
      }
    }
    running = false;
  }

  publish();
  return {
    enqueue(payload) {
      queue.push({ payload, attempt: 0, createdAt: now() });
      publish();
      void flush();
    },
    flush,
    snapshot: () => queue.map(item => ({ ...item })),
    dispose() {
      disposed = true;
      clearTimer(retryTimer);
      // Unacknowledged operations remain in scoped recovery storage.
    }
  };
}

export function readingQueueRecovery({ session, kind, storage }) {
  const key = `lp:reading-pending:v1:${session.teacher_id}:${session.id}:${kind}`;
  let initialOperations = [];
  try {
    storage ??= globalThis.sessionStorage;
    const saved = JSON.parse(storage?.getItem(key) || "null");
    if (Array.isArray(saved)) initialOperations = saved.filter(operation => operation?.payload && Number.isFinite(operation.createdAt));
  } catch { /* Storage may be unavailable; the in-memory queue still retries. */ }
  return { initialOperations, persist: operations => {
    try { if (operations.length) storage?.setItem(key, JSON.stringify(operations)); else storage?.removeItem(key); }
    catch { /* Preserve in-memory operations if device storage is unavailable. */ }
  } };
}

export function pendingReadingChanges(session) {
  return ["pages", "marks"].reduce((count, kind) => count + readingQueueRecovery({ session, kind }).initialOperations.length, 0);
}

function eventId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `reading-mark-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useReadingSessionHost({ client, initialSession, students = [], onEnded = null }) {
  const [sessionState, setSessionState] = useState({ id: "", pageIndex: null, ended: false });
  const session = useMemo(() => initialSession?.id && sessionState.id === initialSession.id && sessionState.ended
    ? null
    : initialSession
      ? {
          ...initialSession,
          page_index: sessionState.id === initialSession.id && sessionState.pageIndex !== null
            ? sessionState.pageIndex
            : initialSession.page_index
        }
      : null, [initialSession, sessionState]);
  const [presence, setPresence] = useState([]);
  const [markTarget, setMarkTarget] = useState(null);
  const [marksByStudent, setMarksByStudent] = useState({});
  const marksRef = useRef(marksByStudent);
  const [undo, setUndo] = useState(null);
  const [pending, setPending] = useState({ count: 0, oldestAt: null, notSent: false });
  const [ending, setEnding] = useState(false);
  const endingRef = useRef(false);
  const [pendingMarks, setPendingMarks] = useState({ count: 0, oldestAt: null, notSent: false });
  const [endError, setEndError] = useState("");
  const [lastCompleted, setLastCompleted] = useState(null);
  const sessionRef = useRef(session);
  const turnQueueRef = useRef(null);
  const markQueueRef = useRef(null);

  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { marksRef.current = marksByStudent; }, [marksByStudent]);

  useEffect(() => {
    if (!client || !initialSession?.id) return undefined;
    turnQueueRef.current = createReadingSessionRetryQueue({
      ...readingQueueRecovery({ session: initialSession, kind: "pages" }),
      send: async ({ pageIndex }) => {
        const data = await setReadingSessionPage({
          client,
          sessionId: initialSession.id,
          pageIndex
        });
        if (data?.ok !== true) throw Object.assign(new Error(data?.error || "page_not_sent"), { code: data?.error });
      },
      onPendingChange: setPending
    });
    markQueueRef.current = createReadingSessionRetryQueue({
      ...readingQueueRecovery({ session: initialSession, kind: "marks" }),
      send: async payload => {
        const data = await saveReadingMarks({ client, sessionId: initialSession.id, ...payload });
        if (data?.ok !== true) throw Object.assign(new Error(data?.error || "marks_not_saved"), { code: data?.error });
      },
      onPendingChange: setPendingMarks
    });
    function handleOnline() {
      void turnQueueRef.current?.flush();
      void markQueueRef.current?.flush();
    }
    handleOnline();
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
      turnQueueRef.current?.dispose();
      markQueueRef.current?.dispose();
    };
  }, [client, initialSession]);

  useEffect(() => {
    if (!client || !session?.id) return undefined;
    let stopped = false;
    let timer;
    async function pollPresence() {
      window.clearTimeout(timer);
      if (document.hidden) return;
      try {
        const data = await getReadingSessionPresence({ client, sessionId: session.id });
        if (!stopped && data?.ok !== false) setPresence(data?.presence || []);
      } catch {
        // Presence is diagnostic only; a failed poll never interrupts teaching.
      }
      if (!stopped && !document.hidden) timer = window.setTimeout(pollPresence, 3000);
    }
    function handleVisibilityChange() {
      window.clearTimeout(timer);
      if (!document.hidden) void pollPresence();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    void pollPresence();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [client, session?.id]);

  useEffect(() => {
    if (!client || !session?.id || !session.student_ids?.length) return undefined;
    let active = true;
    client.table("student_progress")
      .select("student_id,payload")
      .in("student_id", session.student_ids)
      .eq("area", "guided_reading")
      .eq("key", session.book_id)
      .then(({ data, error }) => {
        if (!active || error) return;
        const hydrated = {};
        for (const row of data || []) {
          hydrated[row.student_id] = Object.fromEntries(
            Object.entries(row.payload?.pages || {}).map(([pageIndex, page]) => [
              pageIndex,
              page?.wordMarks || {}
            ])
          );
        }
        for (const { payload } of markQueueRef.current?.snapshot() || []) {
          hydrated[payload.studentId] = { ...hydrated[payload.studentId], [payload.pageIndex]: payload.marks };
        }
        marksRef.current = hydrated;
        setMarksByStudent(hydrated);
      });
    return () => { active = false; };
  }, [client, session?.book_id, session?.id, session?.student_ids]);

  useEffect(() => {
    if (!undo) return undefined;
    const delay = Math.max(0, undo.expiresAt - Date.now());
    const timer = window.setTimeout(() => setUndo(null), delay);
    return () => window.clearTimeout(timer);
  }, [undo]);

  useEffect(() => {
    if (!pending.oldestAt || pending.notSent) return undefined;
    const timer = window.setTimeout(() => {
      setPending(value => value.count ? { ...value, notSent: true } : value);
    }, Math.max(0, 4000 - (Date.now() - pending.oldestAt)));
    return () => window.clearTimeout(timer);
  }, [pending.notSent, pending.oldestAt]);

  const roster = useMemo(() => {
    const byId = new Map(students.map(student => [student.id, student]));
    return (session?.student_ids || []).map(id => byId.get(id) || { id, name: "Child" });
  }, [session?.student_ids, students]);

  const onTurn = useCallback(pageIndex => {
    if (endingRef.current) return false;
    if (sessionRef.current?.id) {
      setSessionState({ id: sessionRef.current.id, pageIndex, ended: false });
    }
    setMarkTarget(null);
    setUndo(null);
    turnQueueRef.current?.enqueue({ pageIndex });
  }, []);

  const writeMark = useCallback(({ studentId, pageIndex, wordIndex, mark, previousMark }) => {
    if (endingRef.current) return;
    const studentPages = marksRef.current[studentId] || {};
    const existingMarks = studentPages[pageIndex] || {};
    const nextMarks = { ...existingMarks };
    if (mark) nextMarks[wordIndex] = mark;
    else delete nextMarks[wordIndex];
    const nextState = {
      ...marksRef.current,
      [studentId]: { ...studentPages, [pageIndex]: nextMarks }
    };
    marksRef.current = nextState;
    setMarksByStudent(nextState);
    markQueueRef.current?.enqueue({
      studentId,
      pageIndex,
      marks: nextMarks,
      clientEventId: eventId()
    });
    setUndo({
      studentId,
      pageIndex,
      wordIndex,
      previousMark,
      mark,
      expiresAt: Date.now() + 10_000
    });
  }, []);

  const onMark = useCallback((studentId, pageIndex, wordIndex, nextMark) => {
    if (endingRef.current || !studentId || markTarget?.id !== studentId) return false;
    const previousMark = marksRef.current[studentId]?.[pageIndex]?.[wordIndex] || "";
    writeMark({ studentId, pageIndex, wordIndex, mark: nextMark, previousMark });
    return true;
  }, [markTarget?.id, writeMark]);

  const onUndo = useCallback(() => {
    if (!undo || undo.expiresAt < Date.now()) return false;
    const action = undo;
    setUndo(null);
    writeMark({
      studentId: action.studentId,
      pageIndex: action.pageIndex,
      wordIndex: action.wordIndex,
      mark: action.previousMark,
      previousMark: action.mark
    });
    setUndo(null);
    return true;
  }, [undo, writeMark]);

  const onEnd = useCallback(async () => {
    if (!sessionRef.current?.id || endingRef.current) return false;
    const endingSession = sessionRef.current;
    const turns = turnQueueRef.current, marks = markQueueRef.current;
    endingRef.current = true;
    setEnding(true);
    setEndError("");
    try {
      await Promise.all([turns?.flush(), marks?.flush()]);
      if (turns?.snapshot().length || marks?.snapshot().length) {
        setEndError("Some reading changes are still waiting to save. Keep this page open and retry when connected; the session is still active.");
        return false;
      }
      const data = await endReadingSession({ client, sessionId: endingSession.id });
      if (data?.ok !== true) throw new Error(data?.error || "session_not_ended");
      if (sessionRef.current?.id !== endingSession.id) return false;
      turns?.dispose();
      marks?.dispose();
      const completed = { session: endingSession, saved: true };
      setLastCompleted(completed);
      setSessionState({ id: endingSession.id, pageIndex: null, ended: true });
      onEnded?.(completed);
      return true;
    } catch {
      setEndError("The end of the reading session could not be confirmed. Your reading view is still here. Try again.");
      return false;
    } finally {
      endingRef.current = false;
      setEnding(false);
    }
  }, [client, onEnded]);

  return {
    session,
    presence,
    roster,
    markTarget,
    setMarkTarget,
    marksByStudent,
    onTurn,
    onMark,
    undo,
    onUndo,
    onEnd,
    ending,
    endError,
    lastCompleted,
    dismissCompleted: () => setLastCompleted(null),
    pendingWrites: pending.count + pendingMarks.count,
    recoveryIssue: pendingMarks.errorCode || pending.errorCode || "",
    resumeSaving: async () => {
      const current = sessionRef.current;
      if (!current?.id) return false;
      try {
        const result = await resumeReadingSession({ client, sessionId: current.id });
        if (result?.ok !== true || result.session?.id !== current.id || result.session?.teacher_id !== current.teacher_id) throw new Error("resume_unconfirmed");
        await Promise.all([turnQueueRef.current?.flush(), markQueueRef.current?.flush()]);
        return true;
      } catch {
        setEndError("This session could not be resumed. Keep or download the unsaved changes for review; they have not been marked as received.");
        return false;
      }
    },
    exportPending: () => {
      const current = sessionRef.current || {};
      const payload = { format: "reading-pending-v1", session: { id: current.id, teacher_id: current.teacher_id, class_id: current.class_id, book_id: current.book_id, student_ids: current.student_ids, page_index: current.page_index }, pages: turnQueueRef.current?.snapshot() || [], marks: markQueueRef.current?.snapshot() || [], savedToServer: false };
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "unsaved-reading-changes.json"; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    },
    retrySaving: () => { void turnQueueRef.current?.flush(); void markQueueRef.current?.flush(); },
    notSent: pending.notSent || pendingMarks.notSent || pendingMarks.count > 0
  };
}
