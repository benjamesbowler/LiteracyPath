import { arcadeDampingFactor } from '../shared/arcadeFramePolicy.js';
import { arcadePixelRatio } from '../shared/arcadeRenderBudget.js';
import { createRenderer, disposeObject, disposeRenderer, attachContextLossGuard, detectQualityTier } from '../shared/threeShell.js';
import { createPalFigure, animatePalFigure, createWorldTree, createWoodMaterial, createGraphemeTexture } from '../shared/physicalArcadeWorld.js';
import { physicalPalFrame } from '../shared/physicalPalArt.js';
import { towerTumbleHammerAngle, TOWER_TUMBLE_STRIKE_SECONDS, TOWER_TUMBLE_CONTACT_SECONDS } from '../../../../utils/towerTumbleRules.js';
import { TOWER_TUMBLE_SCENE_KIT, cropTowerArt, towerArtTexture, towerBrickCanvas, drawTowerPal } from './towerTumbleSceneKit.js';

const cameraTargetY=(actorY,rescueProgress,rescuing,halfHeight)=>{
  const base=Math.min(3.8,Math.max(.9,halfHeight-2.4));
  const lead=Math.min(2.2,Math.max(.9,halfHeight*.54));
  // Keep the highest playable ledge below the floating cue as the camera
  // follows it. Capping at 7.5 concealed the level-9 actor on short screens.
  const ceiling=9+lead;
  return rescuing?Math.min(ceiling,3.8+rescueProgress*6):Math.max(base,Math.min(ceiling,actorY+lead));
};
// The fallback draws the SAME platforms, ladders, collisions and choices. It
// changes the renderer only; it cannot turn a spelling choice into a model.
function drawCanvasPal(ctx,world,x,y,scale,facing=1,smash=0,moving=false,time=0) {
  ctx.save();ctx.translate(x,y);ctx.scale(facing,1);
  const ellipse=(color,px,py,rx,ry)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(px*scale,py*scale,rx*scale,ry*scale,0,0,Math.PI*2);ctx.fill();};
  const gait=moving?Math.sin(time*9)*.10:0;
  if(world==='dino') {
    ctx.fillStyle='#ef9a32';ctx.beginPath();ctx.moveTo(-.22*scale,-.52*scale);ctx.quadraticCurveTo(-.8*scale,-.24*scale,-.91*scale,-.71*scale);ctx.quadraticCurveTo(-.83*scale,-.16*scale,-.20*scale,-.22*scale);ctx.fill();
    ellipse('#ef9a32',-.21,-.21+gait,.18,.21);ellipse('#ef9a32',.20,-.21-gait,.18,.21);
    ellipse('#ef9a32',0,-.88,.41,.52);ellipse('#ffe3a0',.1,-.86,.26,.36);ellipse('#ef9a32',.12,-1.57,.46,.41);ellipse('#ef9a32',.37,-1.50,.39,.23);
    ctx.fillStyle='#fff1d6';ctx.beginPath();ctx.moveTo(-.21*scale,-1.29*scale);ctx.lineTo(.26*scale,-1.28*scale);ctx.lineTo(.10*scale,-1.05*scale);ctx.fill();
    ellipse('#613521',.48,-1.44,.15,.04);ellipse('#cf7131',.63,-1.62,.025,.027);
    for(let n=0;n<3;n++){ctx.fillStyle='#ef9a32';ctx.beginPath();ctx.moveTo((-.20+n*.2)*scale,-1.92*scale);ctx.lineTo((-.14+n*.2)*scale,-2.09*scale);ctx.lineTo((-.07+n*.2)*scale,-1.93*scale);ctx.fill();}
  } else if(world==='moonwood') {
    ellipse('#785037',-.16,-.16+gait,.14,.18);ellipse('#785037',.16,-.16-gait,.14,.18);
    ellipse('#577743',0,-.90,.29,.38);ctx.fillStyle='#577743';ctx.beginPath();ctx.moveTo(-.30*scale,-.93*scale);ctx.lineTo(-.39*scale,-.49*scale);ctx.lineTo(.36*scale,-.49*scale);ctx.lineTo(.25*scale,-.94*scale);ctx.fill();
    ctx.fillStyle='#785037';ctx.fillRect(-.3*scale,-.78*scale,.59*scale,.10*scale);ctx.fillStyle='#d69b43';ctx.fillRect(-.06*scale,-.78*scale,.12*scale,.10*scale);
    ellipse('#f2cb99',.03,-1.63,.33,.37);
    for(const side of[-1,1]){ctx.fillStyle='#f2cb99';ctx.beginPath();ctx.moveTo(side*.22*scale,-1.73*scale);ctx.lineTo(side*.58*scale,-1.93*scale);ctx.lineTo(side*.31*scale,-1.52*scale);ctx.fill();}
    ellipse('#82512e',-.02,-1.87,.35,.20);ctx.fillStyle='#82512e';ctx.beginPath();ctx.moveTo(-.28*scale,-1.95*scale);ctx.lineTo(.32*scale,-1.9*scale);ctx.lineTo(.17*scale,-1.63*scale);ctx.lineTo(.08*scale,-1.8*scale);ctx.lineTo(-.14*scale,-1.58*scale);ctx.fill();
    ellipse('#f2cb99',.18,-1.59,.08,.09);ellipse('#f2cb99',-.34,-.96,.095,.12);
  } else {
    ctx.strokeStyle='#c3d1d8';ctx.lineWidth=scale*.07;for(const xx of[-.2,.2]){ctx.beginPath();for(let i=0;i<9;i++){const yy=(-.2-i*.065+gait*(xx<0?1:-1))*scale;ctx.lineTo((xx+(i%2?.08:-.08))*scale,yy);}ctx.stroke();}
    ctx.fillStyle='#684631';ctx.fillRect(-.32*scale,-.15*scale,.24*scale,.14*scale);ctx.fillRect(.08*scale,-.15*scale,.24*scale,.14*scale);
    ellipse('#ffd35b',0,-.95,.36,.45);ellipse('#ffd35b',.16,-1.53,.35,.32);ellipse('#ffc648',-.2,-1.6,.18,.10);
    ctx.fillStyle='#df493b';ctx.fillRect(-.25*scale,-1.26*scale,.63*scale,.13*scale);
  }
  ellipse('white',.25,-1.67,.075,.10);ellipse('#30281f',.28,-1.67,.035,.05);
  if(smash!==null){ctx.save();ctx.translate(.38*scale,-1.0*scale);ctx.rotate(smash>0?-1.3+smash*2: -.3);ctx.fillStyle='#835637';ctx.fillRect(0,-.05*scale,.75*scale,.1*scale);ctx.fillStyle='#b98750';ctx.fillRect(.52*scale,-.27*scale,.46*scale,.45*scale);ctx.restore();}
  ctx.restore();
}

