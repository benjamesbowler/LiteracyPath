import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {COMPREHENSION_PASSAGES as passages} from '../../src/content/comprehension/passages.js';
import {COMPREHENSION_EXPANSION_IDS} from '../../src/content/comprehension/expansionPassages.js';
import {groupCompletionKey} from '../../src/content/comprehension/groupCompletion.js';

test.beforeEach(async({page})=>{
 // Other authoring workers can add story assets while these tests run. Keep
 // the current test document stable rather than reloading it for each asset.
 await page.route('**/@vite/client',async route=>{const response=await route.fetch();const body=(await response.text()).replace('case "full-reload":','case "full-reload": return;').replace('case "update":','case "update": return;');await route.fulfill({response,body});});
});

const fixture='/tests/fixtures/comprehension-group-completion.html';
const first=passages[0];
const checkName=`Whole group completed: ${first.title}`;
const scope='teacher-a:class:class-a';
async function open(page){await page.goto(fixture);await expect(page.getByRole('checkbox',{name:checkName,exact:true})).toBeVisible();}

test('teacher class check survives reload, stays separate from print selection and can be undone in fullscreen',async({page})=>{
 await open(page);
 await page.getByRole('checkbox',{name:checkName,exact:true}).check();
 await expect(page.locator('.rc-batch h2')).toHaveText('Print pack · 0 selected');
 await page.getByRole('combobox',{name:'Whole group',exact:true}).selectOption('completed');
 await expect(page.locator('.rc-card')).toHaveCount(1);
 await expect(page.locator('.rc-card')).toHaveAttribute('data-group-completed','true');
 await page.reload();
 await expect(page.getByRole('checkbox',{name:checkName,exact:true})).toBeChecked();
 await page.getByRole('combobox',{name:'Whole group',exact:true}).selectOption('todo');
 await expect(page.getByRole('checkbox',{name:checkName,exact:true})).toHaveCount(0);
 await page.getByRole('combobox',{name:'Whole group',exact:true}).selectOption('all');
 await page.getByRole('button',{name:`Read ${first.title}`,exact:true}).click();
 await expect(page.getByRole('checkbox',{name:checkName,exact:true})).toBeChecked();
 await page.getByRole('button',{name:'Full screen',exact:true}).click();
 const stage=page.locator('[data-fullscreen-lesson]');
 await stage.getByRole('checkbox',{name:checkName,exact:true}).uncheck();
 await page.getByRole('button',{name:`Exit full screen: ${first.title}`,exact:true}).click();
 await expect(page.getByRole('checkbox',{name:checkName,exact:true})).not.toBeChecked();
 await page.reload();
 await expect(page.getByRole('checkbox',{name:checkName,exact:true})).not.toBeChecked();
});


test('the New 100 collection selects exactly its matching worksheets for a print pack',async({page})=>{
 await open(page);
 await page.getByRole('combobox',{name:'Collection',exact:true}).selectOption('expansion');
 expect(COMPREHENSION_EXPANSION_IDS).toHaveLength(100);
 await expect(page.locator('.rc-card')).toHaveCount(COMPREHENSION_EXPANSION_IDS.length);
 await page.getByRole('button',{name:'Select shown',exact:true}).click();
 await expect(page.locator('.rc-batch h2')).toHaveText(`Print pack · ${COMPREHENSION_EXPANSION_IDS.length} selected`);
 await expect(page.locator('.rc-catalogue .rc-batch-choice input:checked')).toHaveCount(COMPREHENSION_EXPANSION_IDS.length);
});


