import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlatformState, setPlatformInput, releasePlatformInput, advancePlatform, platformSnapshot } from '../../src/features/soundSeekers/v3/engine/platformPhysics.js';
const base = { spawn: { x: 80, y: 300 }, bounds: { left: 0, right: 1800, top: -800, bottom: 800 }, solids: [{ x: 0, y: 300, width: 1800, height: 100 }] };
const run = (s, n = 120) => { const events = []; for (let i=0;i<n;i++) events.push(...advancePlatform(s,1/120).events); return events; };
test('fixed-step horizontal simulation agrees across frame rates and brakes on release', () => {
 const a=createPlatformState(base), b=createPlatformState(base);
 setPlatformInput(a,{right:true}); setPlatformInput(b,{right:true});
 run(a,120); for(let i=0;i<30;i++) advancePlatform(b,1/30);
 assert.equal(a.x,b.x); assert.equal(a.y,b.y); assert.equal(a.grounded,true);
 releasePlatformInput(a); run(a,30); assert.equal(a.vx,0);
});
test('variable jump, buffer and coyote support deliberate movement without auto hopping',()=>{
 const full=createPlatformState(base), short=createPlatformState(base);
 for(const s of [full,short]) {run(s,2);setPlatformInput(s,{jump:true});run(s,8);}
 setPlatformInput(short,{jump:false});run(full,15);run(short,15);assert.ok(full.y<short.y);
 assert.equal(run(full,240).filter(e=>e.type==='jump').length,0);
 const edge=createPlatformState({...base,spawn:{x:170,y:300},solids:[{x:0,y:300,width:200,height:80}]});
 run(edge,2);setPlatformInput(edge,{right:true});while(edge.grounded) run(edge,1);
 setPlatformInput(edge,{jump:true});assert.ok(run(edge,1).some(e=>e.type==='jump'));
 const buffered=createPlatformState({...base,spawn:{x:80,y:260}}); buffered.vy=400;setPlatformInput(buffered,{jump:true});
 assert.ok(run(buffered,20).some(e=>e.type==='jump'));
});
test('solid sides and undersides block while one-way shelves allow ascent and catch descent',()=>{
 const wall=createPlatformState({...base,solids:[...base.solids,{x:180,y:180,width:40,height:120}]});
 setPlatformInput(wall,{right:true});run(wall,120);assert.equal(wall.x,163);
 const ceiling=createPlatformState({...base,solids:[...base.solids,{x:0,y:170,width:200,height:20}]});run(ceiling,2);setPlatformInput(ceiling,{jump:true});
 let highest=300;for(let i=0;i<60;i++){run(ceiling,1);highest=Math.min(highest,ceiling.y);}assert.ok(highest>=244);
 const shelf=createPlatformState({...base,platforms:[{x:0,y:210,width:200}]});run(shelf,2);setPlatformInput(shelf,{jump:true});
 let above=false;for(let i=0;i<180;i++){run(shelf,1);if(shelf.y<210)above=true;}assert.equal(above,true);assert.equal(shelf.y,210);assert.equal(shelf.grounded,true);
});
test('fall restores checkpoint, clears input and emits only motor recovery',()=>{
 const s=createPlatformState({...base,solids:[{x:0,y:300,width:220,height:80}],checkpoints:[{id:'camp',x:40,y:240,width:120,height:70,spawn:{x:90,y:300}}]});
 run(s,2);assert.equal(s.lastCheckpointId,'camp');setPlatformInput(s,{right:true});const events=run(s,400);
 assert.equal(s.recoveries,1);assert.equal(s.x,90);assert.equal(s.input.right,false);assert.ok(events.some(e=>e.type==='recover'&&e.checkpointId==='camp'));assert.ok(events.every(e=>!('correct' in e)));
});
test('snapshot validates finite values, terrain, checkpoint identity and clears held input',()=>{
 const s=createPlatformState(base);setPlatformInput(s,{right:true});run(s,30);const snap=platformSnapshot(s);
 const restored=createPlatformState({...base,snapshot:snap});assert.equal(restored.x,s.x);assert.equal(restored.input.right,false);
 for(const bad of [{...snap,x:NaN},{...snap,y:350},{...snap,vx:Infinity},{...snap,x:-400}])assert.equal(createPlatformState({...base,snapshot:bad}).x,80);
 assert.throws(()=>createPlatformState({...base,spawn:{x:80,y:350}}));
 assert.equal(createPlatformState({...base,snapshot:{...snap,lastCheckpointId:'invented'}}).lastCheckpointId,null);
});
test('time spikes are bounded, cancellation removes buffered jumps and vertical camera follows within bounds',()=>{
 const s=createPlatformState({...base,camera:{width:400,height:300,vertical:true}});assert.equal(advancePlatform(s,Infinity).steps,0);assert.equal(advancePlatform(s,100).steps,30);
 setPlatformInput(s,{jump:true});releasePlatformInput(s);assert.equal(run(s,10).some(e=>e.type==='jump'),false);
 const oldY=s.camera.y;setPlatformInput(s,{jump:true});run(s,30);assert.ok(s.camera.y<oldY);assert.ok(s.camera.x>=0);assert.ok(s.camera.y>=-800);
});
