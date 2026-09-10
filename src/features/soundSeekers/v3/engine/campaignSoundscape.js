import { normalizeAudioPreferences } from '../../../../utils/audio/audioPreferences.js';
import { applyLearnerAudioIntensity } from '../../../../accessibility/learnerAccessibility.js';
export const CAMPAIGN_SOUNDS=Object.freeze({
 worlds:{meadow:{music:'/audio/music/meadow-loop.mp3',ambience:'/audio/music/quest/seedwake-meadow-ambience-loop.mp3'},dino:{music:'/audio/music/dino-loop.mp3',ambience:'/audio/music/quest/fossil-canyon-ambience-loop.mp3'},moonwood:{music:'/audio/music/moonwood-loop.mp3',ambience:'/audio/music/quest/lantern-forest-ambience-loop.mp3'}},
 effects:{jump:'/audio/ui/whoosh.mp3',pickup:'/audio/ui/pop.mp3',place:'/audio/ui/tap.mp3',launch:'/audio/ui/pop.mp3',route:'/audio/ui/card-flip.mp3',return:'/audio/ui/whoosh.mp3',correct:'/audio/ui/correct.mp3',repair:'/audio/ui/complete.mp3',complete:'/audio/ui/star.mp3'}
});
/** Owns non-speech audio only. Music remains opt-in under existing preferences. */
export function createCampaignSoundscape({preferences={},documentRef=globalThis.document,audioFactory=src=>typeof globalThis.Audio==='function'?new globalThis.Audio(src):null}={}){
 const prefs=normalizeAudioPreferences(preferences);
 let config={worldId:'meadow',enabled:prefs.soundEnabled,musicEnabled:prefs.musicEnabled,paused:false,speaking:false,quiet:preferences.quietSoundscape===true},disposed=false;
 const audioByPath=new Map(),desired=new Set(),requests=new Map();
 const hidden=()=>documentRef?.visibilityState==='hidden'||documentRef?.hidden===true;
 const active=()=>!disposed&&config.enabled&&!config.paused&&!config.speaking&&!hidden();
 function stop(audio,reset=false){desired.delete(audio);try{audio.pause();if(reset)audio.currentTime=0;}catch{/* Unloaded media has no seekable timeline. */}}
 function get(src,loop){
  if(!audioByPath.has(src)){const audio=audioFactory(src);if(!audio)return null;audio.loop=loop;audio.preload='auto';audioByPath.set(src,audio);if(!loop)audio.onended=()=>desired.delete(audio);}
  return audioByPath.get(src);
 }
 function play(audio){
  if(!audio)return;desired.add(audio);
  if(!audio.paused)return;
  const token={};requests.set(audio,token);
  try{const request=audio.play();if(request?.then){void request.then(()=>{if(disposed){stop(audio);return;}if(requests.get(audio)!==token)return;requests.delete(audio);if(!desired.has(audio))stop(audio);},()=>{if(requests.get(audio)===token){requests.delete(audio);desired.delete(audio);}});}}catch{requests.delete(audio);desired.delete(audio);}
 }
 function refresh(){
  const world=CAMPAIGN_SOUNDS.worlds[config.worldId];
  const continuous=active()&&config.musicEnabled&&!config.quiet&&world;
  const paths=continuous?[world.music,world.ambience]:[];
  for(const [src,audio]of audioByPath)if(audio.loop&&!paths.includes(src)||!active())stop(audio,!audio.loop);
  if(continuous)for(const [src,volume]of [[world.music,.14],[world.ambience,.08]]){const audio=get(src,true);if(audio){audio.volume=applyLearnerAudioIntensity(volume,documentRef);play(audio);}}
 }
 const visibility=()=>refresh();documentRef?.addEventListener?.('visibilitychange',visibility);
 return {
  configure(next={}){
   if(disposed)return;
   const updated={...config};
   if(next.worldId!==undefined)updated.worldId=next.worldId;
   for(const key of ['enabled','musicEnabled','paused','speaking','quiet'])if(typeof next[key]==='boolean')updated[key]=next[key];
   config=updated;refresh();
  },
  effect(kind){
   const src=CAMPAIGN_SOUNDS.effects[kind];if(!active()||!src)return false;
   // One short action sound at a time, never beneath a spoken teaching cue.
   for(const audio of audioByPath.values())if(!audio.loop)stop(audio,true);
   const audio=get(src,false);if(!audio)return false;
   audio.volume=applyLearnerAudioIntensity(config.quiet ? .08 : kind==='jump' ? .12 : .20,documentRef);play(audio);return true;
  },
  dispose(){
   if(disposed)return;disposed=true;documentRef?.removeEventListener?.('visibilitychange',visibility);
   for(const audio of audioByPath.values()){stop(audio,true);audio.onended=null;audio.removeAttribute?.('src');audio.load?.();}
   audioByPath.clear();desired.clear();
  }
 };
}
