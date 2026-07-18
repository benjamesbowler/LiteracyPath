const MAX_SESSION_HISTORY = 80;
const MAX_RESPONSE_MS = 120000;
const SLOW_RESPONSE_MS = 8000;
const SLOW_SCENE_START_MS = 2500;

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function normalizeRuntime(raw = {}) {
  return {
    sampledFrames: safeNumber(raw.sampledFrames),
    frameMsTotal: safeNumber(raw.frameMsTotal),
    longFrames: safeNumber(raw.longFrames),
    qualityTransitions: safeNumber(raw.qualityTransitions),
    contextLosses: safeNumber(raw.contextLosses),
    sceneStarts: safeNumber(raw.sceneStarts),
    sceneLoadMsTotal: safeNumber(raw.sceneLoadMsTotal),
    slowSceneStarts: safeNumber(raw.slowSceneStarts),
    sceneAssetRequestsTotal: safeNumber(raw.sceneAssetRequestsTotal),
    sceneAssetBytesTotal: safeNumber(raw.sceneAssetBytesTotal),
    peakSceneAssetRequests: safeNumber(raw.peakSceneAssetRequests),
    peakSceneAssetBytes: safeNumber(raw.peakSceneAssetBytes),
    healthSamples: safeNumber(raw.healthSamples),
    peakDisplayObjects: safeNumber(raw.peakDisplayObjects),
    peakTweens: safeNumber(raw.peakTweens),
    peakTextures: safeNumber(raw.peakTextures),
    peakActiveChoices: safeNumber(raw.peakActiveChoices),
    networkInterruptions: safeNumber(raw.networkInterruptions),
    syncDeferrals: safeNumber(raw.syncDeferrals),
    syncRecoveries: safeNumber(raw.syncRecoveries),
    offlineShellReady: Boolean(raw.offlineShellReady),
    offlineColdStarts: safeNumber(raw.offlineColdStarts),
    offlineWarmups: safeNumber(raw.offlineWarmups),
    offlineWarmupFailures: safeNumber(raw.offlineWarmupFailures),
    offlineShellErrors: safeNumber(raw.offlineShellErrors),
    offlineUpdates: safeNumber(raw.offlineUpdates),
    offlineUpdatesApplied: safeNumber(raw.offlineUpdatesApplied),
    offlineActive: Boolean(raw.offlineActive),
    syncPending: Boolean(raw.syncPending),
    lastOfflineAt: raw.lastOfflineAt ? String(raw.lastOfflineAt) : null,
    lastOfflineWarmAt: raw.lastOfflineWarmAt ? String(raw.lastOfflineWarmAt) : null,
    lastOfflineUpdateAt: raw.lastOfflineUpdateAt ? String(raw.lastOfflineUpdateAt) : null,
    lastOfflineBuildId: raw.lastOfflineBuildId ? String(raw.lastOfflineBuildId) : null,
    lastOfflineShellEventId: raw.lastOfflineShellEventId ? String(raw.lastOfflineShellEventId) : null,
    offlineShellEventIds: Array.isArray(raw.offlineShellEventIds)
      ? raw.offlineShellEventIds.filter(Boolean).map(String).slice(-40)
      : [],
    lastSyncRecoveredAt: raw.lastSyncRecoveredAt ? String(raw.lastSyncRecoveredAt) : null,
    fallback2d: Boolean(raw.fallback2d),
    lastTier: raw.lastTier ? String(raw.lastTier) : null,
    lastEventAt: raw.lastEventAt ? String(raw.lastEventAt) : null
  };
}

function normalizeInteraction(raw = {}) {
  return {
    prompts: safeNumber(raw.prompts),
    responses: safeNumber(raw.responses),
    responseMsTotal: safeNumber(raw.responseMsTotal),
    slowResponses: safeNumber(raw.slowResponses),
    motorRetries: safeNumber(raw.motorRetries),
    correctionMisses: safeNumber(raw.correctionMisses),
    teachBacks: safeNumber(raw.teachBacks),
    drops: safeNumber(raw.drops),
    pacingAdaptations: safeNumber(raw.pacingAdaptations),
    deferredBeats: safeNumber(raw.deferredBeats),
    optionalRouteVisits: safeNumber(raw.optionalRouteVisits),
    optionalDiscoveries: safeNumber(raw.optionalDiscoveries),
    restoredFriendsMet: safeNumber(raw.restoredFriendsMet),
    accessibleTimingSupports: safeNumber(raw.accessibleTimingSupports)
  };
}

