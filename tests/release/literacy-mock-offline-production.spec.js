import { expect,test } from '@playwright/test';
test.describe.configure({timeout:180000});
test.skip(process.env.LP_MOCK_PRODUCTION_PROOF!=='1','Run against the temporary production offline-proof build.');
async function simulatedAudio(page, duration = 20) {
  await page.addInitScript(({ duration }) => {
    window.__mockAudio = { played: [], paused: [], failNext: false };
    window.Audio = class extends EventTarget {
      constructor() { super(); this.src = ''; this.paused = true; this.currentTime = 0; }
      play() {
        window.__mockAudio.played.push(this.src); this.paused = false;
        if (window.__mockAudio.failNext) {
          window.__mockAudio.failNext = false;
          this.timer = setTimeout(() => { this.onerror?.(new Event('error')); this.dispatchEvent(new Event('error')); }, duration);
        } else {
          this.onplaying?.(new Event('playing'));
          this.timer = setTimeout(() => { this.onended?.(new Event('ended')); this.dispatchEvent(new Event('ended')); }, duration);
        }
        return Promise.resolve();
      }
      pause() { clearTimeout(this.timer); this.paused = true; window.__mockAudio.paused.push(this.src); }
      load() {}
    };
  }, { duration });
}
async function chooseAnswer(page, current = null) {
  current ||= await page.evaluate(() => window.__literacyMock.deviceItem());
  const buttons = page.locator('.literacy-mock-choice');
  const ordered = await page.evaluate(id => window.__literacyMock.choiceOrder(id), current.id);
  const byId = id => buttons.nth(ordered.findIndex(choice => choice.id === id));
  if (current.format === 'choice') {
    await byId(current.answer).click();
  } else if (current.format === 'select_text') {
    const answer = current.choices.find(choice => choice.id === current.answer);
    await page.locator('.literacy-mock-text-selection button').nth(answer.tokenIndex).click();
  } else if (current.format === 'multi_select' || current.format === 'order') {
    for (const id of current.answer) await byId(id).click();
  } else if (current.format === 'match') {
    for (let i = 0; i < current.answer.length; i++) {
      await byId(current.answer[i]).click();
      await page.getByRole('button', { name: new RegExp(`^Space ${i + 1} for`) }).click();
    }
  } else if (current.format === 'build_word') {
    function compose(text, choices) {
      if (!text) return [];
      for (const choice of choices) if (text.startsWith(choice.label)) {
        const suffix = compose(text.slice(choice.label.length), choices.filter(value => value.id !== choice.id));
        if (suffix) return [choice.id, ...suffix];
      }
      return null;
    }
    const tiles = compose(current.answer, current.choices);
    expect(tiles, 'The authored tile bank must construct the whole dictated word').not.toBeNull();
    for (const id of tiles) await byId(id).click();
  }
}

const root='/tests/fixtures/literacy-mock.html';
async function openDevice(page, info) {
 await simulatedAudio(page,5);await page.setViewportSize({width:1024,height:724});
 await page.goto(`${root}?case=${info.testId}&device=1&count=43&focusHook=1`);
 await expect(page.getByRole('region',{name:'Question 1',exact:true})).toBeVisible({timeout:90000});
 await expect.poll(()=>page.evaluate(()=>Boolean(window.__literacyMock.device()?.serverRun.offlineLeaseId))).toBe(true);
}
async function answerOne(page,n) {
 const current=await page.evaluate(()=>window.__literacyMock.deviceItem());expect(current).toBeTruthy();
 await chooseAnswer(page,current);const next=page.getByRole('button',{name:/^(Next question|Finish test)$/});
 await expect(next).toBeEnabled();await next.click();
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.device().run.responses.length)).toBe(n);
}

test('the installed production shell, assessment code, bank and media survive a real offline page reload',async({page,context},info)=>{
 await openDevice(page,info);
 await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
 await answerOne(page,1);await answerOne(page,2);await answerOne(page,3);
 await page.evaluate(()=>window.__literacyMock.setFault('offline'));await context.setOffline(true);
 await page.reload();
 await expect(page.getByRole('region',{name:'Question 4',exact:true})).toBeVisible({timeout:60000});
 for(let n=4;n<=43;n++) await answerOne(page,n);
 await expect(page.getByText('Your answers are saved on this iPad. Wait for your teacher.')).toBeVisible();
 await expect(page.getByRole('button',{name:'Try again',exact:true})).toHaveCount(0);
 const queued=await page.evaluate(()=>window.__literacyMock.device());expect(queued.run.responses).toHaveLength(43);
 expect(queued.requests.length).toBeGreaterThan(43);
 await page.screenshot({path:info.outputPath('production-offline-complete.png')});
 await context.setOffline(false);await page.evaluate(()=>{window.__literacyMock.setFault(null);window.dispatchEvent(new Event('online'));});
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.state().run.responses.length),{timeout:30000}).toBe(43);
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.device().requests.length)).toBe(0);
});
