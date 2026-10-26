import { test, expect } from '@playwright/test';
import fs from 'node:fs';

for (const [difficulty,width,height] of [['easy',1280,900],['medium',390,844],['hard',844,390]]) {
  test(`${difficulty} readable word boards retain physical approach, controls and Canvas recovery at ${width}x${height}`, async({page},info)=>{
    test.setTimeout(120000);
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:'reduce'});
    await page.addInitScript(difficulty=>{
      localStorage.setItem('literacy-guide-learn-games:fullscreen-overlay-preview',JSON.stringify({games:{'sound-racer':{checkpoints:{[difficulty]:{level:0,totalLevels:10,sessionSeed:0,chapter:0}}}}}));
      const get=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:get.call(this,type,...args);};
    },difficulty);
    await page.goto(`/preview/game-overlay.html?game=sound-racer&difficulty=${difficulty}&sound=0&music=0`);
    await page.getByRole('button',{name:'Continue',exact:true}).click();
    await page.waitForFunction(()=>{const s=window.__arcadePreviewSnapshot?.();return s?.running&&!s.assetsLoading&&!s.graphicsLoading&&s.nextGates.some(g=>g.word&&g.label);},null,{timeout:60000});
    const before=await page.evaluate(()=>window.__arcadePreviewSnapshot());
    expect(before.presentation.mode).toBe('canvas');expect(before.evidence.firstResponses).toEqual([]);
    for(const gate of before.nextGates.filter(g=>g.label)) {
      expect(gate.label.width).toBeGreaterThan(0);expect(gate.label.textEmHeight).toBeGreaterThan(0);
      expect(gate.label.width/gate.label.height).toBeCloseTo(3.65/1.78,5);
    }
    await page.screenshot({path:info.outputPath('approaching-word-boards.png')});
    await page.getByRole('button',{name:'Open game controls',exact:true}).click();
    const paused=await page.evaluate(()=>window.__arcadePreviewSnapshot());await page.waitForTimeout(250);
    expect((await page.evaluate(()=>window.__arcadePreviewSnapshot())).timeMs).toBe(paused.timeMs);
    expect((await page.evaluate(()=>window.__arcadePreviewSnapshot())).progress).toBe(paused.progress);
    fs.writeFileSync(info.outputPath('readability.json'),JSON.stringify({before,paused},null,2));
    await page.keyboard.press('Escape');
    await page.keyboard.down('ArrowRight');await page.waitForTimeout(300);await page.keyboard.up('ArrowRight');
    const moved=await page.evaluate(()=>window.__arcadePreviewSnapshot());expect(moved.hasLaneIntent).toBe(true);expect(moved.progress).toBeGreaterThan(paused.progress);
    expect(errors).toEqual([]);
  });
}
