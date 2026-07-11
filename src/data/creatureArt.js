// THE CREATURE — vector art.
//
// Path data only. No image files, no external <use>: see the header of
// creatureParts.js for why (CSS custom properties do not cross the shadow
// boundary into externally-referenced SVG, which would kill the dye system).
//
// COORDINATE RULE, and it is the whole trick:
//   - `body` and `pattern` art is ABSOLUTE, in the 200x200 creature viewBox.
//   - EVERYTHING ELSE is LOCAL, drawn around (0, 0), and translated onto a
//     named anchor of whichever body the child chose. That is what lets a hat
//     sit correctly on six differently-shaped heads.
//
// FILLS are token names, never colours: skin | skinDark | belly | accent |
// dark | white | none. CreatureFigure maps them to var(--cr-*), which the dye
// sets. One dye recolours every shape.

const circle = (cx, cy, r) =>
  `M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 Z`;

const ellipse = (cx, cy, rx, ry) =>
  `M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 ${-rx * 2},0 Z`;

// ── Bodies (absolute) ───────────────────────────────────────────────────────
const BODY_ART = {
  tuft: {
    silhouette: "M100,30 C142,30 166,62 166,112 C166,156 140,180 100,180 C60,180 34,156 34,112 C34,62 58,30 100,30 Z",
    paths: [
      { d: "M100,30 C142,30 166,62 166,112 C166,156 140,180 100,180 C60,180 34,156 34,112 C34,62 58,30 100,30 Z", fill: "skin" },
      { d: "M34,120 C46,166 68,180 100,180 C132,180 154,166 166,120 C160,164 136,180 100,180 C64,180 40,164 34,120 Z", fill: "skinDark", opacity: 0.5 },
      { d: ellipse(100, 134, 36, 30), fill: "belly" }
    ]
  },
  spike: {
    silhouette: "M100,20 C132,52 162,78 162,120 C162,156 134,180 100,180 C66,180 38,156 38,120 C38,78 68,52 100,20 Z",
    paths: [
      { d: "M100,20 C132,52 162,78 162,120 C162,156 134,180 100,180 C66,180 38,156 38,120 C38,78 68,52 100,20 Z", fill: "skin" },
      { d: "M100,20 C100,60 100,140 100,180 C134,180 162,156 162,120 C162,78 132,52 100,20 Z", fill: "skinDark", opacity: 0.28 },
      { d: ellipse(100, 138, 34, 28), fill: "belly" }
    ]
  },
  pebble: {
    silhouette: "M100,54 C150,54 174,80 174,122 C174,160 146,182 100,182 C54,182 26,160 26,122 C26,80 50,54 100,54 Z",
    paths: [
      { d: "M100,54 C150,54 174,80 174,122 C174,160 146,182 100,182 C54,182 26,160 26,122 C26,80 50,54 100,54 Z", fill: "skin" },
      { d: "M26,130 C36,170 62,182 100,182 C138,182 164,170 174,130 C166,166 138,182 100,182 C62,182 34,166 26,130 Z", fill: "skinDark", opacity: 0.5 },
      { d: ellipse(100, 142, 40, 28), fill: "belly" }
    ]
  },
  stalk: {
    silhouette: "M100,24 C128,24 148,44 148,74 L148,142 C148,166 128,182 100,182 C72,182 52,166 52,142 L52,74 C52,44 72,24 100,24 Z",
    paths: [
      { d: "M100,24 C128,24 148,44 148,74 L148,142 C148,166 128,182 100,182 C72,182 52,166 52,142 L52,74 C52,44 72,24 100,24 Z", fill: "skin" },
      { d: "M118,26 C136,34 148,52 148,74 L148,142 C148,166 128,182 100,182 C118,176 128,164 128,142 L128,74 C128,50 124,34 118,26 Z", fill: "skinDark", opacity: 0.3 },
      { d: ellipse(100, 124, 26, 36), fill: "belly" }
    ]
  },
  moth: {
    silhouette: "M100,32 C132,32 152,52 156,84 C176,92 182,114 176,134 C168,160 140,182 100,182 C60,182 32,160 24,134 C18,114 24,92 44,84 C48,52 68,32 100,32 Z",
    paths: [
      { d: "M100,32 C132,32 152,52 156,84 C176,92 182,114 176,134 C168,160 140,182 100,182 C60,182 32,160 24,134 C18,114 24,92 44,84 C48,52 68,32 100,32 Z", fill: "skin" },
      { d: "M156,84 C176,92 182,114 176,134 C168,160 140,182 100,182 C136,170 152,146 156,120 C158,104 158,92 156,84 Z", fill: "skinDark", opacity: 0.28 },
      { d: ellipse(100, 136, 34, 30), fill: "belly" }
    ]
  },
  boulder: {
    silhouette: "M64,40 L136,40 C160,40 174,58 174,86 L174,142 C174,168 158,182 132,182 L68,182 C42,182 26,168 26,142 L26,86 C26,58 40,40 64,40 Z",
    paths: [
      { d: "M64,40 L136,40 C160,40 174,58 174,86 L174,142 C174,168 158,182 132,182 L68,182 C42,182 26,168 26,142 L26,86 C26,58 40,40 64,40 Z", fill: "skin" },
      { d: "M26,146 C26,170 42,182 68,182 L132,182 C158,182 174,170 174,146 C168,168 152,176 132,176 L68,176 C48,176 32,168 26,146 Z", fill: "skinDark", opacity: 0.5 },
      { d: "M62,116 L138,116 C146,116 150,122 150,132 L150,152 C150,162 146,168 138,168 L62,168 C54,168 50,162 50,152 L50,132 C50,122 54,116 62,116 Z", fill: "belly" }
    ]
  }
};

