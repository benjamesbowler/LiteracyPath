const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const point = value => ({ x: value[0], y: value[1] });
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

/** Layout describes the real water, hull and swimming field. Small viewports
 * retain the same school identities on a circulating channel, rather than
 * shrinking long printed choices or turning the game into a choice overlay.
 */
export function reelReadStageLayout(width, height) {
  const portrait = width < 520, compact = height <= 420;
  const actorHeight = compact ? clamp(height*.20, 48, 76)
    : portrait ? clamp(height*.19, 86, 135) : clamp(height*.245, 120, 205);
  const waterTop = compact ? height-(portrait ? 170 : 116)
    : portrait ? Math.max(height*.54, 220+actorHeight) : height*.49;
  const boatWidth = compact ? portrait ? 112 : 164 : portrait ? 180 : Math.min(410, width*.29);
  const hullHeight = boatWidth*.42;
  const controlsTop = height-(compact || width < 700 ? 64 : 80);
  // A rotated 104×32 face extends 24px vertically. The first current stays
  // below the complete hull; a second current needs room for the original
  // 195px source tail as well as the next readable plaque.
  const firstFishLabel = compact ? controlsTop-56 : Math.max(
    waterTop+Math.min(62, (controlsTop-waterTop)*.23), waterTop+hullHeight*.30+34);
  const lastFishLabel = controlsTop-92;
  const fishLabels = !compact && lastFishLabel-firstFishLabel >= 112
    ? [firstFishLabel,lastFishLabel] : [firstFishLabel];
  // On very short landscape screens the full boat occupies the right bank.
  // The live school passes through the adjacent left-hand channel. Every
  // unchanged slot circulates through it; it is never filtered by its word.
  const fishChannel = { left:0, right:compact&&!portrait
    ? width*.5+94-boatWidth*.47 : width };
  return { width, height, portrait, compact, waterTop, actorHeight, boatWidth, hullHeight,
    deck: waterTop-8, hullTop: waterTop-hullHeight*.70, controlsTop,
    fishLabels,fishChannel,castReach:compact&&!portrait?184:18,
    fishScale: compact ? .20 : .38, fishBodyOffset: compact ? 20 : 38,
    fishBodyRadius: compact ? 40/3 : 24,fishBodyRadiusX:compact?80/3:40,
    fishFaceWidth: 104, fishFaceHeight: 32, fishFontSize: 16,
    operatorTop: compact ? 80 : portrait ? 212 : 148,
    cue: compact ? { x: portrait ? 8 : width*.5-94, y: portrait ? 78 : 8, width: 188, height: 100 }
      : portrait ? { x: 8, y: 78, width: width-16, height: 126 }
      : { x: width*.5-Math.min(360, width*.4)/2, y: 8, width: Math.min(360, width*.4) } };
}

/** Fit the selected measured body, rather than its nominal idle height, into
 * the live boat region. The complete hull stays on-screen. Compact layouts
 * put the operator beside the reserved cue; all words swim below that cue.
 */
export function reelReadActorPlacement(layout, atlas, frame, boatPosition, facing, referenceFrames=atlas.frames||[frame]) {
  const [left,top,right]=frame.bounds,anchor=frame.anchor,mirror=facing==='left';
  const tallest=Math.max(...referenceFrames.map(row=>row.anchor[1]-row.bounds[1]));
  const radius=Math.max(...referenceFrames.flatMap(row=>[row.anchor[0]-row.bounds[0],row.bounds[2]-row.anchor[0]]));
  let pixels=layout.actorHeight/(atlas.nominalHeight*atlas.pixelsPerUnit);
  pixels=Math.min(pixels,(layout.deck-layout.operatorTop)/Math.max(1,tallest));
  const bodyLeft=mirror?anchor[0]-right:left-anchor[0],bodyRight=mirror?anchor[0]-left:right-anchor[0];
  const hullLimit=layout.width-layout.boatWidth*.5-8,offset=layout.boatWidth*.03;
  if(layout.compact) pixels=Math.min(pixels,
    (hullLimit-offset-layout.cue.x-layout.cue.width-8)/Math.max(1,radius));
  pixels=Math.max(.01,pixels);
  let min=Math.max(layout.boatWidth*.5+8,8+radius*pixels+offset);
  const max=Math.min(hullLimit,layout.width-8-radius*pixels+offset);
  if(layout.compact) min=Math.max(min,layout.cue.x+layout.cue.width+8+radius*pixels+offset);
  const boatX=min+clamp(boatPosition,0,1)*Math.max(0,max-min),x=boatX-offset;
  return { placement:{x,y:layout.deck,height:pixels*atlas.pixelsPerUnit*atlas.nominalHeight,mirror},boatX,
    bodyBounds:{left:x+bodyLeft*pixels,top:layout.deck+(top-anchor[1])*pixels,
      right:x+bodyRight*pixels,bottom:layout.deck},route:{min,max} };
}

/** Named fishing poses follow live motor phases. No generic bobbing or word
 * correctness selects a cast/strike pose. Hidden grips stay hidden.
 */
