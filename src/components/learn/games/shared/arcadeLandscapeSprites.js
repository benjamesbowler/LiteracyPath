// Ground-registered views rendered from the retained Blender scene bank.
// The host's own simulation clock owns motion; no hidden timers or listeners.
const RECIPES = {
  'letter-leap': 'woodland', 'word-bridge': 'riverbank', 'reel-read': 'riverbank',
  'rhyme-pop': 'festival', 'sound-safari': 'woodland', 'sound-beat': 'band',
  'sentence-express': 'railway', soundkeys: 'band'
};
const FILES = {
  woodland:['broadleaf-tree','birch-canopy','flowering-shrub','woodland-rock','meadow-grass'],
  riverbank:['birch-canopy','flowering-shrub','woodland-rock','meadow-grass'],
  festival:['broadleaf-tree','flowering-shrub'],
  band:['broadleaf-tree','flowering-shrub','meadow-grass'],
  railway:['birch-canopy','flowering-shrub']
};
export function createArcadeLandscape(gameId, host, { ImageClass=globalThis.Image }={}) {
  const recipe=RECIPES[gameId]||'woodland',images=new Map();let disposed=false,wind=0;
  host.dataset.landscapeState='loading';
  let settled=0,failures=0;
  for(const id of FILES[recipe]){
    const image=new ImageClass();images.set(id,image);
    const finish=failed=>{if(disposed)return;settled++;failures+=Number(failed);if(settled===FILES[recipe].length)host.dataset.landscapeState=failures?'fallback':'ready';};
    image.onload=()=>finish(!image.naturalWidth);image.onerror=()=>finish(true);
    image.src='/game-assets/arcade-worlds/sprites/'+id+'.webp';
  }
  function drawAsset(ctx,id,x,ground,height,{mirror=false,opacity=1,sway=0}={}){
    const image=images.get(id);if(!image?.complete||!image.naturalWidth)return;
    const width=height*image.naturalWidth/image.naturalHeight;
    ctx.save();ctx.globalAlpha*=opacity;
    ctx.fillStyle='rgba(20,40,27,.15)';ctx.beginPath();ctx.ellipse(x,ground,width*.22,height*.025,0,0,Math.PI*2);ctx.fill();
    ctx.translate(x,ground);ctx.scale(mirror?-1:1,1);ctx.rotate(sway);ctx.drawImage(image,-width/2,-height,width,height);ctx.restore();
  }
  return {
    draw(ctx,{width:w,height:h,ground=h*.8,camera=0,time=0,world='meadow',reducedMotion=false,paused=false}={}) {
      if(disposed||!w||!h)return;
      if(reducedMotion)wind=0;else if(!paused)wind=Math.sin(time*.6)*.007;
      ctx.save();
      if(world==='moonwood')ctx.filter='brightness(.72) saturate(.8)';
      else if(world==='dino')ctx.filter='sepia(.14) saturate(.85)';
      const tree=recipe==='riverbank'||recipe==='railway'?'birch-canopy':'broadleaf-tree';
      const positions=recipe==='woodland'?[-.12,.15,.78,1.09]:[-.04,1.04];
      positions.forEach((x,i)=>{
        let at=x*w;
        if(camera)at=((at-camera*.24+w*.3)%(w*1.4)+w*1.4)%(w*1.4)-w*.2;
        drawAsset(ctx,tree,at,ground-h*.025,h*(recipe==='band'?.74:.6)+(i%2)*h*.13,{mirror:i%2===0,opacity:recipe==='band'?.7:.88,sway:wind*(i%2?1:-1)});
      });
      if(recipe==='riverbank')for(const [x,size] of [[.02,.14],[.97,.18]])drawAsset(ctx,'woodland-rock',w*x,ground+h*.022,h*size);
      for(const side of [-1,1]){
        const x=side<0?w*.04:w*.96;
        drawAsset(ctx,'flowering-shrub',x,ground+h*.014,h*.105,{mirror:side<0});
        if(images.has('meadow-grass'))drawAsset(ctx,'meadow-grass',x+side*w*.055,ground+h*.025,h*.07,{mirror:side>0});
      }
      ctx.restore();
    },
    dispose(){disposed=true;for(const image of images.values()){image.onload=null;image.onerror=null;image.src='';}images.clear();}
  };
}
