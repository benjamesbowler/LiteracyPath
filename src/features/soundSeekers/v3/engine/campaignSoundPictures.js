import { getChildWordAsset } from '../../../../data/childAssets.js';
import { DOMAINS,MECHANICS } from './challenges.js';
import { targetInfo,wordImage } from './lexicon.js';

/** An explicitly supported sound anchor, never an independent reading clue.
 * Saved presentation fields cannot substitute a different word or picture.
 * Null means this task/target has no suitable canonical picture; do not guess.
 * Callers mark scored support only after the selected image actually loads. */
export function soundPictureCue(beat,{targetId:requestedTarget}={}) {
  if(!beat)return null;
  let targetId;
  if(beat.mechanic===MECHANICS.SIGNPOST)targetId=requestedTarget||beat.targetIds?.[0];
  else if(beat.mechanic===MECHANICS.ECHO_HUNT&&[DOMAINS.P2G,DOMAINS.G2P].includes(beat.domain)){
    targetId=beat.key?.optionTargets?.[beat.key.optionId];
    if(requestedTarget&&requestedTarget!==targetId)return null;
  }else return null;
  if(!targetId||!beat.targetIds?.includes(targetId))return null;
  const info=targetInfo(targetId),word=info?.anchorWord,image=word?wordImage(word):'';
  if(!image)return null;
  return {targetId,grapheme:info.grapheme,word,image,audio:getChildWordAsset(word)?.audio||''};
}
