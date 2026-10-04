// Last-resort, asset-free recovery. Normal games use their authored Pal art.
// Coordinates are relative to the physical sole baseline, never a sprite box.
const CAST = Object.freeze({ meadow: 'bouncy', dino: 'chompy', moonwood: 'pip' });
const TAU = Math.PI * 2;

function armGeometry(character, stride, lifted) {
  const bob = Math.abs(stride) * (character === 'chompy' ? 1.5 : 1.8);
  const arm = (x, y, rx, ry, rotation, palm) => ({ x, y, rx, ry, rotation,
    // The unsegmented lamb/dino forehand lies inside the actual drawn arm cap.
    palm: palm || { x: x - ry * .75 * Math.sin(rotation), y: y + ry * .75 * Math.cos(rotation) } });
  if (character === 'chompy') return { rightHand: arm(22, (lifted ? -58 : -43) - bob, 6, 12, lifted ? -.7 : -.3) };
  return Object.fromEntries([-1, 1].map(sign => [sign < 0 ? 'leftHand' : 'rightHand', character === 'pip'
    ? arm(sign * 22, (lifted ? -66 : -48) - bob + sign * stride * 4, 6, 13, sign * (lifted ? -.65 : .3),
      { x: sign * 26, y: (lifted ? -75 : -38) - bob + sign * stride * 4 })
    : arm(sign * 27, (lifted ? -63 : -45) - bob + sign * stride * 4, 7, 15, sign * (lifted ? -.7 : .35))]));
}

export function physicalPalFallbackPose({ world = 'meadow', x = 0, y = 0, height = 100,
  moving = false, direction = 'right', time = 0, action = 'idle' } = {}) {
  const scale = Math.max(1, Number(height) || 100) / 100;
  const mirror = direction === 'left' || direction === -1;
  const clock = Number.isFinite(Number(time)) ? Number(time) : 0;
  const stride = moving ? Math.sin(clock) : 0;
  const airborne = action === 'jump' || action === 'fall';
  const character = CAST[world] || CAST.meadow;
  const arms = armGeometry(character, stride, airborne || action === 'celebrate');
  const hands = Object.fromEntries(Object.entries(arms).map(([name, arm]) => [name, { ...arm.palm }]));
  const feet = [
    { x: -13 - stride * 5, y: airborne ? -6 : -Math.max(0, stride) * 5 },
    { x: 13 + stride * 5, y: airborne ? -3 : -Math.max(0, -stride) * 5 }
  ];
  return {
    character, representation: 'procedural-art-unavailable',
    x, y, scale, mirror, stride, airborne, action,
    feet, soles: feet.map(foot => ({ x: x + foot.x * scale * (mirror ? -1 : 1), y: y + foot.y * scale })),
    arms, hands,
    handSockets: Object.fromEntries(Object.entries(hands).map(([name, hand]) => [name,
      { x: x + hand.x * scale * (mirror ? -1 : 1), y: y + hand.y * scale }]))
  };
}