function normalizeSession(session) {
  return {
    ...session,
    activeMs: safeNumber(session.activeMs),
    answers: safeNumber(session.answers),
    correct: safeNumber(session.correct),
    stopsCompleted: safeNumber(session.stopsCompleted),
    runtime: normalizeRuntime(session.runtime),
    interaction: normalizeInteraction(session.interaction)
  };
}

export function normalizeQuestTelemetry(raw = {}) {
  const sessions = Array.isArray(raw?.sessions)
    ? raw.sessions.filter(session => session?.id).slice(-MAX_SESSION_HISTORY).map(normalizeSession)
    : [];
  const current = raw?.current?.id ? normalizeSession(raw.current) : null;
  return { sessions, current };
}

// A current session older than this is a ZOMBIE — a tab that closed without
// unmounting cleanly. Folding it away on the next begin keeps one crashed
// visit from swallowing every later session into a single multi-day record.
const STALE_SESSION_MS = 6 * 60 * 60 * 1000;

export function beginQuestSession(state, {
  id = `quest-${Date.now()}`,
  at = new Date().toISOString(),
  mode = "journey",
  qualityTier = "auto",
  stopId = null,
  source = null
} = {}) {
  let telemetry = normalizeQuestTelemetry(state?.telemetry);
  if (telemetry.current?.id) {
    const lastActive = Date.parse(telemetry.current.lastActiveAt || telemetry.current.startedAt || "");
    const staleMs = Date.parse(at) - (Number.isFinite(lastActive) ? lastActive : Date.parse(at));
    if (!(staleMs >= STALE_SESSION_MS)) return state;
    // Recover the zombie into history, then begin fresh below.
    const recovered = { ...telemetry.current, endedAt: telemetry.current.lastActiveAt || at, reason: "recovered" };
    telemetry = {
      current: null,
      sessions: [...telemetry.sessions.filter(session => session.id !== recovered.id), recovered].slice(-MAX_SESSION_HISTORY)
    };
  }
  return {
    ...state,
    telemetry: {
      ...telemetry,
      current: {
        id,
        startedAt: at,
        lastActiveAt: at,
        mode,
        source: source ? String(source) : null,
        qualityTier,
        stopId,
        activeMs: 0,
        answers: 0,
        correct: 0,
        stopsCompleted: 0,
        runtime: normalizeRuntime({ lastTier: qualityTier }),
        interaction: normalizeInteraction()
      }
    }
  };
}

