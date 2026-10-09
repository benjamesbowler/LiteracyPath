import { createArcadeRenderGate } from '../shared/arcadeFramePolicy.js';
import { arcadePixelRatio } from '../shared/arcadeRenderBudget.js';
import { createRegisteredPalArtBank, registeredPalCanvasPose, drawRegisteredPalFrame } from '../shared/registeredPalArt.js';
import { drawPhysicalPalFallback } from '../shared/physicalPalFallback.js';
import { physicalThemeForDifficulty } from '../shared/physicalArcadeThemes.js';
import { WORD_CLIMB_ATLASES, WORD_CLIMB_MOVEMENT_ATLASES } from './wordClimbArt.generated.js';
import { WORD_CLIMB_SCENERY } from './wordClimbScenery.generated.js';
import { drawWordClimbScenery, wordClimbSceneryLayout, wordClimbSceneryAtCamera } from './wordClimbScenery.js';
import { wordClimbRegisteredAction } from './wordClimbRegisteredActor.js';
import { climbViewportMetrics, climbGripVineMode } from './wordClimbView.js';
import { climbRouteCenter, climbRouteRadius, climbJourneyWind } from './wordClimbJourney.js';
import { isPacedClimb, pacedClimbSurfaces, pacedClimbCrossings } from './wordClimbPacedRoute.js';
import { createWordClimbCanvasBark, drawWordClimbBarkStrips } from './wordClimbCanvasBark.js';
import { wordClimbRecoveryAtlases, wordClimbRecoveryFrame, WORD_CLIMB_LEGACY_PIP } from './wordClimbRecoveryArt.js';

// Canvas uses the same sole plane, physical shelf coordinates and measured
// source contacts as Three. The renderer never selects a reading answer.
export function wordClimbCanvasProjection(world, width, height) {
  const metrics = climbViewportMetrics(width, height), scale = height / metrics.viewHeight;
  const camera = world.camera + metrics.cameraOffset;
  const project = (x, y) => ({ x: width / 2 + x * scale, y: height - (y - camera) * scale });
  project.scale = scale;
  return { metrics, camera, project, physical: (x, y) => project((x - 500) * metrics.viewWidth / 1000, y) };
}

export function wordClimbCanvasContact(atlas, frame, origin, height, lean = 0) {
  const pose = registeredPalCanvasPose(atlas, frame, { x: 0, y: 0, height });
  const rotate = point => ({ x: origin.x + point.x * Math.cos(lean) - point.y * Math.sin(lean),
    y: origin.y + point.x * Math.sin(lean) + point.y * Math.cos(lean) });
  return { pose, sockets: Object.fromEntries(Object.entries(pose.sockets).map(([name, point]) => [name, rotate(point)])) };
}

