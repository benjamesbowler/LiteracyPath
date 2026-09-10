import { useActivityMusic } from "../../../utils/audio/useActivityMusic.js";
import { soundSeekersCampaignCssVariables } from '../visual/visualTokens.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CAST } from './content/cast.js';
import { CAMPAIGN_VERSION, CAMPAIGN_WORLDS, CAMPAIGN_STAGES, CAMPAIGN_MISSIONS, getCampaignStage, getCampaignMission } from './content/campaign.js';
import { CAMPAIGN_STAGE_NARRATION,CAMPAIGN_FAMILY_NARRATION,CAMPAIGN_MISSION_NARRATION } from './content/campaignNarration.js';
import { getCampaignHubLayout } from './content/campaignLayouts.js';
import { CAMPAIGN_HELP_LINES } from './content/campaignLanguage.js';
import { buildCampaignMission, createCampaignBeatState, resolveCampaignAction } from './engine/campaignChallenges.js';
import { publicBeat, MECHANICS } from './engine/challenges.js';
import { recordTaught } from './engine/progress.js';
import { beginCampaignMission, restartCampaignMission, updateCampaignCheckpoint, recordCampaignEvidence, completeCampaignMission, isCampaignStageUnlocked, isCampaignMissionUnlocked } from './engine/campaignProgress.js';
import { loadCampaignProgress, saveCampaignProgress, subscribeCampaignProgress, disposeCampaignStorage } from './campaignStorage.js';
import { createCampaignPlayClock,advanceCampaignPlayClock,campaignPlayTimeSnapshot,mergeCampaignPlayTime } from './engine/campaignPlayTime.js';
import { createCampaignAudio } from './engine/campaignAudio.js';
import { createCampaignSoundscape } from './engine/campaignSoundscape.js';
import { normalizeAudioPreferences } from '../../../utils/audio/audioPreferences.js';
import { createCampaignWorldScene } from './render/campaignWorldScene.js';
import { HERO_ANIMATIONS,drawCampaignHero } from './render/campaignHeroes.js';
import { preload,retryFailedImages } from './render/sprites.js';
import './sound-seekers-campaign.css';

const CATALOG = { version: CAMPAIGN_VERSION, stages: CAMPAIGN_STAGES, missions: CAMPAIGN_MISSIONS };
const HEROES = ['speedy','bouncy','woolly','splashy','clucky','muddy','chompy','pip'];
const attemptId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const cues = (beat,state) => beat?.mechanic===MECHANICS.SOUND_SORT && beat.view.mode!=='read' ? [beat.view.items[state?.itemIndex||0]?.audio].filter(Boolean) : beat?.prompt?.cues?.map(c => c.src).filter(Boolean) || [];

