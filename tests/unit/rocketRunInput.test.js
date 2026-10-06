import test from 'node:test';
import assert from 'node:assert/strict';
import { rocketRunKeyboardAllowed, rocketRunKeyAction } from '../../src/utils/rocketRunInput.js';

test('focused host/field owns steering and deliberate Catch keys, while boost and Escape have different meanings', () => {
  const main = {}, field = { closest: () => main, contains: () => false }, target = { closest: () => null };
  assert.equal(rocketRunKeyboardAllowed({ key: ' ', target }, field, main), true);
  assert.equal(rocketRunKeyboardAllowed({ key: ' ', target }, field, field), true);
  assert.equal(rocketRunKeyboardAllowed({ key: ' ', target }, field, {}), false);
  for (const key of ['ArrowLeft', 'a', 'A']) assert.equal(rocketRunKeyAction(key), 'left');
  for (const key of ['ArrowRight', 'd', 'D']) assert.equal(rocketRunKeyAction(key), 'right');
  for (const key of [' ', 'Enter', 'e', 'E', 'ArrowUp']) {
    assert.equal(rocketRunKeyAction(key), 'catch');
    assert.equal(rocketRunKeyAction(key, { repeat: true }), null);
  }
  assert.equal(rocketRunKeyAction('ArrowLeft', { repeat: true }), 'left');
  assert.equal(rocketRunKeyAction('Shift'), 'boost');
  assert.equal(rocketRunKeyAction('Escape'), null);
});

test('native activation and text or other modal movement never become a courier catch or a lane change', () => {
  const main = {}, field = { closest: () => main, contains: () => true };
  for (const type of ['button', 'a', 'input', 'select', 'textarea', 'summary', 'role-button']) {
    const control = { type }, target = { closest: selector => selector.includes('button') ? control : null };
    assert.equal(rocketRunKeyboardAllowed({ key: ' ', target }, field, main), false, type);
  }
  for (const type of ['input', 'select', 'textarea', 'dialog']) {
    const control = { type }, player = {};
    const target = { closest(selector) {
      if (selector === '.lg-game-player') return player;
      if (selector === '[role="dialog"]') return type === 'dialog' ? control : null;
      if (selector.startsWith('[inert]')) return type === 'dialog' ? null : control;
      return selector.includes('button') ? control : null;
    } };
    assert.equal(rocketRunKeyboardAllowed({ key: 'ArrowLeft', target }, field, main), false, type);
  }
});
