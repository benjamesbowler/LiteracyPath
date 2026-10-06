import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@babel/parser';
import { transformSync } from 'rolldown/experimental';

const source = readFileSync(new URL('../../src/components/learn/games/games/rocketRunPresentation.jsx', import.meta.url), 'utf8');
const transformed = transformSync('rocketRunPresentation.jsx', source, { jsx: { runtime: 'classic', pragma: 'element' } });
assert.deepEqual(transformed.errors, []);
const actualCode = transformed.code.replace(/^import[\s\S]*?from\s+["'][^"']+["'];\s*/gm, '')
  .replace(/^import\s+["'][^"']+["'];\s*/gm, '')
  .replace(/export default function/g, 'function').replace(/export function/g, 'function');
const element = (type, props, ...children) => ({ type, props: { ...props, children } });
const text = value => Array.isArray(value) ? value.map(text).join('')
  : value && typeof value === 'object' ? text(value.props?.children)
    : value == null || typeof value === 'boolean' ? '' : String(value);
function find(tree, predicate) {
  const result = [];
  const visit = node => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (predicate(node)) result.push(node);
    visit(node.props?.children);
  };
  visit(tree); return result;
}
function host(delivery, overrides = {}, actions = {}) {
  let retried = 0, focused = 0, stateIndex = 0, refIndex = 0;
  const hud = { target: 'sh', caught: 11, needed: 12, round: 9, totalRounds: 10, hearts: 2,
    coach: 'Read. Steer. Catch a word.', choices: [], ...overrides };
  const states = [hud, delivery, { status: 'ready' }];
  const refs = [{ current: { closest: () => ({ focus: () => { focused++; } }) } },
    { current: { retryArt: () => { retried++; }, ...actions } }];
  const Presentation = new Function('element', 'React', 'useEffect', 'useRef', 'useState',
    `${actualCode}; return RocketRunPresentation;`)(element, { Fragment: 'fragment' }, () => {},
    initial => refs[refIndex++] ?? { current: initial }, initial => [states[stateIndex++] ?? initial, () => {}]);
  return { tree: Presentation({}), inspect: () => ({ retried, focused }) };
}
const healthy = () => ({ model: { delivery: [] }, actions: { flight: 'delivered', emergency: 'not-requested' },
  sky: { primary: 'delivered', independent: 'not-requested' },
  route: { primary: 'delivered', embedded: 'not-requested', selected: 'primary' } });

test('the actual context Continue waits for a playable world, then clears the paused coach exactly once', () => {
  const engineSource = readFileSync(new URL('../../src/components/learn/games/games/rocketRunEngine.js', import.meta.url), 'utf8');
  const owner = parse(engineSource, { sourceType: 'module' }).program.body
    .find(node => node.declaration?.id?.name === 'createRocketRunEngine').declaration;
  const returned = owner.body.body.find(node => node.type === 'ReturnStatement').argument;
  const method = returned.properties.find(node => node.key?.name === 'resumeContext');
  let playable = false, resumes = 0;
  const actual = new Function('world', 'resume', `let contextRecovery=true,coach='Flight paused. Your caught words are kept.';
    const api={${engineSource.slice(method.start, method.end)}};
    return {resumeContext:api.resumeContext,inspect:()=>({contextRecovery,coach})};`)(
    { inspect: () => ({ playable }) }, () => { resumes++; });
  assert.equal(actual.resumeContext(), false);
  assert.deepEqual(actual.inspect(), { contextRecovery: true, coach: 'Flight paused. Your caught words are kept.' });
  assert.equal(resumes, 0);
  playable = true;
  assert.equal(actual.resumeContext(), true);
  assert.deepEqual(actual.inspect(), { contextRecovery: false, coach: 'Flight ready. Choose a word with Catch.' });
  assert.equal(actual.resumeContext(), false);
  assert.equal(resumes, 1);
});

