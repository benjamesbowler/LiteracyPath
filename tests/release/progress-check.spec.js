import { expect, test } from "@playwright/test";
const url = "/tests/fixtures/progress-check.html";
async function warmup(page) { await page.getByRole("button", { name: "circle", exact: true }).click(); await page.getByRole("button", { name: "square", exact: true }).click(); }
async function prepare(page, track = "reading_stories") {
  await page.goto(url); await page.getByRole("combobox", { name: "Check plan", exact: true }).selectOption("focused"); await page.getByRole("combobox", { name: "Strand", exact: true }).selectOption(track); await page.getByRole("button", { name: "Prepare check", exact: true }).click(); await warmup(page);
}
async function selectCurrent(page, correct = true) {
  const label = await page.evaluate(correct => { const run = window.__progressRun; const item = run.currentItem; return item.choices.find(choice => correct ? choice.id === item.answer : choice.id !== item.answer).label; }, correct);
  await page.getByRole("button", { name: label, exact: true }).click();
}
test("teacher runs a focused check with locked first answers, durable reload, report and export", async ({ page }) => {
  test.setTimeout(60000);
  await prepare(page); const itemId = await page.evaluate(() => window.__progressRun.currentItem.id);
  await selectCurrent(page, false); await expect(page.getByRole("heading", { name: "Answer recorded" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__progressRun.responses.length)).toBe(1);
  await expect(page.getByRole("button", { name: "Take a break" })).toBeEnabled(); await page.getByRole("button", { name: "Take a break" }).click();
  await page.reload(); await expect(page.getByRole("heading", { name: "Take your time" })).toBeVisible(); await page.getByRole("button", { name: "Carry on" }).click();
  await expect.poll(() => page.evaluate(() => window.__progressRun.currentItem?.id || "")).not.toBe(itemId);
  await expect.poll(() => page.evaluate(() => window.__progressRun.currentItem?.id || "")).not.toBe("");
  for (let count = 0; count < 18; count++) {
    if (await page.getByRole("heading", { name: "All done" }).isVisible()) break;
    await selectCurrent(page); await expect.poll(() => page.evaluate(() => window.__progressRun.receipt === null), { intervals: [100] }).toBe(true);
  }
  await expect(page.getByRole("heading", { name: "All done" })).toBeVisible();
  await page.getByText(/Pupil A ·/).click(); await expect(page.getByRole("cell", { name: /Provisional descriptive sample/ })).toBeVisible();
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Export progress evidence" }).click(); expect((await download).suggestedFilename()).toBe("literacy-progress-evidence.xlsx");
  const attempt = await page.evaluate(() => window.__progressAttempt); expect(attempt.accuracy).toBeNull(); expect(attempt.passed).toBe(false); expect(attempt.questionRecords[0].questionId).toBe(itemId); expect(attempt.questionRecords[0].responseStatus).toBe("incorrect");
});
test("assigned child save/resume and learner switch keep identities separate", async ({ page }) => {
  await page.goto(`${url}?mode=child`); await warmup(page); await selectCurrent(page);
  await expect.poll(() => page.evaluate(() => window.__progressRun.responses.length)).toBe(1);
  await page.getByRole("button", { name: "Switch learner" }).click(); await expect(page.getByRole("heading", { name: "Let’s practise the buttons" })).toBeVisible();
  await warmup(page); expect(await page.evaluate(() => window.__progressRun.studentId)).toBe("44444444-4444-4444-8444-444444444444"); expect(await page.evaluate(() => window.__progressRun.responses.length)).toBe(0);
  await page.getByRole("button", { name: "Switch learner" }).click(); await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("server-run:33333333-3333-4333-8333-333333333333")).responses.length)).toBe(1);
  expect(await page.evaluate(() => window.__progressRequests.filter(row => row.name === "student_save_progress_run").every(row => row.args.p_session_id === "55555555-5555-4555-8555-555555555555"))).toBe(true);
});
test("required recording failure is replaceable unscored evidence and cannot enable blind guessing", async ({ page }) => {
  await page.route("**/audio/**/*.mp3", route => route.abort()); await prepare(page, "printed_words");
  await expect(page.locator(".progress-answers button").first()).toBeDisabled(); await page.getByRole("button", { name: /Listen|Start again/ }).click();
  await expect(page.getByText("It will not count as a wrong answer.", { exact: false })).toBeVisible(); await page.getByRole("button", { name: "Try a different question" }).click();
  await expect.poll(() => page.evaluate(() => window.__progressRun.responses[0]?.responseStatus)).toBe("media_failed"); expect(await page.evaluate(() => window.__progressRun.tracks.printed_words.nextTier)).toBe(1);
});
test("teacher assigns the actual progress target and frozen bank plan", async ({ page }) => {
  await page.goto(`${url}?mode=assignment`); await page.getByRole("combobox", { name: "Plan", exact: true }).selectOption("focused"); await page.getByRole("combobox", { name: "Strand", exact: true }).selectOption("reading_stories");
  await page.getByRole("button", { name: "Start for whole class", exact: true }).click(); await expect(page.getByText("Assignment started")).toBeVisible();
  const call = await page.evaluate(() => window.__progressRequests.find(row => row.name === "teacher_start_progress_check_session")); expect(call.args.p_assignments["*"].plan_kind).toBe("focused"); expect(call.args.p_assignments["*"].track_id).toBe("reading_stories"); expect(call.args.p_assignments["*"].bank_version).toMatch(/^progress-/);
});
test("automatic recorded cue sequence cancels on pause and completes every spoken choice before answering", async ({ page }) => {
  await prepare(page, "hear_sounds");
  await expect(page.locator(".progress-choose").first()).toBeDisabled();
  await page.getByRole("button", { name: "Take a break", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Take your time" })).toBeVisible();
  await page.getByRole("button", { name: "Carry on", exact: true }).click();
  await expect(page.locator(".progress-choose").first()).toBeEnabled({ timeout: 20000 });
  const delivery = await page.evaluate(() => window.__progressRun.currentAudioDelivery);
  expect(delivery.target).toBe("completed"); for (let index = 0; index < 3; index++) expect(delivery[`choices:${index}`]).toBe("completed");
  await page.locator(".progress-choose").first().click();
  await expect.poll(() => page.evaluate(() => window.__progressRun.responses[0]?.audioDelivery.target)).toBe("completed");
});

test('slow saves do not gate answers, first responses or the next item', async ({ page }) => {
  await page.goto(`${url}?saveDelay=1800`);
  await page.getByRole('combobox', { name: 'Check plan', exact: true }).selectOption('focused');
  await page.getByRole('combobox', { name: 'Strand', exact: true }).selectOption('reading_stories');
  await page.getByRole('button', { name: 'Prepare check', exact: true }).click(); await warmup(page);
  const original = await page.evaluate(() => window.__progressRun.currentItem.id);
  await expect(page.locator('.progress-choose').first()).toBeEnabled();
  await page.locator('.progress-choose').first().dblclick();
  await expect.poll(() => page.evaluate(() => window.__progressRun.responses.length)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__progressRun.currentItem?.id || ''), { timeout: 1500 }).not.toBe(original);
  await expect.poll(() => page.evaluate(() => window.__progressRun.currentItem?.id || ''), { timeout: 1500 }).not.toBe('');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('server-run:33333333-3333-4333-8333-333333333333') || '{}').responses?.length)).toBe(1);
});

