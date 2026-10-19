import test from 'node:test';
import assert from 'node:assert/strict';
import { assessmentBankWarmupAllowed } from '../../src/policy/assessmentWarmup.js';
import { importWithRetry } from '../../src/utils/lazyWithRetry.js';
import fs from 'node:fs';

test('a mock or unresolved child assignment never downloads unrelated independent-assessment banks',()=>{
 assert.equal(assessmentBankWarmupAllowed({sessionMode:'student',lastContactAt:'',focusSession:null}),false);
 assert.equal(assessmentBankWarmupAllowed({sessionMode:'student',lastContactAt:'confirmed',focusSession:{resolved_config:{plan_kind:'mock'}}}),false);
 assert.equal(assessmentBankWarmupAllowed({sessionMode:'student',lastContactAt:'confirmed',focusSession:null}),true);
 assert.equal(assessmentBankWarmupAllowed({sessionMode:'student',lastContactAt:'confirmed',focusSession:{target:'assessment'}}),true);
 assert.equal(assessmentBankWarmupAllowed({sessionMode:'teacher'}),true);
});

test('an optional background import can fail and retry without replacing the active test or reloading the page',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const original=globalThis.window;let notifications=0,reloads=0,calls=0;
 globalThis.window={dispatchEvent:()=>{notifications++;},sessionStorage:{getItem:()=>null,setItem(){}},location:{reload:()=>{reloads++;}}};
 t.after(()=>{if(original===undefined)delete globalThis.window;else globalThis.window=original;});
 const result=importWithRetry(async()=>{calls++;throw Error('Failed to fetch dynamically imported module');},{reloadOnFailure:false,notifyOnFailure:false});
 const rejected=assert.rejects(result,/dynamically imported module/);
 await Promise.resolve();await Promise.resolve();t.mock.timers.tick(1500);await rejected;
 assert.equal(calls,2);assert.equal(notifications,0);assert.equal(reloads,0);
});

test('Vite preload errors reach their owning importer without a global reload or swallowed import result',()=>{
 const source=fs.readFileSync(new URL('../../src/main.jsx',import.meta.url),'utf8');
 let handler,logged=0,reloaded=0,notified=0,prevented=0;
 const window={addEventListener:(_type,callback)=>{handler=callback;},dispatchEvent:()=>{notified++;}};
 new Function('window','logClientError','reloadOnceForNewVersion','DYNAMIC_IMPORT_ERROR_EVENT',source.slice(source.indexOf("window.addEventListener('vite:preloadError'"),source.indexOf('const rootPath =')))(window,()=>{logged++;},()=>{reloaded++;return false;},'failed');
 handler({payload:Error('offline optional import'),preventDefault:()=>{prevented++;}});
 assert.equal(logged,1);assert.equal(reloaded,0);assert.equal(notified,0);assert.equal(prevented,0);
});
