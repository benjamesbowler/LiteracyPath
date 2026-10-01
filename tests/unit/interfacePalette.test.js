import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  collectProductionSources, parseColour, isGreenInterfaceColour,
  inventoryCss, resolveColourVariables, productionCssInventory,
  productionInlineInventory, inlineFingerprint
} from '../../tools/interfacePalettePolicy.mjs';
import { SOUND_SEEKERS_ROUNDED_PALETTE } from '../../src/features/soundSeekers/visual/visualTokens.js';

test('palette audit reaches literal lazy games, Vite aliases and standalone public UI', () => {
  const sources = collectProductionSources();
  for (const file of [
    'src/components/learn/games/games/SoundRacerGame.jsx',
    'src/components/learn/games/games/WordClimbGame.css',
    'demos/sound-seekers/src/chapter/chapter.css',
    'src/features/soundSeekers/rounded/campaign-activity.css',
    'public/legal.css', 'public/present/deck.js'
  ]) assert.ok(sources.includes(file), file);
});

test('green detection includes named lime/olive, pale sage and modern percentage RGB', () => {
  for (const value of ['lime', 'olivedrab', 'olive', 'LightGreen', 'mintcream', '#789573', '#eef8f6', '0x75a94d', 'rgb(20% 60% 30% / 50%)', 'hsl(90deg 30% 80% / .2)']) {
    assert.ok(isGreenInterfaceColour(value), value);
  }
  for (const value of ['#3454C8', '#18263E', '#DFE3EB', '#F2B33D', '#FFFFFF', 'rgb(92 103 122 / 50%)']) assert.equal(isGreenInterfaceColour(value), false, value);
  assert.deepEqual(parseColour('rgb(20% 60% 30% / 50%)').map(Math.round), [51, 153, 77]);
  assert.deepEqual(parseColour('0x75a94d'), [117, 169, 77]);
});

test('natural plant exceptions cannot exempt an adjacent status or button', () => {
  const source = '.adv-flower-stem {background:green}.adv-flower-stem button {color:lime}.adv-flower-stem .panel {background:chartreuse}.status {background:olive}';
  const rows = inventoryCss('src/styles/student-vibrant.css', source);
  assert.ok(rows[0].exception);
  assert.equal(rows[1].exception, null);
  assert.equal(rows[2].exception, null);
  assert.equal(rows[3].exception, null);
});

test('token references and color-mix expose indirect green UI without recursive loops', () => {
  const variables = new Map([['--accent', ['var(--plant)']], ['--plant', ['rgb(40% 70% 30%)']], ['--cycle', ['var(--cycle)']]]);
  const rows = inventoryCss('example.css', '.button{background:color-mix(in oklch,var(--accent),white 15%)}', variables);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].exception, null);
  assert.deepEqual(resolveColourVariables('var(--cycle)', variables), ['var(--cycle)', 'var(--cycle)']);
});

test('Lantern natural ground boundaries cannot exempt progress, panels or adjacent controls', () => {
  const source = '.lantern-island-ground{background:green;border-bottom:1px solid green;color:green}'
    + '.lantern-island-ground button{background:green}'
    + '.lantern-left-bank, .lantern-right-bank{background:green;border-bottom:1px solid green}'
    + '.lantern-left-bank{background:green}'
    + '.lantern-pause-state, .lantern-completion{background:green}'
    + '.lantern-stepping-route i{background:green}';
  const rows = inventoryCss('src/components/learn/games/games/LanternLagoonGame.css', source);
  assert.equal(rows.filter(row => row.exception).length, 4);
  assert.deepEqual(rows.filter(row => !row.exception).map(row => [row.selector, row.property]), [
    ['.lantern-island-ground', 'color'],
    ['.lantern-island-ground button', 'background'],
    ['.lantern-left-bank', 'background'],
    ['.lantern-pause-state, .lantern-completion', 'background'],
    ['.lantern-stepping-route i', 'background']
  ]);
});

test('every active stylesheet and resolved token consumer satisfies the blue UI boundary', () => {
  const inventory = productionCssInventory();
  assert.ok(inventory.cssFiles.length >= 80);
  assert.deepEqual(inventory.violations, []);
  assert.ok(inventory.rows.some(row => row.file.endsWith('campaign-activity.css') && row.exception === 'authored miniature route ground/path'));
});

test('reviewed inline materials and print exceptions are exact source lines, with no unreviewed green UI', () => {
  const inventory = productionInlineInventory();
  assert.ok(inventory.rows.length > 200);
  assert.deepEqual(inventory.violations, []);
  const exceptions = JSON.parse(fs.readFileSync('tools/interfacePaletteExceptions.json', 'utf8'));
  const current = new Set(inventory.rows.map(row => `${row.file}:${row.fingerprint}`));
  for (const entry of exceptions) assert.ok(current.has(`${entry.file}:${entry.fingerprint}`), `Remove stale exception: ${entry.file}`);
  assert.notEqual(inlineFingerprint('ctx.fillStyle = "#5a9d47";'), inlineFingerprint('button.style.color = "#5a9d47";'));
});

test('Rounded UI roles are blue while canonical world materials remain authored green', () => {
  for (const [name, colour] of Object.entries(SOUND_SEEKERS_ROUNDED_PALETTE).filter(([name]) => name.startsWith('ui-'))) assert.equal(isGreenInterfaceColour(colour), false, name);
  assert.equal(SOUND_SEEKERS_ROUNDED_PALETTE['749d70'], '#749d70');
  const source = fs.readFileSync('src/styles/learn-games.css', 'utf8');
  assert.match(source, /\.adv-plant-stem[^}]*var\(--lg-illustration-leaf\)/);
  assert.match(source, /--lg-illustration-leaf: #2F9E62/);
  assert.match(source, /--lg-accent-green: #3454C8/);
});
