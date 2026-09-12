import { getImage } from './sprites.js';
export const WORLD_MATERIALS='/game-assets/sound-seekers/campaign/environment/materials.png';
const patterns=new WeakMap();
/** Actual painted materials, attached to the world geometry (never a wallpaper). */
export function worldMaterial(ctx,world,kind='grass'){
  const image=getImage(WORLD_MATERIALS);if(!image||typeof document==='undefined')return null;
  let cache=patterns.get(ctx);if(!cache){cache=new Map();patterns.set(ctx,cache);}
  const row={meadow:0,dino:1,moonwood:2}[world]||0,col={grass:0,path:1,water:2,earth:3}[kind]||0,key=`${row}/${col}`;
  if(cache.has(key))return cache.get(key);
  const tile=document.createElement('canvas'),size=kind==='earth'?160:240;tile.width=size*2;tile.height=size*2;
  const c=tile.getContext('2d'),sw=image.naturalWidth/4,sh=image.naturalHeight/3;
  // Mirrored joins avoid visible hard seams in the material atlas.
  for(let y=0;y<2;y++)for(let x=0;x<2;x++){c.save();c.translate(x?size*2:0,y?size*2:0);c.scale(x?-1:1,y?-1:1);c.drawImage(image,col*sw+2,row*sh+2,sw-4,sh-4,0,0,size,size);c.restore();}
  const pattern=ctx.createPattern(tile,'repeat');cache.set(key,pattern);return pattern;
}
