import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Run the panel's actual request callbacks with controlled network timing.
const source=fs.readFileSync(new URL('../../src/components/progress/TeacherLiteracyMockPanel.jsx',import.meta.url),'utf8');
const bounded=source.slice(source.indexOf('async function boundedRequest('),source.indexOf('\nfunction validResult('));
const refreshSource=source.slice(source.indexOf('  const refreshReport = useCallback('),source.indexOf('\n  useEffect(() => {\n    if (!sessionId)'));
const drain=async()=>{for(let n=0;n<12;n++)await Promise.resolve();};
function host(network){
 const states=[],snapshots=[],reportRequest={current:{sequence:0,pending:null}};
 const deps={client:{},classId:'class',sessionId:'session',document:{hidden:false},alive:{current:true},reportRequest,confirmedReport:{current:null},
  getLiteracyMockReport:network,validResult:v=>v,useCallback:fn=>fn,setReportState:v=>states.push(v),setReportError:()=>{},setSnapshot:v=>snapshots.push(v),statusRef:{current:null},reportHeading:{current:null}};
 const refresh=new Function('deps',`const {${Object.keys(deps).join(',')}}=deps;${bounded};${refreshSource};return refreshReport;`)(deps);
 return {refresh,deps,states,snapshots,reportRequest};
}
const result={session:{id:'session',class_id:'class',mock:{state:'running'}},members:[]};

test('a real report arriving after sixteen seconds remains a valid refresh',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const h=host(()=>new Promise(resolve=>setTimeout(()=>resolve(result),16000)));
 const p=h.refresh();t.mock.timers.tick(16000);await drain();await p;
 assert.deepEqual(h.snapshots,[result]);assert.equal(h.states.at(-1),'ready');
});

test('a report deadline cancels its download before another poll can begin',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});let calls=0,aborted=false;
 const h=host(({signal})=>{calls++;signal?.addEventListener('abort',()=>{aborted=true;});return new Promise(()=>{});});
 const p=h.refresh();await h.refresh({background:true});assert.equal(calls,1);
 t.mock.timers.tick(60000);await drain();await p;
 assert.equal(aborted,true);assert.equal(h.states.at(-1),'error');assert.equal(h.reportRequest.current.pending,null);
});

test('a forced refresh cancels the obsolete read and accepts only the new snapshot',async()=>{
 const pending=[];const h=host(args=>new Promise(resolve=>pending.push({args,resolve})));
 const old=h.refresh(),fresh=h.refresh({force:true});
 assert.equal(pending.length,2);assert.equal(pending[0].args.signal?.aborted,true);
 pending[1].resolve(result);await fresh;
 pending[0].resolve({...result,obsolete:true});await old;
 assert.deepEqual(h.snapshots,[result]);assert.equal(h.reportRequest.current.pending,null);
});

test('leaving a session aborts its in-flight report and releases the old poll',t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval']});let cleanup;
 const controller=new AbortController(),reportRequest={current:{sequence:0,pending:{controller}}};
 const effect=source.slice(source.indexOf('  useEffect(() => {\n    if (!sessionId)'),source.indexOf('\n  const verifiedSnapshot'));
 const deps={sessionId:'session',reportRequest,refreshReport:()=>{},useEffect:fn=>{cleanup=fn();},document:{addEventListener(){},removeEventListener(){}},window:{addEventListener(){},removeEventListener(){}}};
 new Function('deps',`const {${Object.keys(deps).join(',')}}=deps;${effect}`)(deps);
 cleanup();assert.equal(controller.signal.aborted,true);assert.equal(reportRequest.current.pending,null);assert.equal(reportRequest.current.sequence,1);
});
