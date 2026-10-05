import { useEffect, useRef, useState } from 'react';
import { createReelReadEngine } from './reelReadEngine.js';
import './ReelReadGame.css';

function FishingControl({action,label,children,className,primary,onHold,onTap,onRelease}) {
  const pointer=(pressed,event)=>{
    onHold(action,pressed,event.pointerType==='touch'?'touch':'pointer',event.pointerId);
    if(pressed){event.preventDefault();event.currentTarget.setPointerCapture?.(event.pointerId);}else onRelease();
  };
  const key=(pressed,event)=>{
    if(![' ','Enter'].includes(event.key))return;event.preventDefault();event.stopPropagation();
    if(!event.repeat)onHold(action,pressed,'keyboard',event.code||event.key);
  };
  return <button type="button" className={className} aria-label={label} data-child-primary={primary||undefined}
    onPointerDown={event=>pointer(true,event)} onPointerUp={event=>pointer(false,event)}
    onPointerCancel={event=>pointer(false,event)} onLostPointerCapture={event=>pointer(false,event)}
    onKeyDown={event=>key(true,event)} onKeyUp={event=>key(false,event)}
    onClick={event=>{if(!event.detail){onTap(action);onRelease();}}}>{children}</button>;
}

function FishingLineMeter({hud,inline=false}) {
  return <div className={`rr-line-meter${hud.tension>.76?' is-tight':''}${inline?' is-inline':''}`} aria-label="Fishing line">
    <span>{hud.tension>.76?'Let go to ease':'Hold to reel'}</span>
    <div role="progressbar" aria-label="Fish reeled to boat" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(hud.lineProgress*100)}>
      <i style={{width:`${Math.max(0,Math.min(100,hud.lineProgress*100))}%`}}/></div>
    <div role="progressbar" aria-label="Line tension" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(hud.tension*100)}>
      <i style={{width:`${hud.tension*100}%`}}/></div>
  </div>;
}

