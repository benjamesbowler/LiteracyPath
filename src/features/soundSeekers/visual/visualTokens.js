function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

const COLOR_BLACK = "#000000";
const COLOR_WHITE = "#FFFFFF";
const COLOR_RUST = "#9A3412";
const COLOR_GOLD_LIGHT = "#FDE68A";
const COLOR_MOSS = "#3F6212";
const COLOR_RIVER = "#0F766E";
const COLOR_SKY = "#1D4ED8";

export const SOUND_SEEKERS_VISUAL_TOKENS = deepFreeze({
  "outline-strong": COLOR_BLACK,
  "ink-deep": "#17213D",
  "ink-muted": "#40506B",
  "surface-white": COLOR_WHITE,
  "surface-warm": "#FFF8E7",
  "surface-option": "#FFFDF7",
  "focus-gold": "#FFD43B",
  "success-deep": "#166534",
  "retry-deep": COLOR_RUST,
  "scrim-ink": "#000000CC",
  "mist-overlay": "#FFFFFF80",
  "biome-seedwake": "#4D7C0F",
  "light-seedwake": COLOR_GOLD_LIGHT,
  "biome-river": COLOR_RIVER,
  "light-river": "#99F6E4",
  "biome-fossil": COLOR_RUST,
  "light-fossil": "#FED7AA",
  "biome-forge": "#334155",
  "light-forge": "#FDBA74",
  "biome-glass": "#047857",
  "light-glass": "#A7F3D0",
  "biome-storm": COLOR_SKY,
  "light-storm": "#BFDBFE",
  "biome-lantern": COLOR_MOSS,
  "light-lantern": COLOR_GOLD_LIGHT,
  "biome-star": "#4338CA",
  "light-star": "#C7D2FE",
  "player-palette-sunrise": "#B45309",
  "player-palette-moss": COLOR_MOSS,
  "player-palette-river": COLOR_RIVER,
  "player-palette-sky": COLOR_SKY,
  "player-palette-plum": "#7E22CE",
  "player-palette-berry": "#BE123C"
});

// Sound Seekers v3 (Story Trail) — the storybook palette. Every colour the v3
// canvas painter, trail content and stylesheet use is defined ONCE here; the
// stylesheet receives them as --ss3-* custom properties set on the .ss3 root
// (see soundSeekersV3CssVariables). Names describe the material, not the hue.
const V3_INK = "#3B2314";
const V3_INK_SOFT = "#4A2F18";
const V3_WOOD_DEEP = "#8A5A2E";
const V3_PLANK = "#D9A35E";
const V3_STONE = "#B9B3A3";
const V3_STONE_MIST = "#9AA3A8";
const V3_UNLIT = "#C9C2B0";
const V3_SKY_MEADOW = "#8FD3FF";
const V3_TEXT_ON_LEAF = "#FFF8DF";
const V3_GROUND_DUSK = { top: "#7A9A45", side: "#704B33", dark: "#3D3A2A", ink: "#233D36", plank: "#C4A26A", stone: "#9FB6A8" };
const V3_GROUND_NIGHT = { top: "#4F7A38", side: "#3A4A2E", dark: "#1F391E", ink: "#2A2857", plank: "#C9B070", stone: "#8E8FB8" };

