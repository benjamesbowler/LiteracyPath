import {test,expect} from '@playwright/test';
import {buildCyclePresentation} from '../../src/utils/present/presentationBuilder.js';

async function deckPage(page,cycle='cycle-9',day='friday'){
 const deck=buildCyclePresentation(cycle,{day});
 await page.route('**/present-classroom-test',route=>route.fulfill({contentType:'text/html',headers:{'Content-Security-Policy':"default-src 'self' blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; font-src 'self'"},body:deck.html}));
 await page.goto('/present-classroom-test');await page.getByRole('button',{name:'Start presentation',exact:true}).click();return deck;
}
async function jump(page,deck,cls){const item=deck.slideIndex.find(item=>item.cls===cls);expect(item,cls).toBeTruthy();await page.locator('#overview-toggle').click();await page.locator(`[data-go-slide="${item.index}"]`).click();return page.locator('.slide.active');}

for(const width of [1366,1024,390])test(`simple Present chooser fits at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/preview/teacher-a11y.html?surface=present');
 await expect(page.getByRole('heading',{name:'Present',exact:true})).toBeVisible();
 await expect(page.locator('select')).toHaveCount(2);
 await expect(page.getByLabel('Cycle',{exact:true}).locator('option')).toHaveCount(28);
 await expect(page.getByLabel('Day',{exact:true}).locator('option')).toHaveCount(5);
 await page.getByLabel('Cycle',{exact:true}).selectOption('cycle-9');await page.getByLabel('Day',{exact:true}).selectOption('friday');
 await expect(page.getByRole('button',{name:'Present',exact:true})).toBeEnabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 expect(await page.getByRole('button',{name:'Present',exact:true}).evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
 await expect(page.locator('iframe')).toHaveCount(0);await expect(page.getByText('Teaching stage',{exact:true})).toHaveCount(0);
 await page.screenshot({fullPage:true,path:`.artifacts/present-simplify/home-${width}.png`});
});

test('Present opens the chosen day at its start and blocked windows expose a usable link',async({page})=>{
 await page.goto('/preview/teacher-a11y.html?surface=present');
 await page.getByLabel('Cycle',{exact:true}).selectOption('cycle-9');await page.getByLabel('Day',{exact:true}).selectOption('friday');
 const popup=page.waitForEvent('popup');await page.getByRole('button',{name:'Present',exact:true}).click();const projector=await popup;
 await expect(projector.getByRole('button',{name:'Start presentation',exact:true})).toBeVisible();
 await projector.getByRole('button',{name:'Start presentation',exact:true}).click();await expect(projector.locator('#counter')).toHaveText(/^1 \/ /);
 await expect(projector.locator('#teaching-sequence')).toHaveCount(0);await expect(projector.locator('#rail-title')).toContainText('Friday');await projector.close();
 await page.evaluate(()=>{window.open=()=>null;});await page.getByRole('button',{name:'Present',exact:true}).click();await expect(page.getByRole('link',{name:'Open presentation'})).toHaveAttribute('href',/^blob:/);
});

test('whole spelling preserves errors for checking and supports repair without exposing a copying model',async({page})=>{
 const deck=await deckPage(page),active=await jump(page,deck,'p-word-build');
 const parts=JSON.parse(await active.locator('[data-build-target]').getAttribute('data-build-target'));
 for(const part of [...parts].reverse())await active.locator(`[data-build-part="${part}"]:not(:disabled)`).first().click();
 const draft=await active.locator('.p-build-slot').allTextContents();await active.locator('[data-build-check]').click();expect(await active.locator('.p-build-slot').allTextContents()).toEqual(draft);
 for(let i=0;i<parts.length;i++)await active.locator('[data-build-undo]').click();
 for(const part of parts)await active.locator(`[data-build-part="${part}"]:not(:disabled)`).first().press('Enter');
 await active.locator('[data-build-check]').click();await expect(active.locator('.p-build-feedback')).toContainText(parts.join(''));
 await page.screenshot({path:'.artifacts/present-simplify/spelling.png'});
});

test('matching retains a mismatch until the next turn and all pairs are playable by keyboard',async({page})=>{
 const deck=await deckPage(page),active=await jump(page,deck,'p-sight-match');
 await expect(active.locator('[data-match-word]')).toHaveCount(8);
 const values=await active.locator('[data-match-word]').evaluateAll(nodes=>nodes.map(node=>node.dataset.matchWord));
 const first=values[0],different=values.findIndex(value=>value!==first);
 await active.locator('[data-match-word]').nth(0).press('Enter');await active.locator('[data-match-word]').nth(different).press('Enter');await expect(active.locator('.is-open')).toHaveCount(2);
 await active.locator('[data-match-reset]').click();
 const freshValues=await active.locator('[data-match-word]').evaluateAll(nodes=>nodes.map(node=>node.dataset.matchWord));
 expect(freshValues).not.toEqual(values);
 for(const value of new Set(freshValues))for(const index of freshValues.flatMap((item,i)=>item===value?[i]:[]))await active.locator('[data-match-word]').nth(index).press('Enter');
 await expect(active.locator('[data-match-word]:not(:disabled)')).toHaveCount(0);
 await page.screenshot({path:'.artifacts/present-simplify/memory-eight.png'});
});

test('Play again moves every word even when random shuffling produces the same positions',async({page})=>{
 await page.addInitScript(()=>{Math.random=()=>0.999999;});
 const deck=await deckPage(page),active=await jump(page,deck,'p-sight-match');
 let before=await active.locator('[data-match-word]').evaluateAll(nodes=>nodes.map(node=>node.dataset.matchWord));
 const positions=(values,word)=>values.flatMap((value,i)=>value===word?[i]:[]);
 for(let turn=0;turn<5;turn++){
  await active.locator('[data-match-reset]').click();const after=await active.locator('[data-match-word]').evaluateAll(nodes=>nodes.map(node=>node.dataset.matchWord));
  expect(after).toHaveLength(8);expect([...after].sort()).toEqual([...before].sort());
  for(const word of new Set(before))expect(positions(after,word),word).not.toEqual(positions(before,word));
  await expect(active.locator('.p-card-word:visible')).toHaveCount(0);before=after;
 }
});

test('upper and lower tracing have separate starts, actual pointer ink and no automatic second case',async({page})=>{
 const deck=await deckPage(page,'cycle-8','monday');const active=await jump(page,deck,'p-writing');
 await expect(active).toHaveAttribute('data-letter-case','upper');const svg=active.locator('[data-trace-surface]');await expect(svg).toHaveAccessibleName('Finger trace B');
 await expect(active.locator('[data-pencil]')).toHaveCSS('opacity','0');
 await active.getByRole('button',{name:'Start uppercase',exact:true}).click();await expect(active.locator('[data-write-status]')).toContainText(/Finger ready|Watch/);
 await page.locator('#next').click();await expect(page.locator('.slide.active')).toHaveAttribute('data-letter-case','lower');await expect(page.locator('.slide.active [data-pencil]')).toHaveCSS('opacity','0');
 await expect(page.locator('.slide.active [data-trace-surface]')).toHaveAccessibleName('Finger trace b');
 const bounds=await page.locator('.slide.active [data-trace-surface]').boundingBox();const x=bounds.x+bounds.width*.4,y=bounds.y+bounds.height*.4;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+40,y+50,{steps:5});await page.mouse.up();await expect(page.locator('.slide.active .p-finger-stroke')).toHaveCount(1);
 await page.getByRole('button',{name:'Clear',exact:true}).click();await expect(page.locator('.slide.active .p-finger-stroke')).toHaveCount(0);
 await page.screenshot({path:'.artifacts/present-simplify/tracing.png'});
});

for(const viewport of [{width:1366,height:768},{width:1024,height:768},{width:390,height:844},{width:844,height:390}])test(`writing controls remain clickable above navigation at ${viewport.width}x${viewport.height}`,async({page})=>{
 await page.setViewportSize(viewport);const deck=await deckPage(page,'cycle-9','monday');const active=await jump(page,deck,'p-writing');
 for(const control of await active.locator('.p-write-actions button').all()){
  const bounds=await control.boundingBox(),nav=await page.locator('#next').boundingBox();
  expect(bounds.y+bounds.height).toBeLessThan(nav.y);
  expect(await control.evaluate(el=>{const r=el.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===el;})).toBe(true);
 }
 await active.getByRole('button',{name:'Next letter: U',exact:true}).click();
 await expect(active.locator('[data-trace-surface]')).toHaveAccessibleName('Finger trace U');
 await active.getByRole('button',{name:'Start uppercase U',exact:true}).click();
 await expect(active.locator('[data-write-status]')).toContainText('Finger ready');
 if(viewport.width===1366)await page.screenshot({path:'.artifacts/present-writing-fix/writing-controls.png'});
});

test('completing one letter never selects or plays the next letter',async({page})=>{
 test.setTimeout(60000);
 const deck=await deckPage(page,'cycle-9','monday');const active=await jump(page,deck,'p-writing');
 const svg=active.locator('[data-trace-surface]');
 await expect(svg).toHaveAccessibleName('Finger trace Q');
 await expect(active.locator('[data-writing-letter]:not([hidden])')).toHaveCount(1);
 await active.getByRole('button',{name:'Start uppercase Q',exact:true}).click();
 await expect(active.locator('[data-write-status]')).toContainText('Your turn',{timeout:25000});
 await expect(svg).toHaveAccessibleName('Finger trace Q');
 const nextStroke=active.locator('[data-writing-letter="U"] [data-write-stroke]').first();
 expect(await nextStroke.evaluate(el=>Number.parseFloat(el.style.strokeDashoffset))).toBeGreaterThan(0);
 await page.waitForTimeout(1500);
 await expect(active.locator('[data-writing-letter="U"]')).toHaveAttribute('hidden','');
 await expect(active.locator('[data-write-status]')).toContainText('Your turn');
 await active.getByRole('button',{name:'Next letter: U',exact:true}).click();
 await expect(svg).toHaveAccessibleName('Finger trace U');
 await expect(svg).toHaveAttribute('viewBox','0 0 100 140');
 await expect(active.locator('[data-writing-letter]:not([hidden])')).toHaveCount(1);
 await page.waitForTimeout(1500);
 await expect(active.getByRole('button',{name:'Start uppercase U',exact:true})).toBeVisible();
 await expect(active.locator('[data-pencil]')).toHaveCSS('opacity','0');
 expect(await nextStroke.evaluate(el=>Number.parseFloat(el.style.strokeDashoffset))).toBeGreaterThan(0);
 await active.getByRole('button',{name:'Start uppercase U',exact:true}).click();
 await expect(active.locator('[data-write-status]')).toContainText('Watch the pencil',{timeout:15000});
 await active.getByRole('button',{name:'First letter: Q',exact:true}).click();
 await expect(svg).toHaveAccessibleName('Finger trace Q');
 await expect(active.getByRole('button',{name:'Start uppercase Q',exact:true})).toBeVisible();
 await expect(active.locator('[data-pencil]')).toHaveCSS('opacity','0');
 await page.locator('#next').click();
 await expect(page.locator('.slide.active [data-trace-surface]')).toHaveAccessibleName('Finger trace q');
 await expect(page.locator('.slide.active [data-pencil]')).toHaveCSS('opacity','0');
});

test('three-letter patterns step manually through each letter and clear previous finger ink',async({page})=>{
 const deck=await deckPage(page,'cycle-23','tuesday');const active=await jump(page,deck,'p-writing');
 const svg=active.locator('[data-trace-surface]');
 for(const [letter,next] of [['A','Next letter: N'],['N','Next letter: G'],['G','First letter: A']]){
  await expect(svg).toHaveAccessibleName('Finger trace '+letter);
  await expect(active.locator('[data-writing-letter]:not([hidden])')).toHaveCount(1);
  await expect(active.locator('[data-pencil]')).toHaveCSS('opacity','0');
  const bounds=await svg.boundingBox(),x=bounds.x+bounds.width*.45,y=bounds.y+bounds.height*.4;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+20,y+20,{steps:3});await page.mouse.up();
  await expect(active.locator('.p-finger-stroke')).toHaveCount(1);
  await active.getByRole('button',{name:next,exact:true}).click();
  await expect(active.locator('.p-finger-stroke')).toHaveCount(0);
 }
 await expect(svg).toHaveAccessibleName('Finger trace A');
});

test('sentence verbs update print and matching images with two simple controls',async({page})=>{
 const deck=await deckPage(page),active=await jump(page,deck,'p-sentence-studio');
 await expect(active.locator('.p-studio-print')).toHaveText('A cat sat.');await expect(active.locator('.p-studio-scene')).toBeVisible();
 await active.locator('[data-studio-change]').click();await expect(active.locator('.p-studio-print')).toHaveText('A cat ran.');await expect(active.locator('.p-studio-scene')).toHaveAttribute('src',/cat-ran.webp$/);
 expect(await active.locator('.p-studio-scene').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 await expect(active.locator('[data-sentence-studio] button')).toHaveCount(2);
 await page.screenshot({path:'.artifacts/present-simplify/sentence.png'});
});

test('story progresses scene by scene with text and pictures, then checks a retained sequence',async({page})=>{
 const deck=await deckPage(page),active=await jump(page,deck,'p-retell-story');
 const story=JSON.parse(await active.locator('[data-story]').getAttribute('data-story'));
 for(const event of story.events){await expect(active.locator('[data-story-text]')).toHaveText(event.text);await expect(active.locator('[data-story-panel] img')).toHaveAttribute('src',event.imagePath);await active.locator('[data-story-next]').click();}
 await expect(active.locator('[data-story-sequence]')).toBeVisible();
 for(const id of ['sprout','water','plant'])await active.locator(`[data-retell-event="${id}"]`).click();await active.locator('[data-retell-check]').click();await expect(active.locator('[data-retell-feedback]')).toContainText('Look at your order');
 expect(await active.locator('[data-retell-game]').getAttribute('data-order')).toBe('["sprout","water","plant"]');
 await active.locator('[data-retell-reset]').click();await expect(active.locator('[data-story-panel]')).toBeVisible();
 await page.screenshot({path:'.artifacts/present-simplify/story.png'});
});

test('starting-letter sort keeps a wrong selection and accepts every correct picture group',async({page})=>{
 const deck=await deckPage(page),active=await jump(page,deck,'p-cooperative-sort');const items=active.locator('[data-sort-item]');
 const first=items.first(),group=await first.getAttribute('data-sort-group');await first.click();await active.locator(`[data-sort-bin="${group==='0'?'1':'0'}"]`).click();await expect(first).toBeEnabled();
 for(const item of await items.all()){await item.click();await active.locator(`[data-sort-bin="${await item.getAttribute('data-sort-group')}"]`).click();await expect(item).toBeDisabled();}
 await page.screenshot({path:'.artifacts/present-simplify/sort.png'});
});

for(const viewport of [{width:1920,height:1080},{width:1024,height:768}])test(`quiet slide hierarchy and fit at ${viewport.width}px`,async({page})=>{
 await page.setViewportSize(viewport);const deck=await deckPage(page,'cycle-23','tuesday');
 for(let i=0;i<deck.slideCount;i++){
  await page.locator('#overview-toggle').click();await page.locator(`[data-go-slide="${i}"]`).click();
  const overflow=await page.locator('.slide.active').evaluate(slide=>{const stage=slide.getBoundingClientRect();return [...slide.querySelectorAll('button,img,svg,p,.p-sight,.p-shared-sentence')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).position!=='absolute').flatMap(el=>{const r=el.getBoundingClientRect();return r.right>stage.right+2||r.bottom>stage.bottom+2||r.left<stage.left-2||r.top<stage.top-2?[{tag:el.tagName,cls:el.className,right:r.right-stage.right,bottom:r.bottom-stage.bottom}]:[];});});
  expect(overflow,`slide ${i+1}: ${deck.slideIndex[i].cls}`).toEqual([]);
  const teacherSizes=await page.locator('.slide.active .p-h2,.slide.active .p-teacher-prompt,.slide.active .p-says').evaluateAll(nodes=>nodes.map(el=>parseFloat(getComputedStyle(el).fontSize)));
  expect(teacherSizes.every(size=>size<=26),`slide ${i+1}: teacher prompt sizes ${teacherSizes}`).toBe(true);
 }
 const active=await jump(page,deck,'p-pattern-read');expect(await active.locator('.p-h2').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeLessThan(30);
 await expect(page.locator('#teaching-sequence')).toHaveCount(0);
});

test('Present uses the child app palette and original Muddy, Chompy and Pip art',async({page})=>{
 for(const [cycle,character] of [['cycle-9','muddy'],['cycle-10','chompy'],['cycle-19','pip']]){
  const deck=await deckPage(page,cycle,'monday');const active=await jump(page,deck,'p-letter-slide');
  await expect(page.locator('#stage')).toHaveCSS('background-color','rgb(247, 248, 250)');
  await expect(active.locator('.p-audio').first()).toHaveCSS('background-color','rgb(52, 84, 200)');
  const art=active.locator('.p-pal');await expect(art).toHaveAttribute('src',new RegExp(`/characters/${character}/pose-ready.webp$`));
  expect(await art.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  await page.screenshot({path:`.artifacts/present-simplify/blue-${character}.png`});
 }
});