export function reelReadOperatorFrame(state) {
  if (state.celebrating) return state.elapsed-state.celebrationAt < .45 ? 14 : 15;
  if (state.elapsed-state.landedAt < .65) return 14;
  if (state.fight) return state.reeling ? Math.floor(state.fight.elapsed/.18)%2 ? 9 : 8 : 10;
  const castAge = state.elapsed-state.castAt;
  if (castAge >= 0 && castAge < .05) return 4;
  if (castAge >= .05 && castAge < .12) return 5;
  if (castAge >= .12 && castAge < .18) return 6;
  if (castAge >= .18 && castAge < .32) return 7;
  if (state.elapsed-state.errorAt < .7) return 12;
  if (state.elapsed-state.escapeAt < .7) return 11;
  return state.steering < 0 ? 1 : state.steering > 0 ? 3 : 2;
}

/** Each unchanged fish follows its lane's current with uniform slot spacing.
 * Individual bobbing phases remain, but neighbours cannot overtake and cover
 * each other's printed faces. Off-channel fish return with the same identity.
 */
export function stepReelReadFish(fish, layout, level, elapsed) {
  const lanes = layout.fishLabels.length, lane = fish.slot%lanes;
  const perLane = Math.ceil(level.visibleFish/lanes), spacing = Math.max(145, layout.width/perLane);
  const channel=layout.fishChannel||{left:0,right:layout.width};
  const period = Math.max(channel.right-channel.left+170, perLane*spacing);
  const currentDirection=lane%2?-1:1;
  const raw = Math.floor(fish.slot/lanes)*spacing+elapsed*level.fishSpeed*currentDirection;
  const x = ((raw%period)+period)%period-85+channel.left;
  const labelY = layout.fishLabels[lane]+(layout.compact?0:Math.sin(elapsed*.7+fish.phase)*2);
  const faceHalf=54; // includes the authored plaque's .15rad rotation
  return { x, y: labelY+layout.fishBodyOffset, labelX: x, labelY,
    rx: layout.fishBodyRadiusX||40, ry: layout.fishBodyRadius,currentDirection,currentPeriod:period,
    visible: x-faceHalf >= channel.left+8 && x+faceHalf <= channel.right-8 };
}

/** A released cast visibly travels from the real rod tip into its water
 * channel. Short landscape uses a longer cast beside its reserved boat bank;
 * the actual hook path, alignment control and native prediction share this. */
export function reelReadCastColumn(rod,layout,facing) {
  return clamp(rod.tip.x+(facing==='left'?-1:1)*(layout.castReach||18),48,layout.width-48);
}

/** One rigid authored tool transform serves paint, tip/line simulation and QA.
 * Two actually visible registered anatomical grips constrain that transform.
 * Single-grip source poses never acquire an invented second hand contact.
 */
export function reelReadRodTransform(parts, sockets, { singleGripAngle = -.18, singleGripScale = .25 } = {}) {
  if (!sockets?.rodGrip) return null;
  const original = point(parts.rodGrip), crank = point(parts.reelGrip);
  const paired = Boolean(sockets.reelGrip);
  const scale = paired ? distance(sockets.rodGrip, sockets.reelGrip) / distance(original, crank) : singleGripScale;
  const angle = paired
    ? Math.atan2(sockets.reelGrip.y - sockets.rodGrip.y, sockets.reelGrip.x - sockets.rodGrip.x)
      - Math.atan2(crank.y - original.y, crank.x - original.x)
    : singleGripAngle;
  const project = value => {
    const x = (value[0] - original.x) * scale, y = (value[1] - original.y) * scale;
    return { x: sockets.rodGrip.x + x * Math.cos(angle) - y * Math.sin(angle),
      y: sockets.rodGrip.y + x * Math.sin(angle) + y * Math.cos(angle) };
  };
  return { origin: { ...sockets.rodGrip }, sourceGrip: [...parts.rodGrip], scale, angle,
    tip: project(parts.rodTip), reelGrip: project(parts.reelGrip), pairedContact: paired,
    gripSeparation: 0, reelSeparation: paired ? distance(project(parts.reelGrip), sockets.reelGrip) : null,
    // This matrix maps original atlas pixels into the same physical world.
    matrix: { a: scale * Math.cos(angle), b: scale * Math.sin(angle), c: -scale * Math.sin(angle), d: scale * Math.cos(angle),
      e: sockets.rodGrip.x - (original.x * Math.cos(angle) - original.y * Math.sin(angle)) * scale,
      f: sockets.rodGrip.y - (original.x * Math.sin(angle) + original.y * Math.cos(angle)) * scale } };
}

/** The first actual swept fish-body impact wins; no expected-word priority. */
export function reelReadHookImpact(from, to, fish, hookRadius = 0) {
  let first = null;
  for (const row of fish) {
    const rx = row.rx + hookRadius, ry = row.ry + hookRadius;
    if (!(rx > 0 && ry > 0)) continue;
    const x = (from.x - row.x) / rx, y = (from.y - row.y) / ry;
    const dx = (to.x - from.x) / rx, dy = (to.y - from.y) / ry;
    const a = dx * dx + dy * dy, c = x * x + y * y - 1;
    let u = c <= 0 ? 0 : null;
    if (u == null && a > 0) {
      const b = 2 * (x * dx + y * dy), discriminant = b * b - 4 * a * c;
      if (discriminant >= 0) {
        const hit = (-b - Math.sqrt(discriminant)) / (2 * a);
        if (hit >= 0 && hit <= 1) u = hit;
      }
    }
    if (u != null && (!first || u < first.u)) first = { fish: row, u,
      x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u };
  }
  return first;
}
