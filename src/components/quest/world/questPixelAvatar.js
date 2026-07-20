import { getDye, normalizeCreature } from "../../../data/creatureParts.js";
import { layoutCreature } from "../../../utils/creatureLayout.js";

export const PIXEL_BEASTIE_FRAME = 64;
export const PIXEL_BEASTIE_FRAMES_PER_DIRECTION = 16;
export const PIXEL_BEASTIE_DIRECTIONS = Object.freeze(["down", "left", "right", "up"]);
export const PIXEL_BEASTIE_ACTION_POSES = Object.freeze([
  "anticipate",
  "reach",
  "cheer",
  "concern",
  "carry",
  "tool",
  "turn",
  "steer",
  "signal",
  "climb",
  "discover",
  "settle"
]);
const PIXEL_BEASTIE_ART_SCALE = 2;
const VECTOR_VIEWBOX = 200;

const VECTOR_TOKEN_TO_VAR = Object.freeze({
  skin: "--cr-skin",
  skinDark: "--cr-skin-dark",
  belly: "--cr-belly",
  accent: "--cr-accent",
  dark: "--cr-dark",
  white: "--cr-white"
});

function mixHex(first, second, amount) {
  const ratio = Math.max(0, Math.min(1, Number(amount) || 0));
  const read = value => Number.parseInt(String(value).replace("#", ""), 16);
  const a = read(first);
  const b = read(second);
  const channel = shift => Math.round(
    (((a >> shift) & 255) * (1 - ratio)) + (((b >> shift) & 255) * ratio)
  );
  return `#${[16, 8, 0].map(shift => channel(shift).toString(16).padStart(2, "0")).join("")}`;
}

function fillRect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function microRect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function pixelOval(ctx, cx, cy, rx, ry, color) {
  for (let y = -ry; y <= ry; y += 1) {
    const ratio = 1 - ((y * y) / Math.max(1, ry * ry));
    const span = Math.max(1, Math.floor(rx * Math.sqrt(Math.max(0, ratio))));
    fillRect(ctx, cx - span, cy + y, (span * 2) + 1, 1, color);
  }
}

function pixelLine(ctx, x0, y0, x1, y1, color, thickness = 1) {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const endX = Math.round(x1);
  const endY = Math.round(y1);
  const dx = Math.abs(endX - x);
  const sx = x < endX ? 1 : -1;
  const dy = -Math.abs(endY - y);
  const sy = y < endY ? 1 : -1;
  let error = dx + dy;
  while (true) {
    fillRect(ctx, x, y, thickness, thickness, color);
    if (x === endX && y === endY) break;
    const doubleError = error * 2;
    if (doubleError >= dy) {
      error += dy;
      x += sx;
    }
    if (doubleError <= dx) {
      error += dx;
      y += sy;
    }
  }
}

function drawTail(ctx, creature, direction, palette, bob) {
  if (creature.tail === "tail-none" || direction === "up") return;
  const side = direction === "left" ? -1 : 1;
  const startX = direction === "down" ? 22 : 16 + (side * 6);
  const startY = 21 + bob;
  const endX = direction === "down" ? 27 : 16 + (side * 10);
  const endY = 17 + bob;
  pixelLine(ctx, startX, startY, endX, endY, palette.ink, 2);
  pixelLine(ctx, startX, startY - 1, endX, endY - 1, palette.skinDark, 1);
  if (creature.tail === "tail-fan" || creature.tail === "tail-fern") {
    pixelOval(ctx, endX, endY - 1, 3, 3, palette.ink);
    pixelOval(ctx, endX, endY - 1, 2, 2, palette.accent);
  } else if (creature.tail === "tail-moon") {
    pixelOval(ctx, endX, endY - 1, 3, 3, palette.accent);
    pixelOval(ctx, endX - side, endY - 2, 2, 2, palette.ink);
  } else {
    pixelOval(ctx, endX, endY - 1, 2, 2, palette.ink);
    fillRect(ctx, endX - 1, endY - 2, 3, 3, palette.accent);
  }
}

function drawBackGear(ctx, creature, direction, palette, bob) {
  const gear = creature.equipped?.back;
  if (!gear) return;
  if (gear === "moth-wings") {
    const y = 14 + bob;
    pixelOval(ctx, 8, y, 4, 6, palette.ink);
    pixelOval(ctx, 24, y, 4, 6, palette.ink);
    pixelOval(ctx, 8, y, 3, 5, palette.accent);
    pixelOval(ctx, 24, y, 3, 5, palette.accent);
    fillRect(ctx, 7, y - 1, 3, 2, palette.paper);
    fillRect(ctx, 22, y - 1, 3, 2, palette.paper);
  }
  if (direction === "up" && gear === "moth-wings") {
    fillRect(ctx, 13, 15 + bob, 6, 5, palette.skinDark);
  }
}

