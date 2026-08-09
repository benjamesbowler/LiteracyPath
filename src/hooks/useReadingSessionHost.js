import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  endReadingSession,
  getReadingSessionPresence,
  saveReadingMarks,
  setReadingSessionPage
} from "../data/readingSessionCore.js";

function operationDelay(attempt) {
  return Math.min(8000, 1000 * (2 ** Math.max(0, attempt - 1)));
}

export function createReadingSessionRetryQueue({
  send,
  onPendingChange = () => {},
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  now = Date.now
}) {
  const queue = [];
  let running = false;
  let retryTimer = null;
  let disposed = false;

  function publish() {
    const oldest = queue[0]?.createdAt || null;
    onPendingChange({
      count: queue.length,
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
      } catch {
        operation.attempt += 1;
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
      queue.length = 0;
      publish();
    }
  };
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
  const sessionRef = useRef(session);
  const turnQueueRef = useRef(null);
  const markQueueRef = useRef(null);

  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { marksRef.current = marksByStudent; }, [marksByStudent]);

  useEffect(() => {
    if (!client || !initialSession?.id) return undefined;
    turnQueueRef.current = createReadingSessionRetryQueue({
      send: async ({ pageIndex }) => {
        const data = await setReadingSessionPage({
          client,
          sessionId: initialSession.id,
          pageIndex
        });
        if (data?.ok === false) throw new Error(data.error || "page_not_sent");
      },
      onPendingChange: setPending
    });
    markQueueRef.current = createReadingSessionRetryQueue({
      send: async payload => {
        const data = await saveReadingMarks({ client, sessionId: initialSession.id, ...payload });
        if (data?.ok === false) throw new Error(data.error || "marks_not_saved");
      }
    });
    function handleOnline() {
      void turnQueueRef.current?.flush();
      void markQueueRef.current?.flush();
    }
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
    if (sessionRef.current?.id) {
      setSessionState({ id: sessionRef.current.id, pageIndex, ended: false });
    }
    setMarkTarget(null);
    setUndo(null);
    turnQueueRef.current?.enqueue({ pageIndex });
  }, []);

  const writeMark = useCallback(({ studentId, pageIndex, wordIndex, mark, previousMark }) => {
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
    if (!studentId || markTarget?.id !== studentId) return false;
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
    if (!sessionRef.current?.id || ending) return false;
    setEnding(true);
    try {
      const data = await endReadingSession({ client, sessionId: sessionRef.current.id });
      if (data?.ok === false) throw new Error(data.error || "session_not_ended");
      turnQueueRef.current?.dispose();
      markQueueRef.current?.dispose();
      setSessionState({ id: sessionRef.current.id, pageIndex: null, ended: true });
      onEnded?.();
      return true;
    } finally {
      setEnding(false);
    }
  }, [client, ending, onEnded]);

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
    notSent: pending.notSent
  };
}