// ── Eyes (local, drawn around 0,0) ──────────────────────────────────────────
const EYE_ART = {
  "eyes-round": [
    { d: circle(0, 0, 13), fill: "white" },
    { d: circle(2, -1, 6), fill: "dark" },
    { d: circle(4, -3, 2), fill: "white" }
  ],
  "eyes-big": [
    { d: circle(0, 0, 18), fill: "white" },
    { d: circle(3, 0, 9), fill: "dark" },
    { d: circle(6, -4, 3), fill: "white" }
  ],
  "eyes-sleepy": [
    { d: circle(0, 0, 13), fill: "white" },
    { d: circle(1, 2, 6), fill: "dark" },
    { d: "M-14,-2 C-6,-10 6,-10 14,-2 L14,-14 L-14,-14 Z", fill: "skinDark" }
  ],
  "eyes-wide": [
    { d: ellipse(0, 0, 12, 16), fill: "white" },
    { d: circle(2, 1, 6), fill: "dark" },
    { d: circle(4, -4, 2), fill: "white" }
  ],
  "eyes-tiny": [
    { d: circle(0, 0, 7), fill: "white" },
    { d: circle(1, 0, 4), fill: "dark" }
  ],
  "eyes-fierce": [
    { d: circle(0, 0, 13), fill: "white" },
    { d: circle(2, 1, 6), fill: "dark" },
    { d: "M-15,-12 L14,-3 L14,-9 L-13,-19 Z", fill: "skinDark" }
  ],
  "eyes-goggle": [
    { d: circle(0, 0, 15), fill: "accent" },
    { d: circle(0, 0, 11), fill: "white" },
    { d: circle(2, 0, 5), fill: "dark" },
    { d: "M-16,-1 L-24,-1 L-24,3 L-16,3 Z", fill: "accent" }
  ],
  "eyes-stalks": [
    { d: "M-3,4 L-3,-20 L3,-20 L3,4 Z", fill: "skinDark" },
    { d: circle(0, -26, 11), fill: "white" },
    { d: circle(2, -26, 5), fill: "dark" }
  ],
  "eyes-one": [
    { d: circle(0, 0, 24), fill: "white" },
    { d: circle(3, 0, 12), fill: "dark" },
    { d: circle(8, -6, 4), fill: "white" }
  ],
  "eyes-three": [
    { d: circle(-20, 4, 10), fill: "white" },
    { d: circle(-18, 4, 5), fill: "dark" },
    { d: circle(0, -12, 11), fill: "white" },
    { d: circle(2, -12, 5), fill: "dark" },
    { d: circle(20, 4, 10), fill: "white" },
    { d: circle(22, 4, 5), fill: "dark" }
  ]
};

