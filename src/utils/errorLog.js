/* global __APP_RELEASE_ID__ */
import { isSupabaseConfigured, supabase } from "../supabaseClient.js";

const ERROR_LOG_KEY = "lp-error-log";
const ERROR_LOG_LIMIT = 20;
const REMOTE_STACK_FRAME_LIMIT = 12;
const REMOTE_STACK_FRAME_LENGTH = 300;

export const ERROR_MONITOR_POLICY = Object.freeze({
  retentionDays: 30,
  boundarySampleRate: 1,
  globalSampleRate: 0.25,
  localLimit: ERROR_LOG_LIMIT,
  remoteStackFrameLimit: REMOTE_STACK_FRAME_LIMIT
});

export const APP_RELEASE_ID = (
  typeof __APP_RELEASE_ID__ !== "undefined" && __APP_RELEASE_ID__
    ? String(__APP_RELEASE_ID__)
    : "local-unversioned"
).slice(0, 120);

const SAFE_SURFACES = Object.freeze({
  "Assessment screen crashed before fallback.": "assessment",
  "App root crashed": "app-root"
});

function safeSurface(label) {
  return SAFE_SURFACES[String(label || "")] || "app";
}

function safeErrorType(error) {
  const candidate = String(error?.name || error?.constructor?.name || "Error");
  return /^[A-Za-z][A-Za-z0-9._-]{0,79}$/.test(candidate) ? candidate : "Error";
}

function redactDiagnosticFrame(value) {
  const text = String(value || "");
  const absolute = text.match(/https?:\/\/[^\s)]+?:([0-9]+):([0-9]+)\)?$/i);
  if (absolute) {
    const location = absolute[0].replace(/\)?$/, "");
    const withoutPosition = location.replace(/:[0-9]+:[0-9]+$/, "");
    try {
      const parsed = new URL(withoutPosition);
      if (!/^\/(?:assets|src)\//.test(parsed.pathname)) return "";
      return `${parsed.pathname.slice(1)}:${absolute[1]}:${absolute[2]}`
        .slice(0, REMOTE_STACK_FRAME_LENGTH);
    } catch {
      return "";
    }
  }

  const relative = text.match(/\/((?:assets|src)\/[A-Za-z0-9._/-]+:[0-9]+:[0-9]+)/);
  return relative ? relative[1].slice(0, REMOTE_STACK_FRAME_LENGTH) : "";
}

export function sanitizeStackFrames(error, componentStack = "") {
  const errorFrames = String(error?.stack || "")
    .split(/\r?\n/)
    .filter(line => /^\s*at\s+/i.test(line));
  const componentFrames = String(componentStack || "")
    .split(/\r?\n/)
    .filter(line => /^\s*at\s+/i.test(line));
  return [...errorFrames, ...componentFrames]
    .map(redactDiagnosticFrame)
    .filter(Boolean)
    .slice(0, REMOTE_STACK_FRAME_LIMIT);
}

function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function createEventId() {
  return globalThis.crypto?.randomUUID?.()
    || "00000000-0000-4000-8000-000000000000";
}

export function buildRemoteErrorEvent({
  label,
  error,
  componentStack = "",
  source = "boundary",
  severity = "error",
  sampleRate = ERROR_MONITOR_POLICY.boundarySampleRate,
  releaseId = APP_RELEASE_ID
} = {}) {
  const surface = safeSurface(label);
  const errorType = safeErrorType(error);
  const stackFrames = sanitizeStackFrames(error, componentStack);
  const safeSource = /^[a-z0-9._:-]{1,80}$/.test(source) ? source : "boundary";
  const safeSeverity = ["warning", "error", "fatal"].includes(severity) ? severity : "error";
  const boundedSampleRate = Math.max(0.0001, Math.min(1, Number(sampleRate) || 1));
  const safeReleaseId = /^[A-Za-z0-9._:-]{1,120}$/.test(String(releaseId || ""))
    ? String(releaseId)
    : "local-unversioned";
  const fingerprint = fnv1a([
    safeReleaseId,
    surface,
    errorType,
    safeSource,
    stackFrames.slice(0, 3).join("|")
  ].join(":"));

  return {
    clientEventId: createEventId(),
    releaseId: safeReleaseId,
    fingerprint,
    severity: safeSeverity,
    surface,
    errorType,
    source: safeSource,
    stackFrames,
    sampleRate: boundedSampleRate
  };
}

export function shouldSampleError(event, random = Math.random) {
  return event.severity === "fatal" || random() < event.sampleRate;
}

function writeLocalError(event) {
  try {
    const rows = readErrorLog();
    rows.unshift({
      at: new Date().toISOString(),
      label: event.surface,
      message: event.errorType,
      stack: event.stackFrames.join("\n"),
      releaseId: event.releaseId,
      fingerprint: event.fingerprint
    });
    window.localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(rows.slice(0, ERROR_LOG_LIMIT)));
  } catch {
    // Storage failures must never become a second crash.
  }
}

export function readErrorLog() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ERROR_LOG_KEY);
    const rows = raw ? JSON.parse(raw) : [];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function clearErrorLog() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ERROR_LOG_KEY);
  } catch {
    // Storage unavailable.
  }
}

export async function reportRemoteError(event, {
  client = supabase,
  configured = isSupabaseConfigured,
  random = Math.random
} = {}) {
  if (!configured || typeof client?.call !== "function") {
    return { ok: false, reason: "remote-unavailable" };
  }
  if (!shouldSampleError(event, random)) {
    return { ok: false, reason: "sampled-out" };
  }

  try {
    const { data, error } = await client.call("report_app_error", {
      p_client_event_id: event.clientEventId,
      p_release_id: event.releaseId,
      p_fingerprint: event.fingerprint,
      p_severity: event.severity,
      p_surface: event.surface,
      p_error_type: event.errorType,
      p_source: event.source,
      p_stack_frames: event.stackFrames,
      p_sample_rate: event.sampleRate
    });
    if (error || !data?.ok) {
      return { ok: false, reason: data?.error || error?.message || "remote-rejected" };
    }
    return {
      ok: true,
      alertRequired: Boolean(data.alert_required),
      retentionDays: Number(data.retention_days) || ERROR_MONITOR_POLICY.retentionDays
    };
  } catch {
    return { ok: false, reason: "remote-unavailable" };
  }
}

export function logBoundaryError(label, error, options = {}) {
  const event = buildRemoteErrorEvent({
    label,
    error,
    componentStack: options.componentStack,
    source: options.source || "boundary",
    severity: options.severity || "error",
    sampleRate: options.sampleRate ?? ERROR_MONITOR_POLICY.boundarySampleRate,
    releaseId: options.releaseId || APP_RELEASE_ID
  });
  writeLocalError(event);
  void reportRemoteError(event, options);
  return event;
}

export function logClientError(error, source = "window-error", options = {}) {
  return logBoundaryError("App root crashed", error, {
    ...options,
    source,
    sampleRate: options.sampleRate ?? ERROR_MONITOR_POLICY.globalSampleRate
  });
}
