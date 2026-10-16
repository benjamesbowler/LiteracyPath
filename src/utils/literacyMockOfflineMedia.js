const CACHE_NAME = 'lp-mock-public-media-v1';
export const MOCK_OFFLINE_MEDIA_MAX_ASSETS = 768;

export function mockOfflineMediaPaths(items, extras = []) {
  return [...new Set([...items.flatMap(item => [...item.requiredAudioPaths,...item.requiredImagePaths]),...extras]
    .map(path => path.split('#')[0]))];
}

/** Cache original public assets, with no learner identity or credentials. */
export async function prepareMockOfflineMedia(paths, { cacheStorage = globalThis.caches, fetcher = globalThis.fetch,
  signal, createObjectURL = blob => URL.createObjectURL(blob), revokeObjectURL = url => URL.revokeObjectURL(url) } = {}) {
  if (!cacheStorage || !paths.length || paths.some(path => !/^\/(?:audio|images|media\/(?:vocabulary|initial-sounds|final-sounds|rhyming)\/images)\/[A-Za-z0-9_./%-]+$/.test(path)
    || path.includes('..')) || paths.length > MOCK_OFFLINE_MEDIA_MAX_ASSETS) throw new Error('Device media cache unavailable');
  const cache = await cacheStorage.open(CACHE_NAME), urls = new Map();
  let index = 0, failed = false, bytes = 0;
  try {
    const workers = await Promise.allSettled(Array.from({length:4},async () => {
      while (!failed && index < paths.length) {
        if (signal?.aborted) throw new Error('Device media preparation cancelled');
        const path = paths[index++];
        let response = await cache.match(path);
        if (!response?.ok) {
          response = await fetcher(path,{credentials:'omit',signal});
          if (!response.ok || response.redirected) throw new Error('Required media unavailable');
        }
        const type = response.headers.get('content-type') || '';
        if (!/^(audio|image)\//.test(type)) throw new Error('Required media has the wrong type');
        const blob = await response.blob();
        bytes += blob.size;
        if (!blob.size || blob.size > 4*1024*1024 || bytes > 48*1024*1024) throw new Error('Required media exceeds device cache limits');
        // Write/read back the cache entry before it can authorize offline play.
        await cache.put(path,new Response(blob,{headers:{'content-type':type}}));
        const retained = await cache.match(path);
        if (!retained?.ok || (await retained.blob()).size !== blob.size) throw new Error('Required media could not be retained');
        const objectUrl = createObjectURL(blob);
        urls.set(path,{objectUrl,source:`${objectUrl}#${encodeURIComponent(path)}`});
      }
    }).map(promise => promise.catch(error => { failed = true; throw error; })));
    const rejected = workers.find(result => result.status === 'rejected');
    if (rejected) throw rejected.reason;
    if (signal?.aborted) throw new Error('Device media preparation cancelled');
    return { bytes, assets:urls.size, resolve:path => urls.get(path.split('#')[0])?.source || path,
      dispose:() => { for(const row of urls.values()) revokeObjectURL(row.objectUrl); urls.clear(); } };
  } catch(error) {
    failed = true;
    for(const row of urls.values()) revokeObjectURL(row.objectUrl);
    throw error;
  }
}