function bodyMetrics(bodyId) {
  if (bodyId === "stalk") {
    return { rx: 6, ry: 8, cy: 12, torsoRx: 5, torsoRy: 8, torsoCy: 21, footY: 28 };
  }
  if (bodyId === "pebble") {
    return { rx: 10, ry: 7, cy: 14, torsoRx: 9, torsoRy: 5, torsoCy: 21, footY: 27 };
  }
  if (bodyId === "boulder") {
    return { rx: 10, ry: 8, cy: 13, torsoRx: 9, torsoRy: 7, torsoCy: 21, footY: 28 };
  }
  if (bodyId === "moth") {
    return { rx: 8, ry: 8, cy: 13, torsoRx: 7, torsoRy: 7, torsoCy: 21, footY: 28 };
  }
  if (bodyId === "spike") {
    return { rx: 8, ry: 8, cy: 13, torsoRx: 7, torsoRy: 7, torsoCy: 21, footY: 28 };
  }
  return { rx: 8, ry: 8, cy: 13, torsoRx: 7, torsoRy: 7, torsoCy: 21, footY: 28 };
}

function drawFeet(ctx, creature, direction, palette, frame, bob, metrics) {
  const stride = [0, 1, 0, -1][frame] || 0;
  const footY = metrics.footY + bob;
  const footColor = creature.feet === "feet-webbed" ? palette.accent : palette.skinDark;
  if (direction === "left" || direction === "right") {
    fillRect(ctx, 11 + stride, footY, 5, 3, palette.ink);
    fillRect(ctx, 17 - stride, footY - 1, 5, 3, palette.ink);
    fillRect(ctx, 12 + stride, footY, 4, 2, footColor);
    fillRect(ctx, 18 - stride, footY - 1, 4, 2, footColor);
    return;
  }
  fillRect(ctx, 8 + stride, footY, 7, 3, palette.ink);
  fillRect(ctx, 18 - stride, footY, 7, 3, palette.ink);
  fillRect(ctx, 9 + stride, footY, 5, 2, footColor);
  fillRect(ctx, 19 - stride, footY, 5, 2, footColor);
}

function drawBody(ctx, creature, direction, palette, frame, bob) {
  const metrics = bodyMetrics(creature.body);
  drawFeet(ctx, creature, direction, palette, frame, bob, metrics);
  pixelOval(ctx, 16, metrics.torsoCy + bob, metrics.torsoRx + 1, metrics.torsoRy + 1, palette.ink);
  pixelOval(ctx, 16, metrics.torsoCy + bob, metrics.torsoRx, metrics.torsoRy, palette.skinDark);
  pixelOval(ctx, 15.5, metrics.torsoCy - 1 + bob, Math.max(3, metrics.torsoRx - 2), Math.max(3, metrics.torsoRy - 2), palette.skin);

  pixelOval(ctx, 16, metrics.cy + bob, metrics.rx + 1, metrics.ry + 1, palette.ink);
  pixelOval(ctx, 16, metrics.cy + bob, metrics.rx, metrics.ry, palette.skinDark);
  pixelOval(ctx, 15, metrics.cy - 1 + bob, Math.max(3, metrics.rx - 2), Math.max(3, metrics.ry - 2), palette.skin);

  const side = direction === "left" ? -1 : direction === "right" ? 1 : 0;
  const armY = metrics.torsoCy + bob;
  const nearArmX = 16 + (side * Math.max(4, metrics.torsoRx));
  const farArmX = 16 - (side * Math.max(4, metrics.torsoRx - 1));
  if (side === 0) {
    pixelOval(ctx, 16 - metrics.torsoRx - 1, armY, 2, 3, palette.ink);
    pixelOval(ctx, 16 + metrics.torsoRx + 1, armY, 2, 3, palette.ink);
    pixelOval(ctx, 16 - metrics.torsoRx - 1, armY, 1, 2, palette.skin);
    pixelOval(ctx, 16 + metrics.torsoRx + 1, armY, 1, 2, palette.skinDark);
  } else {
    pixelOval(ctx, farArmX, armY - 1, 2, 3, palette.ink);
    pixelOval(ctx, nearArmX, armY + 1, 2, 3, palette.ink);
    pixelOval(ctx, farArmX, armY - 1, 1, 2, palette.skinDark);
    pixelOval(ctx, nearArmX, armY + 1, 1, 2, palette.skin);
  }

  if (direction !== "up") {
    const bellyX = direction === "left" ? 13 : direction === "right" ? 19 : 16;
    pixelOval(ctx, bellyX, metrics.torsoCy + 2 + bob, Math.max(2, metrics.torsoRx - 3), Math.max(3, metrics.torsoRy - 2), palette.belly);
  }

  if (creature.body === "spike") {
    for (let i = 0; i < 4; i += 1) {
      const x = 10 + (i * 4);
      fillRect(ctx, x, metrics.cy - metrics.ry - 3 + bob + (i % 2), 3, 4, palette.ink);
      fillRect(ctx, x + 1, metrics.cy - metrics.ry - 2 + bob + (i % 2), 1, 3, palette.skinDark);
    }
  }
  if (creature.body === "tuft") {
    fillRect(ctx, 13, metrics.cy - metrics.ry - 3 + bob, 3, 4, palette.ink);
    fillRect(ctx, 16, metrics.cy - metrics.ry - 4 + bob, 3, 5, palette.ink);
    fillRect(ctx, 19, metrics.cy - metrics.ry - 2 + bob, 2, 3, palette.ink);
    fillRect(ctx, 14, metrics.cy - metrics.ry - 2 + bob, 6, 3, palette.skin);
  }
  return metrics;
}