test('filtered completion changes retain a reachable keyboard focus',async({page})=>{
 await open(page);
 await page.getByRole('combobox',{name:'Whole group',exact:true}).selectOption('todo');
 // The filtered card disappears on click, so verify the resulting list/focus
 // rather than asking Playwright to re-find the removed checkbox.
 await page.getByRole('checkbox',{name:checkName,exact:true}).click();
 await expect(page.getByRole('checkbox',{name:`Whole group completed: ${passages[1].title}`,exact:true})).toBeFocused();
 await page.getByRole('combobox',{name:'Whole group',exact:true}).selectOption('completed');
 await expect(page.getByRole('checkbox',{name:checkName,exact:true})).toBeChecked();
 await page.getByRole('checkbox',{name:checkName,exact:true}).click();
 await expect(page.getByRole('heading',{name:'Reading Comprehension passages',exact:true})).toBeFocused();
});

test('class or teacher changes cannot inherit checks and no-class controls explain their disabled state',async({page})=>{
 await open(page);await page.getByRole('checkbox',{name:checkName,exact:true}).check();
 await page.getByRole('combobox',{name:'Fixture class',exact:true}).selectOption('class-b');
 await expect(page.getByRole('checkbox',{name:checkName,exact:true})).not.toBeChecked();
 await page.getByRole('combobox',{name:'Fixture class',exact:true}).selectOption('class-a');
 await expect(page.getByRole('checkbox',{name:checkName,exact:true})).toBeChecked();
 await page.getByRole('combobox',{name:'Fixture teacher',exact:true}).selectOption('teacher-b');
 await expect(page.getByRole('checkbox',{name:checkName,exact:true})).not.toBeChecked();
 await page.getByRole('combobox',{name:'Fixture class',exact:true}).selectOption('');
 await expect(page.getByRole('checkbox',{name:checkName,exact:true})).toBeDisabled();
 await expect(page.locator('.rc-group-status')).toHaveText('Select a class to keep whole-group completion checks.');
 await page.getByRole('button',{name:`Read ${first.title}`,exact:true}).click();
 await expect(page.getByRole('checkbox',{name:checkName,exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Full screen',exact:true}).click();
 await expect(page.locator('[data-fullscreen-lesson]').getByRole('checkbox',{name:checkName,exact:true})).toBeDisabled();
 await expect(page.locator('.rc-lesson-status')).toContainText('Select a class');
});

test('student practice completion never changes a teacher class check',async({page})=>{
 await page.goto(`${fixture}?child=1`);
 await expect(page.getByRole('checkbox',{name:/Whole group completed/})).toHaveCount(0);
 await page.getByRole('button',{name:`Read ${first.title}`,exact:true}).click();
 for(const [index,question] of first.questions.entries()){
  await page.locator('.rc-options').getByRole('button',{name:question.answer,exact:true}).click();
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await page.getByRole('button',{name:index===first.questions.length-1?'Finish practice':'Next question',exact:true}).click();
 }
 await expect(page.getByRole('heading',{name:'You finished this practice!',exact:true})).toBeVisible();
 await open(page);await expect(page.getByRole('checkbox',{name:checkName,exact:true})).not.toBeChecked();
});


test('checks refresh in another open tab without overwriting other passages',async({page,context})=>{
 await open(page);
 const other=await context.newPage();await open(other);
 await page.getByRole('checkbox',{name:checkName,exact:true}).check();
 await expect(other.getByRole('checkbox',{name:checkName,exact:true})).toBeChecked();
 const secondName=`Whole group completed: ${passages[1].title}`;
 await other.getByRole('checkbox',{name:secondName,exact:true}).check();
 await expect(page.getByRole('checkbox',{name:secondName,exact:true})).toBeChecked();
 await expect(page.getByRole('checkbox',{name:checkName,exact:true})).toBeChecked();
 await other.close();
});

test('denied storage keeps a usable unsaved check and reports the limitation',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('denied');}});});
 await open(page);await page.getByRole('checkbox',{name:checkName,exact:true}).check();
 await expect(page.getByRole('checkbox',{name:checkName,exact:true})).toBeChecked();
 await expect(page.locator('.rc-group-status')).toContainText('could not save or load');
 await page.reload();await expect(page.getByRole('checkbox',{name:checkName,exact:true})).not.toBeChecked();
 await expect(page.locator('.rc-group-status')).toContainText('could not save or load');
});

