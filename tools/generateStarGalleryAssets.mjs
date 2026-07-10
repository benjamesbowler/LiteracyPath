import { mkdirSync } from "node:fs";
import sharp from "sharp";

const OUT_DIR = "public/images/learn-games/ps1-arcade";
const ART_DIR = "public/images/learn-games/art";

function starPoints(cx, cy, outer, inner, points = 5) {
  const values = [];
  for (let i = 0; i < points * 2; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const radius = i % 2 === 0 ? outer : inner;
    values.push(`${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`);
  }
  return values.join(" ");
}

function galaxyBackground({ name, base, accent, accent2, nebula, warm }) {
  const stars = Array.from({ length: 150 }, (_, i) => {
    const x = (i * 157) % 1280;
    const y = (i * 83) % 720;
    const r = 0.8 + (i % 5) * 0.35;
    const opacity = 0.35 + (i % 7) * 0.08;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${opacity.toFixed(2)}"/>`;
  }).join("");
  const frames = Array.from({ length: 9 }, (_, i) => {
    const x = 110 + i * 132;
    const y = 120 + (i % 3) * 28;
    const skew = i % 2 ? -18 : 16;
    return `
      <g opacity="${0.34 + (i % 3) * 0.1}" transform="translate(${x} ${y}) skewX(${skew})">
        <polygon points="-42,-22 42,-28 52,24 -34,30" fill="#06152a" stroke="${accent}" stroke-width="3"/>
        <polyline points="-22,8 -4,-8 12,6 30,-14" fill="none" stroke="${accent2}" stroke-width="2" opacity=".75"/>
      </g>`;
  }).join("");
  const pillars = Array.from({ length: 7 }, (_, i) => {
    const x = 44 + i * 205;
    const h = 180 + (i % 3) * 65;
    return `
      <g opacity=".78">
        <polygon points="${x},520 ${x + 34},500 ${x + 52},720 ${x - 12},720" fill="${warm ? "#2b1b25" : "#121d3b"}"/>
        <polygon points="${x + 34},500 ${x + 78},526 ${x + 105},720 ${x + 52},720" fill="${warm ? "#4a2530" : "#1c315b"}"/>
        <polygon points="${x + 10},${520 - h} ${x + 76},${530 - h} ${x + 78},526 ${x + 34},500" fill="${accent}" opacity=".26"/>
      </g>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <radialGradient id="nebula" cx="54%" cy="26%" r="66%">
      <stop offset="0" stop-color="${nebula}" stop-opacity=".95"/>
      <stop offset=".38" stop-color="${accent}" stop-opacity=".42"/>
      <stop offset="1" stop-color="${base}" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b1e3a" stop-opacity=".48"/>
      <stop offset=".52" stop-color="#07101f" stop-opacity=".92"/>
      <stop offset="1" stop-color="#02050c"/>
    </linearGradient>
    <linearGradient id="rail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${accent2}" stop-opacity=".1"/>
      <stop offset=".5" stop-color="${accent}" stop-opacity=".95"/>
      <stop offset="1" stop-color="${accent2}" stop-opacity=".1"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1280" height="720" fill="${base}"/>
  <rect width="1280" height="720" fill="url(#nebula)"/>
  <ellipse cx="870" cy="160" rx="390" ry="110" fill="${accent2}" opacity=".09"/>
  <ellipse cx="300" cy="220" rx="240" ry="90" fill="${accent}" opacity=".11"/>
  ${stars}
  ${frames}
  ${pillars}
  <polygon points="140,720 510,342 780,342 1160,720" fill="url(#floor)" stroke="${accent}" stroke-width="2" opacity=".96"/>
  <polygon points="400,720 570,344 608,344 505,720" fill="#000" opacity=".28"/>
  <polygon points="770,720 684,344 722,344 900,720" fill="#000" opacity=".25"/>
  <polyline points="244,720 550,346 584,346 428,720" fill="none" stroke="url(#rail)" stroke-width="6" opacity=".9" filter="url(#glow)"/>
  <polyline points="1036,720 735,346 700,346 850,720" fill="none" stroke="url(#rail)" stroke-width="6" opacity=".9" filter="url(#glow)"/>
  <polyline points="640,720 638,344" fill="none" stroke="${accent2}" stroke-width="3" opacity=".42"/>
  <g opacity=".78">
    <polygon points="520,324 760,324 802,376 480,376" fill="#07101f" stroke="${accent2}" stroke-width="3"/>
    <polygon points="560,340 724,340 744,362 538,362" fill="${accent}" opacity=".18"/>
  </g>
  <circle cx="640" cy="350" r="7" fill="${accent2}" filter="url(#glow)"/>
  <rect width="1280" height="720" fill="#000" opacity=".08"/>
  <metadata>${name}</metadata>
</svg>`;
}

function curatorSprite() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="18" stdDeviation="12" flood-color="#000" flood-opacity=".38"/>
    </filter>
    <linearGradient id="cart" x1="0" x2="1">
      <stop offset="0" stop-color="#28e8ff"/>
      <stop offset=".52" stop-color="#193566"/>
      <stop offset="1" stop-color="#9d5cff"/>
    </linearGradient>
  </defs>
  <g filter="url(#shadow)">
    <ellipse cx="250" cy="408" rx="150" ry="34" fill="#05101f" opacity=".52"/>
    <polygon points="100,334 188,288 348,290 424,336 364,390 158,390" fill="url(#cart)" stroke="#dffcff" stroke-width="10"/>
    <polygon points="142,340 216,310 322,312 380,342 332,366 186,366" fill="#0d1936" opacity=".72"/>
    <circle cx="174" cy="386" r="24" fill="#07101d" stroke="#52fff0" stroke-width="10"/>
    <circle cx="344" cy="386" r="24" fill="#07101d" stroke="#ffd84a" stroke-width="10"/>
    <polygon points="212,178 294,176 328,232 306,294 208,296 180,236" fill="#1671c8" stroke="#ffffff" stroke-width="9"/>
    <polygon points="200,160 226,104 292,98 330,138 318,184 230,196" fill="#8b532e" stroke="#fff4ce" stroke-width="8"/>
    <circle cx="256" cy="162" r="54" fill="#d28a58" stroke="#fff4ce" stroke-width="8"/>
    <polygon points="202,148 228,86 304,94 336,138 308,126 286,150 248,124 222,154" fill="#4b2a1d"/>
    <circle cx="236" cy="166" r="7" fill="#101019"/>
    <circle cx="280" cy="166" r="7" fill="#101019"/>
    <path d="M236 196 Q258 218 284 196" fill="none" stroke="#2a160f" stroke-width="8" stroke-linecap="round"/>
    <polygon points="174,218 120,170 104,190 162,258" fill="#d28a58" stroke="#fff4ce" stroke-width="8"/>
    <polygon points="334,220 424,134 438,154 354,266" fill="#d28a58" stroke="#fff4ce" stroke-width="8"/>
    <polygon points="414,118 452,108 426,178" fill="#ffd84a" stroke="#fff4ce" stroke-width="8"/>
    <polygon points="${starPoints(432, 108, 31, 13)}" fill="#fff06a" stroke="#fff7c2" stroke-width="7"/>
    <rect x="118" y="232" width="56" height="22" rx="9" fill="#2df4ff"/>
    <rect x="334" y="232" width="56" height="22" rx="9" fill="#ffdf55"/>
  </g>
</svg>`;
}

function iconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="45%" cy="34%" r="72%">
      <stop offset="0" stop-color="#31f5ff"/>
      <stop offset=".38" stop-color="#2b2477"/>
      <stop offset="1" stop-color="#06091a"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="74" fill="url(#bg)"/>
  <polygon points="72,366 190,158 322,158 442,366" fill="#09162c" stroke="#90f7ff" stroke-width="12"/>
  <polygon points="${starPoints(256, 138, 66, 28)}" fill="#ffde55" stroke="#fff5bf" stroke-width="10"/>
  <rect x="130" y="268" width="252" height="76" rx="15" fill="#101f3f" stroke="#dffcff" stroke-width="8"/>
  <text x="256" y="322" text-anchor="middle" font-family="Trebuchet MS, Arial, sans-serif" font-size="54" font-weight="900" fill="#ffffff">C</text>
  <circle cx="146" cy="104" r="10" fill="#fff"/>
  <circle cx="382" cy="112" r="8" fill="#fff"/>
  <circle cx="406" cy="250" r="6" fill="#ffd85a"/>
</svg>`;
}

async function writeWebp(path, svg, options = {}) {
  await sharp(Buffer.from(svg))
    .resize(options.width, options.height, { fit: "cover" })
    .webp({ quality: options.quality || 84, alphaQuality: 92 })
    .toFile(path);
}

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(ART_DIR, { recursive: true });

await writeWebp(`${OUT_DIR}/star-gallery-meadow-bg-v1.webp`, galaxyBackground({
  name: "Star Gallery Meadow",
  base: "#07122a",
  accent: "#54fff0",
  accent2: "#ffe45c",
  nebula: "#314f8d",
  warm: false
}), { width: 1280, height: 720, quality: 84 });

await writeWebp(`${OUT_DIR}/star-gallery-dino-bg-v1.webp`, galaxyBackground({
  name: "Star Gallery Dino",
  base: "#130d1d",
  accent: "#ff9147",
  accent2: "#60ffe1",
  nebula: "#6b2f1f",
  warm: true
}), { width: 1280, height: 720, quality: 84 });

await writeWebp(`${OUT_DIR}/star-gallery-moonwood-bg-v1.webp`, galaxyBackground({
  name: "Star Gallery Moonwood",
  base: "#070a20",
  accent: "#9b6cff",
  accent2: "#76f7ff",
  nebula: "#291b63",
  warm: false
}), { width: 1280, height: 720, quality: 84 });

await writeWebp(`${OUT_DIR}/star-gallery-curator-v1.webp`, curatorSprite(), { width: 512, height: 512, quality: 88 });
await writeWebp(`${ART_DIR}/star-gallery.webp`, iconSvg(), { width: 512, height: 512, quality: 86 });

console.log("Generated Star Gallery WebP assets.");
