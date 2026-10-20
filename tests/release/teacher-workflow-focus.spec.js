import { expect, test } from "@playwright/test";
import { readDownloadWorkbook, worksheetText } from "./support/workbookDownload.js";
import { chooseStudentReportView } from "./support/studentReportNavigation.js";
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';
import { buildCyclePracticePlan } from '../../src/components/cycle-practice/cyclePracticeContent.js';

test.setTimeout(90000);

test('whole-class practice recovers a missing picture and offers recovery when questions cannot load', async ({page}) => {
  await page.goto('/preview/teacher-a11y.html?surface=resources');
  await page.route('**/literacyMockRuntimeV10.generated.js*', route=>route.abort());
  await page.getByRole('button',{name:'Open MAP Mock practice',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Questions could not load.');
  await expect(page.getByRole('button',{name:'Start class practice',exact:true})).toBeDisabled();
  await page.unroute('**/literacyMockRuntimeV10.generated.js*');
  await page.getByRole('button',{name:'Reload Teach',exact:true}).click();
  await page.getByRole('button',{name:'Open MAP Mock practice',exact:true}).click();
  await expect(page.getByRole('button',{name:'Start class practice',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Back to Teach',exact:true}).click();
  await page.getByRole('button',{name:'Open Cycles practice',exact:true}).click();
  await page.getByRole('combobox',{name:'Activity',exact:true}).selectOption('letterMatch');
  await page.route('**/*',route=>route.request().resourceType()==='image'?route.abort():route.continue());
  await page.getByRole('button',{name:'Start class practice',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('This question needs its picture.');
  await expect(page.locator('.cycle-answer').first()).toBeDisabled();
  await page.unroute('**/*');
  await page.getByRole('button',{name:'Retry pictures',exact:true}).click();
  await expect(page.locator('.cycle-answer').first()).toBeEnabled();
});

test('class Cycles practice fits all activity families and retains accepted work through teacher retries', async ({page}) => {
  await page.setViewportSize({width:1024,height:768});
  await page.addInitScript(() => Object.defineProperty(crypto,'randomUUID',{value:()=> 'teacher-whole-class-audit'}));
  await page.goto('/preview/teacher-a11y.html?surface=resources');
  await page.screenshot({path:'.artifacts/teach-class-practice-20261020/teach-shelf.png',fullPage:true});
  await page.getByRole('button',{name:'Open Cycles practice',exact:true}).click();
  await page.getByRole('combobox',{name:'Cycle',exact:true}).selectOption('cycle-3');
  const plan=buildCyclePracticePlan(elSkillsBlockCycles.find(cycle=>cycle.id==='cycle-3'),'class-practice:teacher-whole-class-audit').rounds;
  for(const activity of ['pictureSound','letterMatch','rhymeMatch','wordBuild','soundSort','letterTrace']){
    await page.getByRole('combobox',{name:'Activity',exact:true}).selectOption(activity);
    await page.getByRole('combobox',{name:'Questions',exact:true}).selectOption('all');
    await page.getByRole('button',{name:'Start class practice',exact:true}).click();
    await expect(page.locator('.cycle-activity-space')).toBeVisible();
    await expect.poll(()=>page.locator('.cycle-activity-space img').evaluateAll(images=>images.every(image=>image.complete&&image.naturalWidth>0))).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.getByRole('button',{name:'Full screen',exact:true}).click();
    await expect(page.getByRole('button',{name:'Exit full screen',exact:true})).toBeVisible();
    expect(await page.getByRole('button',{name:'Next question',exact:true}).evaluate(button=>button.getBoundingClientRect().bottom<=innerHeight)).toBe(true);
    await page.screenshot({path:`.artifacts/teach-class-practice-20261020/cycle-${activity}.png`,fullPage:true});
    if(activity==='wordBuild'||activity==='soundSort'){
      const rounds=plan.filter(round=>round.mechanicId===activity);
      const index=rounds.findIndex(round=>activity==='wordBuild'?!round.variant:round.objects?.length>1);
      expect(index).toBeGreaterThanOrEqual(0);
      for(let i=0;i<index;i++)await page.getByRole('button',{name:'Next question',exact:true}).click();
      const round=rounds[index];
      if(activity==='wordBuild'){
        await page.getByRole('button',{name:`Add ${round.answer[0]}`,exact:true}).click();
        const wrong=round.choices.find(choice=>choice.value!==round.answer[1]);
        await page.getByRole('button',{name:`Add ${wrong.value}`,exact:true}).click();
        await expect(page.locator('.whole-class-feedback.is-incorrect')).toBeVisible();
        await page.getByRole('button',{name:'Try again',exact:true}).click();
        await expect(page.locator('.cycle-word-car').first()).toHaveAttribute('aria-label',`Letter 1: ${round.answer[0]}`);
        for(const letter of round.answer.slice(1))await page.getByRole('button',{name:`Add ${letter}`,exact:true}).click();
        await expect(page.locator('.whole-class-feedback.is-correct')).toBeVisible();
      }else{
        await page.locator(`[data-cycle-bin="${round.objects[0].answer}"]`).click();
        await expect(page.getByRole('button',{name:'Continue activity',exact:true})).toBeVisible();
        await page.getByRole('button',{name:'Continue activity',exact:true}).click();
        await expect(page.getByRole('button',{name:`Pick up ${round.objects[1].word}`,exact:true})).toBeEnabled();
        await expect(page.locator('.cycle-sorted-pictures img')).toHaveCount(1);
        await page.locator(`[data-cycle-bin="${round.objects[1].answer}"]`).click();
        await expect(page.locator('.whole-class-feedback.is-correct')).toBeVisible();
      }
    }
    if(activity==='letterTrace'){
      await page.getByRole('button',{name:'Change practice',exact:true}).click();
      await expect(page.getByRole('heading',{name:'Cycles · Class practice',exact:true})).toBeVisible();
      await page.getByRole('button',{name:'Exit full screen',exact:true}).click();
      await page.getByRole('button',{name:'Start class practice',exact:true}).click();
      await page.getByRole('button',{name:'Full screen',exact:true}).click();
      for(let i=0;i<plan.filter(round=>round.mechanicId===activity).length;i++)await page.getByRole('button',{name:'Next question',exact:true}).click();
      await expect(page.getByText('End of these questions. Choose more practice when the class is ready.',{exact:true})).toBeVisible();
      await page.getByRole('button',{name:'Exit full screen',exact:true}).click();
      await page.getByRole('button',{name:'Choose practice',exact:true}).click();
      continue;
    }
    await page.getByRole('button',{name:'Exit full screen',exact:true}).click();
    await page.getByRole('button',{name:'Change practice',exact:true}).click();
  }
});

test('Teach opens class Cycles practice, keeps mistakes for discussion and never starts a student sitting', async ({page})=>{
  await page.goto('/preview/teacher-a11y.html?surface=resources');
  const writes=[];page.on('request',request=>{if(request.method()==='POST'&&/rpc|rest\/v1/.test(request.url()))writes.push(request.url());});
  await page.getByRole('button',{name:'Open Cycles practice',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Cycles · Class practice',exact:true})).toBeVisible();
  await page.getByRole('combobox',{name:'Cycle',exact:true}).selectOption('cycle-10');
  await page.getByRole('combobox',{name:'Activity',exact:true}).selectOption('letterMatch');
  await page.getByRole('button',{name:'Start class practice',exact:true}).click();
  await expect(page.getByText('Practice question 1 of 12',{exact:true})).toBeVisible();
  const choices=page.locator('.whole-class-cycle .cycle-answer');
  await expect(choices.first()).toBeEnabled();
  await choices.first().click();
  await expect(page.locator('.whole-class-feedback')).toBeVisible();
  await expect(page.getByText('Practice question 1 of 12',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Show answer',exact:true}).click();
  await expect(page.locator('.whole-class-answer')).toBeVisible();
  await page.getByRole('button',{name:'Next question',exact:true}).click();
  await expect(page.getByText('Practice question 2 of 12',{exact:true})).toBeVisible();
  await expect(page.locator('.whole-class-feedback')).toHaveCount(0);
  await page.getByRole('button',{name:'Previous question',exact:true}).click();
  await expect(page.getByText('Practice question 1 of 12',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Back to Teach',exact:true}).click();
  await expect(page.getByRole('button',{name:'Open Cycles practice',exact:true})).toBeFocused();
  expect(writes).toEqual([]);
  expect(await page.evaluate(()=>[...Object.keys(localStorage),...Object.keys(sessionStorage)].filter(key=>/lp-(?:cycle-practice|mock-selection|mock-outbox|mock-pending)/.test(key)))).toEqual([]);
});

for(const width of [1920,1024])test(`MAP Mock class practice checks and reveals answers without learner writes at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1080});
  await page.addInitScript(() => Object.defineProperty(crypto,'randomUUID',{value:()=> 'teacher-whole-class-audit'}));
  await page.goto('/preview/teacher-a11y.html?surface=resources');
  const writes=[];page.on('request',request=>{if(request.method()==='POST'&&/rpc|rest\/v1/.test(request.url()))writes.push(request.url());});
  await page.getByRole('button',{name:'Open MAP Mock practice',exact:true}).click();
  await page.getByRole('combobox',{name:'Area',exact:true}).selectOption('print');
  await page.getByRole('button',{name:'Start class practice',exact:true}).click();
  await expect(page.locator('.literacy-mock-question')).toBeVisible();
  await page.locator('.literacy-mock-choice').first().click();
  const check=page.getByRole('button',{name:'Check answer',exact:true});
  // Native recorded playback must actually finish before the shared question
  // renderer accepts a response, just as in the learner implementation.
  await expect(check).toBeEnabled({timeout:30000});await check.click();
  await expect(page.locator('.whole-class-feedback')).toBeVisible();
  await page.getByRole('button',{name:'Show answer',exact:true}).click();
  await expect(page.locator('.whole-class-answer')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:`.artifacts/teach-class-practice-20261020/map-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:'Next question',exact:true}).click();
  await expect(page.getByText('Practice question 2 of 12',{exact:true})).toBeVisible();
  await expect(page.locator('.whole-class-answer')).toHaveCount(0);
  await page.getByRole('button',{name:'Back to Teach',exact:true}).click();
  await expect(page.getByRole('button',{name:'Open MAP Mock practice',exact:true})).toBeFocused();
  expect(writes).toEqual([]);
  expect(await page.evaluate(()=>[...Object.keys(localStorage),...Object.keys(sessionStorage)].filter(key=>/lp-(?:assessment-draft|mock-selection|mock-outbox|mock-pending)/.test(key)))).toEqual([]);
});

for (const width of [1366, 1024, 390]) {
  test(`teaching actions stay before maintenance and preserve evidence scope at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/preview/teacher-a11y.html?surface=today&focus-evidence=1");
    await expect(page.getByRole("heading", { name: "Do next", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Plan focused practice for Aisha in Initial Sounds" })).toBeVisible();
    await expect(page.locator(".teacher-today-metrics")).toBeHidden();
    await expect(page.locator(".teacher-today-priority-grid")).toContainText("Observed difficulty");
    await expect(page.locator(".teacher-today-priority-grid")).toContainText("Latest saved activity");
    await page.goto("/preview/teacher-a11y.html?surface=classes&focus-evidence=1");
    const row = page.getByRole("row").filter({ has: page.getByRole("button", { name: "View Aisha", exact: true }) });
    await expect(row.getByRole("button", { name: "View Aisha", exact: true })).toBeVisible();
    await expect(row.getByRole("button", { name: "Assess Aisha", exact: true })).toBeVisible();
    await expect(row.getByRole("button", { name: "Remove Aisha from class", exact: true })).toBeHidden();
    await expect(page.getByRole("columnheader", { name: "Focus accuracy", exact: true })).toHaveCount(0);
    await row.getByRole("button", { name: "View Aisha", exact: true }).click();
    const panel = page.getByRole("region", { name: "Student details: Aisha", exact: true });
    await expect(panel).toContainText("Current focus:");
    await expect(panel.getByRole("button", { name: "Plan focused practice for Aisha", exact: true })).toBeVisible();
    await expect(panel.getByRole("button", { name: "Start assessment", exact: true })).toBeEnabled();
    await expect(panel.getByText("Across skills:", { exact: true })).toBeHidden();
    await panel.locator(".teacher-student-panel-evidence > summary").click();
    await expect(panel.locator(".teacher-student-panel-summary").filter({ hasText: "Across skills:" })).toContainText("Not enough results");
    await expect(panel.getByRole("button", { name: /sign-in pictures for Aisha/ })).toBeHidden();
    await panel.locator(".teacher-student-manage > summary").click();
    await expect(panel.getByRole("button", { name: /sign-in pictures for Aisha/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `.artifacts/app-simplification/teacher/roster-${width}.png`, fullPage: true, animations: "disabled" });
  });
}

test("Summary keeps detailed evidence one step away, retains every source item, and exports the named workbook", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=report");
  await page.locator('.lg-report-nav a[href*="whole-child"]').click();
  const priority = page.getByRole("region", { name: "Current instructional priority" });
  await expect(priority).toContainText("Collect current independent answers before choosing what to teach next.");
  await expect(priority.getByRole("button", { name: "Start assessment", exact: true })).toBeEnabled();
  await expect(priority.getByRole("button", { name: "Plan focused practice", exact: true })).toHaveCount(0);
  await expect(page.locator(".simple-report-coverage")).not.toHaveAttribute("open", "");
  await page.locator(".simple-report-coverage > summary").click();
  await expect(page.locator(".simple-report-coverage")).toHaveAttribute("open", "");
  await expect(page.locator(".simple-report-intro")).toContainText("of 126 items have saved answers");
  const evidence = page.getByRole("region", { name: "All source items by literacy domain" });
  expect(await evidence.locator("details[open]").count()).toBeGreaterThan(0);
  await expect(evidence).not.toContainText("Nothing is in this group yet");
  for (const group of await evidence.locator("details").all()) {
    if (!await group.evaluate(element => element.open)) await group.locator(":scope > summary").click();
    const showAll = group.getByRole("button", { name: /^Show all \d+$/ });
    if (await showAll.count()) await showAll.click();
  }
  await expect(evidence.locator(".simple-report-tile")).toHaveCount(126);
  await page.locator(".lg-report-export-menu > summary").click();
  await expect(page.locator(".lg-report-export-options")).toContainText("Aarav · Summary");
  await expect(page.locator(".lg-report-export-options")).toContainText("progress across tabs");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download progress and results workbook (XLSX)", exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/^aarav-progress-\d{4}-\d{2}-\d{2}\.xlsx$/);
  const workbook = await readDownloadWorkbook(download);
  await expect(page.locator(".lg-report-export-options")).toBeHidden();
  await expect(page.locator(".lg-report-export-menu > summary")).toBeFocused();
  expect(workbook.worksheets.map(sheet => sheet.name)).toEqual(["Report", "Skills", "Data"]);
  expect(worksheetText(workbook.getWorksheet("Skills"))).toContain("Not assessed");
  expect(worksheetText(workbook.getWorksheet("Data"))).toContain("About this report");
  await page.screenshot({ path: ".artifacts/app-simplification/teacher/report-summary.png", fullPage: true, animations: "disabled" });
});

test("report print preparation restores disclosures after the print dialog closes", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=report");
  await page.locator('.lg-report-nav a[href*="whole-child"]').click();
  const before = await page.locator(".lg-report-main details").evaluateAll(rows => rows.map(row => row.open));
  await page.evaluate(() => { window.print = () => { window.__printExpanded = [...document.querySelectorAll('.lg-report-main details')].every(row => row.open); window.dispatchEvent(new Event('afterprint')); }; });
  await page.locator(".lg-report-export-menu > summary").click();
  await page.getByRole("button", { name: "Print current summary / Save as PDF", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__printExpanded)).toBe(true);
  await expect(page.locator(".lg-report-export-options")).toBeHidden();
  await expect(page.locator(".lg-report-export-menu > summary")).toBeFocused();
  expect(await page.locator(".lg-report-main details").evaluateAll(rows => rows.map(row => row.open))).toEqual(before);
});

async function expectFocusedHeadingClearOfControls(heading) {
  await expect(heading).toBeFocused();
  await expect.poll(async () => heading.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const teacherBar = document.querySelector(".teacher-context-bar");
    const reportNav = element.closest(".lg-report-shell").querySelector(".lg-report-nav");
    const obstructionBottom = Math.max(0, ...[teacherBar, reportNav].map(control => {
      if (!control || !["sticky", "fixed"].includes(getComputedStyle(control).position)) return 0;
      return control.getBoundingClientRect().bottom;
    }));
    return bounds.top >= obstructionBottom && bounds.bottom <= innerHeight;
  })).toBe(true);
}

async function expectReportControlsNotToOverlap(page) {
  await expect.poll(() => page.locator(".lg-report-nav").evaluate(nav => {
    const teacherBar = document.querySelector(".teacher-context-bar");
    // The desktop sidebar scrolls normally; only the mobile sticky selector
    // must stay stacked below the persistent teacher context controls.
    return !teacherBar || !["sticky", "fixed"].includes(getComputedStyle(nav).position)
      || nav.getBoundingClientRect().top >= teacherBar.getBoundingClientRect().bottom;
  })).toBe(true);
}

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
  test(`selected report heading stays focused below sticky controls at ${viewport.width}px`, async ({ page }, testInfo) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto("/preview/teacher-a11y.html?surface=progress&context=1#teacher/reports?class=00000000-0000-4000-8000-0000000000a1&learner=student-aarav");
    await page.evaluate(() => document.fonts.ready);
    // The hub keeps ownership of initial focus. Selecting a specific report
    // then moves focus and the viewport to that report's actual heading.
    await expect(page.getByRole("heading", { name: "Aarav · Summary", exact: true })).toBeFocused();
    await expectReportControlsNotToOverlap(page);
    await chooseStudentReportView(page, "skills-check");
    const heading = page.getByRole("heading", { name: "Skills", exact: true });
    await expectFocusedHeadingClearOfControls(heading);
    await expectReportControlsNotToOverlap(page);
    await expect(page.getByRole("combobox", { name: "Report for", exact: true })).toHaveValue("student-aarav");
    await expect(page).toHaveURL(/learner=student-aarav.*report=skills-check/);
    await expect.poll(() => page.locator(".lg-report-main h1, .simple-report-legend, .simple-report-legend > span, .simple-report-grid").evaluateAll(elements =>
      elements.every(element => {
        const bounds = element.getBoundingClientRect();
        return bounds.left >= 0 && bounds.right <= innerWidth;
      })
    )).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`selected-report-${viewport.width}.png`), animations: "disabled" });
    if (viewport.width <= 390) {
      await page.setViewportSize({ width: viewport.width === 320 ? 390 : 320, height: viewport.height });
      await expectReportControlsNotToOverlap(page);
      await expectFocusedHeadingClearOfControls(heading);
      await page.setViewportSize(viewport);
    }

    // A separately opened result opts in to the same visible-heading behavior;
    // the default embedded report above must not steal its parent's focus.
    await page.goto("/preview/teacher-a11y.html?surface=report&focus-report-heading=1&context=1");
    await page.evaluate(() => document.fonts.ready);
    await expectFocusedHeadingClearOfControls(page.getByRole("heading", { name: "EL assessments", exact: true }));
    await expectReportControlsNotToOverlap(page);
    expect(pageErrors).toEqual([]);
  });
}
