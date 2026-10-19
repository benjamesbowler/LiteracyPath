import { readMockAssetBlob } from './mockAssetDownload.js';

const CACHE_NAME = 'lp-mock-public-media-v1';
export const MOCK_OFFLINE_MEDIA_MAX_ASSETS = 768;

export function mockOfflineMediaPaths(items, extras = []) {
  return [...new Set([...items.flatMap(item => [...item.requiredAudioPaths,...item.requiredImagePaths]),...extras]
    .map(path => path.split('#')[0]))];
}

/** Retain exact authorized assets on demand; queued alternatives never delay the current question. */
export async function createMockOfflineMedia(paths, { cacheStorage = globalThis.caches, fetcher = globalThis.fetch,
  signal, timeoutMs = 15000, onProgress,
  createObjectURL = blob => URL.createObjectURL(blob), revokeObjectURL = url => URL.revokeObjectURL(url) } = {}) {
  if (!cacheStorage || !paths.length || paths.some(path => !/^\/(?:audio|images|media\/(?:vocabulary|initial-sounds|final-sounds|rhyming)\/images)\/[A-Za-z0-9_./%-]+$/.test(path)
    || path.includes('..')) || paths.length > MOCK_OFFLINE_MEDIA_MAX_ASSETS) throw new Error('Device media cache unavailable');
  const cache = await cacheStorage.open(CACHE_NAME), urls = new Map(), blobs = new Map();
  const allowed = new Set(paths), jobs = new Map(), active = new Set();
  let disposed = false, bytes = 0, backgroundActive = 0;
  async function retain(path, controller) {
    let timer, abort, renew;
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
        if (disposed || controller.signal.aborted) throw new Error('Device media preparation cancelled');
        if (!cached) {
          // WebKit can miss a same-key record after reload but still keep its
          // storage entry. An overwrite then silently fails. Remove that stale
          // record only after the exact replacement bytes have arrived.
          await cache.delete?.(path);
          await cache.put(path,new Response(blob,{headers:{'content-type':type}}));
          const retained = await cache.match(path);
          const retainedSize=retained?.ok ? (await retained.blob()).size : -1;
          if (retainedSize !== blob.size) throw new Error('Required media could not be retained');
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
  function drain() {
    if (disposed) return;
    while (active.size < 4) {
      const job = [...jobs.values()].filter(row => !row.started && (row.priority > 1 || backgroundActive < 2))
        .sort((a, b) => b.priority - a.priority)[0];
      if (!job) break;
      job.started = true; job.background = job.priority <= 1;
      active.add(job); if (job.background) backgroundActive++;
      void retain(job.path, job.controller).then(blob => {
        if (disposed || job.controller.signal.aborted) throw new Error('Device media preparation cancelled');
        if (bytes + blob.size > 48*1024*1024) throw new Error('Required media exceeds device cache limits');
        bytes += blob.size; blobs.set(job.path, blob);
        onProgress?.({completed:blobs.size,total:allowed.size,bytes});
      }).then(() => finish(), error => finish(error));
      function finish(error) {
        jobs.delete(job.path); active.delete(job); if (job.background) backgroundActive--;
        if (error) {
          // An outage must not launch hundreds of doomed background requests.
          for (const queued of jobs.values()) if (!queued.started) {
            jobs.delete(queued.path); queued.reject(error);
          }
        }
        drain();
        if (error) job.reject(error); else job.resolve();
      }
    }
  }
  function dispose() {
    if (disposed) return;
    disposed = true; signal?.removeEventListener('abort', dispose);
    for (const job of jobs.values()) {
      job.controller.abort(); job.reject(new Error('Device media preparation cancelled'));
    }
    jobs.clear();
    for (const row of urls.values()) revokeObjectURL(row.objectUrl);
    urls.clear(); blobs.clear();
  }
  signal?.addEventListener('abort', dispose, {once:true});
  if (signal?.aborted) dispose();
  return {
    get bytes() { return bytes; }, get assets() { return blobs.size; },
    has: requested => !disposed && requested.every(path => blobs.has(path.split('#')[0])),
    async ensure(requested, {priority = 2} = {}) {
      if (disposed) throw new Error('Device media preparation cancelled');
      const keys = [...new Set(requested.map(path => path.split('#')[0]))];
      if (keys.some(path => !allowed.has(path))) throw new Error('Required media is outside the authorized reserve');
      const waiting = keys.map(path => {
        if (blobs.has(path)) return Promise.resolve();
        let job = jobs.get(path);
        if (job) job.priority = Math.max(job.priority, priority);
        else {
          job = {path, priority, controller:new AbortController(), started:false};
          job.promise = new Promise((resolve, reject) => { job.resolve = resolve; job.reject = reject; });
          jobs.set(path, job);
        }
        return job.promise;
      });
      drain(); await Promise.all(waiting);
    },
    resolve:path => {
      const key=path.split('#')[0];
      if (!urls.has(key) && blobs.has(key)) {
        try {
          const objectUrl=createObjectURL(blobs.get(key));
          urls.set(key,{objectUrl,source:`${objectUrl}#${encodeURIComponent(key)}`});
        } catch { return path; } // Playback/image receipts still gate the exact source.
      }
      return urls.get(key)?.source || path;
    }, dispose,
  };
}

/** Full-pack compatibility for callers that explicitly require complete offline readiness. */
export async function prepareMockOfflineMedia(paths, options = {}) {
  const media = await createMockOfflineMedia(paths, options);
  try { await media.ensure(paths); return media; }
  catch (error) { media.dispose(); throw error; }
}
