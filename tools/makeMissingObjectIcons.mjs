// Draw the 14 single-object icons missing from the image index, as flat
// child-friendly SVGs rendered to 512x512 PNGs in public/images/objects/.
// Same pipeline as the preposition scenes (sharp SVG -> PNG).
import sharp from "sharp";
import fs from "node:fs";

const BG = "#FDF6EC";
const wrap = inner => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" rx="48" fill="${BG}"/>${inner}</svg>`;

const ICONS = {
  spider: `
    <ellipse cx="256" cy="300" rx="90" ry="78" fill="#4A3728"/>
    <circle cx="256" cy="196" r="52" fill="#5C4433"/>
    <circle cx="238" cy="186" r="9" fill="#fff"/><circle cx="274" cy="186" r="9" fill="#fff"/>
    <circle cx="238" cy="188" r="4.5" fill="#222"/><circle cx="274" cy="188" r="4.5" fill="#222"/>
    ${[-1, 1].map(s => [0, 1, 2, 3].map(i => `
      <path d="M ${256 + s * 60} ${250 + i * 26} q ${s * 70} ${-18 + i * 12} ${s * 120} ${8 + i * 22}"
        stroke="#4A3728" stroke-width="14" fill="none" stroke-linecap="round"/>`).join("")).join("")}
    <path d="M256 96 v48" stroke="#9A8B7A" stroke-width="5"/>`,
  purse: `
    <path d="M116 220 h280 a24 24 0 0 1 24 24 v150 a40 40 0 0 1 -40 40 H132 a40 40 0 0 1 -40 -40 V244 a24 24 0 0 1 24 -24z" fill="#C2527E"/>
    <path d="M176 220 v-24 a80 80 0 0 1 160 0 v24" stroke="#8E3A5C" stroke-width="22" fill="none" stroke-linecap="round"/>
    <rect x="226" y="268" width="60" height="44" rx="14" fill="#F4C64D"/>
    <circle cx="256" cy="290" r="9" fill="#8E3A5C"/>`,
  surf: `
    <path d="M64 356 q64 -44 128 0 t128 0 t128 0 v92 H64z" fill="#3F8FD2"/>
    <path d="M64 356 q64 -44 128 0 t128 0 t128 0" stroke="#DFF1FF" stroke-width="12" fill="none"/>
    <path d="M188 320 Q256 96 360 132 Q300 220 268 332 z" fill="#F2A03D"/>
    <path d="M212 300 Q262 160 330 150" stroke="#C97D22" stroke-width="10" fill="none" stroke-linecap="round"/>`,
  turtle: `
    <ellipse cx="256" cy="280" rx="140" ry="96" fill="#4E8C4A"/>
    <path d="M256 200 a96 76 0 0 1 96 76 h-192 a96 76 0 0 1 96 -76z" fill="#3B6E38" opacity="0.5"/>
    <circle cx="256" cy="252" r="34" fill="#3B6E38" opacity="0.45"/>
    <circle cx="404" cy="252" r="38" fill="#6BAF66"/>
    <circle cx="416" cy="242" r="7" fill="#20351F"/>
    <ellipse cx="150" cy="366" rx="30" ry="18" fill="#6BAF66"/>
    <ellipse cx="352" cy="366" rx="30" ry="18" fill="#6BAF66"/>`,
  storm: `
    <ellipse cx="200" cy="180" rx="104" ry="70" fill="#7C8AA0"/>
    <ellipse cx="312" cy="160" rx="96" ry="64" fill="#93A2B8"/>
    <ellipse cx="262" cy="206" rx="140" ry="66" fill="#67758B"/>
    <path d="M268 262 L212 356 h44 L228 448 L332 330 h-52 L316 262 z" fill="#F4C64D" stroke="#D9A32B" stroke-width="6" stroke-linejoin="round"/>
    <line x1="150" y1="292" x2="128" y2="344" stroke="#3F8FD2" stroke-width="12" stroke-linecap="round"/>
    <line x1="386" y1="280" x2="364" y2="332" stroke="#3F8FD2" stroke-width="12" stroke-linecap="round"/>`,
  stir: `
    <path d="M96 280 h320 a12 12 0 0 1 12 12 c0 84 -76 132 -172 132 s-172 -48 -172 -132 a12 12 0 0 1 12 -12z" fill="#B2543B"/>
    <ellipse cx="256" cy="280" rx="172" ry="34" fill="#E8B44C"/>
    <ellipse cx="256" cy="278" rx="150" ry="26" fill="#F7D06A"/>
    <path d="M300 262 L400 96" stroke="#8A5A33" stroke-width="20" stroke-linecap="round"/>
    <ellipse cx="286" cy="272" rx="34" ry="16" fill="#8A5A33"/>
    <path d="M200 260 q28 14 56 0" stroke="#E8B44C" stroke-width="0" fill="none"/>
    <path d="M170 262 q20 -16 44 -6" stroke="#D9A32B" stroke-width="8" fill="none" stroke-linecap="round"/>`,
  eat: `
    <circle cx="200" cy="220" r="86" fill="#F2C9A0"/>
    <circle cx="176" cy="200" r="9" fill="#222"/>
    <path d="M164 262 a44 30 0 0 0 68 4" fill="#8E3A2E"/>
    <path d="M150 244 q16 12 34 8" stroke="#C98D5A" stroke-width="0" fill="none"/>
    <circle cx="356" cy="238" r="44" fill="#D8493F"/>
    <path d="M356 200 q6 -22 24 -26" stroke="#4E8C4A" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M352 282 L332 400" stroke="#9AA3AE" stroke-width="12" stroke-linecap="round"/>
    <path d="M318 396 h36 M322 396 v26 M330 396 v26 M338 396 v26 M346 396 v26" stroke="#9AA3AE" stroke-width="8" stroke-linecap="round"/>`,
  plate: `
    <ellipse cx="256" cy="276" rx="188" ry="122" fill="#E9EDF2"/>
    <ellipse cx="256" cy="270" rx="188" ry="118" fill="#F7FAFD"/>
    <ellipse cx="256" cy="272" rx="118" ry="72" fill="#DDE5EE"/>
    <ellipse cx="256" cy="268" rx="112" ry="66" fill="#EFF4F9"/>`,
  chop: `
    <rect x="76" y="330" width="360" height="36" rx="14" fill="#B98A5A"/>
    <ellipse cx="176" cy="318" rx="26" ry="14" fill="#EE8A3C"/>
    <ellipse cx="238" cy="318" rx="26" ry="14" fill="#EE8A3C"/>
    <ellipse cx="300" cy="318" rx="26" ry="14" fill="#EE8A3C"/>
    <path d="M348 322 q10 -60 44 -66 v-4 q-64 -10 -74 66 z" fill="#4E8C4A"/>
    <path d="M320 120 L432 120 a16 16 0 0 1 16 16 l0 10 q-80 44 -128 132 l-30 -18 q22 -78 30 -140z" fill="#C6CFD8"/>
    <rect x="300" y="96" width="44" height="60" rx="12" fill="#7A4E2C"/>`,
  walk: `
    <circle cx="268" cy="120" r="42" fill="#F2C9A0"/>
    <path d="M268 162 q-10 70 -6 108" stroke="#3F6FB2" stroke-width="34" stroke-linecap="round"/>
    <path d="M262 270 L204 384 M262 270 L322 380" stroke="#37476B" stroke-width="30" stroke-linecap="round"/>
    <path d="M204 384 l-8 26 h44 M322 380 l6 28 h42" stroke="#20351F" stroke-width="0" fill="none"/>
    <ellipse cx="212" cy="416" rx="34" ry="14" fill="#8E3A2E"/>
    <ellipse cx="336" cy="414" rx="34" ry="14" fill="#8E3A2E"/>
    <path d="M262 190 L192 262 M262 190 L330 250" stroke="#3F6FB2" stroke-width="24" stroke-linecap="round"/>`,
  drink: `
    <path d="M180 140 h152 l-20 260 a24 24 0 0 1 -24 22 h-64 a24 24 0 0 1 -24 -22 z" fill="#CFE8F7" opacity="0.9"/>
    <path d="M186 220 h140 l-14 178 a20 20 0 0 1 -20 18 h-72 a20 20 0 0 1 -20 -18 z" fill="#EE8A3C"/>
    <path d="M296 150 L360 66" stroke="#D8493F" stroke-width="16" stroke-linecap="round"/>
    <circle cx="238" cy="300" r="10" fill="#F7D06A"/>
    <circle cx="276" cy="342" r="8" fill="#F7D06A"/>`,
  path: `
    <rect x="0" y="0" width="512" height="512" rx="48" fill="#BFE0A8"/>
    <path d="M204 512 Q140 420 232 352 Q330 284 264 212 Q210 152 268 96 L318 96 Q276 152 330 206 Q400 282 300 360 Q216 424 286 512 z" fill="#D8C29A"/>
    <ellipse cx="248" cy="470" rx="10" ry="6" fill="#B39B72"/>
    <ellipse cx="262" cy="320" rx="10" ry="6" fill="#B39B72"/>
    <ellipse cx="292" cy="150" rx="9" ry="6" fill="#B39B72"/>
    <circle cx="120" cy="200" r="34" fill="#4E8C4A"/>
    <rect x="112" y="226" width="16" height="34" fill="#7A4E2C"/>
    <circle cx="404" cy="380" r="30" fill="#4E8C4A"/>
    <rect x="397" y="404" width="14" height="30" fill="#7A4E2C"/>`,
  horn: `
    <path d="M120 300 Q250 300 400 180 L430 250 Q300 350 150 350 z" fill="#E8B44C"/>
    <ellipse cx="428" cy="214" rx="30" ry="44" fill="#F4C64D" transform="rotate(24 428 214)"/>
    <rect x="96" y="296" width="52" height="60" rx="18" fill="#D9A32B"/>
    <circle cx="250" cy="296" r="10" fill="#B98413"/>
    <circle cx="300" cy="278" r="10" fill="#B98413"/>
    <circle cx="348" cy="254" r="10" fill="#B98413"/>`,
  sleep: `
    <rect x="80" y="300" width="352" height="90" rx="26" fill="#7A9CC4"/>
    <rect x="80" y="356" width="352" height="60" rx="18" fill="#5C7FA8"/>
    <rect x="96" y="252" width="120" height="70" rx="22" fill="#F7FAFD"/>
    <circle cx="200" cy="266" r="44" fill="#F2C9A0"/>
    <path d="M180 262 q8 8 18 0 M212 262 q8 8 18 0" stroke="#222" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M188 292 q14 10 28 0" stroke="#8E3A2E" stroke-width="6" fill="none" stroke-linecap="round"/>
    <rect x="238" y="286" width="180" height="52" rx="20" fill="#C2527E"/>
    <text x="330" y="180" font-family="Arial Rounded MT Bold, Arial" font-size="72" fill="#5C7FA8" font-weight="bold">Z</text>
    <text x="386" y="130" font-family="Arial Rounded MT Bold, Arial" font-size="52" fill="#7A9CC4" font-weight="bold">z</text>`
};

fs.mkdirSync("public/images/objects", { recursive: true });
for (const [word, inner] of Object.entries(ICONS)) {
  const out = `public/images/objects/${word}.png`;
  await sharp(Buffer.from(wrap(inner))).png().toFile(out);
  console.log("drew", out);
}
