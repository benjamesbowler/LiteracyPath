import { expect, test } from '@playwright/test';
test.describe.configure({timeout:90000});
const url='/tests/fixtures/literacy-reference.html?item=';
async function question(page,id){await page.goto(url+id);await expect(page.locator('[data-map-format]')).toBeVisible();return page.evaluate(()=>window.__referenceQuestion);}
const tile=(page,q,id)=>page.getByRole('button',{name:'Pick '+(q.answerOptions.find(o=>o.value===id).image?'picture '+(q.answerOptions.findIndex(o=>o.value===id)+1):q.answerOptions.find(o=>o.value===id).label),exact:true}).first();
async function place(page,q,ids){
  for(let i=0;i<ids.length;i++){await tile(page,q,ids[i]).click();await page.getByRole('button',{name:'Place in space '+(i+1),exact:true}).click();}
}
async function pointerDrag(page,source,target){
  const a=await source.boundingBox(),b=await target.boundingBox();
  await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:12});await page.mouse.up();
}
test.beforeEach(async({page})=>{page.__mapErrors=[];page.on('pageerror',e=>page.__mapErrors.push(e.message));});
test.afterEach(async({page})=>expect(page.__mapErrors).toEqual([]));
test('three picture story: drag, edit order, remove, reload draft, exact whole scoring',async({page},info)=>{
  await page.setViewportSize({width:1024,height:700});
  const q=await question(page,'pictures.seed-1'),key=JSON.parse(q.answer);
  await expect(page.locator('.passage')).toHaveText(q.passage);
  await expect(page.getByRole('button',{name:'Listen to passage',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeDisabled();
  await pointerDrag(page,tile(page,q,key[2]),page.getByRole('button',{name:'Place in space 1',exact:true}));
  await expect(page.getByRole('button',{name:'Remove from space 1',exact:true})).toBeVisible();
  await page.reload();await expect(page.getByRole('button',{name:'Remove from space 1',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>window.__referenceAnswer)).toBeUndefined();
  await page.getByRole('button',{name:'Remove from space 1',exact:true}).click();
  await place(page,q,key);
  for(const button of await page.locator('.map-interaction-panel button').all()){
    const box=await button.boundingBox();expect(box.y+box.height).toBeLessThanOrEqual(701);
  }
  expect(await page.evaluate(()=>window.__referenceAnswer)).toBeUndefined();
  await page.screenshot({path:info.outputPath('picture-order-complete.png')});
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await expect(page.getByRole('status').last()).toContainText('Correct');
  expect((await page.evaluate(()=>window.__referenceAnswer)).choice).toBe(q.answer);
  await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeDisabled();
});
test('wrong order of all correct pictures is incorrect',async({page})=>{
  const q=await question(page,'pictures.snack-2');await place(page,q,JSON.parse(q.answer).reverse());
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await expect(page.getByRole('status').last()).toContainText('Incorrect');
});
test('keyboard selection and placement construct a sentence without copying the model',async({page})=>{
  const q=await question(page,'mock.sentence.under');
  for(const [i,id] of JSON.parse(q.answer).entries()){
    await tile(page,q,id).focus();await page.keyboard.press('Space');
    await page.getByRole('button',{name:'Place in space '+(i+1),exact:true}).focus();await page.keyboard.press('Space');
  }
  expect(await page.evaluate(()=>window.__referenceAnswer)).toBeUndefined();
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await expect(page.getByRole('status').last()).toContainText('Correct');
});
test('spelling uses separate repeated-letter tiles and stays editable',async({page})=>{
  await question(page,'spell-summer');
  for(const [i,letter] of [...'summer'].entries()){
    await page.getByRole('button',{name:'Pick '+letter,exact:true}).first().click();
    await page.getByRole('button',{name:'Place in space '+(i+1),exact:true}).click();
  }
  expect(await page.evaluate(()=>window.__referenceAnswer)).toBeUndefined();
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await expect(page.getByRole('status').last()).toContainText('Correct');
  expect((await page.evaluate(()=>window.__referenceAnswer)).choice).toBe('summer');
});
test('matching, selectable text and three-picture choices score their exact response',async({page})=>{
  let q=await question(page,'mock.letters.round');await place(page,q,JSON.parse(q.answer));
  await page.getByRole('button',{name:'Check answer',exact:true}).click();await expect(page.getByRole('status').last()).toContainText('Correct');
  q=await question(page,'mock.text.capital-name');
  await page.getByRole('button',{name:'Select word 3: maya',exact:true}).click();await expect(page.getByRole('status').last()).toContainText('Correct');
  q=await question(page,'story-picture.kite-1');
  const at=q.answerOptions.findIndex(o=>o.value===q.answer);
  await page.getByRole('button',{name:'Choose picture '+(at+1),exact:true}).click();await expect(page.getByRole('status').last()).toContainText('Correct');
});
test('failed story picture cannot produce a scored text-only answer',async({page})=>{
  await page.route('**/literacy-interactions/seed-2.webp',r=>r.abort());
  await question(page,'pictures.seed-1');await expect(page.getByRole('alert')).toContainText('Required image unavailable');
  expect(await page.evaluate(()=>window.__referenceAnswer)).toBeUndefined();
});
test('pointer cancellation and dropping outside keep an unfinished answer unscored',async({page})=>{
  const q=await question(page,'mock.sentence.puppy'),source=tile(page,q,JSON.parse(q.answer)[0]);
  const box=await source.boundingBox();await page.mouse.move(box.x+10,box.y+10);await page.mouse.down();await page.mouse.move(3,3);await page.mouse.up();
  await expect(page.locator('.map-placement-status')).toHaveText('0 of 3 placed.');
  const target=await page.getByRole('button',{name:'Place in space 1',exact:true}).boundingBox();
  await page.mouse.move(box.x+10,box.y+10);await page.mouse.down();
  await page.mouse.move(target.x+10,target.y+10,{steps:6});
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.mouse.up();
  await expect(page.locator('.map-placement-status')).toHaveText('0 of 3 placed.');
  await place(page,q,JSON.parse(q.answer));await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeEnabled();
});
test('actual touch drag moves a letter to its chosen space',async({page,browserName})=>{
  test.skip(browserName!=='chromium','CDP touch input is Chromium only; WebKit exercises pointer and keyboard.');
  const q=await question(page,'mock.build.cat'),source=tile(page,q,'c0'),target=page.getByRole('button',{name:'Place in space 1',exact:true});
  const a=await source.boundingBox(),b=await target.boundingBox(),cdp=await page.context().newCDPSession(page);
  const x=a.x+a.width/2,y=a.y+a.height/2,tx=b.x+b.width/2,ty=b.y+b.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let n=1;n<=10;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(tx-x)*n/10,y:y+(ty-y)*n/10}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.getByRole('button',{name:'Remove from space 1',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>window.__referenceAnswer)).toBeUndefined();
});
for(const size of [{width:1024,height:768},{width:1024,height:700},{width:768,height:1024}])test('complete story, tiles and actions fit without scrolling '+size.width+'x'+size.height,async({page},info)=>{
  await page.setViewportSize(size);
  for(const id of ['pictures.seed-2','pictures.kite-2','pictures.snack-2','story-picture.snack-1','mock.sentence.before','mock.sequence.harvest','mock.letters.similar','mock.text.capital-place','spell-friends']){
    await question(page,id);await page.evaluate(()=>document.fonts.ready);
    await expect(page.locator('.assessment-question-layout')).toHaveCSS('opacity','1');
    await page.waitForTimeout(300);
    for(const element of await page.locator('.map-interaction-panel button, .passage').all()){
      const box=await element.boundingBox();
      expect(box.x,id).toBeGreaterThanOrEqual(0);expect(box.x+box.width,id).toBeLessThanOrEqual(size.width+1);
      expect(box.y,id).toBeGreaterThanOrEqual(0);expect(box.y+box.height,id).toBeLessThanOrEqual(size.height+1);
      if(await element.evaluate(el=>el.tagName==='BUTTON')){expect(box.width,id).toBeGreaterThanOrEqual(44);expect(box.height,id).toBeGreaterThanOrEqual(44);}
    }
    const scrolling=await page.locator('.map-interaction-panel').evaluate(el=>{
      const result=[];for(let node=el;node;node=node.parentElement)if(node.scrollHeight>node.clientHeight+2&&['auto','scroll','hidden','clip'].includes(getComputedStyle(node).overflowY))result.push(node.className);return result;
    });expect(scrolling,id).toEqual([]);
    if(id==='pictures.seed-2')await page.screenshot({path:info.outputPath('map-fit.png')});
  }
});
