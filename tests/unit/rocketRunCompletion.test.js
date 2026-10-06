import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@babel/parser';
import { transformSync } from 'rolldown/experimental';
import { rocketRunV2Outing } from '../../src/utils/rocketRunV2Rounds.js';
import { newRocketRunEvidence, rocketRunCatchResponse, completeRocketRunRound, rocketRunLanguageResult,
  ROCKET_RUN_CONTENT_VERSION, ROCKET_RUN_CONSTRUCT } from '../../src/utils/rocketRunEvidence.js';

const source = readFileSync(new URL('../../src/components/learn/games/games/rocketRunPresentation.jsx', import.meta.url), 'utf8');
const engineSource = readFileSync(new URL('../../src/components/learn/games/games/rocketRunEngine.js', import.meta.url), 'utf8');
const { code, errors } = transformSync('rocketRunPresentation.jsx', source,
  { jsx: { runtime: 'classic', pragma: 'element' } });
assert.deepEqual(errors, []);
const presentationCode = code.replace(/^import[\s\S]*?from\s+["'][^"']+["'];\s*/gm, '')
  .replace(/^import\s+["'][^"']+["'];\s*/gm, '')
  .replace(/export default function/g, 'function').replace(/export function/g, 'function');
const element = (type, props, ...children) => ({ type, props: { ...props, children } });
function componentHost(states = [], refs = [], effects = []) {
  let stateIndex = 0, refIndex = 0;
  return new Function('element', 'useEffect', 'useRef', 'useState',
    `${presentationCode}; return { RocketFlightCompletion, RocketRunPresentation };`)(element,
    effect => effects.push(effect), value => refs[refIndex++] ?? { current: value },
    value => [states[stateIndex++] ?? value, () => {}]);
}
function all(tree, predicate) {
  const nodes = [];
  const visit = node => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (predicate(node)) nodes.push(node);
    visit(node.props?.children);
  };
  visit(tree); return nodes;
}
const text = node => Array.isArray(node) ? node.map(text).join('')
  : node && typeof node === 'object' ? text(node.props?.children) : node == null || typeof node === 'boolean' ? '' : String(node);
const engineAst = parse(engineSource, { sourceType: 'module' });
const owner = engineAst.program.body.find(node => node.type === 'ExportNamedDeclaration'
  && node.declaration?.id?.name === 'createRocketRunEngine').declaration;
const actualFunction = name => {
  const node = owner.body.body.find(row => row.type === 'FunctionDeclaration' && row.id.name === name);
  return engineSource.slice(node.start, node.end);
};

test('the real final engine branch emits once, cancels pending speech, and exposes the true language result', () => {
  const plans = rocketRunV2Outing('hard', 0xffffffff), plan = plans[9];
  let evidence = newRocketRunEvidence(), caughtIds = [], at = 1;
  // Real writer rows model supported unit practice. They are source evidence,
  // not a claim that native teaching audio was delivered in this test.
  const respond = trial => {
    const response = rocketRunCatchResponse(evidence, plan, { trialId: trial.id, caughtIds,
      presentedChoices: plan.choices, at: at++, source: 'keyboard', difficulty: 'hard' });
    evidence = response.evidence; caughtIds = response.caughtIds;
  };
  respond(plan.choices.find(row => !row.correct));
  plan.choices.filter(row => row.correct).forEach(respond);
  evidence = completeRocketRunRound(evidence, plan, caughtIds, at++);
  const state = { round: 9, originRound: 9, evidence, carriers: [], flight: { lane: 1, hearts: 1 },
    caughtIds, intent: { trialId: 'old-intent' }, completed: true, paused: false };
  const events = [], completions = [];
  const imports = { state, plans, seed: 0xffffffff, journeyIndex: 3, rocketRunLanguageResult,
    ROCKET_RUN_CONTENT_VERSION, ROCKET_RUN_CONSTRUCT, clone: structuredClone,
    persist: () => events.push('persist'), releaseInputs: () => { state.intent = null; events.push('release'); },
    teaching: { cancel: reason => events.push(`teaching:${reason}`) },
    approach: { cancel: reason => events.push(`approach:${reason}`) },
    options: { onComplete: (...args) => { completions.push(args); return false; } } };
  const advance = new Function(...Object.keys(imports),
    `let completeSent = false; ${actualFunction('advance')}; return advance;`)(...Object.values(imports));
  advance(); advance();
  assert.equal(completions.length, 1, 'a save refusal must not cause a duplicate language submission');
  const result = rocketRunLanguageResult(evidence), [stars, score, words, payload] = completions[0];
  assert.deepEqual([stars, score, words], [result.stars, result.literacyScore, result.correct]);
  assert.equal(payload.originRound, 9); assert.equal(payload.totalRequired, plan.needed);
  assert.deepEqual(payload.firstResponses, evidence.firstResponses);
  assert.deepEqual(payload.assistedRetries, evidence.assistedRetries);
  assert.deepEqual(events, ['persist', 'teaching:outing-complete', 'approach:outing-complete', 'release']);
  assert.equal(state.intent, null);

  let hud;
  const notifyImports = { state, plans, getPlan: () => plan, rocketRunLanguageResult,
    nearestRocketCourier: () => null, world: { inspect: () => ({ faces: [], playable: true }) },
    options: { onHud: value => { hud = value; } }, boostHeld: () => false };
  new Function(...Object.keys(notifyImports),
    `const completeSent=true, coach='', saveError=false, contextRecovery=false; ${actualFunction('notify')}; notify();`)(...Object.values(notifyImports));
  assert.deepEqual(hud.result, { stars, score, words });
  assert.equal(hud.complete, true);
});

