import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";
import { computeHydratedValue } from "./utils/progressMerge.js";
import {
  enqueueProgressQueueEntry,
  mergeProgressQueueRecords,
  progressEntryIdentity,
  readProgressQueueRecords,
  removeProgressQueueRecords
} from "./utils/progressQueue.js";

const STUDENT_ID = "sync-chaos-student";
const AREA = "phonics_quest";
const KEY = "__all__";
const LOCAL_KEY = "lp-sync-chaos-local-v1";
const VERSION_KEY = "lp-sync-chaos-cloud-version-v1";
const TOKEN_KEY = "lp-sync-chaos-token-v1";
const METRICS_KEY = "lp-sync-chaos-metrics-v1";
const ENDPOINT = "/preview/progress-chaos-endpoint";
let revisionSequence = 0;

function readJson(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function basePayload(stopsDone = []) {
  return {
    resetEpoch: 0,
    resetAt: "",
    resetId: "legacy",
    resetHistory: [],
    resetPending: false,
    trail: {
      stopsDone: [...new Set(stopsDone)],
      routeCursor: [...new Set(stopsDone)].length + 1
    },
    mastery: {},
    stones: []
  };
}

function mergePayload(local, remote) {
  return computeHydratedValue(AREA, KEY, local || basePayload(), remote || basePayload());
}

function currentMetrics() {
  return readJson(METRICS_KEY, {
    attempts: 0,
    conflicts: 0,
    deferred: 0,
    recovered: 0,
    tokenExpiries: 0
  });
}

function updateMetrics(delta) {
  const current = currentMetrics();
  const next = Object.fromEntries(
    Object.keys(current).map(key => [key, Number(current[key] || 0) + Number(delta[key] || 0)])
  );
  writeJson(METRICS_KEY, next);
  return next;
}

function ownRecords() {
  return readProgressQueueRecords(window.localStorage)
    .filter(record => progressEntryIdentity(record.entry) === `${STUDENT_ID}:${AREA}:${KEY}`);
}

function currentSnapshot(status = "") {
  const payload = readJson(LOCAL_KEY, basePayload());
  return {
    status,
    pending: ownRecords().length,
    stopsDone: payload.trail?.stopsDone || [],
    version: Number(window.localStorage.getItem(VERSION_KEY) || 0),
    metrics: currentMetrics()
  };
}

function storeLocal(payload, version) {
  writeJson(LOCAL_KEY, payload);
  if (Number.isFinite(Number(version))) {
    window.localStorage.setItem(VERSION_KEY, String(Number(version)));
  }
}

function queuePayload(payload, baseVersion) {
  revisionSequence += 1;
  return enqueueProgressQueueEntry(window.localStorage, {
    mode: "student",
    token: window.sessionStorage.getItem(TOKEN_KEY) || "valid-token",
    studentId: STUDENT_ID,
    area: AREA,
    key: KEY,
    payload,
    baseVersion,
    queuedAt: new Date().toISOString()
  }, {
    deferred: navigator.onLine === false,
    revision: `chaos-${Date.now()}-${revisionSequence}`
  });
}

export function ProgressSyncChaosPreview() {
  const [snapshot, setSnapshot] = useState(() => currentSnapshot(
    ownRecords().length ? "Progress is waiting safely on this device." : "Progress is up to date."
  ));

  useEffect(() => {
    if (!window.sessionStorage.getItem(TOKEN_KEY)) {
      window.sessionStorage.setItem(TOKEN_KEY, "valid-token");
    }

    const publish = status => {
      const next = currentSnapshot(status);
      setSnapshot(next);
      window.dispatchEvent(new CustomEvent("lp-progress-sync-state", {
        detail: {
          status,
          studentId: STUDENT_ID,
          area: AREA,
          key: KEY,
          pending: next.pending,
          metrics: next.metrics
        }
      }));
      return next;
    };

    window.__progressSyncChaos = {
      snapshot: () => currentSnapshot(),
      setToken(token) {
        window.sessionStorage.setItem(TOKEN_KEY, String(token || ""));
        return publish("Sign-in credential changed for the recovery test.");
      },
      saveStops(stopsDone) {
        const current = readJson(LOCAL_KEY, basePayload());
        const payload = mergePayload(current, basePayload(stopsDone));
        storeLocal(payload, Number(window.localStorage.getItem(VERSION_KEY) || 0));
        const queued = queuePayload(
          payload,
          Number(window.localStorage.getItem(VERSION_KEY) || 0)
        );
        updateMetrics({ attempts: 1, deferred: navigator.onLine === false ? 1 : 0 });
        return publish(
          queued.stored
            ? "Progress is waiting safely on this device."
            : "This device could not safely store the progress update."
        );
      },
      async hydrate() {
        const response = await fetch(ENDPOINT, {
          headers: {
            authorization: `Bearer ${window.sessionStorage.getItem(TOKEN_KEY) || ""}`
          }
        });
        if (response.status === 401) {
          updateMetrics({ tokenExpiries: 1 });
          return publish("Sign-in expired. Progress is still safe on this device.");
        }
        const remote = await response.json();
        const local = readJson(LOCAL_KEY, basePayload());
        storeLocal(mergePayload(local, remote.payload), remote.version);
        return publish("Cloud progress was reconciled with this device.");
      },
      async flush() {
        if (navigator.onLine === false) {
          updateMetrics({ deferred: 1 });
          return publish("No connection. Progress is waiting safely on this device.");
        }

        let recovered = false;
        for (let attempt = 0; attempt < 4; attempt += 1) {
          const records = ownRecords();
          const entry = mergeProgressQueueRecords(records);
          if (!entry) {
            if (recovered) updateMetrics({ recovered: 1 });
            return publish(recovered
              ? "Connection restored. Saved progress was recovered."
              : "Progress is up to date.");
          }

          let response;
          try {
            response = await fetch(ENDPOINT, {
              method: "POST",
              headers: {
                authorization: `Bearer ${window.sessionStorage.getItem(TOKEN_KEY) || ""}`,
                "content-type": "application/json"
              },
              body: JSON.stringify({
                baseVersion: Number(entry.baseVersion || 0),
                payload: entry.payload
              })
            });
          } catch {
            updateMetrics({ deferred: 1 });
            return publish("Connection interrupted. Progress is waiting safely on this device.");
          }

          if (response.status === 401) {
            updateMetrics({ tokenExpiries: 1 });
            return publish("Sign-in expired. Progress is still safe on this device.");
          }
          if (response.status === 409) {
            const remote = await response.json();
            const reconciled = mergePayload(entry.payload, remote.payload);
            storeLocal(reconciled, remote.version);
            queuePayload(reconciled, remote.version);
            updateMetrics({ conflicts: 1 });
            recovered = true;
            continue;
          }
          if (!response.ok) {
            updateMetrics({ deferred: 1 });
            return publish("Cloud save failed. Progress is waiting safely on this device.");
          }

          const saved = await response.json();
          removeProgressQueueRecords(window.localStorage, records);
          storeLocal(mergePayload(entry.payload, saved.payload), saved.version);
          recovered = recovered || Boolean(entry.needsRecovery);
        }

        return publish("Progress could not be reconciled after four safe attempts.");
      }
    };

    return () => {
      delete window.__progressSyncChaos;
    };
  }, []);

  return (
    <main className="teacher-mode-app lp-skin-sage">
      <h1>Progress sync recovery</h1>
      <section aria-label="Progress sync status">
        <p role="status" aria-live="polite">{snapshot.status}</p>
        <dl>
          <div><dt>Waiting safely</dt><dd>{snapshot.pending}</dd></div>
          <div><dt>Recovered</dt><dd>{snapshot.metrics.recovered}</dd></div>
          <div><dt>Conflicts reconciled</dt><dd>{snapshot.metrics.conflicts}</dd></div>
          <div><dt>Sign-ins refreshed</dt><dd>{snapshot.metrics.tokenExpiries}</dd></div>
          <div><dt>Cloud version</dt><dd>{snapshot.version}</dd></div>
        </dl>
        <p data-testid="stops-done">{snapshot.stopsDone.join(", ") || "No completed stops"}</p>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<ProgressSyncChaosPreview />);