export function createWordClimbCanvasWorld(host, world, difficulty, { onReady = () => {}, renderMetrics } = {}) {
  const renderGate = createArcadeRenderGate();
  const theme = physicalThemeForDifficulty(difficulty), heroId = theme.characterId;
  const atlases = { climber: WORD_CLIMB_ATLASES[heroId], movement: WORD_CLIMB_MOVEMENT_ATLASES[heroId], scenery: WORD_CLIMB_SCENERY[theme.id] };
  const bank = createRegisteredPalArtBank(atlases), canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true'); host.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) { bank.dispose(); canvas.remove(); return { dispose() {}, inspect: () => ({ renderer: 'unavailable' }) }; }
  const barkBank = createWordClimbCanvasBark(theme.id);
  let width = 1, height = 1, framing, layout, images = {}, disposed = false, frameId, lastTime = null, summitTime = 0;
  let lastGrip = 'climb-a', action = 'rest', sockets = {}, legacy = null, legacyRequest = null, legacyTimer = null, legacyDelivery = 'not-requested', recoveryBank = null, recoveryAtlases = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  bank.preload().then(values => { if (!disposed) images = Object.fromEntries(Object.keys(atlases).map((key, index) => [key, values[index]])); });
  function resize() {
    renderGate.invalidate();
    width = Math.max(1, host.clientWidth); height = Math.max(1, host.clientHeight);
    const ratio = arcadePixelRatio(1.5, width, height);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    framing = wordClimbCanvasProjection(world, width, height);
    layout = wordClimbSceneryLayout({ viewWidth: framing.metrics.viewWidth, viewHeight: framing.metrics.viewHeight, ascent: world.summitHeight || world.summit * 210 });
  }
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  function requestLegacy() {
    if (legacyDelivery !== 'not-requested' || disposed) return;
    if (theme.id !== 'moonwood') { legacyDelivery = 'unavailable'; return; }
    legacyDelivery = 'pending'; legacyRequest = new Image();
    const settle = image => {
      clearTimeout(legacyTimer); legacyRequest.onload = legacyRequest.onerror = null;
      if (disposed) return;
      legacy = image; legacyDelivery = image ? 'delivered' : 'unavailable';
    };
    legacyRequest.onload = async () => {
      try { if(legacyRequest.naturalWidth!==WORD_CLIMB_LEGACY_PIP.width||legacyRequest.naturalHeight!==WORD_CLIMB_LEGACY_PIP.height)throw Error('Unexpected retained Pip dimensions');await legacyRequest.decode(); settle(legacyRequest); } catch { settle(null); }
    };
    legacyRequest.onerror = () => settle(null); legacyTimer = setTimeout(() => settle(null), 10000);
    legacyRequest.src = WORD_CLIMB_LEGACY_PIP.runtime;
  }
  function requestCanonicalRecovery() {
    if (disposed || recoveryBank) return;
    recoveryAtlases = wordClimbRecoveryAtlases(theme.characterId);
    recoveryBank = createRegisteredPalArtBank(recoveryAtlases);
    recoveryBank.preload().then(() => {
      if (!disposed && Object.values(recoveryBank.delivery()).includes('unavailable')) requestLegacy();
    });
  }
  function bark() {
    const { physical, metrics } = framing;
    const from=Math.floor((framing.camera-40)/18)*18,to=framing.camera+metrics.viewHeight+58;
    const surfaces=isPacedClimb(world.journey)?pacedClimbSurfaces(world.journey,from,to):[{points:[]}];
    if(!isPacedClimb(world.journey))for(let y=from;y<=to;y+=18)surfaces[0].points.push({y,x:climbRouteCenter(world.journey,y,world.journey.branchStartX),radius:climbRouteRadius(world.journey,y)});
    for(const {points} of surfaces){
    const gradient = ctx.createLinearGradient(width * .3, 0, width * .7, 0);
    const barkColors = theme.id === 'dino' ? ['#705c35', '#b5935d', '#675331'] : theme.id === 'moonwood' ? ['#4c3b3e', '#927254', '#493744'] : ['#61462f', '#aa8353', '#62462f'];
    barkColors.forEach((color, index) => gradient.addColorStop(index / 2, color));
    ctx.fillStyle = gradient; ctx.beginPath();
    points.forEach((point, index) => { const p = physical(point.x - point.radius, point.y); if (!index) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    [...points].reverse().forEach(point => { const p = physical(point.x + point.radius, point.y); ctx.lineTo(p.x, p.y); }); ctx.closePath(); ctx.fill();
    drawWordClimbBarkStrips(ctx, barkBank.surface(), points, physical);
    ctx.lineCap = 'round';
    for (let grain = -5; grain <= 5; grain++) {
      ctx.beginPath(); points.forEach((point, index) => { const p = physical(point.x + grain * 23 + Math.sin(point.y / 113 + grain) * 6, point.y); if (!index) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.strokeStyle = grain % 2 ? '#30252655' : '#eed5ad22'; ctx.lineWidth = Math.max(1, framing.project.scale * 2); ctx.stroke();
    }
    // Raised knots use the same world-height spacing as the physical trunk.
    for (let y = Math.floor((framing.camera - 40) / 180) * 180 + 90; y < framing.camera + metrics.viewHeight + 90; y += 180) {
      if(y<points[0].y||y>points.at(-1).y)continue;
      const centre=points.reduce((nearest,p)=>Math.abs(p.y-y)<Math.abs(nearest.y-y)?p:nearest,points[0]).x;
      const p = physical(centre + Math.sin(y / 180) * 22, y), scale = framing.project.scale;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(.15 * Math.sin(y / 210));
      ctx.lineWidth = Math.max(1, scale * 1.5); ctx.strokeStyle = '#392218aa'; ctx.beginPath(); ctx.ellipse(0, 0, 7 * scale, 19 * scale, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#e6be7c55'; ctx.beginPath(); ctx.ellipse(-1.5 * scale, -scale, 5.5 * scale, 17 * scale, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
      }
    if(isPacedClimb(world.journey))for(const bough of pacedClimbCrossings(world.journey)){
      const a=physical(bough.fromX,bough.y),b=physical(bough.toX,bough.y);
      if(a.y<-80||a.y>height+80)continue;
      ctx.strokeStyle=theme.id==='moonwood'?'#b7ab79':'#92a967';ctx.lineWidth=Math.max(3,framing.project.scale*3);ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(a.x,a.y-110*framing.project.scale);ctx.quadraticCurveTo((a.x+b.x)/2,a.y-100*framing.project.scale,b.x,b.y-110*framing.project.scale);ctx.stroke();
      // Nest/lantern landmarks belong to real endpoints of the connected bough.
      const scale=framing.project.scale;
      if(bough.phase==='out'){
        ctx.strokeStyle='#69462e';ctx.lineWidth=Math.max(2,scale*3);ctx.beginPath();ctx.ellipse(b.x+bough.side*18*scale,b.y-18*scale,15*scale,6*scale,0,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle=theme.id==='dino'?'#dfccb0':'#c8d4b2';for(let i=-1;i<=1;i++){ctx.beginPath();ctx.ellipse(b.x+(bough.side*18+i*5)*scale,b.y-21*scale,3*scale,4*scale,0,0,Math.PI*2);ctx.fill();}
      }else{
        ctx.fillStyle='#f5d487';ctx.beginPath();ctx.arc(b.x+bough.side*18*scale,b.y-48*scale,7*scale,0,Math.PI*2);ctx.fill();
      }
    }
  }

  function shelves() {
    const { physical, metrics } = framing;
    for (const platform of world.platforms) {
      const p = physical(platform.x, platform.y), w = platform.width / 1000 * width;
      if (p.y < -80 || p.y > height + 80) continue;
      const h = platform.kind === 'rest' ? Math.max(9, metrics.shelfPixels * .43) : metrics.shelfPixels;
      const anchor = physical(climbRouteCenter(world.journey, platform.y - 40, world.journey.branchStartX), platform.y - 40);
      ctx.lineCap = 'round'; ctx.strokeStyle = '#493022'; ctx.lineWidth = platform.kind === 'rest' ? 7 : 15;
      ctx.beginPath(); ctx.moveTo(anchor.x, anchor.y); ctx.quadraticCurveTo((anchor.x + p.x) / 2, p.y + h * .75, p.x, p.y + h * .45); ctx.stroke();
      ctx.strokeStyle = '#ab7750'; ctx.lineWidth *= .65; ctx.stroke();
      const colors = theme.id === 'dino' ? ['#e0c292', '#b8946b', '#786047'] : theme.id === 'moonwood'
        ? ['#b8a789', '#80735c', '#574d42'] : ['#ddcdad', '#a79c85', '#817359'];
      const stone = ctx.createLinearGradient(0, p.y, 0, p.y + h); colors.forEach((color, index) => stone.addColorStop(index / 2, color)); ctx.fillStyle = stone;
      ctx.beginPath(); ctx.moveTo(p.x - w * .46, p.y); ctx.lineTo(p.x + w * .46, p.y);
      ctx.bezierCurveTo(p.x + w * .55, p.y + h * .15, p.x + w * .46, p.y + h * .8, p.x + w * .32, p.y + h);
      ctx.quadraticCurveTo(p.x, p.y + h * 1.11, p.x - w * .34, p.y + h);
      ctx.bezierCurveTo(p.x - w * .48, p.y + h * .8, p.x - w * .54, p.y + h * .2, p.x - w * .46, p.y); ctx.closePath(); ctx.fill();
      const top = ctx.createLinearGradient(0, p.y, 0, p.y + 7); top.addColorStop(0, theme.id === 'moonwood' ? '#83a89f' : '#b5c985'); top.addColorStop(1, theme.id === 'moonwood' ? '#587969' : '#6f8b52'); ctx.fillStyle = top;
      ctx.fillRect(p.x - w * .47, p.y, w * .94, Math.min(7, h * .24));
      ctx.strokeStyle = '#453b3855'; ctx.lineWidth = 1;
      for (let grain = -1; grain <= 1; grain++) { ctx.beginPath(); ctx.moveTo(p.x + grain * w * .22, p.y + h * .32); ctx.lineTo(p.x + grain * w * .22 + 3, p.y + h * .7); ctx.stroke(); }
      if (platform.kind !== 'rest') {
        const side = platform.x < 500 ? -1 : 1;
        for (let leaf = 0; leaf < 3; leaf++) {
          const x = p.x + side * w * (.39 + leaf * .025), y = p.y + 4;
          ctx.fillStyle = theme.id === 'moonwood' ? '#527957' : '#86a75b';
          ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + side * (12 + leaf * 5), y - 17 - leaf * 5, x + side * (22 + leaf * 4), y - 15 - leaf * 7);
          ctx.quadraticCurveTo(x + side * 13, y + 2, x, y); ctx.fill();
          ctx.strokeStyle = '#d5dba866'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + side * (19 + leaf * 4), y - 13 - leaf * 6); ctx.stroke();
        }
      }
    }
  }
  function physicalProps() {
    const { physical, metrics } = framing;
    for (const obstacle of world.journey.obstacles) {
      const p = physical(obstacle.x, obstacle.y), w = obstacle.width / 1000 * width;
      if (p.y < -70 || p.y > height + 70) continue;
      ctx.strokeStyle = '#643d42'; ctx.lineWidth = Math.max(9, metrics.heroPixels * .09); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x - w / 2, p.y + 4); ctx.quadraticCurveTo(p.x, p.y - 7, p.x + w / 2, p.y); ctx.stroke();
      ctx.fillStyle = '#e0cda6'; for (let index = -1; index <= 1; index++) { const x = p.x + index * w * .27; ctx.beginPath(); ctx.moveTo(x - 4, p.y); ctx.lineTo(x + 1, p.y - 16); ctx.lineTo(x + 7, p.y); ctx.closePath(); ctx.fill(); }
    }
    for (const light of world.journey.lights) {
      if (world.journey.collected.includes(light.id)) continue;
      const p = physical(light.x, light.y); if (p.y < -20 || p.y > height + 20) continue;
      const glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 15); glow.addColorStop(0, '#fff3bd'); glow.addColorStop(.35, '#efc968'); glow.addColorStop(1, '#efc96800'); ctx.fillStyle = glow; ctx.fillRect(p.x - 15, p.y - 15, 30, 30);
    }
    if (world.journey.stageIndex % 3 === 1) {
      const wind = climbJourneyWind(world.journey, world.y, world.elapsed);
      for (let index = 0; index < 4; index++) { const drift = reducedMotion ? 0 : world.elapsed * wind * .4; const p = framing.project(((index * .28 * metrics.viewWidth + drift) % metrics.viewWidth + metrics.viewWidth) % metrics.viewWidth - metrics.viewWidth / 2, world.camera + 50 + index * 64); ctx.fillStyle = '#bed488'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 5, 2, wind > 0 ? -.4 : .4, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  function gripVine(grip, heroHeight) {
    const mode = climbGripVineMode(world.state);
    if (!grip || !mode) return;
    const safe = world.platforms.find(platform => platform.id === world.safeId);
    const anchor = mode === 'ascent' ? { x: grip.x, y: grip.y - 110 * framing.project.scale }
      : framing.physical(500, Math.max((safe?.y || 0) + 180, world.y + 90));
    ctx.strokeStyle = '#c6ba83'; ctx.lineWidth = Math.max(3, heroHeight * .04);
    ctx.beginPath(); ctx.moveTo(anchor.x, anchor.y);
    ctx.quadraticCurveTo((anchor.x + grip.x) / 2 + 22, (anchor.y + grip.y) / 2, grip.x, grip.y); ctx.stroke();
  }
  function registeredActor(owner, collection, selected, point, heroHeight, lean) {
    const { kind, index, frame } = selected;
    sockets = wordClimbCanvasContact(collection[kind], frame, point, heroHeight, lean).sockets;
    gripVine(sockets.grip, heroHeight);
    ctx.save(); ctx.translate(point.x, point.y); ctx.rotate(lean);
    owner.draw(ctx, kind, index, { x: 0, y: 0, height: heroHeight }); ctx.restore();
    host.dataset.pose = action;
  }
  function actor() {
    const point = framing.physical(world.x, world.y), heroHeight = framing.metrics.heroPixels;
    const lean = Math.max(-.12, Math.min(.12, world.vx / 13000));
    action = wordClimbRegisteredAction(world, lastGrip, reducedMotion ? 0 : summitTime || world.elapsed);
    if (action === 'climb-a' || action === 'climb-b') lastGrip = action;
    const kind = ['rest', 'jump-rise', 'jump-fall', 'land', 'summit-a', 'summit-b'].includes(action) ? 'movement' : 'climber';
    const frame = atlases[kind].frames.find(value => value.action === action);
    const delivery = bank.delivery(); sockets = {};
    if (delivery.climber === 'delivered' && delivery.movement === 'delivered' && frame) {
      registeredActor(bank, atlases, { kind, index: atlases[kind].frames.indexOf(frame), frame }, point, heroHeight, lean);
      return 'registered-original-climbing-art';
    }
    if ([delivery.climber, delivery.movement].includes('unavailable')) requestCanonicalRecovery();
    if (recoveryBank && Object.values(recoveryBank.delivery()).every(value => value === 'delivered')) {
      const selected = wordClimbRecoveryFrame(recoveryAtlases, action);
      if (selected) {
        registeredActor(recoveryBank, recoveryAtlases, selected, point, heroHeight, lean);
        return 'canonical-retained-pal-recovery';
      }
    }
    if (legacy) {
      const frame=WORD_CLIMB_LEGACY_PIP.frames[0];
      sockets=wordClimbCanvasContact(WORD_CLIMB_LEGACY_PIP,frame,point,heroHeight,lean).sockets;
      gripVine(sockets.grip,heroHeight);
      ctx.save();ctx.translate(point.x,point.y);ctx.rotate(lean);
      drawRegisteredPalFrame(ctx,legacy,WORD_CLIMB_LEGACY_PIP,frame,{x:0,y:0,height:heroHeight});ctx.restore();
      host.dataset.pose='legacy-pip-image-recovery';return 'legacy-pip-image-recovery';
    }
    if (legacyDelivery === 'unavailable') {
      const pose = drawPhysicalPalFallback(ctx, { world: theme.id, x: point.x, y: point.y, height: heroHeight,
        moving: ['climbing', 'airborne'].includes(world.state), direction: 1, time: world.elapsed,
        action: world.state === 'airborne' ? 'jump' : 'rest' });
      const hand = pose.handSockets.rightHand || pose.handSockets.leftHand;
      if (hand && climbGripVineMode(world.state)) sockets.grip = { ...hand };
      gripVine(sockets.grip, heroHeight); host.dataset.pose = 'procedural-art-unavailable';
      return 'procedural-art-unavailable';
    }
    return 'pending';
  }
  let representation = 'pending';
  function tick(time) {
    if (disposed) return;
    const frozen=world.paused||document.hidden;
    const revision=JSON.stringify([bank.delivery(),recoveryBank?.delivery(),legacyDelivery,barkBank.delivery()]);
    if(!renderGate.shouldRender(frozen,revision)){lastTime=null;frameId=requestAnimationFrame(tick);return;}
    const renderStart=performance.now();
    const dt = lastTime === null || document.hidden ? 0 : Math.max(0, Math.min(.05, (time - lastTime) / 1000)); lastTime = document.hidden ? null : time;
    if (!world.paused && !document.hidden && !reducedMotion) summitTime = world.completed ? summitTime + dt : 0;
    framing = wordClimbCanvasProjection(world, width, height);
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, height); sky.addColorStop(0, theme.sky); sky.addColorStop(1, theme.id === 'moonwood' ? '#8391aa' : '#e6eee6'); ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
    drawWordClimbScenery(ctx, images.scenery, atlases.scenery, wordClimbSceneryAtCamera(layout.route,framing.camera), framing.project);
    bark(); shelves(); physicalProps(); representation = actor();
    drawWordClimbScenery(ctx, images.scenery, atlases.scenery, layout.frame.map(placement => ({ ...placement, y: placement.y + framing.camera })), framing.project);
    host.dataset.registeredClimber = bank.delivery().climber === 'delivered' && bank.delivery().movement === 'delivered' ? 'delivered' : representation;
    host.dataset.authoredScenery = bank.delivery().scenery; host.dataset.renderer = 'canvas';
    host.dataset.barkDelivery = barkBank.delivery();
    const submittedAt=performance.now();renderMetrics?.frame(time,submittedAt,submittedAt-renderStart,!world.paused&&!document.hidden);
    onReady(); frameId = requestAnimationFrame(tick);
  }
  frameId = requestAnimationFrame(tick);
  return { inspect: () => structuredClone({ renderer: 'canvas', world: theme.id, representation, delivery: bank.delivery(), recoveryDelivery: recoveryBank?.delivery() || null, legacyDelivery, action, hand: sockets.grip || null, contacts: sockets,
    sole: framing.physical(world.x, world.y), rendering:renderMetrics?.snapshot()||null, scenery: { layout, textureCount: images.scenery ? 1 : 0 }, bark: barkBank.inspect(), heroHeight: framing.metrics.heroPixels }),
  dispose() { if (disposed) return; disposed = true; cancelAnimationFrame(frameId); observer.disconnect(); bank.dispose(); recoveryBank?.dispose(); barkBank.dispose(); clearTimeout(legacyTimer); if (legacyRequest) { legacyRequest.onload = legacyRequest.onerror = null; legacyRequest.src = ''; } legacy = null; images = {}; canvas.width = canvas.height = 1; canvas.remove(); } };
}