// ── Mouths (local) ──────────────────────────────────────────────────────────
const MOUTH_ART = {
  "mouth-smile": [
    { d: "M-18,-4 C-12,10 12,10 18,-4", fill: "none", stroke: "dark", width: 5 }
  ],
  "mouth-grin": [
    { d: "M-22,-6 C-14,14 14,14 22,-6 Z", fill: "dark" },
    { d: "M-16,-6 L16,-6 L14,0 L-14,0 Z", fill: "white" }
  ],
  "mouth-tusks": [
    { d: "M-20,-4 C-12,8 12,8 20,-4", fill: "none", stroke: "dark", width: 5 },
    { d: "M-16,-2 L-10,-2 L-13,12 Z", fill: "white" },
    { d: "M10,-2 L16,-2 L13,12 Z", fill: "white" }
  ],
  "mouth-beak": [
    { d: "M-16,-6 L16,-6 L0,14 Z", fill: "accent" },
    { d: "M-16,-6 L16,-6 L10,0 L-10,0 Z", fill: "skinDark", opacity: 0.4 }
  ],
  "mouth-round": [
    { d: circle(0, 2, 11), fill: "dark" },
    { d: circle(0, 5, 6), fill: "accent", opacity: 0.5 }
  ],
  "mouth-fangs": [
    { d: "M-24,-8 C-16,16 16,16 24,-8 Z", fill: "dark" },
    { d: "M-18,-8 L-10,-8 L-14,4 Z", fill: "white" },
    { d: "M10,-8 L18,-8 L14,4 Z", fill: "white" },
    { d: "M-6,10 L6,10 L2,2 L-2,2 Z", fill: "white" }
  ],
  "mouth-whisker": [
    { d: "M-14,-2 C-8,8 8,8 14,-2", fill: "none", stroke: "dark", width: 4 },
    { d: "M-16,-4 L-34,-10", fill: "none", stroke: "skinDark", width: 3 },
    { d: "M-16,0 L-34,2", fill: "none", stroke: "skinDark", width: 3 },
    { d: "M16,-4 L34,-10", fill: "none", stroke: "skinDark", width: 3 },
    { d: "M16,0 L34,2", fill: "none", stroke: "skinDark", width: 3 }
  ],
  "mouth-snout": [
    { d: ellipse(0, 0, 22, 15), fill: "belly" },
    { d: circle(-7, -3, 3), fill: "dark" },
    { d: circle(7, -3, 3), fill: "dark" },
    { d: "M-10,6 C-4,11 4,11 10,6", fill: "none", stroke: "dark", width: 3 }
  ]
};