function drawMaterialDetail(ctx, creature, direction, palette, bob, metrics) {
  const side = direction === "left" ? -1 : direction === "right" ? 1 : 0;
  const faceX = 16 + (side * 3);
  microRect(ctx, faceX - 5.5, metrics.cy - 6 + bob, 1, 3, palette.skinLight);
  microRect(ctx, faceX - 4, metrics.cy - 7.5 + bob, 3, 0.5, palette.skinLight);
  microRect(ctx, faceX + 4.5, metrics.cy - 2 + bob, 0.5, 4, palette.skinDeep);
  microRect(ctx, faceX + 2, metrics.cy + 5.5 + bob, 3, 0.5, palette.skinDeep);
  if (direction === "down") {
    microRect(ctx, 9.5, metrics.cy + bob, 1.5, 1, palette.blush);
    microRect(ctx, 21, metrics.cy + bob, 1.5, 1, palette.blush);
    microRect(ctx, 13.5, metrics.cy + 6 + bob, 4.5, 0.5, palette.bellyLight);
  }
  if (direction === "up") {
    microRect(ctx, 11.5, metrics.cy - 5 + bob, 1, 4, palette.skinLight);
    microRect(ctx, 20.5, metrics.cy + 1 + bob, 0.5, 4, palette.skinDeep);
  }
  if (creature.body === "moth") {
    microRect(ctx, 10.5, metrics.cy - 4 + bob, 1, 1, palette.accentLight);
    microRect(ctx, 20.5, metrics.cy + 1 + bob, 1, 1, palette.accentLight);
  }
  if (creature.body === "pebble" || creature.body === "boulder") {
    microRect(ctx, 12, metrics.cy - 4.5 + bob, 2, 0.5, palette.skinLight);
    microRect(ctx, 19.5, metrics.cy + 2 + bob, 1.5, 0.5, palette.skinDeep);
  }
}

function drawPattern(ctx, creature, direction, palette, bob) {
  if (creature.pattern === "pattern-none" || direction === "up") return;
  if (creature.pattern === "pattern-spots") {
    fillRect(ctx, 11, 16 + bob, 2, 2, palette.accent);
    fillRect(ctx, 19, 19 + bob, 2, 2, palette.accent);
  } else if (creature.pattern === "pattern-stripes") {
    fillRect(ctx, 9, 15 + bob, 4, 1, palette.accent);
    fillRect(ctx, 20, 18 + bob, 4, 1, palette.accent);
  } else if (creature.pattern === "pattern-scales") {
    fillRect(ctx, 10, 17 + bob, 2, 1, palette.accent);
    fillRect(ctx, 14, 19 + bob, 2, 1, palette.accent);
    fillRect(ctx, 20, 16 + bob, 2, 1, palette.accent);
  } else {
    fillRect(ctx, 15, 16 + bob, 3, 1, palette.accent);
    fillRect(ctx, 16, 15 + bob, 1, 3, palette.accent);
  }
}

function drawActionArms(ctx, direction, palette, bob, pose) {
  if (!pose) return;
  const centerY = 17 + bob;
  if (pose === "cheer") {
    pixelLine(ctx, 10, centerY, 6, 9 + bob, palette.ink, 2);
    pixelLine(ctx, 22, centerY, 26, 9 + bob, palette.ink, 2);
    fillRect(ctx, 5, 8 + bob, 3, 3, palette.accent);
    fillRect(ctx, 25, 8 + bob, 3, 3, palette.accent);
    return;
  }
  if (pose === "concern") {
    pixelLine(ctx, 10, centerY + 1, 13, 15 + bob, palette.ink, 2);
    pixelLine(ctx, 22, centerY + 1, 19, 15 + bob, palette.ink, 2);
    return;
  }
  const side = direction === "left" ? -1 : direction === "right" ? 1 : 0;
  if (pose === "reach" && side !== 0) {
    const startX = 16 + side * 6;
    const endX = 16 + side * 13;
    pixelLine(ctx, startX, centerY, endX, centerY - 2, palette.ink, 2);
    fillRect(ctx, endX - 1, centerY - 4, 3, 3, palette.accent);
    return;
  }
  const lift = pose === "reach" || ["carry", "signal", "climb", "discover"].includes(pose) ? -5 : 3;
  pixelLine(ctx, 10, centerY, 7, centerY + lift, palette.ink, 2);
  pixelLine(ctx, 22, centerY, 25, centerY + lift, palette.ink, 2);
  fillRect(ctx, 6, centerY + lift - 1, 3, 3, palette.accent);
  fillRect(ctx, 24, centerY + lift - 1, 3, 3, palette.accent);
}

