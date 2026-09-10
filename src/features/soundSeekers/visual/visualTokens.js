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
const COLOR_CAMPAIGN_INK = "#403326";

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
  // The action green must remain readable beneath the route scrim as well as
  // on a plain cream board; the darker value keeps normal-size labels above
  // the WCAG AA 4.5:1 threshold in both states.
  "leaf-deep": "#2F6B2B",
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


// Campaign material and interface colors. Keep exact artwork values shared
// between authored appearances, canvas painters, and root CSS properties.
export const SOUND_SEEKERS_CAMPAIGN_PALETTE = deepFreeze({
  "ui-page": "#cfdfc1",
  "ui-ink": COLOR_CAMPAIGN_INK,
  "ui-button-border": "#604a32",
  "ui-button": "#fff4d6",
  "ui-button-shadow": "#392d2022",
  "ui-focus": "#146682",
  "ui-hud": "#fff4d6ed",
  "ui-hud-shadow": "#25391922",
  "ui-prompt": "#fff8e9f2",
  "ui-prompt-shadow": "#1a332a22",
  "ui-controls": "#fff3d6ef",
  "ui-message": "#fff5deeb",
  "ui-scrim": "#1c302d66",
  "ui-panel": "#fff5dd",
  "ui-panel-border": "#685338",
  "ui-panel-shadow": "#26332644",
  "ui-panel-glow": "#142c2555",
  "ui-hero-card": "#e5edcf",
  "ui-notice": "#fff4db",
  "ui-notice-border": "#916a30",
  "ui-heading": "#496643",
  "appearance-stone": "#cbd5e1",
  "appearance-dark-stripe": SOUND_SEEKERS_VISUAL_TOKENS["biome-forge"],
  "appearance-light-stripe": "#fef3c7",
  "hero-shadow": "#273b3333",
  "prop-tone-1": "#493b32",
  "prop-tone-2": "#ba8553",
  "prop-tone-3": "#edc78c",
  "prop-tone-4": "#fff4d7",
  "prop-tone-5": "#6b9b56",
  "prop-tone-6": "#df6b57",
  "prop-tone-7": "#66a9cf",
  "prop-tone-8": "#efc94e",
  "prop-tone-9": "#7aa75b",
  "prop-tone-10": "#fffaf0",
  "prop-tone-11": "#e89544",
  "prop-tone-12": "#a685bb",
  "prop-tone-13": "#6c8444",
  "prop-tone-14": "#84c7d6",
  "prop-tone-15": "#d5f3ef",
  "prop-tone-16": "#976d47",
  "prop-towel-1": "#e7c576",
  "prop-towel-2": "#f3d990",
  "prop-towel-3": "#f7efe0",
  "prop-towel-4": "#d6b263",
  "prop-soap-1": "#bfd1be",
  "prop-soap-2": "#d2e8bd",
  "prop-soap-3": "#f5ffeb",
  "prop-soap-4": "#e5f5f6",
  "prop-tray-1": "#c89c69",
  "prop-tray-2": "#e6c99b",
  "prop-tray-3": "#9e704b",
  "prop-ball-1": "#e5a258",
  "prop-ball-2": "#f6d177",
  "prop-bucket-1": "#86b7c1",
  "prop-bucket-2": "#bfd6cf",
  "prop-bucket-3": "#b8dce0",
  "prop-brush-1": "#75a7a9",
  "prop-brush-2": "#d6bc83",
  "prop-cloth-1": "#8fb5c6",
  "prop-cloth-2": "#c5dce1",
  "prop-blanket-1": "#af9bc7",
  "prop-blanket-2": "#d9cce6",
  "prop-blanket-3": "#d1c0df",
  "prop-pillow-1": "#f2ddb0",
  "prop-cushion-1": "#d58b6e",
  "prop-cushion-2": "#edb194",
  "prop-mat-1": "#9fb97d",
  "prop-mat-2": "#c4d29b",
  "prop-plate-1": "#f3f0e5",
  "prop-plate-2": "#e1e9df",
  "prop-cup-1": "#f0c773",
  "prop-cup-2": "#d1a968",
  "prop-basket-1": "#caa169",
  "prop-basket-2": "#dfbc86",
  "prop-basket-3": "#9f774f",
  "prop-parcel-1": "#d5b07d",
  "prop-parcel-2": "#faf0c9",
  "prop-parcel-3": "#e8cf9f",
  "prop-book-1": "#769cac",
  "prop-book-2": "#f9edce",
  "prop-book-3": "#476d7a",
  "prop-letter-1": "#b29b77",
  "prop-card-1": "#bea77d",
  "prop-scroll-1": "#e6d0a8",
  "prop-scroll-2": "#ae976f",
  "prop-ribbon-1": "#d77c83",
  "prop-ribbon-2": "#efb4ad",
  "prop-button-1": "#daba71",
  "prop-hat-1": "#dcb570",
  "prop-hat-2": "#b77961",
  "prop-egg-1": "#fff1cd",
  "prop-feather-1": "#fbf8e8",
  "prop-feather-2": "#b0a894",
  "prop-rope-1": "#d6bd87",
  "prop-rope-2": "#b99560",
  "prop-plank-1": "#e5c397",
  "prop-tool-1": "#91a3a0",
  "prop-cover-1": "#bdc5b0",
  "prop-paint-1": "#e5d9b9",
  "prop-paint-2": "#739da9",
  "prop-pot-1": "#c78861",
  "prop-pot-2": "#dfab7b",
  "prop-apple-1": "#d77558",
  "prop-apple-2": "#f3b296",
  "prop-berry-1": "#b85e79",
  "prop-carrot-1": "#e39545",
  "prop-carrot-2": "#b96c33",
  "prop-bread-1": "#cc9859",
  "prop-bread-2": "#f2d298",
  "prop-seed-1": "#ac8159",
  "prop-seed-2": "#d3ae7b",
  "prop-leaf-1": "#d0df9c",
  "prop-flower-1": "#e9bd63",
  "prop-flower-2": "#b88648",
  "prop-fern-1": "#557e46",
  "prop-reed-1": "#7c955c",
  "prop-reed-2": "#9c744d",
  "prop-lily-1": "#e7b8bd",
  "prop-hedge-1": "#699352",
  "prop-moss-1": "#8ba864",
  "prop-stone-1": "#a7afa0",
  "prop-stone-2": "#d2d6c8",
  "prop-shell-1": "#e7bc9f",
  "prop-shell-2": "#b88873",
  "prop-gem-1": "#81b6b6",
  "prop-gem-2": "#c4e8da",
  "prop-nest-1": "#ae8655",
  "prop-nest-2": "#745d42",
  "prop-nest-3": "#d7b87b",
  "prop-bed-1": "#aaa4c3",
  "prop-shelf-1": "#966946",
  "prop-flag-1": "#e4a96a",
  "prop-stair-1": "#a3afa1",
  "prop-stair-2": "#d5dfce",
  "prop-raft-1": "#d5bc8a",
  "prop-boat-1": "#b78056",
  "prop-cart-1": "#7c694f",
  "prop-wheel-1": "#94724f",
  "prop-lever-1": "#a9b09b",
  "prop-lever-2": "#cf8a63",
  "prop-roof-1": "#b87860",
  "prop-door-1": "#997049",
  "prop-door-2": "#ebc678",
  "prop-window-1": "#b0d6d5",
  "prop-lantern-1": "#bdc9bc",
  "prop-lantern-2": "#f1dc8a",
  "prop-lantern-3": "#fff0b8",
  "prop-reflector-1": "#c3ddd7",
  "prop-reflector-2": "#f4ffed",
  "prop-pond-1": "#79a265",
  "prop-bay-1": "#d5ba83",
  "prop-island-1": "#c3b47c",
  "prop-path-1": "#d6bb8b",
  "prop-path-2": "#ad966e",
  "prop-glade-1": "#98b579",
  "prop-garden-1": "#ae8c60",
  "prop-garden-2": "#a6c17e",
  "prop-ledge-1": "#a8af9c",
  "prop-ledge-2": "#d5dcc7",
  "prop-shade-1": "#e2c48b",
  "prop-camp-1": "#c7a16e",
  "prop-camp-2": "#705c4a",
  "prop-cave-1": "#a6ad98",
  "prop-cave-2": "#625f53",
  "prop-barn-1": "#bf7259",
  "prop-barn-2": "#97745c",
  "prop-room-1": "#dfc9a0",
  "prop-room-2": "#b39571",
  "prop-room-3": "#adced0",
  "prop-room-4": "#bd9f76",
  "prop-cell-1": "#bbb9a2",
  "prop-cell-2": "#746d5f",
  "prop-cell-3": "#c7c4af",
  "prop-dome-1": "#a1b3a6",
  "prop-dome-2": "#adc6bd",
  "prop-dome-3": "#76948e",
  "prop-city-1": "#b5bcb3",
  "prop-city-2": "#efdcaa",
  "prop-school-1": "#d9b990",
  "prop-school-2": "#a27e63",
  "prop-school-3": "#b5d5d1",
  "prop-school-4": "#efdeb7",
  "prop-head-1": "#d9ae84",
  "prop-head-2": "#81644e",
  "prop-bank-1": "#c1b083",
  "prop-ring-1": "#e2c47e",
  "prop-ring-2": "#8cbac0",
  "prop-sun-1": "#efd16e",
  "prop-sun-2": "#d8b355",
  "prop-launcher-1": "#a28762",
  "prop-launcher-2": "#9bcdd8",
  "prop-tone-17": "#737d70",
  "prop-tone-18": "#615b52",
  "prop-tone-19": "#faf1da",
  "prop-tone-20": "#888f84",
  "prop-tone-21": "#795b3f",
  "prop-tone-22": "#efd275",
  "prop-tone-23": "#79965e",
  "world-tone-1": COLOR_CAMPAIGN_INK,
  "world-tone-2": "#fff6db",
  "world-tone-3": "#50773b",
  "world-tone-4": "#48465d",
  "world-tone-5": "#ad7750",
  "world-tone-6": "#92654a",
  "world-tone-7": "#9fbea0",
  "world-tone-8": "#70964b",
  "world-tone-9": "#5a402c",
  "world-tone-10": "#233b54",
  "world-tone-11": "#c9e9df",
  "world-tone-12": "#e2efc1",
  "world-tone-13": "#41663b",
  "world-tone-14": "#eebd49",
  "world-tone-15": "#d8e9ad",
  "world-tone-16": "#d0b795",
  "world-tone-17": "#776854",
  "world-tone-18": "#477449",
  "world-tone-19": "#dbe9b6",
  "world-tone-20": "#527c81",
  "world-tone-21": "#e2f5f6cc",
  "world-tone-22": "#58848b",
  "world-tone-23": "#ffe293",
  "world-tone-24": "#4c7534",
  "world-tone-25": "#9bdbec",
  "world-tone-26": "#387d91",
  "world-tone-27": "#fff5d8"
});

export function soundSeekersCampaignCssVariables() {
  return Object.freeze(Object.fromEntries(Object.entries(SOUND_SEEKERS_CAMPAIGN_PALETTE)
    .filter(([name]) => name.startsWith('ui-'))
    .map(([name, color]) => [`--ss-campaign-${name}`, color])));
}
