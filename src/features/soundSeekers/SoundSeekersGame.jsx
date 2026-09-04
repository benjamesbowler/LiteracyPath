import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { getExpedition } from "./content/expeditions.js";
import { createMissionPlan } from "./engine/createMissionPlan.js";
import {
  checkpointMission,
  closeCurrentMissionPresentation,
  completeMission,
  createMissionState,
  reduceMission
} from "./engine/missionReducer.js";
import {
  isSoundSeekersV2,
  normalizeAllowlistedSettings,
  normalizeSoundSeekersState
} from "./engine/stateV2.js";
import { normalizeMotorAssists } from "./engine/motorAssists.js";
import { resolveSoundSeekersPreviewFixture } from "./preview/previewFixtures.js";
import {
  createGameFeelSequence,
  createMeaningPayoffModel,
  createSceneViewModel
} from "./runtime/sceneViewModel.js";
import { SoundSeekersStage } from "./runtime/SoundSeekersStage.jsx";
import { CampaignMap } from "./ui/CampaignMap.jsx";
import { CreatorSheet } from "./ui/CreatorSheet.jsx";
import { FieldJournal } from "./ui/FieldJournal.jsx";
import MeaningPayoff from "./ui/MeaningPayoff.jsx";
import { RewardReveal } from "./ui/RewardReveal.jsx";
import { SettingsSheet } from "./ui/SettingsSheet.jsx";
import { TeachAllSequence } from "./ui/TeachAllSequence.jsx";
import { SOUND_SEEKERS_PLAYER_VISUAL } from "./visual/characterCatalog.js";
import { createCharacterAppearance } from "./visual/characterCustomization.js";
import { SOUND_SEEKERS_VISUAL_TOKENS } from "./visual/visualTokens.js";
import "./sound-seekers.css";

const DEFAULT_APPEARANCE = createCharacterAppearance({
  schemaVersion: 1,
  bodyShapeId: SOUND_SEEKERS_PLAYER_VISUAL.bodyShapeId,
  paletteTokenId: SOUND_SEEKERS_PLAYER_VISUAL.paletteTokenId,
  accessories: { back: null, head: null, neck: null, held: null }
});
const SHEETS = new Set([null, "journal", "creator", "settings"]);
const MEANING_POWERS = new Set(["word_forge", "blend_bridge"]);
const EMPTY_ACCESSIBILITY_SETTINGS = Object.freeze({});
const instructionRequestCache = new Map();
const TRAVERSAL_STEP = Object.freeze({ x: 0.2, y: 0.18 });
const ROOT_TOKEN_STYLE = Object.freeze(Object.fromEntries(
  Object.entries(SOUND_SEEKERS_VISUAL_TOKENS).map(([tokenId, value]) => (
    [`--ss-token-${tokenId}`, value]
  ))
));

