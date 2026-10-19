import { readMockAssetBlob } from './mockAssetDownload.js';

const CACHE_NAME = 'lp-mock-public-media-v1';
export const MOCK_OFFLINE_MEDIA_MAX_ASSETS = 768;

export function mockOfflineMediaPaths(items, extras = []) {
  return [...new Set([...items.flatMap(item => [...item.requiredAudioPaths,...item.requiredImagePaths]),...extras]
    .map(path => path.split('#')[0]))];
}

/** Cache original public assets, with no learner identity or credentials. */
export async function prepareMockOfflineMedia(paths, { cacheStorage = globalThis.caches, fetcher = globalThis.fetch,
  signal, timeoutMs = 15000, onProgress,
  createObjectURL = blob => URL.createObjectURL(blob), revokeObjectURL = url => URL.revokeObjectURL(url) } = {}) {
  if (!cacheStorage || !paths.length || paths.some(path => !/^\/(?:audio|images|media\/(?:vocabulary|initial-sounds|final-sounds|rhyming)\/images)\/[A-Za-z0-9_./%-]+$/.test(path)
    || path.includes('..')) || paths.length > MOCK_OFFLINE_MEDIA_MAX_ASSETS) throw new Error('Device media cache unavailable');
  const cache = await cacheStorage.open(CACHE_NAME), urls = new Map(), blobs = new Map();
  let index = 0, failed = false, bytes = 0;
  async function retain(path) {
    const controller = new AbortController(); let timer, abort, renew;
    try {
      return await Promise.race([(async () => {
        let response = await cache.match(path);
        const cached = response?.ok;
        if (!cached) {
          response = await fetcher(path,{credentials:'omit',signal:controller.signal});
          if (!response.ok || response.redirected) throw new Error('Required media unavailable');
        }
        const type = response.headers.get('content-type') || '';
        if (!/^(audio|image)\//.test(type)) throw new Error('Required media has the wrong type');
        const blob = cached ? await response.blob() : await readMockAssetBlob(response,{maxBytes:4*1024*1024,signal:controller.signal,onProgress:()=>renew?.()});
        if (!blob.size || blob.size > 4*1024*1024) throw new Error('Required media exceeds device cache limits');
        if (controller.signal.aborted) throw new Error('Device media preparation cancelled');
        if (!cached) {
          await cache.put(path,new Response(blob,{headers:{'content-type':type}}));
          const retained = await cache.match(path);
          if (!retained?.ok || (await retained.blob()).size !== blob.size) throw new Error('Required media could not be retained');
        }
        return blob;
      })(),new Promise((_,reject) => {
        abort=()=>{controller.abort();reject(new Error('Device media preparation cancelled'));};
        signal?.addEventListener('abort',abort,{once:true});
        renew=()=>{clearTimeout(timer);timer=setTimeout(()=>{controller.abort();reject(new Error('Required media download timed out'));},timeoutMs);};
        renew();
        if(signal?.aborted)abort();
      })]);
    } finally { clearTimeout(timer);signal?.removeEventListener('abort',abort); }
  }
  try {
    const workers = await Promise.allSettled(Array.from({length:4},async () => {
      while (!failed && index < paths.length) {
        if (signal?.aborted) throw new Error('Device media preparation cancelled');
        const path = paths[index++];
        const blob = await retain(path);
        bytes += blob.size;
        if (bytes > 48*1024*1024) throw new Error('Required media exceeds device cache limits');
        blobs.set(path,blob);
        onProgress?.({completed:blobs.size,total:paths.length,bytes});
      }
    }).map(promise => promise.catch(error => { failed = true; throw error; })));
    const rejected = workers.find(result => result.status === 'rejected');
    if (rejected) throw rejected.reason;
    if (signal?.aborted) throw new Error('Device media preparation cancelled');
    return { bytes, assets:blobs.size, resolve:path => {
      const key=path.split('#')[0];
      if (!urls.has(key) && blobs.has(key)) {
        try {
          const objectUrl=createObjectURL(blobs.get(key));
          urls.set(key,{objectUrl,source:`${objectUrl}#${encodeURIComponent(key)}`});
        } catch { return path; } // Playback/image receipts still gate the exact source.
      }
      return urls.get(key)?.source || path;
    },dispose:() => { for(const row of urls.values()) revokeObjectURL(row.objectUrl); urls.clear();blobs.clear(); } };
  } catch(error) {
    failed = true;
    for(const row of urls.values()) revokeObjectURL(row.objectUrl);
    throw error;
  }
}
