import { createRegisteredPalArtBank, drawRegisteredPalFrame } from '../shared/registeredPalArt.js';
import { REEL_READ_ART } from './reelReadArtData.js';
import { reelReadStageLayout, reelReadOperatorFrame } from '../../../../utils/reelReadMotion.js';
import { reelReadSceneGeometry } from '../../../../utils/reelReadSceneGeometry.js';

const worlds = { easy: 'meadow', medium: 'dino', hard: 'moonwood' };
const characters = { meadow: 'bouncy', dino: 'chompy', moonwood: 'pip' };

export function createReelReadWorld(canvas, { difficulty, onDelivery = () => {} }) {
  const world = worlds[difficulty] || 'meadow', character = characters[world];
  const actionId = `${character}-fishing-actions-v1`, fallbackId = `${character}-fishing-fallback-v1`;
  const art = createRegisteredPalArtBank({ [actionId]: REEL_READ_ART[actionId] });
  const ctx = canvas.getContext('2d', { alpha: false }), images = new Map(), statuses = new Map(), cancellations = new Set();
  const reducedMotion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  let width = 1, height = 1, ratio = 1, disposed = false, scene = {};
  const report = () => { if (!disposed) onDelivery({ assets: Object.fromEntries(statuses), actions: art.delivery() }); };
  function load(id) {
    const asset = REEL_READ_ART[id]; if (!asset || statuses.has(id)) return;
    statuses.set(id, 'pending'); const image = new Image(); let settled = false;
    const finish = delivered => {
      if (settled) return; settled = true; clearTimeout(timer); cancellations.delete(cancel); image.onload = image.onerror = null;
      if (disposed) return; statuses.set(id, delivered ? 'delivered' : 'unavailable');
      if (delivered) images.set(id, image);
      else if (!id.includes('-fallback-')) load(id.replace('-v1', '-fallback-v1'));
      report();
    };
    const timer = setTimeout(() => finish(false), 10000), cancel = () => finish(false); cancellations.add(cancel);
    image.onload = async () => {
      if (image.naturalWidth !== asset.width || image.naturalHeight !== asset.height) { finish(false); return; }
      try { await image.decode(); finish(true); } catch { finish(false); }
    };
    image.onerror = () => finish(false); image.src = asset.runtime;
  }
  load(`${world}-fishing-venue-v1`); load(`${world}-fishing-kit-v1`); load(fallbackId);
  void art.preload([actionId]).then(report);
  function selected(name) {
    if (images.has(name)) return { image: images.get(name), asset: REEL_READ_ART[name], primary: true };
    const fallback = name.replace('-v1', '-fallback-v1');
    return images.has(fallback) ? { image: images.get(fallback), asset: REEL_READ_ART[fallback], primary: false } : null;
  }
  function part(kit, name, destination, index = null) {
    if (!kit) return false;
    const rect = index === null ? kit.asset.parts[name] : kit.asset.parts[name][index];
    ctx.drawImage(kit.image, rect[0], rect[1], rect[2]-rect[0], rect[3]-rect[1],
      destination.x, destination.y, destination.width, destination.height);
    return true;
  }
  function geometry(state) {
    const layout = reelReadStageLayout(width, height), frame = reelReadOperatorFrame(state);
    const actorReady = art.delivery()[actionId] === 'delivered';
    const actorAsset = actorReady ? REEL_READ_ART[actionId] : REEL_READ_ART[fallbackId];
    const actorFrame = actorReady ? actorAsset.frames[frame] : actorAsset.frames[0];
    const kit = selected(`${world}-fishing-kit-v1`), parts = kit?.asset.parts || REEL_READ_ART[`${world}-fishing-kit-v1`].parts;
    return reelReadSceneGeometry(state,layout,{actorAsset,actorFrame,
      referenceFrames:REEL_READ_ART[actionId].frames,parts,actorReady,frame});
  }
  function drawFish(kit, fish, layout, index, opacity = 1) {
    const scale = layout.fishScale;
    ctx.save(); ctx.globalAlpha = opacity;
    if(kit) {
      const rect = kit.asset.parts.fish[index%kit.asset.parts.fish.length], centre = kit.asset.parts.labelCentres[index%kit.asset.parts.labelCentres.length];
      ctx.drawImage(kit.image, rect[0], rect[1], rect[2]-rect[0], rect[3]-rect[1],
        fish.labelX-(centre[0]-rect[0])*scale, fish.labelY-(centre[1]-rect[1])*scale,
        (rect[2]-rect[0])*scale, (rect[3]-rect[1])*scale);
    } else {
      // A simultaneous primary/derivative failure never makes the moving
      // reading choices invisible. This declared emergency motor drawing is
      // not treated as delivery of the original fishing kit.
      ctx.fillStyle='#2a9bd7';ctx.strokeStyle='#172b4d';ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(fish.labelX,fish.labelY+layout.fishBodyOffset,layout.fishBodyRadiusX,layout.fishBodyRadius,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    }
    // The live wooden plaque accommodates the longest retained reading word
    // without shrinking letters. Fish anatomy remains its original pixels.
    ctx.translate(fish.labelX, fish.labelY); ctx.rotate(kit?.asset.parts.labelAngle || 0);
    ctx.fillStyle = '#fff7df'; ctx.strokeStyle = '#a26a2f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(-layout.fishFaceWidth/2, -layout.fishFaceHeight/2, layout.fishFaceWidth, layout.fishFaceHeight, 7);
    ctx.fill(); ctx.stroke(); ctx.fillStyle = '#172b4d'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `900 ${layout.fishFontSize}px Nunito,system-ui,sans-serif`; ctx.fillText(fish.word, 0, 0); ctx.restore();
  }
  function draw(state, at) {
    const view = geometry(state), { layout, hull, pose, placement, rod } = view;
    const venue = selected(`${world}-fishing-venue-v1`), kit = selected(`${world}-fishing-kit-v1`);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.fillStyle = '#dbeafe'; ctx.fillRect(0, 0, width, height);
    if (venue) {
      const split = venue.asset.sourceWaterlineRatio || .51;
      const scale = Math.max(width/venue.asset.width, layout.waterTop/(venue.asset.height*split), (height-layout.waterTop)/(venue.asset.height*(1-split)));
      ctx.drawImage(venue.image, (width-venue.asset.width*scale)/2, layout.waterTop-venue.asset.height*scale*split,
        venue.asset.width*scale, venue.asset.height*scale);
    }
    const water = ctx.createLinearGradient(0, layout.waterTop, 0, height);
    water.addColorStop(0, '#2a9bd726'); water.addColorStop(1, '#174d7999');
    ctx.fillStyle = water; ctx.fillRect(0, layout.waterTop, width, height-layout.waterTop);
    ctx.strokeStyle = '#ffffff45'; ctx.lineWidth = 1.5;
    for (let index = 0; index < 7; index++) {
      const x = (((reducedMotion ? 0 : state.elapsed*(12+index))+index*173)%(width+160))-80;
      const y = layout.waterTop+8+index*9;
      ctx.beginPath(); ctx.ellipse(x, y, 35+index*4, 2, 0, 0, Math.PI); ctx.stroke();
    }
    if (kit) {
      part(kit, 'jetty', { x: -12, y: layout.waterTop-layout.hullHeight*.6, width: layout.boatWidth*.65, height: layout.hullHeight*.85 });
      for (const side of [0,1]) part(kit, side ? 'rightBank' : 'leftBank', { x: side ? width-78 : -22, y: height-120, width: 100, height: 128 });
      part(kit, 'smallRipple', { x: hull.x-12, y: layout.waterTop+12, width: hull.width+24, height: 38 });
      part(kit, 'hull', hull);
      part(kit, 'basket', {x:hull.x+hull.width*.73,y:layout.waterTop-22,width:44,height:48});
    } else {
      ctx.fillStyle='#fff7df';ctx.strokeStyle='#a26a2f';ctx.lineWidth=4;
      ctx.beginPath();ctx.moveTo(hull.x,hull.y+hull.height*.3);ctx.lineTo(hull.x+hull.width,hull.y+hull.height*.3);
      ctx.lineTo(hull.x+hull.width*.84,hull.y+hull.height);ctx.lineTo(hull.x+hull.width*.15,hull.y+hull.height);ctx.closePath();ctx.fill();ctx.stroke();
    }
    const actorDelivered = view.actorReady ? art.draw(ctx, actionId, view.frame, placement) : false;
    const fallback = images.get(fallbackId);
    if (!actorDelivered && fallback && !view.actorReady)
      drawRegisteredPalFrame(ctx,fallback,view.actorAsset,view.actorFrame,placement);
    if (kit && rod) {
      const rect = kit.asset.parts.rod, matrix = rod.matrix;
      ctx.save(); ctx.transform(matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f);
      ctx.drawImage(kit.image,rect[0],rect[1],rect[2]-rect[0],rect[3]-rect[1],rect[0],rect[1],rect[2]-rect[0],rect[3]-rect[1]); ctx.restore();
    } else if(rod) {
      ctx.strokeStyle='#a26a2f';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(rod.origin.x,rod.origin.y);ctx.lineTo(rod.tip.x,rod.tip.y);ctx.stroke();
    }
    for (const fish of state.fish) if (fish.visible && fish.id !== state.fight?.fishId)
      drawFish(kit, fish, layout, fish.slot);
    if (state.hook && rod) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(rod.tip.x,rod.tip.y);
      ctx.quadraticCurveTo((rod.tip.x+state.hook.x)/2+(state.fight?.sway||0)*8,
        (rod.tip.y+state.hook.y)/2, state.hook.x,state.hook.y); ctx.stroke();
      if (kit) part(kit,'hook',{x:state.hook.x-7,y:state.hook.y-12,width:14,height:24});
      if (state.fight) {
        const caught = state.fish.find(f=>f.id===state.fight.fishId);
        if (caught) drawFish(kit,{...caught,labelX:state.hook.x,labelY:state.hook.y-layout.fishBodyOffset},layout,caught.slot);
      }
    }
    scene = { world,character,frameAt:at,layout,boat: hull,boatRoute:view.route,actor:{frame:view.actorReady?view.frame:0,requestedFrame:view.frame,placement,bounds:view.bodyBounds,source:pose.source,sockets:pose.sockets,delivered:actorDelivered},
      rod:rod && {tip:rod.tip,rodGrip:rod.origin,reelGrip:rod.reelGrip,held:view.rodHeld,
        pairedContact:view.rodHeld&&rod.pairedContact,gripSeparation:view.rodHeld?rod.gripSeparation:null,reelSeparation:view.rodHeld?rod.reelSeparation:null},
      delivered:Boolean(venue?.primary&&kit?.primary&&actorDelivered),playableFallback:Boolean(venue&&kit&&(actorDelivered||fallback)),
      emergencyKitDrawing:!kit,assets:Object.fromEntries(statuses),actionDelivery:art.delivery() };
  }
  return { geometry, draw, inspect:()=>structuredClone(scene),
    resize(w,h) { width=Math.max(1,w);height=Math.max(1,h);ratio=Math.min(1.5,window.devicePixelRatio||1);
      canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);canvas.style.width=`${width}px`;canvas.style.height=`${height}px`; },
    dispose() { disposed=true;art.dispose();for(const cancel of [...cancellations]) cancel();images.clear();statuses.clear(); } };
}
