import test from 'node:test';
import assert from 'node:assert/strict';
import { rocketRunItinerary, rocketRunRouteLayout } from '../../src/utils/rocketRunRouteLayout.js';

test('all four passage families advance by actual distance and retain anchors through pause/resize/resume',()=>{
  const families=new Set();
  for(let distance=0;distance<rocketRunRouteLayout({round:4,seed:4294967295}).routeLength;distance++) {
    const state={distance,round:4,seed:4294967295},a=rocketRunRouteLayout(state);
    families.add(a.kind);assert.deepEqual(a,rocketRunRouteLayout({...state,paused:true,width:320,height:340}));
    const b=rocketRunRouteLayout({...state,distance:distance+.5});
    for(const row of a.objects) {
      const moved=b.objects.find(item=>item.id===row.id);
      if(moved) assert.ok(Math.abs(moved.z-row.z-.5)<1e-10,'scenery must use actual motor distance');
      assert.equal(row.motorCollider,false);
      if(row.role==='portal') { assert.equal(row.x,0);assert.equal(row.openChannel,true); }
      else assert.ok(Math.abs(row.x)>=7.8,'distant dressing must preserve the three lane corridor');
    }
  }
  assert.deepEqual([...families].sort(),['asteroid-corridor','comet-side-passage','planet-approach','station-fly-through']);
});

test('nine authored itineraries each retain four passages and materially different order, sides and spacing',()=>{
  const identities=new Set(),geometries=new Set();
  for(const world of ['meadow','dino','moonwood'])for(let round=0;round<3;round++){
    const itinerary=rocketRunItinerary({world,round,seed:0,journeyIndex:0});
    identities.add(itinerary.id);geometries.add(JSON.stringify(itinerary.sections));
    assert.equal(itinerary.sections.length,4);
    assert.deepEqual(new Set(itinerary.sections.map(row=>row.kind)),
      new Set(['planet-approach','asteroid-corridor','station-fly-through','comet-side-passage']));
    const portal=itinerary.sections.find(row=>row.primary==='portal');
    assert.equal(portal.side,0);assert.equal(portal.distance,0);
    for(const section of itinerary.sections){
      assert.ok(section.length>=50&&section.length<=68);
      assert.ok(section.spacing[1]>section.spacing[0]&&section.spacing[1]<section.length);
      assert.ok(section.dressing.every(x=>x>=7.8));
      if(section.primary!=='portal')assert.ok(section.distance>=8);
    }
  }
  assert.equal(identities.size,9);assert.equal(geometries.size,9);
});

test('every world changes genuine round/journey composition while a retry preserves physical identity at uint32 seed edges',()=>{
  for(const world of ['meadow','dino','moonwood'])for(const seed of [0,0x7fffffff,0x80000000,0xffffffff]){
    const initial={world,seed,round:8,journeyIndex:17,distance:115};
    const a=rocketRunRouteLayout(initial);
    assert.deepEqual(a,rocketRunRouteLayout({...initial,paused:true,retry:4,width:568,height:260,
      caughtIds:['kept-word'],firstResponses:[{correct:false}],target:'wrong-source'}));
    assert.notEqual(a.itineraryId,rocketRunRouteLayout({...initial,round:9}).itineraryId);
    assert.notEqual(a.itineraryId,rocketRunRouteLayout({...initial,journeyIndex:18}).itineraryId);
    const itinerary=rocketRunItinerary(initial);itinerary.sections[0].secondary.length=0;
    assert.equal(rocketRunItinerary(initial).sections[0].secondary.length,2);
    for(let distance=0;distance<a.routeLength*2;distance+=.5){
      const first=rocketRunRouteLayout({...initial,distance}),second=rocketRunRouteLayout({...initial,distance:distance+.25});
      for(const row of first.objects){
        assert.equal(row.motorCollider,false);
        assert.equal(row.itineraryId,a.itineraryId);
        const moved=second.objects.find(value=>value.id===row.id);
        if(moved)assert.ok(Math.abs(moved.z-row.z-.25)<1e-10);
        if(row.openChannel)assert.equal(row.x,0);
        else assert.ok(Math.abs(row.x)>=7.8);
      }
    }
  }
});

test('route layout ignores target/correctness/history and returned snapshots cannot mutate later composition',()=>{
  const state={distance:145,round:2,seed:7};
  const a=rocketRunRouteLayout(state),b=rocketRunRouteLayout({...state,target:'m',correct:'moon',firstResponses:[{correct:false}]});
  assert.deepEqual(a,b);a.objects[0].x=999;a.objects.length=0;
  assert.deepEqual(rocketRunRouteLayout(state),b);
  assert.notDeepEqual(rocketRunRouteLayout({...state,round:3}),b,'next chapter gets a deterministic mirrored approach');
});
