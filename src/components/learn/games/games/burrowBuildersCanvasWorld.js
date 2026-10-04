import { effectiveBurrowTerrain, terrainAt, walkingHeight, burrowWaterCells, burrowShelteredBeds, BUILD_SUPPLY_PILES } from '../../../../utils/burrowBuildersRules.js';
import { physicalThemeForDifficulty } from '../shared/physicalArcadeThemes.js';
import { drawPhysicalPalArt, physicalPalFrame, preloadPhysicalPalArt, physicalPalArtDelivery } from '../shared/physicalPalArt.js';

// The fallback projects the same bounded editable world. It owns only rendered
// pixels and hit regions; construction, clocks, curriculum and saves stay in
// the existing controller. Tight cached object layers keep large sculptures
// cheap while still allowing the moving guide to pass behind their real walls.
export function createBurrowProjection(width, height, camera = 0, reading = false) {
  const aspect = width / height, span = height < 460 && width >= 360 ? 13 : aspect < .9 ? 14.8 / aspect : reading ? 11.6 : 11.4;
  const angle = Math.atan2(11, 12) + camera * Math.PI / 2, lookY = !reading && height < 460 && width >= 360 ? 2.8 : width < 500 ? 1.4 : -.4;
  const pitch = Math.atan2((reading ? 12 : 10) - lookY, Math.hypot(11, 12)), scale = height / span;
  const project = (x, y, z) => ({ x: width / 2 - (reading && height < 460 && width >= 500 ? 9 : 0) + (x * Math.cos(angle) - z * Math.sin(angle)) * scale,
    y: height / 2 - (reading && width < 500 ? 20 : 0) - ((y - lookY) * Math.cos(pitch) - (x * Math.sin(angle) + z * Math.cos(angle)) * Math.sin(pitch)) * scale });
  return { project, scale, angle, depth: (x, z) => x * Math.sin(angle) + z * Math.cos(angle) };
}
function inside(point, polygon) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}
function hull(points) {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y), cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x), lower = [], upper = [];
  for (const point of sorted) { while (lower.length > 1 && cross(lower.at(-2), lower.at(-1), point) <= 0) lower.pop(); lower.push(point); }
  for (const point of [...sorted].reverse()) { while (upper.length > 1 && cross(upper.at(-2), upper.at(-1), point) <= 0) upper.pop(); upper.push(point); }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
