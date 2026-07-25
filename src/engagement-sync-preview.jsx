import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";
import { TeacherActivitySyncHealth } from "./components/teacher/TeacherActivitySyncHealth.jsx";
import {
  buildEngagementHealthSnapshot,
  enqueueEngagementEvent,
  flushEngagementQueue,
  updateEngagementHealth
} from "./utils/engagementQueue.js";
import {
  clearProgressSyncSession,
  configureProgressSync,
  flushQueuedEngagementEvents,
  logStudentActivity
} from "./utils/progressSync.js";
import { supabase } from "./supabaseClient.js";

const STUDENT_ID = "engagement-chaos-student";
const NOW = new Date("2026-07-24T12:00:00.000Z");
const teacherRows = [{
  attempted: 100,
  delivered: 97,
  recovered: 9,
  storage_failures: 1,
  pending: 0,
  lost: 3,
  observed_at: "2026-07-24T11:59:00.000Z"
}];

async function sendEvent(entry) {
  const response = await fetch("/preview/engagement-event-endpoint", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(entry)
  });
  if (!response.ok) throw new Error(`delivery ${response.status}`);
}

function currentHealth() {
  return buildEngagementHealthSnapshot(window.localStorage, STUDENT_ID);
}

export function EngagementSyncPreview() {
  const [health, setHealth] = useState(() => currentHealth());

  useEffect(() => {
    window.__engagementChaos = {
      health: currentHealth,
      async concurrentClientFlush() {
        const studentId = "engagement-client-student";
        Object.keys(window.localStorage)
          .filter(key => key.startsWith("lp-engagement-"))
          .forEach(key => window.localStorage.removeItem(key));
        const originalRpc = supabase.rpc;
        let eventRpcCalls = 0;
        supabase.rpc = async name => {
          if (name === "student_log_activity_v2") {
            eventRpcCalls += 1;
            await new Promise(resolve => window.setTimeout(resolve, 50));
          }
          return { data: { ok: true }, error: null };
        };
        configureProgressSync({
          mode: "student",
          studentId,
          token: "preview-student-token"
        });
        logStudentActivity("mission", "parallel-1", "task_done");
        try {
          await Promise.all([
            flushQueuedEngagementEvents(undefined, { force: true }),
            flushQueuedEngagementEvents(undefined, { force: true })
          ]);
          return {
            eventRpcCalls,
            health: buildEngagementHealthSnapshot(window.localStorage, studentId)
          };
        } finally {
          clearProgressSyncSession();
          supabase.rpc = originalRpc;
        }
      },
      async enqueueAndFlush() {
        const queued = enqueueEngagementEvent(window.localStorage, {
          id: "chaos-event-1",
          studentId: STUDENT_ID,
          area: "phonics_quest",
          itemId: "s1",
          event: "answer",
          payload: { correct: true }
        }, { now: () => NOW });
        updateEngagementHealth(
          window.localStorage,
          STUDENT_ID,
          { attempted: 1, storageFailures: queued.stored ? 0 : 1 },
          { now: () => NOW }
        );
        const result = await flushEngagementQueue({
          storage: window.localStorage,
          studentId: STUDENT_ID,
          force: true,
          now: () => NOW,
          send: sendEvent
        });
        updateEngagementHealth(window.localStorage, STUDENT_ID, {
          delivered: result.delivered,
          recovered: result.recovered,
          storageFailures: result.storageFailures
        }, { now: () => NOW });
        const next = currentHealth();
        setHealth(next);
        return { result, health: next };
      },
      async flush() {
        const result = await flushEngagementQueue({
          storage: window.localStorage,
          studentId: STUDENT_ID,
          force: true,
          now: () => new Date("2026-07-24T12:00:03.000Z"),
          send: sendEvent
        });
        updateEngagementHealth(window.localStorage, STUDENT_ID, {
          delivered: result.delivered,
          recovered: result.recovered,
          storageFailures: result.storageFailures
        }, { now: () => NOW });
        const next = currentHealth();
        setHealth(next);
        return { result, health: next };
      }
    };
    return () => {
      delete window.__engagementChaos;
    };
  }, []);

  return (
    <main className="teacher-mode-app lp-skin-sage engagement-sync-preview">
      <h1>Engagement sync recovery preview</h1>
      <section aria-label="Child event delivery state" data-child-sync-state="">
        <h2>Child event delivery</h2>
        <dl>
          <div><dt>Attempted</dt><dd>{health.attempted}</dd></div>
          <div><dt>Delivered</dt><dd>{health.delivered}</dd></div>
          <div><dt>Waiting</dt><dd>{health.pending}</dd></div>
          <div><dt>Recovered</dt><dd>{health.recovered}</dd></div>
          <div><dt>Potentially lost</dt><dd>{health.lost}</dd></div>
        </dl>
      </section>
      <TeacherActivitySyncHealth
        classId="audit-class"
        className="Audit Class A"
        seedRows={teacherRows}
        now={NOW}
      />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<EngagementSyncPreview />);
