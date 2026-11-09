import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { REPAIRED_IMAGE_REVISIONS } from '../../src/data/generated/repairedImageRevisions.generated.js';
import { GUIDED_READING_IMAGE_REVISIONS } from '../../src/data/generated/guidedReadingImageRevisions.generated.js';
import { withRepairedImageVersion } from '../../src/utils/repairedImageVersion.js';
import { serviceWorkerSource } from '../../tools/viteQuestOfflinePlugin.mjs';
import { preloadPhysicalPalArt } from '../../src/components/learn/games/shared/physicalPalArt.js';
import { PHYSICAL_PAL_ART } from '../../src/components/learn/games/shared/physicalPalArtData.js';
import { createRegisteredPalArtBank } from '../../src/components/learn/games/shared/registeredPalArt.js';

const imagePath = '/media/initial-sounds/images/t/table.webp';
const revision = REPAIRED_IMAGE_REVISIONS[imagePath];

test('repaired delivery versions bind to current public image bytes', () => {
  assert.ok(Object.keys(REPAIRED_IMAGE_REVISIONS).length);
  for (const [pathname, expected] of Object.entries(REPAIRED_IMAGE_REVISIONS)) {
    const bytes = readFileSync(new URL('../../public' + pathname, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex').slice(0, 12), expected, pathname);
    if (GUIDED_READING_IMAGE_REVISIONS[pathname]) {
      assert.equal(expected, GUIDED_READING_IMAGE_REVISIONS[pathname], `${pathname}: offline and reader revisions agree`);
    }
  }
});

test('delivery refresh preserves the canonical input, other query fields and atlas fragments', () => {
  const src = imagePath + '?mode=picture&v=old#cell=3';
  assert.equal(withRepairedImageVersion(src), imagePath + '?mode=picture&v=' + revision + '#cell=3');
  assert.equal(src, imagePath + '?mode=picture&v=old#cell=3');
  for (const untouched of ['', '/images/unknown.webp?x=1#cell=2', 'blob:retained', 'data:image/png;base64,a', '//elsewhere.test/a.webp', 'https://elsewhere.test' + imagePath]) {
    assert.equal(withRepairedImageVersion(untouched), untouched);
  }
});

test('both shared actor loaders refresh atlas transport while retaining canonical registry identities', async () => {
  const priorImage = globalThis.Image;
  const requested = [];
  globalThis.Image = class {
    naturalWidth = 16;
    naturalHeight = 12;
    set src(value) { requested.push(value); queueMicrotask(() => this.onload?.()); }
    async decode() {}
  };
  const atlas = { runtime: imagePath, width: 16, height: 12, frames: [{}] };
  const bank = createRegisteredPalArtBank({ registered: atlas });
  const pal = PHYSICAL_PAL_ART.bouncy;
  const paths = [pal.runtime, pal.actionAtlases.tools.runtime, pal.actionAtlases.tennis.runtime, imagePath];
  try {
    const image = await preloadPhysicalPalArt('meadow', { actions: ['tools', 'tennis'] });
    assert.ok(image);
    assert.ok((await bank.preload())[0]);
    assert.equal(bank.delivery().registered, 'delivered');
    assert.deepEqual(requested.sort(), paths.map(pathname => {
      assert.ok(REPAIRED_IMAGE_REVISIONS[pathname], pathname + ' needs reviewed-byte identity');
      return withRepairedImageVersion(pathname);
    }).sort());
    assert.equal(atlas.runtime, imagePath);
    assert.ok(paths.slice(0, 3).every(pathname => !pathname.includes('?')));
  } finally {
    bank.dispose();
    if (priorImage === undefined) delete globalThis.Image;
    else globalThis.Image = priorImage;
  }
});

for (const repairPath of [imagePath, ...Object.keys(REPAIRED_IMAGE_REVISIONS).filter(path => GUIDED_READING_IMAGE_REVISIONS[path])]) {
test(`service worker bypasses old canonical and old revision bytes, then restores only the new revision offline: ${repairPath}`, async () => {
  const imagePath = repairPath;
  const revision = REPAIRED_IMAGE_REVISIONS[imagePath];
  const origin = 'https://literacy.guide';
  const stored = new Map([
    [origin + imagePath, new Response('old painted image')],
    [origin + imagePath + '?v=old', new Response('old rejected image')]
  ]);
  const requests = [], listeners = new Map();
  let online = true;
  const key = value => typeof value === 'string' ? value : value.url;
  const cache = {
    async match(request) { return stored.get(key(request))?.clone(); },
    async put(request, response) { stored.set(key(request), response.clone()); }
  };
  runInNewContext(serviceWorkerSource({ buildId: 'repaired-art', precache: [] }), {
    Request, URL,
    caches: { async open() { return cache; } },
    self: { location: { origin }, addEventListener(type, listener) { listeners.set(type, listener); } },
    fetch: async request => {
      requests.push(request.url);
      if (!online) throw Error('offline');
      assert.equal(request.url, origin + imagePath + '?v=' + revision);
      return new Response('new clean cartoon image');
    }
  });
  const fetchThroughWorker = async pathname => {
    let response;
    listeners.get('fetch')({ request: new Request(origin + pathname), respondWith(value) { response = value; } });
    return (await response).text();
  };
  assert.equal(await fetchThroughWorker(imagePath), 'new clean cartoon image');
  assert.equal(requests.length, 1);
  online = false;
  assert.equal(await fetchThroughWorker(imagePath + '?v=old'), 'new clean cartoon image');
  assert.equal(requests.length, 1, 'reviewed revision is retained; old keys are never reused');
});
}
