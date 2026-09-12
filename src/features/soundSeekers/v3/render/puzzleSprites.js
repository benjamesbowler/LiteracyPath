import { getImage } from './sprites.js';
export const PUZZLE_SPRITES='/game-assets/sound-seekers/campaign/environment/puzzle-props.png';
export const PUZZLE_SPRITE_CELLS=Object.freeze(Object.fromEntries(['grass-platform','wood-platform','bridge','door','sign','lever','crate','basket','lantern','bucket','bedroll','chest','hedge','wheel','ladder','workbench'].map((name,index)=>[name,index])));
// Equal atlas cells retain their generated alpha. Runtime bounds trim transparent
// padding, preserving aspect ratio and feet registration without altering source.
const frames=new WeakMap();
function frameFor(image,index,rect){
  if(!frames.has(image))frames.set(image,new Map());const cache=frames.get(image);if(cache.has(index))return cache.get(index);
  const cell=image.naturalWidth/4,[x,y,width,height]=rect||[Math.floor(index%4*cell),Math.floor(Math.floor(index/4)*cell),Math.floor(cell),Math.floor(image.naturalHeight/4)];
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,x,y,width,height,0,0,width,height);
  const pixels=c.getImageData(0,0,width,height).data;let left=width,right=0,top=height,bottom=0;
  for(let yy=0;yy<height;yy++)for(let xx=0;xx<width;xx++)if(pixels[(yy*width+xx)*4+3]>24){left=Math.min(left,xx);right=Math.max(right,xx);top=Math.min(top,yy);bottom=Math.max(bottom,yy);}
  const frame={x:x+left,y:y+top,width:right-left+1,height:bottom-top+1};cache.set(index,frame);return frame;
}
export function drawPuzzleSprite(ctx,name,x,y,width=100,{alpha=1,flip=false}={}){
  const image=getImage(PUZZLE_SPRITES),index=PUZZLE_SPRITE_CELLS[name];if(!image||index===undefined)return false;
  const f=frameFor(image,index),height=width*f.height/f.width;ctx.save();ctx.translate(x,y);ctx.scale(flip?-1:1,1);ctx.globalAlpha*=alpha;ctx.drawImage(image,f.x,f.y,f.width,f.height,-width/2,-height,width,height);ctx.restore();return true;
}

export const LEARNING_SPRITES='/game-assets/sound-seekers/campaign/environment/learning-props.png';
// Authored rectangles follow the actual atlas, whose rows are not equally tall.
const learningFrames={
 button:[55,78,239,239],ribbon:[358,70,283,258],seat:[681,27,229,319],tree:[988,19,300,336],
 pond:[20,381,338,240],rail:[362,364,272,261],stool:[697,372,209,253],tray:[967,421,329,190],
 towel:[18,646,312,243],soap:[370,677,264,183],cloth:[673,655,303,254],brush:[1012,680,277,214],
 ball:[48,920,233,238],cushion:[328,924,313,246],hat:[655,941,334,220],bag:[1024,907,245,259]
};
export function drawLearningSprite(ctx,name,x,y,width=100){
 const image=getImage(LEARNING_SPRITES),rect=learningFrames[name];if(!image||!rect)return false;
 const f=frameFor(image,name,rect),height=width*f.height/f.width;ctx.drawImage(image,f.x,f.y,f.width,f.height,x-width/2,y-height,width,height);return true;
}
