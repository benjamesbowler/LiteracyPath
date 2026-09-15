import test from "node:test";
import assert from "node:assert/strict";
import { warmStudentAssets } from "../../src/utils/preloadAssets.js";

async function withHomeBrowser(run, { idle = true } = {}) {
  const originalWindow = globalThis.window;
  const originalImage = globalThis.Image;
  const images = [];
  let scheduled;
  let cancelled = null;
  const schedule = callback => { scheduled = callback; return 7; };
  const cancel = handle => { cancelled = handle; };
  globalThis.window = idle
    ? { requestIdleCallback: schedule, cancelIdleCallback: cancel }
    : { setTimeout: schedule, clearTimeout: cancel };
  globalThis.Image = class {
    constructor() { images.push(this); }
    set src(value) {
      this.path = value;
      if (value) queueMicrotask(() => this.onload?.());
    }
    decode() { return Promise.resolve(); }
  };
  try {
    await run({ images, runScheduled: () => scheduled(), cancelled: () => cancelled });
  } finally {
    globalThis.window = originalWindow;
    globalThis.Image = originalImage;
  }
}

test("Home warms only its displayed world backdrop, using the shared low-priority cache", () => withHomeBrowser(async ({ images, runScheduled }) => {
  const world = { id: "home-test", backdrop: "/home-warmup-backdrop.webp", banner: "/unused-panorama.webp", point: "/unused-point.webp" };
  warmStudentAssets(world);
  assert.equal(images.length, 0);
  runScheduled();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(images.map(image => image.path), [world.backdrop]);
  assert.equal(images[0].fetchPriority, "low");
  warmStudentAssets(world);
  runScheduled();
  assert.equal(images.length, 1, "Returning Home reuses the bounded activity image cache");
}));

for (const idle of [true, false]) {
  test(`leaving Home cancels ${idle ? "idle" : "timer"} warming before activity entry`, () => withHomeBrowser(async ({ images, runScheduled, cancelled }) => {
    const stop = warmStudentAssets({ backdrop: `/cancel-home-warmup-${idle}.webp` });
    stop();
    assert.equal(cancelled(), 7);
    runScheduled();
    assert.equal(images.length, 0, "A late scheduler callback must not compete with the activity");
  }, { idle }));
}
