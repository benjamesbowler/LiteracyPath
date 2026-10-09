import assert from 'node:assert/strict';
import test from 'node:test';
import { ARCADE_BACKING_PIXEL_BUDGET, arcadePixelRatio, isAppleTouchDevice } from '../../src/components/learn/games/shared/arcadeRenderBudget.js';
import { detectQualityTier } from '../../src/components/learn/games/shared/threeShell.js';
import { canvasPoint, sizeCanvasToMount } from '../../src/components/learn/games/shared/canvasUtils.js';

const ipad = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
  platform: 'MacIntel', maxTouchPoints: 5, devicePixelRatio: 2, width: 1080, height: 810 };

test('desktop-identifying iPad Safari selects a bounded direct renderer without deviceMemory', () => {
  assert.equal(isAppleTouchDevice(ipad), true);
  assert.equal(detectQualityTier({ ...ipad, cores: 6 }), 'low');
  assert.equal(arcadePixelRatio(2, 1080, 810, ipad), 1);
  assert.equal(arcadePixelRatio(2, 810, 1080, ipad), 1);
  assert.equal(isAppleTouchDevice({userAgent:'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)'}), true);
});

test('Mac desktop and unknown browsers retain their existing hardware tier', () => {
  assert.equal(isAppleTouchDevice({...ipad,maxTouchPoints:0}),false);
  assert.equal(detectQualityTier({...ipad,maxTouchPoints:0,cores:8,memory:8}),'high');
  assert.equal(detectQualityTier({cores:0,memory:0,devicePixelRatio:2}),'medium');
});

test('Retina backing work is bounded without enlarging CSS controls or changing game coordinates', () => {
  const desktop={...ipad,maxTouchPoints:0,devicePixelRatio:3};
  assert.equal(arcadePixelRatio(2,640,600,desktop),2);
  const ratio=arcadePixelRatio(2,1080,810,desktop);
  assert.ok(Math.abs(1080*810*ratio*ratio-ARCADE_BACKING_PIXEL_BUDGET)<.001);
  assert.equal(arcadePixelRatio(1,1080,810,desktop),1);
  assert.equal(arcadePixelRatio(2,NaN,0,{devicePixelRatio:NaN}),1);
});

test('the shared 2D surface limits iPad backing pixels while keeping pointer coordinates', () => {
  const windowDescriptor=Object.getOwnPropertyDescriptor(globalThis,'window');
  const navigatorDescriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  try {
    Object.defineProperty(globalThis,'window',{configurable:true,value:{devicePixelRatio:2,innerWidth:1080,innerHeight:810}});
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:ipad});
    const rect={width:960,height:600,left:60,top:100};
    const mount={getBoundingClientRect:()=>rect};
    const canvas={getBoundingClientRect:()=>rect};
    const transforms=[];
    const size=sizeCanvasToMount(mount,canvas,{setTransform:(...args)=>transforms.push(args)});
    assert.deepEqual(size,{width:960,height:600,dpr:1});
    assert.equal(canvas.width*canvas.height,576000);
    assert.deepEqual(transforms,[[1,0,0,1,0,0]]);
    assert.deepEqual(canvasPoint(canvas,{clientX:540,clientY:400},size.width,size.height),{x:480,y:300});
  } finally {
    if(windowDescriptor)Object.defineProperty(globalThis,'window',windowDescriptor);else delete globalThis.window;
    if(navigatorDescriptor)Object.defineProperty(globalThis,'navigator',navigatorDescriptor);else delete globalThis.navigator;
  }
});
