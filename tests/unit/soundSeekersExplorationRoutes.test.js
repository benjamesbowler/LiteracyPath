import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN_STAGES } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { createExplorationLayout, createExplorer, advanceExplorer, setExplorerInput, findExplorationPath, explorationBlocked } from '../../src/features/soundSeekers/v3/engine/exploration.js';

test('painted exploration branches do not run through solid scenery or outside the world', () => {
  for (const stage of CAMPAIGN_STAGES) {
    const layout = createExplorationLayout(stage);
    for (const [from, to] of layout.paths) {
      const steps = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / 10));
      for (let index = 0; index <= steps; index++) {
        const x = from[0] + (to[0] - from[0]) * index / steps;
        const y = from[1] + (to[1] - from[1]) * index / steps;
        // A visible log deliberately requires a jump on the short path; the
        // lever deliberately controls the middle river crossing.
        assert.equal(explorationBlocked(layout, x, y, { shortcut: true, jumping: true }), false,
          `${stage.id}: painted route obstructed at ${x}, ${y}`);
      }
    }
  }
});

test('every optional log can be jumped directly or bypassed by walking in all 30 places', () => {
  for (const stage of CAMPAIGN_STAGES) {
    const layout = createExplorationLayout(stage);
    for (const log of layout.blockers.filter(blocker => blocker.jumpable)) {
      const start = { x: log.x + log.width / 2, y: log.y - 80 };
      const end = { x: start.x, y: log.y + log.height + 80 };
      const walker = createExplorer(layout, start);
      assert.equal(walker.x, start.x, `${stage.id}/${log.id}: clear approach`);
      assert.equal(walker.y, start.y, `${stage.id}/${log.id}: clear approach`);
      walker.path = findExplorationPath(layout, walker, end, walker);
      assert.ok(walker.path.length, `${stage.id}/${log.id}: walking bypass`);
      for (let frame = 0; frame < 5000 && walker.path.length; frame++) advanceExplorer(walker, layout, 1 / 120);
      assert.ok(Math.hypot(walker.x - end.x, walker.y - end.y) < 15,
        `${stage.id}/${log.id}: walk around without a jump or bridge unlock`);

      const jumper = createExplorer(layout, start);
      setExplorerInput(jumper, 'down', true);
      setExplorerInput(jumper, 'jump', true);
      for (let frame = 0; frame < 70; frame++) advanceExplorer(jumper, layout, 1 / 120);
      assert.ok(jumper.y > log.y + log.height + 23, `${stage.id}/${log.id}: landed beyond log`);
      assert.equal(explorationBlocked(layout, jumper.x, jumper.y), false,
        `${stage.id}/${log.id}: safe landing`);
    }
  }
});

test('the scenic landmark and both picnic approaches stay reachable without unlocking the shortcut', () => {
  for (const stage of CAMPAIGN_STAGES) {
    const layout = createExplorationLayout(stage);
    const stops = [layout.landmark, layout.secret,
      { x: layout.width - 350, y: layout.secret.y - 140 },
      { x: layout.width - 350, y: layout.secret.y + 140 }];
    for (const stop of stops) {
      const explorer = createExplorer(layout);
      explorer.path = findExplorationPath(layout, explorer, stop, explorer);
      assert.ok(explorer.path.length, `${stage.id}: scenic approach exists`);
      for (let frame = 0; frame < 5000 && explorer.path.length; frame++) advanceExplorer(explorer, layout, 1 / 120);
      assert.ok(Math.hypot(explorer.x - stop.x, explorer.y - stop.y) < 15,
        `${stage.id}: scenic approach can be walked`);
    }
  }
});
