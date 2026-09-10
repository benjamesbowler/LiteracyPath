import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
test.use({hasTouch:true});
const snapshot=page=>page.locator('.word-bridge-world').evaluate(el=>el.bridgeSnapshot());
async function advance(page,ms=250){await page.evaluate(ms=>{window.__bridgeSimulatedMs=(window.__bridgeSimulatedMs||0)+ms;},ms);await page.clock.runFor(ms);}
async function walk(page,x){
  let s=await snapshot(page);
  const key=x>s.builder.x?'ArrowRight':'ArrowLeft';
  await page.keyboard.down(key);await advance(page,Math.abs(x-s.builder.x)/310*1000);await page.keyboard.up(key);await advance(page,250);
}
async function tapWorld(page,x,y,touch=false){
  let s=await snapshot(page);
  if(x-s.cameraX<30 || x-s.cameraX>s.W-30){await walk(page,x);s=await snapshot(page);}
  const box=await page.locator('.word-bridge-world canvas').boundingBox();
  if(touch) await page.touchscreen.tap(box.x+x-s.cameraX,box.y+y);
  else await page.mouse.click(box.x+x-s.cameraX,box.y+y);
  await advance(page,Math.abs(s.builder.x-x)/310*1000+150);
}
async function open(page,difficulty='easy',nativeFrames=false){
  await page.clock.install();
  // Exercise the unchanged physics and physical inputs at a low-tier 20fps cadence.
  if(!nativeFrames) await page.addInitScript(() => { window.__bridgeRenderedFrames = 0; window.requestAnimationFrame = fn => window.setTimeout(() => { window.__bridgeRenderedFrames++; fn(performance.now()); }, 50); window.cancelAnimationFrame = id => window.clearTimeout(id); });
  await page.goto(`/preview/game-overlay.html?game=word-bridge&difficulty=${difficulty}&sound=0&music=0`);
  await expect(page.locator('.word-bridge-world')).toBeVisible({timeout:25000});await advance(page,100);
}
for(const difficulty of ['easy','medium','hard'])test(`Word Bridge ${difficulty} ten physical construction crossings`,async({page},info)=>{
  test.setTimeout(360000);await open(page,difficulty);
  const progress=[];
  for(let stage=0;stage<10;stage++){
    let s=await snapshot(page);expect(s.stageIdx).toBe(stage);
    for(let i=0;i<s.slots.length;i++){
      s=await snapshot(page);const tile=s.tiles.find(t=>!t.placed&&t.correct&&t.glyph.toLowerCase()===s.slots[i].needed.toLowerCase());
      await tapWorld(page,tile.x,tile.y);s=await snapshot(page);expect(s.builder.carrying?.glyph).toBe(tile.glyph);
      await tapWorld(page,s.slots[i].x+s.slots[i].w/2,s.slots[i].y+25);s=await snapshot(page);expect(s.slots[i].filled).toBe(true);
    }
    if(stage===0)await page.screenshot({path:info.outputPath(`${difficulty}-built.png`)});
    s=await snapshot(page);expect(s.phase).toBe('BELL_READY');await tapWorld(page,s.bell.x,s.bell.y);expect((await snapshot(page)).phase).toBe('PALS_CROSSING');
    s=await snapshot(page);
    const crossingMs=Math.max(...s.pals.filter(pal=>pal.state!=="crossed").map(pal=>(s.worldWidth-24-pal.x)/pal.speed*1000));
    await advance(page,crossingMs+1900);
    const state=await snapshot(page);
    progress.push({stage:stage+1, completed:state.wordsDone, phase:state.phase, ...await page.evaluate(()=>({simulatedSeconds:window.__bridgeSimulatedMs/1000, renderedFrames:window.__bridgeRenderedFrames}))});
    await writeFile(info.outputPath(`${difficulty}-progress.json`),JSON.stringify(progress,null,2));
  }
  await expect(page.getByRole('alertdialog',{name:'Word Bridge complete',exact:true})).toBeVisible();
});
test('Word Bridge exact tapped piece and local mistake recovery survive pause',async({page})=>{
  await open(page);let s=await snapshot(page);const wrong=s.tiles.find(t=>!t.correct);
  await tapWorld(page,wrong.x,wrong.y);s=await snapshot(page);expect(s.builder.carrying.glyph).toBe(wrong.glyph);
  await tapWorld(page,s.slots[0].x+s.slots[0].w/2,s.slots[0].y+25);s=await snapshot(page);
  expect(s.levelMistakes).toBe(1);const returned=s.tiles.find(t=>t.glyph===wrong.glyph&&!t.placed);expect(Math.abs(returned.x-s.builder.x)).toBeLessThan(150);
  const correct=s.tiles.find(tile=>tile.correct&&!tile.placed&&tile.glyph===s.slots[0].needed);
  await tapWorld(page,correct.x,correct.y);s=await snapshot(page);await tapWorld(page,s.slots[0].x+s.slots[0].w/2,s.slots[0].y+25);s=await snapshot(page);expect(s.slots[0].filled).toBe(true);
  await page.keyboard.press('Escape');const x=s.builder.x;await advance(page,5000);expect((await snapshot(page)).builder.x).toBe(x);
  await page.getByRole('button',{name:'Keep playing',exact:true}).click();await page.keyboard.down('ArrowRight');await advance(page,300);await page.keyboard.up('ArrowRight');expect((await snapshot(page)).builder.x).toBeGreaterThan(x);
});
for(const size of [{width:390,height:844},{width:844,height:390}])test(`Word Bridge visible construction ${size.width}x${size.height}`,async({page},info)=>{
  await page.setViewportSize(size);await open(page,'hard',true);const s=await snapshot(page);expect(s.slots.every(t=>t.w>=56&&t.h>=56)).toBe(true);
  const tile=s.tiles.find(t=>t.correct);await tapWorld(page,tile.x,tile.y,true);expect((await snapshot(page)).builder.carrying?.glyph).toBe(tile.glyph);
  await page.screenshot({path:info.outputPath('construction.png')});
});

test('Word Bridge reopens its checkpoint and finishes with all ten bridges counted',async({page},info)=>{
  test.setTimeout(90000);await open(page,'hard');
  await page.evaluate(async()=>{const {saveGameCheckpoint}=await import('/src/utils/learnGamesProgress.js');saveGameCheckpoint('fullscreen-overlay-preview','word-bridge','hard',9,10);});
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();await advance(page,100);
  let s=await snapshot(page);expect(s.stageIdx).toBe(9);expect(s.wordsDone).toBe(9);
  for(let i=0;i<s.slots.length;i++){
    s=await snapshot(page);const tile=s.tiles.find(t=>!t.placed&&t.correct&&t.glyph.toLowerCase()===s.slots[i].needed.toLowerCase());
    await tapWorld(page,tile.x,tile.y);s=await snapshot(page);await tapWorld(page,s.slots[i].x+s.slots[i].w/2,s.slots[i].y+25);
  }
  s=await snapshot(page);await tapWorld(page,s.bell.x,s.bell.y);s=await snapshot(page);await advance(page,Math.max(...s.pals.filter(p=>p.state!=="crossed").map(p=>(s.worldWidth-24-p.x)/p.speed*1000))+1900);
  const result=page.getByRole('alertdialog',{name:'Word Bridge complete',exact:true});await expect(result).toBeVisible();await expect(result).toContainText('10');
  await expect(result.getByLabel('3 out of 3 stars',{exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath('resumed-finish.png')});
});
