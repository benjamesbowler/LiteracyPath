import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// A small DOM surface keeps the lifecycle tests deterministic without installing
// a browser substitute. The release browser suite exercises actual markup.
class Element {
  constructor(tag = 'div', attributes = {}, document = null) {
    this.tagName = tag; this.attributes = {}; this.dataset = {}; this.children = [];
    this.ownerDocument = document; this.hidden = false; this.disabled = false;
    this.isConnected = true; this._text = '';
    Object.entries(attributes).forEach(([key, value]) => this.setAttribute(key, value));
  }
  setAttribute(key, value) {
    this.attributes[key] = String(value);
    if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = String(value);
  }
  getAttribute(key) { return this.attributes[key] ?? null; }
  removeAttribute(key) { delete this.attributes[key]; }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  appendChild(child) { child.parentElement = this; child.ownerDocument = this.ownerDocument; this.children.push(child); return child; }
  replaceChildren(...children) { this._text = ''; this.children = []; children.forEach(child => this.appendChild(child)); }
  matches(selector) {
    return selector.split(',').some(part => {
      if (part === 'button') return this.tagName === 'button';
      const match = /^\[([^=\]]+)(?:="?([^"\]]+)"?)?\]$/.exec(part);
      return match && this.getAttribute(match[1]) !== null && (match[2] === undefined || this.getAttribute(match[1]) === match[2]);
    });
  }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
  contains(target) { return target === this || this.children.some(child => child.contains(target)); }
  querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}
function fixture(type, data, selectors, options = {}) {
  let now = 0, nextId = 0;
  const timers = new Map(), audio = [], stopped = [];
  const document = { hidden: false, createElement: tag => new Element(tag, {}, document) };
  const game = new Element('section', { [`data-${type}-game`]: '' }, document);
  Object.assign(game.dataset, data);
  for (const selector of selectors) game.appendChild(new Element(selector.endsWith('image') ? 'img' : selector.endsWith('model') || selector.endsWith('feedback') || selector.endsWith('count') || selector.endsWith('sentence') || selector.endsWith('bank') || selector.endsWith('draft') ? 'div' : 'button', { [`data-${selector}`]: '' }, document));
  const context = vm.createContext({ performance: { now: () => now }, setInterval: callback => { timers.set(++nextId, callback); return nextId; }, clearInterval: id => timers.delete(id) });
  vm.runInContext(fs.readFileSync(new URL('../../public/present/classGames.js', import.meta.url), 'utf8'), context);
  const controller = context.createPresentClassGames({ playAudio: src => audio.push(src), stopAudio: () => stopped.push(true), ...options });
  const get = selector => game.querySelector(`[data-${selector}]`);
  const click = selector => controller.handleClick(get(selector));
  return { game, controller, document, timers, audio, stopped, get, click,
    advance(ms) { now += ms; [...timers.values()].forEach(callback => callback()); },
    append(name, value, content = '') { const node = game.appendChild(new Element('button', { [`data-${name}`]: value }, document)); node.textContent = content; return node; } };
}
function scramble(sentence = 'A cat sat.') {
  const f = fixture('scramble', { scrambleCard: JSON.stringify({ sentence, imagePath: '/cat.png', audioPath: '/cat.mp3' }) }, ['scramble-model', 'scramble-image', 'scramble-bank', 'scramble-draft', 'scramble-start', 'scramble-count', 'scramble-check', 'scramble-reset', 'scramble-hear', 'scramble-feedback'], { shuffle: values => values });
  f.controller.reset(f.game); return f;
}
function tiles(f, placed = false) { return f.game.querySelectorAll(placed ? '[data-scramble-placed]' : '[data-scramble-word]'); }

test('detective keeps the draft until explicit repair, using only matching audio', () => {
  const f = fixture('detective', { detectiveRounds: JSON.stringify([
    { sentence: 'A dog sat.', correctSentence: 'A cat sat.', matches: false, imagePath: '/cat.png', audioPath: '', correctAudioPath: '/cat.mp3' },
    { sentence: 'A cat ran.', correctSentence: 'A cat ran.', matches: true, imagePath: '/ran.png', audioPath: '/ran.mp3', correctAudioPath: '/ran.mp3' },
  ]) }, ['detective-image', 'detective-sentence', 'detective-feedback', 'detective-repair', 'detective-next', 'detective-hear']);
  const yes = f.append('detective-answer', 'yes'), no = f.append('detective-answer', 'no');
  f.controller.reset(f.game);
  assert.equal(f.get('detective-hear').hidden, true);
  f.click('detective-repair'); assert.equal(f.get('detective-sentence').textContent, 'A dog sat.');
  f.controller.handleClick(yes);
  assert.equal(f.get('detective-sentence').textContent, 'A dog sat.');
  assert.doesNotMatch(f.get('detective-feedback').textContent, /cat/);
  f.controller.handleClick(no); assert.equal(f.get('detective-sentence').textContent, 'A dog sat.');
  f.click('detective-repair'); assert.equal(f.get('detective-sentence').textContent, 'A cat sat.');
  assert.equal(f.get('detective-hear').hidden, false);
  f.click('detective-hear'); assert.deepEqual(f.audio, ['/cat.mp3']);
  f.click('detective-next'); assert.equal(f.get('detective-sentence').textContent, 'A cat ran.');
  f.click('detective-hear'); assert.deepEqual(f.audio, ['/cat.mp3', '/ran.mp3']);
  assert.equal(f.get('detective-next').disabled, true);
});

