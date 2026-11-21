// Verified against Three 0.185.1: WebGLRenderer.compileAsync and
// renderers/webgl/WebGLProgram.isReady/getUniforms/getAttributes.
// Three's compileAsync polls properties.currentProgram without checking whether
// the owning scene was disposed. Mirror its readiness check with an owner guard
// so Exit/context loss can cancel without retaining or reviving a scene.
const nextTask = () => new Promise(resolve => setTimeout(resolve, 0));
export async function warmArcadeScene({ renderer, scene, camera, isCurrent = () => true, yieldTask = nextTask, now = () => performance.now(), budgetMs = 4, timeoutMs = 10000, renderFrame, extraTextures = [] }) {
  const started = now();
  const receipt = { status: 'pending', textures: 0, programs: 0, skippedTextures: 0, skippedTextureDetails: [], elapsedMs: 0 };
  const active = () => isCurrent() && !renderer.getContext?.()?.isContextLost?.();
  const finish = status => Object.assign(receipt, { status, elapsedMs: now() - started });
  if (!active()) return finish('cancelled');
  if (!renderer.compile || !renderer.initTexture) {
    await yieldTask();
    if (!active()) return finish('cancelled');
    try { renderFrame?.(); return finish('unsupported'); }
    catch (error) { receipt.error = String(error?.message || error); return finish('failed'); }
  }
  try {
    const textures = new Set(), sources = new Map();
    const collect = (value, source) => { if (value?.isTexture && !value.isRenderTargetTexture) { textures.add(value); if (!sources.has(value)) sources.set(value, source); } };
    scene.traverse?.(object => {
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!material) continue;
        for (const [key, value] of Object.entries(material)) collect(value, `${object.name || object.type || 'object'}/${material.name || material.type || 'material'}.${key}`);
        for (const [key, uniform] of Object.entries(material.uniforms || {})) collect(uniform?.value, `${object.name || 'object'}/uniform.${key}`);
      }
    });
    collect(scene.background, 'scene.background'); collect(scene.environment, 'scene.environment');
    for (const [index, texture] of Array.from(extraTextures).entries()) collect(texture, `extraTextures[${index}]`);
    let batchStart = now();
    for (const texture of textures) {
      if (!active()) return finish('cancelled');
      const source = texture.source?.data ?? texture.image;
      const images = Array.isArray(source) ? source : [source];
      if (!images.length || images.some(image => !image || image.complete === false)) {
        receipt.skippedTextures++;
        receipt.skippedTextureDetails.push({ name: texture.name || '', source: sources.get(texture), reason: source == null ? 'missing-image' : 'incomplete-image' });
        continue;
      }
      renderer.initTexture(texture); receipt.textures++;
      if (now() - batchStart >= budgetMs) { await yieldTask(); batchStart = now(); }
    }
    if (!active()) return finish('cancelled');
    const materials = renderer.compile(scene, camera) || new Set();
    const pending = new Set();
    for (const material of materials) {
      const program = renderer.properties?.get(material)?.currentProgram;
      if (program) pending.add(program);
    }
    receipt.programs = pending.size;
    // isReady uses KHR_parallel_shader_compile when supported; otherwise Three
    // reports ready and the staged first-use access performs its normal fallback.
    while (pending.size) {
      if (!active()) return finish('cancelled');
      if (now() - started > timeoutMs) return finish('timeout');
      for (const program of pending) {
        if (!active()) return finish('cancelled');
        if (program.program === undefined) return finish('cancelled');
        if (program.isReady && !program.isReady()) continue;
        program.getUniforms?.(); program.getAttributes?.();
        pending.delete(program);
        if (now() - batchStart >= budgetMs) { await yieldTask(); batchStart = now(); }
      }
      if (pending.size) await yieldTask();
    }
    // Owners must settle these sources or choose their established fallback.
    // Rendering an incomplete texture here would repeat Three's warning and
    // falsely report a fully prepared scene. Keep that boundary explicit.
    if (receipt.skippedTextures) return finish('partial');
    await yieldTask();
    if (!active()) return finish('cancelled');
    const warmFrameStart = now();
    renderFrame?.();
    receipt.warmFrameMs = now() - warmFrameStart;
    return finish('ready');
  } catch (error) {
    receipt.error = String(error?.message || error);
    return finish(active() ? 'failed' : 'cancelled');
  }
}
