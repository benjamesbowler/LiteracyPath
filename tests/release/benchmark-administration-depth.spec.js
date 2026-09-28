import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { EL_BENCHMARK_FORM_ID, getElBenchmarkPlan } from "../../src/data/elBenchmarkAssessments.js";

const artifacts = ".artifacts/assessment-depth";
mkdirSync(artifacts, { recursive: true });
const openAssessment = (page, assessment, extra = "") => page.goto(`/preview/teacher-a11y.html?surface=assessment&assessment=${assessment}&grade=1&window=BOY&start=early_partial${extra}`);
const draft = (page, assessment) => page.evaluate(id => JSON.parse(localStorage.getItem(`assessment-depth-preview:${id}`)), assessment);

// All records in this suite are synthetic preview records; no hosted data is written.
test("detailed spelling keeps exact writing, observations and correction through resume", async ({ page }) => {
  await openAssessment(page, "el_encoding");
  const plan = getElBenchmarkPlan({ assessmentId: "el_encoding", formId: EL_BENCHMARK_FORM_ID, grade: "1", window: "BOY", startMicrophase: "early_partial" });
  await page.getByRole("button", { name: "Add detail", exact: true }).click();
  await page.getByRole("textbox", { name: /Student's spelling/ }).fill("sop");
  await page.getByRole("textbox", { name: /What you noticed/ }).fill("Used s for the first sound.");
  await expect(page.getByRole("region", { name: "Compare the spelling" })).toContainText("s");
  await page.getByRole("button", { name: "Not yet", exact: true }).click();
  await expect(page.getByRole("heading", { name: `Item 1 of ${plan.items.length}`, exact: true })).toBeVisible();
  expect((await draft(page, "el_encoding")).responses[plan.items[0].id].transcription).toBe("sop");
  await page.getByRole("button", { name: "Next item", exact: true }).click();
  await expect(page.getByRole("heading", { name: `Item 2 of ${plan.items.length}`, exact: true })).toBeVisible();
  await openAssessment(page, "el_encoding", "&resume=1");
  await expect(page.getByRole("button", { name: "Add detail", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Change previous answer/ }).click();
  await expect(page.getByRole("textbox", { name: /Student's spelling/ })).toHaveValue("sop");
  await expect(page.getByRole("textbox", { name: /What you noticed/ })).toHaveValue("Used s for the first sound.");
  await page.getByRole("textbox", { name: /Student's spelling/ }).fill(plan.items[0].targetWord);
  await page.getByRole("button", { name: "Correct spelling", exact: true }).click();
  expect((await draft(page, "el_encoding")).responses[plan.items[0].id].isCorrect).toBe(true);
  await page.screenshot({ path: `${artifacts}/spelling-detail.png`, fullPage: true });
  await page.getByText("Review answers or instructions", { exact: true }).click();
  await page.getByRole("searchbox", { name: "Find an item or response" }).fill(plan.items[0].targetWord);
  await expect(page.locator(".el-benchmark-response-list li")).toHaveCount(1);
  await page.getByRole("searchbox", { name: "Find an item or response" }).fill("no-such-response");
  await expect(page.getByText("No matching items. Clear the search or choose All items.")).toBeVisible();
});

test("the student window contains only independent reading and follows the selected word", async ({ page, context }) => {
  await openAssessment(page, "el_decoding");
  const firstWord = await page.locator(".el-benchmark-word-display").innerText();
  const popupPromise = context.waitForEvent("page");
  await page.getByRole("button", { name: "Open student display", exact: true }).click();
  const student = await popupPromise;
  await expect(student.getByRole("heading", { level: 1 })).toHaveText(firstWord);
  await expect(student.locator("body")).not.toContainText(/Aarav|Straight away|Worked it out|Not correct|teacher judgment|starting reading stage/i);
  await expect(student.getByRole("button")).toHaveCount(0);
  await page.getByRole("button", { name: "Straight away", exact: true }).click();
  const nextWord = await page.locator(".el-benchmark-word-display").innerText();
  expect(nextWord).not.toBe(firstWord);
  await expect(student.getByRole("heading", { level: 1 })).toHaveText(nextWord);
  await student.screenshot({ path: `${artifacts}/student-reading-display.png` });
  await page.getByRole("button", { name: "Close student display", exact: true }).click();
  await expect.poll(() => student.isClosed()).toBe(true);
});

test("oral assessment distinguishes no response in detailed mode and keeps print off the student copy", async ({ page, context }) => {
  await openAssessment(page, "el_phonological_awareness");
  await page.getByRole("button", { name: "Add detail", exact: true }).click();
  const popupPromise = context.waitForEvent("page");
  await page.getByRole("button", { name: "Open student display", exact: true }).click();
  const student = await popupPromise;
  await expect(student.getByRole("heading", { name: "Listen and say" })).toBeVisible();
  await expect(student.locator("body")).not.toContainText(/rhyme|moon|spoon|answer guide|Aarav/i);
  await page.getByRole("button", { name: "Close student display", exact: true }).click();
  await page.getByRole("textbox", { name: /Exact student answer/ }).fill("a first attempt");
  await page.getByRole("button", { name: "No response", exact: true }).click();
  await expect(page.getByRole("textbox", { name: /Exact student answer/ })).toHaveValue("");
  const saved = await draft(page, "el_phonological_awareness");
  expect(Object.values(saved.responses)[0].status).toBe("no_response");
  expect(saved.currentItemIndex).toBe(0);
  await page.getByRole("textbox", { name: /Exact student answer/ }).fill("light");
  await expect(page.getByRole("button", { name: "Next item", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Record as correct", exact: true }).click();
  expect(Object.values((await draft(page, "el_phonological_awareness")).responses)[0].responseText).toBe("light");
  await page.getByRole("button", { name: "Next item", exact: true }).click();
  await expect(page.getByRole("heading", { name: /^Item 2 of/ })).toBeVisible();
});

test("fluency timer remains valid only for a continuous read and clean print excludes judgments", async ({ page }) => {
  test.setTimeout(90_000);
  await page.clock.install();
  await openAssessment(page, "el_oral_reading_fluency");
  await expect(page.getByRole("button", { name: "Print reading copy", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Start 1-minute read", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open student display", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save & exit", exact: true })).toBeDisabled();
  await page.clock.runFor(60_250);
  await expect(page.getByRole("timer")).toHaveText("00:00");
  await page.locator(".el-benchmark-tokenized-passage button").nth(19).click();
  await page.locator(".el-benchmark-desktop-counters").getByRole("button", { name: "Add one errors", exact: true }).click();
  const saved = await draft(page, "el_oral_reading_fluency");
  const response = Object.values(saved.responses)[0];
  expect(response.elapsedSeconds).toBe(60);
  expect(response.wordsAttempted).toBe(20);
  expect(response.errors).toBe(1);
  await expect(page.getByRole("button", { name: "Not yet — finish here", exact: true })).toBeVisible();
  await page.getByText("Talk about the passage", { exact: false }).click();
  await expect(page.getByRole("textbox", { name: "Student’s explanation (optional)" })).not.toBeVisible();
  await page.getByRole("checkbox", { name: "The student has now read the complete passage" }).check();
  await page.getByRole("textbox", { name: "Student’s explanation (optional)" }).fill("They used a stick to keep the hen in.");
  expect(Object.values((await draft(page, "el_oral_reading_fluency")).responses)[0].wordsAttempted).toBe(20);
  await page.screenshot({ path: `${artifacts}/fluency-recording.png`, fullPage: true });
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
  await expect(page.locator(".el-benchmark-print-sheet")).toBeVisible();
  await expect(page.locator(".el-benchmark-topbar")).not.toBeVisible();
  await expect(page.locator(".el-benchmark-print-sheet")).not.toContainText(/Aarav|errors|accuracy|scoring|Not yet/i);
  await page.pdf({ path: `${artifacts}/fluency-student-copy.pdf`, preferCSSPageSize: true });
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: "Not yet — finish here", exact: true }).click();
  expect((await draft(page, "el_oral_reading_fluency")).fluencyStop.confirmed).toBe(true);
  await page.getByRole("textbox", { name: "Student’s explanation (optional)" }).fill("They put the pots away safely.");
  expect((await draft(page, "el_oral_reading_fluency")).fluencyStop.confirmed).toBe(true);
});

for (const [width, height] of [[1366, 900], [1024, 768], [390, 844]]) {
  test(`all four recording modes fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    for (const mode of ["el_phonological_awareness", "el_encoding", "el_decoding", "el_oral_reading_fluency"]) {
      await openAssessment(page, mode);
      await expect(page.locator(".el-benchmark-item-card")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      expect(await page.locator(".el-benchmark-shell").evaluate(el => el.getBoundingClientRect().height >= el.scrollHeight - 2)).toBe(true);
      if (width === 390 && mode === "el_encoding") expect(await page.locator(".el-benchmark-protected-script").evaluate(el => el.getBoundingClientRect().bottom <= window.innerHeight)).toBe(true);
      if (mode === "el_oral_reading_fluency") expect(await page.locator(".el-benchmark-tokenized-passage button").first().evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
      await page.screenshot({ path: `${artifacts}/${mode}-${width}.png` });
    }
  });
}

test("the longest passage has a complete readable student display and a clean print copy", async ({ page, context }) => {
  await page.goto("/preview/teacher-a11y.html?surface=assessment&assessment=el_oral_reading_fluency&grade=2&window=EOY&start=late_consolidated&form=form-b-v2");
  const popupPromise = context.waitForEvent("page");
  await page.getByRole("button", { name: "Open student display", exact: true }).click();
  const student = await popupPromise;
  await expect(student.getByRole("heading", { name: "Why Wetlands Matter" })).toBeVisible();
  await student.evaluate(() => document.fonts.ready);
  expect(await student.locator("main").evaluate(el => el.getBoundingClientRect().height <= window.innerHeight)).toBe(true);
  await student.screenshot({ path: `${artifacts}/long-fluency-student-display.png` });
  await page.getByRole("button", { name: "Close student display", exact: true }).click();
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
  await expect(page.locator(".el-benchmark-print-sheet")).toHaveAttribute("data-density", "long");
  await page.pdf({ path: `${artifacts}/long-fluency-student-copy.pdf`, preferCSSPageSize: true });
});

test("legacy draft keeps its form while a known content defect has only a not-scorable action", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=assessment&assessment=el_phonological_awareness&grade=K&window=MOY&form=form-c-v1");
  await expect(page.getByText("Earlier assessment form", { exact: true })).toBeVisible();
  await page.getByText("Review answers or instructions", { exact: true }).click();
  await page.getByRole("button", { name: "Item 8, not done yet", exact: true }).click();
  await expect(page.getByText("This item needs a content correction", { exact: true })).toBeVisible();
  await expect(page.locator(".el-benchmark-item-card")).not.toContainText("Blend /f/ /o/ /x/");
  await expect(page.getByRole("button", { name: "Correct", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Record as not scorable", exact: true }).click();
  const saved = await draft(page, "el_phonological_awareness");
  expect(saved.formId).toBe("form-c-v1");
  expect(saved.responses["pa-k-moy-c-08-v1"].status).toBe("not_scorable");
  expect(saved.responses["pa-k-moy-c-08-v1"].notScorableReason).toBe("directions_or_material_issue");
});
