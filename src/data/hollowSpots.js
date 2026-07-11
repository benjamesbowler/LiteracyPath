// Single source of truth for where the trophy/decoration spots sit on each
// Hollow room's painted shelves and niches. Same pattern as mapStops.js:
// defaults below, overridable live by an admin in the in-app "Hollow Spots"
// editor, stored in Supabase app_config and cached in localStorage.
//
// Note: every expansion room has its OWN art, so every expansion gets its OWN
// spots. The old code shared a single 4-spot set across all four expansion
// rooms, which is a big part of why the markers never lined up.
import { supabase } from "../supabaseClient.js";
import { DEN_THEMES } from "../utils/denRewards.js";
import { EXPANSIONS } from "../utils/hollowEconomy.js";

// The rooms an admin can place spots on. `count` is how many spots that room
// has; it must match the number of slots the room offers.
export const HOLLOW_ROOMS = [
  ...DEN_THEMES.map(theme => ({
    id: theme.id,
    name: `The Hollow — ${theme.name}`,
    image: `/images/hollow/scene-${theme.id}.webp`,
    count: 6
  })),
  ...EXPANSIONS.map(exp => ({
    id: exp.id,
    name: exp.name,
    image: `/images/hollow/band-${exp.id.slice(4)}.webp`,
    count: exp.slots || 4
  }))
];

// [x, y] as percentages of the room image.
export const DEFAULT_HOLLOW_SPOTS = {
  meadow: [[31, 63], [40, 34], [48, 63], [57, 34], [66, 63], [74, 34]],
  dino: [[20, 57], [31, 57], [43, 57], [54, 57], [65, 57], [76, 57]],
  moonwood: [[17, 67], [28, 67], [40, 67], [51, 67], [63, 67], [74, 67]],
  "exp-garden": [[26, 64], [43, 44], [60, 64], [76, 44]],
  "exp-pond": [[26, 64], [43, 44], [60, 64], [76, 44]],
  "exp-cave": [[26, 64], [43, 44], [60, 64], [76, 44]],
  "exp-treetop": [[26, 64], [43, 44], [60, 64], [76, 44]]
};

const CACHE_KEY = "lp-hollow-spots-v1";
const CONFIG_KEY = "hollow_spots";

function isBrowser() { return typeof window !== "undefined"; }

function sanitize(spots) {
  const out = {};
  for (const room of HOLLOW_ROOMS) {
    const arr = spots?.[room.id];
    const ok = Array.isArray(arr) && arr.length === room.count && arr.every(p =>
      Array.isArray(p) && p.length === 2 &&
      p.every(n => typeof n === "number" && isFinite(n) && n >= 0 && n <= 100));
    if (ok) out[room.id] = arr.map(([x, y]) => [x, y]);
  }
  return out;
}

export function getCachedHollowOverride() {
  if (!isBrowser()) return {};
  try { return sanitize(JSON.parse(window.localStorage.getItem(CACHE_KEY) || "null")); }
  catch { return {}; }
}

function writeCache(value) {
  if (!isBrowser()) return;
  try { window.localStorage.setItem(CACHE_KEY, JSON.stringify(value)); } catch { /* best effort */ }
}

// The spots to use for a room: admin override if present, else the defaults.
export function hollowSpotsFor(roomId, override) {
  const ov = override?.[roomId];
  if (Array.isArray(ov) && ov.length) return ov;
  return DEFAULT_HOLLOW_SPOTS[roomId] || DEFAULT_HOLLOW_SPOTS.meadow;
}

// Fetch the saved override from Supabase (cached). Always resolves; never throws.
export async function loadHollowSpotsOverride() {
  try {
    const { data, error } = await supabase.from("app_config").select("value").eq("key", CONFIG_KEY).maybeSingle();
    if (error || !data?.value) return getCachedHollowOverride();
    const clean = sanitize(data.value);
    writeCache(clean);
    return clean;
  } catch {
    return getCachedHollowOverride();
  }
}

// Admin save. Throws on failure (e.g. not authorised) so the editor can report it.
export async function saveHollowSpots(spots) {
  const clean = sanitize(spots);
  const { error } = await supabase.rpc("set_app_config", { p_key: CONFIG_KEY, p_value: clean });
  if (error) throw error;
  writeCache(clean);
  return clean;
}
