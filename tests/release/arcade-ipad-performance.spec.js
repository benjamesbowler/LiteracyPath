import { test, expect } from '@playwright/test';
import { GAME_LIST, gameMenuGroup } from '../../src/data/learnGamesData.js';
import { ARCADE_BACKING_PIXEL_BUDGET } from '../../src/components/learn/games/shared/arcadeRenderBudget.js';

async function ready(page, game, difficulty) {
  await page.goto(`/preview/game-overlay.html?game=${game.id}&difficulty=${difficulty}&sound=0&music=0&taughtCycle=9`);
  const player=page.getByRole('dialog',{name:game.title,exact:true});
  await expect(player).toBeVisible();
  await expect(player.locator('.lg-game-loading:visible')).toHaveCount(0,{timeout:40_000});
  const continueButton=player.getByRole('button',{name:'Continue',exact:true});
  if(await continueButton.isVisible())await continueButton.tap();
  await expect(player.locator('.lg-game-player-main button:visible').first()).toBeVisible({timeout:40_000});
  return player;
}

for(const game of GAME_LIST)for(const difficulty of ['easy','medium','hard']){
  test(`${game.title} ${difficulty} loads, accepts input and bounds Retina drawing on iPad Safari`,async({page},testInfo)=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    if(gameMenuGroup(game)==='arcade')await page.addInitScript(()=>{
      window.__arcadeDraws=0;
      for(const [prototype,methods] of [[CanvasRenderingContext2D.prototype,['drawImage','fillRect']],
        [WebGLRenderingContext.prototype,['drawArrays','drawElements']],
        [WebGL2RenderingContext.prototype,['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']]]){
        for(const method of methods){const draw=prototype[method];if(!draw)continue;
          prototype[method]=function(...args){window.__arcadeDraws++;return draw.apply(this,args);};}
      }
    });
    const player=await ready(page,game,difficulty);
    await page.waitForTimeout(1500);
    const canvases=await player.locator('.lg-game-player-main canvas').evaluateAll(nodes=>nodes.map(node=>{
      const rect=node.getBoundingClientRect();return{width:node.width,height:node.height,cssWidth:rect.width,cssHeight:rect.height,data:{...node.dataset}};
    }).filter(row=>row.cssWidth>0&&row.cssHeight>0));
    for(const canvas of canvases){
      // Small authored sprite canvases may keep their source resolution. Full
      // play surfaces must stay within the common budget and iPad density cap.
      if(canvas.cssWidth>=540&&canvas.cssHeight>=300){
        expect(canvas.width*canvas.height).toBeLessThanOrEqual(Math.max(ARCADE_BACKING_PIXEL_BUDGET,canvas.cssWidth*canvas.cssHeight)+2200);
        expect(canvas.width/canvas.cssWidth).toBeLessThanOrEqual(1.01);
        expect(canvas.height/canvas.cssHeight).toBeLessThanOrEqual(1.01);
      }
      if(canvas.data.arcadePostEffects)expect(canvas.data.arcadePostEffects).toBe('off');
    }
    const action=player.locator('.lg-game-player-main button:visible:enabled').first();
    if(await action.count()){
      // Balloons and catches deliberately move during play. Send a native
      // touch at the visible position instead of waiting for motion to stop.
      const bounds=await action.boundingBox();
      await page.touchscreen.tap(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
    }
    await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');
    const cadence=await page.evaluate(async()=>{
      const samples=[];let previous,start;
      await new Promise(resolve=>requestAnimationFrame(function tick(at){start??=at;if(previous!==undefined)samples.push(at-previous);previous=at;
        if(at-start>=1000)resolve();else requestAnimationFrame(tick);
      }));
      const sorted=[...samples].sort((a,b)=>a-b);
      return{frames:samples.length,meanMs:samples.reduce((sum,x)=>sum+x,0)/samples.length,p95Ms:sorted[Math.ceil(sorted.length*.95)-1],maxMs:sorted.at(-1)};
    });
    expect(cadence.frames).toBeGreaterThan(0);
    if(gameMenuGroup(game)==='arcade'){
      await player.getByRole('button',{name:`Pause ${game.title}`,exact:true}).tap();
      await expect(player.getByRole('button',{name:'Resume game',exact:true})).toBeVisible();
      await page.waitForTimeout(1500);
      const paused=await page.evaluate(()=>window.__arcadeDraws);
      const rocket=game.id==='rocket-run'?await page.evaluate(()=>window.__arcadePreviewSnapshot()):null;
      await page.waitForTimeout(600);
      expect(await page.evaluate(()=>window.__arcadeDraws),'settled pause must stop drawing').toBe(paused);
      if(rocket)expect(await page.evaluate(()=>window.__arcadePreviewSnapshot())).toEqual(rocket);
      if(difficulty==='easy'){
        await page.setViewportSize({width:810,height:1080});
        await expect.poll(()=>page.evaluate(()=>window.__arcadeDraws)).toBeGreaterThan(paused);
        await page.waitForTimeout(500);const resized=await page.evaluate(()=>window.__arcadeDraws);
        await page.waitForTimeout(400);expect(await page.evaluate(()=>window.__arcadeDraws)).toBe(resized);
      }
      const stopped=await page.evaluate(()=>window.__arcadeDraws);
      await player.getByRole('button',{name:'Resume game',exact:true}).tap();
      await expect.poll(()=>page.evaluate(()=>window.__arcadeDraws)).toBeGreaterThan(stopped);
    }
    expect(errors).toEqual([]);
    await testInfo.attach('ordinary-rendered-cadence',{body:JSON.stringify({game:game.id,difficulty,canvases,cadence,
      bounds:'WebKit on desktop with iPad viewport/touch/density; no physical A13 or iPad presentation-latency claim.'}),contentType:'application/json'});
  });
}

test('Letter Leap holds and cancels steering, leaps, and stops repainting behind the exit dialog',async({page})=>{
  await page.addInitScript(()=>{
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    window.__arcadeDraws=0;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){window.__arcadeDraws++;return draw.apply(this,args);};
  });
  const player=await ready(page,GAME_LIST.find(g=>g.id==='letter-leap'),'easy');
  const snapshot=()=>page.evaluate(()=>document.querySelector('.letter-leap').__letterLeapSnapshot());
  await expect.poll(async()=>(await snapshot())?.authoredArt?.delivery?.hero&&Object.values((await snapshot()).authoredArt.delivery.hero).every(x=>x==='delivered')).toBe(true);
  const before=await snapshot();
  const right=player.getByRole('button',{name:'Move right',exact:true}), bounds=await right.boundingBox();
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();
  await page.waitForTimeout(250);await page.mouse.up();
  await expect.poll(async()=>(await snapshot()).player.x).toBeGreaterThan(before.player.x);
  await player.getByRole('button',{name:'Leap right',exact:true}).tap();
  await expect.poll(async()=>(await snapshot()).player.onGround).toBe(false);
  await page.keyboard.press('Escape');
  await expect(player.getByRole('heading',{name:'Leave this game?'})).toBeVisible();
  await page.waitForTimeout(1000);
  const paused=await snapshot(),draws=await page.evaluate(()=>window.__arcadeDraws);
  await page.waitForTimeout(500);
  expect((await snapshot()).player).toEqual(paused.player);
  expect(await page.evaluate(()=>window.__arcadeDraws)).toBe(draws);
  await player.getByRole('button',{name:'Keep playing',exact:true}).tap();
  await player.getByRole('button',{name:'Move left',exact:true}).tap();
  await expect.poll(()=>page.evaluate(()=>window.__arcadeDraws)).toBeGreaterThan(draws);
});