function createTowerSourceCanvasWorld(mount,theme) {
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  mount.replaceChildren(canvas); let width=800,height=450,viewY=3.8,firstDraw=true;
  const resize=()=>{width=Math.max(1,mount.clientWidth);height=Math.max(1,mount.clientHeight);const dpr=arcadePixelRatio(1.5, width, height);canvas.width=width*dpr;canvas.height=height*dpr;canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;ctx?.setTransform(dpr,0,0,dpr,0,0);};
  resize();
  return {resize,profile:()=>({quality:'2d',drawCalls:0,triangles:null,geometries:null,textures:null,pixelRatio:arcadePixelRatio(1.5, width, height)}),dispose(){canvas.remove();},draw(scene){if(!ctx)return;
    const {state,geometry,barrels,lift,elapsed,smash,round}=scene;
    const scale=Math.min(width/19,height/2.1),ox=width/2;
    const desired=cameraTargetY(state.actor.y,scene.rescueProgress,state.phase==='rescue',height/(2*scale));if(firstDraw){viewY=desired;firstDraw=false;}else viewY+=(desired-viewY)*(scene.reduced?1:arcadeDampingFactor(scene.dt??1/60,.08));
    const p=(x,y)=>[ox+x*scale,height*.5+(viewY-y)*scale];
    const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,theme.sky);sky.addColorStop(1,theme.id==='moonwood'?'#506677':theme.id==='dino'?'#f8e3ba':'#e6f1cc');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
    if(theme.id==='moonwood'){ctx.fillStyle='#ecdeb7';for(let n=0;n<30;n++){const sx=(n*97)%width,sy=(n*41)%(height*.65);ctx.fillRect(sx,sy,n%4===0?3:1.5,n%4===0?3:1.5);}ctx.beginPath();ctx.arc(width*.8,height*.19,scale*.6,0,Math.PI*2);ctx.fill();ctx.fillStyle=theme.sky;ctx.beginPath();ctx.arc(width*.8+scale*.2,height*.19-scale*.1,scale*.6,0,Math.PI*2);ctx.fill();}
    for(let i=0;i<8;i++){const[x,y]=p(-13+i*3.7,-3+(i%3));ctx.fillStyle=theme.ground;ctx.beginPath();ctx.ellipse(x,y,scale*5,scale*6,0,0,Math.PI*2);ctx.fill();}
    if(theme.id==='dino'){for(const vx of[-13,13]){const[x,y]=p(vx,5);ctx.fillStyle='#9d8065';ctx.beginPath();ctx.moveTo(x-5*scale,y+7*scale);ctx.lineTo(x,y-3*scale);ctx.lineTo(x+5*scale,y+7*scale);ctx.fill();ctx.fillStyle='#e49b53';ctx.beginPath();ctx.ellipse(x,y-2.8*scale,scale,.26*scale,0,0,Math.PI*2);ctx.fill();}}
    for(let i=0;i<8;i++){const[x,y]=p(-16+i*4.6,1);ctx.strokeStyle=theme.wood;ctx.lineWidth=scale*.18;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-scale*3);ctx.stroke();ctx.fillStyle=theme.foliage;
      if(theme.id==='dino'){for(let n=0;n<7;n++){ctx.save();ctx.translate(x,y-scale*3);ctx.rotate(-1.4+n*.45);ctx.beginPath();ctx.ellipse(0,-scale,scale*.18,scale*1.3,0,0,Math.PI*2);ctx.fill();ctx.restore();}}
      else{ctx.beginPath();ctx.ellipse(x,y-scale*3,scale*1.2,scale*1.8,0,0,Math.PI*2);ctx.fill();}}
    const[tx,ty]=p(-3.8,11);ctx.fillStyle=round.tower===1?theme.wood:theme.stone;ctx.fillRect(tx,ty,7.6*scale,13*scale);
    ctx.strokeStyle=theme.wood;ctx.lineWidth=2;for(let row=0;row<16;row++){const y=ty+row*scale*.7;ctx.beginPath();ctx.moveTo(tx,y);ctx.lineTo(tx+7.6*scale,y);ctx.stroke();}
    if(theme.id==='dino'){const[x,y]=p(-.5,6.6);ctx.strokeStyle='#f6e7b8';ctx.lineWidth=scale*.1;ctx.beginPath();ctx.moveTo(x-1.3*scale,y);ctx.lineTo(x+1.4*scale,y);ctx.stroke();for(let n=0;n<6;n++){ctx.beginPath();ctx.ellipse(x+(-1+n*.45)*scale,y,.2*scale,.7*scale,.3,0,Math.PI);ctx.stroke();}}
    const mushroom=(mx,my,size)=>{const[x,y]=p(mx,my);ctx.fillStyle='#b8b8cc';ctx.fillRect(x-size*.1*scale,y-size*scale,size*.2*scale,size*scale);ctx.fillStyle='#705b9a';ctx.beginPath();ctx.ellipse(x,y-size*scale,size*.55*scale,size*.32*scale,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#ebd6a0';for(let n=0;n<3;n++){ctx.beginPath();ctx.arc(x+(n-1)*size*.23*scale,y-size*1.12*scale,size*.07*scale,0,Math.PI*2);ctx.fill();}};
    if(theme.id==='moonwood'){if(round.tower===1)mushroom(0,-1,13);for(const mx of[-10,-8,9,12])mushroom(mx,-.6,1.3+Math.abs(mx)%3);}
    for(const platform of geometry.platforms){const[x,y]=p(platform.x-platform.width/2,platform.y);ctx.fillStyle=theme.wood;ctx.fillRect(x,y,platform.width*scale,.36*scale);ctx.fillStyle=theme.accent;ctx.fillRect(x,y,platform.width*scale,.11*scale);for(let k=0;k<platform.width;k++){ctx.fillStyle='#654630';ctx.fillRect(x+k*scale,y,2,.3*scale);}}
    for(const ladder of geometry.ladders){const[x,y]=p(ladder.x,ladder.top+.35);ctx.strokeStyle=theme.wood;ctx.lineWidth=Math.max(3,scale*.08);for(const side of[-.38,.38]){ctx.beginPath();ctx.moveTo(x+side*scale,y);ctx.lineTo(x+side*scale,p(ladder.x,ladder.bottom)[1]);ctx.stroke();}for(let yy=ladder.bottom+.2;yy<ladder.top+.2;yy+=.36){const sy=p(ladder.x,yy)[1];ctx.beginPath();ctx.moveTo(x-.38*scale,sy);ctx.lineTo(x+.38*scale,sy);ctx.stroke();}}
    for(const wall of geometry.shortcuts.filter(w=>!state.broken.includes(w.id))){const[x,y]=p(wall.x,wall.y+1.4);ctx.fillStyle=theme.stone;ctx.fillRect(x-.5*scale,y,scale,1.4*scale);ctx.strokeStyle='#654430';ctx.beginPath();ctx.moveTo(x+.2*scale,y);ctx.lineTo(x-.1*scale,y+.6*scale);ctx.lineTo(x+.3*scale,y+1.1*scale);ctx.stroke();}
    for(const brick of round.bricks){const[x,y]=p(brick.x,brick.y+1.15);ctx.fillStyle=theme.id==='moonwood'?'#ddd1ee':'#e5b3a0';ctx.fillRect(x-.52*scale,y,1.04*scale,scale);ctx.strokeStyle=theme.wood;ctx.lineWidth=3;ctx.strokeRect(x-.52*scale,y,1.04*scale,scale);ctx.fillStyle='#30281f';ctx.font=`600 ${Math.max(18,scale*.65)}px Fredoka,sans-serif`;ctx.textAlign='center';ctx.fillText(brick.chunk,x,y+.75*scale);}
    const[lx,ly]=p(geometry.movingPlatform.x-.8,lift);ctx.fillStyle=theme.wood;ctx.fillRect(lx,ly,1.6*scale,.25*scale);
    const[cx,cy]=p(7,state.phase==='rescue'?3+scene.rescueProgress*6:3);ctx.strokeStyle=theme.accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx,p(7,11.5)[1]);ctx.stroke();ctx.fillStyle=theme.wood;ctx.fillRect(cx-.65*scale,cy-1.2*scale,1.3*scale,1.2*scale);drawCanvasPal(ctx,theme.id,cx,cy-.10*scale,scale*.48,1,null);
    if(theme.id==='moonwood'){for(const yy of[2,5,8]){const[x,y]=p(-7.6,yy);ctx.fillStyle='#f7c97b';ctx.fillRect(x-.16*scale,y-.32*scale,.32*scale,.45*scale);ctx.strokeStyle='#75658b';ctx.strokeRect(x-.2*scale,y-.36*scale,.4*scale,.54*scale);}}
    for(const barrel of barrels){const[x,y]=p(barrel.x,barrel.y+.43);ctx.save();ctx.translate(x,y);ctx.rotate(barrel.spin);ctx.fillStyle=theme.wood;ctx.beginPath();ctx.arc(0,0,.43*scale,0,Math.PI*2);ctx.fill();ctx.strokeStyle=theme.id==='moonwood'?'#c6b9dd':'#394853';ctx.lineWidth=scale*.07;ctx.stroke();ctx.beginPath();ctx.moveTo(-.4*scale,0);ctx.lineTo(.4*scale,0);ctx.stroke();ctx.restore();}
    for(const token of geometry.collectibles.filter(a=>!state.collected.includes(a.id))){const[x,y]=p(token.x,token.y);ctx.fillStyle=theme.accent;ctx.beginPath();ctx.arc(x,y,.23*scale,0,Math.PI*2);ctx.fill();}
    const[x,y]=p(state.actor.x,state.actor.y);ctx.save();ctx.globalAlpha=state.immunity>0?(scene.reduced?.65:.65+Math.sin(elapsed*Math.PI*2)*.15):1;drawCanvasPal(ctx,theme.id,x,y,scale*.85,state.actor.facing,smash,Math.abs(scene.velocity)>.05||state.actor.climbing,elapsed);ctx.restore();
    if(!scene.reduced&&theme.id!=='moonwood'){ctx.fillStyle='rgba(255,255,255,.55)';for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse((i*width*.3+elapsed*3)%(width+120)-60,35+i%2*55,60,19,0,0,Math.PI*2);ctx.fill();}}
  }};
}

