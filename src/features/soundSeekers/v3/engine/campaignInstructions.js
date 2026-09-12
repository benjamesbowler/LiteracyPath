import { DOMAINS,MECHANICS } from './challenges.js';

const sourcesFor=cues=>(cues||[]).map(cue=>cue?.src).filter(Boolean);

/** Select recorded learning speech from the current private checkpoint beat.
 * Autoplay and replay consume the same ordered plan. This pure selector never
 * credits exposure: only successful, still-current playback may use a teach
 * step's targetId. Empty teaching steps remain visible as missing delivery.
 * Motor introductions and learner-selected option audio are separate owners. */
export function campaignInstructionPlan(beat,state={}) {
  if(!beat)return [];
  if(beat.mechanic===MECHANICS.SIGNPOST)return (beat.view.cards||[]).map(card=>({
    kind:'teach',targetId:card.targetId,
    sources:[card.phonemeAudio,...(card.unitAudio||[]).map(unit=>unit.audio),
      card.baseAudio!==card.anchorAudio?card.baseAudio:null,card.anchorAudio].filter(Boolean)
  }));
  // Pronouncing an answer option would solve the grapheme-to-phoneme task.
  // Such items use only their authored instruction, never option/target audio.
  if(beat.mechanic===MECHANICS.ECHO_HUNT&&(beat.view.direction==='letter-to-sound'||beat.domain===DOMAINS.G2P)){
    const sources=sourcesFor(beat.prompt?.cues);return sources.length?[{kind:'instruction',sources}]:[];
  }
  if(beat.mechanic===MECHANICS.SOUND_SORT&&beat.view.mode!=='read'){
    const item=beat.view.items?.[state.itemIndex||0],sources=item?.audio?[item.audio]:[];
    return sources.length?[{kind:'instruction',sources}]:[];
  }
  // Read-mode sorting keeps its print/pronunciation decision intact. Speaking
  // the word here could supply its answer; preserve the authored prompt cues.
  const sources=sourcesFor(beat.prompt?.cues);
  return sources.length?[{kind:'instruction',sources}]:[];
}
