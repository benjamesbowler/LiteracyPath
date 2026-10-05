import test from 'node:test';
import assert from 'node:assert/strict';
import { climbViewportMetrics, climbActorDepth, climbGripVineMode } from '../../src/components/learn/games/games/wordClimbView.js';

test('floating cue framing preserves the real word station, hero head and foot plane at supported full-screen sizes', () => {
  for (const [width, height, cueBottom, controlSize] of [[320,568,148,56],[568,320,66,56],[768,1024,172,72],[1024,768,84,72],[1366,768,84,72],[320,340,128,56]]) {
    const metrics=climbViewportMetrics(width,height), camera=-115+metrics.cameraOffset;
    const shelf=(1-(210-camera)/metrics.viewHeight)*height;
    const feet=(1-(-camera)/metrics.viewHeight)*height;
    assert.ok(shelf>=cueBottom+8, `${width}x${height} choice is below its cue`);
    assert.ok(shelf+56<=height-controlSize-8, 'native word target remains within the usable world');
    assert.ok(feet-metrics.heroPixels>shelf+metrics.shelfPixels, 'actual shelf front clears the hero head');
    assert.ok(feet<=height-controlSize-8, 'sole stays above the motor controls');
  }
});

test('registered climber clears shelf faces throughout ascent without moving its physics x or y', () => {
  for(const width of [280,500,1200]) {
    const front=width*.16-55;
    for(const surface of [-30,0,front-10,front+25]) {
      const depth=climbActorDepth(surface,front,true);
      assert.ok(depth>=front+36, 'branch face must not occlude the climbing body');
      assert.ok(depth>=surface+6, 'body remains in front of its bark attachment');
    }
    assert.equal(climbActorDepth(100,front,false),front+20, 'landing depth retains its original shelf contact');
  }
  for(const state of ['climbing','gripping'])assert.equal(climbGripVineMode(state),'ascent');
  for(const state of ['clinging','recovering'])assert.equal(climbGripVineMode(state),'safety');
  for(const state of ['grounded','airborne','landed'])assert.equal(climbGripVineMode(state),null,'no detached vine while jumping or resting');
});
