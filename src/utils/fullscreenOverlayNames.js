export const QUEST_FULLSCREEN_VIEWS = Object.freeze([
  "creator",
  "den",
  "map",
  "world",
  "ceremony",
  "post"
]);

function requireSurfaceName(value, context) {
  const name = String(value || "").trim();
  if (!name) throw new Error(`${context} requires a non-empty accessible surface name`);
  return name;
}

export function questFullscreenSurfaceName({
  view,
  hatched = false,
  activeStopName = ""
} = {}) {
  switch (view) {
    case "creator":
      return hatched ? "Change your book character" : "Choose your book character";
    case "den":
      return "Your Den";
    case "map":
      return "Trail map";
    case "world":
      return activeStopName ? `${activeStopName} trail` : "Sound Seekers trail";
    case "ceremony":
      return activeStopName ? `${activeStopName} reward` : "Sound Seekers reward";
    case "post":
      return "Trading Post";
    default:
      throw new Error(`Unknown fullscreen quest view: ${String(view || "(missing)")}`);
  }
}

export function gameFullscreenSurfaceName(game) {
  return requireSurfaceName(game?.title, "Fullscreen game");
}

export function closeFullscreenSurfaceName(surfaceName) {
  return `Close ${requireSurfaceName(surfaceName, "Fullscreen close control")}`;
}

export function resumeFullscreenSurfaceName(surfaceName) {
  return `Resume ${requireSurfaceName(surfaceName, "Fullscreen resume prompt")}`;
}

export function quitFullscreenSurfaceName(surfaceName) {
  return `Quit ${requireSurfaceName(surfaceName, "Fullscreen quit prompt")}`;
}
