import { expect, test } from '@playwright/test';
import { GUIDED_READING_NEXT_STEPS_BOOKS as next } from '../../src/data/guidedReadingNextStepsBooks.js';
import { GUIDED_READING_BRIGHT_IDEAS_BOOKS as bright } from '../../src/data/guidedReadingBrightIdeasBooks.js';
import { getRuntimeGuidedReadingBooks } from '../../src/utils/guidedReading/runtimeBooks.js';
import { getGuidedReadingPageAudioPath, getGuidedReadingWordProductionAudioPath } from '../../src/utils/guidedReading/readAloudPolicy.js';
import { declaredNextStepsLessons } from '../../src/data/nextStepsPhonicsLessons.js';
import { guidedReadingBookModeLabel } from '../../src/policy/guidedReadingCatalogPolicy.js';
import { getBookTextAnalysis, appReadingLevelLabel } from '../../src/utils/guidedReading/bookTextAnalysis.js';

const all = [...next, ...bright];
const selectedIds = process.env.LP_FOUNDATIONS_BOOK_IDS?.split(',').filter(Boolean);
if (selectedIds?.some(id => !all.some(book => book.id === id))) throw Error('Unknown LP_FOUNDATIONS_BOOK_IDS value');
const books = selectedIds ? all.filter(book => selectedIds.includes(book.id)) : all;
const words = text => String(text).match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g) || [];
const sizes = [{width:768,height:1024},{width:320,height:568}];

function observeRealAudio() {
  window.__foundationsAudio = [];
  const original = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function(...args) {
    window.__foundationsAudio.push(this);
    return original.apply(this,args);
  };
}
async function expectAudioStarted(page, source) {
  expect(source).toBeTruthy();
  const target = source.split('?')[0];
  await expect.poll(() => page.evaluate(path => window.__foundationsAudio.some(audio =>
    new URL(audio.currentSrc || audio.src).pathname === path && audio.currentTime > 0 && !audio.error
  ),target)).toBe(true);
}

test('the complete fifty-book expansion is active with current generated app levels', () => {
  const live = getRuntimeGuidedReadingBooks();
  for (const book of all) {
    const current = live.find(row => row.id === book.id);
    expect(current, `${book.id} must be active; preview fallback is not acceptance`).toBeTruthy();
    expect(current.pages.map(page=>page.text)).toEqual(book.pages.map(page=>page.text));
    expect(getBookTextAnalysis(current).appReadingLevel).toBe(book.appLevel);
  }
});

