import { createSentenceGroveCanvasWorld } from './starGalleryCanvasWorld.js';

// The normal Three world and its controller are still created. This private
// recovery surface changes only drawing when a GPU renderer cannot be made;
// native movement, cut reach, geometry, clocks and immutable rows are shared.
export function createSentenceGroveCanvasSurface(THREE, { canvas = document.createElement('canvas'),
  atlases, camera, getState, getTheme, getTime, getPromptBottom }) {
  const world = createSentenceGroveCanvasWorld(THREE, { canvas, atlases, getState, getTheme, getPromptBottom });
  let disposed = false, width = 1, height = 1;
  const resize = (nextWidth, nextHeight) => {
    if (nextWidth === width && nextHeight === height) return;
    width = nextWidth; height = nextHeight; world.resize(width, height);
  };
  const dispose = () => { if (!disposed) { disposed = true; world.dispose(); } };
  const renderer = {
    domElement: canvas, isSentenceGroveCanvas: true,
    setPixelRatio() { /* This bounded recovery surface uses one physical pixel per CSS pixel. */ },
    setSize: resize, dispose
  };
  const pipeline = {
    effectiveTier: 'low',
    render() { if (!disposed) world.render(camera(), getTime()); return 'low'; },
    resize, setTier() {}, prepareObject() {}, registerShadowLight() {}, unregisterShadowLight() {},
    configureShadowLight(light) { light.castShadow = false; }, restoreContext() {}, destroy: dispose
  };
  return { renderer, pipeline, inspect: () => world.inspect() };
}
