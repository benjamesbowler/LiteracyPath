import { expect, test } from "@playwright/test";

for (const width of [1366, 1024, 390]) {
  test(`production roster actions stay compact and separate at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/preview/teacher-a11y.html?surface=classes&students=12&cycle=cycle-3");
    const row = page.getByRole("row").filter({ has: page.getByRole("button", { name: "View Aarav", exact: true }) });
    await expect(row).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const layout = await row.evaluate(element => ({
      height: element.getBoundingClientRect().height,
      actions: [...element.querySelectorAll(".teacher-roster-teaching-actions > button, .teacher-roster-row-manage > summary")]
        .map(action => ({ text: action.textContent, ...action.getBoundingClientRect().toJSON() }))
    }));
    expect(layout.height).toBeLessThan(90);
    expect(layout.actions).toHaveLength(4);
    for (const action of layout.actions) {
      expect(action.width).toBeGreaterThanOrEqual(44);
      expect(action.height).toBeGreaterThanOrEqual(44);
      expect(Math.abs(action.top - layout.actions[0].top)).toBeLessThan(1);
    }
    for (const [index, action] of layout.actions.entries()) {
      if (index) expect(action.left).toBeGreaterThanOrEqual(layout.actions[index - 1].right);
    }
    await row.getByRole("button", { name: "Assess Aarav", exact: true }).click();
    expect(await page.evaluate(() => window.__teacherPreviewAssessment)).toEqual({ studentId: "student-aarav" });
    await row.getByRole("button", { name: "Start practice for Aarav", exact: true }).click();
    expect(await page.evaluate(() => window.__teacherPreviewPractice)).toEqual({
      studentIds: ["student-aarav"],
      context: { target: "cycle_practice", cycleId: "cycle-3" }
    });
    const manage = row.locator('summary[aria-label="Manage Aarav"]');
    await manage.focus();
    await page.keyboard.press("Enter");
    const remove = row.getByRole("button", { name: "Remove Aarav from class", exact: true });
    await expect(remove).toBeVisible();
    await remove.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Yes, delete Aarav permanently", exact: true })).toBeDisabled();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(row).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `.artifacts/app-simplification/teacher/actions-${width}.png`, fullPage: true, animations: "disabled" });
  });
}

test("Today distinguishes current difficulty from a missing result and keeps actions ahead of counts", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=today&focus-evidence=1&focus-sparse=1");
  const briefing = page.getByRole("region", { name: "Today's class briefing" });
  const attention = briefing.getByRole("region", { name: "Who needs attention" });
  const collect = briefing.getByRole("region", { name: "Collect current results" });
  await expect(attention).toContainText("Observed difficulty");
  await expect(collect).toContainText("This is not demonstrated learning difficulty.");
  await expect(briefing.locator(".teacher-today-metrics")).toBeHidden();
  const ordered = await briefing.locator(".teacher-today-priority-grid > section").evaluateAll(zones => zones.map(zone => zone.getAttribute("aria-label")));
  expect(ordered.indexOf("Who needs attention")).toBeLessThan(ordered.indexOf("Collect current results"));
  await attention.getByRole("button", { name: "Plan focused practice for Aisha in Initial Sounds", exact: true }).click();
  const planner = page.getByRole("region", { name: "Support plans", exact: true });
  await expect(planner.getByRole("textbox", { name: "Teaching activity", exact: true }))
    .toHaveValue("Model Initial Sounds, practise together, then try independently. Record this teaching observation separately from the next Skills assessment.");
  await expect(planner.getByLabel("Aisha", { exact: true })).toBeChecked();
  await expect(planner.getByLabel("Aarav", { exact: true })).not.toBeChecked();
  await expect(page.locator("details.teacher-dashboard-secondary")).toHaveAttribute("open", "");
});
