import { playCueSequence, stopCueAudio } from '../../../../utils/audio/cuePlayer.js';
import { playCorrectChime, playSoftBuzz, playCelebrationFanfare, cancelGameSfx } from '../../../../utils/audio/gameSfx.js';
import { attachReleasedGameAction } from '../shared/releasedGameAction.js';
import { createSafariRun, currentSafariTask, chooseSafari, finishSafariFeedback, continueSafariWord, revealSafariModel } from './soundSafariRules.js';
import { SAFARI_AUDIO_SCRIPTS, safariInstructionPath, safariWordClips, safariModelClips } from './soundSafariAudio.js';
import { soundSafariUnitAudio } from '../../../../data/soundSafariPronunciations.js';
import { SAFARI_SCENE_ASSETS, safariSceneMarkup, safariCreatureForSlot, creatureArt, habitatArt, displaySafariGrapheme } from './soundSafariScene.js';

export function startSoundSafari(root, options) {
  const params = new URLSearchParams(location.search);
  const diagnostics = import.meta.env.DEV && location.pathname === '/preview/game-overlay.html' && params.get('safariDiagnostics') === '1';
  const seed = diagnostics ? Number(params.get('safariSeed') || 41) : Date.now();
  let run = createSafariRun(options.difficulty, options.startLevel, seed);
  root.innerHTML = safariSceneMarkup();
  const el = id => root.querySelector(`[data-ss="${id}"]`), play = root.querySelector('.ss-play'), overlay = el('overlay');
  const cleanups = [], choices = new Map(), pauses = new Set(), introducedModes = new Set(), input = { owner:null, epoch:0, cancels:new Set() };
  let disposed=false, intro=true, printMode=false, delivery='pending', audioKind='intro', audioSerial=0, audioDeadline=null;
  let cueHistory=[], questionKey='', cardKey='', cardCleanups=[], pathKey='', worldKey='', fieldKey='', flight=null;
  let previous=performance.now(), frame=0, feedbackAge=0, endingAge=0, receiptSent=false, completionSent=false, lastSound=options.getSound();
  const motion=matchMedia('(prefers-reduced-motion: reduce)'); let reduced=motion.matches;
  const task = () => currentSafariTask(run);
  const listen = (target,name,fn) => { target.addEventListener(name,fn); cleanups.push(() => target.removeEventListener(name,fn)); };
  const busy = () => ['pending','loading','started'].includes(delivery);
  const invalidate = () => { input.epoch++; input.cancels.forEach(cancel => cancel()); };
  const canChoose = () => !disposed && !intro && !run.paused && run.phase==='active' && !busy() && (delivery==='completed' || printMode);
  const clearFlight = () => { flight?.remove(); flight=null; };
  function stopAudio(reason='interrupted') {
    if (busy()) { delivery=reason; cueHistory.push({type:reason,kind:audioKind}); }
    audioSerial++; clearTimeout(audioDeadline); audioDeadline=null; stopCueAudio();
  }
  function cueClips(kind) {
    const current=task();
    if (kind==='intro') return [safariInstructionPath('instruction')];
    if (kind==='feedback') {
      const answer=run.lastResponse, chosen=run.choices.find(choice => choice.id===answer.responseId);
      const clips=[soundSafariUnitAudio(chosen,current.word).path];
      if (!answer.correct) clips.push(safariInstructionPath('retry'), ...safariWordClips(current));
      else if (run.found.length===current.units.length) clips.push(...safariWordClips(current), safariInstructionPath('home'));
      return clips;
    }
    const modeled=current.model || current.revealed;
    const lead=run.unitIndex===0 && !introducedModes.has(modeled?'model':'turn')
      ? [safariInstructionPath(modeled?'model':'turn')] : [];
    return [...lead, ...(modeled ? safariModelClips(current,run.unitIndex) : safariWordClips(current))];
  }
  function requestAudio(kind=audioKind, force=false) {
    if (disposed) return;
    if (pauses.size) { audioKind=kind; delivery='interrupted'; return; }
    stopAudio(); invalidate(); audioKind=kind;
    if (kind==='question') {
      const key=`${run.wordIndex}:${run.unitIndex}`;
      if (key!==questionKey) { cueHistory=[]; questionKey=key; }
    }
    // Hearing again can leave session-wide print mode. Already revealed help
    // stays on this word in the pure rules; it cannot become independent again.
    if (force && options.getSound()) printMode=false;
    if (!options.getSound() || (printMode && kind!=='intro')) {
      delivery=options.getSound()?'not_requested':'muted'; paint(); return;
    }
    const clips=cueClips(kind), token=audioSerial;
    if (!clips.length || clips.some(clip => !clip)) {
      delivery='unavailable'; cueHistory.push({type:delivery,kind,sources:[...clips]}); paint(); return;
    }
    delivery='pending';
    const armDeadline = source => {
      clearTimeout(audioDeadline);
      audioDeadline=setTimeout(() => {
        if (disposed || token!==audioSerial) return;
        delivery='failed'; cueHistory.push({type:'failed',reason:'playback_timeout',source,kind});
        audioSerial++; stopCueAudio(); invalidate(); paint();
      },12000);
    };
    armDeadline(clips[0]);
    playCueSequence(clips,{playImmediately:true,gapMs:100,cueId:`safari:${kind}:${run.wordIndex}:${run.unitIndex}:${token}`,
      onItemDelivery:event => {
        if (disposed || token!==audioSerial) return;
        const index=Number(event.id.split(':').at(-1))-1;
        cueHistory.push({type:event.type,source:clips[index],kind,at:event.at}); armDeadline(clips[index]);
      },
      onDelivery:event => {
        if (disposed || token!==audioSerial) return;
        delivery=event.type;
        if (['failed','unavailable','interrupted'].includes(delivery)) { audioSerial++; clearTimeout(audioDeadline); audioDeadline=null; stopCueAudio(); }
        if (delivery==='completed') {
          clearTimeout(audioDeadline); audioDeadline=null;
          if (kind==='question') introducedModes.add(task().model || task().revealed?'model':'turn');
        }
        paint(); if (delivery==='completed' && kind==='question') focusChoice();
      }
    });
    paint();
  }
  function usePrintedModel() {
    stopAudio(); printMode=true; revealSafariModel(run,'printed_model_recovery'); invalidate(); paint(); focusChoice();
  }
  function saveReceipt() {
    if (!run.receipt || receiptSent) return;
    const result=run.receipt;
    options.onProgressUpdate?.(30,30);
    receiptSent=options.onResultReady?.(result.stars,result.score,result.words,result.evidence)!==false;
  }
  function captureFlight(choiceId, response) {
    clearFlight(); if (!response.correct || reduced) return;
    const choice=run.choices.find(item=>item.id===choiceId), button=choices.get(choiceId)?.button;
    const slot=el('path').children[run.unitIndex];
    if (!choice || !button || !slot) return;
    const origin=button.getBoundingClientRect(), destination=slot.getBoundingClientRect(), bounds=root.getBoundingClientRect();
    flight=document.createElement('div'); flight.className='ss-flight'; flight.setAttribute('aria-hidden','true');
    flight.innerHTML=creatureArt(safariCreatureForSlot(choice.slot,seed+run.wordIndex));
    Object.assign(flight.style,{left:`${origin.x-bounds.x}px`,top:`${origin.y-bounds.y}px`,width:`${origin.width}px`,height:`${origin.height}px`});
    flight.style.setProperty('--dx',`${destination.x+destination.width/2-origin.x-origin.width/2}px`);
    flight.style.setProperty('--dy',`${destination.y+destination.height/2-origin.y-origin.height/2}px`);
    root.append(flight);
  }
  function choose(id) {
    if (!canChoose()) return;
    const answer=chooseSafari(run,id,{audioDelivery:delivery,cueHistory,supportUsed:printMode?['printed_model_recovery']:[]});
    if (!answer) return;
    invalidate(); feedbackAge=0; stopAudio(); captureFlight(id,answer);
    options.onScoreUpdate?.(run.score); options.onProgressUpdate?.(run.wordIndex+(run.found.length===task().units.length?1:0),30);
    saveReceipt();
    if (!run.paused && options.getSound()) (answer.correct?playCorrectChime:playSoftBuzz)();
    requestAudio('feedback'); paint();
  }
  function focusChoice() {
    if (canChoose() && (document.activeElement===document.body || root.contains(document.activeElement))) {
      [...choices.values()].find(entry=>!entry.button.disabled)?.button.focus({preventScroll:true});
    }
  }
  function buildField() {
    const key=run.choices.map(choice=>choice.id).join('|');
    if (fieldKey!==key) {
      clearFlight(); choices.forEach(entry=>entry.cleanup()); choices.clear(); el('field').replaceChildren(); fieldKey=key;
      for (const choice of run.choices) {
        const button=document.createElement('button'); button.type='button'; button.className='ss-choice';
        button.dataset.ssChoice=choice.slot; button.dataset.choiceId=choice.id;
        button.innerHTML=creatureArt(safariCreatureForSlot(choice.slot,seed+run.wordIndex));
        const label=document.createElement('span'); label.className='ss-unit'; label.textContent=displaySafariGrapheme(choice.grapheme); button.append(label);
        button.setAttribute('aria-label',`Catch ${displaySafariGrapheme(choice.grapheme)}`);
        el('field').append(button); choices.set(choice.id,{button,cleanup:attachReleasedGameAction(button,()=>choose(choice.id),input)});
      }
    }
    for (const [id,entry] of choices) {
      entry.button.disabled=!canChoose();
      if (run.phase==='feedback' && run.lastResponse.responseId===id) entry.button.dataset.selected=run.lastResponse.correct?'correct':'wrong';
      else delete entry.button.dataset.selected;
    }
  }

  function showCard(key) {
    if (cardKey===key) return;
    invalidate(); cardCleanups.forEach(clean=>clean()); cardCleanups=[]; cardKey=key;
    overlay.replaceChildren(); overlay.hidden=!key; play.inert=Boolean(key);
    for (const name of ['role','aria-label','aria-modal']) overlay.removeAttribute(name);
    if (!key) return;
    overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label',key==='intro'?'Sound Safari instructions':key==='recovery'?'Sound Safari sound recovery':'Sound Safari path ready');
    const card=document.createElement('section'); card.className='ss-card';
    const art=document.createElement('div'); art.className='ss-card-art'; art.innerHTML=creatureArt('frog')+'<span aria-hidden="true">→</span>'+habitatArt(task().world);
    const heading=document.createElement('h2'); heading.textContent=key==='intro'?'Guide the creatures home'
      :key==='recovery'?(options.getSound()?'Sound did not finish':'Sound is off'):'A path home!';
    const copy=document.createElement('p'); copy.textContent=key==='intro'?SAFARI_AUDIO_SCRIPTS.instruction
      :key==='recovery'?'Hear it again, or use printed models to keep playing.':`You built ${task().word}. The creatures can reach their habitat.`;
    const actions=document.createElement('div'); actions.className='ss-actions';
    const action=(label,callback,id,secondary=false)=>{
      const button=document.createElement('button'); button.type='button'; button.textContent=label; button.dataset.ss=id;
      if (secondary) button.className='secondary'; actions.append(button);
      cardCleanups.push(attachReleasedGameAction(button,callback,input)); return button;
    };
    if (key==='intro') {
      action('Start safari',()=>{if (pauses.size || busy()) return; intro=false; invalidate(); requestAudio('question');},'start');
      action('Hear instructions',()=>requestAudio('intro',true),'intro-hear',true);
    } else if (key==='recovery') {
      action('Hear again',()=>requestAudio(audioKind,true),'retry');
      action('Use printed models',usePrintedModel,'print',true);
    } else {
      action(task().model?'Try a new word':'Next word',()=>{
        if (!continueSafariWord(run)) return;
        if (printMode) revealSafariModel(run,'printed_model_recovery');
        endingAge=0; cueHistory=[]; pathKey='';
        options.onProgressUpdate?.(run.wordIndex,30); requestAudio('question'); paint(); focusChoice();
      },'next');
    }
    const note=document.createElement('small'); note.dataset.ss='card-note';
    card.append(art,heading,copy,actions,note); overlay.append(card); actions.querySelector('button')?.focus({preventScroll:true});
  }
  function paint() {
    if (disposed) return;
    const current=task(), modeled=current.model || current.revealed || printMode;
    root.dataset.phase=intro?'intro':run.phase; root.dataset.paused=run.paused; root.dataset.delivery=delivery;
    root.dataset.motion=reduced?'reduced':'full'; root.dataset.words=run.words; root.dataset.responses=run.firstResponses.length;
    root.dataset.reaction=run.phase==='feedback'?(run.lastResponse.correct?'capture':'retry')
      :['word-complete','complete'].includes(run.phase)?'home':'ready';
    el('kicker').textContent=modeled?'Printed model':`Sound trail · ${run.wordIndex+1} / 30`;
    el('target').textContent=modeled?current.word:'Your turn';
    el('hear').disabled=run.paused || !options.getSound() || !['active','feedback'].includes(run.phase);
    el('model').disabled=run.paused || run.phase!=='active' || modeled;
    if (worldKey!==current.world) {
      worldKey=current.world; el('background').src=SAFARI_SCENE_ASSETS.find(asset=>asset.role===worldKey).path;
      el('habitat').innerHTML=habitatArt(worldKey); el('background').hidden=false;
    }
    const key=`${run.wordIndex}:${run.found.length}:${modeled}`;
    if (pathKey!==key) {
      pathKey=key; el('path').replaceChildren(...current.units.map((unit,index)=>{
        const node=document.createElement('span'); node.className='ss-slot'; node.setAttribute('role','listitem');
        const filled=index<run.found.length; node.dataset.filled=filled; node.dataset.next=modeled && index===run.found.length;
        node.textContent=filled || modeled?displaySafariGrapheme(unit.grapheme):'';
        node.setAttribute('aria-label',`Part ${index+1}: ${filled || modeled?displaySafariGrapheme(unit.grapheme):'empty'}`);
        return node;
      }));
    }
    const answer=run.lastResponse;
    const message=['word-complete','complete'].includes(run.phase)?'The path is ready. Home you go!'
      :run.phase==='feedback'?(answer.correct?`${displaySafariGrapheme(answer.response)} caught!`:`${displaySafariGrapheme(answer.response)} stays here. Hear the word again.`)
        :modeled?`Follow the model: ${displaySafariGrapheme(current.unit.grapheme)}`:'Catch the next word part.';
    if (el('feedback').textContent!==message) el('feedback').textContent=message;
    el('support').textContent=modeled?'Printed model · supported practice':busy()?'Listen to the word…':'Listen and choose · no hurry';
    buildField();
    const recovery=!printMode && !busy() && delivery!=='completed' && ['active','feedback'].includes(run.phase);
    showCard(intro?'intro':recovery?'recovery':run.phase==='word-complete'?'word':'');
    for (const button of overlay.querySelectorAll('button')) button.disabled=run.paused
      || (button.dataset.ss==='start' && busy()) || (['intro-hear','retry'].includes(button.dataset.ss) && !options.getSound());
    if (cardKey==='recovery') overlay.querySelector('h2').textContent=options.getSound()?'Sound did not finish':'Sound is off';
    if (el('card-note')) el('card-note').textContent=busy()?'Listen…':cardKey==='word'?'':!options.getSound()?'Sound off · printed models are available.'
      :delivery==='completed'?'':'Printed help is recorded as support.';
  }
  function tick(seconds) {
    if (disposed || intro || run.paused) return;
    if (run.phase==='feedback') {
      feedbackAge+=seconds;
      if (feedbackAge>=(run.lastResponse.correct?.85:1.2) && !busy() && (delivery==='completed' || printMode)) {
        const phase=finishSafariFeedback(run); invalidate(); clearFlight();
        if (phase==='active') {
          if (printMode) revealSafariModel(run,'printed_model_recovery');
          requestAudio('question');
        } else {
          stopAudio(); endingAge=0;
          if (phase==='word-complete' && run.nextCheckpoint!==null) options.onCheckpoint?.(run.nextCheckpoint,10);
        }
        paint(); if (phase==='active') focusChoice();
      }
    } else if (run.phase==='complete' && !completionSent) {
      endingAge+=seconds;
      if (endingAge>=1) {
        stopAudio(); saveReceipt();
        if (run.paused) return;
        completionSent=true;
        const receipt=run.receipt;
        if (options.getSound()) playCelebrationFanfare();
        options.onComplete?.(receipt.stars,receipt.score,receipt.words,receipt.evidence);
      }
    }
  }
  function pause(reason='host') {
    if (disposed) return;
    pauses.add(reason); run.paused=true; invalidate(); stopAudio(); cancelGameSfx(); paint();
  }
  function resume(reason='host') {
    if (disposed) return;
    pauses.delete(reason); run.paused=pauses.size>0; previous=performance.now(); invalidate();
    if (!run.paused && delivery==='interrupted') requestAudio(audioKind);
    paint();
  }
  listen(motion,'change',()=>{reduced=motion.matches; if (reduced) clearFlight(); paint();});
  listen(window,'blur',()=>pause('blur')); listen(window,'focus',()=>resume('blur'));
  listen(document,'visibilitychange',()=>document.hidden?pause('visibility'):resume('visibility'));
  listen(root,'keydown',event=>{
    if (event.repeat && ['Enter',' '].includes(event.key)) {event.preventDefault(); return;}
    if (cardKey && event.key==='Tab') {
      const buttons=[...overlay.querySelectorAll('button:not(:disabled)')], index=buttons.indexOf(document.activeElement);
      event.preventDefault(); buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus(); return;
    }
    if (!canChoose() || !el('field').contains(event.target) || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d'].includes(event.key)) return;
    event.preventDefault(); const buttons=[...el('field').querySelectorAll('button:not(:disabled)')];
    const direction=['ArrowLeft','ArrowUp','a'].includes(event.key)?-1:1;
    buttons[(buttons.indexOf(document.activeElement)+direction+buttons.length)%buttons.length]?.focus();
  });
  cleanups.push(attachReleasedGameAction(el('hear'),()=>requestAudio(run.phase==='feedback'?'feedback':'question',true),input));
  cleanups.push(attachReleasedGameAction(el('model'),()=>{
    if (!canChoose()) return;
    revealSafariModel(run); requestAudio('question'); paint();
  },input));
  root.querySelectorAll('img').forEach(img=>listen(img,'error',()=>{img.hidden=true; root.dataset.assetFallback='true';}));
  const observer=new ResizeObserver(()=>{invalidate(); clearFlight();}); observer.observe(root);
  cleanups.push(()=>observer.disconnect());
  function loop(now) {
    if (disposed) return;
    const delta=Math.min(.05,Math.max(0,(now-previous)/1000)); previous=now;
    if (lastSound!==options.getSound()) {
      lastSound=options.getSound(); stopAudio(); invalidate();
      if (!lastSound) {delivery='muted'; cancelGameSfx(); paint();}
      else requestAudio(audioKind,true);
    }
    tick(delta); frame=requestAnimationFrame(loop);
  }
  options.onSessionStart?.(); options.onCheckpoint?.(Math.floor(run.wordIndex/3),10); options.onProgressUpdate?.(run.wordIndex,30);
  paint(); requestAudio('intro'); frame=requestAnimationFrame(loop);
  const snapshot=()=>({phase:run.phase,intro,wordIndex:run.wordIndex,unitIndex:run.unitIndex,task:task(),choices:run.choices,
    words:run.words,score:run.score,found:run.found,firstResponses:run.firstResponses,assistedRetries:run.assistedRetries,
    receipt:run.receipt,delivery,audioKind,printMode,cueHistory:[...cueHistory],paused:run.paused,seed});
  const debug={snapshot,plan:run.plan,step:tick,seek:level=>{
    stopAudio(); invalidate(); run=createSafariRun(options.difficulty,level,seed); run.paused=pauses.size>0;
    intro=false; fieldKey=''; pathKey=''; questionKey=''; cueHistory=[]; feedbackAge=0; endingAge=0; receiptSent=false; completionSent=false;
    if (printMode) revealSafariModel(run,'printed_model_recovery');
    options.onSessionStart?.(); requestAudio('question'); paint();
  }};
  if (diagnostics) window.__soundSafari=debug;
  return {pause,resume,debugSnapshot:snapshot,teardown(){
    disposed=true; invalidate(); stopAudio(); cancelGameSfx(); cancelAnimationFrame(frame); clearFlight();
    cleanups.forEach(clean=>clean()); choices.forEach(entry=>entry.cleanup()); cardCleanups.forEach(clean=>clean());
    root.replaceChildren(); if (diagnostics && window.__soundSafari===debug) delete window.__soundSafari;
  }};
}
