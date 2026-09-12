const axis=value=>{const n=Number.isFinite(value)?Math.max(-1,Math.min(1,value)):0;return Math.abs(n)<.18?0:Math.sign(n)*Math.min(1,(Math.abs(n)-.18)/.82);};
export function readAdventureGamepad(pad){
  if(!pad?.connected)return null;const pressed=i=>Boolean(pad.buttons?.[i]?.pressed);
  return {analogX:pressed(14)?-1:pressed(15)?1:axis(pad.axes?.[0]),analogY:pressed(12)?-1:pressed(13)?1:axis(pad.axes?.[1]),lookX:axis(pad.axes?.[2]),jump:pressed(0),sprint:pressed(1),interact:pressed(2),pause:pressed(9)};
}
// Diffing avoids a neutral controller cancelling a touch/keyboard action every
// frame. A disconnect releases every held controller action exactly once.
export function createAdventureGamepad({onInput,onInteract,onPause,onRelease}){
  let previous=null,blocked=false;
  return {poll(pads,paused=false){const next=readAdventureGamepad([...pads||[]].find(p=>p?.connected&&p.mapping==='standard'));
    if(next?.pause&&!previous?.pause)onPause();
    if(paused){if(!blocked)onRelease();blocked=true;previous=next;return;}
    if(blocked){blocked=false;previous=next;return;}
    if(!next){if(previous)onRelease();previous=null;return;}
    for(const key of ['analogX','analogY','lookX','jump','sprint'])if(next[key]!==previous?.[key]&&(previous||next[key]))onInput(key,next[key]);
    if(next.interact&&!previous?.interact)onInteract();previous=next;
  },release(){if(previous)onRelease();previous=null;}};
}

export function adventureStickVector(dx,dy,radius=48){
 if(!Number.isFinite(dx)||!Number.isFinite(dy))return {x:0,y:0};
 const length=Math.hypot(dx,dy),amount=Math.max(0,Math.min(1,(length/radius-.12)/.88));
 return length?{x:dx/length*amount,y:dy/length*amount}:{x:0,y:0};
}