export default function ReelReadPresentation({ difficulty='easy', sessionSeed=0, journey=null, startLevel=0, progressScopeKey,
  isSoundEnabled=true,onScoreUpdate,onProgressUpdate,onCheckpoint,onComplete,onEngineReady,onSessionStart }) {
  const mount=useRef(null),engine=useRef(null),sound=useRef(isSoundEnabled),choices=useRef(new Map());
  const [hud,setHud]=useState(null),[delivery,setDelivery]=useState(null);
  const callbacks=useRef({onScoreUpdate,onProgressUpdate,onCheckpoint,onComplete,onEngineReady,onSessionStart});
  useEffect(()=>{callbacks.current={onScoreUpdate,onProgressUpdate,onCheckpoint,onComplete,onEngineReady,onSessionStart};},
    [onScoreUpdate,onProgressUpdate,onCheckpoint,onComplete,onEngineReady,onSessionStart]);
  useEffect(()=>{sound.current=isSoundEnabled;engine.current?.soundChanged(isSoundEnabled);},[isSoundEnabled]);
  useEffect(()=>{
    const map=choices.current;
    const current=createReelReadEngine(mount.current,{difficulty,sessionSeed,journey,startLevel,progressScopeKey,
      getSound:()=>sound.current,onHud:setHud,onDelivery:setDelivery,onChoicePositions:rows=>{
        for(const row of rows){const button=map.get(row.id);if(!button)continue;
          button.style.transform=`translate(${row.labelX-52}px,${row.labelY-16}px)`;
          button.style.visibility=row.visible?'visible':'hidden';}
      },onScoreUpdate:score=>callbacks.current.onScoreUpdate?.(score),
      onProgressUpdate:(done,total)=>callbacks.current.onProgressUpdate?.(done,total),
      onCheckpoint:(index,total)=>callbacks.current.onCheckpoint?.(index,total),
      onComplete:(...args)=>callbacks.current.onComplete?.(...args),onSessionStart:()=>callbacks.current.onSessionStart?.()});
    engine.current=current;
    callbacks.current.onEngineReady?.({pause:current.pause,resume:current.resume,markSupported:current.markSupported,debugSnapshot:current.debugSnapshot});
    return()=>{current.destroy();engine.current=null;map.clear();};
  },[difficulty,sessionSeed,journey,startLevel,progressScopeKey]);
  const focusPlay=()=>mount.current?.closest('.lg-game-player-main')?.focus({preventScroll:true});
  const onHold=(...args)=>engine.current?.hold(...args),onTap=action=>engine.current?.tap(action);
  const unavailable=delivery&&[...Object.values(delivery.assets||{}),...Object.values(delivery.actions||{})].includes('unavailable');
  return <section ref={mount} className={`rr-stage${unavailable?' is-art-unavailable':''}`} aria-label="Reel and Read fishing trip" data-child-real-play>
    {hud&&<>
      <div className="rr-cue" data-child-instruction>
        <button type="button" className="rr-hear" aria-label="Hear fishing clue again" disabled={!isSoundEnabled}
          onClick={()=>{engine.current?.replay();focusPlay();}}>
          {hud.picture.image&&<img src={hud.picture.image} alt={hud.picture.kind==='meaning-context'?'Meaning scene. Hear the clue.':'Clue picture. Hear its name.'}/>}
          <span>{isSoundEnabled?'Hear':'Sound off'}</span>
        </button>
        <div className="rr-cue-copy"><div className="rr-progress" data-child-progress><b>{hud.stage+1} / {hud.totalStages}</b><span>{hud.landedWords.length} / {hud.totalParts} caught</span></div>
          <h2>{hud.celebrating?hud.target:<><span className="rr-full-instruction">{hud.instruction}</span><span className="rr-compact-instruction">{hud.compactInstruction}</span></>}</h2>
          <div className={`rr-catch-slots${hud.taskMode==='meaning'?' is-meaning':''}`} aria-label={`${hud.acceptedWords.length} parts accepted; ${hud.landedWords.length} landed`}>
            {Array.from({length:hud.totalParts},(_,index)=><span key={index}
              className={`${hud.acceptedWords[index]?'is-accepted':''}${hud.landedWords.includes(hud.acceptedWords[index])?' is-landed':''}`}>
              <b className="rr-slot-word">{hud.acceptedWords[index]||'·'}</b><b className="rr-slot-mark" aria-hidden="true">{hud.acceptedWords[index]?'✓':'·'}</b>
              {hud.landedWords.includes(hud.acceptedWords[index])&&<i aria-label="landed">✓</i>}</span>)}
          </div>
          {!hud.celebrating&&!hud.fighting&&hud.hintMistakes>=2&&<small role="status" data-reel-hint>{hud.hint}</small>}
          {hud.fighting&&hud.compact&&<FishingLineMeter hud={hud} inline/>}
        </div>
      </div>
      <div role="group" aria-label="Swimming word fish" data-child-choices>{hud.choices.map(row=><button key={row.id} type="button"
        ref={element=>{if(element)choices.current.set(row.id,element);else choices.current.delete(row.id);}}
        className="rr-fish-control" data-reel-fish={row.id} aria-label={`Steer and cast toward ${row.word}`}
        onClick={event=>{engine.current?.aimFish(row.id,event.detail?'pointer':'assistive');focusPlay();}}/>)}</div>
      <div className="rr-feedback" role="status">{hud.coach||'Steer. Cast. Hold Reel; let go to ease.'}</div>
      <div className="rr-steer" role="group" aria-label="Boat steering">
        <FishingControl action="left" label="Steer boat left" onHold={onHold} onTap={onTap} onRelease={focusPlay}>‹</FishingControl>
        <FishingControl action="right" label="Steer boat right" onHold={onHold} onTap={onTap} onRelease={focusPlay}>›</FishingControl>
      </div>
      <FishingControl action="cast" className="rr-cast" primary label={hud.fighting?'Hold to reel; release to ease the line':'Cast fishing hook'}
        onHold={onHold} onTap={onTap} onRelease={focusPlay}>{hud.fighting?'Reel':'Cast'}</FishingControl>
      {hud.fighting&&!hud.compact&&<FishingLineMeter hud={hud}/>}
      {(hud.saveError||unavailable)&&<button type="button" className="rr-recovery"
        aria-label={hud.saveError?unavailable?'Retry saving and fishing art':'Try saving again':'Reload fishing art'}
        onClick={()=>{if(hud.saveError)engine.current?.retrySave();if(unavailable)engine.current?.retryArt();}}>
        <span>{hud.saveError?unavailable?'Retry':'Try':'Reload'}</span><span>{hud.saveError?'saving':'art'}</span>
      </button>}
    </>}
  </section>;
}