test('missing word hides accessible answer, reveals deliberately, then changes target', () => {
  const f = fixture('missing', { missingItems: JSON.stringify([{ text: 'I' }, { text: 'a' }, { text: 'the' }]), missingOrder: '[2,0,1]' }, ['missing-hide', 'missing-reveal', 'missing-next', 'missing-feedback']);
  const items = ['I', 'a', 'the'].map((text, i) => f.append('missing-item', String(i), text));
  items[2].setAttribute('aria-label', 'the'); items[2].setAttribute('title', 'the');
  f.controller.reset(f.game); f.click('missing-hide');
  assert.deepEqual(items.map(item => item.textContent), ['I', 'a', '?']);
  assert.equal(items[2].getAttribute('aria-label'), null); assert.equal(items[2].getAttribute('title'), null);
  f.click('missing-next'); assert.equal(items[2].textContent, '?');
  f.click('missing-reveal'); assert.equal(items[2].textContent, 'the');
  f.click('missing-next'); assert.deepEqual(items.map(item => item.textContent), ['I', 'a', 'the']);
  f.click('missing-hide'); assert.deepEqual(items.map(item => item.textContent), ['?', 'a', 'the']);
});

test('scramble holds the complete model for 15 seconds and mixes identity shuffle', () => {
  const f = scramble();
  assert.equal(f.game.dataset.phase, 'model'); assert.equal(f.timers.size, 0);
  f.click('scramble-hear'); assert.deepEqual(f.audio, ['/cat.mp3']);
  f.click('scramble-start'); f.advance(14999);
  assert.equal(f.game.dataset.phase, 'countdown'); assert.equal(f.get('scramble-model').textContent, 'A cat sat.');
  f.advance(1); assert.equal(f.game.dataset.phase, 'build'); assert.equal(f.timers.size, 0);
  assert.equal(f.get('scramble-model').textContent, ''); assert.equal(f.get('scramble-model').hidden, true);
  assert.equal(f.get('scramble-hear').hidden, true); assert.equal(f.get('scramble-check').hidden, false);
  assert.deepEqual(tiles(f).map(node => node.dataset.scrambleWord), ['1', '2', '0']);
  assert.equal(f.get('scramble-image').src, '/cat.png');
  f.click('scramble-hear'); assert.deepEqual(f.audio, ['/cat.mp3']);
});

test('scramble retains wrong draft, permits repair, and treats duplicate words interchangeably', () => {
  const f = scramble('A cat and A dog.'); f.click('scramble-start'); f.advance(15000);
  for (const index of [0, 2, 1, 3, 4]) f.controller.handleClick(tiles(f).find(node => node.dataset.scrambleWord === String(index)));
  f.click('scramble-check');
  assert.match(f.get('scramble-feedback').textContent, /Which word could move/);
  assert.deepEqual(tiles(f, true).map(node => node.textContent), ['A', 'and', 'cat', 'A', 'dog.']);
  assert.equal(tiles(f).length, 0);
  while (tiles(f, true).length) f.controller.handleClick(tiles(f, true)[0]);
  assert.equal(tiles(f, true).length, 0); assert.equal(tiles(f).length, 5);
  for (const index of [3, 1, 2, 0, 4]) f.controller.handleClick(tiles(f).find(node => node.dataset.scrambleWord === String(index)));
  f.click('scramble-check'); assert.match(f.get('scramble-feedback').textContent, /words are in order/);
  f.click('scramble-reset'); assert.equal(f.game.dataset.phase, 'model'); assert.equal(f.get('scramble-model').textContent, 'A cat and A dog.');
  assert.equal(f.timers.size, 0); assert.equal(tiles(f).length, 0); assert.equal(f.get('scramble-check').hidden, true);
});

test('countdown freezes on pause and hidden page, and requires explicit resume', () => {
  const f = scramble(); f.click('scramble-start'); f.advance(4200); f.controller.pause();
  assert.equal(f.get('scramble-count').textContent, '11'); assert.equal(f.game.dataset.phase, 'paused');
  assert.equal(f.get('scramble-start').textContent, 'Resume countdown'); assert.equal(f.timers.size, 0);
  f.advance(20000); assert.equal(f.game.dataset.phase, 'paused');
  f.click('scramble-start'); f.advance(10799); assert.equal(f.game.dataset.phase, 'countdown');
  f.advance(1); assert.equal(f.game.dataset.phase, 'build');
  f.click('scramble-reset'); f.click('scramble-start'); f.advance(2000);
  f.document.hidden = true; f.advance(1000); assert.equal(f.game.dataset.phase, 'paused'); assert.equal(f.timers.size, 0);
  f.document.hidden = false; f.advance(30000); assert.equal(f.game.dataset.phase, 'paused');
});

test('cancel and reset prevent a queued old callback from changing a new slide', () => {
  const f = scramble(); f.click('scramble-start');
  const stale = [...f.timers.values()][0];
  f.controller.cancel(); f.advance(20000); stale();
  assert.equal(f.timers.size, 0); assert.equal(f.game.dataset.phase, 'countdown');
  f.controller.reset(f.game); stale();
  assert.equal(f.game.dataset.phase, 'model');
  assert.equal(f.get('scramble-count').textContent, '15');
  f.click('scramble-start'); f.advance(2000); f.controller.pause();
  const frozen = f.get('scramble-count').textContent;
  f.click('scramble-start'); stale();
  assert.equal(f.get('scramble-count').textContent, frozen);
  assert.equal(f.timers.size, 1);
  f.controller.reset(f.game);
  f.get('scramble-start').disabled = true; f.click('scramble-start'); assert.equal(f.timers.size, 0);
});
