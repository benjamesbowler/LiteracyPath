import test from 'node:test';
import assert from 'node:assert/strict';
import { waitPhysicalGameAssets, physicalGameActionTextures } from '../../src/components/learn/games/games/physicalGameWarmup.js';
test('existing asset settlement is bounded and cannot revive a replaced world',async()=>{
 assert.equal(await waitPhysicalGameAssets([Promise.resolve()],()=>true),true);
 assert.equal(await waitPhysicalGameAssets([Promise.resolve()],()=>false),false);
 assert.equal(await waitPhysicalGameAssets([Promise.reject(Error('asset'))]),false);
 assert.equal(await waitPhysicalGameAssets([new Promise(()=>{})],()=>true,2),false);
});
test('inactive original action atlases are included and shared textures deduplicated',()=>{
 const idle={},tools={},tennis={};const nodes=[{userData:{authoredPal:{maps:new Map([['idle',idle],['tools',tools]])}}},{userData:{authoredPal:{maps:new Map([['idle',idle],['tennis',tennis]])}}}];
 assert.deepEqual([...physicalGameActionTextures({traverse:fn=>nodes.forEach(fn)})],[idle,tools,tennis]);
});
