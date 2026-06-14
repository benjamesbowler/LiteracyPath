// Single source of truth for the wide (horizontal) Skills Quest map stop
// positions. Defaults below were placed by Benjamin with the click-to-place
// tool. An admin can override them live in the in-app Map Stops editor; those
// overrides are stored in Supabase app_config and cached in localStorage.
import { supabase } from "../supabaseClient.js";

export const MAP_WIDE_VIEW = { w: 2752, h: 1536 };

export const WIDE_WORLDS = [
  { id: "meadow", name: "Meadow Farm", image: "/images/pals/maps/meadow-map-wide.webp" },
  { id: "dino", name: "Dinosaur Valley", image: "/images/pals/maps/dino-map-wide.webp" },
  { id: "moonwood", name: "Moonwood Forest", image: "/images/pals/maps/moonwood-map-wide.webp" }
];

// Named to match the actual painted spot each stop sits on (read off the maps),
// in stop order 1-9. Update these if the stop coordinates change.
export const WORLD_LANDMARKS_WIDE = {
  meadow: ["Farm Gate", "Carrot Patch", "Duck Pond", "Apple Orchard", "Wildflower Field", "Sheep Pen", "Strawberry Field", "Haystacks", "The Big Barn"],
  dino: ["Misty Cliffs", "Mud Pits", "Bubbling Pools", "Fossil Creek", "Fern Jungle", "Eggshell Nest", "Stomping Grounds", "Lava Flow", "The Volcano"],
  moonwood: ["Glow Mushrooms", "Toadstool Path", "Pond Trail", "Moonlit Pond", "Firefly Hollow", "Crystal Cave", "The Great Oak", "Forest Edge", "The Moon Tower"]
};

export const DEFAULT_WIDE_MAP_POINTS = {
  meadow: [[12.6, 85.8], [12.3, 63.3], [21.2, 48.2], [40.5, 43.6], [65.2, 67.2], [92.6, 88.9], [81.5, 60.6], [64.2, 43.6], [81.2, 37.6]],
  dino: [[5.4, 38], [14.6, 58.8], [10.6, 86.3], [38, 83.6], [45.7, 38.5], [61.5, 56], [76.8, 87.8], [93.3, 56.8], [88.2, 23]],
  moonwood: [[7.4, 58], [12.3, 86], [34.1, 89.1], [46.4, 65.3], [57.5, 88.7], [70.9, 62.8], [81.2, 86], [97, 80.7], [92.1, 56.2]]
};

const CACHE_KEY = "lp-map-stops-wide-v1";
const CONFIG_KEY = "map_stops_wide";

function isBrowser() { return typeof window !== "undefined"; }

function sanitize(points) {
  const out = {};
  for (const world of WIDE_WORLDS) {
    const arr = points?.[world.id];
    const ok = Array.isArray(arr) && arr.length > 0 && arr.every(p =>
      Array.isArray(p) && p.length === 2 && p.every(n => typeof n === "number" && isFinite(n) && n >= 0 && n <= 100));
    if (ok) out[world.id] = arr.map(([x, y]) => [x, y]);
  }
  return out;
}

export function getCachedWideOverride() {
  if (!isBrowser()) return {};
  try { return sanitize(JSON.parse(window.localStorage.getItem(CACHE_KEY) || "null")); }
  catch { return {}; }
}

function writeCache(value) {
  if (!isBrowser()) return;
  try { window.localStorage.setItem(CACHE_KEY, JSON.stringify(value)); } catch { /* best effort */ }
}

// The points to use for a world: admin override if present, else the defaults.
export function wideMapPointsFor(worldId, override) {
  const ov = override?.[worldId];
  return (Array.isArray(ov) && ov.length) ? ov : (DEFAULT_WIDE_MAP_POINTS[worldId] || DEFAULT_WIDE_MAP_POINTS.meadow);
}

// Fetch the saved override from Supabase (cached). Always resolves; never throws.
export async function loadWideMapOverride() {
  try {
    const { data, error } = await supabase.from("app_config").select("value").eq("key", CONFIG_KEY).maybeSingle();
    if (error || !data?.value) return getCachedWideOverride();
    const clean = sanitize(data.value);
    writeCache(clean);
    return clean;
  } catch {
    return getCachedWideOverride();
  }
}

// Admin save. Throws on failure (e.g. not authorised) so the editor can report it.
export async function saveWideMapPoints(points) {
  const clean = sanitize(points);
  const { error } = await supabase.rpc("set_app_config", { p_key: CONFIG_KEY, p_value: clean });
  if (error) throw error;
  writeCache(clean);
  return clean;
}