for (const size of sizes) for (const book of books) {
  test(`${book.id} all pages, real audio, word help and completion ${size.width}x${size.height}`, async ({page},info) => {
    test.setTimeout(180_000);
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    await page.setViewportSize(size);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.addInitScript(observeRealAudio);
    await page.goto(`/preview/guided-reading-preview.html?book=${book.id}`);
    const reader = page.getByRole('region',{name:`${book.title} full-screen reader`});
    await expect(reader).toBeVisible();
    await expect(reader.locator('[data-foundations-guide],[data-decodable-guide]')).toHaveCount(0);
    await expect(reader.getByText('Discuss this book',{exact:true})).toHaveCount(0);
    for (const [index, readingPage] of book.pages.entries()) {
      const progress = reader.getByRole('status',{name:'Reading progress'});
      await expect(progress).toHaveText(`Page ${index+1} of ${book.pages.length}`);
      const text = reader.locator('.guided-page-text');
      await expect(text).toHaveClass(/is-ready/);
      await expect.poll(async()=>words(await text.innerText())).toEqual(words(readingPage.text));
      const image = reader.locator('.guided-page-image');
      await expect.poll(()=>image.getAttribute('src')).toContain(readingPage.image);
      await expect.poll(()=>image.evaluate(node=>node.complete && node.naturalWidth===1536 && node.naturalHeight===1024)).toBe(true);
      await expect(image).toHaveAttribute('alt',readingPage.imageAlt);
      const layout = await reader.evaluate(element=>{
        const text=element.querySelector('.guided-page-text');
        const image=element.querySelector('.guided-page-image');
        const controls=[...element.querySelectorAll('.guided-transport button')].filter(node=>{
          const r=node.getBoundingClientRect();const s=getComputedStyle(node);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';
        }).map(node=>{const r=node.getBoundingClientRect();return{label:node.getAttribute('aria-label')||node.textContent,width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom};});
        const wordFont=Math.min(...[...text.querySelectorAll('.guided-word')].map(word=>parseFloat(getComputedStyle(word).fontSize)));
        return {overflowX:document.documentElement.scrollWidth>innerWidth,textOverflow:text.scrollHeight>text.clientHeight+1,imageFit:getComputedStyle(image).objectFit,font:parseFloat(getComputedStyle(text).fontSize),wordFont,controls};
      });
      expect(layout.overflowX).toBe(false);expect(layout.textOverflow).toBe(false);
      expect(layout.imageFit).toBe('contain');expect(layout.font).toBeGreaterThanOrEqual(18);
      expect(layout.wordFont).toBeGreaterThanOrEqual(18);
      for(const control of layout.controls){
        expect(control.left,control.label).toBeGreaterThanOrEqual(0);expect(control.top,control.label).toBeGreaterThanOrEqual(0);
        expect(control.right,control.label).toBeLessThanOrEqual(size.width+0.5);expect(control.bottom,control.label).toBeLessThanOrEqual(size.height+0.5);
        expect(control.width,control.label).toBeGreaterThanOrEqual(56);expect(control.height,control.label).toBeGreaterThanOrEqual(56);
      }
      // Real HTML media playback is observed, never stubbed to resolve.
      await page.evaluate(()=>{window.__foundationsAudio=[];});
      await reader.getByRole('button',{name:'Hear this page',exact:true}).click();
      await expectAudioStarted(page,getGuidedReadingPageAudioPath(readingPage));
      const word = words(readingPage.text).at(-1);
      await page.evaluate(()=>{window.__foundationsAudio=[];});
      await reader.getByRole('button',{name:`Get reading help for ${word}`,exact:true}).last().click();
      await expectAudioStarted(page,getGuidedReadingWordProductionAudioPath(word));
      await page.screenshot({path:info.outputPath(`page-${String(index+1).padStart(2,'0')}.png`)});
      if(index===0 && book.pages.length>1){
        await page.keyboard.press('ArrowRight');await expect(progress).toHaveText(`Page 2 of ${book.pages.length}`);
        await page.keyboard.press('ArrowLeft');await expect(progress).toHaveText(`Page 1 of ${book.pages.length}`);
      }
      const forward=reader.getByRole('button',{name:index+1===book.pages.length?'Finish book':'Next page',exact:true});
      await expect(forward).toBeInViewport();await forward.click();
    }
    await expect(reader).not.toBeVisible();
    await expect.poll(()=>page.evaluate(id=>window.__guidedReadingPreviewRecords[id]?.completed,book.id)).toBe(true);
    await expect(page.getByRole('dialog',{name:/quiz|questions/i})).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

for (const book of books) test(`${book.id} actual teacher routine and visual discussion move`, async({page},info)=>{
  await page.setViewportSize(sizes[0]);
  await page.goto(`/preview/guided-reading-preview.html?book=${book.id}&mode=teacher&library`);
  await page.getByRole('searchbox').fill(words(book.pages[0].text).at(-1));
  const guide=page.locator(`[data-foundations-guide='${book.id}']`).first();
  await guide.getByText('Reading routine',{exact:true}).click();
  await expect(guide).toContainText(guidedReadingBookModeLabel(book));
  await expect(guide).toContainText(book.foundationsGuide.soundLetter.model);
  await expect(guide).toContainText(book.foundationsGuide.decoding.model);
  await expect(guide).toContainText(book.foundationsGuide.connectedReading);
  await expect(guide).toContainText(book.foundationsGuide.fluency);
  for(const lesson of declaredNextStepsLessons(book)){await expect(guide).toContainText(lesson.title);await expect(guide).toContainText(lesson.model);}
  for(const row of book.decodableScope?.exceptions||[]) await expect(guide).toContainText(row.word==='i'?'I':row.word);
  for(const row of book.foundationsGuide.languagePrep||[]) await expect(guide).toContainText(row.meaning);
  await expect(guide).toContainText(book.readingMode==='decodable'?"not this child's mastery":"does not make the whole book decodable");
  await guide.screenshot({path:info.outputPath('teacher-routine.png')});
  await guide.locator('xpath=ancestor::article').getByRole('button',{name:'Open Book',exact:true}).click();
  const reader=page.getByRole('region',{name:`${book.title} full-screen reader`});
  const discussion=reader.getByText('Discuss this book',{exact:true}).locator('..');
  await discussion.getByText('Discuss this book',{exact:true}).click();
  await expect(discussion).toContainText(book.discussion.oral.prompt);
  await expect(discussion).toContainText(book.discussion.visual.prompt);
  await discussion.getByRole('button',{name:`Look again at page ${book.discussion.visual.page}`}).click();
  await expect(reader.getByRole('status',{name:'Reading progress'})).toHaveText(`Page ${book.discussion.visual.page} of ${book.pages.length}`);
});

for(const [slug,title,collection] of [['next-steps','Next Steps',next],['bright-ideas','Bright Ideas',bright]]){
  test(`${title} child collection order and app-level filters`,async({page},info)=>{
    await page.setViewportSize(sizes[0]);
    await page.goto('/preview/child-surfaces.html?surface=reading-library');
    await page.getByRole('button',{name:'Find a book',exact:true}).click();
    await page.getByLabel('Friends or topic',{exact:true}).selectOption(slug);
    await page.getByRole('button',{name:'Back to shelf',exact:true}).click();
    const cards=page.locator(`button[data-book-id^='${slug}-']`);
    await expect(cards).toHaveCount(collection.length);
    expect(await cards.evaluateAll(nodes=>nodes.map(node=>node.dataset.bookId))).toEqual(collection.map(book=>book.id));
    await page.screenshot({path:info.outputPath('collection-order.png')});
    for(const level of [...new Set(collection.map(book=>book.appLevel))]){
      await page.getByRole('navigation',{name:'Book levels'}).getByRole('button',{name:appReadingLevelLabel(level),exact:true}).click();
      const expected=collection.filter(book=>book.appLevel===level).map(book=>book.id);
      await expect(cards).toHaveCount(expected.length);
      expect(await cards.evaluateAll(nodes=>nodes.map(node=>node.dataset.bookId))).toEqual(expected);
      const labels=await cards.locator('[data-book-level]').evaluateAll(nodes=>nodes.map(node=>node.dataset.bookLevel));
      expect(labels).toEqual(expected.map(()=>level));
    }
  });
}

if (process.env.LP_FOUNDATIONS_STOOD_CACHE === '1') test('cache-addressed stood plays from its printed word in the real reader', async ({page},info) => {
  const book = all.find(book => book.id === 'bright-ideas-14');
  const index = book.pages.findIndex(readingPage => /\bstood\b/u.test(readingPage.text));
  expect(index).toBeGreaterThanOrEqual(0);
  await page.setViewportSize({width:320,height:568});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(observeRealAudio);
  await page.goto(`/preview/guided-reading-preview.html?book=${book.id}`);
  const reader = page.getByRole('region',{name:`${book.title} full-screen reader`});
  await expect(reader).toBeVisible();
  for(let current=0;current<index;current++) {
    await expect(reader.locator('.guided-page-text')).toHaveClass(/is-ready/);
    await reader.getByRole('button',{name:'Next page',exact:true}).click();
    await expect(reader.getByRole('status',{name:'Reading progress'})).toHaveText(`Page ${current+2} of ${book.pages.length}`);
  }
  const expected = getGuidedReadingWordProductionAudioPath('stood');
  expect(expected).toBe('/audio/production/en-US/isolated_word/stood-de8407816c.mp3');
  await page.evaluate(()=>{window.__foundationsAudio=[];});
  await reader.getByRole('button',{name:'Get reading help for stood',exact:true}).click();
  await expectAudioStarted(page,expected);
  const played = await page.evaluate(()=>window.__foundationsAudio.map(audio=>({source:new URL(audio.currentSrc||audio.src).pathname,time:audio.currentTime,error:audio.error?.code||null})));
  await info.attach('stood-current-url-playback',{body:JSON.stringify({bookId:book.id,pageNumber:index+1,expected,played},null,2),contentType:'application/json'});
  await page.screenshot({path:info.outputPath('stood-word-help-current-url.png')});
});