export function recordQuestRuntimeEvent(state, event = {}) {
  const telemetry = normalizeQuestTelemetry(state?.telemetry);
  if (!telemetry.current || !event.type) return state;
  const runtime = normalizeRuntime(telemetry.current.runtime);
  const sampledFrames = safeNumber(event.sampledFrames);
  const frameMsTotal = safeNumber(event.frameMsTotal);
  const longFrames = safeNumber(event.longFrames);
  const qualityChange = event.type === "quality-change" ? 1 : 0;
  const contextLoss = event.type === "context-lost" ? 1 : 0;
  const sceneStart = event.type === "scene-ready" ? 1 : 0;
  const healthSample = event.type === "runtime-health" ? 1 : 0;
  const networkOffline = event.type === "network-offline" && !runtime.offlineActive ? 1 : 0;
  const networkOnline = event.type === "network-online";
  const syncDeferred = event.type === "sync-deferred" && !runtime.syncPending ? 1 : 0;
  const syncRecovered = event.type === "sync-recovered" && runtime.syncPending ? 1 : 0;
  const offlineShellEvent = event.type.startsWith("offline-");
  const duplicateOfflineShellEvent = offlineShellEvent
    && event.id
    && runtime.offlineShellEventIds.includes(String(event.id));
  const offlineShellReady = event.type === "offline-shell-ready";
  const offlineColdStart = event.type === "offline-cold-start" ? 1 : 0;
  const offlineWarmComplete = event.type === "offline-warm-complete" ? 1 : 0;
  const offlineWarmFailed = event.type === "offline-warm-failed" ? 1 : 0;
  const offlineShellError = event.type === "offline-shell-error" ? 1 : 0;
  const offlineUpdateReady = event.type === "offline-update-ready" ? 1 : 0;
  const offlineUpdateApplied = event.type === "offline-update-applied" ? 1 : 0;
  if (
    (event.type === "network-offline" && !networkOffline)
    || (event.type === "network-online" && !runtime.offlineActive)
    || (event.type === "sync-deferred" && !syncDeferred)
    || (event.type === "sync-recovered" && !syncRecovered)
    || duplicateOfflineShellEvent
  ) return state;
  const sceneLoadMs = sceneStart ? Math.min(120000, safeNumber(event.loadMs)) : 0;
  const sceneAssetRequests = sceneStart ? Math.min(2000, safeNumber(event.assetRequests)) : 0;
  const sceneAssetBytes = sceneStart ? Math.min(200000000, safeNumber(event.assetBytes)) : 0;
  const nextTier = event.toTier || event.tierId || runtime.lastTier;
  return {
    ...state,
    telemetry: {
      ...telemetry,
      current: {
        ...telemetry.current,
        runtime: {
          sampledFrames: runtime.sampledFrames + sampledFrames,
          frameMsTotal: runtime.frameMsTotal + frameMsTotal,
          longFrames: runtime.longFrames + longFrames,
          qualityTransitions: runtime.qualityTransitions + qualityChange,
          contextLosses: runtime.contextLosses + contextLoss,
          sceneStarts: runtime.sceneStarts + sceneStart,
          sceneLoadMsTotal: runtime.sceneLoadMsTotal + sceneLoadMs,
          slowSceneStarts: runtime.slowSceneStarts + (sceneStart && sceneLoadMs >= SLOW_SCENE_START_MS ? 1 : 0),
          sceneAssetRequestsTotal: runtime.sceneAssetRequestsTotal + sceneAssetRequests,
          sceneAssetBytesTotal: runtime.sceneAssetBytesTotal + sceneAssetBytes,
          peakSceneAssetRequests: Math.max(runtime.peakSceneAssetRequests, sceneAssetRequests),
          peakSceneAssetBytes: Math.max(runtime.peakSceneAssetBytes, sceneAssetBytes),
          healthSamples: runtime.healthSamples + healthSample,
          peakDisplayObjects: Math.max(runtime.peakDisplayObjects, healthSample ? safeNumber(event.displayObjects) : 0),
          peakTweens: Math.max(runtime.peakTweens, healthSample ? safeNumber(event.tweens) : 0),
          peakTextures: Math.max(runtime.peakTextures, healthSample ? safeNumber(event.textures) : 0),
          peakActiveChoices: Math.max(runtime.peakActiveChoices, healthSample ? safeNumber(event.activeChoices) : 0),
          networkInterruptions: runtime.networkInterruptions + networkOffline,
          syncDeferrals: runtime.syncDeferrals + (networkOffline || syncDeferred ? 1 : 0),
          syncRecoveries: runtime.syncRecoveries + syncRecovered,
          offlineShellReady: runtime.offlineShellReady || offlineShellReady || offlineColdStart > 0 || offlineWarmComplete > 0,
          offlineColdStarts: runtime.offlineColdStarts + offlineColdStart,
          offlineWarmups: runtime.offlineWarmups + offlineWarmComplete,
          offlineWarmupFailures: runtime.offlineWarmupFailures
            + (offlineWarmComplete ? safeNumber(event.failed) : offlineWarmFailed),
          offlineShellErrors: runtime.offlineShellErrors + offlineShellError,
          offlineUpdates: runtime.offlineUpdates + offlineUpdateReady,
          offlineUpdatesApplied: runtime.offlineUpdatesApplied + offlineUpdateApplied,
          offlineActive: networkOnline ? false : runtime.offlineActive || networkOffline > 0,
          syncPending: syncRecovered ? false : runtime.syncPending || networkOffline > 0 || syncDeferred > 0,
          lastOfflineAt: networkOffline ? event.at || new Date().toISOString() : runtime.lastOfflineAt,
          lastOfflineWarmAt: offlineWarmComplete ? event.at || new Date().toISOString() : runtime.lastOfflineWarmAt,
          lastOfflineUpdateAt: offlineUpdateApplied ? event.at || new Date().toISOString() : runtime.lastOfflineUpdateAt,
          lastOfflineBuildId: event.buildId ? String(event.buildId) : runtime.lastOfflineBuildId,
          lastOfflineShellEventId: offlineShellEvent && event.id
            ? String(event.id)
            : runtime.lastOfflineShellEventId,
          offlineShellEventIds: offlineShellEvent && event.id
            ? [...runtime.offlineShellEventIds.filter(id => id !== String(event.id)), String(event.id)].slice(-40)
            : runtime.offlineShellEventIds,
          lastSyncRecoveredAt: syncRecovered ? event.at || new Date().toISOString() : runtime.lastSyncRecoveredAt,
          fallback2d: runtime.fallback2d || nextTier === "2d" || contextLoss > 0,
          lastTier: nextTier,
          lastEventAt: event.at || new Date().toISOString()
        }
      }
    }
  };
}

