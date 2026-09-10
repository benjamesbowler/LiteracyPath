import { SOUND_SEEKERS_CAMPAIGN_PALETTE as P } from '../../visual/visualTokens.js';
import HERO_ANIMATIONS from '../content/heroAnimations.json' with { type: 'json' };
import { getImage } from './sprites.js';
export { HERO_ANIMATIONS };

/** Atlas frames have a measured ground anchor. Moving a character changes its
 * actual leg pose; changing speed changes the gait, while physics owns reach. */
export function drawCampaignHero(ctx,id,{x,y,height=112,facing=1,time=0,state='idle',reducedMotion=false}={}) {
  const atlas=HERO_ANIMATIONS[id],image=getImage(atlas?.src);
  if(!atlas||!image)return false;
  const moving=state==='walk',jumping=state==='jump',falling=state==='fall';
  const frameIndex=moving?Math.floor(time*atlas.fps)%atlas.frames.length:jumping?1:falling?Math.min(3,atlas.frames.length-1):0;
  const frame=atlas.frames[frameIndex],scale=height/atlas.referenceHeight;
  ctx.save();ctx.fillStyle=P['hero-shadow'];ctx.beginPath();ctx.ellipse(x,y+2,height*.35,7,0,0,Math.PI*2);ctx.fill();
  ctx.translate(x,y);ctx.scale(facing,1);
  if(jumping)ctx.rotate(-.035);if(falling)ctx.rotate(.025);
  if(!moving&&!jumping&&!falling&&!reducedMotion)ctx.scale(1,1+Math.sin(time*2)*.006);
  ctx.drawImage(image,frame.x,frame.y,frame.width,frame.height,-frame.anchorX*scale,-frame.anchorY*scale,frame.width*scale,frame.height*scale);
  ctx.restore();return true;
}
