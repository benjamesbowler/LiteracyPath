import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { campaignRouteBreadcrumbs, campaignDiscoveryTargets, campaignUnobscuredDiscoveries } from '../../src/features/soundSeekers/rounded/campaignNavigation.js';
import { CAMPAIGN_WORLD_LAYOUTS, campaignCanWalk, campaignRoute } from '../../src/features/soundSeekers/rounded/campaignWorldLayouts.js';
import { campaignCollisionLayout } from '../../src/features/soundSeekers/rounded/campaignWorld.js';
import { campaignQuestionImage } from '../../src/features/soundSeekers/rounded/campaignQuestionArt.js';

test('route cues follow each collision-safe corner instead of cutting across scenery', () => {
  assert.deepEqual(campaignRouteBreadcrumbs({x:0,z:0}, [{x:3,z:0},{x:3,z:3}], 2), [{x:2,z:0},{x:3,z:1},{x:3,z:3}]);
  assert.deepEqual(campaignRouteBreadcrumbs({x:0,z:0}, []), []);
  assert.equal(campaignRouteBreadcrumbs({x:0,z:0}, [{x:0,z:0},{x:200,z:0}]).length, 32);
  for (const world of Object.values(CAMPAIGN_WORLD_LAYOUTS)) {
    const layout = campaignCollisionLayout(world, [], false);
    for (const target of [...world.missions, ...campaignDiscoveryTargets(world).map(item => item.point)]) {
      const route = campaignRoute(layout, world.spawn, target);
      assert.ok(route.length, `${world.stageId} reachable target`);
      for (const point of campaignRouteBreadcrumbs(world.spawn, route)) assert.ok(campaignCanWalk(layout, point.x, point.z), `${world.stageId} cue remains on its route`);
    }
  }
});

test('discovery navigation reuses exact owned object art and exposes only motor destinations', () => {
  for (const world of Object.values(CAMPAIGN_WORLD_LAYOUTS)) {
    const targets = campaignDiscoveryTargets(world);
    for (const target of targets) assert.ok(fs.existsSync(`public${campaignQuestionImage({kind:target.objectKind})}`), `${world.stageId} ${target.objectKind}`);
    assert.equal(targets.find(item => item.id === 'carry').action, 'pickup');
    const delivery = campaignDiscoveryTargets(world, {carrying:'carry'}).find(item => item.id === 'carry');
    assert.equal(delivery.action, 'place');
    assert.deepEqual(delivery.point, world.discoveries.find(item => item.id === 'carry').destination);
    assert.deepEqual(campaignDiscoveryTargets(world, {discoveredIds:['carry','operate']}).map(item => item.id), ['operate']);
    assert.ok(targets.every(item => !('answer' in item) && !('missionId' in item)));
  }
});

test('optional map cues yield to real HUD bounds, mission portraits and one another', () => {
  const cue = (id,x,y) => ({id,x,y,visible:true});
  const result = campaignUnobscuredDiscoveries([cue('edge',10,200),cue('header',200,80),cue('hud',200,200),cue('mission',450,200),cue('clear',650,300),cue('crowded',700,300),{...cue('hidden',600,500),visible:false}], [cue('pal',460,200)], {width:800,height:700}, [{left:100,right:300,top:100,bottom:300}]);
  assert.deepEqual(result.map(item => item.id), ['clear']);
  assert.equal(result[0].x,650);
});
