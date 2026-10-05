import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { SENTENCE_EXPRESS_STOCK_CONTACTS, sentenceExpressStockGeometry } from '../../src/components/learn/games/games/sentenceExpressRailGeometry.js';

test('Express retained wagon and caboose coupling/sole pixels remain actual opaque source contacts in every animated frame', async () => {
  const manifest = JSON.parse(await fs.readFile('public/game-assets/arcade-worlds/trains/manifest.json', 'utf8'));
  for (const [kind, contacts] of Object.entries(SENTENCE_EXPRESS_STOCK_CONTACTS)) {
    const asset = manifest.assets.find(row => row.id === kind), bytes = await fs.readFile(`public${asset.sprite.url}`);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256);
    const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, asset.sprite.width * asset.sprite.columns);
    assert.equal(info.height, asset.sprite.height * 2);
    for (let frame = 0; frame < asset.sprite.frames; frame++) for (const [name, [x, y]] of Object.entries(contacts)) {
      const px = x + frame % 4 * 512, py = y + Math.floor(frame / 4) * 320;
      assert.ok(data[(py * info.width + px) * 4 + 3] >= 160, `${kind}/${frame}/${name} is opaque retained geometry`);
    }
  }
});

test('Express live viewport coordinates rebase after resize and scrolling without confusing the full atlas img bounds with a single cell', () => {
  const stage = { left: 20, top: 40, width: 568, height: 320 };
  const before = sentenceExpressStockGeometry({ left: 200, top: 140, width: 114, height: 110 }, 'wagon', stage);
  assert.equal(before.rightCoupler.x, 180 + 485 / 512 * 114);
  assert.equal(before.sole.y, 100 + 310 / 320 * 110);
  const after = sentenceExpressStockGeometry({ left: 84, top: 150, width: 114, height: 68 }, 'wagon', stage);
  assert.equal(after.rightCoupler.x, before.rightCoupler.x - 116);
  assert.equal(after.rightCoupler.y, 110 + 231 / 320 * 68);
  assert.equal(sentenceExpressStockGeometry({ left: 0, top: 0, width: 0, height: 0 }, 'wagon', stage), null);
  assert.equal(sentenceExpressStockGeometry({ left: 0, top: 0, width: 100, height: 100 }, 'engine', stage), null,
    'an unmeasured locomotive nose does not invent a rear coupling attachment');
});
