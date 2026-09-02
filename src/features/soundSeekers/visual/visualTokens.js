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