function drawActionProp(ctx, direction, palette, bob, pose) {
  const side = direction === "left" ? -1 : 1;
  if (pose === "carry") {
    fillRect(ctx, 10, 5 + bob, 13, 8, palette.ink);
    fillRect(ctx, 11, 6 + bob, 11, 6, palette.accent);
    fillRect(ctx, 15, 6 + bob, 2, 6, palette.accentLight);
    fillRect(ctx, 11, 8 + bob, 11, 1, palette.paper);
  } else if (pose === "tool") {
    const x = side < 0 ? 7 : 25;
    pixelLine(ctx, x, 10 + bob, x - (side * 3), 25 + bob, palette.ink, 2);
    fillRect(ctx, x - (side > 0 ? 2 : 5), 7 + bob, 7, 5, palette.ink);
    fillRect(ctx, x - (side > 0 ? 1 : 4), 8 + bob, 5, 3, palette.accent);
  } else if (pose === "turn" || pose === "steer") {
    pixelOval(ctx, 16 + side, 20 + bob, 7, 7, palette.ink);
    pixelOval(ctx, 16 + side, 20 + bob, 5, 5, palette.accent);
    pixelLine(ctx, 10 + side, 20 + bob, 22 + side, 20 + bob, palette.paper);
    pixelLine(ctx, 16 + side, 14 + bob, 16 + side, 26 + bob, palette.paper);
  } else if (pose === "signal") {
    const x = side < 0 ? 6 : 26;
    pixelLine(ctx, x, 7 + bob, x, 27 + bob, palette.ink, 2);
    const flagX = side < 0 ? x + 1 : x - 8;
    fillRect(ctx, flagX, 7 + bob, 8, 6, palette.ink);
    fillRect(ctx, flagX + 1, 8 + bob, 7, 4, palette.accent);
    fillRect(ctx, flagX + 3, 9 + bob, 3, 2, palette.paper);
  } else if (pose === "climb") {
    const ropeX = side < 0 ? 7 : 25;
    pixelLine(ctx, ropeX, 3, ropeX, 31, palette.ink, 2);
    fillRect(ctx, ropeX - 2, 8 + bob, 5, 3, palette.accent);
    fillRect(ctx, ropeX - 2, 19 + bob, 5, 3, palette.accent);
  } else if (pose === "discover") {
    const x = 16 + (side * 7);
    fillRect(ctx, x - 1, 3 + bob, 3, 11, palette.paper);
    fillRect(ctx, x - 5, 7 + bob, 11, 3, palette.paper);
    fillRect(ctx, x, 5 + bob, 1, 7, palette.accent);
    fillRect(ctx, x - 3, 8 + bob, 7, 1, palette.accent);
  } else if (pose === "settle") {
    fillRect(ctx, 7, 30, 7, 1, palette.skinDeep);
    fillRect(ctx, 19, 30, 7, 1, palette.skinDeep);
  }
}

function drawEyes(ctx, creature, direction, palette, bob, pose = null) {
  if (direction === "up") return;
  const side = direction === "left" ? -1 : direction === "right" ? 1 : 0;
  const eyeY = 13 + bob;
  const center = 16 + (side * 3);
  const count = creature.eyes === "eyes-one" ? 1 : creature.eyes === "eyes-three" ? 3 : 2;
  const positions = count === 1 ? [center] : count === 3 ? [center - 4, center, center + 4] : [center - 3, center + 3];
  const large = creature.eyes === "eyes-big" || creature.eyes === "eyes-wide";
  for (const x of positions) {
    fillRect(ctx, x - (large ? 2 : 1), eyeY - (large ? 2 : 1), large ? 4 : 3, large ? 4 : 3, palette.ink);
    fillRect(ctx, x - 1, eyeY - 1, 2, 2, palette.paper);
    const pupilY = pose === "concern" ? eyeY + 1 : eyeY;
    fillRect(ctx, x + side, pupilY, 1, 1, palette.ink);
  }
}

