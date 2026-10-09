import {expect,test} from '@playwright/test';

const url='/tests/fixtures/literacy-reference.html';
test.beforeEach(async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.__referenceErrors=errors;
});
test.afterEach(async({page})=>expect(page.__referenceErrors).toEqual([]));
test('choose-all keeps the complete exact set editable until one immutable submission',async({page})=>{
  await page.goto(url+'?item=tools');
  await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Select pizza',exact:true}).click();
  await expect(page.getByRole('button',{name:'Select pizza',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Select pizza',exact:true}).click();
  for(const name of ['hammer','wrench','saw']) await page.getByRole('button',{name:'Select '+name,exact:true}).click();
  expect(await page.evaluate(()=>window.__referenceAnswer)).toBeUndefined();
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await expect(page.getByRole('status').last()).toContainText('Correct');
  const saved=await page.evaluate(()=>window.__referenceAnswer);
  expect(new Set(saved.choice)).toEqual(new Set(['hammer','wrench','saw']));
  await expect(page.getByRole('button',{name:'Select pizza',exact:true})).toBeDisabled();
});
test('a partial set is incorrect rather than accepting any keyed member',async({page})=>{
  await page.goto(url+'?item=tools');
  await page.getByRole('button',{name:'Select hammer',exact:true}).click();
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await expect(page.getByRole('status').last()).toContainText('Incorrect');
});
test('dictated spelling hides the target and scores the complete built word',async({page})=>{
  await page.goto(url+'?item=spell-friends');
  const slots=page.getByRole('group',{name:'Choose letters',exact:true});
  await expect(slots.getByRole('button')).toHaveCount(26);
  await expect(page.getByText('friends',{exact:true})).toHaveCount(0);
  for(const letter of 'friends') await slots.getByRole('button',{name:'Add '+letter,exact:true}).click();
  await expect(page.getByRole('status').last()).toContainText('Correct');
  expect((await page.evaluate(()=>window.__referenceAnswer)).choice).toBe('friends');
});
test('printed passage and its replay control are both present',async({page})=>{
  await page.goto(url+'?item=passage-habit');
  await expect(page.locator('.passage')).toContainText('Carlos has a habit.');
  // A missing recording cannot be relabelled as independent delivered audio.
  await expect(page.getByRole('button',{name:'Listen to passage',exact:true})).toBeVisible();
});
test('a repeated letter has separate usable tiles and scores the whole dictated word',async({page})=>{
  await page.goto(url+'?item=spell-summer');
  const letters=page.getByRole('group',{name:'Choose letters',exact:true});
  await expect(letters.getByRole('button',{name:'Add m',exact:true})).toHaveCount(2);
  for(const letter of 'summer') await letters.getByRole('button',{name:'Add '+letter,exact:true}).and(page.locator(':not(:disabled)')).first().click();
  await expect(page.getByRole('status').last()).toContainText('Correct');
  expect((await page.evaluate(()=>window.__referenceAnswer)).choice).toBe('summer');
});
test('a failed required picture does not turn into a scored text-only choice',async({page})=>{
  await page.route('**/literacy-classroom/hammer.webp',route=>route.abort());
  await page.goto(url+'?item=tools');
  await expect(page.getByRole('alert')).toContainText('Required image unavailable');
  expect(await page.evaluate(()=>window.__referenceAnswer)).toBeUndefined();
});
for(const size of [{width:320,height:568},{width:568,height:320},{width:768,height:1024},{width:1024,height:768},{width:1366,height:768}]) {
  test(`multi-select controls remain reachable at ${size.width}x${size.height}`,async({page},info)=>{
    await page.setViewportSize(size);await page.goto(url+'?item=long-a');
    await expect(page.locator('.map-multi-select-option')).toHaveCount(6);
    await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeVisible();
    const widths=await page.locator('.map-multi-select-card').evaluateAll(cards=>cards.map(card=>({card:card.clientWidth,button:card.querySelector('.map-multi-select-option').offsetWidth})));
    expect(widths.every(row=>Math.abs(row.card-row.button)<=2)).toBe(true);
    for(const button of await page.locator('.map-multi-select-option, .map-multi-select-submit').all()) {
      await button.scrollIntoViewIfNeeded();const box=await button.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(size.width+1);
      expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.y+box.height).toBeLessThanOrEqual(size.height+1);
    }
    await page.screenshot({path:info.outputPath('reference-layout.png')});
  });
  test(`pictured spelling and passage selection fit at ${size.width}x${size.height}`,async({page},info)=>{
    await page.setViewportSize(size);
    for(const id of ['spell-friends','passage-penguin-swim']) {
      await page.goto(url+'?item='+id);
      const controls=page.locator(id==='spell-friends'?'.hfw-letter-build-panel button':'.map-multi-select-option, .map-multi-select-submit');
      expect(await controls.count()).toBeGreaterThan(3);
      for(const button of await controls.all()) {
        await button.scrollIntoViewIfNeeded();const box=await button.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(size.width+1);
        expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.y+box.height).toBeLessThanOrEqual(size.height+1);
      }
      await page.screenshot({path:info.outputPath(id+'-layout.png')});
    }
  });
}