export default function SoundSeekersCampaign({ progressScopeKey, isSoundEnabled = true, onExit, accessibilitySettings = {}, initialStopId = null }) {
  const [initial] = useState(() => loadCampaignProgress(progressScopeKey));
  const [progress, setProgress] = useState(initial.progress);
  const progressRef = useRef(progress);
  const lastSaveResultRef=useRef(initial);
  const playClockRef=useRef(null),helpRef=useRef(false),blockedRef=useRef(false);
  const [saveStatus, setSaveStatus] = useState(initial);
  const [stageId, setStageId] = useState(() => {
    const p = initial.progress;
    return getCampaignMission(p?.campaign?.activeMissionId)?.stageId || (isCampaignStageUnlocked(p,p?.campaign?.currentStageId,CATALOG)?p.campaign.currentStageId:null) || CAMPAIGN_STAGES.find(s => s.legacyStopIds.includes(initialStopId) && isCampaignStageUnlocked(p,s.id,CATALOG))?.id || p?.campaign?.visitedStageIds?.at(-1) || 'meadow-01';
  });
  const [missionId, setMissionId] = useState(() => initial.progress?.campaign?.activeMissionId || null);
  const [dialog, setDialog] = useState(() => initial.progress?.heroChosen ? null : 'hero');
  const [encounter, setEncounter] = useState(null);
  const [encounterError,setEncounterError]=useState('');
  const [line, setLine] = useState('');
  const [sound, setSound] = useState(()=>isSoundEnabled&&normalizeAudioPreferences(initial.progress?.audioPreferences).soundEnabled);
  const [music, setMusic] = useActivityMusic(progressScopeKey);
  const soundscapeRef=useRef(null);
  const [sceneEpoch,setSceneEpoch]=useState(0);
  const [audioFailed, setAudioFailed] = useState(false);
  const [failedImages,setFailedImages]=useState([]);
  const [loadingImages,setLoadingImages]=useState(false);
  const [hud, setHud] = useState({ objects: [], beat: null, beatState: null });
  const canvasRef = useRef(null), sceneRef = useRef(null), controllerRef = useRef(null), audioRef = useRef(null), actionsRef = useRef({}), soundRef = useRef(sound), pausedRef = useRef(false);
  const stage = getCampaignStage(stageId) || CAMPAIGN_STAGES[0];
  const mission = getCampaignMission(missionId);
  const stageComplete=Boolean(progress?.campaign?.completedMissions[stage.finaleMissionId]);
  const nextStage=CAMPAIGN_STAGES[CAMPAIGN_STAGES.findIndex(s=>s.id===stage.id)+1];
  const campaignComplete=CAMPAIGN_WORLDS.every(world=>progress?.campaign?.completedMissions[getCampaignStage(world.stageIds.at(-1)).finaleMissionId]);
  const hardBlocked=Boolean(failedImages.length || !progress || !saveStatus.ok && ['reset','unreadable','unsupported','conflict'].includes(saveStatus.status));
  const paused = Boolean(dialog || encounter || hardBlocked || loadingImages);
  useEffect(() => { pausedRef.current = paused;blockedRef.current=hardBlocked; soundRef.current = sound; if (paused) sceneRef.current?.release(); }, [paused,sound,hardBlocked]);
  useEffect(() => {
    if(paused)document.querySelector('.ss-campaign-panel button')?.focus();
    else canvasRef.current?.focus({preventScroll:true});
  },[paused,dialog,encounter]);
  useEffect(()=>{helpRef.current=dialog==='actions'||(!dialog&&!encounter&&(Boolean(hud.beatState?.modelShown)||audioFailed));},[dialog,encounter,hud.beatState,audioFailed]);
  const readPlayTime=useCallback(c=>playClockRef.current?.attemptId===c?.attemptId?campaignPlayTimeSnapshot(playClockRef.current.clock):undefined,[]);
  const reducedMotion = Boolean(accessibilitySettings.reducedEffects || accessibilitySettings.reducedMotion);

  const adoptProgress = useCallback(next => {
    progressRef.current=next;setProgress(next);sceneRef.current?.setProgress(next);
    const c=controllerRef.current;
    if(!c){setHud(previous=>({...previous,objects:sceneRef.current?.getObjects()||[]}));return next;}
    const cp=next.campaign.checkpoints[c.missionId];
    if(!cp)return next;
    if(playClockRef.current?.attemptId===cp.attemptId)playClockRef.current.clock={...playClockRef.current.clock,...mergeCampaignPlayTime(playClockRef.current.clock,cp.playTime)};
    if(cp.completed){audioRef.current?.stop();controllerRef.current=null;setMissionId(null);return next;}
    if(cp.attemptId!==c.attemptId){controllerRef.current=null;audioRef.current?.stop();sceneRef.current?.release();setSceneEpoch(e=>e+1);return next;}
    if(cp.beatIndex!==c.index||JSON.stringify(cp.beatState)!==JSON.stringify(c.state)){
      audioRef.current?.stop();c.index=cp.beatIndex;c.state=cp.beatState;c.advancing=false;
      sceneRef.current?.setState(c.state,c.index);
      setHud({objects:sceneRef.current?.getObjects()||[],beat:c.beats[c.index]?publicBeat(c.beats[c.index]):null,beatState:c.state});
    }
    return next;
  },[]);
  const persist = useCallback((next,options) => {
    const result = saveCampaignProgress(progressScopeKey, next,options);
    lastSaveResultRef.current=result;const adopted=adoptProgress(result.progress || next);setSaveStatus(result);
    return adopted;
  }, [progressScopeKey,adoptProgress]);
  const refreshHud = useCallback(() => {
    const c = controllerRef.current;
    setHud({ objects: sceneRef.current?.getObjects() || [], beat: c?.beats[c.index] ? publicBeat(c.beats[c.index]) : null, beatState: c?.state || null });
  }, []);
  const hear = useCallback(async (sources, meta = {}) => {
    if (!soundRef.current) return false;
    const owner=controllerRef.current, ownerBeat=owner?.beats[owner.index]?.id;
    const played = await audioRef.current?.play(sources);
    if(played&&owner&&owner===controllerRef.current&&owner.beats[owner.index]?.id===ownerBeat){
      owner.state={...owner.state,heardSources:[...new Set([...(owner.state.heardSources||[]),...sources.filter(Boolean)])]};
      persist(updateCampaignCheckpoint(progressRef.current,owner.missionId,{attemptId:owner.attemptId,playTime:readPlayTime(owner),beatState:owner.state},Date.now()));
      if(controllerRef.current!==owner||owner.beats[owner.index]?.id!==ownerBeat)return false;
      sceneRef.current?.setState(owner.state,owner.index);refreshHud();
      if(meta.kind==='teach')actionsRef.current.teach?.(meta.targetId);
    }
    if (played) setAudioFailed(false);
    return Boolean(played);
  }, [persist,refreshHud,readPlayTime]);

  useEffect(() => {
    soundscapeRef.current=createCampaignSoundscape({preferences:{...progressRef.current?.audioPreferences,musicEnabled:false}});
    audioRef.current = createCampaignAudio({ onFailure: () => setAudioFailed(true),onSpeakingChange:speaking=>soundscapeRef.current?.configure({speaking}) });
    const unsubscribe = subscribeCampaignProgress(progressScopeKey, result => {
      setSaveStatus(result);
      if (result.progress) adoptProgress(result.progress);
    });
    return () => { unsubscribe(); audioRef.current?.dispose(); soundscapeRef.current?.dispose(); void disposeCampaignStorage(progressScopeKey); };
  }, [progressScopeKey,adoptProgress]);

  useEffect(()=>{soundscapeRef.current?.configure({worldId:stage.worldId,enabled:sound,musicEnabled:music,paused,quiet:Boolean(accessibilitySettings.lowerAudioIntensity||progress?.audioPreferences?.quietSoundscape)});},[progressScopeKey,stage.worldId,sound,music,paused,accessibilitySettings.lowerAudioIntensity,progress?.audioPreferences?.quietSoundscape]);

  useEffect(()=>{if(dialog||hardBlocked)audioRef.current?.stop();},[dialog,hardBlocked]);

  useEffect(()=>{
    const c=controllerRef.current;
    if(dialog==='pause'&&c)persist(updateCampaignCheckpoint(progressRef.current,c.missionId,{attemptId:c.attemptId,playTime:readPlayTime(c),position:sceneRef.current?.snapshot()},Date.now()),{forceSync:true});
  },[dialog,persist,readPlayTime]);

  useEffect(() => { actionsRef.current = {
    teach(targetId) {
      const c = controllerRef.current;
      if (!c || c.beats[c.index]?.mechanic !== MECHANICS.SIGNPOST) return;
      const teachingBeatId=c.beats[c.index].id;
      actionsRef.current.action({type:'HEARD_CARD',targetId});
      const current = controllerRef.current;
      if (current?.beats[current.index]?.id===teachingBeatId && current.beats[current.index].mechanic===MECHANICS.SIGNPOST && current.beats[current.index].view.cards.every(card => current.state.cardsHeard.includes(card.targetId))) actionsRef.current.action({type:'FINISH'});
    },
    action(action) {
      const c = controllerRef.current;
      if (!c || pausedRef.current) return;
      const beat = c.beats[c.index];
      const { state: resolvedState, outcome } = resolveCampaignAction(beat, c.state, action);
      if (outcome.type === 'ignored') return;
      const nextState = {...resolvedState,...(outcome.revealId?{revealedId:outcome.revealId}:{}),sceneRepairs:{...c.state.sceneRepairs,...(resolvedState.done?{[c.index]:action}:{})}};
      let p = progressRef.current;
      if (outcome.evidence) p = recordCampaignEvidence(p, c.missionId, { ...outcome.evidence, id: `${beat.id}:${c.state.itemIndex ?? c.state.placed?.length ?? 0}`, attemptId:c.attemptId, audioSupport:cues(beat,c.state).some(src=>!c.state.heardSources?.includes(src)) || (beat.view.direction==='letter-to-sound'&&!c.state.heardSources?.includes(beat.view.options.find(o=>o.id===action.optionId)?.audio)) }, CATALOG, Date.now());
      if (outcome.taught?.length) p = recordTaught(p, outcome.taught);
      c.state = nextState;
      p = updateCampaignCheckpoint(p,c.missionId,{attemptId:c.attemptId,playTime:readPlayTime(c),beatIndex:c.index,beatState:nextState,position:sceneRef.current?.snapshot()},Date.now());
      persist(p);
      const live=controllerRef.current;
      if(!live||live.attemptId!==c.attemptId||live.beats[live.index]?.id!==beat.id)return;
      sceneRef.current?.setState(live.state,live.index);sceneRef.current?.applyOutcome(outcome);refreshHud();
      if(['progress','complete'].includes(outcome.type))soundscapeRef.current?.effect(nextState.done?'correct':'place');
      if (outcome.line) setLine(outcome.line);
      else if (nextState.done) setLine('Ready! Follow the path.');
      if (outcome.type === 'incorrect' || beat.mechanic===MECHANICS.SOUND_SORT&&!nextState.done) void hear(cues(beat,c.state));
    },
    advance() {
      const c = controllerRef.current;
      if (!c || !c.state.done || pausedRef.current || c.advancing) return;
      c.advancing = true;
      audioRef.current?.stop(); c.index++;
      const next = c.beats[c.index]; c.state = next ? {...createCampaignBeatState(next),sceneRepairs:c.state.sceneRepairs} : c.state;
      let p = updateCampaignCheckpoint(progressRef.current,c.missionId,{attemptId:c.attemptId,playTime:readPlayTime(c),beatIndex:c.index,beatState:c.state,position:sceneRef.current?.snapshot()},Date.now());
      if (!next) {
        p = completeCampaignMission(p,c.missionId,CATALOG,Date.now());
        const resolved = getCampaignMission(c.missionId);
        persist(p,{forceSync:true});soundscapeRef.current?.effect('complete'); setMissionId(null); setAudioFailed(false); setLine(resolved.outcome.description); controllerRef.current = null;
      } else {
        persist(p);if(controllerRef.current!==c)return;sceneRef.current?.setState(c.state,c.index);c.advancing=false;refreshHud();setLine('');
        if (c.beats[c.index]?.mechanic !== MECHANICS.SIGNPOST) void hear(cues(c.beats[c.index],c.state));
      }
    },
    travel(id){audioRef.current?.stop();const p=progressRef.current;persist({...p,campaign:{...p.campaign,currentStageId:id,visitedStageIds:[...p.campaign.visitedStageIds.filter(stage=>stage!==id),id]},updatedAt:Date.now()});setAudioFailed(false);setLine('');setStageId(id);},
    meet(m) {setEncounterError('');setEncounter(m);sceneRef.current?.release();if(soundRef.current)void audioRef.current?.play([CAMPAIGN_STAGE_NARRATION[m.stageId]?.audio,(CAMPAIGN_MISSION_NARRATION[m.id]||CAMPAIGN_FAMILY_NARRATION[m.familyId])?.audio].filter(Boolean));},
    position(position) {
      const c = controllerRef.current;
      if (!c || pausedRef.current) return;
      persist(updateCampaignCheckpoint(progressRef.current,c.missionId,{attemptId:c.attemptId,playTime:readPlayTime(c),position},Date.now()),{positionOnly:true});
    }
  }; }, [hear,persist,refreshHud,readPlayTime]);

  useEffect(() => {
    if (!progressRef.current || !canvasRef.current) return undefined;
    const p = progressRef.current;
    const selected = getCampaignMission(missionId);
    let c = null;
    if (selected) {
      const cp = p.campaign.checkpoints[selected.id];
      if (!cp || cp.completed) { setMissionId(null); return undefined; }
      c = {missionId:selected.id,beats:cp.challenges,index:cp.beatIndex,state:cp.beatState,attemptId:cp.attemptId};
    }
    controllerRef.current = c;
    const currentStage = getCampaignStage(stageId) || CAMPAIGN_STAGES[0];
    const scene = createCampaignWorldScene({stage:currentStage,missions:[...currentStage.missionIds,...currentStage.optionalMissionIds].map(getCampaignMission),mission:selected,
      beats:c?.beats.map(publicBeat),beatIndex:c?.index,beatState:c?.state,heroId:p.hero,progress:p,
      position:selected ? p.campaign.checkpoints[selected.id]?.position : null,reducedMotion,simplifiedBackgrounds:Boolean(accessibilitySettings.simplifiedBackgrounds),
      isAvailable:id=>isCampaignMissionUnlocked(progressRef.current,id,CATALOG),
      nextStage:CAMPAIGN_STAGES[CAMPAIGN_STAGES.findIndex(s=>s.id===currentStage.id)+1],onTravel:id=>actionsRef.current.travel(id),
      onSound:kind=>soundscapeRef.current?.effect(kind),onMission:m=>actionsRef.current.meet(m),onAction:a=>actionsRef.current.action(a),onAdvance:()=>actionsRef.current.advance(),onHear:hear,onSavePosition:position=>actionsRef.current.position(position)});
    sceneRef.current = scene; refreshHud(); let sceneReady=false;setLoadingImages(true);
    const assetPaths=[...new Set(scene.assets().filter(Boolean))];
    void preload(assetPaths).then(images=>{if(sceneRef.current!==scene)return;const failed=assetPaths.filter((_,index)=>!images[index]);setFailedImages(failed);sceneReady=!failed.length;setLoadingImages(false);if(sceneReady&&c&&c.beats[c.index].mechanic!==MECHANICS.SIGNPOST)void hear(cues(c.beats[c.index],c.state));});
    playClockRef.current=c?{attemptId:c.attemptId,clock:createCampaignPlayClock(p.campaign.checkpoints[selected.id].playTime,performance.now())}:null;
    const canvas = canvasRef.current, context = canvas.getContext('2d');
    let frame, last = performance.now(), live = true;
    function draw(now) {
      if (!live) return;
      const box = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1,2);
      if (canvas.width !== Math.round(box.width*dpr) || canvas.height !== Math.round(box.height*dpr)) {canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);}
      context.setTransform(dpr,0,0,dpr,0,0);
      if(playClockRef.current&&c?.attemptId===playClockRef.current.attemptId)playClockRef.current.clock=advanceCampaignPlayClock(playClockRef.current.clock,{nowMs:now,activity:scene.consumeActivity({includeMotion:!pausedRef.current&&!document.hidden&&sceneReady}),paused:pausedRef.current,hidden:document.hidden,loading:!sceneReady||blockedRef.current,helpOpen:helpRef.current});
      if (sceneReady && !pausedRef.current && !document.hidden) scene.update(Math.min((now-last)/1000,.05));
      last=now; scene.draw(context,box.width,box.height); frame=requestAnimationFrame(draw);
    }
    frame=requestAnimationFrame(draw);
    const release=()=>scene.release();
    const visibility=()=>{release();if(document.hidden)audioRef.current?.stop();};
    const key=event=>{
      if (event.code==='Escape' && event.type==='keydown') {setDialog(d=>d?null:'pause');release();return;}
      if (event.repeat && ['Enter','KeyE'].includes(event.code))return;
      if (!sceneReady || pausedRef.current || event.target.closest('button,input,select,textarea')) return;
      if (scene.key(event.code,event.type==='keydown')) event.preventDefault();
    };
    window.addEventListener('keydown',key);window.addEventListener('keyup',key);window.addEventListener('blur',release);document.addEventListener('visibilitychange',visibility);
    return ()=>{live=false;cancelAnimationFrame(frame);scene.dispose();audioRef.current?.stop();window.removeEventListener('keydown',key);window.removeEventListener('keyup',key);window.removeEventListener('blur',release);document.removeEventListener('visibilitychange',visibility);if(sceneRef.current===scene)sceneRef.current=null;};
  }, [stageId,missionId,progress?.hero,reducedMotion,accessibilitySettings.simplifiedBackgrounds,hear,refreshHud,sceneEpoch]);

  function begin(m) {
    try {
      let p=progressRef.current;
      const old=p.campaign.checkpoints[m.id];
      if (!old || old.completed) {
        const built=buildCampaignMission(m,p,{replayOrdinal:old?(old.replayOrdinal||0)+1:0});
        const visibleWords=new Set([stage.name,stage.problem,...built.beats.map(beat=>beat.act?.title||''),...[...stage.missionIds,...stage.optionalMissionIds].map(id=>getCampaignMission(id).title)].join(' ').toLowerCase().match(/[a-z]+/g)||[]);
        built.beats=built.beats.map(beat=>beat.key?.word&&visibleWords.has(beat.key.word.toLowerCase())?{...beat,supportContext:{...beat.supportContext,mode:'supported-practice',reason:'printed-story-context'}}:beat);
        const cp={attemptId:attemptId(),challenges:built.beats,beatState:createCampaignBeatState(built.beats[0])};
        p=(old?.completed?restartCampaignMission:beginCampaignMission)(p,m.id,cp,CATALOG,Date.now());
      } else p=beginCampaignMission(p,m.id,null,CATALOG,Date.now());
      persist(p);setEncounterError('');setEncounter(null);setMissionId(m.id);setAudioFailed(false);setLine('');

    } catch(error) {setEncounterError('This path could not open. Try this friend again.');console.error('[Sound Seekers] Mission could not open',error);}
  }
  const chooseHero = useCallback(id => {persist({...progressRef.current,hero:id,heroChosen:true,updatedAt:Date.now()});setDialog(null);}, [persist]);
  const leaveMission=useCallback(() => {setAudioFailed(false);setLine('');audioRef.current?.stop();sceneRef.current?.release();if(missionId){const c=controllerRef.current;const p=c?updateCampaignCheckpoint(progressRef.current,c.missionId,{attemptId:c.attemptId,playTime:readPlayTime(c),position:sceneRef.current?.snapshot()},Date.now()):progressRef.current;persist({...p,campaign:{...p.campaign,activeMissionId:null},updatedAt:Date.now()},{forceSync:true});}setMissionId(null);setDialog(null);},[missionId,persist,readPlayTime]);
  function hearInstruction(){
    const c=controllerRef.current,beat=c?.beats[c.index];
    if(beat?.mechanic===MECHANICS.SIGNPOST){const card=beat.view.cards[0];void hear([card.phonemeAudio,...(card.unitAudio||[]).map(u=>u.audio),card.anchorAudio].filter(Boolean),{kind:'teach',targetId:card.targetId});}
    else void hear(cues(beat,c?.state));
  }
  function leaveGame(){const c=controllerRef.current;persist(c?updateCampaignCheckpoint(progressRef.current,c.missionId,{attemptId:c.attemptId,playTime:readPlayTime(c),position:sceneRef.current?.snapshot()},Date.now()):progressRef.current,{forceSync:true});if(lastSaveResultRef.current.ok || lastSaveResultRef.current.status==='sync-failed')onExit();}
  function toggleSound() {const enabled=!sound;setSound(enabled);soundRef.current=enabled;setAudioFailed(false);if(!enabled)audioRef.current?.stop();persist({...progressRef.current,audioPreferences:{...progressRef.current.audioPreferences,...normalizeAudioPreferences(progressRef.current.audioPreferences),soundEnabled:enabled},updatedAt:Date.now()});}
  function toggleMusic(){setMusic(!music);}
  const move = (name,value) => sceneRef.current?.setInput(name,value);
  if(!progress)return <div style={soundSeekersCampaignCssVariables()} className="ss-campaign ss-error" role="alert"><p>{saveStatus.error?.message}</p><button onClick={onExit}>Back</button></div>;
  return <main style={soundSeekersCampaignCssVariables()} className="ss-campaign" data-sound-seekers-game aria-label="Sound Seekers adventure" tabIndex={-1}>
    <canvas style={failedImages.length?{visibility:'hidden'}:undefined} inert={paused || undefined} ref={canvasRef} aria-label={`${stage.name}. Move with arrow keys, jump with Space, meet or choose with E.`} tabIndex={0} onPointerDown={event=>{if(paused)return;const r=event.currentTarget.getBoundingClientRect();sceneRef.current?.pointerDown(event.clientX-r.left,event.clientY-r.top);event.currentTarget.focus();}} />
    <header inert={paused || undefined} className="ss-campaign-top"><button onClick={()=>setDialog('map')} aria-label="World map">Map</button><div><strong>{mission?'Sound Seekers':stage.name}</strong><small>{mission&&hud.beat?.act?`${hud.beat.act.title} · ${hud.beat.act.index+1}/${hud.beat.act.total}`:CAMPAIGN_WORLDS.find(w=>w.id===stage.worldId)?.name}</small></div><button onClick={()=>setDialog('pause')} aria-label="Pause adventure">Ⅱ</button></header>
    {!paused&&!mission&&stageComplete&&<aside className="ss-stage-complete" aria-label="Land restored"><strong>{campaignComplete?'Three lands, so many friends!':`${stage.name} is ready!`}</strong><span>{campaignComplete?'You helped the Pals. Explore your favourite places again.':'There are still friends to meet here. Your next path is open too.'}</span>{nextStage&&<button onClick={()=>{actionsRef.current.travel(nextStage.id);}}>Explore {nextStage.name} →</button>}{campaignComplete&&<button onClick={()=>setDialog('map')}>Visit our friends</button>}</aside>}
    {!paused&&<><div className="ss-campaign-prompt"><span>{hud.beat?.view.direction==='letter-to-sound'?hud.beat.view.target.grapheme:hud.beat?.prompt.text||'Explore. Meet a friend.'}</span>{mission&&<button onClick={hearInstruction} aria-label="Hear instruction">Hear</button>}</div>
    <div className="ss-campaign-line" role="status" aria-live="polite">{line}</div>
    <nav className="ss-campaign-controls" aria-label="Movement"><div><MovementButton name="left" label="Move left" onMove={move}>←</MovementButton><MovementButton name="right" label="Move right" onMove={move}>→</MovementButton></div><div><button onClick={()=>{sceneRef.current?.key('KeyE',true);canvasRef.current?.focus();}} aria-label="Interact with nearby object">{hud.beat?.view.direction==='letter-to-sound'?'Choose':'Help'}</button><MovementButton name="jump" label="Jump" onMove={move}>↑</MovementButton></div></nav>
    <div className="ss-campaign-access"><button onClick={()=>setDialog('actions')}>Choose nearby</button>{mission&&<button onClick={()=>actionsRef.current.action({type:'REQUEST_MODEL'})}>Show me</button>}{mission&&!sound&&<button onClick={()=>actionsRef.current.action({type:'REQUEST_TEXT_SUPPORT'})}>Text help</button>}{hud.beatState?.placed?.length>0&&!hud.beatState.done&&<button onClick={()=>actionsRef.current.action({type:'REMOVE_LAST'})}>Undo last</button>}</div></>}
    {audioFailed&&mission&&!paused&&<div className="ss-audio-notice" role="status">Sound is unavailable. <button onClick={()=>{setSound(true);soundRef.current=true;hearInstruction();}}>Try sound</button><button onClick={()=>{setAudioFailed(false);actionsRef.current.action({type:'REQUEST_TEXT_SUPPORT'});}}>Use text help</button></div>}
    {!saveStatus.ok&&saveStatus.status!=='sync-failed'&&<div className="ss-save-notice" role="alert">{saveStatus.error?.message}</div>}
    {loadingImages&&!failedImages.length&&!dialog&&!encounter&&<div className="ss-campaign-prompt" role="status">Opening the path…</div>}
    {failedImages.length>0&&<div className="ss-campaign-shade"><section className="ss-campaign-panel" role="alert"><h1>Let’s load the pictures</h1><p>Some pictures did not arrive. Your adventure is still here.</p><button onClick={()=>{retryFailedImages(failedImages);setLoadingImages(true);setFailedImages([]);setSceneEpoch(epoch=>epoch+1);}}>Try again</button><button onClick={leaveGame}>Save and leave</button></section></div>}
    {!failedImages.length&&(dialog||encounter)&&<div className="ss-campaign-shade"><section className="ss-campaign-panel" role="dialog" aria-modal="true" aria-label={encounter?'Help a friend':dialog==='hero'?'Choose your Pal':dialog==='map'?'World map':'Adventure menu'}>
      {dialog==='hero'?<><h1>Who will you be?</h1><p>Choose your Pal. Everyone can explore all three lands.</p><div className="ss-hero-grid">{HEROES.map(id=><button key={id} aria-label={CAST[id].name} onClick={()=>chooseHero(id)}><HeroPortrait id={id}/><strong>{CAST[id].name}</strong></button>)}</div></>:
      encounter?<><img className="ss-resident" src={CAST[encounter.residentId===progress.hero?encounter.residentAlternateId:encounter.residentId]?.sprite} alt=""/><h1>{encounter.title}</h1><p>{getCampaignStage(encounter.stageId).problem}</p><p>{CAMPAIGN_FAMILY_NARRATION[encounter.familyId]?.text}</p>{encounterError&&<p role="alert">{encounterError}</p>}<button onClick={()=>{if(soundRef.current)void audioRef.current?.play([CAMPAIGN_STAGE_NARRATION[encounter.stageId]?.audio,(CAMPAIGN_MISSION_NARRATION[encounter.id]||CAMPAIGN_FAMILY_NARRATION[encounter.familyId])?.audio].filter(Boolean));}}>Hear your friend</button><button onClick={()=>begin(encounter)}>{progress.campaign.completedMissions[encounter.id]?'Play again':progress.campaign.checkpoints[encounter.id]?'Continue helping':'Let’s help'}</button><button onClick={()=>setEncounter(null)}>Keep exploring</button></>:
      dialog==='map'?<><button className="ss-panel-close" aria-label="Close world map" onClick={()=>setDialog(null)}>×</button><h1>Our Pals lands</h1><div className="ss-worlds">{CAMPAIGN_WORLDS.map(world=><section key={world.id} className="ss-world-card"><img src={getCampaignHubLayout(world.stageIds[0]).backdrop} alt=""/><h2>{world.name}</h2>{world.stageIds.map(id=>{const s=getCampaignStage(id),unlocked=isCampaignStageUnlocked(progress,id,CATALOG);return <button key={id} aria-current={id===stage.id?'location':undefined} disabled={!unlocked} onClick={()=>{leaveMission();actionsRef.current.travel(id);}}>{progress.campaign.completedMissions[s.finaleMissionId]?'✓ ':''}{s.name}{!unlocked?' · Later':''}</button>;})}</section>)}</div><button onClick={()=>setDialog(null)}>Back to the path</button></>:
      dialog==='actions'?<><h1>Along the path</h1><p>Pick a place to walk to.</p>{hud.objects.map((o,i)=><div className="ss-action-option" key={o.id}><button onClick={()=>{pausedRef.current=false;setDialog(null);sceneRef.current?.activate(o.id);}}>{hud.beatState?.revealedId===o.id?'→ ':''}{o.label||`Sound ${i+1}`}{hud.beatState?.revealedId===o.id?' · Try this':''}</button>{o.audio&&<button aria-label={`Hear ${o.label||`sound ${i+1}`}`} onClick={()=>void hear([o.audio],{kind:'option'})}>Hear</button>}</div>)}{hud.beat?.view.direction==='letter-to-sound'&&<button onClick={()=>{pausedRef.current=false;setDialog(null);sceneRef.current?.confirm();}}>Choose this sound</button>}<button onClick={()=>setDialog(null)}>Back</button></>:
      <><h1>Take a breather</h1><button onClick={()=>setDialog(null)}>Keep playing</button><button onClick={toggleSound}>Sound {sound?'on':'off'}</button><button onClick={toggleMusic}>Music {music?'on':'off'}</button><button onClick={()=>setDialog('hero')}>Change Pal</button>{mission&&<button onClick={leaveMission}>Back to this land</button>}<button onClick={()=>void hear([CAMPAIGN_HELP_LINES.welcome.audio])}>Hear how to play</button><button onClick={leaveGame}>Save and leave</button><p>{!saveStatus.ok&&saveStatus.status!=='sync-failed'?'Your latest progress could not be saved. Keep this adventure open.':saveStatus.status==='queued'?'Saved on this device. Sync queued.':'Saved on this device.'}</p></>}
    </section></div>}
  </main>;
}

function MovementButton({name,label,onMove,children}) {
  return <button aria-label={label} onPointerDown={event=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);onMove(name,true);}} onPointerUp={()=>onMove(name,false)} onPointerCancel={()=>onMove(name,false)} onLostPointerCapture={()=>onMove(name,false)}>{children}</button>;
}

function HeroPortrait({id}) {
  const ref=useRef(null);
  useEffect(()=>{let active=true;const asset=HERO_ANIMATIONS[id];if(!asset)return;void preload([asset.src]).then(()=>{if(!active||!ref.current)return;const ctx=ref.current.getContext('2d');ctx.clearRect(0,0,240,240);drawCampaignHero(ctx,id,{x:120,y:222,height:190});});return()=>{active=false;};},[id]);
  return HERO_ANIMATIONS[id]?<canvas className="ss-hero-portrait" ref={ref} width={240} height={240} aria-hidden="true"/>:<img src={CAST[id].sprite} alt=""/>;
}