test('actual route-only failure exposes the real retry handler despite healthy ship and sky', () => {
  const delivery = healthy();
  delivery.route = { primary: 'unavailable', embedded: 'unavailable', selected: null, textureOwners: 0 };
  const view = host(delivery);
  const retry = find(view.tree, node => node.type === 'button' && node.props['aria-label'] === 'Reload spaceship art');
  assert.equal(retry.length, 1, 'a failed route must leave a reachable recovery action');
  retry[0].props.onClick();
  assert.deepEqual(view.inspect(), { retried: 1, focused: 1 });
});

test('healthy or pending route delivery does not invent an art failure', () => {
  for (const route of [healthy().route, { primary: 'pending', embedded: 'not-requested', selected: null }]) {
    const delivery = healthy(); delivery.route = route;
    const view = host(delivery);
    assert.equal(find(view.tree, node => node.props?.['aria-label'] === 'Reload spaceship art').length, 0);
  }
});

test('the real Catch action contains the actual caught denominator and retains life feedback', () => {
  for (const [caught, needed] of [[0, 5], [8, 9], [11, 12]]) {
    const view = host(healthy(), { caught, needed });
    const count = find(view.tree, node => node.props?.className === 'rocket-control-caught');
    assert.equal(count.length, 1);
    assert.equal(count[0].props['data-child-progress'], true);
    assert.equal(count[0].props['aria-label'], `${caught} of ${needed} words caught`);
    assert.equal(text(count[0]).trim(), `${caught}/${needed}`);
    const action = find(view.tree, node => node.props?.action === 'catch');
    assert.equal(action.length, 1);
    assert.ok(action[0].props.label.includes(`${caught} of ${needed} words caught; 2 lives`));
    assert.ok(text(action[0]).includes('♥♥♡'));
  }
});

test('the existing context recovery card promotes guarded Continue and keeps a pending ship disabled', () => {
  for (const playable of [false, true]) {
    const calls = [];
    const view = host(healthy(), { contextRecovery: true, playable }, { resumeContext: () => calls.push('resume') });
    const retry = find(view.tree, node => node.type === 'button'
      && text(node) === (playable ? 'Continue flight' : 'Loading ship'));
    assert.equal(retry.length, 1);
    assert.equal(retry[0].props.disabled, !playable);
    assert.equal(retry[0].props['data-child-primary'], true);
    assert.equal(find(view.tree, node => node.props?.action === 'catch')[0].props.primary, false);
    if (playable) retry[0].props.onClick();
    assert.deepEqual(calls, playable ? ['resume'] : []);
  }
});

function actualControl(action = 'boost') {
  const calls = [], captures = [];
  const Control = new Function('element', 'useRef', `${actualCode}; return FlightControl;`)(element, initial => ({ current: initial }));
  const tree = Control({ action, label: action, onHold: (...args) => calls.push(args),
    onCancel: () => calls.push(['cancel']), focusPlay: () => calls.push(['focus']) });
  const event = (button = 0, pointerId = 7) => ({ button, pointerId, pointerType: 'touch', preventDefault() {},
    currentTarget: { setPointerCapture: id => captures.push(id) } });
  return { props: tree.props, calls, captures, event };
}

test('actual cancelled and unexpectedly lost pointer capture release button-minus-one without stealing focus', () => {
  for (const handler of ['onPointerCancel', 'onLostPointerCapture']) {
    const c = actualControl();
    c.props.onPointerDown(c.event());
    c.props[handler](c.event(-1));
    c.props.onLostPointerCapture(c.event(-1));
    assert.deepEqual(c.captures, [7]);
    assert.deepEqual(c.calls, [['boost', true, 'touch', 7], ['boost', false, 'touch', 7], ['cancel']]);
  }
});

test('ordinary pointer up preserves deliberate Catch intent while non-primary and unrelated pointers do nothing', () => {
  const c = actualControl('catch');
  c.props.onPointerDown(c.event(2, 9));
  c.props.onPointerCancel(c.event(-1, 9));
  assert.deepEqual(c.calls, []);
  c.props.onPointerDown(c.event());
  c.props.onPointerUp(c.event(0, 9));
  c.props.onPointerUp(c.event());
  c.props.onLostPointerCapture(c.event(-1));
  assert.deepEqual(c.calls, [['catch', true, 'touch', 7], ['catch', false, 'touch', 7], ['focus']]);
});
