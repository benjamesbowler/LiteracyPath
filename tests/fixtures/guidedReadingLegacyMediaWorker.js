// Frozen media handler from tools/viteQuestOfflinePlugin.mjs at b9b85150d.
// These five replacement books were absent from its repaired-image registry.
// Retain the actual old ignoreSearch behavior to test an already-active worker.
const QUEST_MEDIA_CACHE = "lp-quest-media-v1";
function isCacheable(response) {
  return Boolean(response && response.status === 200 && (response.type === "basic" || response.type === "default"));
}
async function questMediaResponse(request) {
  const cache = await caches.open(QUEST_MEDIA_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (request.headers.has("range")) return cached || fetch(request);
  const update = fetch(request).then(async response => {
    if (isCacheable(response)) await cache.put(request, response.clone());
    return response;
  });
  if (cached) {
    update.catch(() => {});
    return cached;
  }
  return update;
}
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method === "GET" && url.origin === self.location.origin && url.pathname.startsWith("/guided-reading/")) {
    event.respondWith(questMediaResponse(request));
  }
});