function drawMouth(ctx, creature, direction, palette, bob, pose = null) {
  if (direction === "up") return;
  const side = direction === "left" ? -1 : direction === "right" ? 1 : 0;
  const x = 16 + (side * 4);
  const y = 18 + bob;
  if (pose === "cheer") {
    fillRect(ctx, x - 3, y, 7, 3, palette.ink);
    fillRect(ctx, x - 2, y, 5, 1, palette.paper);
  } else if (pose === "concern") {
    fillRect(ctx, x - 2, y + 1, 5, 1, palette.ink);
    fillRect(ctx, x - 1, y, 3, 1, palette.ink);
  } else if (creature.mouth === "mouth-beak") {
    fillRect(ctx, x - 2, y, 5, 2, palette.ink);
    fillRect(ctx, x - 1 + side, y, 3, 1, palette.accent);
  } else if (creature.mouth === "mouth-fangs" || creature.mouth === "mouth-tusks") {
    fillRect(ctx, x - 3, y, 7, 2, palette.ink);
    fillRect(ctx, x - 2, y + 1, 1, 2, palette.paper);
    fillRect(ctx, x + 2, y + 1, 1, 2, palette.paper);
  } else if (creature.mouth === "mouth-snout") {
    pixelOval(ctx, x, y, 3, 2, palette.ink);
    fillRect(ctx, x - 2, y - 1, 5, 2, palette.belly);
    fillRect(ctx, x - 1, y, 1, 1, palette.ink);
    fillRect(ctx, x + 1, y, 1, 1, palette.ink);
  } else {
    fillRect(ctx, x - 2, y, 5, 1, palette.ink);
    if (creature.mouth === "mouth-grin") fillRect(ctx, x - 1, y + 1, 3, 1, palette.paper);
  }
}

function drawCrest(ctx, creature, direction, palette, bob) {
  if (creature.crest === "crest-none") return;
  const y = 5 + bob;
  if (creature.crest === "crest-horns") {
    pixelLine(ctx, 11, 9 + bob, 8, y, palette.ink, 2);
    pixelLine(ctx, 21, 9 + bob, 24, y, palette.ink, 2);
    fillRect(ctx, 8, y, 2, 3, palette.accent);
    fillRect(ctx, 23, y, 2, 3, palette.accent);
  } else if (creature.crest === "crest-antenna") {
    pixelLine(ctx, 13, 9 + bob, 11, y, palette.ink);
    pixelLine(ctx, 19, 9 + bob, 21, y, palette.ink);
    fillRect(ctx, 10, y - 1, 3, 3, palette.accent);
    fillRect(ctx, 20, y - 1, 3, 3, palette.accent);
  } else if (creature.crest === "crest-crown") {
    fillRect(ctx, 11, y + 1, 11, 4, palette.ink);
    fillRect(ctx, 12, y, 2, 4, palette.accent);
    fillRect(ctx, 16, y - 1, 2, 5, palette.accent);
    fillRect(ctx, 20, y, 2, 4, palette.accent);
  } else {
    fillRect(ctx, 13, y, 7, 5, palette.ink);
    fillRect(ctx, 14, y + 1, 5, 3, palette.accent);
  }
}

function drawGear(ctx, creature, direction, palette, bob) {
  const { head, neck, held } = creature.equipped || {};
  if (neck === "vine-scarf") {
    fillRect(ctx, 8, 18 + bob, 16, 3, palette.ink);
    fillRect(ctx, 9, 18 + bob, 14, 2, palette.accent);
    fillRect(ctx, direction === "left" ? 21 : 9, 20 + bob, 3, 5, palette.accent);
  }
  if (head === "leaf-cap") {
    fillRect(ctx, 9, 7 + bob, 15, 3, palette.ink);
    fillRect(ctx, 10, 6 + bob, 11, 3, "#5f9d50");
    fillRect(ctx, 19, 4 + bob, 5, 3, "#8dc45d");
  } else if (head === "acorn-hat") {
    pixelOval(ctx, 16, 7 + bob, 7, 4, palette.ink);
    pixelOval(ctx, 16, 7 + bob, 6, 3, "#a96735");
    fillRect(ctx, 11, 5 + bob, 11, 2, "#744526");
  }
  if (held === "stone-staff" && direction !== "up") {
    const x = direction === "left" ? 7 : 25;
    pixelLine(ctx, x, 14 + bob, x, 28, palette.ink, 2);
    fillRect(ctx, x, 15 + bob, 1, 13, "#9b6435");
    pixelOval(ctx, x, 12 + bob, 3, 3, palette.ink);
    pixelOval(ctx, x, 12 + bob, 2, 2, "#8ca5ad");
  }
}

function drawFrame(ctx, creature, direction, frame, offsetX, offsetY, pose = null) {
  const dye = getDye(creature.dye);
  const palette = {
    skin: dye.skin,
    skinDark: dye.skinDark,
    skinDeep: mixHex(dye.skinDark, "#221f2e", 0.3),
    skinLight: mixHex(dye.skin, "#fff4d9", 0.32),
    belly: dye.belly,
    bellyLight: mixHex(dye.belly, "#ffffff", 0.42),
    accent: dye.accent,
    accentLight: mixHex(dye.accent, "#fff1bb", 0.3),
    blush: mixHex(dye.accent, "#e66f6f", 0.48),
    ink: "#221f2e",
    paper: "#fffdf2"
  };
  const bob = pose === "anticipate" ? 1 : pose === "cheer" ? -2 : frame === 1 ? -1 : 0;
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(PIXEL_BEASTIE_ART_SCALE, PIXEL_BEASTIE_ART_SCALE);
  drawTail(ctx, creature, direction, palette, bob);
  drawBackGear(ctx, creature, direction, palette, bob);
  const metrics = drawBody(ctx, creature, direction, palette, frame, bob);
  drawActionArms(ctx, direction, palette, bob, pose);
  drawPattern(ctx, creature, direction, palette, bob);
  drawMaterialDetail(ctx, creature, direction, palette, bob, metrics);
  drawEyes(ctx, creature, direction, palette, bob, pose);
  drawMouth(ctx, creature, direction, palette, bob, pose);
  drawCrest(ctx, creature, direction, palette, bob);
  drawGear(ctx, creature, direction, palette, bob);
  drawActionProp(ctx, direction, palette, bob, pose);
  ctx.restore();
}

