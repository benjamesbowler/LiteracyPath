import test from 'node:test';
import assert from 'node:assert/strict';
import { leapAirLandingPlan, leapLandingSteering, leapRaisedDepartureHazard, leapLowOverheadWaypoint, leapWaypointArrived } from '../release/letterLeapNative.js';

test('native steering detects the observed raised-crate walk-off that landed inside a later pit', () => {
  // Retained actual first-loss checkpoint, seed 3, 1280×900. At this point the
  // old 35px edge probe missed the pit; the live controller fell on the next
  // departure. The test changes neither controller state nor course geometry.
  const support = { x: 2274, y: 311.4545454545455, w: 44, h: 40 };
  const state = { player: { x: 2305.8, vx: 4.8, w: 32, onGround: true },
    groundY: 449.4545454545455, pits: [[2420, 2510], [2600, 2685]] };
  assert.equal(leapRaisedDepartureHazard(state, support, 1), true);
  assert.equal(leapRaisedDepartureHazard({ ...state, player: { ...state.player, x: 2240 } }, support, 1), false,
    'Steering waits for the actual edge approach instead of jumping early');
  assert.equal(leapRaisedDepartureHazard({ ...state, pits: [[2600, 2685]] }, support, 1), false,
    'A distant pit does not require jumping from this support');
  assert.equal(leapRaisedDepartureHazard({ ...state, player: { ...state.player, onGround: false } }, support, 1), false,
    'The driver does not repeatedly request impossible midair launches');
});

test('native departure planning respects leftward motion and ordinary clear ground', () => {
  const support = { x: 600, y: 311, w: 44 };
  const state = { player: { x: 612, vx: -4.8, w: 32, onGround: true }, groundY: 449, pits: [[408, 490]] };
  assert.equal(leapRaisedDepartureHazard(state, support, -1), true);
  assert.equal(leapRaisedDepartureHazard({ ...state, pits: [] }, support, -1), false);
  assert.equal(leapRaisedDepartureHazard(state, { ...support, y: 449 }, -1), false);
  assert.equal(leapRaisedDepartureHazard(state, null, -1), false);
});

test('native air steering plans the actual Hard crate descent before the pit rather than chasing the distant L', () => {
  const state = { player: { x: 6708, y: 146.1, h: 46, w: 32, vx: 4.8, vy: .04, onGround: false },
    groundY: 449.4545454545455,
    platforms: [{ x: 6926, y: 373.4545454545455, w: 88 }, { x: 7032, y: 304.4545454545455, w: 88 }],
    blocks: [], pits: [[6838,6928],[7018,7103]] };
  const plan = leapAirLandingPlan(state, 1);
  assert.equal(plan.targetX,6806);
  assert.ok(plan.predictedX > 6838 && plan.predictedX < 6928);
  assert.equal(leapLandingSteering({x:6770,vx:4.8},plan.targetX),0,'Release Right while its real air braking still lands on the near bank');
  assert.equal(leapAirLandingPlan({...state,player:{...state.player,x:6884,y:284.8,vy:.66}},1),null,
    'The retained later launch already lands on the stepping shelf and keeps normal forward input');
  assert.equal(leapAirLandingPlan({...state,player:{...state.player,vy:-2.44}},1),null,'Rising flight retains the original jump');
});

test('air landing plans retain safe approaches and mirrored pit steering', () => {
  const state={player:{x:7100,y:300,h:46,w:32,vx:-4.8,vy:3,onGround:false},groundY:449,
    platforms:[],blocks:[],pits:[[7018,7103]]};
  assert.equal(leapAirLandingPlan(state,-1).targetX,7135);
  assert.equal(leapAirLandingPlan({...state,pits:[]},-1),null);
  assert.equal(leapAirLandingPlan({...state,player:{...state.player,onGround:true}},-1),null);
  assert.equal(leapLandingSteering({x:7140,vx:-4.8},7135),0);
  assert.equal(leapLandingSteering({x:7190,vx:0},7135),-1);
});

