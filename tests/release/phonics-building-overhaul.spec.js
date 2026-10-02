import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { WORKSHOP_OBJECTS } from '../../src/utils/workshopObjects.js';
import { cvcWorkshopRoundCount } from '../../src/utils/buildingGrowingRounds.js';
import { BUILDING_FAMILIES, GARDEN_LETTER_CONTRASTS, buildPhonicsBlendMissions } from '../../src/components/learn/games/games/phonicsBuildingRounds.js';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';

const EVIDENCE = '.artifacts/phonics-overhaul/building';
const GAMES = ['cvc-word-builder', 'blend-and-build', 'letter-garden'];
test.beforeAll(async () => mkdir(EVIDENCE, { recursive: true }));
async function open(page, game, difficulty = 'easy', sessionSeed) {
  if (sessionSeed !== undefined) await page.addInitScript(({game, difficulty, sessionSeed, totalLevels}) => {
    localStorage.setItem('literacy-guide-learn-games:fullscreen-overlay-preview', JSON.stringify({v:1,games:{[game]:{checkpoints:{[difficulty]:{level:0,totalLevels,sessionSeed}}}}}));
  }, {game, difficulty, sessionSeed, totalLevels:buildPhonicsBlendMissions(difficulty).length});
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/preview/game-overlay.html?game=${game}&difficulty=${difficulty}&sound=0`);
  if (sessionSeed !== undefined) await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.locator('.pb-stage')).toBeVisible();
}

test('Blend clamps a legacy checkpoint whose local content envelope is missing, then restores its new exact deck', async ({page}) => {
  await page.addInitScript(() => { if(!localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview'))localStorage.setItem('literacy-guide-learn-games:fullscreen-overlay-preview', JSON.stringify({v:1,games:{'blend-and-build':{checkpoints:{hard:{level:7,totalLevels:10,sessionSeed:231}}}}})); });
  await page.goto('/preview/game-overlay.html?game=blend-and-build&difficulty=hard&sound=0');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.locator('.pb-stage')).toBeVisible();
  const session = await page.evaluate(() => JSON.parse(localStorage.getItem('literacy-guide-phonics-play:fullscreen-overlay-preview:family:hard')));
  expect(session.round).toBe(4);expect(session.gameState.missions).toHaveLength(5);
  const checkpoint=await page.evaluate(()=>JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')).games['blend-and-build'].checkpoints.hard);
  expect(checkpoint.level).toBe(4);expect(checkpoint.totalLevels).toBe(5);
  const target = await page.locator('.pb-stage').getAttribute('data-target');
  await page.reload(); await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.locator('.pb-stage')).toHaveAttribute('data-target',target);
});

for(const game of GAMES)test(`${game}: reload resumes the first partial stage without changing the seeded outing`,async({page})=>{
  await open(page,game,'easy');
  const stage=page.locator('.pb-stage'),target=await stage.getAttribute('data-target');
  if(game==='cvc-word-builder'){
    await page.getByRole('button',{name:`Place ${WORKSHOP_OBJECTS[target].units[0].grapheme}`,exact:true}).click();
  }else if(game==='blend-and-build'){
    const rime=await page.locator('[data-rime]').getAttribute('data-rime');
    await page.getByRole('button',{name:`Join ${target.slice(0,-rime.length)} to ${rime}`,exact:true}).click();
    await expect(stage).not.toHaveAttribute('data-target',target);
  }else{
    const index=Number(await stage.getAttribute('data-change-index'));
    const wrong=(await page.locator('[data-seed]').evaluateAll(nodes=>nodes.map(node=>node.dataset.seed))).find(letter=>letter!==target[index]);
    await page.getByRole('button',{name:`Plant ${wrong}`,exact:true}).click();
    await page.getByRole('button',{name:'Pause Letter Garden',exact:true}).click();
    const savedWrong=await page.evaluate(()=>JSON.parse(localStorage.getItem('literacy-guide-adventure-world:fullscreen-overlay-preview:garden:easy')));
    expect(savedWrong.evidence.firstResponses[0]).toMatchObject({correct:false,round:0});expect(savedWrong.attempts).toEqual([[0,1]]);
    await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
    await expect(stage).toHaveAttribute('data-target',target);
    await page.getByRole('button',{name:`Plant ${target[index]}`,exact:true}).click();
    await expect(stage).toHaveAttribute('data-built','1');
  }
  await page.getByRole('button',{name:`Pause ${game==='cvc-word-builder'?'CVC Word Builder':game==='blend-and-build'?'Blend & Build':'Letter Garden'}`,exact:true}).click();
  const mode=game==='cvc-word-builder'?'build':game==='blend-and-build'?'family':'garden';
  const key=game==='letter-garden'?'literacy-guide-adventure-world:fullscreen-overlay-preview:garden:easy':`literacy-guide-phonics-play:fullscreen-overlay-preview:${mode}:easy`;
  const before=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  expect(before.round??before.index).toBe(0);
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(stage).toBeVisible();
  const after=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  if(game==='letter-garden'){
    expect(after.roundSet).toEqual(before.roundSet);expect(after.grown).toEqual(before.grown);
    expect(after.evidence.firstResponses[0]).toMatchObject({correct:false,round:0});expect(after.evidence.assistedRetries).toHaveLength(1);expect(after.score).toBe(before.score);
    await expect(stage).toHaveAttribute('data-built','1');await expect(stage).toHaveAttribute('data-aw-index','1');
  }else{
    expect(after.gameState).toEqual(before.gameState);expect(after.score).toBe(before.score);
    if(game==='cvc-word-builder')expect(after.stage.data.placed).toEqual(before.stage.data.placed);
    else expect(after.stage.data.built).toEqual(before.stage.data.built);
  }
});

test.describe('Recorded target replay',()=>{
  test.use({hasTouch:true});
  const audioPaths=Object.fromEntries([...new Set([
    ...Object.keys(WORKSHOP_OBJECTS),
    ...BUILDING_FAMILIES.easy.flatMap(([, ...words])=>words),
    ...GARDEN_LETTER_CONTRASTS.easy.flat()
  ])].map(word=>[word,getLedaWordAudioPath(word)]));
  const cases=[...GAMES.map(game=>({game})),{game:'blend-and-build',sessionSeed:20,expectedTarget:'sun'}];
  for(const {game,sessionSeed,expectedTarget} of cases)test(`${game}: ${expectedTarget ? 'supplemental sun recording with a ' : 'a '}blocked automatic word cue keeps a gesture replay available`,async({page},testInfo)=>{
    await page.addInitScript(({audioPaths,game,sessionSeed,totalLevels})=>{
      if(sessionSeed!==undefined)localStorage.setItem('literacy-guide-learn-games:fullscreen-overlay-preview',JSON.stringify({v:1,games:{[game]:{checkpoints:{easy:{level:0,totalLevels,sessionSeed}}}}}));
      const original=HTMLMediaElement.prototype.play;
      window.__buildingCue={requests:[],gestures:0};
      document.addEventListener('click',event=>{
        if(event.isTrusted && event.target.closest?.('.pb-replay'))window.__buildingCue.gestures+=1;
      },true);
      HTMLMediaElement.prototype.play=function(){
        const target=document.querySelector('.pb-stage')?.getAttribute('data-target');
        const path=new URL(this.src,location.href).pathname;
        const isTarget=Boolean(target && path===audioPaths[target]);
        const request={path,target,isTarget,gesture:window.__buildingCue.gestures,result:'pending',playing:false};
        window.__buildingCue.requests.push(request);
        // Block the actual current target until the child taps Hear. Music,
        // instructions and remounted automatic attempts cannot satisfy replay.
        if(isTarget && !request.gesture){request.result='blocked';return Promise.reject(new DOMException('Autoplay blocked','NotAllowedError'));}
        this.addEventListener('playing',()=>{request.playing=true;},{once:true});
        return original.call(this).then(value=>{request.result='fulfilled';return value;},error=>{request.result=error.name;throw error;});
      };
    },{audioPaths,game,sessionSeed,totalLevels:buildPhonicsBlendMissions('easy').length});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto(`/preview/game-overlay.html?game=${game}&difficulty=easy&sound=1`);
    if(sessionSeed!==undefined)await page.getByRole('button',{name:'Continue',exact:true}).tap();
    const stage=page.locator('.pb-stage');await expect(stage).toBeVisible();
    if(expectedTarget)await expect(stage).toHaveAttribute('data-target',expectedTarget);
    const target=await stage.getAttribute('data-target'),path=getLedaWordAudioPath(target);
    expect(path).toBeTruthy();
    await expect.poll(()=>page.evaluate(path=>window.__buildingCue.requests.some(request=>request.path===path && request.result==='blocked' && request.gesture===0),path)).toBe(true);
    const replay=page.getByRole('button',{name:'Hear target word',exact:true});
    await expect(replay).toBeEnabled();await replay.tap();
    await expect.poll(()=>page.evaluate(path=>window.__buildingCue.requests.some(request=>request.path===path && request.gesture===1 && request.result==='fulfilled' && request.playing),path)).toBe(true);
    await expect(stage).toHaveAttribute('data-target',target);
    await testInfo.attach('target-cue-delivery',{body:Buffer.from(JSON.stringify(await page.evaluate(()=>window.__buildingCue),null,2)),contentType:'application/json'});
    await page.screenshot({path:`${EVIDENCE}/${game}${expectedTarget ? '-sun' : ''}-gesture-replay.png`});
  });
});

for(const game of GAMES) test(`${game}: complete a fresh full outing and save exactly one supported practice receipt`,async({page})=>{
  test.setTimeout(150000);
  const difficulty = game === 'cvc-word-builder' ? 'easy' : 'hard';
  await open(page,game,difficulty);
  const stage=page.locator('.pb-stage');
  if(game==='cvc-word-builder'){
    const count=cvcWorkshopRoundCount(difficulty);
    for(let i=0;i<count;i++){
      const word=await stage.getAttribute('data-target');
      for(const unit of WORKSHOP_OBJECTS[word].units)await page.getByRole('button',{name:`Place ${unit.grapheme}`,exact:true}).click();
      if(i<count-1)await expect(stage).not.toHaveAttribute('data-target',word);
    }
  }else if(game==='blend-and-build'){
    const count=buildPhonicsBlendMissions(difficulty).reduce((sum,mission)=>sum+mission.targets.length,0);
    for(let i=0;i<count;i++){
      const word=await stage.getAttribute('data-target'),rime=await page.locator('[data-rime]').getAttribute('data-rime');
      await page.getByRole('button',{name:`Join ${word.slice(0,-rime.length)} to ${rime}`,exact:true}).click();
      if(i<count-1)await expect(stage).not.toHaveAttribute('data-target',word);
    }
  }else{
    for(let i=0;i<26;i++){
      const word=await stage.getAttribute('data-target'),index=Number(await stage.getAttribute('data-change-index'));
      await page.getByRole('button',{name:`Plant ${word[index]}`,exact:true}).click();
      if(i<25)await expect(stage).toHaveAttribute('data-aw-index',String(i+1));
      else{
        await expect(stage).toHaveAttribute('data-built','26');
        await page.getByRole('button',{name:'Pause Letter Garden',exact:true}).click();
        await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
        await expect(stage).toHaveAttribute('data-built','26');
      }
    }
  }
  await expect(page.getByRole('heading',{name:/complete!/})).toBeVisible();
  const record=await page.evaluate(id=>JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')).games[id],game);
  expect(record.plays).toBe(1);
  await page.screenshot({path:`${EVIDENCE}/${game}-complete.png`});
});
async function checkControls(page) {
  const viewport = page.viewportSize();
  for (const button of await page.locator('.pb-stage button:not(:disabled)').all()) {
    const r = await button.boundingBox();
    expect(r.width).toBeGreaterThanOrEqual(56);
    expect(r.height).toBeGreaterThanOrEqual(56);
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.x + r.width).toBeLessThanOrEqual(viewport.width + .5);
    expect(r.y + r.height).toBeLessThanOrEqual(viewport.height + .5);
    expect(await button.evaluate(el => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)); })).toBe(true);
  }
}
for (const difficulty of ['easy','medium','hard']) {
  test(`CVC ${difficulty}: direct tiles, editable slots, specific retry and automatic object use/advance`, async ({ page }) => {
    await open(page, 'cvc-word-builder', difficulty);
    const word = await page.locator('.pb-stage').getAttribute('data-target'), units = WORKSHOP_OBJECTS[word].units;
    const wrong = (await page.locator('.pb-tile').allTextContents()).map(s => s.trim()).find(s => s !== units[0].grapheme);
    await page.getByRole('button', { name: `Place ${wrong}`, exact:true }).click();
    await expect(page.locator('.pb-feedback')).toContainText(`${wrong} is not the next sound in ${word}`);
    await page.getByRole('button', { name: `Place ${units[0].grapheme}`, exact:true }).press('Enter');
    await page.getByRole('button', { name: 'Undo last sound',exact:true }).click();
    for (const unit of units) await page.getByRole('button', { name: `Place ${unit.grapheme}`,exact:true }).click();
    await expect(page.locator('.lg-object-scene')).toHaveAttribute('data-state','used');
    await expect(page.getByRole('button', { name: /Use object|Fetch|Blend .*|Next build/ })).toHaveCount(0);
    await page.screenshot({ path:`${EVIDENCE}/cvc-${difficulty}-result.png` });
    await expect(page.locator('.pb-stage')).not.toHaveAttribute('data-target', word);
    const session = await page.evaluate(() => JSON.parse(localStorage.getItem(`literacy-guide-phonics-play:fullscreen-overlay-preview:build:${new URLSearchParams(location.search).get('difficulty')}`)));
    expect(session.evidence.firstResponses[0]).toMatchObject({ correct:false, practiceOnly:true, independent:false });
    expect(session.evidence.assistedRetries[0].attempts).toBe(1);
  });
  test(`Blend ${difficulty}: one direct onset response, specific contrast and automatic next pictured target`, async ({ page }) => {
    await open(page, 'blend-and-build', difficulty);
    const word = await page.locator('.pb-stage').getAttribute('data-target'), rime = await page.locator('[data-rime]').getAttribute('data-rime'), expected = word.slice(0,-rime.length);
    const onsets = await page.locator('[data-onset]').evaluateAll(nodes => nodes.map(node => node.dataset.onset));
    const wrong = onsets.find(part => part !== expected);
    await page.getByRole('button', { name:`Join ${wrong} to ${rime}`,exact:true }).click();
    await expect(page.locator('.pb-feedback')).toContainText(`${wrong} + ${rime} makes ${wrong+rime}`);
    await page.getByRole('button', { name:`Join ${expected} to ${rime}`,exact:true }).press('Space');
    await expect(page.locator('.pb-feedback')).toContainText(`${expected} + ${rime} = ${word}!`);
    await page.screenshot({ path:`${EVIDENCE}/blend-${difficulty}-result.png` });
    await expect(page.locator('.pb-stage')).not.toHaveAttribute('data-target', word);
    await expect(page.getByRole('button', { name:/Continue|Join onset/ })).toHaveCount(0);
  });
  test(`Garden ${difficulty}: explicit changed letter, direct seed retry, duplicate protection, pause and automatic growth`, async ({ page }) => {
    await open(page,'letter-garden',difficulty);
    const stage = page.locator('.pb-stage'), word = await stage.getAttribute('data-target'), source = await stage.getAttribute('data-source'), index = Number(await stage.getAttribute('data-change-index'));
    const wrong = (await page.locator('[data-seed]').evaluateAll(nodes=>nodes.map(node=>node.dataset.seed))).find(letter=>letter!==word[index]);
    await page.getByRole('button',{name:`Plant ${wrong}`,exact:true}).click();
    const wrongWord = [...source];wrongWord[index]=wrong;
    await expect(page.locator('.pb-feedback')).toContainText(`${wrong} makes ${wrongWord.join('')}. We need ${word}.`);
    await page.getByRole('button',{name:`Plant ${word[index]}`,exact:true}).press('Enter');
    await expect(stage).toHaveAttribute('data-built','1');
    await expect(page.locator('.pb-feedback')).toContainText(`${source} becomes ${word}`);
    await page.getByRole('button',{name:'Pause Letter Garden',exact:true}).click();
    await page.waitForTimeout(1900);
    await expect(stage).toHaveAttribute('data-target',word);
    await page.getByRole('button',{name:'Resume game',exact:true}).click();
    await page.screenshot({ path:`${EVIDENCE}/garden-${difficulty}-result.png` });
    await expect(stage).not.toHaveAttribute('data-target',word);
    await expect(stage).toHaveAttribute('data-built','1');
    await expect(page.getByRole('button',{name:/Fetch|Carry seed/})).toHaveCount(0);
  });
}
for (const viewport of [{width:320,height:568},{width:568,height:320},{width:768,height:1024},{width:1024,height:768},{width:1366,height:768}]) {
  for(const game of GAMES) test(`${game} hard: visible useful targets and direct controls at ${viewport.width}x${viewport.height}`,async({page})=>{
    await page.setViewportSize(viewport); await open(page,game,'hard');
    await page.evaluate(()=>document.fonts.ready);
    await checkControls(page);
    const frame=await page.locator('.pb-stage').boundingBox();
    await page.screenshot({path:`${EVIDENCE}/${game}-${viewport.width}x${viewport.height}.png`});
    const target=page.locator(game==='letter-garden'?'.pb-garden-goal':game==='blend-and-build'&&viewport.height<400?'.pb-family-object.is-current':'.pb-picture-card');
    const r=await target.boundingBox();
    expect(r.x).toBeGreaterThanOrEqual(frame.x);expect(r.y).toBeGreaterThanOrEqual(frame.y);
    expect(r.x+r.width).toBeLessThanOrEqual(frame.x+frame.width+.5);expect(r.y+r.height).toBeLessThanOrEqual(frame.y+frame.height+.5);
    expect(await target.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height-10));})).toBe(true);
    await page.screenshot({path:`${EVIDENCE}/${game}-${viewport.width}x${viewport.height}.png`});
  });
}

test.describe('Blend phone target stays clear when its equation or onset bank grows', () => {
  test.use({hasTouch:true});
  for (const {difficulty,seed,rime,options} of [
    {difficulty:'hard',seed:1,rime:'amp',options:3},
    {difficulty:'hard',seed:7,rime:'ing',options:4},
    {difficulty:'easy',seed:1,rime:'at',options:5}
  ]) test(`Blend ${difficulty} -${rime}: ${options} full-size choices preserve target and native touch`, async ({page}) => {
    await page.setViewportSize({width:320,height:568});
    await open(page,'blend-and-build',difficulty,seed);
    await page.evaluate(()=>document.fonts.ready);
    await expect(page.locator('[data-rime]')).toHaveAttribute('data-rime',rime);
    await expect(page.locator('[data-onset]')).toHaveCount(options);
    const target=page.locator('.pb-picture-card');
    async function checkTarget() {
      await checkControls(page);
      const picture=await target.boundingBox(),bench=await page.locator('.pb-blend-bench').boundingBox();
      expect(picture.y+picture.height).toBeLessThan(bench.y);
      expect(await target.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height-10));})).toBe(true);
    }
    await checkTarget();
    await page.screenshot({path:`${EVIDENCE}/blend-phone-${difficulty}-${rime}-choices.png`});
    const word=await page.locator('.pb-stage').getAttribute('data-target'),expected=word.slice(0,-rime.length);
    const wrong=(await page.locator('[data-onset]').evaluateAll(nodes=>nodes.map(node=>node.dataset.onset))).find(onset=>onset!==expected);
    await page.getByRole('button',{name:`Join ${wrong} to ${rime}`,exact:true}).tap();
    await expect(page.locator('.pb-feedback')).toContainText(`We need ${word}`);
    await checkTarget();
    await page.getByRole('button',{name:`Join ${expected} to ${rime}`,exact:true}).tap();
    await expect(page.locator('.pb-feedback')).toContainText(`= ${word}!`);
    await page.screenshot({path:`${EVIDENCE}/blend-phone-${difficulty}-${rime}-result.png`});
    await expect(page.locator('.pb-stage')).not.toHaveAttribute('data-target',word);
  });
});
