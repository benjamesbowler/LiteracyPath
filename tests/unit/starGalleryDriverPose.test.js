import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { groveDriverAction, groveDriverCanvasPose, groveDriverWorldPose, groveVisibleControlContacts } from '../../src/components/learn/games/games/starGalleryDriverPose.js';
const manifest = JSON.parse(await fs.readFile('source-art/arcade/physical-worlds/star-gallery/manifest.json', 'utf8'));
const atlases = Object.fromEntries(manifest.assets.filter(asset => asset.frames).map(asset => [asset.id, {
  width: asset.sourceSize[0], height: asset.sourceSize[1], pixelsPerUnit: asset.pixelsPerUnit, nominalHeight: asset.nominalHeight, frames: asset.frames
}]));

test('Grove steering, real cutter anticipation/contact and hazard recovery choose all three original rear action families', () => {
  assert.equal(groveDriverAction({}), 'ready');
  assert.equal(groveDriverAction({ steer: -.5 }), 'steer-left');
  assert.equal(groveDriverAction({ steer: .5 }), 'steer-right');
  assert.equal(groveDriverAction({ cutterRemaining: .3 }), 'lever-anticipation');
  assert.equal(groveDriverAction({ cutterRemaining: .1 }), 'lever-contact');
  assert.equal(groveDriverAction({ recoveryRemaining: .4, cutterRemaining: .3 }), 'recover');
});

test('All eighteen Grove poses keep their actual seat anchor and visible wheel/lever palms in either renderer without guessed feet', () => {
  for (const world of ['meadow', 'dino', 'moonwood']) for (const action of ['ready', 'steer-left', 'steer-right', 'lever-anticipation', 'lever-contact', 'recover']) {
    const canvas = groveDriverCanvasPose(atlases, world, action, { x: 200, y: 300, height: world === 'moonwood' ? 77.5 : 110 });
    const worldPose = groveDriverWorldPose(atlases, world, action, { seat: { x: 4, y: 1.5, z: .35 } });
    const turned = groveDriverWorldPose(atlases, world, action, { seat: { x: 4, y: 1.5, z: .35 }, right: { x: 0, y: 0, z: -1 } });
    assert.deepEqual(canvas.pose.sockets.seat, { x: 200, y: 300 });
    assert.deepEqual(worldPose.sockets.seat, { x: 4, y: 1.5, z: .35 });
    assert.equal(canvas.pose.sockets.feet, undefined); assert.equal(worldPose.sockets.feet, undefined);
    const contacts = groveVisibleControlContacts(canvas.pose, action);
    assert.deepEqual(contacts.wheelContacts[0], canvas.pose.sockets.leftHand);
    if (action.startsWith('lever-')) {
      assert.deepEqual(contacts.leverGrip, canvas.pose.sockets.rightHand); assert.equal(contacts.wheelContacts.length, 1);
    } else {
      assert.equal(contacts.leverGrip, null); assert.deepEqual(contacts.wheelContacts[1], canvas.pose.sockets.rightHand);
    }
    for (const hand of ['leftHand', 'rightHand']) {
      assert.ok(Math.abs((canvas.pose.sockets[hand].x - 200) / 50 - (worldPose.sockets[hand].x - 4)) < 1e-8);
      assert.ok(Math.abs((300 - canvas.pose.sockets[hand].y) / 50 - (worldPose.sockets[hand].y - 1.5)) < 1e-8);
      assert.ok(Math.abs((turned.sockets[hand].z - .35) + (worldPose.sockets[hand].x - 4)) < 1e-8);
      assert.equal(turned.sockets[hand].x, 4);
    }
  }
});