function polygon(ctx, points) { ctx.beginPath(); for (const [i, p] of points.entries()) i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); ctx.closePath(); }
function surface(ctx, points, image, color, shade = 0, seed = 0) {
  polygon(ctx, points); ctx.fillStyle = color; ctx.fill();
  if (image) {
    const a = points[0], b = points[1], d = points[points.length - 1], crop = image.naturalWidth / (image.naturalWidth > 1500 ? 1 : 1.6);
    const x = (seed * 79 % 101) / 101 * (image.naturalWidth - crop), y = (seed * 43 % 97) / 97 * Math.max(0, image.naturalHeight - crop);
    ctx.save(); polygon(ctx, points); ctx.clip(); ctx.transform((b.x - a.x) / crop, (b.y - a.y) / crop, (d.x - a.x) / crop, (d.y - a.y) / crop, a.x, a.y);
    ctx.drawImage(image, x, y, crop, Math.min(crop, image.naturalHeight), 0, 0, crop, crop); ctx.restore();
  }
  if (shade) { polygon(ctx, points); ctx.fillStyle = `rgba(35,30,27,${shade})`; ctx.fill(); }
  ctx.strokeStyle = 'rgba(57,49,36,.12)'; ctx.lineWidth = .65; polygon(ctx, points); ctx.stroke();
}
function box(ctx, projection, imageBank, { x, y, z, w = 1, h = 1, d = 1, material = 'plank', color = '#d7ae70', rotation = 0, seed = 0 }) {
  const { project, angle } = projection, a = rotation * Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
  const point = (lx, ly, lz) => project(x + lx * c + lz * s, y + ly, z + lz * c - lx * s);
  const faces = [
    { normal: [s, c], points: [[-w / 2, 0, d / 2], [w / 2, 0, d / 2], [w / 2, h, d / 2], [-w / 2, h, d / 2]], shade: .12 },
    { normal: [-s, -c], points: [[w / 2, 0, -d / 2], [-w / 2, 0, -d / 2], [-w / 2, h, -d / 2], [w / 2, h, -d / 2]], shade: .12 },
    { normal: [c, -s], points: [[w / 2, 0, d / 2], [w / 2, 0, -d / 2], [w / 2, h, -d / 2], [w / 2, h, d / 2]], shade: .24 },
    { normal: [-c, s], points: [[-w / 2, 0, -d / 2], [-w / 2, 0, d / 2], [-w / 2, h, d / 2], [-w / 2, h, -d / 2]], shade: .24 },
  ];
  for (const face of faces) if (face.normal[0] * Math.sin(angle) + face.normal[1] * Math.cos(angle) > .001) surface(ctx, face.points.map(p => point(...p)), imageBank.get(material), color, face.shade, seed);
  surface(ctx, [[-w / 2, h, -d / 2], [w / 2, h, -d / 2], [w / 2, h, d / 2], [-w / 2, h, d / 2]].map(p => point(...p)), imageBank.get(material), color, .025, seed);
}
function part(ctx, p, images, block, theme, dry = false) {
  const x = block.x - 5, z = block.z - 5, y = block.y + .035, rotation = block.rotation || 0;
  const a = rotation * Math.PI / 2, c = Math.cos(a), s = Math.sin(a), local = (dx, dz) => ({ x: x + dx * c + dz * s, z: z + dz * c - dx * s });
  const b = (dx, dy, dz, w, h, d, material = 'plank', color = '#ddbd84') => box(ctx, p, images, { ...local(dx, dz), y: y + dy, w, h, d, material, color, rotation, seed: block.x * 13 + block.z * 7 + block.y });
  const dot = (dx, dy, dz, radius, color) => { const loc = local(dx, dz), q = p.project(loc.x, y + dy, loc.z); ctx.beginPath(); ctx.ellipse(q.x, q.y, radius * p.scale, radius * p.scale * .85, 0, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); };
  if (block.type === 'wood' || block.type === 'stone') b(0, 0, 0, .92, .94, .92, block.type === 'wood' ? 'plank' : 'stone');
  if (block.type === 'bridge') {
    for (let i = 0; i < 5; i++) b(0, .015, -.36 + i * .18, .95, .16, .17);
    for (const dz of [-.42, .42]) { for (const dx of [-.43, .43]) b(dx, 0, dz, .09, .6, .09); b(0, .51, dz, 1.05, .09, .09); }
  }
  if (block.type === 'roof') {
    const ridge = .5, eaves = .08, point = (dx, dy, dz) => { const loc = local(dx, dz); return p.project(loc.x, y + dy, loc.z); };
    for (const side of [-1, 1]) surface(ctx, [[0, ridge, -.6], [side * .62, eaves, -.6], [side * .62, eaves, .6], [0, ridge, .6]].map(v => point(...v)), images.get('shingle'), theme.id === 'moonwood' ? '#7882b0' : '#cb9963', side < 0 ? .05 : .14);
    b(0, ridge, 0, .11, .08, 1.26, 'shingle');
  }
  if (block.type === 'window') { b(0, 0, 0, .92, .86, .15); b(0, .12, .035, .70, .63, .18, null, theme.id === 'moonwood' ? '#ffd884' : '#8cdce7'); b(0, .12, .07, .055, .65, .2, null, '#fff3d5'); b(0, .40, .07, .72, .06, .2, null, '#fff3d5'); }
  if (block.type === 'garden') {
    b(0, 0, 0, .95, .2, .95); b(0, .2, 0, .8, .035, .8, 'soil');
    const growth = .12 + .88 * (block.growth || 0);
    for (const [dx, dz] of [[-.22, -.2], [.2, -.2], [-.22, .2], [.2, .2]]) { b(dx, .23, dz, .035, .28 * growth, .035, null, '#538946'); for (const side of [-1, 1]) dot(dx + side * .1 * growth, .24 + .14 * growth, dz, .085 * growth, theme.id === 'moonwood' ? '#6dab9c' : '#71aa48'); dot(dx, .23 + .3 * growth, dz, .1 * growth, theme.id === 'moonwood' ? '#c0a8e8' : '#eeb353'); }
  }
  if (block.type === 'gate') { for (const dx of [-.42, .42]) b(dx, 0, 0, .13, 1, .13); for (const dy of [.26, .66]) b(0, dy, 0, .86, .09, .1); b(0, .1, .01, .075, .82, .11, null, '#f5ddb1'); }
  if (block.type === 'bed') { b(0, .07, 0, .8, .25, .98); b(0, .34, 0, .75, .16, .88, null, '#f7eac7'); b(0, .5, -.28, .7, .08, .25, null, '#eff5ed'); b(0, .5, .15, .75, .10, .58, null, dry ? '#efb565' : '#79adbc'); }
  if (block.type === 'dam') { for (const dx of [-.35, 0, .35]) b(dx, 0, 0, .29, .95, .2); for (const dy of [.25, .7]) b(0, dy, 0, 1, .12, .27); }
  if (block.type === 'channel') for (const dx of [-.43, .43]) b(dx, -.15, 0, .13, .2, .99, 'soil');
}
function cachedLayer(width, height, draw, bounds) {
  const canvas = document.createElement('canvas');
  const left = Math.max(-width, Math.floor(bounds.left)), top = Math.max(-height, Math.floor(bounds.top));
  canvas.width = Math.max(1, Math.ceil(bounds.right - left)); canvas.height = Math.max(1, Math.ceil(bounds.bottom - top));
  const ctx = canvas.getContext('2d'); ctx.translate(-left, -top); draw(ctx);
  return { canvas, x: left, y: top };
}
function boundsFor(p, x, y, z, radius = 1.05, tall = 1.6) {
  const points = [];
  for (const dx of [-radius, radius]) for (const dz of [-radius, radius]) for (const dy of [-.3, tall]) points.push(p.project(x + dx, y + dy, z + dz));
  return { left: Math.min(...points.map(q => q.x)) - 3, right: Math.max(...points.map(q => q.x)) + 3, top: Math.min(...points.map(q => q.y)) - 3, bottom: Math.max(...points.map(q => q.y)) + 3 };
}

