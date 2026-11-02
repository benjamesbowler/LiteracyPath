import assert from 'node:assert/strict';
import test from 'node:test';
import {COMPANION_ARTWORK,HOLLOW_ITEM_ARTWORK} from '../../src/data/companionArtwork.generated.js';
import {companionFigurePlan,companionFullArtworkPath,companionPortraitPath} from '../../src/data/companionArtwork.js';
import {GEAR,HOLLOW_ITEMS,EXPANSIONS,EGGS,BEASTIES,GROWTH_STAGES} from '../../src/utils/hollowEconomy.js';
import {COMPANIONS} from '../../src/utils/studentProfile.js';

test('all six Guide selections consume explicit canonical and composition paths',()=>{
 const canonical=new Set(),layers=new Set();
 for(const guide of COMPANIONS){const a=COMPANION_ARTWORK[guide.id];assert.ok(a);assert.equal(guide.image,companionPortraitPath(guide.id));canonical.add(a.portrait);canonical.add(a.base);assert.deepEqual(Object.keys(a.gear),GEAR.map(g=>g.id));assert.deepEqual(Object.keys(a.layers),GEAR.map(g=>g.id));for(const src of Object.values(a.bodyAlpha))layers.add(src);layers.add(a.frontPack);for(const g of GEAR){canonical.add(a.gear[g.id]);layers.add(a.layers[g.id]);assert.ok(companionFullArtworkPath(guide.id,g.id).startsWith(a.gear[g.id]));}}
 assert.ok(GEAR.every(g=>HOLLOW_ITEM_ARTWORK[g.id]===`/images/hollow/${g.id}.webp`));
 const itemIds=[...GEAR,...HOLLOW_ITEMS,...EXPANSIONS,...EGGS].map(i=>i.id).concat(BEASTIES.flatMap(i=>GROWTH_STAGES.map(s=>`${i.id}-s${s.stage}`)));
 assert.deepEqual(Object.keys(HOLLOW_ITEM_ARTWORK),itemIds);assert.equal(new Set(Object.values(HOLLOW_ITEM_ARTWORK)).size,65);
 assert.equal(canonical.size,96);assert.equal(layers.size,114);
 assert.equal(COMPANIONS.find(c=>c.id==='socks').series,'Little Literacy Guides');
 assert.equal(companionFullArtworkPath('future-guide','future-gear'),'/images/companions/full/future-guide--future-gear.webp');
});

test('five slots use one genuinely posed body and real alpha pieces without losing held gear or boots',()=>{
 const gear=['gear-wizard-hat','gear-moth-wings','gear-starweave-scarf','gear-willow-wand','gear-trail-boots'].map(id=>GEAR.find(g=>g.id===id));
 for(const id of Object.keys(COMPANION_ARTWORK)){const p=companionFigurePlan(id,gear);assert.ok(p.primary.startsWith(`/images/companions/bodies/${id}--gear-willow-wand.webp`));assert.equal(p.primaryFull,companionFullArtworkPath(id,'gear-willow-wand'));assert.deepEqual(p.feetRegion,COMPANION_ARTWORK[id].feetRegion);assert.ok(p.feetRegion.clipTop>p.feetRegion.cropTop);assert.deepEqual(p.layers.map(g=>g.slot).sort(),['back','feet','head','held','neck']);assert.ok(p.layers.every(g=>g.src.includes('/images/companions/layers/')));const single=companionFigurePlan(id,[gear[0]]);assert.equal(single.primary,companionFullArtworkPath(id,'gear-wizard-hat'));assert.deepEqual(single.layers,[]);const feet=companionFigurePlan(id,gear.filter(g=>g.slot!=='held'));assert.ok(feet.primary.startsWith(`/images/companions/bodies/${id}--gear-trail-boots.webp`));assert.equal(feet.feetRegion,null);assert.equal(feet.layers.length,3);}
});