test('corrupt checks are not displayed as completion',async({page})=>{
 await page.addInitScript(({key})=>localStorage.setItem(key,'{"version":1,"passageId":"wrong","completed":true}'),{key:groupCompletionKey(scope,first.id)});
 await open(page);
 await expect(page.getByRole('checkbox',{name:checkName,exact:true})).not.toBeChecked();
 await expect(page.locator('.rc-group-status')).toContainText('could not be read');
});


test('small-phone whole-group lessons fit long choices beside the saved completion control',async({page})=>{
 await page.setViewportSize({width:320,height:568});await open(page);
 for(const id of ['muddy-rain','pip-night','pip-hop-spots','chips-long-ribbon','socks-meet-tree','socks-coat-pocket']){
  const passage=passages.find(value=>value.id===id);
  await page.getByRole('button',{name:`Read ${passage.title}`,exact:true}).click();
  await page.getByRole('button',{name:'Full screen',exact:true}).click();
  await page.getByRole('button',{name:'Questions',exact:true}).click();
  for(let index=0;index<3;index++){
   const defects=await page.locator('[data-fullscreen-lesson]').evaluate(root=>{
    const bounds=root.getBoundingClientRect();
    return [...root.querySelectorAll('button,label,section,.rc-options')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').flatMap(el=>{
     const rect=el.getBoundingClientRect(),failures=[];
     if(rect.top<bounds.top-1||rect.bottom>bounds.bottom+1||rect.left<bounds.left-1||rect.right>bounds.right+1)failures.push(`${el.textContent}: outside viewport`);
     if(el.matches('button,section,.rc-options')&&(el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1))failures.push(`${el.textContent}: clipped content`);
     if(el.tagName==='BUTTON'&&(rect.height<43.5||rect.width<43.5))failures.push(`${el.textContent}: small target`);
     return failures;
    });
   });
   expect(defects,`${id}: question ${index+1}`).toEqual([]);
   await expect(page.locator('[data-fullscreen-lesson]').getByRole('checkbox',{name:`Whole group completed: ${passage.title}`,exact:true})).toBeVisible();
   if(index<2)await page.getByRole('button',{name:'Next',exact:true}).click();
  }
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'← All passages',exact:true}).click();
 }
});


