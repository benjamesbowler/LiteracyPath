import { useEffect, useRef } from 'react';
import { createArcadeLandscape } from './arcadeLandscapeSprites.js';

export default function BlenderGardenBackdrop({gameId,isPaused,world='meadow',variation=0}) {
  const canvas=useRef(null),live=useRef({isPaused,world,variation});
  useEffect(()=>{live.current={isPaused,world,variation};},[isPaused,world,variation]);
  useEffect(()=>{
    const node=canvas.current,ctx=node.getContext('2d'),landscape=createArcadeLandscape(gameId,node);
    const motion=matchMedia('(prefers-reduced-motion: reduce)');let frame,last=null,time=0;
    const render=now=>{
      const paused=Boolean(live.current.isPaused?.())||document.hidden;
      if(last!==null&&!paused&&!motion.matches)time+=Math.min(.05,(now-last)/1000);last=now;
      const width=Math.round(node.clientWidth),height=Math.round(node.clientHeight);
      if(node.width!==width||node.height!==height){node.width=width;node.height=height;}
      ctx.clearRect(0,0,width,height);
      landscape.draw(ctx,{width,height,ground:height*(gameId==='sentence-express'?.46:.86),time,world:live.current.world,variation:live.current.variation,reducedMotion:motion.matches});
      frame=requestAnimationFrame(render);
    };frame=requestAnimationFrame(render);
    return()=>{cancelAnimationFrame(frame);landscape.dispose();};
  },[gameId]);
  return <canvas ref={canvas} aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}} />;
}