export function recordQuestInteractionEvent(state, event = {}) {
  const telemetry = normalizeQuestTelemetry(state?.telemetry);
  if (!telemetry.current || !event.type) return state;
  const interaction = normalizeInteraction(telemetry.current.interaction);
  const count = Math.min(100, Math.max(1, safeNumber(event.count) || 1));
  const latencyMs = Math.min(MAX_RESPONSE_MS, safeNumber(event.latencyMs));
  const isResponse = event.type === "response";
  const isMiss = isResponse && event.correct === false;

  return {
    ...state,
    telemetry: {
      ...telemetry,
      current: {
        ...telemetry.current,
        interaction: {
          prompts: interaction.prompts + (event.type === "prompt-shown" ? count : 0),
          responses: interaction.responses + (isResponse ? count : 0),
          responseMsTotal: interaction.responseMsTotal + (isResponse ? latencyMs : 0),
          slowResponses: interaction.slowResponses + (isResponse && latencyMs >= SLOW_RESPONSE_MS ? count : 0),
          motorRetries: interaction.motorRetries + (event.type === "motor-retry" ? count : 0),
          correctionMisses: interaction.correctionMisses + (isMiss ? count : 0),
          teachBacks: interaction.teachBacks + (event.type === "teach-back" ? count : 0),
          drops: interaction.drops + (event.type === "drop" ? count : 0),
          pacingAdaptations: interaction.pacingAdaptations + (event.type === "pacing-adapted" ? 1 : 0),
          deferredBeats: interaction.deferredBeats + (event.type === "pacing-adapted" ? count : 0),
          optionalRouteVisits: interaction.optionalRouteVisits + (event.type === "optional-route" ? count : 0),
          optionalDiscoveries: interaction.optionalDiscoveries + (event.type === "optional-discovery" ? count : 0),
          restoredFriendsMet: interaction.restoredFriendsMet + (event.type === "memory-greeting" ? count : 0),
          accessibleTimingSupports: interaction.accessibleTimingSupports + (event.type === "accessible-timing-support" ? count : 0)
        }
      }
    }
  };
}

export function addQuestActiveTime(state, milliseconds, at = new Date().toISOString()) {
  const telemetry = normalizeQuestTelemetry(state?.telemetry);
  if (!telemetry.current) return state;
  const delta = Math.min(60000, safeNumber(milliseconds));
  return {
    ...state,
    telemetry: {
      ...telemetry,
      current: {
        ...telemetry.current,
        activeMs: telemetry.current.activeMs + delta,
        lastActiveAt: at
      }
    }
  };
}

export function recordQuestTelemetryAnswer(state, correct) {
  const telemetry = normalizeQuestTelemetry(state?.telemetry);
  if (!telemetry.current) return state;
  return {
    ...state,
    telemetry: {
      ...telemetry,
      current: {
        ...telemetry.current,
        answers: telemetry.current.answers + 1,
        correct: telemetry.current.correct + (correct ? 1 : 0)
      }
    }
  };
}

export function recordQuestTelemetryStop(state, stopId) {
  const telemetry = normalizeQuestTelemetry(state?.telemetry);
  if (!telemetry.current) return state;
  return {
    ...state,
    telemetry: {
      ...telemetry,
      current: {
        ...telemetry.current,
        stopId: stopId || telemetry.current.stopId,
        stopsCompleted: telemetry.current.stopsCompleted + 1
      }
    }
  };
}

export function endQuestSession(state, {
  at = new Date().toISOString(),
  reason = "exit"
} = {}) {
  const telemetry = normalizeQuestTelemetry(state?.telemetry);
  if (!telemetry.current) return state;
  const finished = { ...telemetry.current, endedAt: at, reason };
  return {
    ...state,
    telemetry: {
      current: null,
      sessions: [...telemetry.sessions.filter(session => session.id !== finished.id), finished].slice(-MAX_SESSION_HISTORY)
    }
  };
}

