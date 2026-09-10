import { expect, test } from '@playwright/test';
const GAMES={
 'cvc-word-builder':{root:'.pp-build',world:'.pp-workshop-world',controls:'.pp-piece-bank button',text:'.pp-piece-bank button'},
 'sight-word-memory':{root:'.pp-memory',world:'.pp-memory-table',controls:'.pp-memory-card',text:'.pp-card-front'},
 'blend-and-build':{root:'.pp-family',world:'.pp-family-world',controls:'.pp-piece-bank button',text:'.pp-piece-bank button'},
 'pop-the-word':{root:'.pp-target',world:'.pp-target-field',controls:'.pp-word-balloon',text:'.pp-word-balloon'},
 'word-hopscotch':{root:'.pp-sentence',world:'.pp-hop-world',controls:'.pp-hop-stone:not(:disabled)',text:'.pp-hop-stone:not(:disabled)'},
 'reading-race':{root:'.pp-quiz',world:'.pp-repair-world',controls:'.pp-piece-bank button',text:'.pp-piece-bank button'},
 'word-rescue':{root:'.aw-rescue',world:'.aw-landscape',controls:'.aw-controls button',text:'.aw-pickup strong'},
 'sound-sort-factory':{root:'.aw-factory',world:'.aw-machine',controls:'.aw-controls button',text:'.aw-chute strong'},
 'letter-garden':{root:'.aw-garden',world:'.aw-landscape',controls:'.aw-controls button',text:'.aw-pickup strong'}
};
function contrast(a,b){const lum=rgb=>rgb.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
async function open(page,game,sound=0){await page.goto(`/preview/game-overlay.html?game=${game}&sound=${sound}&music=0`);await expect(page.locator(GAMES[game].root)).toBeVisible();}
async function carry(page,value){
 const pickup=page.locator(`[data-aw="pickup"][data-value="${value}"]`),stage=page.locator('.aw-stage');
 for(let i=0;i<25;i++){
  const b=await pickup.boundingBox(),w=await page.locator('[data-aw="world"]').boundingBox();
  if(b&&b.x>=w.x+8&&b.x+b.width<=w.x+w.width-8)break;
  await stage.focus();await page.keyboard.down(b&&b.x<w.x?'ArrowLeft':'ArrowRight');await page.waitForTimeout(250);await page.keyboard.up('ArrowLeft');await page.keyboard.up('ArrowRight');
 }
 await pickup.click();await expect(stage).toHaveAttribute('data-carry',value);await page.getByRole('button',{name:/Carry (plank to bridge|seed to bed)/}).click();await expect(stage).toHaveAttribute('data-carry','',{timeout:15000});
}
for(const viewport of [{width:1024,height:768},{width:568,height:320},{width:390,height:844}])test(`all nine games provide immediate spacious play and reachable controls at ${viewport.width}x${viewport.height}`,async({page})=>{
 test.setTimeout(150000);await page.setViewportSize(viewport);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [game,config]of Object.entries(GAMES)){
  await open(page,game);await expect(page.getByRole('dialog',{name:/How to play/})).toHaveCount(0);await expect(page.getByRole('button',{name:/^(Tap to play|Try a new sentence|Check)$/})).toHaveCount(0);
  const root=page.locator(config.root),world=page.locator(config.world),rootBox=await root.boundingBox(),worldBox=await world.boundingBox();
  expect(rootBox.width,game).toBeGreaterThan(viewport.width*.9);expect(rootBox.height,game).toBeGreaterThan(viewport.height*.65);expect(worldBox.height,game).toBeGreaterThan(100);expect(worldBox.width,game).toBeGreaterThan(rootBox.width*.75);expect(rootBox.y+rootBox.height,game).toBeLessThanOrEqual(viewport.height+.1);
  expect(await page.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight}))).toEqual({w:viewport.width,h:viewport.height});
  const buttons=page.locator(config.controls);await expect(buttons.first()).toBeEnabled();
  for(const button of await buttons.all()){
   const b=await button.boundingBox();expect(b.width,game).toBeGreaterThanOrEqual(55.9);expect(b.height,game).toBeGreaterThanOrEqual(55.9);expect(b.x,game).toBeGreaterThanOrEqual(-.1);expect(b.y,game).toBeGreaterThanOrEqual(-.1);expect(b.x+b.width,game).toBeLessThanOrEqual(viewport.width+.1);expect(b.y+b.height,game).toBeLessThanOrEqual(viewport.height+.1);
   expect(await button.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),game).toBe(true);
  }
  const prompt=root.locator('.pp-prompt,.aw-objective>strong');const lines=await prompt.evaluate(e=>{const r=document.createRange();r.selectNodeContents(e);return new Set([...r.getClientRects()].filter(r=>r.width>0&&r.height>0).map(r=>Math.round(r.top))).size;});expect(lines,game).toBeLessThanOrEqual(game==='letter-garden'?3:2);
  expect(await root.innerText()).not.toMatch(/\b(?:question|section)\s+0?\d+\b/i);
  await expect.poll(()=>root.locator('img').evaluateAll(es=>es.every(e=>e.complete&&e.naturalWidth>0))).toBe(true);
  // Compare the word foreground against every opaque colour stop behind it.
  const pairs=await page.locator(config.text).evaluateAll(es=>es.map(e=>{const parse=s=>(s.match(/[\d.]+/g)||[]).map(Number);let node=e,colors=[];while(node&&!colors.length){const st=getComputedStyle(node);colors=[...st.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m=>parse(m[0])).filter(c=>c.length<4||c[3]>.95);const solid=parse(st.backgroundColor);if(!colors.length&&(solid.length===3||solid[3]>.95))colors=[solid];node=node.parentElement;}return{fg:parse(getComputedStyle(e).color),colors};}));
  for(const pair of pairs)for(const color of pair.colors)expect(contrast(pair.fg,color),game).toBeGreaterThanOrEqual(4.5);
  if(viewport.width===1024){await page.mouse.move(0,0);const before=await buttons.first().evaluate(e=>getComputedStyle(e).filter);await buttons.first().hover();await expect.poll(()=>buttons.first().evaluate(e=>getComputedStyle(e).filter)).not.toBe(before);}
  await page.emulateMedia({reducedMotion:'reduce'});const duration=await buttons.first().evaluate(e=>getComputedStyle(e).transitionDuration);expect(duration.split(',').every(v=>parseFloat(v)<=.001),game).toBe(true);await page.emulateMedia({reducedMotion:'no-preference'});
 }
 expect(errors).toEqual([]);
});
test("the shared resume choice is readable and child-sized", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/game-overlay.html?game=cvc-word-builder&sound=0&music=0&resume=1");

  const resumeDialog = page.getByRole("alertdialog", { name: "Resume CVC Word Builder", exact: true });
  await expect(resumeDialog).toBeVisible();
  await expect(resumeDialog.getByRole("heading", { name: "Welcome back" })).toBeVisible();

  for (const label of ["Continue", "Start over"]) {
    const control = resumeDialog.getByRole("button", { name: label, exact: true });
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(140);
    expect(box?.height).toBeGreaterThanOrEqual(56);
    expect(await control.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
  }
});

