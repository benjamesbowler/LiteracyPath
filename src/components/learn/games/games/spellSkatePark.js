import * as THREE from 'three';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function skateLocalPoint(x, z, zone) {
  const dx = x - zone.x,
    dz = z - zone.z,
    c = Math.cos(zone.rot),
    s = Math.sin(zone.rot);
  return {
    x: dx * c - dz * s,
    z: dx * s + dz * c
  };
}
export function skateRampProfile(zone, z) {
  if (zone.kind === 'quarter') {
    const t = clamp((z + zone.depth) / zone.depth, 0, 1);
    return zone.height * (1 - Math.sqrt(Math.max(0, 1 - t * t)));
  }
  const t = clamp(z / zone.depth + .5, 0, 1);
  return zone.height * t * t * (3 - 2 * t);
}
export function sampleSkateSurface(x, z, ramps = [], platforms = []) {
  let height = 0,
    zone = null;
  for (const ramp of ramps) {
    const p = skateLocalPoint(x, z, ramp);
    if (ramp.kind === 'bowl') {
      const radius = Math.hypot(p.x, p.z);
      if (radius <= ramp.radius) {
        const h = ramp.height * (radius / ramp.radius) ** 2;
        if (h >= height) {
          height = h;
          zone = ramp;
        }
      }
      continue;
    }
    const low = ramp.kind === 'quarter' ? -ramp.depth : -ramp.depth / 2;
    const high = ramp.kind === 'quarter' ? 0 : ramp.depth / 2;
    if (Math.abs(p.x) <= ramp.width / 2 && p.z >= low && p.z <= high) {
      const h = skateRampProfile(ramp, p.z);
      if (h >= height) {
        height = h;
        zone = ramp;
      }
    }
  }
  for (const deck of platforms) {
    const p = skateLocalPoint(x, z, deck);
    if (Math.abs(p.x) <= deck.width / 2 && Math.abs(p.z) <= deck.depth / 2 && deck.height >= height) {
      height = deck.height;
      zone = deck;
    }
  }
  return {
    height,
    zone
  };
}
export function skateSurfaceTilt(x, z, yaw, ramps, platforms) {
  const centre = sampleSkateSurface(x, z, ramps, platforms);
  if (!centre.zone || platforms.includes(centre.zone)) return {
    pitch: 0,
    roll: 0
  };
  const heightAt = (wx, wz) => {
    const local = skateLocalPoint(wx, wz, centre.zone);
    return centre.zone.kind === 'bowl' ? centre.zone.height * Math.min(1, Math.hypot(local.x, local.z) / centre.zone.radius) ** 2 : skateRampProfile(centre.zone, local.z);
  };
  const s = 1.0,
    dx = Math.sin(yaw) * s,
    dz = Math.cos(yaw) * s;
  const front = heightAt(x + dx, z + dz),
    back = heightAt(x - dx, z - dz);
  const lx = Math.cos(yaw) * .5,
    lz = -Math.sin(yaw) * .5;
  const left = heightAt(x - lx, z - lz),
    right = heightAt(x + lx, z + lz);
  return {
    pitch: -Math.atan2(front - back, 2 * s),
    roll: Math.atan2(right - left, 1)
  };
}
export function createSkateRampGeometry(width, depth, height, kind = 'ramp') {
  const profile = {
    width,
    depth,
    height,
    kind
  };
  const vertices = [],
    indices = [];
  const steps = 32;
  for (let j = 0; j <= steps; j++) {
    const z = kind === 'quarter' ? -depth + j / steps * depth : -depth / 2 + j / steps * depth;
    const y = skateRampProfile(profile, z);
    vertices.push(-width / 2, y, z, width / 2, y, z);
  }
  for (let j = 0; j < steps; j++) {
    const a = j * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  // Solid side cheeks follow the identical riding curve.
  for (const side of [-1, 1]) for (let j = 0; j < steps; j++) {
    const z0 = kind === 'quarter' ? -depth + j / steps * depth : -depth / 2 + j / steps * depth;
    const z1 = z0 + depth / steps;
    const a = vertices.length / 3;
    vertices.push(side * width / 2, 0, z0, side * width / 2, skateRampProfile(profile, z0), z0, side * width / 2, 0, z1, side * width / 2, skateRampProfile(profile, z1), z1);
    if (side < 0) indices.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);else indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
function mat(color, roughness = .8, metalness = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness
  });
}
function mesh(geometry, material) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function roundedRect(width, depth, radius) {
  const x = -width / 2,
    z = -depth / 2,
    s = new THREE.Shape();
  s.moveTo(x + radius, z);
  s.lineTo(x + width - radius, z);
  s.quadraticCurveTo(x + width, z, x + width, z + radius);
  s.lineTo(x + width, z + depth - radius);
  s.quadraticCurveTo(x + width, z + depth, x + width - radius, z + depth);
  s.lineTo(x + radius, z + depth);
  s.quadraticCurveTo(x, z + depth, x, z + depth - radius);
  s.lineTo(x, z + radius);
  s.quadraticCurveTo(x, z, x + radius, z);
  return s;
}
export function createSkateDeckGeometry(width, depth, height) {
  const bevel = Math.min(.12, height / 4);
  const g = new THREE.ExtrudeGeometry(roundedRect(width, depth, .55), {
    depth: height - 2 * bevel,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 8
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -height / 2 + bevel, 0);
  return g;
}

// Deliberately composed park landmarks. Custom curved forms, warm timber and
// planted islands create a park rather than an empty plane around the tasks.
export function createSkateParkDressing(theme, difficulty) {
  const root = new THREE.Group();
  root.name = 'AuthoredSkatePark';
  root.userData.obstacles = [];
  const timber = mat('#976a43'),
    stone = mat(difficulty === 'hard' ? '#415276' : '#d4c9b2'),
    leaf = mat(difficulty === 'hard' ? '#507d89' : '#5d9666'),
    metal = mat('#3d6466', .4, .45),
    cream = mat('#eee5cb'),
    roofMat = mat(theme.accent2, .52);
  const low = difficulty === 'easy';
  for (const [x, z] of [[-24, 18], [24, 0], [-24, -22], [24, -43], [-24, -66]]) {
    root.userData.obstacles.push({
      x,
      z,
      radius: 5.4
    });
    const island = new THREE.Group();
    island.position.set(x, 0, z);
    const shape = roundedRect(10, 7, 2);
    const rim = new THREE.ExtrudeGeometry(shape, {
      depth: .75,
      bevelEnabled: true,
      bevelSize: .2,
      bevelThickness: .2,
      bevelSegments: 3,
      curveSegments: 12
    });
    rim.rotateX(-Math.PI / 2);
    island.add(mesh(rim, stone));
    const soil = mesh(new THREE.CylinderGeometry(3, 3, .15, 32), mat('#645643'));
    soil.position.y = .8;
    island.add(soil);
    const trunkPoints = [new THREE.Vector2(.5, 0), new THREE.Vector2(.55, .3), new THREE.Vector2(.34, 3), new THREE.Vector2(.23, 6), new THREE.Vector2(.12, 7)];
    const trunk = mesh(new THREE.LatheGeometry(trunkPoints, 16), timber);
    trunk.position.y = .8;
    trunk.rotation.z = x < 0 ? .06 : -.06;
    island.add(trunk);
    const foliage = new THREE.BufferGeometry();
    const vs = [],
      ix = [];
    const rings = 12,
      segments = 24;
    for (let j = 0; j <= rings; j++) {
      const a = Math.PI * j / rings;
      for (let i = 0; i < segments; i++) {
        const b = Math.PI * 2 * i / segments;
        const r = Math.sin(a) * (3.2 + .28 * Math.sin(b * 3 + a * 4));
        vs.push(Math.cos(b) * r, 6.6 + Math.cos(a) * 3.2, Math.sin(b) * r);
      }
    }
    for (let j = 0; j < rings; j++) for (let i = 0; i < segments; i++) {
      const a = j * segments + i,
        b = j * segments + (i + 1) % segments;
      ix.push(a, b, a + segments, b, b + segments, a + segments);
    }
    foliage.setAttribute('position', new THREE.Float32BufferAttribute(vs, 3));
    foliage.setIndex(ix);
    foliage.computeVertexNormals();
    island.add(mesh(foliage, leaf));
    root.add(island);
    const bench = new THREE.Group();
    bench.position.set(x + (x < 0 ? 7 : -7), 0, z + 1);
    bench.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    root.userData.obstacles.push({
      x: bench.position.x,
      z: bench.position.z,
      radius: 2.5
    });
    for (let row = 0; row < 4; row++) {
      const slat = mesh(createSkateDeckGeometry(5, .36, .16), timber);
      slat.position.set(0, 1.3, row * .42 - .6);
      bench.add(slat);
    }
    for (const bx of [-1.8, 1.8]) {
      const leg = mesh(new THREE.TorusGeometry(.65, .12, 8, 20, Math.PI), metal);
      leg.rotation.z = Math.PI / 2;
      leg.position.set(bx, .65, 0);
      bench.add(leg);
    }
    root.add(bench);
  }
  // Curved welcome pavilion, placed beside the literacy route rather than across it.
  const pavilion = new THREE.Group();
  pavilion.position.set(-38, 0, low ? 4 : 40);
  pavilion.rotation.y = .24;
  for (const px of [-7, 7]) for (const pz of [-4, 4]) root.userData.obstacles.push({
    x: -38 + Math.cos(.24) * px + Math.sin(.24) * pz,
    z: (low ? 4 : 40) - Math.sin(.24) * px + Math.cos(.24) * pz,
    radius: .4
  });
  for (const x of [-7, 7]) for (const z of [-4, 4]) {
    const post = mesh(new THREE.CylinderGeometry(.23, .32, 9, 16), metal);
    post.position.set(x, 4.5, z);
    pavilion.add(post);
  }
  const v = [],
    ind = [];
  for (let j = 0; j <= 24; j++) {
    const x = -9 + j / 24 * 18;
    const y = 9.1 + 1.8 * Math.cos(x / 9 * Math.PI / 2);
    v.push(x, y, -6, x, y, 6);
  }
  for (let j = 0; j < 24; j++) {
    const a = j * 2;
    ind.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const canopy = new THREE.BufferGeometry();
  canopy.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  canopy.setIndex(ind);
  canopy.computeVertexNormals();
  const canopyMat = roofMat.clone();
  canopyMat.side = THREE.DoubleSide;
  pavilion.add(mesh(canopy, canopyMat));
  for (const z of [-5.7, 5.7]) {
    const points = [];
    for (let j = 0; j <= 24; j++) {
      const x = -9 + j / 24 * 18;
      points.push(new THREE.Vector3(x, 9.1 + 1.8 * Math.cos(x / 9 * Math.PI / 2), z));
    }
    pavilion.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 32, .16, 8, false), cream));
  }
  root.add(pavilion);
  // Rounded planted hills beyond the playable boundary provide depth from every
  // route heading. They never overlap collision or teaching destinations.
  const hillMaterial = mat(difficulty === 'hard' ? '#354962' : difficulty === 'medium' ? '#788268' : '#6f9b77');
  for (let index = 0; index < 12; index++) {
    const angle = index * Math.PI / 6;
    const height = 12 + index % 3 * 4;
    const radius = 22 + index % 4 * 3;
    const profile = [];
    for (let ring = 0; ring <= 20; ring++) {
      const t = ring / 20;
      profile.push(new THREE.Vector2(radius * t, height * (1 - t * t) ** 2));
    }
    const hill = mesh(new THREE.LatheGeometry(profile, 36), hillMaterial);
    hill.position.set(Math.sin(angle) * 114, -1, Math.cos(angle) * 114);
    root.add(hill);
  }
  // Wayfinding colour ribbons trace the sides of the open main approach.
  for (const x of [-10.2, 10.2]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(x, .07, 36), new THREE.Vector3(x * 1.1, .07, 0), new THREE.Vector3(x, .07, -40), new THREE.Vector3(x * 1.25, .07, -76)]);
    root.add(mesh(new THREE.TubeGeometry(curve, 64, .1, 6, false), roofMat));
  }
  return root;
}
export function createSkateBowlGeometry(radius, height) {
  const points = [];
  for (let i = 0; i <= 32; i++) {
    const r = radius * i / 32;
    points.push(new THREE.Vector2(r, height * (r / radius) ** 2));
  }
  points.push(new THREE.Vector2(radius + .5, height), new THREE.Vector2(radius + .5, 0));
  return new THREE.LatheGeometry(points, 64);
}
export function skateObstacleAt(x, z, obstacles, radius = 2.15) {
  return obstacles.find(o => Math.hypot(x - o.x, z - o.z) < o.radius + radius) || null;
}
export function skateDeckClearance(x, z, platforms, radius = 4) {
  return platforms.every(deck => {
    const p = skateLocalPoint(x, z, deck);
    return Math.abs(p.x) > deck.width / 2 + radius || Math.abs(p.z) > deck.depth / 2 + radius;
  });
}
export function planSkateRoute(start, target, ramps, platforms, obstacles) {
  const startDeck = sampleSkateSurface(start.x, start.z, [], platforms).zone;
  const avoidDecks = platforms.filter(deck => deck !== startDeck);
  const step = 4,
    limit = 76,
    key = (x, z) => `${x},${z}`,
    snap = v => Math.round(v / step) * step;
  const startNode = {
    x: snap(start.x),
    z: snap(start.z)
  };
  const clearEdge = (from, to) => {
    const count = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.z - from.z)));
    let previous = sampleSkateSurface(from.x, from.z, ramps, platforms).height;
    for (let n = 1; n <= count; n++) {
      const t = n / count,
        x = from.x + (to.x - from.x) * t,
        z = from.z + (to.z - from.z) * t;
      const height = sampleSkateSurface(x, z, ramps, platforms).height;
      if (skateObstacleAt(x, z, obstacles, 4) || !skateDeckClearance(x, z, avoidDecks) || height - previous > .6) return false;
      previous = height;
    }
    return true;
  };
  const open = [{
      ...startNode,
      cost: 0,
      rank: 0
    }],
    costs = new Map([[key(startNode.x, startNode.z), 0]]),
    came = new Map();
  let found = null;
  for (let visited = 0; open.length && visited < 2400; visited++) {
    open.sort((a, b) => a.rank - b.rank);
    const current = open.shift();
    if (Math.hypot(current.x - target.x, current.z - target.z) < step * 1.6 && clearEdge(current, target)) {
      found = current;
      break;
    }
    const height = sampleSkateSurface(current.x, current.z, ramps, platforms).height;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const x = current.x + dx * step,
        z = current.z + dz * step;
      if (Math.abs(x) > limit || Math.abs(z) > limit || skateObstacleAt(x, z, obstacles, 4) || skateObstacleAt((x + current.x) / 2, (z + current.z) / 2, obstacles, 4)) continue;
      if (!skateDeckClearance(x, z, avoidDecks) || !skateDeckClearance((x + current.x) / 2, (z + current.z) / 2, avoidDecks)) continue;
      const origin = key(current.x, current.z) === key(startNode.x, startNode.z) ? start : current;
      if (!clearEdge(origin, {
        x,
        z
      })) continue;
      const nextHeight = sampleSkateSurface(x, z, ramps, platforms).height;
      if (nextHeight - height > 1.2) continue;
      const nextCost = current.cost + Math.hypot(dx, dz) + Math.abs(nextHeight - height) * .5,
        nextId = key(x, z);
      if (nextCost >= (costs.get(nextId) ?? Infinity)) continue;
      costs.set(nextId, nextCost);
      came.set(nextId, current);
      open.push({
        x,
        z,
        cost: nextCost,
        rank: nextCost + Math.hypot(x - target.x, z - target.z) / step
      });
    }
  }
  if (!found) return [];
  const path = [{
    x: target.x,
    z: target.z
  }];
  let node = found;
  while (key(node.x, node.z) !== key(startNode.x, startNode.z)) {
    path.unshift({
      x: node.x,
      z: node.z
    });
    node = came.get(key(node.x, node.z));
    if (!node) return [];
  }
  return path;
}
export function skateFrameSteps(elapsed) {
  const duration = Math.max(0, Math.min(.12, elapsed));
  const count = Math.max(1, Math.ceil(duration / .02));
  return Array.from({
    length: count
  }, () => duration / count);
}
export function nextSkateQuality(tier, averageFrameSeconds) {
  return averageFrameSeconds > .045 ? tier === 'high' ? 'medium' : 'low' : tier;
}

