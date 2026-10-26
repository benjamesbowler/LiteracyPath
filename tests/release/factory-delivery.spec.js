import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('literacy-guide-adventure-world:fullscreen-overlay-preview:sort:easy')));
const geometry=page=>page.locator('.psw-factory').evaluate(root=>{
  const parcel=root.querySelector('.psw-factory-parcel'),chute=root.querySelector('.psw-factory-chute.is-correct');
  const bounds=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,cx:r.x+r.width/2,cy:r.y+r.height/2};};
  const style=getComputedStyle(parcel),mouth=chute?.querySelector('.psw-chute-mouth');
  return {parcel:bounds(parcel),chute:chute?bounds(chute):null,mouth:mouth?bounds(mouth):null,opacity:Number(style.opacity),translate:style.translate,scale:style.scale,animationState:style.animationPlayState,word:parcel.dataset.word,index:root.dataset.awIndex};
});

for(const [width,height,motion]of[[1280,900,'no-preference'],[390,844,'no-preference'],[568,320,'no-preference'],[390,844,'reduce']])test(`Factory parcel reaches its selected chute at ${width}x${height} ${motion}`,async({page},info)=>{
  test.setTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:motion});
  await page.goto('/preview/game-overlay.html?game=sound-sort-factory&difficulty=easy&sound=0&music=0');
  await page.locator('.psw-factory-parcel').waitFor();
  const sides=new Set(),observations=[];
  for(let attempt=0;attempt<8&&sides.size<2;attempt++){
    const before=await saved(page),item=before.roundSet.sort.items[before.index];
    const chute=page.getByRole('button',{name:`Sort into ${item.bin} chute`,exact:true});
    const side=await chute.evaluate(el=>el.classList.contains('psw-chute-0')?'left':'right');
    await chute.click();await expect(page.locator('.psw-factory')).toHaveAttribute('data-belt-phase','correct');
    if(attempt===0&&motion==='no-preference'){
      await page.waitForTimeout(120);await page.getByRole('button',{name:'Pause Sound Sort Factory',exact:true}).click();
      const stopped=await geometry(page);await page.waitForTimeout(220);const held=await geometry(page);
      expect(held.translate).toBe(stopped.translate);expect(held.scale).toBe(stopped.scale);expect(held.index).toBe(stopped.index);
      expect(held.animationState).toBe('paused');await page.getByRole('button',{name:'Resume game',exact:true}).click();
    }
    await expect.poll(async()=>(await geometry(page)).opacity).toBe(0);
    const after=await geometry(page),destination=after.mouth.width>0?after.mouth:after.chute;
    expect(Math.abs(after.parcel.cx-destination.cx)).toBeLessThan(1);expect(Math.abs(after.parcel.cy-destination.cy)).toBeLessThan(1);
    await expect(chute.locator('strong')).toHaveText(item.bin);await expect(chute.locator('small')).toHaveText(`✓ ${item.word} sorted`);
    const labelVisible=await chute.locator('strong').evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});expect(labelVisible).toBe(true);
    const accepted=await saved(page);expect(accepted.score-before.score).toBe(15);expect(accepted.evidence.firstResponses.length-before.evidence.firstResponses.length).toBe(1);
    if(!sides.has(side))await page.screenshot({path:info.outputPath(`delivered-${side}.png`)});
    sides.add(side);observations.push({side,after});
    await expect(page.locator('.psw-factory')).toHaveAttribute('data-aw-index',String(before.index+1));
  }
  expect([...sides].sort()).toEqual(['left','right']);fs.writeFileSync(info.outputPath('delivery-geometry.json'),JSON.stringify(observations,null,2));
  const beforeReload=await saved(page);await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.locator('.psw-factory')).toHaveAttribute('data-aw-index',String(beforeReload.index));
  expect((await saved(page)).evidence).toEqual(beforeReload.evidence);expect(errors).toEqual([]);
});
