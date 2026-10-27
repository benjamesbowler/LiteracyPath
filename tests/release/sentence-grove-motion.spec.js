import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const snapshot=page=>page.evaluate(()=>window.__sentenceGroveSnapshot?.());
test('Grove retains upright moving rover and pause continuity through genuine renderer fallback',async({page},info)=>{
 test.setTimeout(90000);
 await page.goto('/preview/game-overlay.html?game=star-gallery&sound=0&music=0');
 await expect(page.getByRole('button',{name:'Cut the nearby answer tree',exact:true})).toBeVisible();
 await page.waitForFunction(()=>window.__sentenceGroveSnapshot?.()?.authoredWorld?.driver,{timeout:15000});
 await page.waitForFunction(()=>{const s=window.__sentenceGroveSnapshot?.();return s&&!s.graphicsLoading;});
 await page.locator('.lg-game-player-main').focus();
 await page.keyboard.down('ArrowUp');await page.keyboard.down('ArrowRight');
 const rows=await page.evaluate(()=>new Promise(resolve=>{const rows=[];let start;function frame(time){start??=time;const s=window.__sentenceGroveSnapshot();rows.push({time,player:s.player,motion:s.motion});if(time-start<3000)requestAnimationFrame(frame);else resolve(rows);}requestAnimationFrame(frame);}));
 await page.keyboard.up('ArrowRight');await page.keyboard.up('ArrowUp');
 fs.writeFileSync(info.outputPath('grove-motion.json'),JSON.stringify(rows));
 expect(rows.length).toBeGreaterThan(30);
 for(const row of rows){const [x,,z]=row.motion.vehicleQuaternion;expect(1-2*(x*x+z*z)).toBeGreaterThan(.95);expect(Math.hypot(row.player.x-row.motion.visual.x,row.player.z-row.motion.visual.z)).toBeLessThan(.5);}
 await page.screenshot({path:info.outputPath('grove-turn.png')});
 await page.getByRole('button',{name:'Open game controls',exact:true}).click();const paused=await snapshot(page);await page.waitForTimeout(300);expect((await snapshot(page)).player).toEqual(paused.player);await page.keyboard.press('Escape');
 const lost=await page.evaluate(()=>{for(const canvas of document.querySelectorAll('canvas')){const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');const extension=gl?.getExtension('WEBGL_lose_context');if(extension){extension.loseContext();return true;}}return false;});expect(lost).toBe(true);
 await page.waitForFunction(()=>window.__sentenceGroveSnapshot?.()?.canvasRecovery);
 const before=await snapshot(page);await page.keyboard.down('ArrowUp');await page.waitForTimeout(500);await page.keyboard.up('ArrowUp');const after=await snapshot(page);
 expect(Math.hypot(after.player.x-before.player.x,after.player.z-before.player.z)).toBeGreaterThan(.05);
 expect(after.learning.firstResponseCount).toBe(before.learning.firstResponseCount);
 await page.screenshot({path:info.outputPath('grove-canvas.png')});
});