test('the observed LANDED low-overhead route uses its actual rising shelves before the ground walker', () => {
  // Source geometry from the captured real73 Continue first loss. The old
  // driver walked under all3 shelves before jumping into crate10570.
  const state = { player: { x: 10267.001895734442, y: 426.4545454545455, h: 46, w: 32, vx: 4.8, onGround: true },
    groundY: 449.4545454545455,
    platforms: [{ x: 10185, y: 383.4545454545455, w: 104, trailShelf: true },
      { x: 10325, y: 309.4545454545455, w: 104, trailShelf: true },
      { x: 10465, y: 241.4545454545455, w: 104, trailShelf: true }],
    blocks: [{ x: 10570, y: 311.4545454545455, w: 44, h: 40, broken: false }] };
  const original = structuredClone(state), goal = { x: 11276, y: 403.4545454545455, ch: 'N' };
  const first = leapLowOverheadWaypoint(state, goal);
  assert.equal(first.x, 10237); assert.equal(first.platform.y, 383.4545454545455);
  const second = leapLowOverheadWaypoint({ ...state, player: { ...state.player, x: first.x, y: first.platform.y - 23 } }, goal);
  assert.equal(second.x, 10377); assert.equal(second.platform.y, 309.4545454545455);
  const third = leapLowOverheadWaypoint({ ...state, player: { ...state.player, x: second.x, y: second.platform.y - 23 } }, goal);
  assert.equal(third.x, 10517); assert.equal(third.platform.y, 241.4545454545455);
  assert.equal(leapLowOverheadWaypoint({ ...state, player: { ...state.player, x: third.x, y: third.platform.y - 23 } }, goal), null);
  assert.deepEqual(state, original, 'The native planner reads geometry and never moves the game world or its learner');
});

test('low-overhead planning preserves near letter contacts, airborne motion and mirrored shelf approaches', () => {
  const state = { player: { x: 10267, y: 426, h: 46, w: 32, onGround: true }, groundY: 449,
    platforms: [{ x: 10185, y: 383, w: 104, trailShelf: true }], blocks: [{ x: 10570, y: 311, w: 44, h: 40 }] };
  assert.equal(leapLowOverheadWaypoint(state, { x: 10400 }), null, 'A nearby real current choice keeps its original path');
  assert.equal(leapLowOverheadWaypoint({ ...state, player: { ...state.player, onGround: false } }, { x: 11276 }), null);
  assert.equal(leapLowOverheadWaypoint({ ...state, blocks: [] }, { x: 11276 }), null);
  assert.equal(leapLowOverheadWaypoint({ ...state, platforms: state.platforms.map(platform => ({ ...platform, y: 200 })) }, { x: 11276 }), null,
    'The planner cannot ask for a shelf above the unchanged full-jump envelope');
  const mirror = { ...state, player: { ...state.player, x: 12000 - state.player.x },
    platforms: state.platforms.map(p => ({ ...p, x: 12000 - p.x - p.w })), blocks: state.blocks.map(b => ({ ...b, x: 12000 - b.x - b.w })) };
  assert.equal(leapLowOverheadWaypoint(mirror, { x: 12000 - 11276 }).x, 12000 - 10237);
});

test('a true higher-box landing completes its covered shelf waypoint instead of leaving zero-distance steering stuck',()=>{
  // Actual native higher-box stall, fresh seed3411259335/stage0/1024, floor424.
  // Its terrain matches the original seed3 parent failure; the differing CAT
  // word bank is retained as an explicit cause-capture scope distinction.
  const shelf={x:5762,y:308,w:104,trailShelf:true},box={x:5822,y:286,w:44,h:40,broken:false};
  const state={player:{x:5813.782303523073,y:263,h:46,w:32,onGround:true},platforms:[shelf],blocks:[box]};
  const waypoint={x:5814,y:285,platform:shelf},before=structuredClone(state);
  assert.equal(leapWaypointArrived(state,waypoint),true);
  assert.equal(leapWaypointArrived({...state,player:{...state.player,onGround:false}},waypoint),false,'flying above a shelf does not finish the route');
  assert.equal(leapWaypointArrived({...state,player:{...state.player,y:401}},waypoint),false,'walking underneath the intended shelf remains unfinished');
  assert.equal(leapWaypointArrived({...state,blocks:[]},waypoint),false,'a declared grounded state without real support cannot clear the waypoint');
  assert.equal(leapWaypointArrived({...state,player:{...state.player,x:5900}},waypoint),false,'a remote higher landing cannot clear this shelf');
  assert.equal(leapWaypointArrived({...state,player:{...state.player,x:5814,y:285}},waypoint),true,'ordinary intended shelf landing is unchanged');
  assert.deepEqual(state,before);
});
