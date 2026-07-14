export const QUEST_DISPLAY_MODES = Object.freeze([
  { id: "auto", label: "Automatic" },
  { id: "rich", label: "Rich 3D" },
  { id: "balanced", label: "Balanced 3D" },
  { id: "low", label: "Low-power 3D" },
  { id: "2d", label: "Accessible 2D" }
]);

export const QUEST_QUALITY_TIERS = Object.freeze({
  rich: Object.freeze({
    id: "rich",
    pixelRatio: 1.75,
    shadows: true,
    shadowSize: 1536,
    treeRows: 3,
    decorationStep: 8,
    ambientScale: 1,
    particleScale: 1,
    water: true,
    postEffects: true
  }),
  balanced: Object.freeze({
    id: "balanced",
    pixelRatio: 1.35,
    shadows: true,
    shadowSize: 1024,
    treeRows: 2,
    decorationStep: 11,
    ambientScale: 0.72,
    particleScale: 0.62,
    water: true,
    postEffects: true
  }),
  low: Object.freeze({
    id: "low",
    pixelRatio: 1,
    shadows: false,
    shadowSize: 256,
    treeRows: 1,
    decorationStep: 16,
    ambientScale: 0.38,
    particleScale: 0.24,
    water: false,
    postEffects: false
  }),
  "2d": Object.freeze({
    id: "2d",
    pixelRatio: 1,
    shadows: false,
    shadowSize: 0,
    treeRows: 0,
    decorationStep: 24,
    ambientScale: 0,
    particleScale: 0,
    water: false,
    postEffects: false
  })
});

export function normalizeQuestSettings(raw = {}) {
  const requested = String(raw?.displayMode || "auto");
  const displayMode = QUEST_DISPLAY_MODES.some(mode => mode.id === requested) ? requested : "auto";
  return {
    displayMode,
    reducedMotion: Boolean(raw?.reducedMotion),
    highContrast: Boolean(raw?.highContrast)
  };
}

export function resolveQuestQuality({
  displayMode = "auto",
  deviceMemory = 8,
  hardwareConcurrency = 8,
  width = 1280,
  saveData = false,
  reducedMotion = false,
  webglAvailable = true
} = {}) {
  if (!webglAvailable || displayMode === "2d") return QUEST_QUALITY_TIERS["2d"];
  if (displayMode !== "auto" && QUEST_QUALITY_TIERS[displayMode]) return QUEST_QUALITY_TIERS[displayMode];

  const memory = Number(deviceMemory) || 4;
  const cores = Number(hardwareConcurrency) || 4;
  if (saveData || memory <= 2 || cores <= 2) return QUEST_QUALITY_TIERS.low;
  if (reducedMotion || memory <= 4 || cores <= 4 || Number(width) < 760) return QUEST_QUALITY_TIERS.balanced;
  return QUEST_QUALITY_TIERS.rich;
}

export function detectQuestQuality(settings = {}, browser = globalThis) {
  const normalized = normalizeQuestSettings(settings);
  const navigatorValue = browser?.navigator || {};
  const reducedMotion = normalized.reducedMotion
    || Boolean(browser?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  return resolveQuestQuality({
    displayMode: normalized.displayMode,
    deviceMemory: navigatorValue.deviceMemory,
    hardwareConcurrency: navigatorValue.hardwareConcurrency,
    width: browser?.innerWidth,
    saveData: Boolean(navigatorValue.connection?.saveData),
    reducedMotion
  });
}
