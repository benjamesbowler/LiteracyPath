/** Bound idle time while allowing a slow connection that is still delivering bytes. */
export async function readMockAssetBlob(response,{maxBytes,signal,onProgress}={}) {
  if(!response.body?.getReader)return response.blob();
  const reader=response.body.getReader(),chunks=[];let bytes=0;
  const abort=()=>{void reader.cancel().catch(()=>{});};
  signal?.addEventListener('abort',abort,{once:true});
  try {
    while(true){
      if(signal?.aborted)throw new Error('Assessment preparation cancelled');
      const {done,value}=await reader.read();if(done)break;
      bytes+=value.byteLength;
      if(bytes>maxBytes)throw new Error('Assessment asset exceeds device cache limits');
      chunks.push(value);onProgress?.();
    }
    if(signal?.aborted)throw new Error('Assessment preparation cancelled');
    return new Blob(chunks,{type:response.headers.get('content-type')||''});
  } catch(error){await reader.cancel().catch(()=>{});throw error;}
  finally{signal?.removeEventListener('abort',abort);reader.releaseLock();}
}
