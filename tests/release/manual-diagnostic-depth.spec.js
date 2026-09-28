import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const artifacts = ".artifacts/assessment-depth";
mkdirSync(artifacts, { recursive: true });
const open = (page, kind, extra = "") => page.goto(`/preview/teacher-a11y.html?surface=${kind}-assessment${extra}`);
const draft = (page, kind) => page.evaluate(name => JSON.parse(localStorage.getItem(`manual-diagnostic-preview:${name}`)), kind);
const mark = (page, outcome = "Correct") => page.getByRole("button", { name: outcome, exact: true }).click();
const continueTask = page => page.getByRole("button", { name: /^Continue to/ }).click();
const saveItem = page => page.getByRole("button", { name: /^(Save and next|Finish and save)$/ }).click();
async function correctItem(page) {
  await mark(page);
  await continueTask(page);
  await mark(page);
  await saveItem(page);
}

// Synthetic local fixture uses the production runner and data; these are not hosted-save claims.
test("pattern pronunciation is recorded before a clean word stimulus is shown", async ({ page }) => {
  await open(page, "pattern");
  await expect(page.locator(".md-glyph")).toHaveText("oa");
  await expect(page.getByRole("button", { name: /2\s*Word reading/ })).toBeDisabled();
  await page.getByRole("button", { name: "Show student view", exact: true }).click();
  const pupil = page.getByRole("dialog", { name: "Student stimulus" });
  await expect(pupil).toBeVisible();
  await expect(pupil).not.toContainText(/boat|Correct|Not yet|Aarav|Scoring guidance/);
  await expect(page.getByRole("button", { name: "Correct", exact: true })).toHaveCount(0);
  expect(await page.locator("#root").evaluate(root => root.inert)).toBe(true);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Back to teacher" })).toBeFocused();
  await page.screenshot({ path: `${artifacts}/pattern-pupil-desktop.png` });
  await page.keyboard.press("Escape");
  await expect(pupil).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Show student view" })).toBeFocused();
  await mark(page, "Not yet");
  await continueTask(page);
  await expect(page.getByRole("alert")).toContainText("what the student said");
  await expect(page.locator(".md-glyph")).toHaveText("oa");
  await page.getByRole("textbox", { name: /What the student said/ }).fill("ah");
  await continueTask(page);
  await expect(page.locator(".md-glyph")).toHaveText("boat");
  await mark(page, "No response");
  await saveItem(page);
  const saved = await draft(page, "pattern");
  expect(saved.entries[0].soundOutcome).toBe("incorrect");
  expect(saved.entries[0].responseEvidence.sound.responseText).toBe("ah");
  expect(saved.entries[0].wordOutcome).toBe("no_response");
  await page.screenshot({ path: `${artifacts}/pattern-teacher-desktop.png`, fullPage: true });
});

test("letter partial draft resumes the missing sound without inventing a wrong answer", async ({ page }) => {
  await open(page, "letter");
  await mark(page);
  await page.getByRole("textbox", { name: /What the student said/ }).fill("ay");
  await page.getByRole("button", { name: "Save & exit", exact: true }).click();
  await expect(page.getByTestId("manual-preview-saved")).toBeVisible();
  await open(page, "letter", "&resume=1");
  await expect(page.locator(".md-progress")).toContainText("Item 1 of 52");
  await expect(page.locator(".md-record-heading h3")).toHaveText("Letter sound");
  await expect(page.locator(".md-outcomes [aria-pressed=true]")).toHaveCount(0);
  expect((await draft(page, "letter")).entries[0].responseEvidence.name.responseText).toBe("ay");
  await mark(page, "Not scorable");
  await saveItem(page);
  await expect(page.getByRole("alert")).toContainText("why this response");
  await page.getByRole("textbox", { name: "Observation or access note" }).fill("An interruption stopped this response.");
  await saveItem(page);
  expect((await draft(page, "letter")).entries[0].soundOutcome).toBe("not_scorable");
});

