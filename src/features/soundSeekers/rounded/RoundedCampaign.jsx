import { createLearningDwell, LEARNING_PACE } from '../../../utils/learningPace.js';
import { soundSeekersRoundedCssVariables } from '../visual/visualTokens.js';
import { CHILD_COPY } from '../../../copy/childCopy.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createCampaignStorage } from '../v3/campaignStorage.js';
import { queueProgressSave } from '../../../utils/progressSync.js';
import { CAMPAIGN_STAGES, CAMPAIGN_MISSIONS, CAMPAIGN_WORLDS, getCampaignStage, getCampaignMission } from '../v3/content/campaign.js';
import { CAST } from '../v3/content/cast.js';
import { CAMPAIGN_STAGE_NARRATION, CAMPAIGN_MISSION_NARRATION, CAMPAIGN_FAMILY_NARRATION } from '../v3/content/campaignNarration.js';
import { isCampaignMissionUnlocked, isCampaignStageUnlocked, updateCampaignCheckpoint } from '../v3/engine/campaignProgress.js';
import { publicBeat, MECHANICS } from '../v3/engine/challenges.js';
import { campaignInstructionPlan } from '../v3/engine/campaignInstructions.js';
import { campaignTextSupport } from '../v3/engine/campaignChallenges.js';
import { soundPictureCue } from '../v3/engine/campaignSoundPictures.js';
import { createCampaignPlayClock, advanceCampaignPlayClock, campaignPlayTimeSnapshot } from '../v3/engine/campaignPlayTime.js';
import { AUDIO, createAudio } from '../../../../demos/sound-seekers/src/audio.js';
import { woodlandAssetUrl } from '../../../../demos/sound-seekers/src/assetUrls.js';
import { createCampaignWorld } from './campaignWorld.js';
import CampaignActivity from './CampaignActivity.jsx';
import { registerCampaignAudio, collectCampaignOfflineAudio } from './campaignAudioCatalog.js';
import { campaignFeedbackSources } from './campaignFeedback.js';
import { warmQuestOfflineAssets } from '../../../utils/offlineShell.js';
import { ROUND_CAMPAIGN, currentCampaignCheckpoint, currentCampaignBeat, campaignResumeStage, enterCampaignStage, recordRoundedDiscovery, recordRoundedInventory, startRoundedMission, judgeRoundedAction, advanceRoundedMission, roundedPosition, restoreRoundedPosition } from './campaignController.js';
import './rounded-campaign.css';

const MOVE_DIRECTIONS = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
const MOVE_BUTTONS = [[-1, 0, 'Left'], [1, 0, 'Right'], [0, -1, 'Up'], [0, 1, 'Down']];