test('Garden preserves source letters, replaces only the carried seed and retains the grown plant on reload',async({page})=>{
 test.setTimeout(90000);await open(page,'letter-garden');
 const source=await page.locator('.aw-objective strong>span').innerText(),target=(await page.locator('.aw-objective img').getAttribute('alt')).replace(/^a /i,'').toLowerCase();const index=[...source].findIndex((ch,i)=>ch!==target[i]);expect(index).toBeGreaterThanOrEqual(0);expect([...source].filter((ch,i)=>ch!==target[i])).toHaveLength(1);
 const stable=await page.locator('.aw-word-bed').first().locator('[data-stable-letter]').allTextContents();await carry(page,target[index]);await expect(page.locator('.aw-stage')).toHaveAttribute('data-built','1');expect(await page.locator('.aw-word-bed').first().locator('[data-stable-letter]').allTextContents()).toEqual(stable);await expect(page.locator('.aw-word-bed').first()).toHaveAttribute('aria-label',target);await expect(page.locator('.aw-plant.is-grown').first()).toBeVisible();
 await expect(page.locator('.aw-stage')).toHaveAttribute('data-aw-index','1');const nextTarget=await page.locator('.aw-objective img').getAttribute('alt');await page.reload();const dialog=page.getByRole('alertdialog');if(await dialog.count())await dialog.getByRole('button',{name:'Continue',exact:true}).click();await expect(page.locator('.aw-stage')).toHaveAttribute('data-aw-index','1');expect(await page.locator('.aw-objective img').getAttribute('alt')).toBe(nextTarget);await expect(page.locator('.aw-word-bed').first()).toHaveAttribute('aria-label',target);
});
test('Garden failed picture immediately provides a printed target and keeps source context',async({page})=>{
 await open(page,'letter-garden');const image=page.locator('.aw-objective img'),target=(await image.getAttribute('alt')).replace(/^a /i,'').toLowerCase();const source=await page.locator('.aw-objective strong>span').textContent();await image.dispatchEvent('error');await expect(image).toHaveCount(0);await expect(page.locator('.aw-objective strong>b')).toHaveText(target);await expect(page.locator('.aw-objective strong>span')).toHaveText(source);await expect(page.getByRole('button',{name:'Fetch nearest piece',exact:true})).toBeEnabled();
});
test('Garden pause cancels its cue and deliberate replay starts only one recorded cue',async({page})=>{
 await page.addInitScript(()=>{window.wordPlays=[];const original=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){if(this.src.includes('/audio/production/'))window.wordPlays.push(this.src);return original.apply(this,args);};});await open(page,'letter-garden',1);const replay=page.getByRole('button',{name:'Hear target word',exact:true});await expect(replay).toBeEnabled();await page.getByRole('button',{name:'Close Letter Garden',exact:true}).click();await expect(page.getByRole('alertdialog')).toBeVisible();await page.evaluate(()=>{window.wordPlays=[];});await page.waitForTimeout(900);expect(await page.evaluate(()=>window.wordPlays)).toEqual([]);await page.getByRole('button',{name:'Keep playing',exact:true}).click();await page.waitForTimeout(150);await page.evaluate(()=>{window.wordPlays=[];});await replay.click();await page.waitForTimeout(200);expect(await page.evaluate(()=>window.wordPlays)).toHaveLength(1);
});
test('memory hides face-down answers and announces keyboard revealed and matched cards',async({page})=>{
 await open(page,'sight-word-memory');const cards=page.locator('.pp-memory-card');await expect(cards).toHaveCount(6);const ids=await cards.evaluateAll(es=>es.map(e=>e.dataset.pairId));
 for(let i=0;i<6;i++){await expect(cards.nth(i)).toHaveAccessibleName(`Hidden card ${i+1} of 6`);await expect(cards.nth(i).locator('.pp-card-front')).toHaveAttribute('aria-hidden','true');}
 const word=await cards.first().locator('.pp-card-front').textContent();await cards.first().focus();await page.keyboard.press('Enter');await expect(cards.first()).toHaveAccessibleName(`Revealed card 1 of 6: ${word}`);await expect(cards.first().locator('.pp-card-front')).toHaveAttribute('aria-hidden','false');const second=ids.findIndex((id,i)=>i>0&&id===ids[0]);await cards.nth(second).focus();await page.keyboard.press('Enter');await expect(cards.first()).toHaveAccessibleName(`Matched card 1 of 6: ${word}`);await expect(cards.nth(second)).toHaveAccessibleName(`Matched card ${second+1} of 6: ${word}`);
});
test('Pop stores its directly popped word and keyboard focus steadies the target',async({page})=>{
 await open(page,'pop-the-word');const word=(await page.locator('.pp-prompt').textContent()).replace('Pop ','');const target=page.locator('.pp-word-balloon').getByText(word,{exact:true});await target.focus();const before=await target.boundingBox();await page.waitForTimeout(200);expect(await target.boundingBox()).toEqual(before);await page.keyboard.press('Enter');await expect(page.locator('.pp-collected').first()).toContainText(word);await expect(page.locator('.pp-progress')).toHaveText('1/48');
});
test('Factory states its print task and physically returns a wrong parcel before a correct diversion',async({page})=>{
 test.setTimeout(45000);await open(page,'sound-sort-factory');await expect(page.locator('.aw-objective')).toContainText('Match the first letters');const parcel=page.locator('[data-aw="parcel"]');await expect(parcel).toBeEnabled();const word=(await parcel.locator('strong').innerText()).trim(),bins=await page.locator('[data-aw="chute"]').evaluateAll(es=>es.map(e=>e.dataset.bin));const correct=bins.findIndex(bin=>word.toLowerCase().startsWith(bin.toLowerCase()));expect(correct).toBeGreaterThanOrEqual(0);await page.locator('[data-aw="chute"]').nth(correct===0?1:0).click();await expect(page.locator('.aw-stage')).toHaveAttribute('data-belt-phase','returning');await expect(page.locator('.aw-stage')).toHaveAttribute('data-belt-phase','ready');await expect(parcel.locator('strong')).toHaveText(word);await page.locator('[data-aw="chute"]').nth(correct).click();await expect(page.locator('.aw-stage')).toHaveAttribute('data-aw-index','1');
});

