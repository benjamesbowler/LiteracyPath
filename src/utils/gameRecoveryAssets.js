// Generated from the canonical public GLBs by generateGameRecoveryAssets.mjs.
// URL references emit hashed binary files, never base64 JavaScript payloads.
export const GAME_RECOVERY_URLS = Object.freeze({
  kart: new URL("../assets/game-recovery/pip-kart.glb.gz", import.meta.url).href,
  skater: new URL("../assets/game-recovery/spell-skater.glb.gz", import.meta.url).href,
  climber: new URL("../assets/game-recovery/pip-climber.glb.gz", import.meta.url).href,
  kartBouncy: new URL("../assets/game-recovery/bouncy-kart-v2.glb.gz", import.meta.url).href,
  kartChompy: new URL("../assets/game-recovery/chompy-kart-v2.glb.gz", import.meta.url).href,
  kartPip: new URL("../assets/game-recovery/pip-kart-v2.glb.gz", import.meta.url).href,
  skaterBouncy: new URL("../assets/game-recovery/bouncy-skater-v2.glb.gz", import.meta.url).href,
  skaterChompy: new URL("../assets/game-recovery/chompy-skater-v2.glb.gz", import.meta.url).href,
  skaterPip: new URL("../assets/game-recovery/pip-skater-v2.glb.gz", import.meta.url).href
});

export function racerKartRecoveryUrl(world = "meadow") {
  return GAME_RECOVERY_URLS[world === "dino" ? "kartChompy" : world === "moonwood" ? "kartPip" : "kartBouncy"];
}

export function spellSkaterRecoveryUrl(world = "meadow") {
  const key = world === "dino" ? "skaterChompy" : world === "moonwood" ? "skaterPip" : "skaterBouncy";
  return GAME_RECOVERY_URLS[key] ?? null;
}

export async function loadGameRecoveryBytes(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Game recovery download failed: ${response.status}`);
  const bytes = await response.arrayBuffer();
  const header = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 4));
  // Static hosts may serve .gz with Content-Encoding: gzip, in which case
  // fetch has already decoded it. Other hosts return the gzip file itself.
  if (header[0] === 0x1f && header[1] === 0x8b) {
    return new Response(new Response(bytes).body.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
  }
  if (header[0] === 0x67 && header[1] === 0x6c && header[2] === 0x54 && header[3] === 0x46) return bytes;
  throw new Error("Game recovery response is not a GLB or gzip file");
}
