import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Exercise the page's actual callbacks/effect with external network and React
// scheduling controlled by the host. No receipt/scoring implementation is copied.
const source = fs.readFileSync(new URL('../../src/components/progress/LiteracyMockPage.jsx', import.meta.url), 'utf8');
const callback = (start, end, name, deps) => new Function('deps', `const {${Object.keys(deps).join(',')}}=deps;${source.slice(source.indexOf(start), source.indexOf(end))};return ${name};`)(deps);
const drain = async () => { for (let n = 0; n < 12; n++) await Promise.resolve(); };

function host(overrides = {}) {
  const device = {current:{box:{run:{status:'completed'},requests:[{requestId:'retained'}]},media:{},retryAt:0,failures:0}};
  const owner = {current:{active:true,mock:{delivery_mode:'quiet'}}};
  const deps = {device,owner,useCallback:fn=>fn,client:{},token:'token',sessionId:'session',projectionFor:()=>{},accept:()=>{},requestId:()=> 'same-batch',
    getStudentLiteracyMockRun:async()=>({ok:true}),setConnected:()=>{},setLoading:()=>{},setDeviceError:()=>{},setBoxState:()=>{},setRun:()=>{},writeMockOutbox:()=>true,
    syncStudentLiteracyMockBatch:async()=>({ok:true}),prepareMockDelivery:box=>({...box,delivery:{batchId:'same-batch',leaseId:'lease',sent:{requests:box.requests}}}),
    acknowledgeMockOutbox:box=>({...box,requests:[],delivery:null}),deliveryRef:{current:()=>{}},...overrides};
  return {deps,device,owner};
}

test('a full progress read cannot compete with an active durable answer upload',async()=>{
  let reads=0;const h=host({getStudentLiteracyMockRun:async()=>{reads++;return {ok:true};}});h.device.current.flushing=true;
  const refresh=callback('  const refresh = useCallback(', '  useEffect(() => {\n    const lifetime', 'refresh',h.deps);
  await refresh();assert.equal(reads,0,'The lightweight session follower still supplies teacher controls; do not download another full answer history during delivery.');
});

test('a progressing slow upload can receive its real acknowledgement after sixteen seconds',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});let acknowledged=0;
  const h=host({syncStudentLiteracyMockBatch:()=>new Promise(resolve=>setTimeout(()=>resolve({ok:true}),16000)),acknowledgeMockOutbox:box=>{acknowledged++;return {...box,requests:[],delivery:null};}});
  const flush=callback('  const flushDevice = useCallback(', '  useEffect(()=>{deliveryRef.current=flushDevice;', 'flushDevice',h.deps);
  const pending=flush();t.mock.timers.tick(16000);await drain();await pending;
  assert.equal(acknowledged,1);assert.equal(h.device.current.failures,0);assert.equal(h.device.current.box.requests.length,0);
});

test('a transfer that never responds still times out with its exact retry retained',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});let aborted=false;
  const h=host({syncStudentLiteracyMockBatch:({signal})=>{signal.addEventListener('abort',()=>{aborted=true;});return new Promise(()=>{});}});
  const flush=callback('  const flushDevice = useCallback(', '  useEffect(()=>{deliveryRef.current=flushDevice;', 'flushDevice',h.deps);
  const pending=flush(),delivery=h.device.current.box.delivery;
  t.mock.timers.tick(30000);await drain();await pending;
  assert.equal(aborted,true);assert.equal(h.device.current.flushing,false);assert.equal(h.device.current.failures,1);
  assert.equal(h.device.current.box.delivery,delivery);assert.deepEqual(h.device.current.box.requests,[{requestId:'retained'}]);
});

test('delivery retries keep running while the page rerenders more often than their interval',async t=>{
  t.mock.timers.enable({apis:['setInterval']});let deliveries=0,previous,cleanup;
  const effect=source.slice(source.indexOf('  useEffect(() => {\n    const timer=setInterval'),source.indexOf('  useEffect(()=>()=>{device.current.preparationController?.abort();'));
  const useEffect=(fn,deps)=>{if(!deps||!previous||deps.some((x,i)=>x!==previous[i])){cleanup?.();cleanup=fn();previous=deps;}};
  const render=new Function('useEffect','deliveryRef','device','window',effect);
  const deliveryRef={current:()=>{deliveries++;}},device={current:{retryAt:0}},window={addEventListener(){},removeEventListener(){}};
  t.after(()=>cleanup?.());
  for(let n=0;n<20;n++){render(useEffect,deliveryRef,device,window);t.mock.timers.tick(500);}
  assert.equal(deliveries,5,'Clock/presence renders must not reset the retry interval.');
});
