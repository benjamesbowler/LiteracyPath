import test from 'node:test';
import assert from 'node:assert/strict';
import { rhymeLauncherGeometry, firstRhymeImpact, stepRhymeProjectile, stepRhymeBalloon } from '../../src/utils/rhymePopMotion.js';
import { rhymePopStageLayout } from '../../src/components/learn/games/games/rhymePopWorld.js';

test('physical rotated barrel mouth and projectile vector agree at all supported aspect families', () => {
  for (const [width, height] of [[1366, 768], [320, 568], [568, 260], [320, 340]]) for (const x of [24, width / 2, width - 24]) {
    const geometry = rhymeLauncherGeometry(width, height, { x, y: 90 });
    assert.ok(Math.abs(Math.hypot(geometry.muzzle.x - geometry.pivot.x, geometry.muzzle.y - geometry.pivot.y) - geometry.barrelLength) < 1e-10);
    assert.ok(geometry.direction.y < 0);
    const ray = { x: geometry.target.x - geometry.pivot.x, y: geometry.target.y - geometry.pivot.y };
    assert.ok(Math.abs(ray.x * geometry.direction.y - ray.y * geometry.direction.x) < 1e-9);
    assert.ok(geometry.muzzle.x >= 0 && geometry.muzzle.x <= width && geometry.muzzle.y >= 0 && geometry.muzzle.y <= height);
  }
});

test('bank shots sweep the incident segment before reflecting the true remaining travel', () => {
  const shot = { x: 90, y: 60, vx: 100, vy: -20, r: 2 };
  const bank = stepRhymeProjectile(shot, .1, 100, []);
  assert.equal(bank.banks, 1); assert.equal(bank.vx, -100);
  assert.ok(Math.abs(bank.x-84) < 1e-9); assert.equal(bank.y, 58);
  const obstacle = { id: 'incident-wrong', x: 91.5, y: 59.7, r: .1 };
  const after = { id: 'reflected-correct', x: 86, y: 58.4, r: .1 };
  const physical = stepRhymeProjectile(shot, .1, 100, [after, obstacle]);
  assert.equal(physical.impact.balloon.id, obstacle.id); assert.equal(physical.banks, 0);
});

test('first actual projectile collision wins independently of answer, aim and balloon array order', () => {
  const near = { id: 'near-wrong', x: 40, y: 20, r: 10 }, far = { id: 'far-correct', x: 80, y: 20, r: 10 };
  for (const balls of [[near, far], [far, near]]) {
    const impact = firstRhymeImpact({ x: 0, y: 20 }, { x: 100, y: 20 }, balls, 4);
    assert.equal(impact.balloon.id, near.id); assert.ok(impact.u < .4);
  }
  assert.equal(firstRhymeImpact({ x: 0, y: 60 }, { x: 100, y: 60 }, [near, far], 4), null);
  assert.equal(firstRhymeImpact({ x: 40, y: 20 }, { x: 40, y: 20 }, [near], 4).u, 0);
});

test('wind and a fresh local entry keep neighboring printed choices in their separate physical lanes', () => {
  for (const [width, height] of [[568, 260], [320, 340], [320, 568], [1366, 768]]) {
    const layout = rhymePopStageLayout(width, height, 7);
    for (const act of [0, 1, 2]) for (let time = 0; time < 30; time += .19) {
      const rows = layout.slots.map((_, slot) => ({ id: slot+1, slot, phase: slot*1.8, travel: 0, direction: slot%2 ? -1 : 1, entering: slot === 2 }));
      const positions = rows.map(row => stepRhymeBalloon(row, layout, { act, dropRate: .12 }, time, 0));
      for (let index = 1; index < rows.length; index++) for (let before = 0; before < index; before++)
        assert.ok(Math.hypot(positions[index].x-positions[before].x, positions[index].y-positions[before].y) >= layout.radius*2+8-1e-9,
          `Word faces overlapped at ${width}x${height}, wind${act}, time${time}`);
      if (!layout.circulation) assert.ok(Math.abs(positions[2].x-layout.slots[2].x) < Math.min(48, width*.035)+6.01);
      assert.deepEqual(rows.map(row => [row.id, row.slot]), layout.slots.map((_, slot) => [slot+1, slot]));
    }
    const entrant = { slot: 2, phase: 1.8, travel: 0, direction: 1, entering: true };
    const settled = stepRhymeBalloon(entrant, layout, { act: 0, dropRate: .12 }, 1, .3);
    assert.equal(settled.entering, false); assert.equal(settled.travel, 18);
  }
});

test('every retained portrait choice becomes reachable by the real first moving swept impact', () => {
  for (const [width, height] of [[320, 340], [320, 568], [375, 667]]) for (const act of [0, 1, 2]) {
    const layout = rhymePopStageLayout(width, height, 7), level = { act, dropRate: .12 };
    const identities = layout.slots.map((_, slot) => ({ id: slot+1, slot, phase: slot*1.8, travel: 0, direction: 1, entering: false }));
    const reached = new Set();
    // The firing point, .085s pressure delay, moving targets, projectile size
    // and bank/sweep authority match actual play. No target gets immunity.
    for (let elapsed = 0; elapsed < 28 && reached.size < identities.length; elapsed += .25) {
      const current = identities.map(row => ({ ...row, ...stepRhymeBalloon(row, layout, level, elapsed, 0) }));
      for (const intended of current) {
        if (reached.has(intended.id)) continue;
        const geometry = rhymeLauncherGeometry(width, height, intended);
        let shot = { x: geometry.muzzle.x, y: geometry.muzzle.y, vx: geometry.direction.x*560, vy: geometry.direction.y*560, r: 18 };
        for (let frame = 0; frame < 180; frame++) {
          const time = elapsed+.085+(frame+1)/120;
          const moving = identities.map(row => ({ ...row, ...stepRhymeBalloon(row, layout, level, time, 0) }));
          const path = stepRhymeProjectile(shot, 1/120, width, moving);
          if (path.impact) {
            if (path.impact.balloon.id === intended.id) reached.add(intended.id);
            break;
          }
          shot = { ...shot, ...path };
          if (shot.y < -80) break;
        }
      }
    }
    assert.deepEqual([...reached].sort(), identities.map(row => row.id), `${width}x${height} retained choices were shielded`);
    assert.deepEqual(identities.map(row => row.slot), [0, 1, 2, 3, 4, 5, 6]);
  }
});