function vectorColor(layout, token) {
  return layout.vars[VECTOR_TOKEN_TO_VAR[token]] || layout.vars["--cr-dark"] || "#221f2e";
}

function applyVectorPlacement(ctx, transform) {
  if (!transform) return;
  const translate = transform.match(/translate\(([-\d.]+)[ ,]([-\d.]+)\)/);
  const scale = transform.match(/scale\(([-\d.]+)[ ,]([-\d.]+)\)/);
  if (translate) ctx.translate(Number(translate[1]), Number(translate[2]));
  if (scale) ctx.scale(Number(scale[1]), Number(scale[2]));
}

function vectorPoseTransform(ctx, direction, frame, pose) {
  const walkBob = [0, -3, 0, 2][frame] || 0;
  const side = direction === "left" ? -1 : direction === "right" ? 1 : 0;
  const poseY = pose === "anticipate" ? 5
    : pose === "cheer" ? -10
      : pose === "concern" ? 2
        : ["carry", "signal", "climb", "discover"].includes(pose) ? -5
          : pose === "settle" ? 3
            : 0;
  const poseScaleY = pose === "anticipate" ? 0.94
    : pose === "cheer" || pose === "discover" ? 1.035
      : pose === "settle" ? 0.97
        : 1;
  const poseScaleX = pose === "carry" ? 0.97 : pose === "settle" ? 1.025 : 1;
  const poseAngle = pose === "reach" ? side * 0.05
    : pose === "concern" ? -0.025
      : pose === "tool" ? side * -0.065
        : pose === "turn" ? side * 0.08
          : pose === "steer" ? side * 0.055
            : pose === "signal" ? side * -0.035
              : pose === "climb" ? side * 0.045
                : 0;
  ctx.translate(0, walkBob + poseY);
  ctx.translate(100, 170);
  ctx.rotate(poseAngle);
  ctx.scale(poseScaleX, poseScaleY);
  ctx.translate(-100, -170);
}

