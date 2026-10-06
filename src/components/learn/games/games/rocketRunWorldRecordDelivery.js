/** A failed ES-module fetch is cached by the browser. A child-requested Reload
 * therefore uses the independently shipped, byte-identical selected record.
 * Healthy play never fetches this recovery packet or an unselected world. */
export function createRocketWorldRecordDelivery(importers, packets, fetchPacket = (...args) => fetch(...args)) {
  const failedImports = new Set();
  const cancelled = signal => {
    if (signal?.aborted) throw new DOMException('Flight loading was cancelled', 'AbortError');
  };
  return async function load(world, { signal } = {}) {
    if (!Object.hasOwn(importers, world) || !Object.hasOwn(packets, world)) throw new Error('Unknown Rocket world');
    cancelled(signal);
    if (!failedImports.has(world)) {
      let module;
      try { module = await importers[world](); }
      catch (error) {
        cancelled(signal);
        failedImports.add(world);
        throw error;
      }
      cancelled(signal);
      return { [world]: module.ROCKET_RUN_CRAFT_WORLD };
    }
    const packet = packets[world];
    const response = await fetchPacket(packet.runtime, { signal, cache: 'reload' });
    if (!response.ok) throw new Error('The selected flight recovery packet could not load');
    const text = await response.text();
    cancelled(signal);
    if (new TextEncoder().encode(text).byteLength !== packet.bytes) throw new Error('The selected flight recovery packet is incomplete');
    return { [world]: JSON.parse(text) };
  };
}
