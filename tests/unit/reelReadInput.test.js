import test from 'node:test';
import assert from 'node:assert/strict';
import { reelReadKeyboardAllowed, reelReadKeyAction } from '../../src/utils/reelReadInput.js';

test('focused game field accepts actual steering/cast keys and rejects an unfocused host', () => {
  const host={},field={closest:()=>host,contains:()=>false},target={closest:()=>null};
  assert.equal(reelReadKeyboardAllowed({key:' ',target},field,host),true);
  assert.equal(reelReadKeyboardAllowed({key:' ',target},field,{}),false);
  for(const key of ['ArrowLeft','a','A']) assert.equal(reelReadKeyAction(key),'left');
  for(const key of ['ArrowRight','d','D']) assert.equal(reelReadKeyAction(key),'right');
  for(const key of [' ','Enter','e','ArrowUp','ArrowDown']) assert.equal(reelReadKeyAction(key),'cast');
  assert.equal(reelReadKeyAction('Escape'),null);
});

test('nested native controls keep activation keys while text/select/dialogs also keep movement', () => {
  const host={},field={closest:()=>host,contains:()=>true};
  for(const type of ['button','a','input','textarea','select','summary']) {
    const control={type};
    const target={closest:selector=>selector.includes('button')?control:null};
    assert.equal(reelReadKeyboardAllowed({key:' ',target},field,host),false,type);
  }
  for(const type of ['input','textarea','select','dialog']) {
    const control={type},player={};
    const target={closest(selector){
      if(selector==='.lg-game-player')return player;
      if(selector==='[role="dialog"]')return type==='dialog'?control:null;
      if(selector.startsWith('[inert]'))return type==='dialog'?null:control;
      return selector.includes('button')?control:null;
    }};
    assert.equal(reelReadKeyboardAllowed({key:'ArrowLeft',target},field,host),false,type);
  }
});