export function createBurrowCanvasWorld(mount, { state, api, diagnostics, reducedMotion, loadArt, foliage }) {
  const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true'); canvas.dataset.renderer = 'authored-canvas'; mount.appendChild(canvas);
  const ctx = canvas.getContext('2d'); if (!ctx) { canvas.remove(); return () => {}; }
  let alive = true, frame, imageBank = new Map(), p, width = 0, height = 0, lastKey = '', background, objects = [], overlays = [], hitRegions = [], revision = 0, palLoaded = false, carryLayer, currentTheme;
  const behind = document.createElement('canvas'), front = document.createElement('canvas'), behindContext = behind.getContext('2d'), frontContext = front.getContext('2d');
  let composedSplit = -1, composedRevision = -1;
  let oldTime = 0, rebuilds = 0, assetLoads = 0, heldVisualTime = 0, rasterRatio = 1;
  const sprites = new Map();
  const old = diagnostics.current;
  diagnostics.current = { frames: 0, drawCalls: 0, frameMs: [], renderMs: [], steadyFrameMs: [], steadyRenderMs: [], quality: '2d', renderer: 'canvas', pixelRatio: 1,
    software: Boolean(old.software), transition: old.transition || { reason: 'graphics-unavailable' }, priorGl: { frames: old.frames, drawCalls: old.drawCalls, textures: old.textures, quality: old.quality } };
  const resize = () => { width = Math.max(1, mount.clientWidth); height = Math.max(1, mount.clientHeight); rasterRatio = diagnostics.current.software && width > 650 ? .8 : 1; canvas.width = behind.width = front.width = Math.ceil(width * rasterRatio); canvas.height = behind.height = front.height = Math.ceil(height * rasterRatio); for (const context of [ctx, behindContext, frontContext]) context.setTransform(rasterRatio, 0, 0, rasterRatio, 0, 0); diagnostics.current.pixelRatio = rasterRatio; lastKey = ''; composedSplit = composedRevision = -1; };
  const cache = (id, draw, bounds) => { if (!sprites.has(id)) sprites.set(id, cachedLayer(width, height, draw, bounds)); return sprites.get(id); };
  const add = (id, x, z, draw, bounds, used) => { const sprite = cache(id, draw, bounds); used.add(id); (id.includes(':place:') ? overlays : objects).push({ depth: p.depth(x, z), sprite }); };
  function rebuild(current, world) {
    const theme = physicalThemeForDifficulty(current.difficulty), reading = current.difficulty === 'hard' && !current.freeBuilding && current.phase !== 'creative'; currentTheme = theme;
    p = createBurrowProjection(width, height, world.camera, reading);
    const project = p.project, key = `${width}:${height}:${world.camera}:${reading}:${revision}`, used = new Set(); objects = []; overlays = []; hitRegions = []; rebuilds++;
    const terrain = [];
    for (let z = 0; z < 11; z++) for (let x = 0; x < 11; x++) { const tile = effectiveBurrowTerrain(world, x, z); if (tile) terrain.push({ x, z, ...tile }); }
    terrain.sort((a, b) => p.depth(a.x, a.z) - p.depth(b.x, b.z));
    background?.canvas && (background.canvas.width = background.canvas.height = 0);
    background = cachedLayer(width, height, draw => {
      draw.fillStyle = theme.sky; draw.fillRect(0, 0, width, height);
      const horizon = imageBank.get(`${theme.id}-horizon`);
      if (horizon) { const horizonWidth = width * 1.06, horizonHeight = horizonWidth * horizon.naturalHeight / horizon.naturalWidth; draw.drawImage(horizon, -width * .03, width < 500 ? height * .28 : -height * .05, horizonWidth, horizonHeight); }
      for (const tile of terrain) {
        const x = tile.x - 5, z = tile.z - 5, y = tile.water || tile.dryBed ? -.45 : tile.height;
        box(draw, p, imageBank, { x, y: -3.3, z, h: 1.5, material: 'stone', color: theme.stone, seed: tile.x * 13 + tile.z });
        box(draw, p, imageBank, { x, y: -1.8, z, h: y + 1.8, material: 'soil', seed: tile.x * 13 + tile.z });
        const top = [[x - .5, y, z - .5], [x + .5, y, z - .5], [x + .5, y, z + .5], [x - .5, y, z + .5]].map(v => project(...v));
        if (tile.water) surface(draw, [[x - .5, -.255, z - .5], [x + .5, -.255, z - .5], [x + .5, -.255, z + .5], [x - .5, -.255, z + .5]].map(v => project(...v)), null, theme.id === 'moonwood' ? '#719ec4' : '#8cd5df');
        else {
          const path = !tile.dryBed && tile.z === 3 && [3, 7].includes(tile.x) && !world.blocks.some(b => b.x === tile.x && b.z === tile.z);
          surface(draw, top, imageBank.get(tile.dryBed || path ? 'soil' : 'grass'), theme.ground, 0, tile.x * 19 + tile.z * 7);
        }
        if (tile.water) { const q = project(x, -.25, z); draw.strokeStyle = '#f1fbff88'; draw.lineWidth = 1; draw.beginPath(); draw.ellipse(q.x, q.y, p.scale * .19, p.scale * .05, 0, 0, Math.PI); draw.stroke(); }
        const cell = { x: tile.x, z: tile.z }; hitRegions.push({ polygon: tile.water ? [[x - .5, -.255, z - .5], [x + .5, -.255, z - .5], [x + .5, -.255, z + .5], [x - .5, -.255, z + .5]].map(v => project(...v)) : top, cell, depth: p.depth(x, z) - .1 });
        if (!tile.water && !tile.dryBed && (tile.x === 0 || tile.x === 10 || tile.z === 0 || tile.z === 10) && !world.blocks.some(b => b.x === tile.x && b.z === tile.z)) {
          if ((tile.x * 11 + tile.z * 7) % 5 === 0) { const q = project(x + .3, y + .12, z + .3); for (let petal = 0; petal < 5; petal++) { draw.fillStyle = theme.id === 'moonwood' ? '#d8ceff' : '#fffce5'; draw.beginPath(); draw.ellipse(q.x + Math.cos(petal * 1.257) * p.scale * .035, q.y + Math.sin(petal * 1.257) * p.scale * .025, p.scale * .032, p.scale * .017, 0, 0, Math.PI * 2); draw.fill(); } }
          for (const offset of [-.4, .4]) { const q = project(x + offset, y + .02, z + .4); draw.strokeStyle = theme.foliage; draw.lineWidth = 1.8; draw.beginPath(); draw.moveTo(q.x, q.y); draw.lineTo(q.x - p.scale * .04, q.y - p.scale * .13); draw.moveTo(q.x, q.y); draw.lineTo(q.x + p.scale * .035, q.y - p.scale * .09); draw.stroke(); }
        }
      }
    }, { left: 0, top: 0, right: width, bottom: height });
    const dry = burrowShelteredBeds(world);
    for (const block of world.blocks) {
      const id = `${key}:part:${block.x}:${block.z}:${block.y}:${block.type}:${block.rotation}:${Math.round((block.growth || 0) * 12)}:${dry.some(b => b.x === block.x && b.z === block.z && b.y === block.y)}`;
      add(id, block.x - 5, block.z - 5, draw => part(draw, p, imageBank, block, theme, dry.some(b => b.x === block.x && b.z === block.z && b.y === block.y)), boundsFor(p, block.x - 5, block.y, block.z - 5, (block.type === 'roof' ? .63 : block.type === 'bridge' ? .53 : .5) + .06, ({ bridge: .6, roof: .6, window: .86, garden: .65, gate: 1, bed: .63, dam: .95, channel: .15 })[block.type] + .08 || 1.03), used);
      const [w, h, d] = ({ bridge: [1.05,.6,.95], roof: [1.24,.6,1.26], window: [.92,.86,.2], garden: [.95,.65,.95], gate: [.95,1,.15], bed: [.8,.6,.98], dam: [1,.95,.27], channel: [.99,.15,.99] })[block.type] || [.92,.94,.92], vertices = [], a = block.rotation * Math.PI / 2;
      for (const dx of [-w/2,w/2]) for (const dz of [-d/2,d/2]) for (const dy of [0,h]) vertices.push(project(block.x - 5 + dx * Math.cos(a) + dz * Math.sin(a), block.y + dy, block.z - 5 + dz * Math.cos(a) - dx * Math.sin(a)));
      hitRegions.push({ polygon: hull(vertices), cell: { x: block.x, z: block.z }, depth: p.depth(block.x - 5, block.z - 5) + block.y * .01 });
    }
    for (const [x, z] of [[8, 3], [8, 5], [0, 3], [10, 8]]) {
      const data = foliage[theme.id], image = imageBank.get(`${theme.id}-foliage`), y = terrainAt(x, z, world.islandId)?.height || 0, q = project(x - 5, y, z - 5), treeHeight = (x === 10 ? 2.3 : 3.1) * p.scale, treeWidth = treeHeight * data.tree[2] / data.tree[3];
      add(`${key}:tree:${x}:${z}`, x - 5, z - 5, draw => { draw.fillStyle = '#35462b33'; draw.beginPath(); draw.ellipse(q.x, q.y, p.scale * .5, p.scale * .16, 0, 0, Math.PI * 2); draw.fill(); if (image) draw.drawImage(image, ...data.tree, q.x - treeWidth / 2, q.y - treeHeight, treeWidth, treeHeight); else { draw.fillStyle = theme.foliage; draw.beginPath(); draw.ellipse(q.x, q.y - treeHeight * .65, treeWidth / 2, treeHeight * .35, 0, 0, Math.PI * 2); draw.fill(); } }, { left: q.x - treeWidth / 2 - 3, top: q.y - treeHeight - 3, right: q.x + treeWidth / 2 + 3, bottom: q.y + p.scale * .18 }, used);
    }
    add(`${key}:cottage`, -4, -3, draw => {
      box(draw, p, imageBank, { x: -4, y: 0, z: -3, w: 1.3, h: .2, d: 1.35, material: 'stone' }); box(draw, p, imageBank, { x: -4, y: .2, z: -3, w: 1.1, h: 1.6, d: 1.1 });
      part(draw, p, imageBank, { x: 1, z: 2, y: 1.7, type: 'roof', rotation: 0 }, theme);
      box(draw, p, imageBank, { x: -4.18, y: .25, z: -2.43, w: .38, h: 1.2, d: .06, color: '#875c36' });
      box(draw, p, imageBank, { x: -3.62, y: .85, z: -2.43, w: .3, h: .38, d: .08, material: null, color: theme.id === 'moonwood' ? '#ffe49a' : '#a6e0e4' });
      box(draw, p, imageBank, { x: -3.68, y: 2, z: -3.2, w: .23, h: .45, d: .24, material: 'stone' });
    }, boundsFor(p, -4, 0, -3, 1.2, 2.7), used);
    for (const pile of BUILD_SUPPLY_PILES.filter(v => !world.gathered.includes(v.key) && !world.blocks.some(b => b.x === v.x && b.z === v.z))) add(`${key}:supply:${pile.x}:${pile.z}`, pile.x - 5, pile.z - 5, draw => {
      box(draw, p, imageBank, { x: pile.x - 5, y: 0, z: pile.z - 5, w: .55, h: .55, d: .55, material: pile.type === 'stone' ? 'stone' : 'plank' });
    }, boundsFor(p, pile.x - 5, 0, pile.z - 5), used);
    for (const [x, z] of [[7, 1], [9, 7], [1, 8]]) if (theme.id !== 'meadow') add(`${key}:theme:${x}:${z}`, x - 5, z - 5, draw => { const q = project(x - 5, .35, z - 5); if (theme.id === 'dino') { draw.fillStyle = '#f4e2ae'; draw.beginPath(); draw.ellipse(q.x, q.y, p.scale * .23, p.scale * .31, 0, 0, Math.PI * 2); draw.fill(); draw.fillStyle = '#ad985e'; for (let i = 0; i < 3; i++) { draw.beginPath(); draw.ellipse(q.x + (i - 1) * p.scale * .1, q.y + (i % 2) * p.scale * .1, p.scale * .035, p.scale * .05, 0, 0, Math.PI * 2); draw.fill(); } } else { box(draw, p, imageBank, { x: x - 5, y: 0, z: z - 5, w: .14, h: .8, d: .14, material: null, color: '#e7d4bb' }); const cap = project(x - 5, .85, z - 5); draw.fillStyle = theme.accent; draw.beginPath(); draw.ellipse(cap.x, cap.y, p.scale * .43, p.scale * .23, 0, Math.PI, 2 * Math.PI); draw.fill(); box(draw, p, imageBank, { x: x - 4.6, y: .24, z: z - 5, w: .18, h: .25, d: .18, material: null, color: '#ffde83' }); } }, boundsFor(p, x - 5, 0, z - 5), used);
    const mission = api.current?.mission?.();
    if (mission && current.phase !== 'creative' && !current.freeBuilding) {
      if (mission.kind === 'spelling') add(`${key}:workbench:${current.cursor}:${current.chunks.join('|')}`, -3.2, 4.2, draw => {
        box(draw, p, imageBank, { x: -3.2, y: .47, z: 4.2, w: 2.15, h: .14, d: 2.15 });
        for (const x of [-4.1, -2.3]) for (const z of [3.3, 5.1]) box(draw, p, imageBank, { x, y: 0, z, w: .13, h: .5, d: .13 });
        for (const [i, chunk] of mission.choices.entries()) { const x = -3.9 + i % 3 * .7, z = 3.5 + Math.floor(i / 3) * .7; box(draw, p, imageBank, { x, y: .57, z, w: .62, h: .54, d: .4, material: null, color: '#f6e8c3' }); const q = project(x, .88, z); draw.font = `800 ${Math.max(8, p.scale * .22)}px Nunito,sans-serif`; draw.textAlign = 'center'; draw.fillStyle = '#483a2f'; draw.fillText(chunk, q.x, q.y); }
        box(draw, p, imageBank, { x: -3.3, y: 0, z: 2.65, w: 2.55, h: .15, d: .62 });
        for (let i = 0; i < mission.chunks.length; i++) if (current.chunks[i]) { const q = project(-4.15 + i * .85, .42, 2.65); box(draw, p, imageBank, { x: -4.15 + i * .85, y: .15, z: 2.65, w: .7, h: .5, d: .48, material: null, color: '#e8cd98' }); draw.font = `800 ${p.scale * .23}px Nunito,sans-serif`; draw.fillStyle = '#483a2f'; draw.fillText(current.chunks[i], q.x, q.y); }
      }, boundsFor(p, -3.2, 0, 3.7, 1.7, 1.2), used);
      else for (const [i, cell] of mission.choices.entries()) add(`${key}:place:${current.cursor}:${i}`, cell.x - 5, cell.z - 5, draw => { const q = project(cell.x - 5, Math.max(0, terrainAt(cell.x, cell.z)?.height || 0) + .45, cell.z - 5), size = Math.max(12, p.scale * .24); draw.fillStyle = '#fff5d9'; draw.strokeStyle = '#c5a86f'; draw.lineWidth = 2; draw.beginPath(); draw.arc(q.x, q.y, size, 0, Math.PI * 2); draw.fill(); draw.stroke(); draw.font = `800 ${Math.max(13, p.scale * .3)}px Nunito,sans-serif`; draw.textAlign = 'center'; draw.textBaseline = 'middle'; draw.fillStyle = '#483a2f'; draw.fillText(String(i + 1), q.x, q.y); }, boundsFor(p, cell.x - 5, 0, cell.z - 5), used);
    }
    // Hit regions are derived every rebuild, including when painted layers
    // were reused from cache. Rendering must never own response availability.
    if (mission && current.phase !== 'creative' && !current.freeBuilding) {
      for (const [i, choice] of mission.choices.entries()) {
        const spelling = mission.kind === 'spelling', q = spelling ? project(-3.9 + i % 3 * .7, .88, 3.5 + Math.floor(i / 3) * .7) : project(choice.x - 5, Math.max(0, terrainAt(choice.x, choice.z)?.height || 0) + .45, choice.z - 5), size = spelling ? p.scale * .35 : Math.max(12, p.scale * .24);
        hitRegions.push({ polygon: [{ x: q.x - size, y: q.y - size }, { x: q.x + size, y: q.y - size }, { x: q.x + size, y: q.y + size }, { x: q.x - size, y: q.y + size }], ...(spelling ? { chunk: choice } : { cell: choice }), depth: 1000 + i });
      }
    }
    objects.sort((a, b) => a.depth - b.depth); hitRegions.sort((a, b) => a.depth - b.depth);
    const carryId = `${key}:carry:${world.selectedPart}`; carryLayer = cache(carryId, draw => part(draw, p, imageBank, { x: 5, z: 5, y: 0, type: world.selectedPart, rotation: 0 }, theme, true), boundsFor(p, 0, 0, 0)); used.add(carryId);
    for (const [id, layer] of sprites) if (!used.has(id)) { layer.canvas.width = layer.canvas.height = 0; sprites.delete(id); }
  }
  const select = event => {
    if (api.current?.isPaused?.()) return; const rect = canvas.getBoundingClientRect(), point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    for (const region of [...hitRegions].reverse()) if (inside(point, region.polygon)) { region.chunk ? api.current?.buildChunk(region.chunk) : api.current?.selectCell(region.cell); break; }
  };
  const observer = new ResizeObserver(resize); observer.observe(mount); resize(); canvas.addEventListener('pointerup', select);
  preloadPhysicalPalArt(physicalThemeForDifficulty(state().difficulty).id, { actions: ['tools'] }).then(image => { if (alive) palLoaded = Boolean(image); });
  loadArt(state().difficulty).then(images => { if (!alive) { for (const image of images.values()) if (image) image.src = ''; return; } imageBank = images; assetLoads++; revision++; lastKey = ''; });
  const tick = time => {
    if (!alive) return; frame = requestAnimationFrame(tick); const began = performance.now(), current = state(), world = current.worlds[current.islandId];
    const key = `${width}:${height}:${world.camera}:${world.islandId}:${current.difficulty}:${current.cursor}:${current.phase}:${current.freeBuilding}:${current.chunks.join('|')}:${world.gathered.join('|')}:${world.selectedPart}:${world.blocks.map(b => `${b.x}:${b.z}:${b.y}:${b.type}:${b.rotation}:${Math.round((b.growth || 0) * 12)}`).join('|')}:${revision}`;
    if (lastKey !== key) { rebuild(current, world); lastKey = key; }
    ctx.clearRect(0, 0, width, height); ctx.drawImage(background.canvas, background.x, background.y);
    if (!api.current?.isPaused?.()) heldVisualTime = time / 1000;
    const at = reducedMotion ? 0 : heldVisualTime, moving = !api.current?.isPaused?.() && api.current?.moving?.(), heightY = walkingHeight(world, Math.round(world.player.x), Math.round(world.player.z)) ?? 0;
    const actor = p.project(world.player.x - 5, heightY + .12, world.player.z - 5), actorDepth = p.depth(world.player.x - 5, world.player.z - 5), palScale = width < 500 && height >= 460 ? 1.5 : 1.12, size = 2.2 * p.scale * palScale;
    const relative = (api.current?.facing?.() || 0) - p.angle, direction = Math.abs(Math.sin(relative)) > Math.abs(Math.cos(relative)) ? Math.sin(relative) > 0 ? 'right' : 'left' : Math.cos(relative) > 0 ? 'front' : 'back', action = current.phase === 'celebrating' ? 'celebrate' : 'carry';
    let delivered = false;
    const drawGuide = () => {
      ctx.fillStyle = '#493f3738'; ctx.beginPath(); ctx.ellipse(actor.x, actor.y, size * .16, size * .045, 0, 0, Math.PI * 2); ctx.fill();
      delivered = drawPhysicalPalArt(ctx, { world: currentTheme.id, time: at, moving, direction, action, x: actor.x, y: actor.y, height: size });
      if (!delivered) { ctx.fillStyle = '#ffe08c'; ctx.beginPath(); ctx.ellipse(actor.x, actor.y - size * .43, size * .22, size * .4, 0, 0, Math.PI * 2); ctx.fill(); }
      const pose = physicalPalFrame(currentTheme.id, at, moving, { direction, action }), unit = size / 2.2, pivot = p.project(0, .47, 0);
      const [left, top, right, bottom] = pose.frame.cell, pixelUnit = unit / pose.atlas.pixelsPerUnit, anchorX = pose.mirror ? right - left - pose.frame.anchor[0] : pose.frame.anchor[0];
      diagnostics.current.palBounds = { x: actor.x - anchorX * pixelUnit, y: actor.y - pose.frame.anchor[1] * pixelUnit, width: (right - left) * pixelUnit, height: (bottom - top) * pixelUnit };
      const grip = { x: actor.x + pose.rightHand[0] * unit, y: actor.y - pose.rightHand[1] * unit }, scale = .58 * palScale;
      if (current.phase !== 'celebrating') ctx.drawImage(carryLayer.canvas, grip.x + (carryLayer.x - pivot.x) * scale, grip.y + (carryLayer.y - pivot.y) * scale, carryLayer.canvas.width * scale, carryLayer.canvas.height * scale);
    };
    // Compose every actual structure into two depth banks. Repaint these only
    // when an edit/growth beat occurs or the guide crosses an object's depth.
    // This removes hundreds of alpha-image submissions during steady play,
    // while retaining correct occlusion and every editable saved piece.
    let split = objects.findIndex(item => item.depth > actorDepth); if (split < 0) split = objects.length;
    if (split !== composedSplit || rebuilds !== composedRevision) {
      behindContext.clearRect(0, 0, width, height); frontContext.clearRect(0, 0, width, height);
      for (const [i, item] of objects.entries()) (i < split ? behindContext : frontContext).drawImage(item.sprite.canvas, item.sprite.x, item.sprite.y);
      composedSplit = split; composedRevision = rebuilds;
    }
    ctx.drawImage(behind, 0, 0, width, height); drawGuide(); ctx.drawImage(front, 0, 0, width, height);
    // Reading places remain visible at their truthful world projections even
    // when a tall authored canopy extends across the ground marker.
    for (const item of overlays) ctx.drawImage(item.sprite.canvas, item.sprite.x, item.sprite.y);
    const selection = world.selection, sy = walkingHeight(world, selection.x, selection.z) ?? 0, outline = [[-.47, -.47], [.47, -.47], [.47, .47], [-.47, .47]].map(([dx, dz]) => p.project(selection.x - 5 + dx, sy + .07, selection.z - 5 + dz));
    polygon(ctx, outline); ctx.fillStyle = '#fff0af55'; ctx.fill(); ctx.strokeStyle = '#ffe1a0'; ctx.lineWidth = 2; ctx.stroke();
    if (burrowWaterCells(world).has('5:10')) { const a = p.project(-.44, -.3, 5.49), b = p.project(.44, -.3, 5.49), c = p.project(.44, -3, 5.49), d = p.project(-.44, -3, 5.49); const gradient = ctx.createLinearGradient(a.x, a.y, d.x, d.y); gradient.addColorStop(0, '#c2f4f1c0'); gradient.addColorStop(1, '#8abfd9a0'); polygon(ctx, [a, b, c, d]); ctx.fillStyle = gradient; ctx.fill(); for (let i = 0; i < 8; i++) { const y = -.35 - ((at * 1.5 + i * .31) % 2.6), q = p.project(Math.sin(i * 2.1) * .3, y, 5.5), end = p.project(Math.sin(i * 2.1) * .3, y - .16, 5.5); ctx.strokeStyle = '#f5ffffbc'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(end.x, end.y); ctx.stroke(); } }
    if (!reducedMotion) for (let i = 0; i < 18; i++) {
      const x = Math.sin(i * 9.7) * 4.8, z = Math.cos(i * 12.2) * 4.8;
      if (world.blocks.some(b => b.type === 'roof' && Math.abs(b.x - 5 - x) < .55 && Math.abs(b.z - 5 - z) < .65)) continue;
      const y = 3.5 - ((at + i * .3) % 2.7), q = p.project(x, y, z), end = p.project(x, y - .07, z); ctx.strokeStyle = '#e4f2ff65'; ctx.lineWidth = .75; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(end.x, end.y); ctx.stroke();
    }
    const measured = diagnostics.current;
    if (!api.current?.isPaused?.()) {
      measured.frames++; measured.drawCalls = 0; measured.canvasDraws = 3 + (delivered ? 1 : 0) + (current.phase === 'celebrating' ? 0 : 1) + overlays.length; measured.projectedObjects = objects.length + overlays.length; measured.textures = 0; measured.geometries = 0; measured.authoredPal = delivered ? 'delivered' : palLoaded ? 'pending' : 'unavailable';
      measured.palActions = physicalPalArtDelivery(currentTheme.id);
      measured.artAssets = Object.fromEntries([...imageBank].map(([id, image]) => [id, image ? 'delivered' : 'unavailable'])); measured.decodedImages = [...imageBank.values()].filter(Boolean).length; measured.cachedLayers = sprites.size + 3; measured.cachedDepthBanks = 2; measured.cacheRebuilds = rebuilds; measured.assetLoads = assetLoads;
      const mission = api.current?.mission?.();
      measured.workbenchBricks = mission?.kind === 'spelling' && current.phase !== 'creative' && !current.freeBuilding ? mission.choices.map((chunk, index) => ({ chunk, ...p.project(-3.9 + index % 3 * .7, .88, 3.5 + Math.floor(index / 3) * .7), cursor: current.cursor })) : [];
      measured.readingPlaces = mission?.kind === 'reading' && current.phase !== 'creative' && !current.freeBuilding ? mission.choices.map((cell, index) => ({ index: index + 1, cell: { ...cell }, ...p.project(cell.x - 5, Math.max(0, terrainAt(cell.x, cell.z)?.height || 0) + .45, cell.z - 5), radius: Math.max(12, p.scale * .24), diameter: Math.max(24, p.scale * .48), fontPx: Math.max(13, p.scale * .3), shape: 'circle', cursor: current.cursor })) : [];
      measured.renderMs.push(performance.now() - began); if (oldTime) measured.frameMs.push(time - oldTime); measured.renderMs = measured.renderMs.slice(-180); measured.frameMs = measured.frameMs.slice(-180);
      if (measured.frames > 180) { measured.steadyRenderMs.push(performance.now() - began); if (oldTime) measured.steadyFrameMs.push(time - oldTime); measured.steadyRenderMs = measured.steadyRenderMs.slice(-180); measured.steadyFrameMs = measured.steadyFrameMs.slice(-180); }
    }
    oldTime = api.current?.isPaused?.() ? 0 : time;
  };
  frame = requestAnimationFrame(tick);
  return () => { alive = false; cancelAnimationFrame(frame); observer.disconnect(); canvas.removeEventListener('pointerup', select); canvas.width = canvas.height = behind.width = behind.height = front.width = front.height = 0; canvas.remove(); background?.canvas && (background.canvas.width = background.canvas.height = 0); for (const layer of sprites.values()) layer.canvas.width = layer.canvas.height = 0; sprites.clear(); for (const image of imageBank.values()) if (image) image.src = ''; imageBank.clear(); };
}