// Shared by live skating and offline normal-cadence route measurements.
export function skateSteering(position,yaw,route){
  while(route.length && Math.hypot(position.x-route[0].x,position.z-route[0].z)<2) route.shift();
  if(!route.length)return {turn:0,push:0,brake:0,limit:0};
  const wanted=Math.atan2(route[0].x-position.x,route[0].z-position.z);
  const delta=Math.atan2(Math.sin(wanted-yaw),Math.cos(wanted-yaw));
  return {turn:clamp(delta*2,-1,1),push:Math.abs(delta)<.65?1:0,brake:Math.abs(delta)>.65?1:0,limit:Math.abs(delta)>.65?0:Math.abs(delta)>.25?7:14};
}
export function skateMotion(state,controls,dt){
  let {speed,yaw}=state;
  if(controls.active){
    const factor=clamp(Math.abs(speed)/controls.maxSpeed,.22,1);
    const drift=controls.brake>0 && Math.abs(speed)>8?1.4:1;
    yaw+=controls.turn*dt*(1.65+factor*1.1)*drift*(speed>=0?1:-1);
    speed+=controls.push*dt*24;
    if(controls.boost)speed+=dt*(speed>=0?32:18);
    speed-=controls.brake*dt*28;
  }
  speed*=state.onGround?Math.pow(.945,dt*8):Math.pow(.984,dt*8);
  return {yaw,speed:clamp(speed,controls.minSpeed,controls.topSpeed)};
}
export function measureSkateTravel(travels,dt=1/60){
  let seconds=0;
  for(const travel of travels){
    const state={...travel.start,onGround:true},route=travel.route.map(point=>({...point}));
    let frames=0;
    while(Math.hypot(state.x-travel.target.x,state.z-travel.target.z)>=travel.radius){
      const input=skateSteering(state,state.yaw,route);
      if(!route.length)break;
      Object.assign(state,skateMotion(state,{...input,active:true,maxSpeed:travel.maxSpeed,minSpeed:0,topSpeed:input.limit},dt));
      state.x+=Math.sin(state.yaw)*state.speed*dt;state.z+=Math.cos(state.yaw)*state.speed*dt;
      seconds+=dt;
      if(++frames>60/dt)throw new Error('Offline skating route did not reach its destination');
    }
  }
  return seconds;
}