export function createTowerCanvasWorld(mount,theme,kit) {
  if(!kit?.materials&&!kit?.props&&!kit?.landscape&&!kit?.pal)return createTowerSourceCanvasWorld(mount,theme);
  const canvas=document.createElement('canvas'),context=canvas.getContext('2d');mount.replaceChildren(canvas);
  let width=800,height=450,viewY=3.8,firstDraw=true,cachedRound=null,brickFaces=new Map();
  const materials=new Map(),props=new Map();
  if(context&&kit.materials)for(const key of['stone','timber','bark','brick']){
    const tile=cropTowerArt(kit.materials,TOWER_TUMBLE_SCENE_KIT.materials[key]);materials.set(key,context.createPattern(tile,'repeat'));
  }
  if(kit.props)for(const[key,bounds]of Object.entries(TOWER_TUMBLE_SCENE_KIT.props))props.set(key,cropTowerArt(kit.props,bounds));
  const resize=()=>{width=Math.max(1,mount.clientWidth);height=Math.max(1,mount.clientHeight);const ratio=arcadePixelRatio(1.5, width, height);canvas.width=width*ratio;canvas.height=height*ratio;canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;context?.setTransform(ratio,0,0,ratio,0,0);};resize();
  return {resize,profile:()=>({quality:'2d',drawCalls:0,triangles:null,geometries:null,textures:null,pixelRatio:arcadePixelRatio(1.5, width, height),art:{...kit.delivery,hero:kit.pal?'delivered':'unavailable'},sceneStyle:'authored-physical-diorama'}),dispose(){canvas.remove();brickFaces.clear();materials.clear();props.clear();},draw(data){
    if(!context)return;const{state,geometry,round,elapsed,barrels,reduced,rescueProgress,smash}=data,scale=Math.min(width/19,height/2.1),ox=width/2;
    const desired=cameraTargetY(state.actor.y,rescueProgress,state.phase==='rescue',height/(2*scale));
    if(firstDraw){viewY=desired;firstDraw=false;}else viewY+=(desired-viewY)*(reduced?1:arcadeDampingFactor(data.dt??1/60,.085));
    const point=(x,y)=>[ox+x*scale,height*.5+(viewY-y)*scale];
    const plank=(kind,x,y,w,h,color=theme.wood)=>{
      const[sx,sy]=point(x,y),pattern=materials.get(kind);
      if(pattern)pattern.setTransform(new DOMMatrix().scale(scale/(kind==='stone'?145:180)));
      context.fillStyle=pattern||color;context.fillRect(sx,sy,w*scale,h*scale);
    };
    const prop=(key,x,y,w,h,angle=0)=>{
      const image=props.get(key);if(!image)return false;const[sx,sy]=point(x,y);
      context.save();context.translate(sx,sy);context.rotate(angle);context.drawImage(image,-w*scale/2,-h*scale/2,w*scale,h*scale);context.restore();return true;
    };
    context.fillStyle=theme.sky;context.fillRect(0,0,width,height);
    if(kit.landscape){const ratio=kit.landscape.naturalWidth/kit.landscape.naturalHeight,bw=Math.max(width*1.2,height*1.2*ratio),bh=bw/ratio;
      const shift=Math.max(height-bh,Math.min(0,(height-bh)/2-viewY*scale*.20));context.drawImage(kit.landscape,(width-bw)/2,shift,bw,bh);}
    if(round.tower===1){
      if(theme.id==='moonwood'&&props.has('mushrooms'))prop('mushrooms',0,6,13,15);
      else{plank('bark',-2.25,13.2,4.5,16,theme.wood);for(const[x,y,size]of[[-4,12,5.5],[1,14,6],[5,11.9,5.5],[-1,11.8,5]])prop('fern',x,y,size,size*.92);}
    }else{
      const top=round.tower===2?6.8:13.0;plank('stone',-3.55,top,7.1,top+2.0,theme.stone);
      const[left,upper]=point(-3.55,top),gradient=context.createLinearGradient(left,0,left+7.1*scale,0);
      gradient.addColorStop(0,'rgba(52,43,29,.25)');gradient.addColorStop(.25,'rgba(255,239,207,.03)');gradient.addColorStop(.7,'rgba(41,33,26,.12)');gradient.addColorStop(1,'rgba(41,33,26,.38)');context.fillStyle=gradient;context.fillRect(left,upper,7.1*scale,(top+2)*scale);
      for(const y of[1.75,4.8,7.8])if(y<top-1){
        plank('timber',-.1,y+.68,1.0,1.36);const[x,wy]=point(.02,y+.56);context.fillStyle=theme.id==='moonwood'?'#edbc71':'#344651';context.fillRect(x,wy,.76*scale,1.12*scale);
        plank('stone',-.30,y+.88,.3,1.75,theme.stone);plank('stone',.91,y+.88,.3,1.75,theme.stone);plank('stone',-.33,y+.88,1.57,.24,theme.stone);plank('stone',-.33,y-.69,1.57,.24,theme.stone);plank('timber',.37,y+.56,.08,1.12);plank('timber',.02,y+.04,.76,.08);
      }
      if(round.tower===2){for(const x of[-5.2,4.7])plank('timber',x-.25,11.6,.5,12.3);plank('timber',-6.4,11.6,12.4,.43);}
    }
    for(const[x,y,w]of[[-3.4,1.6,1.5],[2.8,4.6,1.45],[-3,7.5,1.65],[3.3,10.5,1.4]])prop('ivy',x,y,w,w*2.15);
    for(const x of[-10.5,10.8])prop(theme.id==='moonwood'?'mushrooms':'fern',x,1,6,5.6);
    if(theme.id==='dino')for(const y of[1.9,8.0]){const[x,sy]=point(-1.7,y);context.strokeStyle='#e4d5aa';context.lineWidth=scale*.10;for(let n=0;n<6;n++){context.beginPath();context.ellipse(x+n*.5*scale,sy,.22*scale,.35*scale,0,0,Math.PI);context.stroke();}}
    for(const platform of geometry.platforms){
      plank('timber',platform.x-platform.width/2,platform.y+.065,platform.width,.29);
      plank('timber',platform.x-platform.width/2,platform.y+.04,platform.width,.43);
      for(const side of[-1,1])prop(side<0?'leftBeamAnchor':'rightBeamAnchor',platform.x+side*(platform.width/2-.72),platform.y-.87,1.22,1.86);
      if(!reduced)prop('bunting',platform.x,platform.y-.77,3.8,1.15);
    }
    for(const ladder of geometry.ladders){const h=ladder.top-ladder.bottom+.46;
      if(!prop('ladder',ladder.x,(ladder.top+ladder.bottom)/2+.12,1.1,h)){
        plank('timber',ladder.x-.4,ladder.top+.35,.14,h);plank('timber',ladder.x+.3,ladder.top+.35,.14,h);for(let y=ladder.bottom+.2;y<ladder.top+.3;y+=.38)plank('timber',ladder.x-.4,y,.8,.11);
      }
    }
    for(const wall of geometry.shortcuts)if(!state.broken.includes(wall.id)){plank('stone',wall.x-.60,wall.y+1.35,1.2,1.35,theme.stone);const[x,y]=point(wall.x+.1,wall.y+1.15);context.strokeStyle='#655346';context.lineWidth=3;context.beginPath();context.moveTo(x,y);context.lineTo(x-.18*scale,y+.5*scale);context.lineTo(x+.11*scale,y+.9*scale);context.stroke();}
    if(cachedRound!==round.roundId){brickFaces.clear();cachedRound=round.roundId;for(const brick of round.bricks)brickFaces.set(brick.chunk,towerBrickCanvas(kit,brick.chunk));}
    for(let n=0;n<round.bricks.length;n++){const brick=round.bricks[n],size=data.struck===n?Math.max(.02,1-Math.max(0,data.impactAge-TOWER_TUMBLE_CONTACT_SECONDS)*3):1,[x,y]=point(brick.x,brick.y+.66);
      context.save();context.translate(x,y);context.rotate(data.shaken===n&&!reduced?Math.sin(elapsed*28)*.07:0);context.scale(size,size);
      const stone=materials.get('stone');if(stone)stone.setTransform(new DOMMatrix().scale(scale/145));context.fillStyle=stone||theme.stone;context.fillRect(-.68*scale,-.48*scale,1.36*scale,1.10*scale);
      context.fillStyle='#8c624f';context.beginPath();context.moveTo(.51*scale,-.51*scale);context.lineTo(.68*scale,-.64*scale);context.lineTo(.68*scale,.38*scale);context.lineTo(.51*scale,.51*scale);context.closePath();context.fill();
      context.fillStyle='#d8ab87';context.beginPath();context.moveTo(-.51*scale,-.51*scale);context.lineTo(-.34*scale,-.64*scale);context.lineTo(.68*scale,-.64*scale);context.lineTo(.51*scale,-.51*scale);context.closePath();context.fill();
      const face=brickFaces.get(brick.chunk);if(face)context.drawImage(face,-.51*scale,-.51*scale,1.02*scale,1.02*scale);context.restore();
    }
    const rescueY=state.phase==='rescue'?3+rescueProgress*6:3,[cx,cy]=point(6.85,rescueY+.15);
    const[ropeX,ropeY]=point(6.85,11);context.strokeStyle='#b9a17b';context.lineWidth=Math.max(2,scale*.06);context.beginPath();context.moveTo(ropeX,ropeY);context.lineTo(cx,cy);context.stroke();
    if(!prop('cage',6.85,rescueY+.72,1.58,1.70))plank('timber',6.2,rescueY+1.3,1.3,1.3);
    if(!drawTowerPal(context,kit,cx,cy-.19*scale,scale*2.2*.46,{direction:'front',time:elapsed,action:state.phase==='rescue'?'celebrate':'idle'}))drawCanvasPal(context,theme.id,cx,cy-.19*scale,scale*.46,1,null);
    for(const dx of[-.61,.61])plank('timber',6.85+dx-.045,rescueY+1.46,.09,1.27);plank('timber',6.2,rescueY+.24,1.31,.09);
    prop('pulley',6.85,10.35,.76,1.55,rescueProgress*.2);
    const lx=geometry.movingPlatform.x;plank('timber',lx-.9,data.lift,1.8,.23);prop('beam',lx,data.lift-.60,1.85,1.15);
    for(const dx of[-.65,.65]){const[x,y]=point(lx+dx,10);context.beginPath();context.moveTo(x,y);context.lineTo(x,point(lx+dx,data.lift)[1]);context.stroke();}
    if(round.tower===0){const[x,y]=point(-.3,11.8);context.save();context.translate(x,y);context.rotate(reduced?0:elapsed*.13);for(let n=0;n<4;n++){context.save();context.rotate(n*Math.PI/2);context.fillStyle=theme.wood;context.fillRect(-.08*scale,-3.3*scale,.16*scale,3.3*scale);context.fillStyle='#e6d4b1';context.fillRect(.05*scale,-3*scale,.65*scale,2.1*scale);context.restore();}context.restore();}
    const foreground=theme.id==='moonwood'?'mushrooms':theme.id==='dino'?'fern':'flowers';for(const[x,y,size]of[[-8.1,-.76,3],[8,-.8,2.8],[-6.8,5.9,1.5],[5.8,9,1.4]])prop(foreground,x,y,size,size*.94);
    if(theme.id==='moonwood')for(const y of[1.7,4.7,7.7])for(const x of[-7.5,7.2])prop('lantern',x,y,.6,1.15);
    for(const barrel of barrels)if(!prop('barrel',barrel.x,barrel.y+.50,.95,.96,barrel.spin)){const[x,y]=point(barrel.x,barrel.y+.5);context.fillStyle=theme.wood;context.beginPath();context.arc(x,y,.46*scale,0,Math.PI*2);context.fill();}
    for(const token of geometry.collectibles)if(!state.collected.includes(token.id)){const[x,y]=point(token.x,token.y);context.fillStyle=theme.accent;context.beginPath();context.arc(x,y,.23*scale,0,Math.PI*2);context.fill();}
    const[x,y]=point(state.actor.x,state.actor.y+.08),moving=Math.abs(data.velocity)>.05||state.actor.climbing,direction=state.actor.climbing?'back':state.actor.facing<0?'left':'right';
    context.fillStyle='rgba(58,43,31,.24)';context.beginPath();context.ellipse(x,y+.05*scale,.48*scale,.10*scale,0,0,Math.PI*2);context.fill();
    context.save();context.globalAlpha=state.immunity>0?(reduced?.65:.65+Math.sin(elapsed*Math.PI*2)*.15):1;
    if(!drawTowerPal(context,kit,x,y,scale*2.2*.84,{direction,moving,time:elapsed,action:smash>0?'smash':state.actor.climbing?'climb':state.actor.grounded?(moving?'walk':'idle'):'jump',phase:1-smash/TOWER_TUMBLE_STRIKE_SECONDS}))drawCanvasPal(context,theme.id,x,y,scale*.84,state.actor.facing,smash,moving,elapsed);
    if(kit.pal){const selection=physicalPalFrame(theme.id,elapsed,moving,{direction,action:smash>0?'smash':state.actor.climbing?'climb':state.actor.grounded?(moving?'walk':'idle'):'jump',phase:1-smash/TOWER_TUMBLE_STRIKE_SECONDS});
      const grip=selection.kind==='tools'?selection.rightHand:state.actor.facing<0?selection.leftHand:selection.rightHand;
      context.save();context.translate(x+grip[0]*scale*.84,y-grip[1]*scale*.84);context.rotate(-towerTumbleHammerAngle(smash,state.actor.facing));
      const toolScale=scale*.84;context.fillStyle=materials.get('timber')||theme.wood;
      context.fillRect(-.05*toolScale,-.78*toolScale,.1*toolScale,.78*toolScale);
      context.fillRect(-.24*toolScale,-.98*toolScale,.48*toolScale,.40*toolScale);
      context.fillStyle='rgba(47,31,25,.24)';context.fillRect(.15*toolScale,-.98*toolScale,.09*toolScale,.40*toolScale);
      context.strokeStyle='rgba(255,241,216,.45)';context.lineWidth=Math.max(1,toolScale*.025);context.strokeRect(-.24*toolScale,-.98*toolScale,.48*toolScale,.40*toolScale);context.restore();
    }
    context.restore();
    const age=Math.max(0,data.impactAge-TOWER_TUMBLE_CONTACT_SECONDS),impact=round.bricks[data.struck];
    if(impact&&data.impactAge>=TOWER_TUMBLE_CONTACT_SECONDS&&age<.58&&!reduced){const[x,y]=point(impact.x,impact.y+.65);
      context.save();context.globalAlpha=Math.max(0,1-age/.58);context.fillStyle='#e6ceb1';
      for(let n=0;n<8;n++){const angle=n*2.399;context.beginPath();context.arc(x+Math.cos(angle)*age*scale*.9,y-Math.sin(angle)*age*scale*.55-age*scale*.45,scale*(.1+age*.3),0,Math.PI*2);context.fill();}
      context.fillStyle='#af7352';for(let n=0;n<16;n++){const angle=n*2.399,speed=.85+n%4*.4;context.save();context.translate(x+Math.cos(angle)*age*speed*scale,y-(Math.sin(angle)*age*speed+age*.8-age*age*3.8)*scale);context.rotate(angle+age*4);context.fillRect(-.05*scale,-.07*scale,.11*scale,.14*scale);context.restore();}context.restore();
    }

  }};
}