test('long saving and voice notices use the paged lesson area without squeezing choices',async({page})=>{
 await page.setViewportSize({width:320,height:568});
 await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('denied');}});});
 await page.route('**/audio/production/en-US/comprehension/**',route=>route.abort());
 await open(page);
 const passage=passages.find(value=>value.id==='chips-long-ribbon');
 await page.getByRole('button',{name:`Read ${passage.title}`,exact:true}).click();
 await page.getByRole('button',{name:'Full screen',exact:true}).click();
 await page.getByRole('button',{name:'Questions',exact:true}).click();
 await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Next',exact:true}).click();
 const stage=page.locator('[data-fullscreen-lesson]');
 async function fit(){
  const failures=await stage.evaluate(root=>[...root.querySelectorAll('button,section,.rc-options')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').filter(el=>el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1||el.getBoundingClientRect().bottom>root.getBoundingClientRect().bottom+1).map(el=>el.textContent));
  expect(failures).toEqual([]);
 }
 await fit();await page.getByRole('button',{name:'Saving help',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Lesson status',exact:true})).toBeVisible();
 await expect(stage.locator('[data-lesson-text="lesson status"]')).toContainText('Group checks could not be saved');
 await fit();await page.getByRole('button',{name:'Back to lesson',exact:true}).click();await fit();
 await page.getByRole('button',{name:'Hear question and choices',exact:true}).click();
 await expect(page.getByRole('button',{name:'Voice help',exact:true})).toBeVisible();
 await fit();await page.getByRole('button',{name:'Voice help',exact:true}).click();
 const text=[];
 for(let index=0;index<20;index++){
  text.push(await stage.locator('[data-lesson-text="lesson status"]').innerText());await fit();
  const next=page.getByRole('button',{name:'Next lesson status page',exact:true});
  if(await next.isDisabled())break;
  await next.click();
 }
 expect(text.join(' ')).toContain('Group checks could not be saved');
 expect(text.join(' ')).toMatch(/Leda audio (could not|is unavailable)/);
 await page.getByRole('button',{name:'Back to lesson',exact:true}).click();await fit();
 await expect(stage.getByRole('checkbox',{name:`Whole group completed: ${passage.title}`,exact:true})).toBeVisible();
});


test('phone story pagination measures rendered word runs and keeps every word with marks enabled',async({page})=>{
 for(const [id,width,height] of [['pip-third-plant',320,568],['chips-stamp-pattern',568,320]]){
  await page.setViewportSize({width,height});await open(page);
  const passage=passages.find(value=>value.id===id);
  await page.getByRole('button',{name:`Read ${passage.title}`,exact:true}).click();
  await page.getByRole('button',{name:'Full screen',exact:true}).click();
  await page.evaluate(()=>document.fonts.ready);
  await page.getByRole('button',{name:'Mark phonics words',exact:true}).click();
  async function readPages(kind){
   const text=[];
   for(let index=0;index<60;index++){
    const current=page.locator(`[data-lesson-text="${kind}"]:visible`);
    expect(await current.evaluate(el=>el.getBoundingClientRect().height-el.parentElement.getBoundingClientRect().height)).toBeLessThanOrEqual(.5);
    text.push((await current.innerText()).trim());
    const next=page.getByRole('button',{name:`Next ${kind} page`,exact:true});
    if(await next.isDisabled())return text.join(' ');
    await next.click();
   }
   throw Error('Pager did not finish');
  }
  expect(await readPages('story')).toBe(passage.text);
  await page.getByRole('button',{name:'Words',exact:true}).click();
  const help=await readPages('word help');
  expect(help).toMatch(/^Pattern words:/);
  for(const [word,meaning] of passage.wordHelp)expect(help).toContain(`${word}: ${meaning}`);
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'← All passages',exact:true}).click();
 }
});

for(const [width,height] of [[320,568],[568,320],[768,1024],[1024,768],[1366,768],[1920,1080]]){
 test(`group checkbox fits catalogue and full-screen lesson at ${width}x${height}`,async({page},testInfo)=>{
  await page.setViewportSize({width,height});await open(page);
  await page.getByRole('checkbox',{name:checkName,exact:true}).check();
  await page.getByRole('button',{name:`Read ${first.title}`,exact:true}).click();
  await page.getByRole('button',{name:'Full screen',exact:true}).click();
  await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.fonts.check('16px Andika'))).toBe(true);
  const checkbox=page.locator('[data-fullscreen-lesson]').getByRole('checkbox',{name:checkName,exact:true});
  await expect(checkbox).toBeVisible();await expect(checkbox).toBeChecked();
  const overflow=await page.locator('[data-fullscreen-lesson]').evaluate(root=>{
   const rect=root.getBoundingClientRect();
   return [...root.querySelectorAll('button,h1,h2,p,label,fieldset,section')].filter(element=>element.getClientRects().length&&getComputedStyle(element).visibility!=='hidden'&&!element.classList.contains('rc-text-measure')).filter(element=>{const value=element.getBoundingClientRect();return value.left<rect.left-1||value.right>rect.right+1||value.top<rect.top-1||value.bottom>rect.bottom+1;}).map(element=>element.textContent);
  });
  expect(overflow).toEqual([]);
  const violations=(await new AxeBuilder({page}).include('[data-fullscreen-lesson]').analyze()).violations.map(value=>value.id);
  expect(violations).toEqual([]);
  await page.screenshot({path:testInfo.outputPath(`group-completion-${width}x${height}.png`)});
 });
}
