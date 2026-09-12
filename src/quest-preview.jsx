/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles/fonts.js";
import "./index.css";
import SoundSeekersRoute from "./features/soundSeekers/SoundSeekersRoute.jsx";
import {
  resolveSoundSeekersPreviewFixture
} from "./features/soundSeekers/preview/previewFixtures.js";
import { createCampaignPreviewProgress } from "./features/soundSeekers/preview/campaignPreview.js";
import { campaignStorageKey } from "./features/soundSeekers/v3/campaignStorage.js";
import { CAMPAIGN_STAGES } from "./features/soundSeekers/v3/content/campaign.js";
import { localProgressStorageKeysForArea } from "./utils/progressKeys.js";
import { readSoundSeekersPreviewReadiness } from "./features/soundSeekers/preview/previewReadiness.js";

const ALLOWED_PARAMS = new Set([
  "fixture", "stop", "phase", "power", "scope", "reset", "resume", "sound",
  "seed", "profile", "stage"
]);
const params = new URLSearchParams(window.location.search);

function previewError() {
  for (const key of params.keys()) {
    if (!ALLOWED_PARAMS.has(key)) return `Unknown preview option: ${key}`;
  }
  if(params.has("stage")&&!CAMPAIGN_STAGES.some(stage=>stage.id===params.get("stage")))return "Unknown campaign stage";
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

const previewStage=params.get("stage") || CAMPAIGN_STAGES.find(stage=>stage.legacyStopIds.includes(fixture?.stopId))?.id || "meadow-01";
if (!error && (params.get("resume") !== "1" || params.get("reset") === "1")) {
  for(const key of localProgressStorageKeysForArea('phonics_quest',scope))window.localStorage.removeItem(key);
  window.localStorage.setItem(campaignStorageKey(scope),JSON.stringify(createCampaignPreviewProgress(previewStage)));
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
  const runtime=readSoundSeekersPreviewReadiness(document,{hasFixture:Boolean(fixture)});
  window.__questReady = runtime.status !== "loading";
  window.__soundSeekersPreview = previewSnapshot(runtime.status,runtime);
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
  attributeFilter: ["data-phase-id", "data-view", "data-runtime-status", "data-presentation", "data-sound-seekers-game"]
});

const rootElement = document.getElementById("root");
const root = rootElement.__soundSeekersRoot || createRoot(rootElement);
rootElement.__soundSeekersRoot = root;
root.render(<StrictMode><Preview /></StrictMode>);
scheduleReadiness();
