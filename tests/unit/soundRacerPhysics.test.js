import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCircuitPath } from '../../src/utils/soundRacerTracks.js';
import { createKart, stepKart, sampleCircuitPath, angleDelta, chasePose, projectKart, racerFrameSteps, racerDriveSpeed } from '../../src/utils/soundRacerPhysics.js';
const path=buildCircuitPath(560);
test('closed road uses measured metres and continuous seam headings',()=>{
  let length=0;
  for(let i=1;i<path.length;i++) length+=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y,path[i].z-path[i-1].z);
  assert.ok(Math.abs(length-560)<1e-8);
  for(const d of [-2,0,1,279,559,560,601]) {
    const a=sampleCircuitPath(path,d),b=sampleCircuitPath(path,d+560);
    assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<1e-8);
    assert.ok(Math.abs(angleDelta(a.heading,b.heading))<1e-8);
    assert.ok(Math.abs(angleDelta(a.heading,sampleCircuitPath(path,d+0.1).heading))<0.05);
  }
});
test('steering changes independent heading and released steering does not follow the path',()=>{
  const start=createKart(path,60);
  let straight=start,left=start,right=start;
  for(let i=0;i<120;i++) {
    straight=stepKart(path,straight,{steer:0},1/60);
    left=stepKart(path,left,{steer:-0.35},1/60);
    right=stepKart(path,right,{steer:0.35},1/60);
  }
  assert.ok(Math.abs(angleDelta(start.heading,left.heading))>0.1);
  assert.ok(Math.abs(angleDelta(left.heading,right.heading))>0.2);
  for(let i=0;i<600;i++) straight=stepKart(path,straight,{steer:0},1/60);
  assert.ok(straight.recoveries>0,'straight driving must leave a bend');
});
test('normal steering can drive a full closed circuit with left and right turns',()=>{
  let kart=createKart(path),left=0,right=0;
  for(let i=0;i<60*100 && kart.progress<560;i++) {
    const ahead=sampleCircuitPath(path,kart.progress+6);
    const desired=Math.atan2(ahead.x-kart.x,-(ahead.z-kart.z));
    const steer=Math.max(-1,Math.min(1,angleDelta(kart.heading,desired)*2.5));
    if(steer<-.1)left++;if(steer>.1)right++;
    kart=stepKart(path,kart,{steer,speed:9},1/60);
  }
  assert.ok(kart.progress>=560,JSON.stringify(kart));
  assert.equal(kart.recoveries,0);
  assert.ok(left>100 && right>100);
});
test('offroad recovery keeps safe progress and shortcut projection cannot jump track arms',()=>{
  const kart=createKart(path,80);
  const recovery=stepKart(path,{...kart,x:kart.x+30},{steer:0},1/60);
  assert.equal(recovery.recovered,true);
  assert.equal(recovery.progress,80);
  const far=sampleCircuitPath(path,300);
  const projected=projectKart(path,{...kart,x:far.x,z:far.z});
  assert.ok(!projected || Math.abs(projected.progress-80)<=12);
});
test('camera remains behind kart at all headings including the angle seam',()=>{
  for(let d=0;d<560;d+=2) {
    const kart=createKart(path,d),pose=chasePose(kart);
    const behind=(pose.x-kart.x)*Math.sin(kart.heading)-(pose.z-kart.z)*Math.cos(kart.heading);
    assert.ok(behind < 0,'The camera stays behind the kart rather than crossing into its forward travel');
    const sideways=(pose.x-kart.x)*Math.cos(kart.heading)+(pose.z-kart.z)*Math.sin(kart.heading);
    const ahead=(pose.lookX-kart.x)*Math.sin(kart.heading)-(pose.lookZ-kart.z)*Math.cos(kart.heading);
    const lookSideways=(pose.lookX-kart.x)*Math.cos(kart.heading)+(pose.lookZ-kart.z)*Math.sin(kart.heading);
    assert.ok(Math.abs(sideways)<1e-8&&Math.abs(lookSideways)<1e-8,'Chase and look-ahead remain aligned to the actual heading');
    assert.ok(ahead>0&&pose.y>pose.lookY&&pose.lookY>kart.y,'The camera looks forward and down above the real kart');
    const wrapped=chasePose({...kart,heading:kart.heading+Math.PI*2});
    for(const key of ['x','y','z','lookX','lookY','lookZ']) assert.ok(Math.abs(wrapped[key]-pose[key])<1e-8,'Wrapping the heading seam cannot jump the camera');
  }
});

test('raised banked bridge shares tyre height and ignores negative clock steps',()=>{
  const raised=path.reduce((a,b)=>a.y>b.y?a:b);
  assert.ok(raised.y>3);
  assert.ok(path.some(point=>Math.abs(point.bank)>0.03));
  const kart=createKart(path,raised.distance);
  const stable=stepKart(path,kart,{steer:1},-4);
  assert.equal(stable.x,kart.x);assert.equal(stable.z,kart.z);assert.equal(stable.heading,kart.heading);
});


test('assisted steering follows road bends without forcing repeated motor recoveries', () => {
  let kart = createKart(path);
  for (let frame = 0; frame < 60 * 48; frame++) kart = stepKart(path, kart, { roadAssist: true, speed: 15 }, 1 / 60);
  assert.ok(kart.progress > 560, `completed full lap: ${kart.progress}`);
  assert.equal(kart.recoveries, 0);
  assert.ok(Math.abs(kart.lateral) < 1.2);
});

test('assisted left and right turns remain immediate and soft guardrails retain progress', () => {
  let kart = createKart(path, 12);
  for (let frame = 0; frame < 48; frame++) kart = stepKart(path, kart, { roadAssist: true, steer: 1, speed: 15 }, 1 / 60);
  assert.ok(kart.lateral > 1.3);
  const held = kart.progress;
  for (let frame = 0; frame < 60 * 10; frame++) kart = stepKart(path, kart, { roadAssist: true, steer: 1, speed: 15 }, 1 / 60);
  assert.ok(kart.progress > held + 80);
  assert.equal(kart.recoveries, 0);
  assert.ok(Math.abs(kart.lateral) <= 4.16);
  const right = kart.lateral;
  for (let frame = 0; frame < 60; frame++) kart = stepKart(path, kart, { roadAssist: true, steer: -1, speed: 15 }, 1 / 60);
  assert.ok(kart.lateral < right - 2);
});

test('slow rendering preserves wall-clock travel and reading approach speeds', () => {
  let regular = createKart(path), slow = createKart(path);
  for (let frame = 0; frame < 60 * 5; frame++) regular = stepKart(path, regular, { roadAssist: true, speed: 15 }, 1 / 60);
  for (let frame = 0; frame < 50; frame++) for (const dt of racerFrameSteps(.1)) slow = stepKart(path, slow, { roadAssist: true, speed: 15 }, dt);
  assert.ok(Math.abs(slow.progress - regular.progress) < .25);
  assert.deepEqual(racerFrameSteps(0), []);
  assert.ok(racerFrameSteps(3).every(dt => dt <= .025));
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const cruise = racerDriveSpeed({ difficulty });
    const reading = racerDriveSpeed({ difficulty, wordDistance: 10 });
    assert.ok(cruise >= 15 && reading < cruise);
    assert.equal(racerDriveSpeed({ difficulty, wordDistance: 10, boosted: true }), reading);
  }
});