function createTowerSourceWorld(THREE,mount,onLoss,theme) {
  const tier=detectQualityTier();
  const renderer=createRenderer(THREE,{pixelRatioCap:tier==='low'?1:1.5,toneMappingExposure:1.18,shadowMap:tier==='high'});
  const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
  const software=debug && /SwiftShader|llvmpipe|software/i.test(String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)));
  if(software)renderer.shadowMap.enabled=false;
  let currentTier=software?'low':tier;
  mount.replaceChildren(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color(theme.sky);scene.fog=new THREE.Fog(theme.sky,26,66);
  const camera=new THREE.OrthographicCamera(-10,10,5,-5,.1,100);camera.position.set(1.2,6.6,24);camera.lookAt(0,4,0);
  const ambient=new THREE.HemisphereLight(theme.light,theme.ground,theme.id==='moonwood'?2.5:2.8);scene.add(ambient);
  const sun=new THREE.DirectionalLight(theme.light,theme.id==='moonwood'?2.4:3.2);sun.position.set(-9,17,13);sun.castShadow=renderer.shadowMap.enabled;sun.shadow.mapSize.set(512,512);sun.shadow.camera.left=-14;sun.shadow.camera.right=14;sun.shadow.camera.top=15;sun.shadow.camera.bottom=-4;scene.add(sun);
  let world=null,builtTower=null,figure=null,actorShadow=null,mallet=null,bricks=[],barrelMeshes=[],decorations=[],liftMesh=null,cargo=null,wheel=null,windmill=null,viewY=4,viewHalfHeight=4.1;
  const material=(color)=>new THREE.MeshStandardMaterial({color,roughness:.85});
  const box=(parent,w,h,d,x,y,z,mat)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
  const cylinder=(parent,r,h,x,y,z,mat,segments=10)=>{const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),mat);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;};
  // Static scaffold pieces keep their authored dimensions and transforms while
  // sharing a draw call. Moving rigs, answer bricks and named collision groups
  // stay separate so animation and controller ownership remain unchanged.
  const instanceStaticBoxes=(parent)=>{
    const batches=new Map();
    for(const mesh of [...parent.children]){
      if(!mesh.isMesh||mesh.isInstancedMesh||mesh.geometry?.type!=='BoxGeometry'||Array.isArray(mesh.material))continue;
      const key=`${mesh.material.uuid}:${mesh.castShadow}:${mesh.receiveShadow}`;
      if(!batches.has(key))batches.set(key,[]);batches.get(key).push(mesh);
    }
    for(const meshes of batches.values()){
      if(meshes.length<2)continue;
      const source=meshes[0],batch=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),source.material,meshes.length),matrix=new THREE.Matrix4(),size=new THREE.Matrix4();
      batch.castShadow=source.castShadow;batch.receiveShadow=source.receiveShadow;
      meshes.forEach((mesh,index)=>{mesh.updateMatrix();const {width,height,depth}=mesh.geometry.parameters;matrix.copy(mesh.matrix).multiply(size.makeScale(width,height,depth));batch.setMatrixAt(index,matrix);parent.remove(mesh);mesh.geometry.dispose();});
      parent.add(batch);
    }
  };
  const createSceneTree=(options)=>{
    const tree=createWorldTree(THREE,options);
    if(options.world!=='dino')return tree;
    // The shared fern has nine identical fronds with different branch poses.
    // Instance those exact meshes locally instead of simplifying its silhouette.
    tree.updateMatrixWorld(true);const fronds=[];
    tree.traverse(mesh=>{if(mesh.isMesh&&mesh.geometry?.type==='ExtrudeGeometry')fronds.push(mesh);});
    if(fronds.length>1){const batch=new THREE.InstancedMesh(fronds[0].geometry,fronds[0].material,fronds.length),inverse=tree.matrixWorld.clone().invert(),matrix=new THREE.Matrix4();batch.castShadow=fronds[0].castShadow;batch.receiveShadow=fronds[0].receiveShadow;
      fronds.forEach((mesh,index)=>{matrix.multiplyMatrices(inverse,mesh.matrixWorld);batch.setMatrixAt(index,matrix);mesh.parent.remove(mesh);});tree.add(batch);}
    return tree;
  };
  const decoration=(object,retain)=>{decorations.push({object,retain});if(currentTier==='low'&&!retain)object.visible=false;return object;};
  const mushroom=(parent,x,y,z,size)=>{
    const group=new THREE.Group();group.position.set(x,y,z);parent.add(group);
    cylinder(group,size*.13,size,0,size*.5,0,material('#b9aac9'));
    const dome=new THREE.Mesh(new THREE.SphereGeometry(size*.57,16,8,0,Math.PI*2,0,Math.PI/2),material('#746295'));dome.position.y=size;dome.scale.y=.53;group.add(dome);
    const underside=new THREE.Mesh(new THREE.CircleGeometry(size*.57,16),new THREE.MeshStandardMaterial({color:'#e1d1d5',emissive:'#916ea0',emissiveIntensity:.12,side:THREE.DoubleSide}));underside.rotation.x=-Math.PI/2;underside.position.y=size;group.add(underside);
    const spots=new THREE.InstancedMesh(new THREE.SphereGeometry(size*.055,8,6),new THREE.MeshStandardMaterial({color:'#ead2a9',emissive:'#cc9f62',emissiveIntensity:.3}),8),matrix=new THREE.Matrix4();
    for(let n=0;n<8;n++){const a=n*.95,r=size*(.13+(n%3)*.13);matrix.makeTranslation(Math.cos(a)*r,size+Math.sqrt(Math.max(0,(size*.57)**2-r*r))*.53,Math.sin(a)*r);spots.setMatrixAt(n,matrix);}group.add(spots);return group;
  };
  const lantern=(parent,x,y,z,size=1)=>{
    const group=new THREE.Group();group.position.set(x,y,z);parent.add(group);
    const warm=new THREE.MeshStandardMaterial({color:'#f1cf8b',emissive:'#eab05b',emissiveIntensity:.65});box(group,.30*size,.46*size,.30*size,0,0,0,warm);
    const frame=material('#5f526e');for(const side of[-1,1])for(const depth of[-1,1])box(group,.035*size,.53*size,.035*size,side*.17*size,0,depth*.17*size,frame);
    box(group,.4*size,.06*size,.4*size,0,-.28*size,0,frame);const roof=new THREE.Mesh(new THREE.ConeGeometry(.29*size,.18*size,4),frame);roof.rotation.y=Math.PI/4;roof.position.y=.35*size;group.add(roof);
    const hook=new THREE.Mesh(new THREE.TorusGeometry(.075*size,.018*size,5,10),frame);hook.position.y=.49*size;group.add(hook);instanceStaticBoxes(group);return group;
  };
  const rebuildBricks=(round)=>{
    // An encounter changes graphemes, not the whole tower. Keep its actors and
    // scaffold allocated so every repaired word avoids another scene compile.
    if(bricks.length){const retired=new THREE.Group();retired.add(...bricks);disposeObject(retired);}
    bricks=[];
    const shell=material(theme.id==='moonwood'?'#9686af':theme.id==='dino'?'#b67d54':'#c98f76');
    for(const brick of round.bricks){const group=new THREE.Group();group.position.set(brick.x,brick.y+.65,.63);world.add(group);box(group,1.16,1.12,.65,0,0,0,shell);
      const face=new THREE.Mesh(new THREE.PlaneGeometry(1.10,1.06),new THREE.MeshStandardMaterial({map:createGraphemeTexture(THREE,brick.chunk,{background:theme.id==='moonwood'?'#e8d9f2':theme.id==='dino'?'#efc69a':'#e9b99b',color:'#34271e'}),roughness:.9}));face.position.z=.335;group.add(face);bricks.push(group);}
  };
  const rebuild=(round,geometry,state)=>{
    if(world&&builtTower===(geometry.layoutId||round.tower)){rebuildBricks(round);return;}
    if(world){scene.remove(world);disposeObject(world);}world=new THREE.Group();scene.add(world);bricks=[];barrelMeshes=[];decorations=[];
    builtTower=geometry.layoutId||round.tower;
    viewY=cameraTargetY(state.actor.y,0,state.phase==='rescue',viewHalfHeight);
    scene.background.set(theme.sky);
    const wood=createWoodMaterial(THREE,{color:theme.wood}),darkwood=createWoodMaterial(THREE,{color:theme.id==='moonwood'?'#4d405e':theme.id==='dino'?'#664835':'#714b2b',dark:true});
    const stone=material(theme.stone),green=material(theme.ground),metal=material(theme.id==='moonwood'?'#aab1c8':'#536471'),rope=material(theme.id==='moonwood'?'#bfc6db':'#c6ad7b');
    // Deep, original playable mill, not a screenshot behind a quiz overlay.
    if(round.tower!==1){const tower=cylinder(world,3.8,14,0,5.2,-3.1,stone,20);tower.receiveShadow=true;
      const stonework=new THREE.InstancedMesh(new THREE.BoxGeometry(.92,.42,.13),material(theme.stone),96),matrix=new THREE.Matrix4();
      for(let row=0;row<16;row++) for(let column=0;column<6;column++){const x=-3.3+column*1.2+(row%2)*.5;matrix.makeTranslation(x,row*.79-.4,.45);stonework.setMatrixAt(row*6+column,matrix);stonework.setColorAt(row*6+column,new THREE.Color(theme.stone).offsetHSL(0,0,row%2?.08:-.05));}stonework.castShadow=true;stonework.receiveShadow=true;world.add(stonework);
      for(const y of[2.1,5.1,8.1]){box(world,1.1,1.65,.4,.5,y,.66,darkwood);box(world,.92,1.42,.15,.5,y,.89,theme.id==='moonwood'?new THREE.MeshStandardMaterial({color:'#f5d58a',emissive:'#de9b42',emissiveIntensity:.45}):material(theme.id==='dino'?'#536b53':'#426b79'));box(world,.08,1.5,.11,.5,y,.99,wood);box(world,.95,.08,.11,.5,y,.99,wood);}
    } else if(theme.id==='moonwood'){mushroom(world,0,-1.2,-3.5,12.5);}
    else {cylinder(world,1.45,15,0,5,-3.0,darkwood);for(let n=0;n<6;n++){const tree=createSceneTree({world:theme.id,height:4+n%3,variant:n});tree.position.set(Math.cos(n)*4.8,7+n*.7,-5);world.add(decoration(tree,n%3===0));}}
    if(theme.id==='dino') {
      // Fossil ribs and amber strata identify a quarry, while the middle route
      // is a living fern lookout. These are unlabelled physical scenery.
      const bone=material('#ebd7ab');
      const ribs=new THREE.InstancedMesh(new THREE.TorusGeometry(.32,.065,6,12,Math.PI),bone,21),ribPose=new THREE.Object3D();let ribIndex=0;
      for(const y of[1.85,5.0,8.15]){box(world,3.4,.15,.17,-.8,y,.88,bone);for(let n=0;n<7;n++){ribPose.position.set(-2.15+n*.46,y,.90);ribPose.rotation.z=Math.PI;ribPose.updateMatrix();ribs.setMatrixAt(ribIndex++,ribPose.matrix);}const skull=new THREE.Mesh(new THREE.SphereGeometry(.34,10,7),bone);skull.position.set(1.0,y+.08,.93);skull.scale.set(1.25,.7,.4);world.add(skull);}world.add(ribs);
      for(const [x,z,height] of[[-14,-19,17],[15,-23,20]]){const volcano=new THREE.Mesh(new THREE.ConeGeometry(7,height,12),material(round.tower===2?'#76604f':'#99856a'));volcano.position.set(x,height/2-5,z);world.add(volcano);const crater=new THREE.Mesh(new THREE.TorusGeometry(1.0,.32,6,14),material('#cc935c'));crater.rotation.x=Math.PI/2;crater.position.set(x,height-5,z);world.add(crater);}
      if(round.tower===2){for(const x of[-5.2,5.4])cylinder(world,.48,11,x,4,-2.8,material('#6d6b5a'),6);}
      for(const x of[-9.5,9.7]){const fern=createSceneTree({world:'dino',height:5.5,variant:round.tower});fern.position.set(x,-1,-4);world.add(fern);}
    } else if(theme.id==='moonwood') {
      for(const y of[1.75,4.8,7.9])for(const x of[-7.3,7.3]){lantern(world,x,y,.35,1.1);box(world,.045,.5,.04,x,y+.75,.35,rope);}
      for(let n=0;n<8;n++)decoration(mushroom(world,-15+n*4.4,-1.1,-7-n%2*3,1.5+n%3*.55),n===1||n===6);
      const stars=new THREE.InstancedMesh(new THREE.OctahedronGeometry(.065,0),new THREE.MeshBasicMaterial({color:'#f9e0ac'}),48),matrix=new THREE.Matrix4();for(let n=0;n<48;n++){matrix.makeTranslation(-24+n*1.02,9+(n*7%13),-17-n%3);stars.setMatrixAt(n,matrix);}world.add(stars);
      const moon=new THREE.Mesh(new THREE.TorusGeometry(1.25,.21,8,24,Math.PI*1.6),new THREE.MeshStandardMaterial({color:'#dfd0b0',emissive:'#aca081',emissiveIntensity:.3}));moon.position.set(10,13,-10);moon.rotation.z=-.6;world.add(moon);
      if(round.tower===2){const star=new THREE.Mesh(new THREE.OctahedronGeometry(.60,0),new THREE.MeshStandardMaterial({color:'#d4c1ec',emissive:'#aa88c9',emissiveIntensity:.35}));star.position.set(0,12,.7);star.scale.y=1.6;world.add(star);}
    }
    for(const platform of geometry.platforms){box(world,platform.width,.30,2.35,platform.x,platform.y-.15,0,wood);
      const plankCount=Math.ceil(platform.width/1.05),planks=new THREE.InstancedMesh(new THREE.BoxGeometry(.97,.08,2.46),wood,plankCount),nails=new THREE.InstancedMesh(new THREE.CylinderGeometry(.04,.04,.055,6),metal,plankCount*2),transform=new THREE.Matrix4();
      for(let index=0;index<plankCount;index++){const x=platform.x-platform.width/2+index*1.05+.47;transform.makeTranslation(x,platform.y+.04,0);planks.setMatrixAt(index,transform);for(let z=0;z<2;z++){transform.makeTranslation(x,platform.y+.12,z===0?-.75:.8);nails.setMatrixAt(index*2+z,transform);}}planks.receiveShadow=true;planks.castShadow=true;world.add(planks,nails);
      for(const x of[-platform.width/2+.2,platform.width/2-.2]){box(world,.32,2.4,.38,platform.x+x,platform.y-1.3,-.7,darkwood);const brace=box(world,.21,2.4,.25,platform.x+x*.92,platform.y-1,-.72,wood);brace.rotation.z=x>0?-.6:.6;}}
    for(const ladder of geometry.ladders){for(const offset of[-.4,.4])box(world,.13,ladder.top-ladder.bottom+.7,.17,ladder.x+offset,(ladder.top+ladder.bottom)/2+.22,.8,wood);for(let yy=ladder.bottom+.25;yy<ladder.top+.5;yy+=.38)box(world,.83,.105,.2,ladder.x,yy,.85,wood);}
    for(const wall of geometry.shortcuts){const group=new THREE.Group();group.position.set(wall.x,wall.y,.3);group.name=wall.id;world.add(group);for(let row=0;row<3;row++)for(let col=0;col<2;col++)box(group,.54,.44,.6,(col-.5)*.6+(row%2)*.08,row*.46+.25,0,stone);const crack=box(group,.055,1.1,.02,.12,.76,.32,darkwood);crack.rotation.z=.22;instanceStaticBoxes(group);group.visible=!state.broken.includes(wall.id);}
    rebuildBricks(round);
    // A real side elevator connects alternate traversal routes.
    liftMesh=new THREE.Group();liftMesh.position.x=geometry.movingPlatform.x;world.add(liftMesh);box(liftMesh,1.8,.22,2,0,0,0,wood);for(const x of[-.75,.75])box(liftMesh,.11,1.5,.11,x,.75,-.7,wood);
    for(const x of[-.65,.65]){const cable=box(world,.045,10,.045,geometry.movingPlatform.x+x,5,-.7,rope);cable.name='lift-cable';}
    cargo=new THREE.Group();cargo.position.set(6.9,3,0);world.add(cargo);box(cargo,1.6,.15,1.5,0,.1,0,wood);for(const x of[-.7,.7])for(const z of[-.6,.6])box(cargo,.11,1.3,.11,x,.8,z,wood);box(cargo,1.65,.13,1.55,0,1.5,0,wood);const pal=createPalFigure(THREE,{world:theme.id,artActions:['tools'],scale:.46});pal.position.y=.2;cargo.add(pal);
    box(world,.055,11,.055,6.9,5.5,-.7,rope);wheel=new THREE.Mesh(new THREE.TorusGeometry(.37,.07,6,14),metal);wheel.position.set(6.9,10.8,-.5);world.add(wheel);box(world,3.5,.19,.3,5.8,11,-.6,darkwood);box(world,.18,2.5,.3,4.2,9.8,-.6,darkwood);
    windmill=new THREE.Group();windmill.position.set(-.8,11,-.1);world.add(windmill);for(let index=0;index<4;index++){const vane=new THREE.Group();vane.rotation.z=index*Math.PI/2;windmill.add(vane);box(vane,.15,3,.16,0,1.2,0,wood);if(theme.id==='moonwood')lantern(vane,0,2.2,.1,1.15);else box(vane,theme.id==='dino'?.28:.7,theme.id==='dino'?.60:1.8,.06,.23,1.8,.1,material(theme.id==='dino'?'#ead4ad':'#f2e9ce'));}
    const hills=material(theme.ground);for(let index=0;index<9;index++){const mound=new THREE.Mesh(new THREE.SphereGeometry(8+index%3,12,7),hills);mound.position.set(-32+index*8,-7-index%2,-22-index%3*5);mound.scale.y=1.4;world.add(decoration(mound,index%3===0));const tree=createSceneTree({world:theme.id,height:3+index%3,variant:index});tree.position.set(-18+index*4,-1,-9-index%2*4);world.add(decoration(tree,index%3===0));}
    const ground=cylinder(world,14,.6,0,-1.2,-2,green,24);ground.receiveShadow=true;
    const clouds=material(theme.id==='moonwood'?'#536784':'#f5f2de');for(let n=0;n<7;n++){const cloud=new THREE.Mesh(new THREE.SphereGeometry(1.2,10,6),clouds);cloud.position.set(-14+n*4.6,13+n%2*2,-12);cloud.scale.set(2.6,.6,1);world.add(decoration(cloud,n%3===0));}
    for(const collectible of geometry.collectibles){const group=new THREE.Group();group.name=collectible.id;group.position.set(collectible.x,collectible.y,.3);world.add(group);const token=new THREE.Mesh(theme.id==='moonwood'?new THREE.OctahedronGeometry(.28,0):theme.id==='dino'?new THREE.IcosahedronGeometry(.28,0):new THREE.SphereGeometry(.23,10,7),material(theme.accent));group.add(token);if(theme.id==='meadow'){const cap=cylinder(group,.25,.12,0,.17,0,darkwood);cap.rotation.z=.1;}group.visible=!state.collected.includes(collectible.id);}
    figure=createPalFigure(THREE,{world:theme.id,artActions:['tools'],scale:.72});figure.position.z=1;world.add(figure);
    actorShadow=new THREE.Mesh(new THREE.CircleGeometry(.40,16),new THREE.MeshBasicMaterial({color:'#4d4535',transparent:true,opacity:.25,depthWrite:false}));actorShadow.rotation.x=-Math.PI/2;actorShadow.scale.y=.65;world.add(actorShadow);
    mallet=new THREE.Group();mallet.position.set(.34,1.22,.18);figure.add(mallet);box(mallet,.1,.8,.1,0,.4,0,darkwood);const head=cylinder(mallet,.26,.5,0,.83,0,wood);head.rotation.z=Math.PI/2;
    for(let n=0;n<6;n++){const group=new THREE.Group();const barrel=cylinder(group,.46,.67,0,0,0,wood,12);barrel.rotation.x=Math.PI/2;for(const z of[-.24,.24]){const hoop=new THREE.Mesh(new THREE.TorusGeometry(.46,.045,5,12),metal);hoop.position.z=z;group.add(hoop);}group.visible=false;world.add(group);barrelMeshes.push(group);}
    instanceStaticBoxes(world);
  };
  const resize=()=>{const width=Math.max(1,mount.clientWidth),height=Math.max(1,mount.clientHeight),aspect=width/height;
    const halfWidth=aspect<1?9.1:Math.max(9.3,aspect*1.05);viewHalfHeight=halfWidth/aspect;camera.left=-halfWidth;camera.right=halfWidth;camera.top=viewHalfHeight;camera.bottom=-viewHalfHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(arcadePixelRatio(currentTier==='low'?1:1.5, width, height)*(software&&width>650?.8:1));renderer.setSize(width,height);};resize();
  const detach=attachContextLossGuard(renderer,{onLost:onLoss});
  return {resize,rebuild,
    profile:()=>({quality:currentTier,software:Boolean(software),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,pixelRatio:renderer.getPixelRatio()}),
    lowerQuality(next){currentTier=next==='rich'?'high':next==='balanced'?'medium':'low';renderer.shadowMap.enabled=false;if(currentTier==='low')for(const item of decorations)item.object.visible=item.retain;resize();},
    dispose(){detach();disposeObject(scene);disposeRenderer(renderer,{forceContextLoss:true});},draw(data){
    const {state,geometry,lift,barrels,elapsed,smash,reduced,rescueProgress}=data;
    const sourceOpacity=state.immunity>0?(reduced?.65:.65+Math.sin(elapsed*Math.PI*2)*.15):1;figure.traverse(node=>{if(node.isMesh)for(const mat of(Array.isArray(node.material)?node.material:[node.material])){mat.transparent=true;mat.opacity=sourceOpacity;}});
    figure.position.set(state.actor.x,state.actor.y+.09,1);figure.rotation.y=figure.userData.authoredPal?.delivery==='delivered'?0:state.actor.facing*.95;animatePalFigure(figure,elapsed,Math.abs(data.velocity)>.05 || state.actor.climbing,{direction:state.actor.climbing?'back':state.actor.facing<0?'left':'right'});
    actorShadow.position.set(state.actor.x,state.actor.grounded?state.actor.y+.10:Math.max(0,Math.floor(state.actor.y/3)*3)+.10,1);actorShadow.visible=!state.actor.climbing;actorShadow.material.opacity=state.actor.grounded?.25:.13;
    mallet.rotation.z=towerTumbleHammerAngle(smash,state.actor.facing);
    for(let index=0;index<bricks.length;index++){bricks[index].rotation.z=data.shaken===index&&!reduced?Math.sin(elapsed*28)*.08:0;bricks[index].scale.setScalar(data.struck===index? Math.max(.02,1-data.impactAge*2):1);}
    for(const wall of geometry.shortcuts)world.getObjectByName(wall.id).visible=!state.broken.includes(wall.id);
    for(const collectible of geometry.collectibles){const mesh=world.getObjectByName(collectible.id);mesh.visible=!state.collected.includes(collectible.id);mesh.rotation.y=reduced?0:elapsed;}
    liftMesh.position.y=lift;cargo.position.y=state.phase==='rescue'?3+rescueProgress*6:3;wheel.rotation.z=rescueProgress*8;
    windmill.rotation.z=reduced?0:elapsed*.18;
    for(let n=0;n<barrelMeshes.length;n++){const mesh=barrelMeshes[n],barrel=barrels[n];mesh.visible=!!barrel;if(barrel){mesh.position.set(barrel.x,barrel.y+.49,.12);mesh.rotation.z=barrel.spin;}}
    const desired=cameraTargetY(state.actor.y,rescueProgress,state.phase==='rescue',viewHalfHeight);viewY+=(desired-viewY)*(reduced?1:arcadeDampingFactor(data.dt??1/60,.085));camera.position.set(1.2,viewY+2.6,24);camera.lookAt(0,viewY,0);renderer.render(scene,camera);
  }};
}

