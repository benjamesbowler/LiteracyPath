import { readMockAssetBlob } from './mockAssetDownload.js';

/** Keep the exact build executable in each live shell without repeated writes. */
export async function retainMockExecutableAssets(assets, stores, { fetcher=globalThis.fetch, signal, timeoutMs=15000, onProgress }={}) {
  let index=0,completed=0,bytes=0,failed=false;
  async function retain(path) {
    const controller=new AbortController();let timer,abort,renew;
    try {
      return await Promise.race([(async()=>{
        const existing=await stores[0].match(path);
        const response=existing?.ok?existing:await fetcher(path,{credentials:'omit',signal:controller.signal});
        if(!response.ok || response.redirected)throw new Error('Assessment code unavailable');
        const blob=existing?.ok?await response.blob():await readMockAssetBlob(response,{maxBytes:16*1024*1024,signal:controller.signal,onProgress:()=>renew?.()});
        if(!blob.size || blob.size>16*1024*1024)throw new Error('Assessment executable pack exceeds limits');
        for(const cache of stores) {
          if(controller.signal.aborted)throw new Error('Assessment preparation cancelled');
          if((await cache.match(path))?.ok)continue;
          // Clear WebKit's stale same-key record after a miss, as for media.
          await cache.delete?.(path);
          await cache.put(path,new Response(blob,{headers:{'content-type':response.headers.get('content-type')||'application/octet-stream'}}));
          if((await(await cache.match(path))?.blob())?.size!==blob.size)throw new Error('Assessment code readback failed');
        }
        return blob.size;
      })(),new Promise((_,reject)=>{
        abort=()=>{controller.abort();reject(new Error('Assessment preparation cancelled'));};
        signal?.addEventListener('abort',abort,{once:true});
        renew=()=>{clearTimeout(timer);timer=setTimeout(()=>{controller.abort();reject(new Error('Assessment code download timed out'));},timeoutMs);};
        renew();
        if(signal?.aborted)abort();
      })]);
    } finally {clearTimeout(timer);signal?.removeEventListener('abort',abort);}
  }
  const workers=await Promise.allSettled(Array.from({length:4},async()=>{
    try {
      while(!failed && index<assets.length){
        if(signal?.aborted)throw new Error('Assessment preparation cancelled');
        bytes+=await retain(assets[index++]);
        if(bytes>64*1024*1024)throw new Error('Assessment executable pack exceeds limits');
        completed++;onProgress?.({completed,total:assets.length});
      }
    } catch(error){failed=true;throw error;}
  }));
  const rejected=workers.find(row=>row.status==='rejected');if(rejected)throw rejected.reason;
  return {failed:0,requested:assets.length,bytes};
}
