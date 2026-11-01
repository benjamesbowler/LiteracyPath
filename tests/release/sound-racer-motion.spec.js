import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const snapshot=page=>page.evaluate(()=>window.__arcadePreviewSnapshot?.());

test('sustained steering remains upright with continuous visual motion and pause recovery',async({page},info)=>{
 test.setTimeout(90000);
 const consoleMessages=[];page.on('console',message=>{if(['warning','error'].includes(message.type()))consoleMessages.push({type:message.type(),text:message.text()});});
 const profiler=await page.context().newCDPSession(page);await profiler.send('Profiler.enable');await profiler.send('Profiler.start');
 await page.setViewportSize({width:1280,height:900});
 await page.addInitScript(()=>{
  localStorage.setItem('literacy-guide-learn-games:fullscreen-overlay-preview',JSON.stringify({games:{'sound-racer':{checkpoints:{easy:{level:0,totalLevels:10,sessionSeed:0,chapter:0}}}}}));
  window.__motionAudioContexts=0;
  for(const key of ['AudioContext','webkitAudioContext']){const Native=window[key];if(Native)window[key]=new Proxy(Native,{construct(target,args,newTarget){window.__motionAudioContexts++;return Reflect.construct(target,args,newTarget);}});}
  performance.setResourceTimingBufferSize(2000);
  window.__motionLoading={frames:[],longTasks:[]};
  new PerformanceObserver(list=>window.__motionLoading.longTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});
  let previous;function frame(time){const s=window.__arcadePreviewSnapshot?.();window.__motionLoading.frames.push({time,wallTime:performance.now(),delta:previous?time-previous:0,ready:Boolean(s?.running&&!s.assetsLoading&&!s.graphicsLoading),mode:s?.presentation.mode});previous=time;if(window.__motionLoading.frames.length<2400)requestAnimationFrame(frame);}requestAnimationFrame(frame);
 });
 await page.goto('/preview/game-overlay.html?game=sound-racer&difficulty=easy&sound=0&music=0');
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.waitForFunction(()=>{const s=window.__arcadePreviewSnapshot?.();return s?.running&&!s.assetsLoading&&!s.graphicsLoading;},null,{timeout:45000});
 fs.writeFileSync(info.outputPath('cold-start.cpuprofile'),JSON.stringify((await profiler.send('Profiler.stop')).profile));
 fs.writeFileSync(info.outputPath('cold-start.json'),JSON.stringify(await page.evaluate(()=>({audioContexts:window.__motionAudioContexts,warmup:window.__arcadePreviewSnapshot?.()?.warmup,loading:window.__motionLoading,resources:performance.getEntriesByType('resource').filter(e=>/game-assets|glb|webp/.test(e.name)).map(e=>({name:e.name,duration:e.duration,size:e.transferSize}))}))));
 const prepared=await snapshot(page);expect(prepared.warmup.status).toBe('ready');expect(prepared.warmup.skippedTextures).toBe(0);
 expect(await page.evaluate(()=>window.__motionAudioContexts),'muted startup must not create an audio context').toBe(0);
 await page.locator('.lg-game-player-main').focus();
 await page.keyboard.down('ArrowRight');
 const rows=await page.evaluate(()=>new Promise(resolve=>{
   const rows=[];let start;
   function sample(time){start??=time;const s=window.__arcadePreviewSnapshot();rows.push({time,progress:s.progress,motion:s.motion,mode:s.presentation.mode,chassis:s.kart.joints.chassis});if(time-start<6000)requestAnimationFrame(sample);else resolve(rows);}
   requestAnimationFrame(sample);
 }));
 await page.keyboard.up('ArrowRight');
 fs.writeFileSync(info.outputPath('held-turn-frames.json'),JSON.stringify(rows));
 const webgl=rows.filter(r=>r.mode==='webgl'&&r.chassis);
 expect(webgl.length,'the primary rig must actually be observed').toBeGreaterThan(20);
 for(const row of webgl){const [x,,z]=row.chassis.quaternion;expect(1-2*(x*x+z*z),'world body up remains positive').toBeGreaterThan(.9);}
 expect(rows.at(-1).progress).toBeGreaterThan(rows[0].progress+30);
 await page.screenshot({path:info.outputPath('held-turn.png')});
 await page.getByRole('button',{name:'Open game controls',exact:true}).click();
 const paused=await snapshot(page);await page.waitForTimeout(300);expect((await snapshot(page)).timeMs).toBe(paused.timeMs);
 await page.keyboard.press('Escape');await page.keyboard.down('ArrowLeft');await page.waitForTimeout(1200);await page.keyboard.up('ArrowLeft');
 const resumed=await snapshot(page);expect(resumed.progress).toBeGreaterThan(paused.progress);
 expect(Math.abs(resumed.motion.visual.progress-resumed.progress)).toBeLessThan(.5);
 await page.screenshot({path:info.outputPath('reversed-after-pause.png')});
 fs.writeFileSync(info.outputPath('console.json'),JSON.stringify(consoleMessages,null,2));
 expect(consoleMessages.filter(row=>/Texture marked for update/.test(row.text))).toEqual([]);
});

test('exiting a loading Racer cancels late GPU work without reviving the game',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/preview/game-overlay.html?game=sound-racer&difficulty=easy&sound=0&music=0');
 await page.getByRole('button',{name:'Close Sound Racer',exact:true}).click();
 await page.getByRole('button',{name:'Leave',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Sound Racer',exact:true})).toHaveCount(0);
 await page.waitForTimeout(700);
 expect(errors).toEqual([]);
});
