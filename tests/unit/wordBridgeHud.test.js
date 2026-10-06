import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';
import { wordBridgeContentLadder, WORD_BRIDGE_STUMP_PICTURE } from '../../src/components/learn/games/games/wordBridgeContent.js';
import { buildWordBridgeRounds } from '../../src/components/learn/games/games/wordBridgeLearning.js';

const source = fs.readFileSync('src/components/learn/games/games/WordBridgeGame.jsx', 'utf8');
const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
const engine = ast.program.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'startGame');
const node = engine.body.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'renderTargetHUD');
const production = source.slice(node.start, node.end);
function draw(level, round) {
  const picture = { style: {}, src: '' }, boxes = [], label = {};
  const context = vm.createContext({ currentLevel: level, learningRounds: [round], stageIdx: 0, W: 1280,
    levelMistakes: 0, slots: level.units.map(() => ({ filled: false })), elLab: label,
    hud: { querySelector: () => picture }, elTarget: { innerHTML: '', appendChild: box => boxes.push(box) },
    document: { createElement: () => ({ dataset: {}, style: {} }) }, phonicsTargetHint: () => '',
    targetItemsFor: current => current.units, clamp: (value, min, max) => Math.min(max, Math.max(min, value)) });
  vm.runInContext(production + ';renderTargetHUD()', context);
  return { picture, boxes, label };
}
test('actual HUD uses the literal scoped stump cue from its v3 round', () => {
  let selected;
  for (let seed = 0; seed < 128 && !selected; seed++) {
    const levels = wordBridgeContentLadder('hard', seed), rounds = buildWordBridgeRounds(levels, 'hard', seed, 0);
    const index = rounds.findIndex(round => round.target === 'stump');
    if (index >= 0) selected = { level: levels[index], round: rounds[index] };
  }
  assert(selected, 'Use an actual authored current course, not a fabricated target');
  const hud = draw(selected.level, selected.round);
  assert.equal(hud.picture.src, WORD_BRIDGE_STUMP_PICTURE);
  assert.equal(hud.picture.style.display, 'block');
  assert.equal(hud.boxes.length, selected.round.units.length);
  assert(hud.boxes.every(box => box.textContent === '·'));
  hud.picture.onerror();
  assert.equal(hud.picture.style.display, 'none', 'Failed cue is not presented as delivered');
});
test('actual HUD exhausts only current-round fallback candidates', () => {
  const level = wordBridgeContentLadder('easy', 3)[0], round = buildWordBridgeRounds([level], 'easy', 3, 0)[0];
  const hud = draw(level, { ...round, pictures: ['/actual-primary.webp', '/actual-fallback.webp'] });
  assert.equal(hud.picture.src, '/actual-primary.webp');
  hud.picture.onerror(); assert.equal(hud.picture.src, '/actual-fallback.webp');
  hud.picture.onerror(); assert.equal(hud.picture.style.display, 'none');
});
test('sentence model keeps its printed repair goal and does not invent a noun picture', () => {
  const levels = wordBridgeContentLadder('hard', 3), rounds = buildWordBridgeRounds(levels, 'hard', 3, 0);
  const index = rounds.findIndex(round => round.isSentence), hud = draw(levels[index], rounds[index]);
  assert.equal(hud.picture.style.display, 'none');
  assert.equal(hud.label.textContent, 'Build the sentence');
  assert.equal(hud.boxes.length, rounds[index].units.length);
});
