import test from 'node:test';
import assert from 'node:assert/strict';
import { bindBurrowTap } from '../../src/components/learn/games/games/burrowPointerInput.js';

function setup() {
  const originalWindow = globalThis.window, originalDocument = globalThis.document;
  globalThis.window = new EventTarget(); globalThis.document = new EventTarget();
  const canvas = new EventTarget(), calls = [];
  canvas.getBoundingClientRect = () => ({ left: 10, top: 20, right: 210, bottom: 220 });
  canvas.setPointerCapture = () => {};
  let enabled = true;
  const dispose = bindBurrowTap(canvas, event => calls.push([event.clientX, event.clientY]), () => enabled);
  const send = (type, values = {}) => { const event = new Event(type); Object.assign(event, { button: 0, pointerId: 1, isPrimary: true, clientX: 40, clientY: 60 }, values); canvas.dispatchEvent(event); };
  return { calls, send, disable: () => { enabled = false; }, dispose, cleanup: () => { dispose(); globalThis.window = originalWindow; globalThis.document = originalDocument; } };
}

test('construction requires a primary tap that began on the same canvas', () => {
  const s = setup(); try {
    s.send('pointerup'); assert.equal(s.calls.length, 0);
    s.send('pointerdown'); s.send('pointerup'); assert.deepEqual(s.calls, [[40, 60]]);
    s.send('pointerdown', { button: 2 }); s.send('pointerup');
    s.send('pointerdown', { isPrimary: false }); s.send('pointerup');
    assert.equal(s.calls.length, 1);
  } finally { s.cleanup(); }
});

test('dragging, leaving the canvas and cancellation cannot construct', () => {
  const s = setup(); try {
    for (const type of ['pointercancel', 'lostpointercapture', 'burrow-tap-cancel']) { s.send('pointerdown'); s.send(type); s.send('pointerup'); }
    s.send('pointerdown'); s.send('pointermove', { clientX: 80 }); s.send('pointerup');
    s.send('pointerdown', { clientX: 12 }); s.send('pointerup', { clientX: 9 });
    s.send('pointerdown'); s.send('pointerup', { pointerId: 2 });
    assert.equal(s.calls.length, 0);
  } finally { s.cleanup(); }
});

test('pause, blur and hidden tabs invalidate in-flight construction taps', () => {
  const s = setup(); try {
    s.send('pointerdown'); window.dispatchEvent(new Event('blur')); s.send('pointerup');
    s.send('pointerdown'); document.hidden = true; document.dispatchEvent(new Event('visibilitychange')); s.send('pointerup');
    s.send('pointerdown'); s.disable(); s.send('pointerup');
    assert.equal(s.calls.length, 0);
  } finally { s.cleanup(); }
});

test('disposing renderer removes construction listeners', () => {
  const s = setup(); try { s.dispose(); s.send('pointerdown'); s.send('pointerup'); assert.equal(s.calls.length, 0); } finally { s.cleanup(); }
});