test('timeout recovery retains exact answers and order across reload, then retries upload', async ({ page }) => {
  await page.goto(`${url}?failSave=always`);
  await page.getByRole('combobox', { name: 'Check plan', exact: true }).selectOption('focused');
  await page.getByRole('combobox', { name: 'Strand', exact: true }).selectOption('reading_stories');
  await page.getByRole('button', { name: 'Prepare check', exact: true }).click(); await warmup(page);
  await selectCurrent(page, false);
  await expect.poll(() => page.evaluate(() => window.__progressRun.currentItem?.id || '')).not.toBe('');
  await page.getByRole('button', { name: 'Take a break', exact: true }).click();
  const kept = await page.evaluate(() => ({ responses: window.__progressRun.responses, choices: window.__progressRun.currentItem.choices }));
  await page.evaluate(() => sessionStorage.setItem('progress-load-offline', '1'));
  await page.reload(); await expect(page.getByRole('heading', { name: 'Take your time' })).toBeVisible();
  expect(await page.evaluate(() => ({ responses: window.__progressRun.responses, choices: window.__progressRun.currentItem.choices }))).toEqual(kept);
  await page.getByRole('button', { name: 'Carry on', exact: true }).click();
  await expect(page.locator('.progress-choose').first()).toBeEnabled();
  await page.evaluate(() => { window.__progressConnectionRestored = true; });
  await page.getByRole('button', { name: 'Retry upload', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('server-run:33333333-3333-4333-8333-333333333333') || '{}').responses)).toEqual(kept.responses);
});

for (const [width, height] of [[320,568],[568,320],[768,1024],[1024,768],[1366,768],[1920,1080]]) {
  test(`simple listening layout fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await prepare(page, 'listening_stories');
    await expect(page.getByRole('heading', { name: 'Understand spoken stories', exact: true })).toBeVisible();
    await expect(page.locator('.progress-choose')).toHaveCount(3);
    await expect(page.locator('.progress-listen')).toHaveCount(1);
    await expect(page.locator('.progress-choose').first()).toBeEnabled({ timeout: 40000 });
    expect(await page.evaluate(() => window.__progressRun.currentAudioDelivery.passage)).toBe('completed');
    expect(await page.evaluate(() => window.__progressRun.currentMediaError)).toBe('');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const button of await page.locator('.progress-choose, .progress-choice-listen, .progress-secondary button').all()) {
      const bounds = await button.boundingBox(); expect(bounds.width).toBeGreaterThanOrEqual(44); expect(bounds.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: `.artifacts/assessment-flow/layout-${width}x${height}.png`, fullPage: true });
    const cue = await page.evaluate(() => window.__progressRun.currentItem.audio.passage.path);
    expect(cue).toMatch(/assessment_passage/);
  });
}

test('late rejection from an interrupted practice cue cannot stop the story recording', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (this.src.includes('tap-the-square')) return new Promise((_, reject) => setTimeout(() => reject(new DOMException('Old practice cue interrupted', 'AbortError')), 200));
      return original.call(this);
    };
  });
  await prepare(page, 'listening_stories');
  await expect(page.locator('.progress-choose').first()).toBeEnabled({ timeout: 40000 });
  expect(await page.evaluate(() => window.__progressRun.currentAudioDelivery.passage)).toBe('completed');
  expect(await page.evaluate(() => window.__progressRun.currentMediaError)).toBe('');
  await expect(page.getByText('It will not count as a wrong answer.', { exact: false })).toHaveCount(0);
});
