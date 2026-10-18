import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';

// A small DOM surface keeps the lifecycle tests deterministic without installing
// a browser substitute. The release browser suite exercises actual markup.
class Element {
  constructor(tag = 'div', attributes = {}, document = null) {
    this.tagName = tag; this.attributes = {}; this.dataset = {}; this.children = [];
    this.ownerDocument = document; this.hidden = false; this.disabled = false;
    this.isConnected = true; this._text = '';
    const classes = new Set();
    this.classList = { add: (...names) => names.forEach(name => classes.add(name)), remove: (...names) => names.forEach(name => classes.delete(name)), contains: name => classes.has(name), toggle(name, enabled = !classes.has(name)) { if (enabled) classes.add(name); else classes.delete(name); return enabled; } };
    Object.entries(attributes).forEach(([key, value]) => this.setAttribute(key, value));
  }
  setAttribute(key, value) {
    this.attributes[key] = String(value);
    if (key === 'class') this.classList.add(...String(value).split(/\s+/));
    if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = String(value);
  }
  getAttribute(key) { return this.attributes[key] ?? null; }
  removeAttribute(key) { delete this.attributes[key]; }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  appendChild(child) { child.parentElement = this; child.ownerDocument = this.ownerDocument; this.children.push(child); return child; }
  append(child) { return this.appendChild(child); }
  focus() { this.ownerDocument.activeElement = this; }
  replaceChildren(...children) { this._text = ''; this.children = []; children.forEach(child => this.appendChild(child)); }
  matches(selector) {
    return selector.split(',').some(part => {
      part = part.trim();
      const excluded = [...part.matchAll(/:not\(([^)]+)\)/g)].map(match => match[1]);
      if (excluded.some(selector => this.matches(selector))) return false;
      part = part.replace(/:not\([^)]+\)/g, '');
      if (part === ':disabled') return this.disabled;
      if (part.startsWith('.')) return part.slice(1).split('.').every(name => this.classList.contains(name));
      if (/^[a-z]+$/.test(part)) return this.tagName === part;
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
  const timers = new Map(), timeouts = new Map(), audio = [], stopped = [];
  const document = { hidden: false, createElement: tag => new Element(tag, {}, document) };
  const game = new Element('section', { [`data-${type}-game`]: '' }, document);
  Object.assign(game.dataset, data);
  for (const selector of selectors) game.appendChild(new Element(selector.endsWith('image') ? 'img' : selector.endsWith('model') || selector.endsWith('feedback') || selector.endsWith('count') || selector.endsWith('sentence') || selector.endsWith('bank') || selector.endsWith('draft') ? 'div' : 'button', { [`data-${selector}`]: '' }, document));
  const context = vm.createContext({ document, performance: { now: () => now }, setInterval: callback => { timers.set(++nextId, callback); return nextId; }, clearInterval: id => timers.delete(id), setTimeout: (callback, delay) => { timeouts.set(++nextId, {callback, at: now + delay}); return nextId; }, clearTimeout: id => timeouts.delete(id) });
  vm.runInContext(fs.readFileSync(new URL('../../public/present/classGames.js', import.meta.url), 'utf8'), context);
  const controller = context.createPresentClassGames({ playAudio: src => audio.push(src), stopAudio: () => stopped.push(true), ...options });
  const get = selector => game.querySelector(`[data-${selector}]`);
  const click = selector => controller.handleClick(get(selector));
  return { game, controller, document, timers, audio, stopped, get, click, context,
    advance(ms) { now += ms; [...timers.values()].forEach(callback => callback()); [...timeouts].forEach(([id, timer]) => { if (timer.at <= now) { timeouts.delete(id); timer.callback(); } }); },
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
  assert.equal(f.get('detective-feedback').dataset.feedback, 'incorrect'); assert.equal(yes.classList.contains('is-incorrect'), true);
  assert.equal(f.get('detective-sentence').textContent, 'A dog sat.');
  assert.doesNotMatch(f.get('detective-feedback').textContent, /cat/);
  f.controller.handleClick(no); assert.equal(f.get('detective-sentence').textContent, 'A dog sat.');
  assert.equal(f.get('detective-feedback').dataset.feedback, 'correct'); assert.equal(no.classList.contains('is-correct'), true); assert.equal(yes.classList.contains('is-incorrect'), false);
  f.click('detective-repair'); assert.equal(f.get('detective-sentence').textContent, 'A cat sat.');
  assert.equal(f.get('detective-feedback').dataset.feedback, 'revealed');
  assert.equal(f.get('detective-hear').hidden, false);
  f.click('detective-hear'); assert.deepEqual(f.audio, ['/cat.mp3']);
  f.click('detective-next'); assert.equal(f.get('detective-sentence').textContent, 'A cat ran.');
  assert.equal(f.get('detective-feedback').dataset.feedback, 'neutral'); assert.equal(no.classList.contains('is-correct'), false);
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
  assert.equal(f.get('missing-feedback').dataset.feedback, 'revealed'); assert.equal(items[2].classList.contains('is-revealed'), true); assert.equal(items[2].classList.contains('is-correct'), false);
  f.click('missing-next'); assert.deepEqual(items.map(item => item.textContent), ['I', 'a', 'the']);
  assert.equal(f.get('missing-feedback').dataset.feedback, 'neutral'); assert.equal(items[2].classList.contains('is-revealed'), false);
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
  assert.equal(f.get('scramble-draft').classList.contains('is-incorrect'), true); assert.match(f.get('scramble-feedback').textContent, /^✕ Try again\./);
  assert.deepEqual(tiles(f, true).map(node => node.textContent), ['A', 'and', 'cat', 'A', 'dog.']);
  assert.equal(tiles(f).length, 0);
  while (tiles(f, true).length) f.controller.handleClick(tiles(f, true)[0]);
  assert.equal(tiles(f, true).length, 0); assert.equal(tiles(f).length, 5);
  assert.equal(f.get('scramble-draft').classList.contains('is-incorrect'), false); assert.equal(f.get('scramble-feedback').dataset.feedback, 'neutral');
  for (const index of [3, 1, 2, 0, 4]) f.controller.handleClick(tiles(f).find(node => node.dataset.scrambleWord === String(index)));
  f.click('scramble-check'); assert.match(f.get('scramble-feedback').textContent, /words are in order/);
  assert.equal(f.get('scramble-draft').classList.contains('is-correct'), true); assert.match(f.get('scramble-feedback').textContent, /^✓ Correct\./);
  f.click('scramble-reset'); assert.equal(f.game.dataset.phase, 'model'); assert.equal(f.get('scramble-model').textContent, 'A cat and A dog.');
  assert.equal(f.timers.size, 0); assert.equal(tiles(f).length, 0); assert.equal(f.get('scramble-check').hidden, true);
  assert.equal(f.get('scramble-draft').classList.contains('is-correct'), false); assert.equal(f.get('scramble-feedback').dataset.feedback, 'neutral');
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

function append(parent, tag, attrs, content = '') {
  const node = parent.appendChild(new Element(tag, attrs, parent.ownerDocument)); node.textContent = content; return node;
}
function deckFixture(names) {
  const f = fixture('unused', {}, []);
  const source = fs.readFileSync(new URL('../../public/present/deck.js', import.meta.url), 'utf8');
  const body = parse(source, { sourceType: 'script' }).program.body[0].expression.callee.body.body;
  // Execute the actual production functions against the same deterministic DOM
  // and clock. This avoids a second implementation of their feedback logic.
  const functions = body.filter(node => node.type === 'FunctionDeclaration' && names.includes(node.id.name));
  assert.equal(functions.length, names.length);
  vm.runInContext('var setFeedback=setPresentFeedback,setOutcome=setPresentOutcome,matchRun=null;var blank={hidden:true},overview={hidden:true};', f.context);
  vm.runInContext(functions.map(node => source.slice(node.start, node.end)).join('\n'), f.context);
  return f;
}
function assertFeedback(node, state) {
  assert.equal(node.dataset.feedback, state);
  assert.equal(node.classList.contains('is-correct'), state === 'correct');
  assert.equal(node.classList.contains('is-incorrect'), state === 'incorrect');
  assert.equal(node.getAttribute('role'), 'status'); assert.equal(node.getAttribute('aria-live'), 'polite');
  if (state === 'correct') assert.match(node.textContent, /^✓ Correct\./);
  if (state === 'incorrect') assert.match(node.textContent, /^✕ Try again\./);
}

test('picture choices keep the wrong attempt red, allow a correct retry and clear on reset', () => {
  const f = deckFixture(['choosePicture', 'resetChoice']);
  f.game.dataset.choiceTarget = 'cat'; f.game.setAttribute('data-choice-target', 'cat');
  const feedback = append(f.game, 'p', { 'data-choice-feedback': '' });
  const wrong = f.append('choice-value', 'dog'), right = f.append('choice-value', 'cat');
  f.context.choosePicture(wrong); assertFeedback(feedback, 'incorrect'); assert.equal(wrong.classList.contains('is-incorrect'), true);
  assert.equal(wrong.disabled, false); assert.equal(right.disabled, false);
  f.context.choosePicture(right); assertFeedback(feedback, 'correct'); assert.equal(right.classList.contains('is-correct'), true);
  f.context.resetChoice(f.game); assertFeedback(feedback, 'neutral');
  assert.equal(wrong.classList.contains('is-incorrect'), false); assert.equal(right.classList.contains('is-correct'), false);
});

test('spelling check marks the intact draft and Undo/reset clear its result', () => {
  const f = deckFixture(['resetBuild', 'paintBuild', 'checkBuild', 'undoBuild']);
  const build = append(f.game, 'div', { class: 'p-build', 'data-build-target': '["c","a","t"]' });
  const slots = append(build, 'div', { class: 'p-build-slots' });
  for (let i = 0; i < 3; i++) append(slots, 'span', { class: 'p-build-slot' });
  const feedback = append(build, 'p', { class: 'p-build-feedback' });
  const wrongDraft = JSON.stringify(['c', 'i', 't'].map((part, id) => ({part, id: String(id)})));
  build.dataset.draft = wrongDraft; f.context.paintBuild(build); f.context.checkBuild(build);
  assertFeedback(feedback, 'incorrect'); assert.equal(build.dataset.draft, wrongDraft); assert.equal(slots.classList.contains('is-incorrect'), true);
  f.context.undoBuild(build); assertFeedback(feedback, 'neutral'); assert.equal(slots.classList.contains('is-incorrect'), false); assert.equal(JSON.parse(build.dataset.draft).length, 2);
  build.dataset.draft = JSON.stringify(['c', 'a', 't'].map((part, id) => ({part, id: String(id)})));
  f.context.checkBuild(build); assertFeedback(feedback, 'correct'); assert.equal(slots.classList.contains('is-correct'), true);
  f.context.resetBuild(f.game); assertFeedback(feedback, 'neutral'); assert.equal(slots.classList.contains('is-correct'), false);
  assert.deepEqual(slots.children.map(node => node.textContent), ['', '', '']);
});

test('sorting keeps wrong card available, colours the selected group, then clears on reset', () => {
  const f = deckFixture(['resetSort', 'chooseSort']);
  const card = append(f.game, 'button', { 'data-sort-item': 'moon', 'data-sort-word': 'moon', 'data-sort-group': 'm', 'data-sort-reason': 'Moon starts with /m/.' });
  const wrong = append(f.game, 'button', { 'data-sort-bin': 's' }), right = append(f.game, 'button', { 'data-sort-bin': 'm' });
  const feedback = append(f.game, 'p', { 'data-sort-feedback': '' });
  for (const bin of [wrong, right]) append(bin, 'div', { 'data-sort-placed': '' });
  f.game.dataset.selected = 'moon'; f.context.chooseSort(f.game, wrong);
  assertFeedback(feedback, 'incorrect'); assert.equal(card.disabled, false); assert.equal(card.classList.contains('is-incorrect'), true); assert.equal(wrong.classList.contains('is-incorrect'), true);
  f.context.chooseSort(f.game, right); assertFeedback(feedback, 'correct'); assert.equal(card.disabled, true); assert.equal(card.classList.contains('is-correct'), true);
  assert.equal(wrong.classList.contains('is-incorrect'), false); assert.equal(right.querySelector('[data-sort-placed]').textContent, 'moon');
  f.context.resetSort(f.game); assertFeedback(feedback, 'neutral'); assert.equal(card.classList.contains('is-correct'), false); assert.equal(card.disabled, false); assert.equal(right.querySelector('[data-sort-placed]').textContent, '');
});

test('letter pairs show a red mismatch for two seconds, a green match, and reset both', () => {
  const f = deckFixture(['chooseMatch', 'hideMismatch', 'pauseMatch', 'resumeMatch', 'cancelMatch', 'resetMatch']);
  const game = append(f.game, 'div', { 'data-match-game': '', 'data-match-kind': 'letters' });
  const feedback = append(game, 'p', { 'data-match-feedback': '' });
  const cards = [['m', 'M'], ['m', 'm'], ['n', 'N'], ['n', 'n']].map(([key, label]) => {
    const card = append(game, 'button', { 'data-match-word': key });
    append(card, 'span', { class: 'p-card-word' }, label).hidden = true;
    append(card, 'span', { class: 'p-card-back' }); return card;
  });
  f.context.chooseMatch(cards[0]); f.context.chooseMatch(cards[2]);
  assertFeedback(feedback, 'incorrect'); assert.equal(cards[0].classList.contains('is-incorrect'), true);
  f.advance(1999); assert.equal(cards[0].classList.contains('is-open'), true);
  f.advance(1); assertFeedback(feedback, 'neutral'); assert.equal(cards[0].classList.contains('is-incorrect'), false); assert.equal(cards[0].classList.contains('is-open'), false);
  f.context.chooseMatch(cards[0]); f.context.chooseMatch(cards[1]); assertFeedback(feedback, 'correct');
  assert.equal(cards[0].classList.contains('is-correct'), true); assert.equal(cards[1].classList.contains('is-correct'), true);
  assert.equal(cards[0].querySelector('.p-card-word').hidden, false);
  f.context.resetMatch(f.game); assertFeedback(feedback, 'neutral');
  assert.ok(cards.every(card => !card.classList.contains('is-correct') && !card.classList.contains('is-incorrect') && !card.disabled));
});

test('grammar choices permit wrong/correct review and navigation reset restores neutral prompt', () => {
  const f = deckFixture(['chooseLanguage', 'resetLanguage']);
  const game = append(f.game, 'div', { 'data-language-activity': '' });
  const feedback = append(game, 'p', { 'data-language-feedback': '' }, 'Choose the sentence.');
  const wrong = append(game, 'button', { 'data-language-choice': '', 'data-language-correct': 'false', 'data-language-explanation': 'A question needs a question mark.' }, 'Where is it.');
  const right = append(game, 'button', { 'data-language-choice': '', 'data-language-correct': 'true', 'data-language-explanation': 'The question ends with a question mark.' }, 'Where is it?');
  f.context.resetLanguage(f.game); f.context.chooseLanguage(wrong); assertFeedback(feedback, 'incorrect');
  assert.equal(wrong.classList.contains('is-incorrect'), true); assert.equal(right.disabled, false);
  f.context.chooseLanguage(right); assertFeedback(feedback, 'correct'); assert.equal(right.classList.contains('is-correct'), true); assert.equal(wrong.classList.contains('is-incorrect'), false);
  f.context.chooseLanguage(wrong); assertFeedback(feedback, 'incorrect');
  f.context.resetLanguage(f.game); assertFeedback(feedback, 'neutral'); assert.equal(feedback.textContent, 'Choose the sentence.');
  assert.equal(wrong.classList.contains('is-incorrect'), false); assert.equal(right.classList.contains('is-correct'), false); assert.equal(wrong.getAttribute('aria-pressed'), 'false');
});
