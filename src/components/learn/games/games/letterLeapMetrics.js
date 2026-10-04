const summarize = values => {
  if (!values.length) return { count: 0, meanMs: null, p95Ms: null, maxMs: null };
  const sorted = [...values].sort((a,b)=>a-b);
  return { count: values.length, meanMs: values.reduce((sum,value)=>sum+value,0)/values.length,
    p95Ms: sorted[Math.ceil(sorted.length*.95)-1], maxMs: sorted.at(-1) };
};

/** Ordinary display timestamps and input-to-submission values. There is no
 * synthetic clock, exclusion of slow saves, or claim of physical display latency. */
export function createLetterLeapFrameMetrics({ warmupMs = 15000, limit = 600 } = {}) {
  let start = null, previous = null, inputAt = null;
  const frames=[], renders=[], inputs=[];
  const append=(list,value)=>{list.push(value);if(list.length>limit)list.shift();};
  return {
    input(at) { if (inputAt === null) inputAt=at; },
    reset() { start=previous=inputAt=null;frames.length=renders.length=inputs.length=0; },
    frame(at,submittedAt,renderMs,active) {
      if (!active) { previous=null;inputAt=null;return; }
      if (start===null) start=at;
      if (previous!==null && at-start>=warmupMs) { append(frames,at-previous);append(renders,renderMs); }
      if (inputAt!==null) { append(inputs,Math.max(0,submittedAt-inputAt));inputAt=null; }
      previous=at;
    },
    snapshot() { return { warmupMs, frameInterval:summarize(frames),renderSubmission:summarize(renders),
      inputToSubmission:summarize(inputs),clock:'ordinary requestAnimationFrame; input-to-render submission, not display photon' }; }
  };
}