// Authored diorama layers replace the visible source shapes. Collision remains
// in towerTumbleRules; these physical meshes and animated cutouts follow it.
export function createTowerThreeWorld(THREE,mount,onLoss,theme,kit) {
  if(!kit?.materials&&!kit?.props&&!kit?.landscape)return createTowerSourceWorld(THREE,mount,onLoss,theme);
  const tier=detectQualityTier(),renderer=createRenderer(THREE,{pixelRatioCap:tier==='low'?1:1.5,toneMappingExposure:1,shadowMap:tier==='high'});
  const context=renderer.getContext(),debug=context.getExtension('WEBGL_debug_renderer_info');
  const software=debug&&/SwiftShader|llvmpipe|software/i.test(String(context.getParameter(debug.UNMASKED_RENDERER_WEBGL)));
  let quality=software?'low':tier; if(software)renderer.shadowMap.enabled=false;
  mount.replaceChildren(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color(theme.sky);
  const camera=new THREE.OrthographicCamera(-10,10,5,-5,.1,120);
  const sky=new THREE.HemisphereLight('#fff5df',theme.ground,1.65),sun=new THREE.DirectionalLight('#fff3dc',2.5);
  sun.position.set(-9,17,14);sun.castShadow=renderer.shadowMap.enabled;sun.shadow.mapSize.set(512,512);
  Object.assign(sun.shadow.camera,{left:-14,right:14,top:15,bottom:-4});scene.add(sky,sun);
  let world=null,builtTower=null,viewY=3.8,viewX=0,halfHeight=5,halfWidth=10,background=null;
  let hero,resident,hammer,cargo,lift,wheel,mill,shadow,fragments,dust,bricks=[],barrelMeshes=[],decorations=[],propMaterials=new Map(),materials;
  const simple=(color)=>new THREE.MeshStandardMaterial({color,roughness:.88});
  const textured=(key,fallback,repeat=[1,1],color='#ffffff')=>{
    const map=towerArtTexture(THREE,kit.materials,TOWER_TUMBLE_SCENE_KIT.materials[key],{repeat});
    return new THREE.MeshStandardMaterial({map,color:map?color:fallback,roughness:.94});
  };
  const box=(parent,w,h,d,x,y,z,material)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
  const cylinder=(parent,r,h,x,y,z,material,segments=24)=>{const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
  const bevelledBrick=(parent,material)=>{
    const shape=new THREE.Shape(),w=.54,h=.54,r=.07;
    shape.moveTo(-w+r,-h);shape.lineTo(w-r,-h);shape.quadraticCurveTo(w,-h,w,-h+r);
    shape.lineTo(w,h-r);shape.quadraticCurveTo(w,h,w-r,h);shape.lineTo(-w+r,h);
    shape.quadraticCurveTo(-w,h,-w,h-r);shape.lineTo(-w,-h+r);shape.quadraticCurveTo(-w,-h,-w+r,-h);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.76,steps:1,bevelEnabled:true,bevelThickness:.04,bevelSize:.04,bevelSegments:2,curveSegments:4});
    geometry.translate(0,0,-.38);const position=geometry.attributes.position,uv=geometry.attributes.uv;
    for(let n=0;n<position.count;n++)uv.setXY(n,position.getX(n)/1.08+.5,position.getY(n)/1.08+.5);
    const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  };
  const prop=(parent,key,x,y,z,width,height,rotation=0)=>{
    if(!kit.props)return null;
    if(!propMaterials.has(key))propMaterials.set(key,new THREE.MeshBasicMaterial({map:towerArtTexture(THREE,kit.props,TOWER_TUMBLE_SCENE_KIT.props[key],{alpha:true}),color:'#ffffff',transparent:true,alphaTest:.12,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),propMaterials.get(key));mesh.scale.set(width,height,1);mesh.position.set(x,y,z);mesh.rotation.z=rotation;parent.add(mesh);return mesh;
  };
  const dress=(key,x,y,z,width,height,retain=true)=>{const mesh=prop(world,key,x,y,z,width,height);if(mesh){if(!retain)mesh.name=`optional-${key}-${decorations.length}`;decorations.push({mesh,retain});if(quality==='low'&&!retain)mesh.visible=false;}return mesh;};
  // Identical static faces, ladders and stone trims share draw calls without
  // altering their registration. Named destructible/dynamic groups stay owned.
  const batchStatic=(parent)=>{
    const groups=new Map();
    for(const mesh of [...parent.children]){
      if(!mesh.isMesh||mesh.isInstancedMesh||mesh.name||!['BoxGeometry','PlaneGeometry'].includes(mesh.geometry.type))continue;
      const key=`${mesh.geometry.type}:${mesh.material.uuid}:${mesh.castShadow}:${mesh.receiveShadow}:${mesh.visible}`;
      if(!groups.has(key))groups.set(key,[]);groups.get(key).push(mesh);
    }
    for(const meshes of groups.values()){
      if(meshes.length<2)continue;const source=meshes[0],plane=source.geometry.type==='PlaneGeometry';
      const batch=new THREE.InstancedMesh(plane?new THREE.PlaneGeometry(1,1):new THREE.BoxGeometry(1,1,1),source.material,meshes.length),matrix=new THREE.Matrix4(),size=new THREE.Matrix4();
      batch.castShadow=source.castShadow;batch.receiveShadow=source.receiveShadow;batch.visible=source.visible;
      meshes.forEach((mesh,index)=>{mesh.updateMatrix();const p=mesh.geometry.parameters;matrix.copy(mesh.matrix).multiply(size.makeScale(p.width,p.height,plane?1:p.depth));batch.setMatrixAt(index,matrix);parent.remove(mesh);mesh.geometry.dispose();});parent.add(batch);
    }
  };
  if(kit.landscape){background=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:towerArtTexture(THREE,kit.landscape,null),color:'#ffffff',toneMapped:false,depthWrite:false}));background.position.z=-28;background.renderOrder=-20;scene.add(background);}
  const rebuildBricks=round=>{
    if(bricks.length){const retired=new THREE.Group();retired.add(...bricks);disposeObject(retired);}bricks=[];
    // Chunk faces own their maps; retiring a cue cannot dispose scaffold maps.
    const sides=textured('blankBrickFace',theme.stone),rubble=textured('stone',theme.stone,[1,.8]);
    for(const brick of round.bricks){const group=new THREE.Group();group.position.set(brick.x,brick.y+.66,.7);world.add(group);
      box(group,1.42,.24,.91,.05,-.49,-.12,rubble);
      const left=box(group,.31,.47,.78,-.64,-.18,-.18,rubble);left.rotation.z=-.09;
      const right=box(group,.32,.64,.78,.68,.11,-.18,rubble);right.rotation.z=.06;
      const remnant=box(group,.47,.23,.78,.37,.66,-.17,sides);remnant.rotation.z=-.08;
      const body=bevelledBrick(group,sides);body.rotation.z=(brick.x%3)*.008;
      const face=new THREE.Mesh(new THREE.PlaneGeometry(1.02,1.02),new THREE.MeshBasicMaterial({map:createGraphemeTexture(THREE,brick.chunk,{transparent:true,color:'#352920'}),transparent:true,alphaTest:.04,depthWrite:false,toneMapped:false}));
      face.position.z=.429;group.add(face);batchStatic(group);bricks.push(group);}

  };
  const rebuild=(round,geometry,state)=>{
    if(world&&builtTower===(geometry.layoutId||round.tower)){rebuildBricks(round);return;}
    if(world){scene.remove(world);disposeObject(world);}world=new THREE.Group();scene.add(world);builtTower=geometry.layoutId||round.tower;
    bricks=[];barrelMeshes=[];decorations=[];propMaterials=new Map();
    materials={frontWood:textured('timber',theme.wood,[4,.6]),wood:textured('timber',theme.wood,[1,.6]),darkWood:textured('timber',theme.wood,[.65,1.6],'#9d846a'),stone:textured('stone',theme.stone,[3.5,7]),trim:textured('stone',theme.stone,[1,1]),bark:textured('bark',theme.wood,[3,6]),metal:simple('#52505a'),rope:textured('timber','#b29b70',[.15,3],'#cfb792')};
    viewY=cameraTargetY(state.actor.y,0,state.phase==='rescue',halfHeight);viewX=0;
    if(round.tower===1){
      if(theme.id==='moonwood'&&kit.props){prop(world,'mushrooms',0,6,-2.5,13,15);}
      else{cylinder(world,2.25,16,0,5,-3,materials.bark);for(const side of[-1,1]){const branch=box(world,7.4,.65,.9,side*2.4,10.4,-2.5,materials.darkWood);branch.rotation.z=side*.24;}
        if(kit.props)for(const[x,y,size]of[[-4,12,5.5],[1,14,6],[5,11.9,5.5],[-1,11.8,5]])dress('fern',x,y,-3.6,size,size*.92,true);
        else for(let n=0;n<4;n++){const tree=createWorldTree(THREE,{world:theme.id,height:5,variant:n});tree.position.set(n*3-5,9,-5);world.add(tree);}}
    }else{
      const height=round.tower===2?8:15,centre=round.tower===2?2.8:5.5;
      cylinder(world,3.55,height,0,centre,-3.25,materials.stone,36);
      // Thick stone courses, window returns and timber shutters give the
      // round mill a tangible surface rather than flat repeated grey blocks.
      for(const y of[1.75,4.8,7.8])if(y<height-1){
        box(world,.90,1.37,.14,.4,y,.36,materials.darkWood);
        box(world,.70,1.12,.11,.4,y,.46,simple(theme.id==='moonwood'?'#e5ae5f':'#314b56'));
        for(const x of[-.18,.98])box(world,.27,1.72,.27,x,y,.49,materials.trim);
        box(world,1.45,.3,.38,.4,y+.82,.47,materials.trim);box(world,1.40,.23,.40,.4,y-.82,.48,materials.trim);
        box(world,.085,1.14,.12,.4,y,.54,materials.wood);box(world,.77,.085,.12,.4,y,.54,materials.wood);
      }
      if(round.tower===0){const roof=new THREE.Mesh(new THREE.ConeGeometry(3.75,1.4,24),materials.darkWood);roof.position.set(0,13.65,-3.25);world.add(roof);}
      else{for(const x of[-5.2,4.7]){box(world,.50,12.3,.60,x,5.5,-1.1,materials.darkWood);box(world,.65,.22,.8,x,10.9,-1.1,materials.metal);}box(world,12.4,.43,.85,-.25,11.35,-1.1,materials.wood);const diagonal=box(world,.3,7.5,.40,-2.5,8.1,-1.2,materials.wood);diagonal.rotation.z=-.7;}
    }
    for(const platform of geometry.platforms){
      box(world,platform.width,.24,2.25,platform.x,platform.y-.13,0,materials.wood);
      box(world,platform.width,.43,.45,platform.x,platform.y-.19,1.18,materials.frontWood);
      for(const side of[-1,1]){
        const x=platform.x+side*(platform.width/2-.72);
        if(!prop(world,side<0?'leftBeamAnchor':'rightBeamAnchor',x,platform.y-.87,1.38,1.22,1.86)){
          box(world,.31,2.2,.40,x,platform.y-1.2,.60,materials.darkWood);
        }
      }
      // Real top boards retain consistent contact height under authored fascia.
      const plankCount=Math.ceil(platform.width/1.02),planks=new THREE.InstancedMesh(new THREE.BoxGeometry(.98,.085,2.28),materials.wood,plankCount),matrix=new THREE.Matrix4();
      for(let n=0;n<plankCount;n++){matrix.makeTranslation(platform.x-platform.width/2+n*1.02+.49,platform.y+.025,0);planks.setMatrixAt(n,matrix);}planks.receiveShadow=true;world.add(planks);
      for(const x of[-platform.width/2+.30,platform.width/2-.30]){box(world,.28,2.6,.42,platform.x+x,platform.y-1.5,-.8,materials.darkWood);const brace=box(world,.20,2.7,.24,platform.x+x*.87,platform.y-1.3,-.8,materials.wood);brace.rotation.z=x>0?-.64:.64;}
      dress('bunting',platform.x,platform.y-.77,1.43,3.8,1.15,false);
    }
    for(const ladder of geometry.ladders){
      const height=ladder.top-ladder.bottom+.46;
      if(!prop(world,'ladder',ladder.x,(ladder.top+ladder.bottom)/2+.12,.38,1.10,height)){
        for(const dx of[-.40,.40])box(world,.14,height,.17,ladder.x+dx,(ladder.top+ladder.bottom)/2+.12,.8,materials.wood);
        for(let y=ladder.bottom+.2;y<ladder.top+.4;y+=.38)box(world,.83,.1,.2,ladder.x,y,.85,materials.wood);
      }
    }
    for(const wall of geometry.shortcuts){const group=new THREE.Group();group.position.set(wall.x,wall.y,.4);group.name=wall.id;world.add(group);
      for(let row=0;row<3;row++)for(let column=0;column<2;column++)box(group,.57,.42,.65,(column-.5)*.57+(row%2)*.04,.22+row*.43,0,materials.trim);
      const crack=box(group,.045,1.03,.035,.10,.66,.345,materials.darkWood);crack.rotation.z=.23;
      group.visible=!state.broken.includes(wall.id);batchStatic(group);
      const rubble=prop(group,'rubble',0,.24,.36,1.45,.69);if(rubble)rubble.position.y=-.14;
    }
    // Independent vegetation is anchored to the masonry and platforms. The
    // distance layers are environment art, never a substitute for these routes.
    if(kit.props){
      for(const[x,y,width]of[[-3.4,1.6,1.5],[2.8,4.6,1.45],[-3,7.5,1.65],[3.3,10.5,1.4]])dress('ivy',x,y,.50,width,width*2.15,true);
      const foreground=theme.id==='moonwood'?'mushrooms':theme.id==='dino'?'fern':'flowers';
      for(const[x,y,size]of[[-8.1,-.76,3.0],[8,-.8,2.8],[-6.8,5.9,1.5],[5.8,9,1.4]])dress(foreground,x+(geometry.routeShift||0),y,.9,size,size*.94,true);
      for(const x of[-10.5,10.8])dress(theme.id==='moonwood'?'mushrooms':'fern',x,1,-5,6,5.6,true);
      if(theme.id==='moonwood')for(const y of[1.7,4.7,7.7])for(const x of[-7.5,7.2])dress('lantern',x,y,.6,.60,1.15,true);
      else dress('bunting',5.8,10.55,.4,3.4,1.2,true);
    }
    if(theme.id==='dino'){
      const bone=simple('#e4d5aa'),ribGeo=new THREE.TorusGeometry(.29,.075,6,12,Math.PI),ribs=new THREE.InstancedMesh(ribGeo,bone,12),pose=new THREE.Object3D();
      for(let n=0;n<12;n++){pose.position.set(-1.7+(n%6)*.5,1.9+Math.floor(n/6)*6.1,.50);pose.rotation.z=Math.PI;pose.updateMatrix();ribs.setMatrixAt(n,pose.matrix);}world.add(ribs);
    }
    rebuildBricks(round);
    lift=new THREE.Group();lift.position.x=geometry.movingPlatform.x;world.add(lift);
    box(lift,1.8,.23,1.8,0,0,0,materials.wood);for(const x of[-.74,.74])box(lift,.12,1.4,.15,x,.70,-.45,materials.darkWood);
    prop(lift,'beam',0,-.60,.9,1.85,1.15);
    for(const dx of[-.65,.65])box(world,.045,10,.045,geometry.movingPlatform.x+dx,5,-.8,materials.rope);
    cargo=new THREE.Group();cargo.position.set(6.85,3,.05);world.add(cargo);
    resident=createPalFigure(THREE,{world:theme.id,artActions:['tools'],scale:.46});resident.position.set(.02,.34,.72);resident.userData.artDirection='front';cargo.add(resident);
    if(!prop(cargo,'cage',0,.72,.50,1.58,1.70)){
      box(cargo,1.6,.15,1.5,0,.1,0,materials.wood);for(const x of[-.7,.7])for(const z of[-.6,.6])box(cargo,.11,1.3,.11,x,.8,z,materials.wood);box(cargo,1.65,.13,1.55,0,1.5,0,materials.wood);
    }
    for(const x of[-.61,.61])box(cargo,.09,1.27,.10,x,.82,.91,materials.darkWood);box(cargo,1.31,.09,.10,0,.20,.91,materials.wood);
    box(world,.060,11,.055,6.85,5.5,-.65,materials.rope);
    wheel=new THREE.Group();wheel.position.set(6.85,10.6,.3);world.add(wheel);
    if(!prop(wheel,'pulley',0,-.25,0,.76,1.55)){const ring=new THREE.Mesh(new THREE.TorusGeometry(.37,.07,6,14),materials.metal);wheel.add(ring);}
    box(world,3.5,.24,.35,5.6,11,-.55,materials.darkWood);box(world,.22,2.5,.35,4.1,9.8,-.55,materials.darkWood);
    mill=new THREE.Group();mill.position.set(-.3,11.8,.15);world.add(mill);mill.visible=round.tower===0;
    for(let n=0;n<4;n++){const vane=new THREE.Group();vane.rotation.z=n*Math.PI/2;mill.add(vane);box(vane,.16,3.4,.20,0,1.4,0,materials.wood);box(vane,.75,2.2,.08,.30,1.9,.08,simple(theme.id==='moonwood'?'#d9c2de':theme.id==='dino'?'#dcb889':'#eee1bd'));for(const y of[1.0,1.7,2.4])box(vane,.9,.08,.13,.27,y,.15,materials.darkWood);}
    for(const collectible of geometry.collectibles){const group=new THREE.Group();group.name=collectible.id;group.position.set(collectible.x,collectible.y,.6);world.add(group);
      const token=new THREE.Mesh(theme.id==='moonwood'?new THREE.OctahedronGeometry(.25,0):theme.id==='dino'?new THREE.IcosahedronGeometry(.25,0):new THREE.SphereGeometry(.22,10,7),simple(theme.accent));group.add(token);
      if(theme.id==='meadow')cylinder(group,.24,.14,0,.16,0,materials.darkWood,12);group.visible=!state.collected.includes(collectible.id);
    }
    hero=createPalFigure(THREE,{world:theme.id,artActions:['tools'],scale:.84});hero.position.z=2.05;hero.userData.artDirection='right';world.add(hero);
    shadow=new THREE.Mesh(new THREE.CircleGeometry(.52,18),new THREE.MeshBasicMaterial({color:'#413b31',transparent:true,opacity:.22,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.scale.y=.65;world.add(shadow);
    hammer=new THREE.Group();(hero.userData.artHands?.right||hero).add(hammer);hammer.position.set(0,0,.12);
    box(hammer,.10,.78,.11,0,.34,0,materials.darkWood);const head=cylinder(hammer,.24,.48,0,.78,0,materials.wood,16);head.rotation.z=Math.PI/2;
    const bands=new THREE.Mesh(new THREE.TorusGeometry(.24,.028,6,16),materials.metal);bands.rotation.y=Math.PI/2;bands.position.set(-.19,.78,0);hammer.add(bands);
    for(let n=0;n<6;n++){const group=new THREE.Group();world.add(group);group.visible=false;
      if(!prop(group,'barrel',0,0,0,.95,.96)){const body=cylinder(group,.46,.67,0,0,0,materials.wood,12);body.rotation.x=Math.PI/2;for(const z of[-.24,.24]){const hoop=new THREE.Mesh(new THREE.TorusGeometry(.46,.045,5,12),materials.metal);hoop.position.z=z;group.add(hoop);}}barrelMeshes.push(group);
    }
    fragments=new THREE.InstancedMesh(new THREE.BoxGeometry(.11,.14,.13),textured('blankBrickFace',theme.stone),16);fragments.visible=false;world.add(fragments);
    const puff=document.createElement('canvas');puff.width=puff.height=64;const brush=puff.getContext('2d');
    if(brush){const fade=brush.createRadialGradient(32,32,3,32,32,31);fade.addColorStop(0,'rgba(245,230,208,.65)');fade.addColorStop(.58,'rgba(245,230,208,.3)');fade.addColorStop(1,'rgba(245,230,208,0)');brush.fillStyle=fade;brush.fillRect(0,0,64,64);}
    dust=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:towerArtTexture(THREE,puff,null,{alpha:true}),transparent:true,opacity:0,depthWrite:false,toneMapped:false}),8);dust.visible=false;world.add(dust);
    batchStatic(world);
  };
  const resize=()=>{
    const width=Math.max(1,mount.clientWidth),height=Math.max(1,mount.clientHeight),aspect=width/height;
    halfWidth=aspect<1?9.1:Math.max(9.3,aspect*1.05);halfHeight=halfWidth/aspect;
    camera.left=-halfWidth;camera.right=halfWidth;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();
    renderer.setPixelRatio(arcadePixelRatio(quality==='low'?1:1.5, width, height)*(software&&width>650?.8:1));renderer.setSize(width,height);
    if(background){
      const ratio=kit.landscape.naturalWidth/kit.landscape.naturalHeight;
      // At z=-28 the angled camera sees farther left than the playable plane.
      // Preserve the existing wide composition, but cover short-view frusta.
      const yawStretch=Math.hypot(26,4.3)/26,farOffset=28*4.3/26;
      const w=Math.max(halfWidth*2.5,halfHeight*2.5*ratio,2*(halfWidth*yawStretch+farOffset+.4));
      background.scale.set(w,w/ratio,1);
    }
  };resize();
  const detach=attachContextLossGuard(renderer,{onLost:onLoss});
  return {resize,rebuild,profile:()=>({quality,software:Boolean(software),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,pixelRatio:renderer.getPixelRatio(),art:{...kit.delivery,hero:hero?.userData.authoredPal?.delivery||'unavailable',heroActions:{...hero?.userData.authoredPal?.actionDelivery},heroPose:{atlas:hero?.userData.authoredPal?.atlas,action:hero?.userData.authoredPal?.action,direction:hero?.userData.authoredPal?.direction},resident:resident?.userData.authoredPal?.delivery||'unavailable'},sceneStyle:'authored-physical-diorama'}),
    lowerQuality(next){quality=next==='rich'?'high':next==='balanced'?'medium':'low';renderer.shadowMap.enabled=false;for(const item of decorations)item.mesh.visible=quality!=='low'||item.retain;resize();},
    dispose(){detach();disposeObject(scene);disposeRenderer(renderer,{forceContextLoss:true});},
    draw(data){
      const {state,geometry,elapsed,smash,reduced,rescueProgress,barrels}=data;
      hero.position.set(state.actor.x,state.actor.y+.08,2.05);
      const moving=Math.abs(data.velocity)>.05||state.actor.climbing,direction=state.actor.climbing?'back':state.actor.facing<0?'left':'right';
      hero.userData.artDirection=direction;
      const heroOpacity=state.immunity>0?(reduced?.65:.65+Math.sin(elapsed*Math.PI*2)*.15):1;hero.traverse(node=>{if(node.isMesh)for(const material of(Array.isArray(node.material)?node.material:[node.material])){material.transparent=true;material.opacity=heroOpacity;}});hero.rotation.y=hero.userData.authoredPal?.delivery==='delivered'?0:state.actor.facing*.95;
      animatePalFigure(hero,elapsed,moving,{direction,action:smash>0?'smash':state.actor.climbing?'climb':state.actor.grounded?(moving?'walk':'idle'):'jump',phase:1-smash/TOWER_TUMBLE_STRIKE_SECONDS});
      animatePalFigure(resident,elapsed,false,{direction:'front',action:state.phase==='rescue'?'celebrate':'idle'});
      const hand=hero.userData.authoredPal?.atlas==='tools'?hero.userData.artHands?.right:state.actor.facing<0?hero.userData.artHands?.left:hero.userData.artHands?.right;
      if(hand&&hammer.parent!==hand)hand.add(hammer);
      hammer.rotation.z=towerTumbleHammerAngle(smash,state.actor.facing);
      shadow.position.set(state.actor.x,state.actor.grounded?state.actor.y+.10:Math.max(0,Math.floor(state.actor.y/3)*3)+.10,1.6);shadow.visible=!state.actor.climbing;shadow.material.opacity=state.actor.grounded?.22:.12;
      for(let n=0;n<bricks.length;n++){bricks[n].rotation.z=data.shaken===n&&!reduced?Math.sin(elapsed*28)*.07:0;bricks[n].scale.setScalar(data.struck===n?Math.max(.02,1-Math.max(0,data.impactAge-TOWER_TUMBLE_CONTACT_SECONDS)*3):1);}
      const age=Math.max(0,data.impactAge-TOWER_TUMBLE_CONTACT_SECONDS),impact=data.round.bricks[data.struck],showImpact=Boolean(impact)&&data.impactAge>=TOWER_TUMBLE_CONTACT_SECONDS&&age<.58&&!reduced;
      fragments.visible=dust.visible=showImpact;
      if(showImpact){const pose=new THREE.Object3D();for(let n=0;n<16;n++){
        const angle=n*2.399,speed=.85+(n%4)*.4;
        pose.position.set(impact.x+Math.cos(angle)*age*speed,impact.y+.65+Math.sin(angle)*age*speed+age*.8-age*age*3.8,1.18+(n%3)*.06);
        pose.rotation.set(age*(n%3+1)*3,age*4,angle+age*4);pose.scale.setScalar(1-age*.7);pose.updateMatrix();fragments.setMatrixAt(n,pose.matrix);
      }fragments.instanceMatrix.needsUpdate=true;
      for(let n=0;n<8;n++){const angle=n*2.399;pose.position.set(impact.x+Math.cos(angle)*age*.9,impact.y+.55+Math.sin(angle)*age*.55+age*.45,1.14);pose.quaternion.copy(camera.quaternion);pose.scale.setScalar(.30+age*.9);pose.updateMatrix();dust.setMatrixAt(n,pose.matrix);}dust.instanceMatrix.needsUpdate=true;dust.material.opacity=Math.max(0,1-age/.58);
      }
      for(const wall of geometry.shortcuts)world.getObjectByName(wall.id).visible=!state.broken.includes(wall.id);
      for(const token of geometry.collectibles){const group=world.getObjectByName(token.id);group.visible=!state.collected.includes(token.id);group.rotation.y=reduced?0:elapsed;}
      lift.position.y=data.lift;cargo.position.y=state.phase==='rescue'?3+rescueProgress*6:3;wheel.rotation.z=rescueProgress*.20;
      mill.rotation.z=reduced?0:elapsed*.13;
      for(let n=0;n<barrelMeshes.length;n++){const mesh=barrelMeshes[n],barrel=barrels[n];mesh.visible=Boolean(barrel);if(barrel){mesh.position.set(barrel.x,barrel.y+.50,1.6);mesh.rotation.z=barrel.spin;}}
      const desired=cameraTargetY(state.actor.y,rescueProgress,state.phase==='rescue',halfHeight);viewY+=(desired-viewY)*(reduced?1:arcadeDampingFactor(data.dt??1/60,.085));
      camera.position.set(viewX+4.3,viewY+3.0,26);camera.lookAt(viewX,viewY,0);
      if(background)background.position.set(viewX*.45,viewY*.76-1.6,-28);
      renderer.render(scene,camera);
    }};
}