function oval(ctx, x, y, rx, ry, fill, stroke = '#4b3525', width = 1.2, rotation = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rotation, 0, TAU);
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
function shape(ctx, points, fill, stroke = '#4b3525', width = 1.2) {
  ctx.beginPath(); ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
function line(ctx, points, colour, width = 1.4) {
  ctx.beginPath(); ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.strokeStyle = colour; ctx.lineWidth = width; ctx.stroke();
}
function boot(ctx, foot, colour = '#754a2e') {
  oval(ctx, foot.x + 2, foot.y - 5.5, 9, 4.8, colour);
  line(ctx, [[foot.x - 6, foot.y - 1], [foot.x + 10, foot.y - 1]], '#35271f', 2);
}
function eyes(ctx, x, y, gap = 11) {
  for (const dx of [-gap / 2, gap / 2]) {
    oval(ctx, x + dx, y, 3.5, 4.4, '#fff8de', '#5b3f2f', .8);
    oval(ctx, x + dx + 1, y + .2, 1.9, 2.5, '#30261e', null);
    oval(ctx, x + dx + 1.5, y - .8, .65, .8, '#fff', null);
  }
}
function curl(ctx, x, y, radius = 5) {
  oval(ctx, x, y, radius, radius, '#edc75b', '#bd9237', .9);
  ctx.beginPath(); ctx.arc(x + .4, y + .5, radius * .52, -.5, 4.2);
  ctx.strokeStyle = '#fff0a1'; ctx.lineWidth = .9; ctx.stroke();
}
function drawBouncy(ctx, pose) {
  const bob = Math.abs(pose.stride) * 1.8;
  // The two separate steel coils compress above their planted boot soles.
  for (const foot of pose.feet) {
    const top = -27 - bob, bottom = foot.y - 10;
    line(ctx, [[foot.x, top], [foot.x, bottom]], '#707a83', 3.6);
    for (let i = 0; i < 5; i += 1) oval(ctx, foot.x, top + (bottom - top) * (i + .5) / 5, 5.5, 1.8, '#c6cbd0', '#59666f', .9);
    boot(ctx, foot);
  }
  oval(ctx, 0, -44 - bob, 23, 25, '#e8bc49');
  for (const [dx, dy, r] of [[-15,-31,6],[0,-25,6],[15,-31,6],[-23,-44,6],[-13,-48,7],[0,-44,7],[13,-49,7],[23,-42,6],[-14,-61,6],[0,-62,7],[14,-61,6]]) curl(ctx, dx, dy - bob, r);
  for (const arm of Object.values(pose.arms)) {
    oval(ctx, arm.x, arm.y, arm.rx, arm.ry, '#f0d489', '#a77c39', 1, arm.rotation);
  }
  // Long cream lamb ears sit behind the round face and wool crown.
  oval(ctx, -26, -77 - bob, 14, 6, '#f3d898', '#a77c39', 1, .32);
  oval(ctx, 26, -77 - bob, 14, 6, '#f3d898', '#a77c39', 1, -.32);
  oval(ctx, 0, -76 - bob, 20, 17, '#f4dca1', '#a77c39');
  for (const [dx, dy] of [[-15,-89],[-7,-94],[3,-95],[13,-91],[-17,-82],[16,-82],[0,-87]]) curl(ctx, dx, dy - bob, 5);
  eyes(ctx, 0, -77 - bob, 14);
  oval(ctx, 2, -69 - bob, 5, 3, '#70553d', null);
  line(ctx, [[-5,-65-bob],[0,-63-bob],[6,-66-bob]], '#725135', 1.3);
  shape(ctx, [[-17,-61-bob],[18,-61-bob],[12,-53-bob],[-12,-54-bob]], '#c74237', '#873c2e');
  shape(ctx, [[8,-55-bob],[18,-53-bob],[15,-36-bob],[6,-40-bob]], '#d84e3e', '#873c2e');
}
function drawChompy(ctx, pose) {
  const bob = Math.abs(pose.stride) * 1.5;
  shape(ctx, [[-17,-45-bob],[-44,-35-bob],[-52,-48-bob],[-48,-28-bob],[-22,-23-bob]], '#eaa050', '#9c6032');
  shape(ctx, [[-43,-35-bob],[-48,-43-bob],[-38,-39-bob]], '#cc7042', '#9c6032', .8);
  oval(ctx, 0, -42-bob, 22, 25, '#f0a54f', '#9c6032');
  oval(ctx, 8, -39-bob, 12, 18, '#f8d496', '#cf9b59', .8);
  for (const foot of pose.feet) {
    oval(ctx, foot.x, foot.y-14, 7, 12, '#e89b4c', '#9c6032');
    oval(ctx, foot.x+2, foot.y-4.8, 11, 4, '#eaa050', '#9c6032');
    for (const offset of [0,5,10]) oval(ctx, foot.x+offset, foot.y-2, 1.8, 1.5, '#f9dda4', '#b98146', .6);
  }
  oval(ctx, -12, -77-bob, 17, 20, '#eca053', '#9c6032');
  oval(ctx, 9, -72-bob, 22, 19, '#f2ad61', '#9c6032');
  oval(ctx, 24, -65-bob, 13, 9, '#f6bd79', '#aa6c3c');
  shape(ctx, [[-22,-87-bob],[-18,-99-bob],[-12,-88-bob]], '#c47649', '#9c6032');
  eyes(ctx, 4, -77-bob, 13);
  oval(ctx, 29, -68-bob, 1.7, 1.3, '#9c6032', null);
  line(ctx, [[14,-59-bob],[24,-57-bob],[32,-60-bob]], '#a96637', 1.1);
  const arm = pose.arms.rightHand;
  oval(ctx, arm.x, arm.y, arm.rx, arm.ry, '#f2b165', '#9c6032', 1, arm.rotation);
  shape(ctx, [[-12,-59-bob],[14,-58-bob],[3,-42-bob]], '#fff1c8', '#c49b61');
  shape(ctx, [[-12,-56-bob],[-22,-59-bob],[-22,-48-bob]], '#ffeac0', '#c49b61');
}
function drawPip(ctx, pose) {
  const bob = Math.abs(pose.stride) * 1.8;
  for (const foot of pose.feet) {
    oval(ctx, foot.x, foot.y-16, 5, 13, '#dfb77e', '#956c45');
    boot(ctx, foot, '#76513a');
  }
  shape(ctx, [[-15,-58-bob],[14,-58-bob],[21,-27-bob],[-19,-27-bob]], '#4b874a', '#315f37');
  shape(ctx, [[-14,-58-bob],[-7,-63-bob],[0,-57-bob],[9,-63-bob],[15,-57-bob],[0,-50-bob]], '#77a963', '#315f37');
  shape(ctx, [[-17,-37-bob],[19,-37-bob],[20,-32-bob],[-18,-32-bob]], '#76513a', '#493627');
  shape(ctx, [[-2,-37-bob],[5,-37-bob],[5,-32-bob],[-2,-32-bob]], '#d6b76b', '#775d32', .8);
  for (const arm of Object.values(pose.arms)) {
    oval(ctx, arm.x, arm.y, arm.rx, arm.ry, '#73a160', '#315f37', 1, arm.rotation);
    oval(ctx, arm.palm.x, arm.palm.y, 5, 5, '#edc28c', '#956c45');
  }
  shape(ctx, [[-14,-85-bob],[-34,-84-bob],[-20,-73-bob]], '#edc28c', '#956c45');
  shape(ctx, [[14,-85-bob],[34,-84-bob],[20,-73-bob]], '#edc28c', '#956c45');
  oval(ctx, 0, -78-bob, 18, 19, '#edc28c', '#956c45');
  oval(ctx, -1, -91-bob, 19, 9, '#725036', '#493729');
  for (const [dx,dy,rx,ry] of [[-15,-88,6,10],[-9,-95,7,5],[0,-96,7,4],[11,-91,7,8]]) oval(ctx,dx,dy-bob,rx,ry,'#80573a','#493729',.8,-.15);
  eyes(ctx, 1, -78-bob, 13);
  oval(ctx, 4, -71-bob, 2.8, 2, '#d89c66', null);
  line(ctx, [[-5,-65-bob],[1,-63-bob],[7,-66-bob]], '#956c45', 1.2);
}

export function drawPhysicalPalFallback(ctx, options = {}) {
  const pose = physicalPalFallbackPose(options);
  ctx.save();
  ctx.translate(pose.x, pose.y); ctx.scale(pose.scale * (pose.mirror ? -1 : 1), pose.scale);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (pose.character === 'bouncy') drawBouncy(ctx, pose);
  else if (pose.character === 'chompy') drawChompy(ctx, pose);
  else drawPip(ctx, pose);
  ctx.restore();
  return pose;
}