// ── Crests (local, sit ON the headTop anchor and grow upward) ───────────────
const CREST_ART = {
  "crest-none": [],
  "crest-horns": [
    { d: "M-18,4 C-24,-10 -18,-22 -6,-26 C-12,-16 -12,-8 -8,2 Z", fill: "accent" },
    { d: "M18,4 C24,-10 18,-22 6,-26 C12,-16 12,-8 8,2 Z", fill: "accent" }
  ],
  "crest-antenna": [
    { d: "M-8,4 C-14,-10 -16,-20 -12,-30", fill: "none", stroke: "skinDark", width: 4 },
    { d: circle(-12, -34, 6), fill: "accent" },
    { d: "M8,4 C14,-10 16,-20 12,-30", fill: "none", stroke: "skinDark", width: 4 },
    { d: circle(12, -34, 6), fill: "accent" }
  ],
  "crest-fin": [
    { d: "M-20,4 C-14,-14 -6,-24 0,-30 C6,-24 14,-14 20,4 Z", fill: "accent" },
    { d: "M-8,2 L0,-22 L8,2 Z", fill: "skinDark", opacity: 0.3 }
  ],
  "crest-ears": [
    { d: "M-22,2 C-30,-14 -24,-26 -12,-24 C-8,-16 -10,-6 -12,2 Z", fill: "skin" },
    { d: "M-20,0 C-24,-12 -20,-19 -14,-18 C-12,-12 -13,-6 -14,0 Z", fill: "belly" },
    { d: "M22,2 C30,-14 24,-26 12,-24 C8,-16 10,-6 12,2 Z", fill: "skin" },
    { d: "M20,0 C24,-12 20,-19 14,-18 C12,-12 13,-6 14,0 Z", fill: "belly" }
  ],
  "crest-spikes": [
    { d: "M-26,4 L-18,-14 L-10,4 Z", fill: "accent" },
    { d: "M-10,4 L0,-24 L10,4 Z", fill: "accent" },
    { d: "M10,4 L18,-14 L26,4 Z", fill: "accent" }
  ],
  "crest-frond": [
    { d: "M0,4 L0,-30", fill: "none", stroke: "skinDark", width: 4 },
    { d: "M0,-26 C-16,-30 -24,-22 -26,-12 C-14,-12 -4,-18 0,-26 Z", fill: "accent" },
    { d: "M0,-26 C16,-30 24,-22 26,-12 C14,-12 4,-18 0,-26 Z", fill: "accent" },
    { d: "M0,-12 C-12,-16 -20,-10 -22,-2 C-10,-2 -3,-6 0,-12 Z", fill: "accent", opacity: 0.75 },
    { d: "M0,-12 C12,-16 20,-10 22,-2 C10,-2 3,-6 0,-12 Z", fill: "accent", opacity: 0.75 }
  ],
  "crest-crown": [
    { d: "M-24,4 L-24,-16 L-12,-6 L0,-22 L12,-6 L24,-16 L24,4 Z", fill: "accent" },
    { d: circle(0, -24, 4), fill: "white" }
  ],
  "crest-shell": [
    { d: "M-24,4 C-24,-16 -12,-28 0,-28 C12,-28 24,-16 24,4 Z", fill: "skinDark" },
    { d: "M-14,4 C-14,-12 -7,-20 0,-20 C7,-20 14,-12 14,4 Z", fill: "accent", opacity: 0.7 },
    { d: "M-5,4 C-5,-6 -2,-11 0,-11 C2,-11 5,-6 5,4 Z", fill: "belly" }
  ],
  "crest-flame": [
    { d: "M0,4 C-14,-6 -18,-20 -10,-34 C-10,-24 -6,-20 -2,-22 C-6,-34 2,-44 12,-46 C6,-34 10,-26 14,-20 C18,-12 12,0 0,4 Z", fill: "accent" },
    { d: "M0,2 C-6,-4 -8,-12 -4,-20 C-4,-14 -1,-12 1,-14 C-1,-22 4,-28 9,-30 C5,-22 8,-16 9,-12 C11,-7 6,0 0,2 Z", fill: "white", opacity: 0.55 }
  ]
};

// ── Tails (local, grow right and down from tailBase) ────────────────────────
const TAIL_ART = {
  "tail-none": [],
  "tail-curl": [
    { d: "M-4,-6 C18,-10 30,2 26,16 C22,28 8,30 4,22 C12,24 18,18 16,10 C14,2 4,0 -4,4 Z", fill: "skin" },
    { d: "M-4,-6 C10,-9 20,-5 24,3 C18,-2 8,-2 -4,2 Z", fill: "skinDark", opacity: 0.4 }
  ],
  "tail-fan": [
    { d: "M-4,-2 L26,-24 L22,-6 L36,-4 L20,10 L28,22 L8,18 L2,30 L-6,10 Z", fill: "accent" },
    { d: "M-4,-2 L20,-14 L14,0 L20,8 L6,10 Z", fill: "skinDark", opacity: 0.3 }
  ],
  "tail-spade": [
    { d: "M-4,-2 C10,0 20,6 26,14", fill: "none", stroke: "skin", width: 9 },
    { d: "M24,8 L42,10 L28,26 Z", fill: "accent" }
  ],
  "tail-tuft": [
    { d: "M-4,-2 C10,2 18,8 22,16", fill: "none", stroke: "skin", width: 9 },
    { d: circle(28, 20, 12), fill: "belly" },
    { d: circle(23, 13, 7), fill: "belly" }
  ],
  "tail-spike": [
    { d: "M-4,-2 C12,2 24,10 34,24 L20,20 L26,32 L12,22 L12,32 L2,18 Z", fill: "skin" },
    { d: "M0,0 L20,12 L14,14 Z", fill: "skinDark", opacity: 0.4 }
  ],
  "tail-fern": [
    { d: "M-4,-2 C12,4 24,14 32,28", fill: "none", stroke: "skinDark", width: 4 },
    { d: "M4,2 C8,-8 18,-10 22,-4 C14,-4 8,0 6,6 Z", fill: "accent" },
    { d: "M14,10 C18,0 28,-2 32,4 C24,4 18,8 16,14 Z", fill: "accent" },
    { d: "M24,20 C28,10 38,8 42,14 C34,14 28,18 26,24 Z", fill: "accent" }
  ],
  "tail-moon": [
    { d: "M-4,-2 C14,2 26,12 32,26", fill: "none", stroke: "skinDark", width: 5 },
    { d: "M40,18 C48,26 46,38 36,42 C42,34 42,26 34,20 Z", fill: "accent" },
    { d: circle(30, 30, 3), fill: "white" },
    { d: circle(42, 34, 2), fill: "white" }
  ]
};