export const SOUND_SEEKERS_V3_PALETTE = deepFreeze({
  ink: V3_INK,
  "ink-soft": V3_INK_SOFT,
  cream: "#FFF6DC",
  paper: "#FFFBEF",
  white: COLOR_WHITE,
  gold: "#F5C644",
  "gold-deep": "#E09B1B",
  leaf: "#57A447",
  "leaf-deep": "#3D7D33",
  "leaf-bright": "#6FB84F",
  berry: "#D9534F",
  "sky-ink": "#2F4F7A",
  wood: "#C98B4F",
  "wood-deep": V3_WOOD_DEEP,
  "wood-light": "#E2AD6F",
  stone: V3_STONE,
  "stone-deep": "#7F7867",
  "stone-sunk": V3_STONE_MIST,
  "lantern-lit": "#FFE27A",
  "lantern-unlit": V3_UNLIT,
  "lantern-text-unlit": "#6C665A",
  "trail-reachable": "#FFF1C2",
  water: "#5FB7E6",
  "water-deep": "#3F8FC0",
  "room-sky-top": "#9AD7FF",
  "room-sky-bottom": "#DFF3D3",
  "heart-pale": "#FFD6D6",
  "ui-night": "#173B3B",
  "ui-focus": "#246DE0",
  "ui-text-on-leaf": V3_TEXT_ON_LEAF,
  lands: {
    meadow: { sky: V3_SKY_MEADOW, accent: "#4E8E3A" },
    dino: { sky: "#FFD98A", accent: "#C2742F" },
    moonwood: { sky: "#6D5EC9", accent: "#3F7F79" }
  },
  // Ground / platform colours per backdrop painting so code-drawn ground
  // matches the biome behind it (two paintings serve two biomes each).
  ground: {
    "seedwake-meadow": { top: "#7FC24A", side: "#C98A4B", dark: V3_WOOD_DEEP, ink: V3_INK_SOFT, plank: V3_PLANK, stone: V3_STONE },
    "river-gardens": { top: "#8CCB63", side: "#B8834D", dark: "#7D5231", ink: V3_INK_SOFT, plank: "#D4A25F", stone: "#A9B6B0" },
    "fossil-canyon": { top: "#B4C24E", side: "#C0793A", dark: "#8D4F22", ink: V3_INK_SOFT, plank: V3_PLANK, stone: "#E8D6B1" },
    "forge-settlement": { top: "#9AA04A", side: "#A87236", dark: "#5C3A1E", ink: "#2B1D16", plank: "#B98A55", stone: "#8F8378" },
    "glass-marsh": V3_GROUND_DUSK,
    "storm-coast": V3_GROUND_DUSK,
    "lantern-forest": V3_GROUND_NIGHT,
    "star-reach": V3_GROUND_NIGHT
  }
});

// The v3 stylesheet reads colours only through these custom properties.
export function soundSeekersV3CssVariables() {
  const p = SOUND_SEEKERS_V3_PALETTE;
  return Object.freeze({
    "--ss3-ink": p.ink,
    "--ss3-cream": p.cream,
    "--ss3-paper": p.paper,
    "--ss3-gold": p.gold,
    "--ss3-gold-deep": p["gold-deep"],
    "--ss3-leaf": p.leaf,
    "--ss3-leaf-deep": p["leaf-deep"],
    "--ss3-berry": p.berry,
    "--ss3-wood": p.wood,
    "--ss3-wood-deep": p["wood-deep"],
    "--ss3-sky": p.lands.meadow.sky,
    "--ss3-night": p["ui-night"],
    "--ss3-focus": p["ui-focus"],
    "--ss3-text-on-leaf": p["ui-text-on-leaf"],
    "--ss3-unlit": p["lantern-unlit"]
  });
}

const CONTRAST_USES = new Set([
  "normal_text",
  "focus_ring",
  "interactive_boundary",
  "state_outline"
]);