test('actual completed presentation retires motor controls and respects the parent completion owner', () => {
  const hud = { complete: true, result: { stars: 2, score: 750, words: 50 }, choices: [] };
  for (const parentOwns of [false, true]) {
    const { RocketRunPresentation } = componentHost([hud, null, { status: 'ready' }]);
    const tree = RocketRunPresentation({ completionPresentedByPlayer: parentOwns });
    assert.equal(all(tree, row => row.props?.className === 'rocket-flight-actions').length, 0);
    assert.equal(all(tree, row => row.props?.className === 'rocket-word-controls').length, 0);
    assert.equal(all(tree, row => row.type?.name === 'RocketFlightCompletion').length, parentOwns ? 0 : 1);
  }
});

test('finished-flight actions invoke the actual parent transaction, preserve refused transitions and trap focus', t => {
  const effects = [], refs = [{ current: null }], calls = [];
  const { RocketFlightCompletion } = componentHost([], refs, effects);
  const result = { stars: 2, score: 750, words: 50 }, before = structuredClone(result);
  const callbacks = { onRequestNextLevel: () => { calls.push('next'); return false; },
    onRequestReplay: () => calls.push('replay'), onExit: () => calls.push('exit') };
  const tree = RocketFlightCompletion({ result, journey: { index: 2 }, ...callbacks });
  const panel = all(tree, row => row.props?.role === 'alertdialog')[0];
  const buttons = all(tree, row => row.type === 'button');
  assert.deepEqual(buttons.map(text), ['Next trail', 'Play this again', 'Back to Arcade']);
  assert.equal(buttons.filter(row => row.props['data-child-primary']).length, 1);
  buttons.forEach(button => button.props.onClick());
  assert.deepEqual(calls, ['next', 'replay', 'exit']); assert.deepEqual(result, before);
  assert.equal(all(tree, row => row.props?.['aria-label'] === '2 of 3 stars').length, 1);
  assert.match(text(tree), /50 words caught750 points/);
  const previousDocument = globalThis.document;
  t.after(() => { globalThis.document = previousDocument; });
  const nativeButtons = buttons.map((_, index) => ({ focus() { globalThis.document.activeElement = this; calls.push(`focus${index}`); } }));
  refs[0].current = { querySelector: () => nativeButtons[0] };
  globalThis.document = { activeElement: null }; effects.forEach(effect => effect());
  assert.equal(globalThis.document.activeElement, nativeButtons[0]);
  const currentTarget = { querySelectorAll: () => nativeButtons, contains: value => nativeButtons.includes(value) };
  let prevented = 0;
  panel.props.onKeyDown({ key: 'Tab', shiftKey: true, currentTarget, preventDefault: () => prevented++ });
  assert.equal(globalThis.document.activeElement, nativeButtons[2]);
  panel.props.onKeyDown({ key: 'Tab', shiftKey: false, currentTarget, preventDefault: () => prevented++ });
  assert.equal(globalThis.document.activeElement, nativeButtons[0]); assert.equal(prevented, 2);
});