// ── Feet (local, pair) ──────────────────────────────────────────────────────
const FEET_ART = {
  "feet-paws": [
    { d: ellipse(0, 6, 16, 10), fill: "skinDark" },
    { d: ellipse(0, 3, 11, 6), fill: "belly" }
  ],
  "feet-claws": [
    { d: "M-16,-2 L16,-2 L14,10 L-14,10 Z", fill: "skinDark" },
    { d: "M-14,10 L-9,18 L-5,10 Z", fill: "white" },
    { d: "M-3,10 L2,18 L6,10 Z", fill: "white" },
    { d: "M8,10 L13,18 L16,10 Z", fill: "white" }
  ],
  "feet-hoofs": [
    { d: "M-12,-2 L12,-2 L14,12 L-14,12 Z", fill: "skinDark" },
    { d: "M-14,12 L14,12 L12,18 L-12,18 Z", fill: "dark" }
  ],
  "feet-round": [
    { d: circle(0, 6, 13), fill: "skinDark" },
    { d: circle(0, 4, 7), fill: "belly" }
  ],
  "feet-webbed": [
    { d: "M0,-4 C-18,4 -22,14 -20,18 L20,18 C22,14 18,4 0,-4 Z", fill: "accent" },
    { d: "M-10,18 L-8,6 M0,18 L0,4 M10,18 L8,6", fill: "none", stroke: "skinDark", width: 2 }
  ],
  "feet-tall": [
    { d: "M-5,-14 L5,-14 L5,10 L-5,10 Z", fill: "skinDark" },
    { d: ellipse(0, 12, 14, 7), fill: "accent" }
  ]
};

// ── Patterns (absolute; clipped to the body silhouette at render time) ──────
const PATTERN_ART = {
  "pattern-none": [],
  "pattern-spots": [
    { d: circle(64, 78, 11), fill: "skinDark", opacity: 0.45 },
    { d: circle(140, 92, 9), fill: "skinDark", opacity: 0.45 },
    { d: circle(52, 128, 8), fill: "skinDark", opacity: 0.45 },
    { d: circle(150, 140, 12), fill: "skinDark", opacity: 0.45 },
    { d: circle(120, 58, 7), fill: "skinDark", opacity: 0.45 }
  ],
  "pattern-stripes": [
    { d: "M20,60 L180,44 L180,58 L20,74 Z", fill: "skinDark", opacity: 0.4 },
    { d: "M20,96 L180,80 L180,94 L20,110 Z", fill: "skinDark", opacity: 0.4 },
    { d: "M20,132 L180,116 L180,130 L20,146 Z", fill: "skinDark", opacity: 0.4 },
    { d: "M20,168 L180,152 L180,166 L20,182 Z", fill: "skinDark", opacity: 0.4 }
  ],
  "pattern-scales": [
    { d: "M30,70 a14,12 0 0,1 28,0 Z", fill: "skinDark", opacity: 0.35 },
    { d: "M58,70 a14,12 0 0,1 28,0 Z", fill: "skinDark", opacity: 0.35 },
    { d: "M86,70 a14,12 0 0,1 28,0 Z", fill: "skinDark", opacity: 0.35 },
    { d: "M114,70 a14,12 0 0,1 28,0 Z", fill: "skinDark", opacity: 0.35 },
    { d: "M142,70 a14,12 0 0,1 28,0 Z", fill: "skinDark", opacity: 0.35 },
    { d: "M44,96 a14,12 0 0,1 28,0 Z", fill: "skinDark", opacity: 0.35 },
    { d: "M72,96 a14,12 0 0,1 28,0 Z", fill: "skinDark", opacity: 0.35 },
    { d: "M100,96 a14,12 0 0,1 28,0 Z", fill: "skinDark", opacity: 0.35 },
    { d: "M128,96 a14,12 0 0,1 28,0 Z", fill: "skinDark", opacity: 0.35 }
  ],
  "pattern-stars": [
    { d: "M60,72 L64,82 L74,84 L66,91 L68,102 L60,96 L52,102 L54,91 L46,84 L56,82 Z", fill: "accent", opacity: 0.8 },
    { d: "M142,104 L145,111 L152,112 L147,117 L148,124 L142,120 L136,124 L137,117 L132,112 L139,111 Z", fill: "accent", opacity: 0.8 },
    { d: "M92,146 L95,153 L102,154 L97,159 L98,166 L92,162 L86,166 L87,159 L82,154 L89,153 Z", fill: "accent", opacity: 0.8 }
  ]
};