function drawVectorPerformanceOverlay(ctx, layout, direction, pose) {
  if (!pose || pose === "settle") return;
  const facing = direction === "left" ? -1 : 1;
  const ink = vectorColor(layout, "dark");
  const skin = vectorColor(layout, "skin");
  const accent = vectorColor(layout, "accent");
  const paper = vectorColor(layout, "white");
  const strokeLimb = (x1, y1, x2, y2) => {
    ctx.lineCap = "round";
    ctx.strokeStyle = ink;
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = skin;
    ctx.lineWidth = 8;
    ctx.stroke();
  };
  const drawCrate = () => {
    ctx.fillStyle = ink;
    ctx.fillRect(69, 39, 62, 39);
    ctx.fillStyle = accent;
    ctx.fillRect(74, 44, 52, 29);
    ctx.fillStyle = paper;
    ctx.fillRect(96, 44, 8, 29);
    ctx.fillRect(74, 56, 52, 5);
  };

  ctx.save();
  if (pose === "anticipate") {
    strokeLimb(62, 126, 73, 148);
    strokeLimb(138, 126, 127, 148);
  } else if (pose === "reach") {
    const handX = 100 + (facing * 70);
    strokeLimb(100 + (facing * 34), 126, handX, 100);
    ctx.fillStyle = paper;
    ctx.fillRect(handX - 4, 87, 8, 18);
  } else if (pose === "cheer") {
    strokeLimb(63, 126, 42, 69);
    strokeLimb(137, 126, 158, 69);
    ctx.fillStyle = accent;
    ctx.fillRect(35, 54, 15, 15);
    ctx.fillRect(150, 54, 15, 15);
    ctx.fillStyle = paper;
    ctx.fillRect(96, 21, 8, 34);
    ctx.fillRect(83, 34, 34, 8);
  } else if (pose === "concern") {
    strokeLimb(61, 127, 82, 104);
    strokeLimb(139, 127, 118, 104);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(164, 69);
    ctx.quadraticCurveTo(181, 92, 164, 108);
    ctx.quadraticCurveTo(147, 92, 164, 69);
    ctx.fill();
  } else if (pose === "carry") {
    strokeLimb(58, 126, 78, 76);
    strokeLimb(142, 126, 122, 76);
    drawCrate();
  } else if (pose === "tool") {
    const handX = 100 + (facing * 52);
    strokeLimb(100 + (facing * 35), 126, handX, 86);
    ctx.translate(handX, 83);
    ctx.rotate(facing * -0.32);
    ctx.fillStyle = ink;
    ctx.fillRect(-7, -4, 14, 76);
    ctx.fillRect(-29, -16, 58, 26);
    ctx.fillStyle = accent;
    ctx.fillRect(-24, -11, 48, 16);
    ctx.fillStyle = skin;
    ctx.fillRect(-3, 4, 6, 63);
  } else if (pose === "turn" || pose === "steer") {
    strokeLimb(59, 128, 77, 130);
    strokeLimb(141, 128, 123, 130);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.arc(100, 132, 36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.strokeStyle = paper;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(66, 132);
    ctx.lineTo(134, 132);
    ctx.moveTo(100, 98);
    ctx.lineTo(100, 166);
    ctx.stroke();
  } else if (pose === "signal") {
    const poleX = 100 + (facing * 70);
    strokeLimb(100 + (facing * 37), 125, poleX, 91);
    ctx.fillStyle = ink;
    ctx.fillRect(poleX - 5, 28, 10, 138);
    const flagX = facing < 0 ? poleX + 5 : poleX - 64;
    ctx.fillRect(flagX - 4, 31, 67, 48);
    ctx.fillStyle = accent;
    ctx.fillRect(flagX, 35, 59, 40);
    ctx.fillStyle = paper;
    ctx.fillRect(flagX + 23, 45, 13, 20);
  } else if (pose === "climb") {
    const ropeX = 100 + (facing * 62);
    ctx.fillStyle = ink;
    ctx.fillRect(ropeX - 5, 4, 10, 190);
    strokeLimb(100 + (facing * 37), 112, ropeX, 73);
    strokeLimb(100 + (facing * 29), 146, ropeX, 129);
    ctx.fillStyle = accent;
    ctx.fillRect(ropeX - 14, 61, 28, 19);
    ctx.fillRect(ropeX - 14, 119, 28, 19);
  } else if (pose === "discover") {
    const starX = 100 + (facing * 34);
    ctx.strokeStyle = paper;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(starX, 17);
    ctx.lineTo(starX, 75);
    ctx.moveTo(starX - 29, 46);
    ctx.lineTo(starX + 29, 46);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.restore();
}

function drawVectorShape(ctx, layout, shape, direction, slotId) {
  if (direction === "up" && slotId === "body" && shape.fill === "belly") return;
  const path = new Path2D(shape.d);
  ctx.globalAlpha = shape.opacity ?? 1;
  if (shape.fill && shape.fill !== "none") {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = vectorColor(layout, "dark");
    ctx.lineWidth = slotId === "body" ? 4.2 : 2.6;
    ctx.stroke(path);
    ctx.fillStyle = vectorColor(layout, shape.fill);
    ctx.fill(path);
  }
  if (shape.stroke) {
    ctx.strokeStyle = vectorColor(layout, shape.stroke);
    ctx.lineWidth = shape.width || 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke(path);
  }
  ctx.globalAlpha = 1;
}

function drawVectorBodyLighting(ctx, layout) {
  if (!layout.silhouette) return;
  ctx.save();
  ctx.clip(new Path2D(layout.silhouette));

  const shade = ctx.createLinearGradient(24, 18, 180, 184);
  shade.addColorStop(0, "rgba(255, 248, 218, 0.24)");
  shade.addColorStop(0.42, "rgba(255, 255, 255, 0)");
  shade.addColorStop(1, "rgba(34, 31, 46, 0.34)");
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, VECTOR_VIEWBOX, VECTOR_VIEWBOX);

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(255, 248, 218, 0.28)";
  ctx.fillRect(58, 52, 13, 4);
  ctx.fillRect(49, 63, 7, 18);
  ctx.fillStyle = "rgba(34, 31, 46, 0.18)";
  ctx.fillRect(146, 112, 6, 24);
  ctx.fillRect(132, 154, 13, 5);
  ctx.restore();
}

function drawVectorBeastieFrame(ctx, layout, direction, frame, offsetX, offsetY, pose = null) {
  if (typeof Path2D !== "function") return false;
  const directionScaleX = direction === "left" ? -1 : 1;
  const faceShift = direction === "left" ? -8 : direction === "right" ? 8 : 0;
  const artScale = (PIXEL_BEASTIE_FRAME - 8) / VECTOR_VIEWBOX;

  ctx.save();
  ctx.translate(offsetX + (PIXEL_BEASTIE_FRAME / 2), offsetY + 4);
  ctx.scale(directionScaleX * artScale, artScale);
  ctx.translate(-100, 0);
  vectorPoseTransform(ctx, direction, frame, pose);

  for (const layer of layout.layers) {
    if (direction === "up" && ["eyes", "mouth"].includes(layer.slotId)) continue;
    ctx.save();
    if (layer.clipped && layout.silhouette) ctx.clip(new Path2D(layout.silhouette));
    if (faceShift && ["eyes", "mouth"].includes(layer.slotId)) {
      ctx.translate(directionScaleX * faceShift, 0);
    }
    for (const placement of layer.placements) {
      ctx.save();
      applyVectorPlacement(ctx, placement.transform);
      for (const shape of layer.paths) drawVectorShape(ctx, layout, shape, direction, layer.slotId);
      ctx.restore();
    }
    if (layer.slotId === "body") drawVectorBodyLighting(ctx, layout);
    ctx.restore();
  }
  drawVectorPerformanceOverlay(ctx, layout, direction, pose);
  ctx.restore();
  return true;
}

function finishPixelBeastieSheet(source) {
  const lowFrame = PIXEL_BEASTIE_FRAME;
  const lowCanvas = document.createElement("canvas");
  lowCanvas.width = lowFrame * PIXEL_BEASTIE_FRAMES_PER_DIRECTION;
  lowCanvas.height = lowFrame * PIXEL_BEASTIE_DIRECTIONS.length;
  const lowCtx = lowCanvas.getContext("2d", { alpha: true });
  lowCtx.imageSmoothingEnabled = true;
  lowCtx.imageSmoothingQuality = "high";
  lowCtx.drawImage(source, 0, 0, lowCanvas.width, lowCanvas.height);

  const image = lowCtx.getImageData(0, 0, lowCanvas.width, lowCanvas.height);
  for (let y = 0; y < lowCanvas.height; y += 1) {
    for (let x = 0; x < lowCanvas.width; x += 1) {
      const offset = ((y * lowCanvas.width) + x) * 4;
      if (image.data[offset + 3] < 96) {
        image.data[offset + 3] = 0;
        continue;
      }
      image.data[offset + 3] = 255;
      const dither = ((x * 7) + (y * 11)) % 23 === 0
        ? ((x + y) % 2 === 0 ? 7 : -7)
        : 0;
      for (let channel = 0; channel < 3; channel += 1) {
        const shifted = Math.max(0, Math.min(255, image.data[offset + channel] + dither));
        image.data[offset + channel] = Math.min(255, Math.round(shifted / 17) * 17);
      }
    }
  }
  lowCtx.putImageData(image, 0, 0);

  const finished = document.createElement("canvas");
  finished.width = source.width;
  finished.height = source.height;
  const finishedCtx = finished.getContext("2d", { alpha: true });
  finishedCtx.imageSmoothingEnabled = false;
  finishedCtx.drawImage(lowCanvas, 0, 0, finished.width, finished.height);
  return finished;
}

// The 64-frame sheet re-rendered ON THE MAIN THREAD at every stop mount
// (the Phaser game is destroyed and rebuilt per stopId) and AGAIN on the
// reward screen. The creature rarely changes: cache the finished canvas by
// its normalized signature, bounded so a customization spree can't grow it.
const BEASTIE_SHEET_CACHE = new Map();
const BEASTIE_SHEET_CACHE_LIMIT = 8;

export function createPixelBeastieSheet(rawCreature) {
  const creature = normalizeCreature(rawCreature);
  const signature = JSON.stringify(creature);
  const cached = BEASTIE_SHEET_CACHE.get(signature);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = PIXEL_BEASTIE_FRAME * PIXEL_BEASTIE_FRAMES_PER_DIRECTION;
  canvas.height = PIXEL_BEASTIE_FRAME * PIXEL_BEASTIE_DIRECTIONS.length;
  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.imageSmoothingEnabled = false;
  // Creature layout is invariant across direction, locomotion frame, and
  // performance pose. Compute it once per sheet, not once for all 64 frames.
  const layout = layoutCreature(creature);
  for (let row = 0; row < PIXEL_BEASTIE_DIRECTIONS.length; row += 1) {
    for (let frame = 0; frame < PIXEL_BEASTIE_FRAMES_PER_DIRECTION; frame += 1) {
      const direction = PIXEL_BEASTIE_DIRECTIONS[row];
      const offsetX = frame * PIXEL_BEASTIE_FRAME;
      const offsetY = row * PIXEL_BEASTIE_FRAME;
      const pose = frame >= 4 ? PIXEL_BEASTIE_ACTION_POSES[frame - 4] : null;
      if (!drawVectorBeastieFrame(ctx, layout, direction, frame, offsetX, offsetY, pose)) {
        drawFrame(ctx, creature, direction, frame, offsetX, offsetY, pose);
      }
    }
  }
  const finishedSheet = finishPixelBeastieSheet(canvas);
  BEASTIE_SHEET_CACHE.set(signature, finishedSheet);
  if (BEASTIE_SHEET_CACHE.size > BEASTIE_SHEET_CACHE_LIMIT) {
    BEASTIE_SHEET_CACHE.delete(BEASTIE_SHEET_CACHE.keys().next().value);
  }
  return finishedSheet;
}
