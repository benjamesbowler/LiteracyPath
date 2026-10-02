import { useEffect, useLayoutEffect, useRef } from 'react';
import { learningResponseRecoveryIssue } from '../../../../utils/learningResponseState.js';
export const phonicsSessionKey=(scope,mode,difficulty)=>`literacy-guide-phonics-play:${scope}:${mode}:${difficulty}`;
function sessionIssue(data){return data && (data.v!==1 || !Number.isInteger(data.round) || !data.gameState || [data.stage?.data?.recovery?.task?.episode,data.stage?.data?.learningEpisode,...(data.evidence?.assistedRetries||[]).map(row=>row.learningEpisode)].filter(Boolean).some(learningResponseRecoveryIssue)) ? 'unsupported_version' : '';}
export function loadPhonicsSession(key,startLevel){
 try{const data=JSON.parse(localStorage.getItem(key)||'null');if(sessionIssue(data))return{recoveryIssue:'unsupported_version'};if(data?.gameState && data.round!==Number(startLevel))return{recoveryIssue:'content_changed'};return data?.v===1 && data.gameState ? data : null;}catch{return{recoveryIssue:'unreadable'};}
}
export function savePhonicsSession(key,data){try{if(sessionIssue(JSON.parse(localStorage.getItem(key)||'null')))return false;if(data)localStorage.setItem(key,JSON.stringify({...data,v:1}));else localStorage.removeItem(key);return true;}catch{return false;}}
export function useStageSnapshot(snapshot,onSnapshot){
 const previous=useRef('');
 useLayoutEffect(()=>{const value=typeof snapshot==='function'?snapshot():snapshot;const encoded=JSON.stringify(value);if(encoded!==previous.current){previous.current=encoded;onSnapshot?.(value);}});
}

export function useResumeTransition(ready, advance, schedule, delay) {
 const scheduled=useRef(false);
 useEffect(()=>{if(ready && !scheduled.current){scheduled.current=true;schedule(advance,delay);}},[ready,advance,schedule,delay]);
}
