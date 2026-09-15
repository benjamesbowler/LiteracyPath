import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { createWorld } from './world.js';
import { MISSIONS, wrongFeedback } from './content.js';
import { createAudio } from './audio.js';
import { LANDMARKS, SAVE_KEY, freshProgress, parseProgress, settleProgress, roundFor, judge } from './rules.js';

function readSavedProgress() {
  try { return parseProgress(localStorage.getItem(SAVE_KEY)); }
  catch { return null; }
}

function Icon({name,size=24}) {
  const shapes={
    sound:<><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8q6 4 0 8M18 4q10 8 0 16"/></>,
    quiet:<><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/></>,
    pause:<><path d="M8 5v14M16 5v14"/></>,
    play:<path d="m8 4 12 8-12 8Z"/>,
    arrow:<path d="M4 12h15m-6-6 6 6-6 6"/>,
    back:<path d="M20 12H5m6-6-6 6 6 6"/>,
    leaf:<><path d="M20 3C7 1 0 11 7 18 14 25 22 16 20 3Z"/><path d="M4 21 16 8"/></>,
    lantern:<><path d="M8 6V4a4 4 0 0 1 8 0v2M7 7h10l2 11-3 3H8l-3-3L7 7Z"/><path d="M9 7v12m6-12v12M7 18h10"/></>,
    basket:<><path d="M3 11h18l-3 10H6L3 11Zm3 0 6-9 6 9M8 14l1 4m7-4-1 4"/></>,
    bridge:<><path d="M2 18v-8m20 8v-8M2 13Q12 2 22 13M2 17Q12 8 22 17M7 9v6m5-8v6m5-4v6"/></>,
    flower:<><path d="M12 21v-9m0 6q-8 0-8-6 8 0 8 6Zm0-9C4 13 2 5 8 5c-2-6 10-6 8 0 6 0 4 8-4 4Z"/></>,
    check:<path d="m4 12 5 5L20 6"/>,
    map:<><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/></>,
    star:<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"/>,
    home:<><path d="m2 11 10-8 10 8M5 9v12h14V9M10 21v-7h4v7"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]||shapes.leaf}</svg>;
}
function Flower({lit=false}) {return <span className={`flower-art ${lit?'lit':''}`} aria-hidden="true"><i/><i/><i/><i/><i/><b/></span>;}
function Lantern({lit=false}) {return <span className={`lantern-art ${lit?'lit':''}`} aria-hidden="true"><i/><b/><em/></span>;}
export default function App() {
  const [saved, setSaved] = useState(readSavedProgress);
  const [p, setP] = useState(() => saved || freshProgress());
  const [phase, setPhase] = useState('title'), [ready, setReady] = useState(false), [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false), [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches), [low, setLow] = useState(false);
  const [near, setNear] = useState(false), [feedback, setFeedback] = useState(null), [busy, setBusy] = useState(false), [pictureError, setPictureError] = useState(false);
  const [imageRevision, setImageRevision] = useState(0), [loadedImages, setLoadedImages] = useState({}), [audioNotice, setAudioNotice] = useState(false);
  const [error, setError] = useState(null), [gentle, setGentle] = useState(false), [epoch, setEpoch] = useState(0), [mapOpen, setMapOpen] = useState(false);
  const host = useRef(), world = useRef(), player = useRef(p.position), marker = useRef(), minimapDot = useRef(), pausePanel = useRef(), activityRef = useRef();
  const audio = useRef(null), held = useRef(new Set()), touchHeld = useRef(new Set()), timers = useRef(new Set());
  // Event-owned mirrors let renderer callbacks and repeated input observe an
  // update immediately, without mutating refs while React is rendering.
  const pRef = useRef(p), phaseRef = useRef('title'), pausedRef = useRef(false), busyRef = useRef(false), mutedRef = useRef(false);
  const runToken = useRef(0), correctStarted = useRef(0);
  const mission = MISSIONS[p.mission], round = roundFor(MISSIONS, p), landmark = LANDMARKS[p.mission];
  const picturesReady = round && (p.mission === 0 ? round.choices.every(c => loadedImages[c.picture]) : loadedImages[round.picture]);
  const imageLoaded = source => setLoadedImages(old => ({ ...old, [source]: true }));
  const imagePath = source => `${source}?r=${imageRevision}`;

  function changePhase(next) { phaseRef.current = next; setPhase(next); }
  function changePaused(next) { pausedRef.current = next; setPaused(next); }
  function changeBusy(next) { busyRef.current = next; setBusy(next); }
  function persist(next) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...next, position: player.current })); }
    catch { /* Storage restrictions must not prevent local play. */ }
  }
  function saveChange(updater) {
    const next = typeof updater === 'function' ? updater(pRef.current) : updater;
    pRef.current = next;
    setP(next);
    persist(next);
    return next;
  }
  function delay(fn, ms) {
    const id = setTimeout(() => { timers.current.delete(id); fn(); }, ms);
    timers.current.add(id);
    return id;
  }
  function clearTimers() {
    runToken.current += 1;
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }
  function clearInput() {
    held.current.clear();
    touchHeld.current.clear();
    world.current?.move(0, 0);
  }
  function movement() {
    if (pausedRef.current || phaseRef.current !== 'explore') { world.current?.move(0, 0); return; }
    const keys = new Set([...held.current, ...touchHeld.current]);
    world.current?.move((keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0), (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0));
  }
  function speak(keys) {
    if (pausedRef.current || !audio.current) return Promise.resolve(false);
    setAudioNotice(false);
    return audio.current.sequence(Array.isArray(keys) ? keys : [keys]);
  }
  function currentCue() {
    const progress = pRef.current, currentRound = roundFor(MISSIONS, progress);
    if (phaseRef.current === 'activity' && currentRound) return progress.pending ? currentRound.correctAudio : currentRound.promptAudio;
    if (phaseRef.current === 'reward') return MISSIONS[progress.mission].completeAudio;
    if (phaseRef.current === 'complete') return 'finish';
    return progress.mission < 3 ? MISSIONS[progress.mission].introAudio : 'lanterns-complete';
  }
  async function replayCurrent() {
    const ticket = runToken.current;
    await audio.current?.unlock();
    if (ticket === runToken.current && !pausedRef.current) speak(currentCue());
  }
  function resetRoundUi() {
    setPictureError(false);
    setFeedback(null);
    changeBusy(false);
  }
  function nextRound() {
    if (!pRef.current.pending || phaseRef.current !== 'activity' || pausedRef.current) return;
    const next = saveChange(settleProgress(pRef.current));
    resetRoundUi();
    changePhase(next.mode);
    speak(next.mode === 'reward' ? MISSIONS[next.mission].completeAudio : roundFor(MISSIONS, next).promptAudio);
  }
  function completeAfterFeedback(currentRound) {
    const ticket = runToken.current;
    const stillCurrent = () => ticket === runToken.current && phaseRef.current === 'activity' && !pausedRef.current && pRef.current.pending;
    const playback = speak(currentRound.correctAudio);
    Promise.resolve(playback).then(heard => {
      if (!stillCurrent()) return;
      const elapsed = performance.now() - correctStarted.current;
      // Let the specific recorded feedback finish, then give it a short visual
      // beat. Muted or failed speech never becomes an advancement requirement.
      const remaining = Math.max(heard ? 500 : 0, 1700 - elapsed);
      delay(() => { if (stillCurrent()) nextRound(); }, remaining);
    });
  }
  async function pauseAdventure(next) {
    clearTimers();
    changePaused(next);
    if (next) { clearInput(); audio.current?.stop(); return; }
    const ticket = runToken.current;
    await audio.current?.unlock();
    if (ticket !== runToken.current || pausedRef.current || phaseRef.current !== 'activity') return;
    const currentRound = roundFor(MISSIONS, pRef.current);
    if (pRef.current.pending) completeAfterFeedback(currentRound);
    else speak(currentRound.promptAudio);
  }
  async function changeMuted(next) {
    mutedRef.current = next;
    setMuted(next);
    audio.current?.setMuted(next);
    if (phaseRef.current === 'title' || pausedRef.current) return;
    if (pRef.current.pending && phaseRef.current === 'activity') {
      clearTimers();
      const ticket = runToken.current;
      if (!next) await audio.current?.unlock();
      if (ticket === runToken.current && !pausedRef.current && phaseRef.current === 'activity' && pRef.current.pending) completeAfterFeedback(roundFor(MISSIONS, pRef.current));
    } else if (!next) await replayCurrent();
  }
  function retryWorld() {
    setReady(false);
    setError(null);
    setGentle(false);
    changePaused(false);
    setEpoch(value => value + 1);
  }
  function usePictureTrail() {
    setGentle(true);
    setReady(true);
    setError(null);
    pauseAdventure(false);
  }

  // Effect events keep the long-lived renderer/listeners current while changes
  // in controls and settings update their existing resources instead of rebuilds.
  const worldSettings = useEffectEvent(() => ({ reduced, low }));
  const worldReady = useEffectEvent(() => setReady(true));
  const worldFailed = useEffectEvent(err => {
    setError(err.message);
    setReady(false);
    pauseAdventure(true);
  });
  const worldSnapshot = useEffectEvent(snapshot => {
    player.current = { x: snapshot.x, z: snapshot.z };
    setNear(snapshot.near);
    if (marker.current) {
      marker.current.style.left = `${snapshot.marker.x}px`;
      marker.current.style.top = `${snapshot.marker.y}px`;
      marker.current.style.visibility = snapshot.marker.visible ? 'visible' : 'hidden';
    }
    if (minimapDot.current) {
      minimapDot.current.style.left = `${(snapshot.x + 28) / 56 * 100}%`;
      minimapDot.current.style.top = `${(snapshot.z + 37) / 63 * 100}%`;
    }
    if (host.current) {
      host.current.dataset.playerX = snapshot.x.toFixed(2);
      host.current.dataset.playerZ = snapshot.z.toFixed(2);
      host.current.dataset.drawCalls = snapshot.drawCalls;
      host.current.dataset.triangles = snapshot.triangles;
    }
  });
  const worldCollected = useEffectEvent(index => {
    saveChange(old => ({ ...old, fireflies: [...new Set([...old.fireflies, index])] }));
    audio.current?.sfx('correct');
  });
  const worldCreated = useEffectEvent(instance => {
    instance.restore(player.current);
    instance.setState({ phase: phaseRef.current, paused: pausedRef.current || phaseRef.current === 'title', mission: pRef.current.mission, fireflies: pRef.current.fireflies, reduced, low });
  });
  useEffect(() => {
    const manager = createAudio({ onError: () => setAudioNotice(true) });
    audio.current = manager;
    manager.setMuted(mutedRef.current);
    return () => { manager.dispose(); if (audio.current === manager) audio.current = null; };
  }, []);
  useEffect(() => {
    let active = true, ownedWorld = null;
    createWorld(host.current, {
      ready() { if (active) worldReady(); },
      failure(err) { if (active) worldFailed(err); },
      snapshot(snapshot) { if (active) worldSnapshot(snapshot); },
      collect(index) { if (active) worldCollected(index); },
    }, worldSettings()).then(instance => {
      if (!active) { instance.dispose(); return; }
      ownedWorld = instance;
      world.current = instance;
      worldCreated(instance);
    }).catch(err => { if (active) worldFailed(err); });
    return () => {
      active = false;
      ownedWorld?.dispose();
      if (world.current === ownedWorld) world.current = null;
    };
  }, [epoch]);
  useEffect(() => {
    world.current?.setState({ phase, paused: paused || phase === 'title', mission: p.mission, fireflies: p.fireflies, reduced, low });
  }, [phase, paused, p.mission, p.fireflies, reduced, low, ready]);
  const tick = useEffectEvent(() => {
    if (phaseRef.current !== 'title' && !pausedRef.current && phaseRef.current !== 'complete') saveChange(old => ({ ...old, seconds: old.seconds + 1 }));
  });
  useEffect(() => { const interval = setInterval(() => tick(), 1000); return () => clearInterval(interval); }, []);
  const keyChanged = useEffectEvent((event, down) => {
    const keyboard = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
    if (!down) { if (keyboard[event.key]) { held.current.delete(keyboard[event.key]); movement(); } return; }
    if (event.key === 'Escape' && phaseRef.current !== 'title') { event.preventDefault(); pauseAdventure(!pausedRef.current); return; }
    if (pausedRef.current) return;
    if (phaseRef.current === 'explore' && keyboard[event.key]) { event.preventDefault(); held.current.add(keyboard[event.key]); movement(); }
    if (['e', 'Enter', ' '].includes(event.key) && phaseRef.current === 'explore' && (event.target.tagName === 'CANVAS' || event.target === document.body)) { event.preventDefault(); document.querySelector('[data-world-action]')?.click(); }
  });
  const lostFocus = useEffectEvent(() => {
    clearInput();
    if (!['title', 'complete'].includes(phaseRef.current)) pauseAdventure(true);
  });
  useEffect(() => {
    const down = event => keyChanged(event, true), up = event => keyChanged(event, false);
    const blur = () => lostFocus(), hidden = () => { if (document.hidden) lostFocus(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', hidden);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', hidden); };
  }, []);
  useEffect(() => {
    if (!paused) return;
    const previous = document.activeElement, panel = pausePanel.current;
    panel?.querySelector('button')?.focus();
    const trap = event => {
      if (event.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll('button,input')].filter(item => !item.disabled), first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.removeEventListener('keydown', trap); previous?.focus?.(); };
  }, [paused]);
  useEffect(() => { if (phase === 'activity') activityRef.current?.focus({ preventScroll: true }); }, [phase, p.mission, p.round]);
  useEffect(() => {
    const activeTimers = timers.current;
    return () => { runToken.current += 1; activeTimers.forEach(clearTimeout); activeTimers.clear(); };
  }, []);

  async function start(reset = false) {
    const unlocked = audio.current?.unlock();
    clearTimers();
    const ticket = runToken.current;
    let next = settleProgress(reset ? freshProgress() : pRef.current);
    if (next.complete) next = freshProgress();
    player.current = next.position;
    world.current?.restore(next.position);
    saveChange(next);
    changePaused(false);
    resetRoundUi();
    changePhase(next.mode);
    await unlocked;
    if (ticket !== runToken.current || pausedRef.current) return;
    audio.current?.preload();
    speak(next.mode === 'activity' ? roundFor(MISSIONS, next).promptAudio : next.mode === 'reward' ? MISSIONS[next.mission].completeAudio : 'intro');
  }
  async function openActivity() {
    if (phaseRef.current !== 'explore' || pausedRef.current || (!near && !gentle)) return;
    clearInput();
    clearTimers();
    const ticket = runToken.current, unlocked = audio.current?.unlock();
    if (pRef.current.mission === 3) {
      saveChange(old => ({ ...old, complete: true, mode: 'explore' }));
      changePhase('complete');
      world.current?.burst();
      await unlocked;
      if (ticket === runToken.current && !pausedRef.current) speak('finish');
      return;
    }
    saveChange(old => ({ ...old, mode: 'activity' }));
    resetRoundUi();
    changePhase('activity');
    await unlocked;
    if (ticket === runToken.current && !pausedRef.current) speak(roundFor(MISSIONS, pRef.current).promptAudio);
  }
  function choose(choice, eventTime) {
    const progress = pRef.current, currentRound = roundFor(MISSIONS, progress);
    if (phaseRef.current !== 'activity' || busyRef.current || pausedRef.current || pictureError || !picturesReady || !currentRound.choices.some(item => item.id === choice.id)) return;
    clearTimers();
    audio.current?.unlock();
    const verdict = judge(currentRound, choice.id, progress.mission, progress.built);
    saveChange(old => ({ ...old, attempts: old.attempts + 1 }));
    if (!verdict.correct) {
      const result = wrongFeedback(MISSIONS[progress.mission].id, currentRound, choice.id, progress.built.length);
      setFeedback({ type: 'retry', text: result.text, id: choice.id });
      speak(result.audio);
      audio.current?.sfx('wrong');
      return;
    }
    audio.current?.sfx('correct');
    if (!verdict.finished) {
      saveChange(old => ({ ...old, built: verdict.built }));
      setFeedback({ type: 'seed', text: `${verdict.built.split('').join(' · ')}…`, id: choice.id });
      speak(choice.audio);
      return;
    }
    changeBusy(true);
    correctStarted.current = eventTime;
    saveChange(old => ({ ...old, pending: true, correct: old.correct + 1, built: progress.mission === 2 ? verdict.built : '' }));
    setFeedback({ type: 'correct', text: currentRound.correctText, id: choice.id });
    world.current?.burst();
    completeAfterFeedback(currentRound);
  }
  function leaveActivity() {
    if (busyRef.current) return;
    audio.current?.stop();
    clearTimers();
    resetRoundUi();
    changePhase('explore');
    saveChange(old => ({ ...old, mode: 'activity' }));
  }
  function takeLight() {
    if (phaseRef.current !== 'reward' || pausedRef.current) return;
    saveChange(old => ({ ...old, mission: Math.min(3, old.mission + 1), round: 0, built: '', mode: 'explore' }));
    changePhase('explore');
    world.current?.burst();
    audio.current?.sfx('correct');
  }
  function guide() {
    if (!pausedRef.current && phaseRef.current === 'explore') world.current?.guide();
  }
  function exit() {
    clearInput();
    clearTimers();
    audio.current?.stop();
    const next = saveChange(settleProgress(pRef.current));
    resetRoundUi();
    changePaused(false);
    changePhase('title');
    setSaved(next);
  }
  function touchStart(event, direction) {
    if (pausedRef.current || phaseRef.current !== 'explore') return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    touchHeld.current.add(direction);
    movement();
    event.currentTarget.dataset.down = String(event.timeStamp);
  }
  function touchEnd(event, direction, cancel = false) {
    const elapsed = event.timeStamp - Number(event.currentTarget.dataset.down || 0);
    const release = () => { touchHeld.current.delete(direction); movement(); };
    if (cancel || elapsed >= 90) release();
    else delay(release, 90 - elapsed);
  }
  const fallback=gentle||!!error;
  return <main className={`sound-seekers-woodland game ${reduced?'reduced':''} ${fallback?'gentle':''}`} data-phase={phase} data-mission={p.mission} data-round={p.round} data-seconds={p.seconds} data-child-surface="sound-seekers-demo">
    <div className="world" ref={host}/>
    {fallback&&<div className="gentle-scene" aria-hidden="true"><svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice"><path d="M0 0h1000v700H0Z" fill="#81946c"/><path d="M-50 620Q600 620 500 380T850-50" fill="none" stroke="#d2c497" strokeWidth="100"/><path d="M-50 340q600 130 1100-80" fill="none" stroke="#73babb" strokeWidth="90"/><path d="M540 390 535 290" stroke="#ecdfb8" strokeWidth="80"/></svg></div>}
    <div className="vignette"/>
    <div className="topbar" inert={paused?true:undefined}>
      <div className="brand"><Icon name="leaf" size={21}/><span>SOUND SEEKERS</span><small>THE LOST LITTLE LIGHTS</small></div>
      {phase!=='title'&&<div className="light-progress" data-child-progress aria-label={`${p.mission} of 3 lights found`}>{[0,1,2].map(i=><span className={i<p.mission?'found':''} key={i}><Icon name="lantern" size={22}/><span>{i+1}</span></span>)}</div>}
      <div className="top-actions"><button className="icon-button" aria-label={muted?'Turn sound on':'Turn sound off'} onClick={()=>changeMuted(!muted)}><Icon name={muted?'quiet':'sound'}/></button>{phase!=='title'&&<button className="icon-button" aria-label="Pause adventure" onClick={()=>pauseAdventure(true)}><Icon name="pause"/></button>}</div>
    </div>
    {phase==='title'&&<section className="title-screen" data-child-choices="Start adventure" inert={paused?true:undefined}>
      <div className="title-copy"><div className="eyebrow"><span/> A LITTLE MEADOW ADVENTURE</div><h1 data-child-title>The lost<br/>little <em>lights.</em></h1><p data-child-instruction>One little hero. Three lost lights.<br/>A whole woodland waiting for you.</p><button className="primary start" data-child-primary disabled={!ready&&!gentle} onClick={()=>start()}>{!ready&&!gentle?'Growing your woodland…':saved&&!p.complete?'Continue adventure':'Let’s explore'}<Icon name="arrow"/></button>{saved&&!p.complete&&<button className="text-button" onClick={()=>start(true)}>Start a new adventure</button>}<div className="title-meta"><span>ABOUT 5 MINUTES</span><i/> <span>PLAY WITH SOUND</span></div></div>
      <div className="chapter-stamp"><Icon name="lantern" size={34}/><span>Meadow Pals</span><small>CHAPTER ONE</small></div>
      <div className="title-controls"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrow keys</span><span>Tap the ground to walk</span><span>Touch controls included</span></div>
    </section>}
    {phase==='explore'&&<div className="explore-ui" inert={paused?true:undefined}>
      <section className="objective"><span className="objective-icon"><Icon name={landmark.icon} size={27}/></span><div><small>{p.mission<3?`LITTLE LIGHT ${p.mission+1} OF 3`:'THE LIGHTS ARE READY'}</small><h1 data-child-title>{landmark.name}</h1><p data-child-instruction>{p.mission===0?'Find the mushroom picnic.':p.mission===1?'Follow the path to the brook.':p.mission===2?'Cross the bridge. Find the flowers.':'Bring the lights to the great tree.'}</p></div><button aria-label="Hear the next adventure" className="replay-small" onClick={()=>speak(p.mission<3?mission.introAudio:'lanterns-complete')}><Icon name="sound"/></button></section>
      <div className="world-marker" ref={marker}><Icon name={near?'leaf':'lantern'} size={26}/><span>{near?'You’re here!':'This way'}</span></div>
      <div className="explore-bottom"><div className="dpad" role="group" aria-label="Move Bouncy" data-child-choices>{['up','left','down','right'].map(d=><button key={d} className={`direction ${d}`} aria-label={`Move ${d}`} onPointerDown={e=>touchStart(e,d)} onPointerUp={e=>touchEnd(e,d)} onPointerCancel={e=>touchEnd(e,d,true)} onLostPointerCapture={e=>touchEnd(e,d,true)}><Icon name="arrow"/></button>)}</div><div className="walk-hint"><span>Tap the path to walk</span><small>or use WASD / arrow keys</small></div><div className="world-action-wrap"><button className={`primary world-action ${near||gentle?'can-help':'guide'}`} data-world-action data-child-primary onClick={near||gentle?openActivity:guide}><Icon name={near||gentle?landmark.icon:'arrow'}/>{near||gentle?landmark.action:'Follow the path'}</button><span>{near||gentle?'Tap to help · E / Enter': 'Explore at your own pace'}</span></div></div>
      <button className="pocket-map-button" aria-label="Open woodland map" onClick={()=>setMapOpen(v=>!v)}><Icon name="map"/><span>Map</span></button><div className="firefly-count" aria-label={`${p.fireflies.length} of 5 hidden fireflies found`}><Icon name="star" size={18}/><span>{p.fireflies.length} / 5</span></div>
      {mapOpen&&<aside className="pocket-map"><h2>The woodland</h2><div className="map-paper"><svg viewBox="0 0 100 100"><path d="M52 90Q50 80 28 69T48 57 68 53 62 37 28 26 50 9"/><path className="map-river" d="M0 51q50 12 100-3"/></svg>{LANDMARKS.map((l,i)=><span className={`map-spot ${i<p.mission?'done':''}`} key={l.id} style={{left:`${(l.x+28)/56*100}%`,top:`${(l.z+37)/63*100}%`}}><Icon name={l.icon} size={16}/><small>{i+1}</small></span>)}<b ref={minimapDot} className="map-player"/></div><p>Follow the cream path.<br/>The glowing ring marks your next stop.</p><button className="text-button" onClick={()=>setMapOpen(false)}>Close map</button></aside>}
    </div>}
    {phase==='activity'&&round&&<section className={`activity ${mission.id}`} inert={paused?true:undefined} aria-label={mission.title}>
      <div className="activity-heading"><button className="icon-button" aria-label="Return to woodland" onClick={leaveActivity}><Icon name="back"/></button><div><div className="eyebrow">LITTLE LIGHT {p.mission+1}</div><h1 data-child-title ref={activityRef} tabIndex={-1}>{mission.title}</h1></div><div className="round-counter" data-child-progress>{p.round+1}<span> / 6</span></div></div>
      <div className="activity-instruction"><p data-child-instruction>{round.instruction}</p><button onClick={()=>speak(round.promptAudio)} aria-label="Hear this sound or word again" className="hear"><Icon name="sound"/><span>Listen</span></button></div>
      <div className="mini-stage">
        {p.mission===0?<div className="sound-target"><span>Listen for</span><strong>/{round.target}/</strong><div className="basket-art" aria-hidden="true"><i/><b/><em/><span className="basket-tokens">{Array.from({length:Math.min(6,p.round+(busy?1:0))},(_,i)=><span className="basket-token" key={i}/>)}</span></div></div>:<div className="word-picture"><button aria-label={`Hear ${round.word}`} onClick={()=>speak(`word:${round.word}`)}><img src={imagePath(round.picture)} alt={round.word} onLoad={()=>imageLoaded(round.picture)} onError={()=>setPictureError(true)}/><span><Icon name="sound" size={19}/></span></button></div>}
        {p.mission===1&&<div className="bridge-model" aria-label={`Complete ${round.maskedWord}`}><div className="brook-water"/><div className="bridge-bank left-bank"/><div className="bridge-bank right-bank"/><div className="bridge-word"><span className={`missing ${feedback?.type==='correct'?'filled':''}`}>{feedback?.type==='correct'?round.target:'?'}</span>{round.word.slice(1).split('').map((l,i)=><span key={i}>{l}</span>)}</div><div className="bridge-progress">{Array.from({length:6},(_,i)=><i key={i} className={i<p.round?'placed':''}/>)}</div></div>}
        {p.mission===2&&<div className="garden-model"><div className="flower-row">{Array.from({length:6},(_,i)=><Flower key={i} lit={i<p.round||i===p.round&&busy}/>)}</div><div className="planting-slots" aria-label={`Word built so far: ${p.built||'no sounds yet'}`}>{round.phonemes.map((_,i)=><span key={i} className={i<p.built.length?'planted':i===p.built.length?'waiting':''}>{p.built[i]||<i/>}</span>)}</div></div>}
        <div className={`choices ${p.mission===0?'picture-choices':'letter-choices'}`} role="group" aria-label={p.mission===0?'Sound pictures':'Sound choices'} data-child-choices data-child-primary>
          {round.choices.map(choice=>{const used=p.mission===2&&p.built.includes(choice.id);const correct=feedback?.id===choice.id&&feedback.type==='correct';return <div className="choice-wrap" key={`${round.id}-${choice.id}`}><button className={`choice ${correct?'correct':''} ${feedback?.id===choice.id&&feedback.type==='retry'?'retry':''} ${used?'used':''}`} aria-label={p.mission===0?`Choose ${choice.label}`:`Choose ${choice.label} sound`} aria-disabled={busy||pictureError||!picturesReady||used} onClick={event=>{if(!used)choose(choice,event.timeStamp);}}>{choice.picture?<img src={imagePath(choice.picture)} alt="" onLoad={()=>imageLoaded(choice.picture)} onError={()=>setPictureError(true)}/>:<strong>{choice.label}</strong>}{correct&&<span className="choice-tick"><Icon name="check"/></span>}</button>{p.mission===0&&<button className="name-object" aria-label={`Hear ${choice.label}`} onClick={()=>speak(choice.audio)}><Icon name="sound" size={19}/></button>}</div>;})}
        </div>
      </div>
      <div className={`feedback ${feedback?.type||''}`} role="status">{pictureError?<><span>A picture didn’t load.</span><button onClick={()=>{setPictureError(false);setLoadedImages({});setImageRevision(v=>v+1);}}>Try loading again</button></>:feedback?<><Icon name={feedback.type==='correct'?'check':'sound'} size={21}/><span>{feedback.text}</span></>:<span>{p.mission===0?'Listen. Choose. Into the basket!':p.mission===1?'Each sound stone helps rebuild the crossing.':'Plant one sound at a time.'}</span>}</div>
    </section>}
    {phase==='reward'&&<section className="reward-screen" inert={paused?true:undefined}><Lantern lit/><div className="eyebrow">YOU FOUND A LITTLE LIGHT</div><h1 data-child-title>{p.mission===0?'A lovely full basket!':p.mission===1?'A way across!':'Look at them glow!'}</h1><p data-child-instruction>{mission.complete}</p><button className="primary" onClick={takeLight} data-child-primary>Take the light<Icon name="arrow"/></button><div className="reward-count" data-child-progress>Light {p.mission+1} of 3</div></section>}
    {phase==='complete'&&<section className="ending" inert={paused?true:undefined}><div className="eyebrow">A LITTLE HELP. A BIG DIFFERENCE.</div><h1 data-child-title>You brought<br/>back the <em>light.</em></h1><div className="ending-lights">{[0,1,2].map(i=><Lantern key={i} lit/>)}</div><p data-child-instruction>The basket is packed. The bridge is mended.<br/>The whole woodland is glowing again.</p><div className="ending-stats" data-child-progress><span>3 friends helped</span><span>{p.fireflies.length} hidden fireflies found</span></div><button className="primary" data-child-primary onClick={()=>start(true)}>Another adventure<Icon name="arrow"/></button><button className="text-button" onClick={exit}>Back to the beginning</button></section>}
    {audioNotice&&!paused&&<button className="audio-notice" onClick={replayCurrent}><Icon name="sound"/>Tap to hear again</button>}
    {paused&&<div className="pause-backdrop"><section className="pause-panel" role="dialog" aria-modal="true" aria-label={error?'Woodland loading help':'Adventure paused'} ref={pausePanel}><Icon name={error?'leaf':'pause'} size={36}/><h2>{error?'Let’s keep exploring':'Take a little breather'}</h2><p>{error?'The 3D woodland could not load. Your progress is safe.':'Your little lights are safe here.'}</p>{error?<><button className="primary" onClick={retryWorld}>Try the woodland again</button><button className="secondary" onClick={usePictureTrail}>Play the picture trail</button></>:<button className="primary" onClick={()=>pauseAdventure(false)}>Keep exploring<Icon name="play"/></button>}<div className="pause-options"><label><input type="checkbox" checked={muted} onChange={e=>changeMuted(e.target.checked)}/>Sound off</label><label><input type="checkbox" checked={reduced} onChange={e=>setReduced(e.target.checked)}/>Gentle motion</label><label><input type="checkbox" checked={low} onChange={e=>setLow(e.target.checked)}/>Lighter graphics</label></div><button className="text-button" onClick={exit}>Save and leave</button></section></div>}
  </main>;
}
