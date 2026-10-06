import {createQuestFrameBudgetState,sampleQuestFrameBudget} from './questPerformance.js';

const policyTier=tier=>({high:'rich',medium:'balanced',low:'low',canvas:'2d'}[tier]||'low');
const gameTier=tier=>({rich:'high',balanced:'medium',low:'low','2d':'canvas'}[tier]);
const summary=values=>{
  if(!values.length)return{count:0,meanMs:null,p95Ms:null};
  const ordered=[...values].sort((a,b)=>a-b);
  return{count:values.length,meanMs:values.reduce((sum,value)=>sum+value,0)/values.length,p95Ms:ordered[Math.min(ordered.length-1,Math.ceil(ordered.length*.95)-1)]};
};

// A read-only observer of real rAF intervals and input-to-next-render latency.
// The shared sustained-frame policy alone decides quality changes; no frame
// counter accelerates physics or manufactures performance/learning evidence.
export function createSportsFrameTelemetry({now=()=>performance.now()}={}) {
  let budget=null,pendingInput=null,activeTier=null,frameSampleIndex=0;
  const frames=[],inputs=[],changes=[];
  function reset(){pendingInput=null;budget=null;}
  function markInput(){if(pendingInput===null)pendingInput=now();}
  function rendered(frameMs,{tier,active=true,cpuStart}={}) {
    if(!active){reset();return null;}
    if(activeTier!==tier||!budget){activeTier=tier;budget=createQuestFrameBudgetState(policyTier(tier));}
    const end=now(),before=budget.reportFrames;
    const result=sampleQuestFrameBudget(budget,frameMs);
    // The final shared 2D tier deliberately has no further quality decision.
    // Observe its actual active intervals independently; never feed them into
    // a new threshold or treat selecting Canvas as a performance result.
    const canvasInterval=tier==='canvas'&&Number.isFinite(frameMs)&&frameMs>0;
    if(canvasInterval||budget.reportFrames>before||result?.signal){
      frames.push({sampleIndex:++frameSampleIndex,tier,frameMs,renderCpuMs:Number.isFinite(cpuStart)?Math.max(0,end-cpuStart):null});
      if(frames.length>600)frames.shift();
    }
    if(pendingInput!==null){inputs.push({tier,ms:Math.max(0,end-pendingInput)});if(inputs.length>120)inputs.shift();pendingInput=null;}
    if(result?.signal?.type==='quality-change'){
      budget=result.state;
      const change={...result.signal,from:gameTier(result.signal.fromTier),to:gameTier(result.signal.toTier),at:end};
      changes.push(change);if(changes.length>20)changes.shift();return change;
    }
    return null;
  }
  function snapshot(){
    const tiers=[...new Set(frames.map(frame=>frame.tier))];
    return {definition:'Ordinary active rendered rAF intervals: 3D follows shared warmup; Canvas includes active frames after loading, retaining the latest 600 samples. Event to next completed render call is not hardware presentation latency.',
      byTier:Object.fromEntries(tiers.map(tier=>[tier,{frames:summary(frames.filter(frame=>frame.tier===tier).map(frame=>frame.frameMs)),
        renderCpu:summary(frames.filter(frame=>frame.tier===tier&&frame.renderCpuMs!==null).map(frame=>frame.renderCpuMs)),
        inputToRender:summary(inputs.filter(input=>input.tier===tier).map(input=>input.ms))}])),
      inputs:summary(inputs.map(input=>input.ms)),qualityChanges:structuredClone(changes)};
  }
  // The game exposes this receipt only through its separate DEV getter. It
  // reads the existing bounded rows without sampling a clock, mutating a
  // budget or attaching an observer. Pause keeps indices monotonic, so a
  // caller can exclude frames recorded before an actual rendering switch.
  function snapshotFrameRows(){
    return{definition:'Existing latest600 recorded active frame samples; indices advance only when a sample enters this ledger, not during shared warmup or pause.',
      lastSampleIndex:frameSampleIndex,oldestSampleIndex:frames[0]?.sampleIndex??null,
      rows:frames.map(frame=>({...frame}))};
  }
  return{markInput,rendered,reset,snapshot,snapshotFrameRows};
}