export const SKATE_DESTINATION_DISTANCE=52;
export function chooseSkateDestination(start,yaw,index,seed,occupied,ramps,platforms,obstacles){
  const forward=Math.max(Math.abs(start.x),Math.abs(start.z))>35?Math.atan2(-start.x,-start.z):yaw;
  const valid=(x,z)=>Math.hypot(x-start.x,z-start.z)>=SKATE_DESTINATION_DISTANCE &&
    occupied.every(point=>Math.hypot(point.x-x,point.z-z)>10) && skateDeckClearance(x,z,platforms,5) &&
    !skateObstacleAt(x,z,obstacles,5) && sampleSkateSurface(x,z,ramps,platforms).height<.08;
  for(let attempt=0;attempt<60;attempt++){
    const angle=forward+(index-1)*.5+(attempt===0?0:Math.sin(attempt*2.4+seed)*Math.PI);
    const distance=54+(attempt%12)*1.3;
    const x=clamp(start.x+Math.sin(angle)*distance,-70,70),z=clamp(start.z+Math.cos(angle)*distance,-70,70);
    if(valid(x,z))return {x,z};
  }
  const alternatives=[];
  for(let x=-64;x<=64;x+=8)for(let z=-64;z<=64;z+=8)if(valid(x,z))alternatives.push({x,z});
  alternatives.sort((a,b)=>Math.hypot(a.x-start.x,a.z-start.z)-Math.hypot(b.x-start.x,b.z-start.z));
  if(alternatives.length)return alternatives[0];
  throw new Error('Skate park has no clear destination at the required travel distance');
}