test("save failure keeps both choices and transcript ready for a single retry", async ({ page }) => {
  await open(page, "letter", "&save=fail-once");
  await mark(page, "Not yet");
  await page.getByRole("textbox", { name: /What the student said/ }).fill("bee");
  await continueTask(page);
  await mark(page);
  await saveItem(page);
  await expect(page.getByRole("alert")).toContainText("could not be saved");
  await expect(page.locator(".md-progress")).toContainText("Item 1 of 52");
  await expect(page.getByRole("button", { name: "Correct", exact: true })).toHaveAttribute("aria-pressed", "true");
  await saveItem(page);
  await expect(page.locator(".md-progress")).toContainText("Item 2 of 52");
  const saved = await draft(page, "letter");
  expect(saved.entries).toHaveLength(1);
  expect(saved.entries[0].responseEvidence.name.responseText).toBe("bee");
});

test("correcting an earlier item preserves later responses and their evidence", async ({ page }) => {
  await open(page, "pattern");
  await correctItem(page);
  await mark(page);
  await continueTask(page);
  await page.getByRole("textbox", { name: /What the student said/ }).fill("chair");
  await mark(page);
  await saveItem(page);
  const before = (await draft(page, "pattern")).entries[1];
  await page.getByText("Review recorded items", { exact: true }).click();
  await page.locator(".md-review button").filter({ hasText: "oa" }).click();
  await mark(page, "Not yet");
  await page.getByRole("textbox", { name: /What the student said/ }).fill("ah");
  await continueTask(page);
  await saveItem(page);
  const after = await draft(page, "pattern");
  expect(after.entries).toHaveLength(2);
  expect(after.entries[1]).toEqual(before);
  expect(after.entries[0].soundOutcome).toBe("incorrect");
});

test("no response cannot retain a contradictory transcription", async ({ page }) => {
  await open(page, "letter");
  await page.getByRole("textbox", { name: /What the student said/ }).fill("bee");
  await mark(page, "No response");
  await expect(page.getByRole("textbox", { name: /What the student said/ })).toHaveValue("");
  await page.getByRole("textbox", { name: /What the student said/ }).fill("ay");
  await expect(page.locator(".md-outcomes [aria-pressed=true]")).toHaveCount(0);
  await continueTask(page);
  await expect(page.getByRole("alert")).toContainText("Choose an outcome");
});

for (const [kind, count] of [["letter", 52], ["pattern", 33]]) {
  test(`${kind} completes every planned item and displays read-only evidence without mastery claims`, async ({ page }) => {
    test.setTimeout(180_000);
    await open(page, kind);
    for (let index = 0; index < count; index += 1) {
      await expect(page.locator(".md-progress")).toContainText(`Item ${index + 1} of ${count}`);
      await correctItem(page);
    }
    await expect(page.getByRole("heading", { name: "Assessment recorded", exact: true })).toBeVisible();
    await expect(page.locator(".md-summary-grid article").first()).toContainText(`${count} of ${count}`);
    await expect(page.locator(".md-evidence-list article")).toHaveCount(count);
    await expect(page.locator(".md-evidence button")).toHaveCount(0);
    await expect(page.locator(".md-complete")).toContainText("no automatic placement or mastery judgement");
    expect((await draft(page, kind)).entries).toHaveLength(count);
    await page.screenshot({ path: `${artifacts}/${kind}-completed-desktop.png`, fullPage: true });
  });
}

for (const viewport of [{ width: 1024, height: 768 }, { width: 390, height: 844 }]) {
  for (const kind of ["letter", "pattern"]) {
    test(`${kind} fits ${viewport.width}px with touch-sized controls and a clean pupil view`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await open(page, kind);
      await expect(page.getByRole("heading", { name: kind === "letter" ? "Letter names and sounds" : "Phonics patterns", exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const buttons = await page.locator(".md-outcomes button").evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
      expect(buttons.every(height => height >= 44)).toBe(true);
      await page.screenshot({ path: `${artifacts}/${kind}-teacher-${viewport.width}.png`, fullPage: true });
      await page.getByRole("button", { name: "Show student view" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `${artifacts}/${kind}-pupil-${viewport.width}.png` });
      await page.getByRole("button", { name: "Back to teacher" }).click();
      await correctItem(page);
      await expect(page.locator(".md-progress")).toContainText("Item 2 of");
    });
  }
}
