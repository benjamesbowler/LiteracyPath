import { playCueAudio, playCueSequence, preloadCueAudio, stopCueAudio } from '../../utils/audio/cuePlayer.js';

// The canonical cue player owns the voice through media and silent gaps. This
// workspace adapter protects status callbacks across replay, navigation and errors.
export function createComprehensionPlayer({playSingle=playCueAudio,playSequence=playCueSequence,preload=preloadCueAudio,cancelAudio=stopCueAudio,onNote=()=>{},stopOtherAudio=()=>{}}={}) {
 let generation=0;let active=false;
 function cancel(){generation++;if(active){active=false;cancelAudio();}}
 function stop(message=''){cancel();onNote(message);}
 function play(clip){
  stopOtherAudio();cancel();
  const parts=Array.isArray(clip?.parts)&&clip.parts.length?clip.parts:clip?.path?[{path:clip.path,gapBeforeMs:0}]:[];
  if(clip?.status!=='ready'||!parts.length||parts.some(part=>!part.path)){
   onNote('Leda audio is unavailable. Read together, or try Listen again.');return false;
  }
  const token=generation;
  const onDelivery=event=>{
   if(generation!==token)return;
   if(event.type==='started')onNote('Playing with Leda.');
   else if(event.type==='completed'){active=false;onNote('Finished reading with Leda.');}
   else if(event.type==='interrupted'){active=false;generation++;onNote('Audio stopped.');}
   else if(event.type==='failed'||event.type==='unavailable'){
    active=false;generation++;cancelAudio();onNote('Leda audio could not play. Read together, or tap Listen to try again.');
   }
  };
  onNote('Loading Leda audio…');active=true;
  for(const part of parts)Promise.resolve(preload(part.path)).catch(()=>{});
  const options={cueId:`comprehension-${token}`,playImmediately:true,onDelivery};
  try{
   if(parts.length===1)playSingle(parts[0].path,options);
   else playSequence(parts.map(part=>part.path),{...options,gapMs:450});
   return true;
  }catch{cancel();onNote('Leda audio could not start. You can keep reading.');return false;}
 }
 return {play,stop,cancel};
}
