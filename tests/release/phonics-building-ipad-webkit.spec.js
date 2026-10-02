import { mkdir } from 'node:fs/promises';
import { devices, test, expect } from '@playwright/test';
import { WORKSHOP_OBJECTS } from '../../src/utils/workshopObjects.js';

const EVIDENCE='.artifacts/phonics-overhaul/building';
const GAMES=['cvc-word-builder','blend-and-build','letter-garden'];
test.use({...devices['iPad Mini landscape'],browserName:'webkit'});
test.beforeAll(async()=>mkdir(EVIDENCE,{recursive:true}));
async function open(page,game,difficulty){
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(`/preview/game-overlay.html?game=${game}&difficulty=${difficulty}&sound=0`);
  await expect(page.locator('.pb-stage')).toBeVisible();
}
async function checkControls(page){
  for(const button of await page.locator('.pb-stage button:not(:disabled)').all()){
    const r=await button.boundingBox();
    expect(r.width).toBeGreaterThanOrEqual(56);expect(r.height).toBeGreaterThanOrEqual(56);
    expect(r.x).toBeGreaterThanOrEqual(0);expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.x+r.width).toBeLessThanOrEqual(1024+.5);expect(r.y+r.height).toBeLessThanOrEqual(768+.5);
    expect(await button.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
  }
}

  for(const game of GAMES)test(`${game}: pictured target, native touch choice, retry and automatic advance`,async({page})=>{
    await open(page,game,'hard');await checkControls(page);
    const stage=page.locator('.pb-stage'),target=await stage.getAttribute('data-target');
    for(const button of await page.locator('.pb-tile').all()){
      await expect(button).toHaveCSS('border-top-style','solid');
      await expect(button).toHaveCSS('border-top-width','3px');
    }
    await page.screenshot({path:`${EVIDENCE}/${game}-ipad-webkit.png`});
    if(game==='cvc-word-builder'){
      const units=WORKSHOP_OBJECTS[target].units;
      const wrong=(await page.locator('[data-grapheme]').evaluateAll(nodes=>nodes.map(node=>node.dataset.grapheme))).find(part=>part!==units[0].grapheme);
      await page.getByRole('button',{name:`Place ${wrong}`,exact:true}).tap();
      await expect(page.locator('.pb-feedback')).toContainText(`${wrong} is not the next sound in ${target}`);
      for(const unit of units)await page.getByRole('button',{name:`Place ${unit.grapheme}`,exact:true}).tap();
    }else if(game==='blend-and-build'){
      const rime=await page.locator('[data-rime]').getAttribute('data-rime'),expected=target.slice(0,-rime.length);
      const wrong=(await page.locator('[data-onset]').evaluateAll(nodes=>nodes.map(node=>node.dataset.onset))).find(part=>part!==expected);
      await page.getByRole('button',{name:`Join ${wrong} to ${rime}`,exact:true}).tap();
      await expect(page.locator('.pb-feedback')).toContainText(`We need ${target}`);
      await page.getByRole('button',{name:`Join ${expected} to ${rime}`,exact:true}).tap();
    }else{
      const index=Number(await stage.getAttribute('data-change-index'));
      const wrong=(await page.locator('[data-seed]').evaluateAll(nodes=>nodes.map(node=>node.dataset.seed))).find(letter=>letter!==target[index]);
      await page.getByRole('button',{name:`Plant ${wrong}`,exact:true}).tap();
      await expect(page.locator('.pb-feedback')).toContainText(`We need ${target}`);
      await page.getByRole('button',{name:`Plant ${target[index]}`,exact:true}).tap();
      await expect(stage).toHaveAttribute('data-built','1');
    }
    await expect(stage).not.toHaveAttribute('data-target',target);
  });
