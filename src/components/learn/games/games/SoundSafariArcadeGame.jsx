import { useEffect, useRef } from 'react';
import { startSoundSafari } from './soundSafariEngine.js';
import './SoundSafariArcadeGame.css';

export default function SoundSafariArcadeGame({difficulty='easy',startLevel=0,onScoreUpdate,onProgressUpdate,
  onComplete,onResultReady,onSessionStart,onCheckpoint,onEngineReady,isSoundEnabled=true}) {
  const root=useRef(null), handlers=useRef({}), sound=useRef(isSoundEnabled);
  useEffect(()=>{
    sound.current=isSoundEnabled;
    handlers.current={onScoreUpdate,onProgressUpdate,onComplete,onResultReady,onSessionStart,onCheckpoint,onEngineReady};
  },[isSoundEnabled,onScoreUpdate,onProgressUpdate,onComplete,onResultReady,onSessionStart,onCheckpoint,onEngineReady]);
  useEffect(()=>{
    const engine=startSoundSafari(root.current,{difficulty,startLevel,getSound:()=>sound.current,
      onScoreUpdate:(...args)=>handlers.current.onScoreUpdate?.(...args),
      onProgressUpdate:(...args)=>handlers.current.onProgressUpdate?.(...args),
      onComplete:(...args)=>handlers.current.onComplete?.(...args),
      onResultReady:(...args)=>handlers.current.onResultReady?.(...args),
      onSessionStart:(...args)=>handlers.current.onSessionStart?.(...args),
      onCheckpoint:(...args)=>handlers.current.onCheckpoint?.(...args)});
    handlers.current.onEngineReady?.(engine);
    return ()=>engine.teardown();
    // A saved checkpoint and score rerenders must not restart a live word.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[difficulty]);
  return <div className="ss-game" ref={root}/>;
}
