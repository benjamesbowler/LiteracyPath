import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {literacyMockRuntimeSources} from '../../tools/generateLiteracyMockRuntime.mjs';
import {loadLiteracyMockBank} from '../../src/data/literacyMockBank.js';
import {loadLiteracyMockRuntimeBank} from '../../src/data/literacyMockRuntimeBank.js';
import {selectLiteracyMockBoundaryPlan} from '../../src/utils/literacyMockBoundaryPlanner.js';
import {mockExecutableAssets} from '../../src/utils/offlineShell.js';

test('the lightweight mixed bank preserves every eligible published item and its exact snapshot',async()=>{
  const authored=await loadLiteracyMockBank({contentVersion:'literacy-mock-v10'}),runtime=await loadLiteracyMockRuntimeBank({contentVersion:'literacy-mock-v10',mixed:true});
  const eligible=authored.filter(item=>item.adaptiveMixedEligible || item.tutorialOnly);
  assert.equal(runtime.length,2600);
  assert.deepEqual(JSON.parse(JSON.stringify(runtime)),JSON.parse(JSON.stringify(eligible)));
  for(const seed of ['cold-sitting','retake','slow-link']) {
    let fullPool,smallPool;
    const options={sessionId:'session',studentId:'student',seed};
    const full=selectLiteracyMockBoundaryPlan(authored,{...options,onOfflineItems:ids=>{fullPool=ids;}});
    const small=selectLiteracyMockBoundaryPlan(runtime,{...options,onOfflineItems:ids=>{smallPool=ids;}});
    assert.deepEqual(small,full);assert.deepEqual(smallPool,fullPool,'All reserved adaptive paths and repair candidates stay identical.');
  }
});

test('exact-task checks retain the full publication and frozen historical sessions still load',async()=>{
  const full=await loadLiteracyMockBank({contentVersion:'literacy-mock-v10'});
  assert.deepEqual(await loadLiteracyMockRuntimeBank({contentVersion:'literacy-mock-v10',mixed:false}),full);
  const old=await loadLiteracyMockRuntimeBank({contentVersion:'literacy-mock-v3',mixed:true});
  assert.equal(old.length,7549);assert.ok(old.every(item=>item.contentVersion==='literacy-mock-v3'));
});

test('generated runtime data and the two instruction recordings match current authoring sources',async()=>{
  for(const [path,source] of await literacyMockRuntimeSources()) {
    assert.equal(fs.readFileSync(new URL('../../'+path,import.meta.url),'utf8'),source,path);
    assert.ok(Buffer.byteLength(source)<3200000,'Keep the full mixed runtime below the reviewed transfer budget.');
  }
});

test('executable preparation selects the matching publication without warming unrelated banks',()=>{
  const build={mockExecutable:{assets:['mixed-v10'],byVersion:{'literacy-mock-v10':['full-v10'],'literacy-mock-v3':['frozen-v3']}}};
  assert.deepEqual(mockExecutableAssets(build,{contentVersion:'literacy-mock-v10',mixed:true}),['mixed-v10']);
  assert.deepEqual(mockExecutableAssets(build,{contentVersion:'literacy-mock-v10',mixed:false}),['full-v10']);
  assert.deepEqual(mockExecutableAssets(build,{contentVersion:'literacy-mock-v3',mixed:true}),['frozen-v3']);
  assert.equal(mockExecutableAssets(build,{contentVersion:'unsupported'}),undefined);
  assert.deepEqual(mockExecutableAssets({mockExecutable:{assets:['previous-build']}}),['previous-build']);
});
