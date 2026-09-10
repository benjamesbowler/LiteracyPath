import { useEffect, useLayoutEffect, useRef } from 'react';
export const phonicsSessionKey=(scope,mode,difficulty)=>`literacy-guide-phonics-play:${scope}:${mode}:${difficulty}`;
export function loadPhonicsSession(key,startLevel){
 try{const data=JSON.parse(localStorage.getItem(key)||'null');return data?.v===1 && data.round===Number(startLevel) && data.gameState ? data : null;}catch{return null;}
}
export function savePhonicsSession(key,data){try{if(data)localStorage.setItem(key,JSON.stringify({...data,v:1}));else localStorage.removeItem(key);}catch{/* A full storage device must never block gameplay. */}}
export function useStageSnapshot(snapshot,onSnapshot){
 const previous=useRef('');
 useLayoutEffect(()=>{const value=typeof snapshot==='function'?snapshot():snapshot;const encoded=JSON.stringify(value);if(encoded!==previous.current){previous.current=encoded;onSnapshot?.(value);}});
}

export function useResumeTransition(ready, advance, schedule, delay) {
 const scheduled=useRef(false);
 useEffect(()=>{if(ready && !scheduled.current){scheduled.current=true;schedule(advance,delay);}},[ready,advance,schedule,delay]);
}
