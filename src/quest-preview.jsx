/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles/fonts.js";
import "./index.css";
import SoundSeekersRoute from "./features/soundSeekers/SoundSeekersRoute.jsx";
import {
  resolveSoundSeekersPreviewFixture
} from "./features/soundSeekers/preview/previewFixtures.js";
import {
  createSoundSeekersState,
  normalizeSoundSeekersState
} from "./features/soundSeekers/engine/stateV2.js";
import { questProgressStorageKey } from "./utils/questStore.js";

const ALLOWED_PARAMS = new Set([
  "fixture", "stop", "phase", "power", "scope", "reset", "resume", "sound",
  "seed", "profile"
]);
const params = new URLSearchParams(window.location.search);

function previewError() {
  for (const key of params.keys()) {
    if (!ALLOWED_PARAMS.has(key)) return `Unknown preview option: ${key}`;
  }
  const fixtureId = params.get("fixture");
  if (!fixtureId) return null;
  try {
    resolveSoundSeekersPreviewFixture({
      fixtureId,
      ...(params.get("stop") ? { stop: params.get("stop") } : {}),
      ...(params.get("phase") ? { phase: params.get("phase") } : {}),
      ...(params.get("power") ? { power: params.get("power") } : {})
    });
    return null;
  } catch (caught) {
    return caught instanceof Error ? caught.message : "Preview fixture is invalid";
  }
}

const error = previewError();
const fixture = !error && params.get("fixture")
  ? resolveSoundSeekersPreviewFixture({ fixtureId: params.get("fixture") }) : null;
const safeScopeSuffix = (params.get("scope") || fixture?.id || "campaign")
  .replace(/[^a-z0-9:_-]/giu, "-")
  .slice(0, 96) || "campaign";
const scope = `sound-seekers-preview:${safeScopeSuffix}`;
const soundEnabled = params.get("sound") !== "0";

function freshPreviewState() {
  const base = createSoundSeekersState();
  if (!fixture) return base;
  const stopOrdinal = Number(fixture.stopId.slice(1));
  return normalizeSoundSeekersState({
    ...base,
    trail: {
      ...base.trail,
      routeCursor: stopOrdinal,
      journeyStep: stopOrdinal
    }
  });
}

if (!error && (params.get("resume") !== "1" || params.get("reset") === "1")) {
  window.localStorage.setItem(
    questProgressStorageKey(scope),
    JSON.stringify(freshPreviewState())
  );
}

function InvalidPreview({ message }) {
  return (
    <main className="ss-preview-error" aria-labelledby="ss-preview-error-title" data-preview-playable="false">
      <h1 id="ss-preview-error-title">This preview cannot start</h1>
      <p>{message}</p>
      <p>Choose one canonical Sound Seekers fixture. No progress was changed.</p>
    </main>
  );
}

function Preview() {
  const [open, setOpen] = useState(true);
  if (error) return <InvalidPreview message={error} />;
  if (!open) {
    return (
      <main className="ss-preview-closed">
        <h1>Sound Seekers is safely closed</h1>
        <p>Your exact checkpoint was saved.</p>
        <button className="ss-primary-button" type="button" onClick={() => setOpen(true)}>
          Return to the trail
        </button>
      </main>
    );
  }
  return (
    <SoundSeekersRoute
      progressScopeKey={scope}
      isSoundEnabled={soundEnabled}
      initialFixtureId={fixture?.id || null}
      accessibilitySettings={{
        reducedMotion: params.get("profile") === "reduced-motion",
        simplifiedScene: params.get("profile") === "simplified",
        extendedResponse: params.get("profile") === "extended-response"
      }}
      onExit={() => setOpen(false)}
    />
  );
}

const runtimeErrors = [];
let readinessQueued = false;

function previewSnapshot(status, details = {}) {
  return Object.freeze({
    status,
    playable: status === "ready" && !error,
    fixtureId: fixture?.id || null,
    requestedStopId: fixture?.stopId || null,
    requestedPhaseId: fixture?.phaseId || null,
    requestedPowerId: fixture?.powerId || null,
    scope,
    audioEnabled: soundEnabled,
    currentPhaseId: details.currentPhaseId || null,
    targetReached: Boolean(fixture && details.currentPhaseId === fixture.phaseId),
    view: details.view || null,
    stageStatus: details.stageStatus || null,
    error: details.error || null
  });
}

function publishReadiness() {
  readinessQueued = false;
  if (error) {
    window.__questReady = true;
    window.__soundSeekersPreview = previewSnapshot("invalid", { error });
    return;
  }
  if (runtimeErrors.length) {
    window.__questReady = true;
    window.__soundSeekersPreview = previewSnapshot("error", {
      error: runtimeErrors[0]
    });
    return;
  }
  const game = document.querySelector('[data-sound-seekers-game="v2"]');
  const currentPhaseId = game?.getAttribute("data-phase-id") || null;
  const view = game?.getAttribute("data-view") || null;
  const stageStatus = game?.querySelector("[data-sound-seekers-stage]")
    ?.getAttribute("data-runtime-status") || null;
  const routeReady = Boolean(game && view)
    && (!fixture || Boolean(currentPhaseId))
    && stageStatus !== "loading";
  const status = routeReady ? "ready" : "loading";
  window.__questReady = routeReady;
  window.__soundSeekersPreview = previewSnapshot(status, {
    currentPhaseId,
    view,
    stageStatus
  });
}

function scheduleReadiness() {
  if (readinessQueued) return;
  readinessQueued = true;
  queueMicrotask(publishReadiness);
}

window.__questReady = false;
window.__soundSeekersPreview = previewSnapshot(error ? "invalid" : "loading", { error });
window.addEventListener("error", event => {
  runtimeErrors.push(String(event.error?.message || event.message || "Preview runtime error"));
  scheduleReadiness();
});
window.addEventListener("unhandledrejection", event => {
  runtimeErrors.push(String(event.reason?.message || event.reason || "Preview runtime error"));
  scheduleReadiness();
});
const readinessObserver = new MutationObserver(scheduleReadiness);
readinessObserver.observe(document.documentElement, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ["data-phase-id", "data-view", "data-runtime-status"]
});

const rootElement = document.getElementById("root");
const root = rootElement.__soundSeekersRoot || createRoot(rootElement);
rootElement.__soundSeekersRoot = root;
root.render(<StrictMode><Preview /></StrictMode>);
scheduleReadiness();