export function questTelemetryTotals(raw = {}) {
  const telemetry = normalizeQuestTelemetry(raw);
  const rows = [...telemetry.sessions, ...(telemetry.current ? [telemetry.current] : [])];
  const totals = rows.reduce((result, session) => ({
    activeMs: result.activeMs + safeNumber(session.activeMs),
    answers: result.answers + safeNumber(session.answers),
    correct: result.correct + safeNumber(session.correct),
    stopsCompleted: result.stopsCompleted + safeNumber(session.stopsCompleted),
    sessions: result.sessions + 1,
    reviewSessions: result.reviewSessions + (session.mode === "review" ? 1 : 0),
    shortcutSessions: result.shortcutSessions + (session.source === "chapter-shortcut" ? 1 : 0),
    accessibleSessions: result.accessibleSessions + (session.qualityTier === "2d" || session.runtime?.fallback2d ? 1 : 0),
    sampledFrames: result.sampledFrames + safeNumber(session.runtime?.sampledFrames),
    frameMsTotal: result.frameMsTotal + safeNumber(session.runtime?.frameMsTotal),
    longFrames: result.longFrames + safeNumber(session.runtime?.longFrames),
    qualityTransitions: result.qualityTransitions + safeNumber(session.runtime?.qualityTransitions),
    contextLosses: result.contextLosses + safeNumber(session.runtime?.contextLosses),
    sceneStarts: result.sceneStarts + safeNumber(session.runtime?.sceneStarts),
    sceneLoadMsTotal: result.sceneLoadMsTotal + safeNumber(session.runtime?.sceneLoadMsTotal),
    slowSceneStarts: result.slowSceneStarts + safeNumber(session.runtime?.slowSceneStarts),
    sceneAssetRequestsTotal: result.sceneAssetRequestsTotal + safeNumber(session.runtime?.sceneAssetRequestsTotal),
    sceneAssetBytesTotal: result.sceneAssetBytesTotal + safeNumber(session.runtime?.sceneAssetBytesTotal),
    peakSceneAssetRequests: Math.max(result.peakSceneAssetRequests, safeNumber(session.runtime?.peakSceneAssetRequests)),
    peakSceneAssetBytes: Math.max(result.peakSceneAssetBytes, safeNumber(session.runtime?.peakSceneAssetBytes)),
    healthSamples: result.healthSamples + safeNumber(session.runtime?.healthSamples),
    peakDisplayObjects: Math.max(result.peakDisplayObjects, safeNumber(session.runtime?.peakDisplayObjects)),
    peakTweens: Math.max(result.peakTweens, safeNumber(session.runtime?.peakTweens)),
    peakTextures: Math.max(result.peakTextures, safeNumber(session.runtime?.peakTextures)),
    peakActiveChoices: Math.max(result.peakActiveChoices, safeNumber(session.runtime?.peakActiveChoices)),
    networkInterruptions: result.networkInterruptions + safeNumber(session.runtime?.networkInterruptions),
    syncDeferrals: result.syncDeferrals + safeNumber(session.runtime?.syncDeferrals),
    syncRecoveries: result.syncRecoveries + safeNumber(session.runtime?.syncRecoveries),
    offlineShellReady: result.offlineShellReady || Boolean(session.runtime?.offlineShellReady),
    offlineColdStarts: result.offlineColdStarts + safeNumber(session.runtime?.offlineColdStarts),
    offlineWarmups: result.offlineWarmups + safeNumber(session.runtime?.offlineWarmups),
    offlineWarmupFailures: result.offlineWarmupFailures + safeNumber(session.runtime?.offlineWarmupFailures),
    offlineShellErrors: result.offlineShellErrors + safeNumber(session.runtime?.offlineShellErrors),
    offlineUpdates: result.offlineUpdates + safeNumber(session.runtime?.offlineUpdates),
    offlineUpdatesApplied: result.offlineUpdatesApplied + safeNumber(session.runtime?.offlineUpdatesApplied),
    syncPending: Boolean(session.runtime?.syncPending),
    lastOfflineWarmAt: [result.lastOfflineWarmAt, session.runtime?.lastOfflineWarmAt]
      .filter(Boolean).sort().at(-1) || "",
    lastOfflineUpdateAt: [result.lastOfflineUpdateAt, session.runtime?.lastOfflineUpdateAt]
      .filter(Boolean).sort().at(-1) || "",
    lastOfflineBuildId: session.runtime?.lastOfflineBuildId || result.lastOfflineBuildId,
    lastSyncRecoveredAt: [result.lastSyncRecoveredAt, session.runtime?.lastSyncRecoveredAt]
      .filter(Boolean).sort().at(-1) || "",
    fallbackSessions: result.fallbackSessions + (session.runtime?.fallback2d ? 1 : 0),
    prompts: result.prompts + safeNumber(session.interaction?.prompts),
    responses: result.responses + safeNumber(session.interaction?.responses),
    responseMsTotal: result.responseMsTotal + safeNumber(session.interaction?.responseMsTotal),
    slowResponses: result.slowResponses + safeNumber(session.interaction?.slowResponses),
    motorRetries: result.motorRetries + safeNumber(session.interaction?.motorRetries),
    correctionMisses: result.correctionMisses + safeNumber(session.interaction?.correctionMisses),
    teachBacks: result.teachBacks + safeNumber(session.interaction?.teachBacks),
    drops: result.drops + safeNumber(session.interaction?.drops),
    pacingAdaptations: result.pacingAdaptations + safeNumber(session.interaction?.pacingAdaptations),
    deferredBeats: result.deferredBeats + safeNumber(session.interaction?.deferredBeats),
    optionalRouteVisits: result.optionalRouteVisits + safeNumber(session.interaction?.optionalRouteVisits),
    optionalDiscoveries: result.optionalDiscoveries + safeNumber(session.interaction?.optionalDiscoveries),
    restoredFriendsMet: result.restoredFriendsMet + safeNumber(session.interaction?.restoredFriendsMet),
    accessibleTimingSupports: result.accessibleTimingSupports + safeNumber(session.interaction?.accessibleTimingSupports),
    lastActiveAt: [result.lastActiveAt, session.lastActiveAt, session.endedAt].filter(Boolean).sort().at(-1) || ""
  }), {
    activeMs: 0,
    answers: 0,
    correct: 0,
    stopsCompleted: 0,
    sessions: 0,
    reviewSessions: 0,
    shortcutSessions: 0,
    accessibleSessions: 0,
    sampledFrames: 0,
    frameMsTotal: 0,
    longFrames: 0,
    qualityTransitions: 0,
    contextLosses: 0,
    sceneStarts: 0,
    sceneLoadMsTotal: 0,
    slowSceneStarts: 0,
    sceneAssetRequestsTotal: 0,
    sceneAssetBytesTotal: 0,
    peakSceneAssetRequests: 0,
    peakSceneAssetBytes: 0,
    healthSamples: 0,
    peakDisplayObjects: 0,
    peakTweens: 0,
    peakTextures: 0,
    peakActiveChoices: 0,
    networkInterruptions: 0,
    syncDeferrals: 0,
    syncRecoveries: 0,
    offlineShellReady: false,
    offlineColdStarts: 0,
    offlineWarmups: 0,
    offlineWarmupFailures: 0,
    offlineShellErrors: 0,
    offlineUpdates: 0,
    offlineUpdatesApplied: 0,
    syncPending: false,
    lastOfflineWarmAt: "",
    lastOfflineUpdateAt: "",
    lastOfflineBuildId: "",
    lastSyncRecoveredAt: "",
    fallbackSessions: 0,
    prompts: 0,
    responses: 0,
    responseMsTotal: 0,
    slowResponses: 0,
    motorRetries: 0,
    correctionMisses: 0,
    teachBacks: 0,
    drops: 0,
    pacingAdaptations: 0,
    deferredBeats: 0,
    optionalRouteVisits: 0,
    optionalDiscoveries: 0,
    restoredFriendsMet: 0,
    accessibleTimingSupports: 0,
    lastActiveAt: ""
  });
  return {
    ...totals,
    averageFrameMs: totals.sampledFrames ? totals.frameMsTotal / totals.sampledFrames : 0,
    longFrameRate: totals.sampledFrames ? totals.longFrames / totals.sampledFrames : 0,
    averageResponseMs: totals.responses ? totals.responseMsTotal / totals.responses : 0,
    slowResponseRate: totals.responses ? totals.slowResponses / totals.responses : 0,
    motorRetryRate: totals.responses ? totals.motorRetries / totals.responses : 0,
    promptCompletionRate: totals.prompts ? Math.min(1, totals.responses / totals.prompts) : 0,
    averageSceneLoadMs: totals.sceneStarts ? totals.sceneLoadMsTotal / totals.sceneStarts : 0,
    slowSceneStartRate: totals.sceneStarts ? totals.slowSceneStarts / totals.sceneStarts : 0,
    averageSceneAssetRequests: totals.sceneStarts ? totals.sceneAssetRequestsTotal / totals.sceneStarts : 0,
    averageSceneAssetBytes: totals.sceneStarts ? totals.sceneAssetBytesTotal / totals.sceneStarts : 0
  };
}