// ── Gear (local, on their anchors) ──────────────────────────────────────────
const GEAR_ART = {
  "leaf-cap": [
    { d: "M0,2 C-22,0 -30,-14 -22,-24 C-10,-34 12,-30 20,-18 C26,-8 16,4 0,2 Z", fill: "accent" },
    { d: "M-18,-20 C-6,-16 8,-12 18,-16", fill: "none", stroke: "skinDark", width: 2 },
    { d: "M18,-18 C24,-26 24,-32 20,-36", fill: "none", stroke: "skinDark", width: 3 }
  ],
  "acorn-hat": [
    { d: "M-22,-8 C-22,-22 -12,-30 0,-30 C12,-30 22,-22 22,-8 Z", fill: "skinDark" },
    { d: "M-24,-8 L24,-8 L20,-2 L-20,-2 Z", fill: "accent" },
    { d: "M-2,-30 L2,-30 L2,-38 L-2,-38 Z", fill: "skinDark" }
  ],
  "moth-wings": [
    { d: "M0,0 C-26,-22 -58,-16 -60,10 C-62,34 -36,44 -12,26 C-4,20 0,10 0,0 Z", fill: "accent", opacity: 0.85 },
    { d: "M0,0 C26,-22 58,-16 60,10 C62,34 36,44 12,26 C4,20 0,10 0,0 Z", fill: "accent", opacity: 0.85 },
    { d: circle(-38, 8, 7), fill: "white", opacity: 0.6 },
    { d: circle(38, 8, 7), fill: "white", opacity: 0.6 }
  ],
  "vine-scarf": [
    { d: "M-26,-2 C-14,10 14,10 26,-2 L26,8 C14,20 -14,20 -26,8 Z", fill: "accent" },
    { d: "M18,6 L30,26 L18,24 L22,32 L10,12 Z", fill: "accent" }
  ],
  "stone-staff": [
    { d: "M-3,-30 L3,-30 L5,44 L-5,44 Z", fill: "skinDark" },
    { d: circle(0, -36, 11), fill: "accent" },
    { d: circle(-3, -39, 4), fill: "white", opacity: 0.7 }
  ]
};

export const CREATURE_ART = {
  ...Object.fromEntries(Object.entries(BODY_ART).map(([id, art]) => [id, art])),
  ...Object.fromEntries(Object.entries(EYE_ART).map(([id, paths]) => [id, { paths }])),
  ...Object.fromEntries(Object.entries(MOUTH_ART).map(([id, paths]) => [id, { paths }])),
  ...Object.fromEntries(Object.entries(CREST_ART).map(([id, paths]) => [id, { paths }])),
  ...Object.fromEntries(Object.entries(TAIL_ART).map(([id, paths]) => [id, { paths }])),
  ...Object.fromEntries(Object.entries(FEET_ART).map(([id, paths]) => [id, { paths }])),
  ...Object.fromEntries(Object.entries(PATTERN_ART).map(([id, paths]) => [id, { paths }])),
  ...Object.fromEntries(Object.entries(GEAR_ART).map(([id, paths]) => [id, { paths }]))
};

export function artFor(pieceId) {
  return CREATURE_ART[pieceId] || null;
}
