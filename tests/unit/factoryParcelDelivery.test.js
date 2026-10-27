import test from 'node:test';
import assert from 'node:assert/strict';
import { factoryParcelDelivery } from '../../src/components/learn/games/games/factoryParcelDelivery.js';

test('actual destination closes the measured desktop floating-parcel gap and mirrors both chutes',()=>{
  const parcel={x:530,y:350,width:220,height:128};
  for(const centre of [420,860]){
    const mouth={x:centre-100,y:640,width:200,height:14};
    const result=factoryParcelDelivery(parcel,{x:centre-160,y:550,width:320,height:140},mouth);
    assert.equal(parcel.x+parcel.width/2+result.x,centre);
    assert.equal(parcel.y+parcel.height/2+result.y,647);
    assert.notEqual(Math.abs(result.x),100);assert.notEqual(result.y,58);
  }
});

test('compact layouts use the actual selected chute when its mouth is hidden',()=>{
  const parcel={x:105,y:655,width:180,height:65};
  const result=factoryParcelDelivery(parcel,{x:34,y:704,width:150,height:62},{x:0,y:0,width:0,height:0});
  assert.deepEqual(result,{x:-86,y:47.5});
  const moved=factoryParcelDelivery({...parcel,x:parcel.x+100,y:parcel.y+50},{x:134,y:754,width:150,height:62});
  assert.deepEqual(moved,result,'viewport translations cannot change the local travel');
});

test('unmeasurable or nonfinite elements never produce invalid CSS positions',()=>{
  const good={x:0,y:0,width:100,height:60};
  for(const invalid of [null,{...good,width:0},{...good,x:NaN},{...good,y:Infinity}])assert.equal(factoryParcelDelivery(invalid,good),null);
});