test('a failed primary and fallback picture stops retrying and leaves readable play', async ({ page }) => {
  let imageRequests=0;
  await page.route('**/*',route=>{
    if(route.request().resourceType()==='image'){imageRequests++;return route.abort();}
    return route.continue();
  });
  await open(page,'cvc-word-builder');
  await expect(page.locator('.pp-picture-fallback').first()).toBeVisible();
  const settled=imageRequests;
  await page.waitForTimeout(500);
  expect(imageRequests).toBe(settled);
  await expect(page.locator('.pp-piece-bank button').first()).toBeEnabled();
});

// Longer-outing regression cases: existing six physical Phonics modes.
const scope='fullscreen-overlay-preview';
async function saved(page,mode){return page.evaluate(({scope,mode})=>JSON.parse(localStorage.getItem(`literacy-guide-phonics-play:${scope}:${mode}:easy`)),{scope,mode});}
const games={build:'cvc-word-builder',memory:'sight-word-memory',family:'blend-and-build',target:'pop-the-word',sentence:'word-hopscotch',quiz:'reading-race'};
async function piece(page,label,slot){await page.locator('.pp-piece-bank button').filter({hasText:new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`)}).first().click();await page.locator(`[data-piece-slot="${slot}"]`).click();}
for(const [mode,game]of Object.entries(games))test(`${mode} completes its longer unique outing and preserves shared continuation`,async({page})=>{
 test.setTimeout(180000);page.setDefaultTimeout(10000);await page.setViewportSize(mode==='build'?{width:568,height:320}:mode==='family'?{width:390,height:844}:{width:1024,height:768});
 const source=await(await page.request.get('/src/components/learn/games/games/ArcadePracticeGame.jsx')).text();expect(source).toMatch(/easy:\s*48/);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`/preview/game-overlay.html?game=${game}&sound=0&music=0`);await expect(page.locator(`[data-phonics-mode="${mode}"]`)).toBeVisible();
 await expect.poll(async()=>Boolean(await saved(page,mode))).toBe(true);
 const initial=await saved(page,mode);const state=initial.gameState;let actions=0;
 if(mode==='build'){
  expect(state.rounds).toHaveLength(10);
  for(let r=0;r<state.rounds.length;r++){
   const target=state.rounds[r];
   for(let i=0;i<target.units.length;i++){await piece(page,target.units[i].grapheme,i);actions++;}
   await expect(page.getByRole('button',{name:`Pick up ${target.word}`,exact:true})).toBeVisible();
   if(r===0){
    await page.reload();if(await page.getByRole('button',{name:'Continue',exact:true}).isVisible())await page.getByRole('button',{name:'Continue',exact:true}).click();
    await expect(page.getByRole('button',{name:`Pick up ${target.word}`,exact:true})).toBeVisible();
    await page.screenshot({path:'.artifacts/phonics-outings/build-use-568.png'});
    let imageRequests=0;
    await page.route('**/*',route=>{if(route.request().resourceType()==='image'){imageRequests++;return route.abort();}return route.continue();});
    await page.reload();if(await page.getByRole('button',{name:'Continue',exact:true}).isVisible())await page.getByRole('button',{name:'Continue',exact:true}).click();
    await expect(page.locator('.lg-object-actor text')).toHaveText(target.word);
    const settled=imageRequests;await page.waitForTimeout(400);expect(imageRequests).toBe(settled);
    await page.unroute('**/*');
   }
   await page.getByRole('button',{name:`Pick up ${target.word}`,exact:true}).click();await page.getByRole('button',{name:`Place ${target.word} at ${target.destination}`,exact:true}).click();
   if(r+1<state.rounds.length)await expect.poll(async()=>(await saved(page,mode)).round).toBe(r+1);
  }
 }else if(mode==='memory'){
  expect(state.cards).toHaveLength(48);
  for(let board=0;board<state.boards.length;board++){
   await expect(page.locator('.pp-memory-table')).toHaveAttribute('data-table',String(board));
   for(const id of new Set(state.boards[board].map(c=>c.pairId))){const cards=page.locator(`[data-pair-id="${id}"]`);await cards.nth(0).click();await cards.nth(1).click();actions++;}
  }
 }else if(mode==='family'){
  expect(state.missions).toHaveLength(10);
  for(let r=0;r<state.missions.length;r++){
   const mission=state.missions[r];
   for(const word of mission.targets){await expect(page.locator('.pp-prompt')).toHaveText(`Build ${word}`);await piece(page,word.slice(0,-mission.rime.length),0);actions++;}
   if(r+1<state.missions.length)await expect.poll(async()=>(await saved(page,mode)).round).toBe(r+1);
  }
 }else if(mode==='target'){
  expect(state.words).toHaveLength(48);expect(new Set(state.words).size).toBe(48);
  for(let r=0;r<state.words.length;r++){await expect(page.locator('.pp-prompt')).toHaveText(`Pop ${state.words[r]}`);await page.locator('.pp-word-balloon').getByText(state.words[r],{exact:true}).click();actions++;if(r+1<state.words.length)await expect.poll(async()=>(await saved(page,mode)).round).toBe(r+1);}
 }else if(mode==='sentence'){
  expect(state.sentences).toHaveLength(9);
  for(let r=0;r<state.sentences.length;r++){
   for(const word of state.sentences[r].replace(/[.?!]/g,'').split(/\s+/)){await page.locator('.pp-hop-stone:not(:disabled)').getByText(word,{exact:true}).click();actions++;}
   if(r+1<state.sentences.length)await expect.poll(async()=>(await saved(page,mode)).round).toBe(r+1);
  }
 }else{
  expect(state.fixes).toHaveLength(12);
  for(let r=0;r<state.fixes.length;r++){await piece(page,state.fixes[r].answer,0);actions++;if(r+1<state.fixes.length)await expect.poll(async()=>(await saved(page,mode)).round).toBe(r+1);}
 }
 await expect(page.getByRole('button',{name:'Next level',exact:true})).toBeVisible();
 const before=await page.evaluate(({scope,game})=>JSON.parse(localStorage.getItem(`literacy-guide-learn-games:${scope}`)).games[game],{scope,game});expect(before.plays).toBe(1);
 await page.getByRole('button',{name:'Next level',exact:true}).click();await expect(page.locator(`[data-phonics-mode="${mode}"]`)).toBeVisible();
 const after=await page.evaluate(({scope,game})=>JSON.parse(localStorage.getItem(`literacy-guide-learn-games:${scope}`)).games[game],{scope,game});expect(after.plays).toBe(1);expect(after.checkpoints.medium.level).toBe(0);
 expect(errors).toEqual([]);console.log(`${mode}: ${actions} literacy constructions/recognitions; one saved outing and actual Next`);
});