function localDay(at) {
  const date = new Date(at);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function missionSeed(stopId, state, replayOrdinal) {
  const stop = Number(stopId.slice(1));
  return stop * 997 + state.trail.journeyStep * 31 + replayOrdinal * 7919;
}

function missionCheckpointState(mission) {
  const missionCheckpoint = checkpointMission(mission);
  return normalizeSoundSeekersState({
    ...mission.gameState,
    checkpoint: {
      ...(mission.gameState.checkpoint || {}),
      contentVersion: mission.gameState.contentVersion,
      stopId: mission.plan.stopId,
      mission: missionCheckpoint
    }
  });
}

function createMissionForStop(stopId, state) {
  const expedition = getExpedition(stopId);
  if (!expedition) throw new TypeError("Sound Seekers needs an authored expedition");
  const resume = state.checkpoint?.mission?.stopId === stopId
    ? state.checkpoint.mission : null;
  const replayOrdinal = resume?.replayOrdinal
    ?? (state.trail.completedStopIds.includes(stopId) ? 1 : 0);
  const seed = resume?.seed ?? missionSeed(stopId, state, replayOrdinal);
  const plan = createMissionPlan({ stopId, state, seed, replayOrdinal });
  return createMissionState(plan, resume);
}

function currentInstructionRequest(model, mission) {
  if (!mission || mission.plan.phases[mission.phaseIndex]?.kind === "teach") return null;
  const request = model.childScene
    ? model.sceneActivity?.instruction?.audioRequest || null
    : model.activity?.instruction?.audioRequest || null;
  if (!request) return null;
  const key = JSON.stringify([
    request.cueId, request.audioKey, request.visibleText, request.spokenText,
    request.kind, request.requiresAudio
  ]);
  const cached = instructionRequestCache.get(key);
  if (cached) return cached;
  instructionRequestCache.set(key, request);
  return request;
}

function audioBinding(scopeKey, mission) {
  if (!mission) return null;
  return Object.freeze({
    scopeKey,
    missionId: mission.plan.id,
    phaseId: mission.phaseId,
    attemptId: mission.attemptId
  });
}

function sceneAssists(settings, external = {}) {
  const motor = normalizeMotorAssists({
    autoTravel: settings.autoTravel === true || external.autoTravel === true,
    slowerMovement: settings.slowerMovement === true || external.slowerMovement === true,
    noDamageTravel: settings.noDamageTravel === true || external.noDamageTravel === true,
    largerTargets: settings.largerTargets === true || external.largerTargets === true,
    simplifiedScene: settings.simplifiedScene === true || external.simplifiedScene === true,
    extendedResponse: settings.extendedResponse === true || external.extendedResponse === true
  });
  return Object.freeze({
    ...motor,
    reducedMotion: settings.reducedMotion === true || external.reducedMotion === true
  });
}

function scoredMotorAssists(assists) {
  return normalizeMotorAssists({
    autoTravel: assists.autoTravel,
    slowerMovement: assists.slowerMovement,
    noDamageTravel: assists.noDamageTravel,
    largerTargets: assists.largerTargets,
    simplifiedScene: assists.simplifiedScene,
    extendedResponse: assists.extendedResponse
  });
}

function appearanceFromState(state) {
  try {
    return createCharacterAppearance(state.settings.characterAppearance || DEFAULT_APPEARANCE);
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

function clampToBounds(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function nextTraversalTarget(traversal, current, input) {
  if (!traversal || !input || typeof input !== "object") return null;
  const bounds = traversal.bounds || { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  if (input.type === "travel" && input.position
    && Number.isFinite(input.position.x) && Number.isFinite(input.position.y)) {
    return Object.freeze({
      x: clampToBounds(input.position.x, bounds.minX, bounds.maxX),
      y: clampToBounds(input.position.y, bounds.minY, bounds.maxY)
    });
  }
  const delta = input.type === "traverse" ? {
    left: { x: -TRAVERSAL_STEP.x, y: 0 },
    right: { x: TRAVERSAL_STEP.x, y: 0 },
    up: { x: 0, y: -TRAVERSAL_STEP.y },
    down: { x: 0, y: TRAVERSAL_STEP.y }
  }[input.value] : null;
  if (!delta) return null;
  const start = current || traversal.target || traversal.position;
  return Object.freeze({
    x: clampToBounds(start.x + delta.x, bounds.minX, bounds.maxX),
    y: clampToBounds(start.y + delta.y, bounds.minY, bounds.maxY)
  });
}

function tryMeaningModel(previousMission, result) {
  const phase = previousMission.plan.phases[previousMission.phaseIndex];
  if (!result.transition || result.transition.outcome !== "advance"
    || !MEANING_POWERS.has(phase?.powerId) || typeof phase.wordId !== "string") return null;
  return createMeaningPayoffModel({
    powerId: phase.powerId,
    wordId: phase.wordId,
    missionTransition: result.transition
  });
}

export function SoundSeekersGame({
  state,
  onStateChange,
  audioController,
  progressScopeKey,
  onExit,
  initialFixtureId = null,
  accessibilitySettings = EMPTY_ACCESSIBILITY_SETTINGS
}) {
  if (!isSoundSeekersV2(state) || typeof onStateChange !== "function"
    || !audioController || typeof audioController.request !== "function"
    || typeof audioController.subscribe !== "function"
    || typeof audioController.invalidate !== "function"
    || typeof progressScopeKey !== "string" || !progressScopeKey.trim()
    || (initialFixtureId !== null
      && (typeof initialFixtureId !== "string" || !initialFixtureId.trim()))
    || typeof onExit !== "function") {
    throw new TypeError("Sound Seekers game needs canonical progress, audio, scope, save, and exit owners");
  }
  const initialFixture = initialFixtureId
    ? resolveSoundSeekersPreviewFixture({ fixtureId: initialFixtureId }) : null;
  const [mission, setMission] = useState(null);
  const [missionTransition, setMissionTransition] = useState(null);
  const [meaning, setMeaning] = useState(null);
  const [gameFeel, setGameFeel] = useState(null);
  const [reward, setReward] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [notice, setNotice] = useState("");
  const [audioState, setAudioState] = useState({ key: null, status: "unavailable" });
  const [travelTarget, setTravelTarget] = useState(null);
  const missionRef = useRef(mission);
  const instructionDeliveryRef = useRef(null);
  const mainRef = useRef(null);
  const initialMissionSavedRef = useRef(false);

  const appearance = useMemo(() => appearanceFromState(state), [state]);
  const accessibilityKey = JSON.stringify([
    accessibilitySettings.autoTravel === true,
    accessibilitySettings.slowerMovement === true,
    accessibilitySettings.noDamageTravel === true,
    accessibilitySettings.largerTargets === true,
    accessibilitySettings.simplifiedScene === true,
    accessibilitySettings.extendedResponse === true,
    accessibilitySettings.reducedMotion === true
  ]);
  const assists = useMemo(
    () => sceneAssists(state.settings, accessibilitySettings),
    // The caller may recreate its settings record while the effective options
    // stay identical; the value signature keeps mission/audio ownership stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accessibilityKey, state.settings]
  );
  const motorAssists = useMemo(() => scoredMotorAssists(assists), [assists]);
  const binding = useMemo(
    () => audioBinding(progressScopeKey, mission),
    // A mission revision can change without changing its audio authority.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progressScopeKey, mission?.plan.id, mission?.phaseId, mission?.attemptId]
  );
  const model = useMemo(() => mission ? createSceneViewModel({
    missionState: mission,
    missionTransition,
    appearance,
    assists,
    reducedMotion: assists.reducedMotion
  }) : null, [appearance, assists, mission, missionTransition]);
  const travelKey = model?.traversal
    ? `${model.missionId}:${model.phaseId}:${model.traversal.routeId}` : null;
  const stageModel = useMemo(() => {
    if (!model?.traversal || travelTarget?.key !== travelKey) return model;
    return Object.freeze({
      ...model,
      traversal: Object.freeze({ ...model.traversal, target: travelTarget.target })
    });
  }, [model, travelKey, travelTarget]);
  const instructionRequest = useMemo(
    () => currentInstructionRequest(model, mission),
    [mission, model]
  );
  const instructionKey = instructionRequest && binding
    ? `${binding.missionId}:${binding.phaseId}:${binding.attemptId}:${instructionRequest.cueId}`
    : null;

  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    missionRef.current = mission;
  }, [mission]);

  useEffect(() => () => {
    const current = missionRef.current;
    if (current) closeCurrentMissionPresentation(current);
  }, []);

  useEffect(() => audioController.subscribe(snapshot => {
    if (!instructionKey || snapshot.request?.cueId !== instructionRequest?.cueId) return;
    const status = snapshot.delivery?.status || "unavailable";
    setAudioState({ key: instructionKey, status });
    if (status === "completed") instructionDeliveryRef.current = snapshot.delivery;
  }), [audioController, instructionKey, instructionRequest]);

  useEffect(() => {
    instructionDeliveryRef.current = null;
    if (instructionRequest && binding) audioController.request(instructionRequest, binding);
  }, [audioController, binding, instructionKey, instructionRequest]);

  const instructionReady = Boolean(instructionKey
    && audioState.key === instructionKey
    && audioState.status === "completed");

  const persistMission = useCallback((nextMission, options = {}) => {
    onStateChange(missionCheckpointState(nextMission), options);
  }, [onStateChange]);

  useEffect(() => {
    if (!initialFixture || initialMissionSavedRef.current) return undefined;
    let current = true;
    queueMicrotask(() => {
      if (!current || initialMissionSavedRef.current) return;
      const nextMission = createMissionForStop(initialFixture.stopId, state);
      initialMissionSavedRef.current = true;
      setMission(nextMission);
      persistMission(nextMission, { flush: true });
    });
    return () => { current = false; };
  }, [initialFixture, persistMission, state]);

  const startMission = useCallback(stopId => {
    const nextMission = createMissionForStop(stopId, state);
    setNotice("");
    setSheet(null);
    setReward(null);
    setMeaning(null);
    setGameFeel(null);
    setMissionTransition(null);
    setMission(nextMission);
    persistMission(nextMission, { flush: true });
  }, [persistMission, state]);

  const handleInput = useCallback(input => {
    if (!mission || !input || typeof input !== "object" || Array.isArray(input)) return;
    if (input.type === "traverse" || input.type === "travel") {
      if (!model?.traversal || !travelKey) return;
      setTravelTarget(current => {
        const next = nextTraversalTarget(
          model.traversal,
          current?.key === travelKey ? current.target : model.traversal.target,
          input
        );
        return next ? Object.freeze({ key: travelKey, target: next }) : current;
      });
      return;
    }
    if (input.type === "arrive" && typeof input.targetId === "string") return;
    if (input.type === "replay_instruction") {
      if (instructionRequest && binding) audioController.request(instructionRequest, binding);
      return;
    }
    const phase = mission.plan.phases[mission.phaseIndex];
    const requiresInstructionAudio = Boolean(mission.challenge)
      && mission.challenge.requiresAudio !== false;
    if (requiresInstructionAudio && !instructionReady) {
      setNotice("Hear the directions before you make this reading choice.");
      if (instructionRequest && binding) audioController.request(instructionRequest, binding);
      return;
    }
    const at = new Date().toISOString();
    let result;
    try {
      result = reduceMission(mission, input, {
        gameState: mission.gameState,
        at,
        sessionDay: localDay(at),
        audio: instructionDeliveryRef.current || { status: "unavailable" },
        audioAuthority: binding || undefined,
        assists: motorAssists
      });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "That trail action could not be completed.");
      return;
    }
    setNotice("");
    const nextTransition = result.transition || null;
    let nextGameFeel = null;
    let nextMeaning = null;
    if (nextTransition) {
      const committedModel = createSceneViewModel({
        missionState: result.state,
        missionTransition: nextTransition,
        appearance,
        assists,
        reducedMotion: assists.reducedMotion
      });
      nextGameFeel = createGameFeelSequence(committedModel, nextTransition);
      nextMeaning = tryMeaningModel(mission, result);
      instructionDeliveryRef.current = null;
    }
    if (result.completion) {
      const committed = completeMission(result.state.gameState, result.completion);
      closeCurrentMissionPresentation(result.state);
      if (binding) audioController.invalidate(binding);
      instructionDeliveryRef.current = null;
      onStateChange(committed.nextState, { flush: true });
      setMissionTransition(null);
      setGameFeel(nextGameFeel);
      setMeaning(null);
      setReward(committed.summary);
      setMission(null);
      return;
    }
    setMission(result.state);
    setMissionTransition(nextTransition);
    setGameFeel(nextGameFeel);
    setMeaning(nextMeaning);
    if (result.state !== mission) persistMission(result.state);
    if (phase?.kind === "story_transfer" && input.type === "complete_story_transfer") {
      instructionDeliveryRef.current = null;
    }
  }, [appearance, assists, audioController, binding, instructionReady, instructionRequest,
    mission, model, motorAssists, onStateChange, persistMission, travelKey]);

  const leaveMission = useCallback(() => {
    if (!mission) return;
    const saved = missionCheckpointState(mission);
    closeCurrentMissionPresentation(mission);
    if (binding) audioController.invalidate(binding);
    onStateChange(saved, { flush: true });
    setMissionTransition(null);
    setMeaning(null);
    setGameFeel(null);
    setMission(null);
  }, [audioController, binding, mission, onStateChange]);

  const updateSettings = useCallback(nextSettings => {
    const settings = normalizeAllowlistedSettings(nextSettings);
    onStateChange(normalizeSoundSeekersState({ ...state, settings }), { flush: true });
  }, [onStateChange, state]);

  const updateAppearance = useCallback(nextAppearance => {
    updateSettings({
      ...state.settings,
      characterAppearance: createCharacterAppearance(nextAppearance)
    });
  }, [state.settings, updateSettings]);

  function openSheet(next) {
    if (!SHEETS.has(next)) throw new TypeError("Unknown Sound Seekers sheet");
    setSheet(next);
  }

  const stageAudio = useMemo(() => Object.freeze({
    request(request) {
      if (!binding) return null;
      return audioController.request(request, binding);
    }
  }), [audioController, binding]);

  const phase = mission?.plan.phases[mission.phaseIndex] || null;
  const teachItem = phase?.kind === "teach" ? mission.activity?.sequence?.currentItem || null : null;

  return (
    <div
      ref={mainRef}
      className="sound-seekers-v2 ss-game"
      style={ROOT_TOKEN_STYLE}
      tabIndex={-1}
      role="region"
      aria-label="Sound Seekers reading adventure"
      data-child-surface="sound-seekers"
      data-child-region="surface"
      data-sound-seekers-game="v2"
      data-preview-fixture-id={initialFixture?.id || undefined}
      data-phase-id={mission?.phaseId || undefined}
      data-view={reward ? "reward" : mission ? "expedition" : "campaign"}
      data-high-contrast={state.settings.highContrast === true ? "true" : "false"}
      data-reduced-motion={assists.reducedMotion ? "true" : "false"}
    >
      {reward ? (
        <RewardReveal summary={reward} onContinue={() => {
          setReward(null);
          setGameFeel(null);
        }} />
      ) : mission && model ? (
        <main className="ss-expedition" aria-label="Current Sound Seekers expedition">
          <div className="ss-expedition__route-tools">
            <div className="ss-expedition__route-actions">
              <button type="button" className="ss-secondary-button" onClick={leaveMission}>
                Save and return to map
              </button>
              <button type="button" className="ss-secondary-button" onClick={() => openSheet("settings")}>
                Game settings
              </button>
            </div>
            <span aria-live="polite">
              {instructionKey && !instructionReady
                ? audioState.status === "unavailable"
                  ? "Voices are needed for this reading clue"
                  : "Preparing the sound clue…"
                : "Trail ready"}
            </span>
          </div>
          {meaning ? (
            <div className="ss-meaning-gate" data-testid="world-payoff" data-power={meaning.powerId}>
              <MeaningPayoff
                support={meaning.support}
                visual={meaning.visual}
                reducedMotion={assists.reducedMotion}
                onReplay={() => audioController.request(meaning.audioRequest, binding)}
              />
              <button className="ss-primary-button" type="button" onClick={() => setMeaning(null)}>
                Use this word on the trail
              </button>
            </div>
          ) : teachItem ? (
            <TeachAllSequence
              key={`${mission.phaseId}:${teachItem.teachIndex}:${teachItem.targetId}`}
              item={teachItem}
              binding={binding}
              audioController={audioController}
              onComplete={handleInput}
            />
          ) : (
            <SoundSeekersStage
              model={stageModel}
              assists={assists}
              audioController={stageAudio}
              onInput={handleInput}
            />
          )}
          {model.activity?.correction?.audioRequest || model.sceneActivity?.correction?.audioRequest ? (
            <button
              type="button"
              className="ss-secondary-button ss-expedition__hear-help"
              onClick={() => audioController.request(
                model.activity?.correction?.audioRequest || model.sceneActivity.correction.audioRequest,
                binding
              )}
            >
              Hear the help
            </button>
          ) : null}
          {notice ? <p className="ss-expedition__notice" role="alert">{notice}</p> : null}
          {gameFeel ? (
            <div
              className="ss-game-feel"
              role="status"
              data-outcome={gameFeel.outcome}
              data-effect-id={gameFeel.semanticFinalState.literacyEffectId || undefined}
            >
              {gameFeel.outcome === "advance" || gameFeel.outcome === "continue"
                ? "Your reading changed the world."
                : gameFeel.outcome === "model_required" ? "Watch the model, then try it yourself."
                  : "The clue is still here. Try a different choice."}
            </div>
          ) : null}
        </main>
      ) : (
        <CampaignMap
          state={state}
          onStart={startMission}
          onOpenJournal={() => openSheet("journal")}
          onOpenCreator={() => openSheet("creator")}
          onOpenSettings={() => openSheet("settings")}
          onExit={onExit}
        />
      )}

      {sheet === "journal" ? <FieldJournal state={state} onClose={() => openSheet(null)} /> : null}
      {sheet === "creator" ? (
        <CreatorSheet appearance={appearance} onChange={updateAppearance} onClose={() => openSheet(null)} />
      ) : null}
      {sheet === "settings" ? (
        <SettingsSheet settings={state.settings} onChange={updateSettings} onClose={() => openSheet(null)} />
      ) : null}
    </div>
  );
}

export default SoundSeekersGame;