function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const launcher = dialog.ownerDocument.activeElement;
    dialog.showModal();
    dialog.querySelector('.rc-primary')?.focus();
    return () => {
      dialog.close();
      if (launcher?.isConnected) launcher.focus({ preventScroll: true });
    };
  }, []);
  const trapTab = event => {
    if (event.key !== 'Tab') return;
    const nodes = [...ref.current.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(node => node.getClientRects().length);
    const first = nodes[0], last = nodes.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  return <dialog ref={ref} className="rc-dialog" role="dialog" aria-modal="true" aria-label={title} onKeyDown={trapTab} onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="rc-dialog-title"><h2>{title}</h2><button onClick={onClose} aria-label={`Close ${title}`}>×</button></div>{children}
  </dialog>;
}

export default function RoundedCampaign({ progressScopeKey, isSoundEnabled, ephemeral, accessibilitySettings = {}, onExit, onOpenWoodland }) {
  const [{ adapter, loaded }] = useState(() => {
    const storage = createCampaignStorage({ getStorage: () => window.localStorage, queueSave: queueProgressSave, eventTarget: window, localOnly: ephemeral });
    return { adapter: storage, loaded: storage.loadCampaignProgress(progressScopeKey) };
  });
  const [progress, setProgress] = useState(loaded.progress);
  const progressRef = useRef(progress);
  const [saveState, setSaveState] = useState(loaded);
  const [cloudStatus, setCloudStatus] = useState('device');
  const [mode, setMode] = useState('title');
  const [modal, setModal] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [displayHold, setDisplayHold] = useState(null);
  const [teachingTarget, setTeachingTarget] = useState('');
  const displayHoldRef = useRef(null), resultDwell = useRef(null), feedbackVoice = useRef(Promise.resolve()), reflectionDwell = useRef(null), teachingCursor = useRef('');
  const [supportText, setSupportText] = useState('');
  const [settings, setSettings] = useState(() => ({ muted: !isSoundEnabled || progress?.campaign?.presentationSettings?.muted === true,
    reduced: accessibilitySettings.reducedMotion === true || progress?.campaign?.presentationSettings?.reduced === true,
    low: accessibilitySettings.simplifiedScene === true || progress?.campaign?.presentationSettings?.low === true }));
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneError, setSceneError] = useState('');
  const [sceneRevision, setSceneRevision] = useState(0);
  const [snapshot, setSnapshot] = useState({ markers: [] });
  const [speaking, setSpeaking] = useState(false);
  const [audioError, setAudioError] = useState('');
  const host = useRef(null), world = useRef(null), sceneStateRef = useRef(null), audio = useRef(null), audioCatalog = useRef({}), cueGeneration = useRef(0), replayGeneration = useRef(0), positionAt = useRef(0), playClock = useRef(null), nearMission = useRef(null);
  const motorPointers = useRef(new Map()), motorKeys = useRef(new Set());
  const moveMotor = useCallback((tapStep = false) => {
    const vectors = [...motorPointers.current.values(), ...[...motorKeys.current].map(name => MOVE_DIRECTIONS[name]).filter(Boolean)];
    const vector = vectors.reduce((sum, direction) => [sum[0] + direction[0], sum[1] + direction[1]], [0, 0]);
    world.current?.move(...vector, { tapStep });
    world.current?.run(motorKeys.current.has('Shift'));
  }, []);
  const releaseMotorPointer = event => { motorPointers.current.delete(event.pointerId); moveMotor(); };
  const stageId = progress ? campaignResumeStage(progress) : CAMPAIGN_STAGES[0].id;
  const stage = getCampaignStage(stageId) || CAMPAIGN_STAGES[0];
  const checkpoint = currentCampaignCheckpoint(progress), beat = currentCampaignBeat(progress), mission = getCampaignMission(checkpoint?.missionId);
  const paused = modal !== null;
  const available = progress ? CAMPAIGN_MISSIONS.filter(item => item.stageId === stage.id && !progress.campaign.completedMissions[item.id] && isCampaignMissionUnlocked(progress, item.id, ROUND_CAMPAIGN)) : [];
  const focusedMission = available.find(item => item.kind === 'main') || available[0];
  const nearbyMission = available.find(item => item.id === snapshot.nearMissionId);
  const stageRepaired = stage.missionIds.every(id => progress?.campaign?.completedMissions[id]);
  const objectiveResident = CAST[nearbyMission?.residentId || focusedMission?.residentId || stage.residentId];
  const availableIds = available.map(item => item.id).join(',');
  const completedIds = Object.keys(progress?.campaign?.completedMissions || {}).join(',');
  const discoveredIds = Object.values(progress?.campaign?.gameDiscoveries || {}).filter(item => item.stageId === stage.id).map(item => item.id).join(',');
  const carryingId = progress?.campaign?.gameInventory?.[stage.id]?.carryingId || null;
  const nextStage = CAMPAIGN_STAGES[CAMPAIGN_STAGES.indexOf(stage) + 1];
  const totalMain = Object.keys(progress?.campaign?.completedMissions || {}).filter(id => getCampaignMission(id)?.kind === 'main').length;
  const blocked = !progress || ['unreadable', 'unsupported', 'conflict', 'reset'].includes(saveState.status);
  useEffect(() => { void warmQuestOfflineAssets(collectCampaignOfflineAudio({ stageId: stage.id, missionId: checkpoint?.missionId, challenges: checkpoint?.challenges || [] }), { chapterId: checkpoint?.missionId || stage.id }); }, [stage.id, checkpoint?.missionId, checkpoint?.attemptId, checkpoint?.challenges]);

  const save = useCallback((candidate, options) => {
    const result = adapter.saveCampaignProgress(progressScopeKey, candidate, options);
    const retained = result.progress || candidate;
    progressRef.current = retained; setProgress(retained); setSaveState(result);
    return result.ok;
  }, [adapter, progressScopeKey]);
  useEffect(() => {
    const storage = adapter;
    const unsubscribe = storage.subscribeCampaignProgress(progressScopeKey, result => {
      setSaveState(result);
      if (result.ok && result.progress) { progressRef.current = result.progress; setProgress(result.progress); }
    });
    const sync = event => { if (event.detail?.studentId === progressScopeKey && event.detail.area === 'phonics_quest' && event.detail.key === 'sound_seekers_v3') setCloudStatus(['saved', 'recovered'].includes(event.detail.status) ? 'saved' : 'device'); };
    window.addEventListener('lp-progress-sync-state', sync);
    return () => { unsubscribe(); window.removeEventListener('lp-progress-sync-state', sync); void storage.disposeCampaignStorage(progressScopeKey); };
  }, [adapter, progressScopeKey]);
  useEffect(() => {
    const owner = createAudio({ catalog: audioCatalog.current, maxDecodedClips: 64, onSpeakingChange: setSpeaking,
      onError: () => setAudioError('The recording did not play. Tap the speaker to replay, or Read the clue.') });
    audio.current = owner;
    return () => { owner.dispose(); audio.current = null; resultDwell.current?.cancel(); reflectionDwell.current?.resolveCancelled?.(); reflectionDwell.current?.cancel(); };
  }, []);
  useEffect(() => { audio.current?.setMuted(settings.muted); }, [settings.muted]);
  useEffect(() => {
    let active = true, created, ready = false;
    const controller = new AbortController();
    queueMicrotask(() => { if (active) { setSceneReady(false); setSceneError(''); setSnapshot({ markers: [] }); } });
    createCampaignWorld(host.current, {
      ready: () => { ready = true; },
      failure: () => { if (active) { setSceneError('The landscape could not open. You can still help every Pal from Places.'); setSceneReady(false); } },
      snapshot: value => { if (active) { nearMission.current = value.nearMissionId; setSnapshot(value); } },
      interaction: event => { if (active) { const next = recordRoundedInventory(progressRef.current, event, Date.now()); if (next !== progressRef.current) save(next); } },
      discovery: event => { if (active) save(recordRoundedDiscovery(progressRef.current, event, Date.now())); },
    }, { stageId: stage.id, reduced: settings.reduced, low: settings.low, signal: controller.signal, assetUrl: path => woodlandAssetUrl(`/assets/${path}`) }).then(value => {
      created = value;
      if (!active) { value.dispose(); return; }
      world.current = value;
      if (sceneStateRef.current) value.setState(sceneStateRef.current);
      const position = restoreRoundedPosition(currentCampaignCheckpoint(progressRef.current)?.position, stage.id);
      if (position) value.restore(position);
      setSceneReady(ready);
    }).catch(() => { if (active) setSceneError('The landscape could not open. Choose a mission from Places to keep going.'); });
    return () => { active = false; controller.abort(); created?.dispose(); world.current = null; nearMission.current = null; };
  // Settings changes update the existing scene without resetting its position.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage.id, sceneRevision]);
  useEffect(() => {
    const state = { phase: mode, paused, focusOnResume: false, reduced: settings.reduced, low: settings.low,
      completedMissionIds: completedIds ? completedIds.split(',') : [], availableMissionIds: availableIds ? availableIds.split(',') : [], discoveredIds: discoveredIds ? discoveredIds.split(',') : [], carryingId, focusMissionId: focusedMission?.id };
    sceneStateRef.current = state; world.current?.setState(state);
  }, [mode, paused, settings.reduced, settings.low, completedIds, availableIds, discoveredIds, carryingId, focusedMission?.id, sceneReady]);

  const cancelCue = useCallback(() => { cueGeneration.current++; replayGeneration.current++; audio.current?.stop(); reflectionDwell.current?.resolveCancelled?.(); reflectionDwell.current?.cancel(); }, []);
  const dispatch = useCallback(action => {
    if (blocked || displayHoldRef.current) return;
    const before = progressRef.current;
    const beforeCp = currentCampaignCheckpoint(before), beforeBeat = currentCampaignBeat(before);
    const result = judgeRoundedAction(before, action, Date.now());
    if (result.progress === before) return;
    if (!['HEARD_PROMPT', 'HEARD_CARD', 'FINISH', 'PICTURE_CUE_SHOWN'].includes(action.type)) cancelCue();
    save(result.progress);
    const visible = { type: result.outcome.type, line: result.outcome.line, revealId: result.outcome.revealId, itemId: result.outcome.itemId, tileId: result.outcome.tileId, binId: result.outcome.binId };
    setFeedback({ ...visible, action });
    if (action.type === 'REQUEST_TEXT_SUPPORT') setSupportText(campaignTextSupport(currentCampaignBeat(before), currentCampaignCheckpoint(before).beatState));
    const sources = campaignFeedbackSources(currentCampaignBeat(before), currentCampaignCheckpoint(result.progress).beatState, action, result.outcome, woodlandAssetUrl(AUDIO.wrong).split('?')[0]);
    if (sources.length) {
      registerCampaignAudio(audioCatalog.current, sources);
      const generation = cueGeneration.current;
      feedbackVoice.current = (async () => {
        await audio.current?.unlock();
        if (generation === cueGeneration.current) return audio.current?.sequence(sources);
        return false;
      })();
    } else {
      feedbackVoice.current = Promise.resolve(false);
      if (result.outcome.type === 'incorrect') void audio.current?.sfx('wrong');
      else if (['correct', 'complete'].includes(result.outcome.type)) void audio.current?.sfx('correct');
    }
    const nextCp = currentCampaignCheckpoint(result.progress);
    if (nextCp.beatState.done || nextCp.beatState.itemIndex !== beforeCp.beatState.itemIndex) {
      const hold = { id: `${beforeCp.attemptId}:${beforeBeat.id}:${beforeCp.beatState.itemIndex || 0}`, beat: beforeBeat, state: { ...nextCp.beatState, itemIndex: beforeCp.beatState.itemIndex, done: true }, sources };
      displayHoldRef.current = hold; setDisplayHold(hold);
    }
  }, [blocked, save, cancelCue]);
  const playSources = useCallback(async (sources, metadata, planGeneration) => {
    const privateBeat = currentCampaignBeat(progressRef.current);
    if (!privateBeat || mode !== 'activity' || paused) return false;
    if (displayHoldRef.current) {
      const voice = audio.current?.sequence(sources); feedbackVoice.current = voice; resultDwell.current?.waitFor(voice); return voice;
    }
    if (planGeneration === undefined) replayGeneration.current++;
    else if (planGeneration !== replayGeneration.current) return false;
    const identity = `${currentCampaignCheckpoint(progressRef.current).attemptId}:${privateBeat.id}`;
    const step = metadata?.kind === 'teach' ? campaignInstructionPlan(privateBeat).find(item => item.targetId === metadata.targetId && JSON.stringify(item.sources) === JSON.stringify(sources)) : null;
    registerCampaignAudio(audioCatalog.current, sources);
    const generation = ++cueGeneration.current;
    await audio.current?.unlock();
    if (generation !== cueGeneration.current) return false;
    const heard = await audio.current?.sequence(sources);
    const current = currentCampaignCheckpoint(progressRef.current);
    if (!heard || generation !== cueGeneration.current || `${current?.attemptId}:${currentCampaignBeat(progressRef.current)?.id}` !== identity) return false;
    if (step) {
      dispatch({ type: 'HEARD_CARD', targetId: step.targetId });
      const now = currentCampaignCheckpoint(progressRef.current);
      if (planGeneration === undefined && privateBeat.view.cards.every(card => now.beatState.cardsHeard.includes(card.targetId))) dispatch({ type: 'FINISH' });
    }
    return true;
  }, [dispatch, mode, paused]);
  const replay = useCallback(async () => {
    const privateBeat = displayHoldRef.current?.beat || currentCampaignBeat(progressRef.current), cp = currentCampaignCheckpoint(progressRef.current);
    if (!privateBeat || mode !== 'activity' || paused) return;
    setAudioError('');
    const planGeneration = ++replayGeneration.current;
    if (displayHoldRef.current) {
      const hold = displayHoldRef.current;
      const sources = hold.sources.length ? hold.sources : campaignInstructionPlan(hold.beat, hold.state).flatMap(step => step.sources);
      const voice = audio.current?.sequence(sources); feedbackVoice.current = voice; resultDwell.current?.waitFor(voice); return;
    }
    const wholePlan = campaignInstructionPlan(privateBeat, cp.beatState);
    const cursor = wholePlan.findIndex(step => step.targetId && step.targetId === teachingCursor.current);
    const plan = cursor >= 0 ? wholePlan.slice(cursor) : wholePlan;
    const identity = `${cp.attemptId}:${privateBeat.id}:${cp.beatState.itemIndex || 0}`;
    for (const step of plan) {
      if (step.kind === 'teach') { teachingCursor.current = step.targetId; setTeachingTarget(step.targetId); }
      const heard = await playSources(step.sources, step, planGeneration);
      if (!heard || planGeneration !== replayGeneration.current || `${currentCampaignCheckpoint(progressRef.current)?.attemptId}:${currentCampaignBeat(progressRef.current)?.id}:${currentCampaignCheckpoint(progressRef.current)?.beatState.itemIndex || 0}` !== identity) return;
      if (step.kind === 'teach') {
        const reflected = await new Promise(resolve => {
          reflectionDwell.current?.cancel();
          reflectionDwell.current = createLearningDwell({ minimumMs: LEARNING_PACE.reflection, settleMs: 0, onAdvance: () => resolve(true) });
          reflectionDwell.current.resolveCancelled = () => resolve(false);
        });
        if (!reflected || planGeneration !== replayGeneration.current) return;
      }
    }
    if (privateBeat.mechanic === MECHANICS.SIGNPOST) { teachingCursor.current = ''; dispatch({ type: 'FINISH' }); }
    if (privateBeat.mechanic !== MECHANICS.SIGNPOST && plan.length) dispatch({ type: 'HEARD_PROMPT' });
  }, [dispatch, mode, paused, playSources]);
  useEffect(() => {
    let active = true;
    if (!displayHoldRef.current || paused) cancelCue();
    queueMicrotask(() => {
      if (!active) return;
      setAudioError('');
      const supportedBeat = displayHoldRef.current?.beat || beat;
      const supportedState = displayHoldRef.current?.state || checkpoint?.beatState;
      const writtenIntroduction = supportedState?.supportUsed.some(kind => ['text-support', 'visual-introduction'].includes(kind));
      setSupportText(supportedBeat && writtenIntroduction ? campaignTextSupport(supportedBeat, supportedState) : '');
      if (mode === 'activity' && !paused && beat && !checkpoint.beatState.done && !displayHoldRef.current) void replay();
    });
    return () => { active = false; if (!displayHoldRef.current || paused) cancelCue(); };
  // Content/cursor and owner state define playback, never position saves.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat?.id, checkpoint?.beatState.itemIndex, displayHold?.id, mode, paused, settings.muted]);
  useEffect(() => { let active = true; queueMicrotask(() => { if (active) setFeedback(null); }); return () => { active = false; }; }, [beat?.id]);
  useEffect(() => {
    if (mode !== 'activity' || !saveState.ok || !displayHold) return undefined;
    const owner = createLearningDwell({ minimumMs: displayHold.beat.mechanic === MECHANICS.SIGNPOST ? LEARNING_PACE.concept : displayHold.beat.mechanic === 'sentence_build' ? LEARNING_PACE.sentence : LEARNING_PACE.word,
      onAdvance: () => {
        const current = currentCampaignCheckpoint(progressRef.current);
        if (current?.beatState.done) {
          const next = advanceRoundedMission(progressRef.current, Date.now());
          if (!save(next)) return;
          if (!currentCampaignBeat(next)) { setMode('explore'); setFeedback({ type: 'mission-complete', line: 'You helped! Your work stays here.' }); }
        }
        displayHoldRef.current = null; setDisplayHold(null); teachingCursor.current = ''; setTeachingTarget(''); setFeedback(null);
      } });
    resultDwell.current = owner; owner.waitFor(feedbackVoice.current);
    if (paused || document.hidden) owner.pause();
    return () => { owner.cancel(); if (resultDwell.current === owner) resultDwell.current = null; };
  // Pause changes the same owned timeline; it never remounts a shorter result.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayHold?.id, mode, saveState.ok, save]);
  useEffect(() => {
    if (paused || document.hidden) {
      resultDwell.current?.pause();
      reflectionDwell.current?.pause();
    } else {
      reflectionDwell.current?.resolveCancelled?.(); reflectionDwell.current?.cancel();
      if (displayHoldRef.current) { void replay(); resultDwell.current?.resume(); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);
  useEffect(() => {
    const visibility = () => {
      if (document.hidden) { resultDwell.current?.pause(); reflectionDwell.current?.pause(); cancelCue(); }
      else { if (displayHoldRef.current) { void replay(); resultDwell.current?.resume(); } else if (mode === 'activity' && !paused) void replay(); }
    };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, [cancelCue, mode, paused, replay]);
  // A completed checkpoint restored from storage receives a fresh readable
  // result, rather than advancing on mount or manufacturing a second answer.
  useEffect(() => {
    if (mode !== 'activity' || !beat || !checkpoint?.beatState.done || displayHoldRef.current) return;
    const hold = { id: `${checkpoint.attemptId}:${beat.id}:restored`, beat, state: checkpoint.beatState, sources: [] };
    displayHoldRef.current = hold;
    queueMicrotask(() => setDisplayHold(hold));
  }, [beat, checkpoint, mode]);

  const begin = useCallback((id, replayCompleted = false) => {
    if (blocked) return;
    resultDwell.current?.cancel(); reflectionDwell.current?.resolveCancelled?.(); reflectionDwell.current?.cancel(); displayHoldRef.current = null; setDisplayHold(null); teachingCursor.current = ''; setTeachingTarget('');
    cancelCue(); void audio.current?.unlock();
    try {
      const currentPosition = world.current?.position();
      const next = startRoundedMission(progressRef.current, id, { attemptId: crypto.randomUUID(), now: Date.now(), replay: replayCompleted,
        position: currentPosition ? roundedPosition({ ...currentPosition, stageId: getCampaignMission(id).stageId }) : undefined });
      if (next === progressRef.current) return;
      if (!save(next)) return;
      playClock.current = createCampaignPlayClock(currentCampaignCheckpoint(next).playTime, Date.now());
      setModal(null); setMode('activity');
    } catch { setAudioError('This activity could not open. Your saved place is safe. Try another available activity.'); }
  }, [blocked, cancelCue, save]);
  const start = () => { void audio.current?.unlock(); setMode(currentCampaignBeat(progressRef.current) ? 'activity' : 'explore'); };
  const hearProblem = async () => {
    cancelCue();
    const generation = cueGeneration.current;
    const currentMission = nearbyMission || focusedMission;
    const cue = (nearbyMission || stageRepaired) && currentMission
      ? CAMPAIGN_MISSION_NARRATION[currentMission.id] || CAMPAIGN_FAMILY_NARRATION[currentMission.familyId]
      : CAMPAIGN_STAGE_NARRATION[stage.id];
    if (!cue) return;
    registerCampaignAudio(audioCatalog.current, cue);
    await audio.current?.unlock();
    if (generation === cueGeneration.current) await audio.current?.play(cue.audio);
  };
  const updateSettings = patch => { const next = { ...settings, ...patch }; setSettings(next); if (progressRef.current) save({ ...progressRef.current, updatedAt: Date.now(), campaign: { ...progressRef.current.campaign, presentationSettings: next } }); };
  const exit = async () => {
    if (!blocked && !saveState.ok && !save(progressRef.current)) return;
    cancelCue();
    const current = currentCampaignCheckpoint(progressRef.current);
    if (!blocked && current && !current.completed) {
      const position = world.current?.position();
      const patch = { attemptId: current.attemptId };
      if (position) patch.position = roundedPosition({ ...position, stageId: stage.id });
      if (playClock.current) patch.playTime = campaignPlayTimeSnapshot(playClock.current);
      if (!save(updateCampaignCheckpoint(progressRef.current, current.missionId, patch, Date.now()))) return;
    }
    await adapter.flushCampaignProgress(progressScopeKey); onExit();
  };
  useEffect(() => {
    const timer = setInterval(() => {
      const current = currentCampaignCheckpoint(progressRef.current);
      if (!current || current.completed || mode !== 'activity') return;
      playClock.current ||= createCampaignPlayClock(current.playTime, Date.now());
      playClock.current = advanceCampaignPlayClock(playClock.current, { nowMs: Date.now(), paused, hidden: document.hidden, loading: false, helpOpen: modal === 'help' });
      if (Date.now() - positionAt.current < 10000) return;
      positionAt.current = Date.now();
      save(updateCampaignCheckpoint(progressRef.current, current.missionId, { attemptId: current.attemptId, playTime: campaignPlayTimeSnapshot(playClock.current) }, Date.now()), { positionOnly: true });
    }, 500);
    return () => clearInterval(timer);
  }, [modal, mode, paused, save]);
  useEffect(() => {
    if (mode !== 'explore' || paused || !checkpoint || checkpoint.completed || Date.now() - positionAt.current < 5000 || !Number.isFinite(snapshot.x)) return;
    positionAt.current = Date.now();
    save(updateCampaignCheckpoint(progressRef.current, checkpoint.missionId, { attemptId: checkpoint.attemptId, position: roundedPosition(snapshot) }, Date.now()), { positionOnly: true });
  }, [snapshot, checkpoint, mode, paused, save]);
  useEffect(() => {
    const key = event => {
      if (event.key === 'Escape' && !modal) { event.preventDefault(); setModal('pause'); return; }
      if (mode !== 'explore' || paused || event.target.closest('input,textarea,select,dialog,[contenteditable="true"]')) return;
      const name = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (MOVE_DIRECTIONS[name] || name === 'Shift') { event.preventDefault(); motorKeys.current.add(name); moveMotor(); }
      if (name === 'e' && !event.repeat) { event.preventDefault(); if (nearMission.current) begin(nearMission.current); else world.current?.interact(); }
    };
    const release = event => { motorKeys.current.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key); moveMotor(); };
    const stop = () => { motorKeys.current.clear(); motorPointers.current.clear(); world.current?.move(0, 0); world.current?.run(false); };
    window.addEventListener('keydown', key); window.addEventListener('keyup', release); window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', stop);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('keyup', release); window.removeEventListener('blur', stop); document.removeEventListener('visibilitychange', stop); stop(); };
  }, [begin, modal, mode, paused, moveMotor]);

  const statusLine = !saveState.ok ? saveState.error?.message : ephemeral ? 'Just for this visit' : cloudStatus === 'saved' ? 'Saved for you' : 'Saved on this device';
  const observedInput = () => { if (playClock.current) playClock.current = advanceCampaignPlayClock(playClock.current, { nowMs: Date.now(), activity: true, paused, hidden: document.hidden }); };
  const missionChoices = (items, replay = false) => <div className="rc-mission-list">{items.map(item => <button key={item.id} disabled={blocked} onClick={() => begin(item.id, replay)}><img src={CAST[item.residentId]?.sprite} alt="" /><span>{item.title}<small>{replay ? 'Play again' : progress?.campaign?.checkpoints?.[item.id] ? 'Carry on' : item.kind === 'optional' ? 'Extra adventure' : `Help ${CAST[item.residentId]?.name || 'this Pal'}`}</small></span></button>)}</div>;
  const visitPlace = item => { if (save(enterCampaignStage(progressRef.current, item.id, Date.now()))) { setMode('explore'); setModal(null); } };
  const replayMissions = CAMPAIGN_MISSIONS.filter(item => item.stageId === stage.id && progress?.campaign?.completedMissions[item.id]);
  return <main style={soundSeekersRoundedCssVariables()} className="rc-game" data-sound-seekers-game="rounded-campaign" data-presentation="rounded-3d" data-child-surface="sound-seekers" data-stage-id={stage.id} data-mode={mode} aria-label="Sound Seekers" tabIndex={-1} onPointerDownCapture={observedInput} onKeyDownCapture={observedInput}>
    <div className="rc-landscape" ref={host} aria-hidden={mode !== 'explore'} />
    <header className="rc-header"><span className="rc-brand">Sound Seekers{mode === 'activity' && checkpoint && <small aria-label="Mission steps">{checkpoint.beatIndex + 1} of {checkpoint.challenges.length}</small>}</span><span>{mode === 'activity' && mission ? mission.title : stage.name}</span><button onClick={() => setModal('places')}>Places</button><button onClick={() => setModal('pause')}>Pause</button></header>
    {mode === 'title' && <section className="rc-title"><img src={CAST.bouncy.sprite} alt="Bouncy" /><p className="rc-eyebrow">A journey with Bouncy</p><h1 data-child-title="">Three worlds to help.</h1><p data-child-instruction="">{CHILD_COPY.soundSeekers.startInstruction}</p><button className="rc-primary" data-child-primary="" data-child-emphasis="primary" data-child-emphasis-cue="" disabled={blocked} onClick={start}>{beat ? 'Carry on' : 'Start exploring'}</button><div data-child-choices=""><button onClick={onOpenWoodland}>Woodland Homecoming</button></div><p className="rc-save" data-child-progress="" role="status">{statusLine}</p><button className="rc-home" onClick={exit}>Home</button></section>}
    {mode === 'explore' && <>
      <section className="rc-objective"><img src={objectiveResident?.sprite} alt={objectiveResident?.name || ''} /><div><h1>{stage.name}</h1><p>{nearbyMission ? `${objectiveResident.name} is here. Choose Help ${objectiveResident.name} to begin.` : stageRepaired ? 'Everyone here is ready. Try an extra adventure, or explore the next place.' : stage.problem}</p>{focusedMission && !nearbyMission && <button className="rc-primary" onClick={() => sceneReady ? world.current?.walkToMission(focusedMission.id) : begin(focusedMission.id)}>{sceneReady ? 'Walk to' : 'Help'} {CAST[focusedMission.residentId]?.name || 'your Pal'}</button>}{!focusedMission && <p>Every Pal here has been helped.</p>}{nextStage && isCampaignStageUnlocked(progress, nextStage.id, ROUND_CAMPAIGN) && <button onClick={() => visitPlace(nextStage)}>Explore {nextStage.name}</button>}{totalMain === 150 && <p className="rc-finished">All three worlds are ready. You can visit your Pals or play again.</p>}</div>{(!stageRepaired || focusedMission) && <button aria-label="Hear the current Pal's problem" onClick={hearProblem}>Listen</button>}</section>
      {sceneReady && snapshot.markers?.filter(marker => marker.visible && available.some(item => item.id === marker.missionId)).map(marker => { const item = getCampaignMission(marker.missionId), resident = CAST[item.residentId]; return <button key={marker.missionId} className="rc-world-marker" style={{ left: marker.x, top: marker.y }} aria-label={`Walk to ${resident.name}: ${item.title}`} onClick={() => world.current?.walkToMission(marker.missionId)}><img src={resident.sprite} alt="" /></button>; })}
      <footer className="rc-explore-footer"><p>{sceneError || (sceneReady ? nearbyMission ? `You found ${objectiveResident.name}. Help starts the adventure.` : snapshot.worldInteraction?.prompt || (snapshot.carrying ? `Carrying ${snapshot.carrying.title}. Bring it to the entrance.` : 'Tap the path to walk, or choose Walk to a Pal. Then choose Help.') : 'Opening the landscape…')}<small>{statusLine}</small></p><div className="rc-movement" aria-label="Move Bouncy">{MOVE_BUTTONS.map(([x,z,label]) => <button key={label} data-direction={label.toLowerCase()} aria-label={`Move ${label.toLowerCase()}`} onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); motorPointers.current.set(event.pointerId, [x, z]); moveMotor(true); }} onPointerUp={releaseMotorPointer} onPointerCancel={releaseMotorPointer} onLostPointerCapture={releaseMotorPointer} onClick={event => { if (event.detail === 0) world.current?.move(x, z, { tapStep: true, tapOnly: true }); }}>{({Up:'↑',Left:'←',Down:'↓',Right:'→'})[label]}</button>)}</div>{nearbyMission ? <button className="rc-primary" onClick={() => begin(nearbyMission.id)}>Help {objectiveResident.name}</button> : snapshot.worldInteraction && <button className="rc-primary" onClick={() => world.current?.interact()}>{({pickup:'Pick it up',place:'Put it here',operate:'Use it'})[snapshot.worldInteraction.action]}</button>}</footer>
    </>}
    {mode === 'activity' && beat && <section className="rc-activity" aria-label={mission.title}><CampaignActivity beat={publicBeat(displayHold?.beat || beat)} state={displayHold?.state || checkpoint.beatState} teachingTarget={teachingTarget} residentId={mission.residentId} onAction={dispatch} onReplay={replay} onOptionAudio={playSources} onPictureShown={() => dispatch({ type: 'PICTURE_CUE_SHOWN' })} pictureCue={(displayHold?.state || checkpoint.beatState).modelShown ? soundPictureCue(displayHold?.beat || beat) : null} supportText={supportText} feedback={feedback} speaking={speaking} reducedMotion={settings.reduced} paused={paused} /><p className="rc-audio-error" role="status">{audioError}</p>{!saveState.ok && <div role="alert"><p>{statusLine}</p><button onClick={() => save(progressRef.current)}>Try saving again</button></div>}</section>}
    {sceneError && mode !== 'activity' && <button className="rc-retry-scene" onClick={() => setSceneRevision(value => value + 1)}>Try landscape again</button>}
    {modal === 'pause' && <Modal title="Paused" onClose={() => setModal(null)}><button className="rc-primary" onClick={() => setModal(null)}>Keep playing</button><button onClick={() => setModal('places')}>Choose a place or play again</button><button aria-pressed={!settings.muted} onClick={() => updateSettings({ muted: !settings.muted })}>Voice and sounds: {settings.muted ? 'off' : 'on'}</button><button aria-pressed={settings.reduced} onClick={() => updateSettings({ reduced: !settings.reduced })}>Gentle movement: {settings.reduced ? 'on' : 'off'}</button><button aria-pressed={settings.low} onClick={() => updateSettings({ low: !settings.low })}>Simple landscape: {settings.low ? 'on' : 'off'}</button><p>{statusLine}</p><button onClick={exit}>Leave for Home</button></Modal>}
    {modal === 'places' && <Modal title="Places" onClose={() => setModal(null)}>
      <section aria-label="Here now"><h3>Here now · {stage.name}</h3><p>Choose a Pal to help. Extra adventures are yours to choose.</p>{available.length ? missionChoices(available) : <p>Everyone here has been helped.</p>}</section>
      {replayMissions.length > 0 && <details className="rc-journey"><summary>Play here again</summary>{missionChoices(replayMissions, true)}</details>}
      {nextStage && isCampaignStageUnlocked(progress, nextStage.id, ROUND_CAMPAIGN) && <button className="rc-primary" onClick={() => visitPlace(nextStage)}>Explore {nextStage.name}</button>}
      <details className="rc-journey"><summary>Your journey · {CAMPAIGN_STAGES.length} places</summary><p>Completed places stay open for another visit.</p>{CAMPAIGN_WORLDS.map(place => <section key={place.id}><h3>{place.name}</h3><ul className="rc-journey-list">{CAMPAIGN_STAGES.filter(item => item.worldId === place.id).map(item => { const unlocked = progress && isCampaignStageUnlocked(progress, item.id, ROUND_CAMPAIGN); const done = item.missionIds.filter(id => progress?.campaign?.completedMissions[id]).length; return <li key={item.id}>{unlocked ? <button disabled={blocked} onClick={() => visitPlace(item)}>{item.name}{item.id === stage.id ? ' · Here' : ''}<small>{done === item.missionIds.length ? 'Complete · Visit again' : `${done} of ${item.missionIds.length} main adventures done`}</small></button> : <span>{item.name}<small>Later in your journey</small></span>}</li>; })}</ul></section>)}</details>
    </Modal>}
  </main>;
}
