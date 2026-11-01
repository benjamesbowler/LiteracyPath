// Bounded asset settlement for the existing original-art loaders. A timeout
// remains a failed readiness result so the owner can select its live fallback.
export async function waitPhysicalGameAssets(promises, isCurrent = () => true, timeoutMs = 10000) {
  let timer;
  try {
    const settled = await Promise.race([Promise.all(promises).then(() => true, () => false),
      new Promise(resolve => { timer=setTimeout(()=>resolve(false),timeoutMs); })]);
    return settled && isCurrent();
  } finally { clearTimeout(timer); }
}
export function physicalGameActionTextures(scene) {
  const textures=new Set();
  scene.traverse(object=>{for(const texture of object.userData?.authoredPal?.maps?.values?.()||[])textures.add(texture);});
  return textures;
}
