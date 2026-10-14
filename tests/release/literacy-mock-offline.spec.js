import { expect,test } from '@playwright/test';
test.describe.configure({timeout:180000});
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
test('all 43 answers continue through disconnected Wi-Fi and reload, then deliver once to the teacher',async({page},info)=>{
 await openDevice(page,info);
 await page.evaluate(()=>window.__literacyMock.setFault('offline'));
 for(let n=1;n<=15;n++) await answerOne(page,n);
 expect(await page.evaluate(()=>window.__literacyMock.state().run.responses.length)).toBe(0);
 await page.reload();await expect(page.getByRole('region',{name:'Question 16',exact:true})).toBeVisible({timeout:90000});
 for(let n=16;n<=43;n++) await answerOne(page,n);
 await expect(page.getByText('Your answers are saved on this iPad. Wait for your teacher.')).toBeVisible();
 await expect(page.getByRole('button',{name:'Try again',exact:true})).toHaveCount(0);
 await page.evaluate(()=>{window.__literacyMock.setFault(null);window.dispatchEvent(new Event('online'));});
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.state().run.responses.length),{timeout:30000}).toBe(43);
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.device().requests.length)).toBe(0);
 const rows=await page.evaluate(()=>window.__literacyMock.rawResponses());
 expect(new Set(rows.map(row=>row.questionId)).size).toBe(43);expect(rows.every(row=>row.serverReceivedAt)).toBe(true);
 await page.reload();await expect(page.getByText('Your answers are saved. Wait for your teacher.')).toBeVisible({timeout:90000});
 await page.screenshot({path:info.outputPath('all-delivered.png')});
});
test('lost batch receipt retains the exact retry while newer answers continue, and early collection finishes after acknowledgement',async({page},info)=>{
 await openDevice(page,info);
 await page.evaluate(()=>window.__literacyMock.teacher('live_on'));
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.device().mock.delivery_mode)).toBe('live');
 await page.evaluate(()=>window.__literacyMock.setFault('receipt-lost'));
 await answerOne(page,1);await answerOne(page,2);await answerOne(page,3);
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.state().run.responses.length),{timeout:30000}).toBe(3);
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.device().requests.length)).toBe(0);
 await page.evaluate(()=>window.__literacyMock.teacher('collect'));
 await expect(page.getByRole('heading',{name:'All done. Thank you!'})).toBeVisible({timeout:30000});
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.state().session.mock.state)).toBe('completed');
 expect(await page.evaluate(()=>window.__literacyMock.rawResponses().length)).toBe(3);
 await page.screenshot({path:info.outputPath('partial-collected.png')});
});

test('teacher live updates and collection expose received data and wait for the iPad acknowledgement',async({page},info)=>{
 await openDevice(page,info);await answerOne(page,1);await answerOne(page,2);
 await page.goto(`${root}?case=${info.testId}&device=1&count=43&mode=teacher&session=mock-session&phase=live`);
 const live=page.getByRole('checkbox',{name:'Live data updates',exact:true});await expect(live).not.toBeChecked();
 await live.check();await expect(live).toBeChecked();await live.uncheck();await expect(live).not.toBeChecked();
 await page.getByRole('button',{name:'Collect all data and finish',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Collect all data and finish',exact:true}).click();
 await expect(page.getByText(/1 iPad is waiting to deliver data/)).toBeVisible();
 expect(await page.evaluate(()=>window.__literacyMock.state().session.mock.state)).toBe('running');
 await page.screenshot({path:info.outputPath('teacher-awaiting-iPad.png')});
 await page.goto(`${root}?case=${info.testId}&device=1&count=43&focusHook=1`);
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.state().session.mock.state),{timeout:30000}).toBe('completed');
 await page.goto(`${root}?case=${info.testId}&device=1&count=43&mode=teacher&session=mock-session&student=student-a&phase=results`);
 await expect(page.locator('.literacy-mock-result-summary')).toContainText('100%');
 await expect(page.locator('.literacy-mock-result-summary')).toContainText('2 of 2 independent answers correct');
 await expect(page.locator('.literacy-mock-result-summary')).toContainText('More evidence needed');
 await page.screenshot({path:info.outputPath('teacher-collected-report.png')});
});

test('a child can request or cancel help without falsely advancing an unresolved assisted question',async({page},info)=>{
 await openDevice(page,info);const current=await page.evaluate(()=>window.__literacyMock.deviceItem());
 await chooseAnswer(page,current);await page.getByRole('button',{name:'I need help',exact:true}).click();
 const next=page.getByRole('button',{name:'Next question',exact:true});await expect(next).toBeDisabled();
 await expect(page.getByRole('button',{name:'Cancel request',exact:true})).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.state().run.helpRequests.some(row=>row.status==='pending'))).toBe(true);
 await page.evaluate(id=>window.__literacyMock.resolve(id,'access'),current.id);
 await expect(next).toBeEnabled({timeout:20000});await next.click();
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.device().run.responses.length)).toBe(1);
 expect(await page.evaluate(()=>window.__literacyMock.device().run.responses[0].evidenceType)).toBe('independent');
});