export const SOUND_SEEKERS_CONTRAST_PAIRS = deepFreeze([
  {
    id: "child-text-on-warm",
    foregroundTokenId: "ink-deep",
    backgroundTokenId: "surface-warm",
    minRatio: 4.5,
    use: "normal_text"
  },
  {
    id: "child-text-on-white",
    foregroundTokenId: "ink-deep",
    backgroundTokenId: "surface-white",
    minRatio: 4.5,
    use: "normal_text"
  },
  {
    id: "child-text-on-option",
    foregroundTokenId: "ink-deep",
    backgroundTokenId: "surface-option",
    minRatio: 4.5,
    use: "normal_text"
  },
  {
    id: "success-text",
    foregroundTokenId: "surface-white",
    backgroundTokenId: "success-deep",
    minRatio: 4.5,
    use: "normal_text"
  },
  {
    id: "retry-text",
    foregroundTokenId: "surface-white",
    backgroundTokenId: "retry-deep",
    minRatio: 4.5,
    use: "normal_text"
  },
  {
    id: "focus-on-dark",
    foregroundTokenId: "focus-gold",
    backgroundTokenId: "ink-deep",
    minRatio: 3,
    use: "focus_ring"
  },
  {
    id: "focus-on-light",
    foregroundTokenId: "ink-deep",
    backgroundTokenId: "surface-white",
    minRatio: 3,
    use: "focus_ring"
  },
  {
    id: "focus-on-option",
    foregroundTokenId: "ink-deep",
    backgroundTokenId: "surface-option",
    minRatio: 3,
    use: "focus_ring"
  },
  {
    id: "option-boundary",
    foregroundTokenId: "outline-strong",
    backgroundTokenId: "surface-option",
    minRatio: 3,
    use: "interactive_boundary"
  },
  {
    id: "interactable-boundary",
    foregroundTokenId: "ink-deep",
    backgroundTokenId: "surface-warm",
    minRatio: 3,
    use: "interactive_boundary"
  },
  {
    id: "success-state-outline",
    foregroundTokenId: "surface-white",
    backgroundTokenId: "success-deep",
    minRatio: 3,
    use: "state_outline"
  },
  {
    id: "retry-state-outline",
    foregroundTokenId: "surface-white",
    backgroundTokenId: "retry-deep",
    minRatio: 3,
    use: "state_outline"
  }
]);

function parseTokenColor(tokenId) {
  if (typeof tokenId !== "string" || !Object.hasOwn(SOUND_SEEKERS_VISUAL_TOKENS, tokenId)) {
    throw new TypeError(`Unknown visual token: ${String(tokenId)}`);
  }

  const raw = SOUND_SEEKERS_VISUAL_TOKENS[tokenId];
  const match = /^#([0-9A-F]{6})([0-9A-F]{2})?$/u.exec(raw);
  if (!match) throw new TypeError(`Visual token ${tokenId} is not a supported color`);

  const channels = [0, 2, 4].map(offset => Number.parseInt(match[1].slice(offset, offset + 2), 16) / 255);
  const alpha = match[2] ? Number.parseInt(match[2], 16) / 255 : 1;
  return { channels, alpha };
}

function relativeLuminance(channels) {
  const [red, green, blue] = channels.map(channel => (
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

export function contrastRatio(foregroundTokenId, backgroundTokenId) {
  const foreground = parseTokenColor(foregroundTokenId);
  const background = parseTokenColor(backgroundTokenId);
  if (background.alpha !== 1) {
    throw new TypeError("Contrast needs an explicitly composed opaque background");
  }

  const foregroundChannels = foreground.alpha === 1
    ? foreground.channels
    : foreground.channels.map((channel, index) => (
      (channel * foreground.alpha) + (background.channels[index] * (1 - foreground.alpha))
    ));
  const foregroundLuminance = relativeLuminance(foregroundChannels);
  const backgroundLuminance = relativeLuminance(background.channels);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function assertValidContrastPairs() {
  const ids = new Set();
  for (const pair of SOUND_SEEKERS_CONTRAST_PAIRS) {
    if (ids.has(pair.id)) throw new Error(`Duplicate contrast pair: ${pair.id}`);
    ids.add(pair.id);
    if (!CONTRAST_USES.has(pair.use)) throw new Error(`Unknown contrast use: ${pair.use}`);
    const requiredRatio = pair.use === "normal_text" ? 4.5 : 3;
    if (pair.minRatio !== requiredRatio) {
      throw new Error(`Contrast pair ${pair.id} must require ${requiredRatio}:1`);
    }
    if (contrastRatio(pair.foregroundTokenId, pair.backgroundTokenId) < pair.minRatio) {
      throw new Error(`Contrast pair ${pair.id} does not meet ${pair.minRatio}:1`);
    }
  }
}

assertValidContrastPairs();
