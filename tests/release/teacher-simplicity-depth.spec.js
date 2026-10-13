import { expect, test } from "@playwright/test";

const classId = "00000000-0000-4000-8000-0000000000a1";
test.setTimeout(90_000);

test("a class book preview has explicit reading audiences and a Teach return", async ({ page }) => {
  const bookId = "level-c-nonfiction-01-bees";
  await page.goto(`/preview/guided-reading-preview.html?book=${bookId}&mode=class&assignment&audience-actions`);
  const actions = page.getByRole("region", { name: "Use this book", exact: true });
  await expect(actions).toContainText("Preview: Honeybees and Pollination");
  await actions.getByRole("button", { name: "Read with a student", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__guidedReadingStudentBookId)).toBe(bookId);
  await actions.getByRole("button", { name: "Read together", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__guidedReadingTogetherBookId)).toBe(bookId);
  await actions.getByRole("button", { name: "Assign independently", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__guidedReadingAssignedBookId)).toBe(bookId);
  expect(await actions.evaluate(node => node.getBoundingClientRect().height)).toBeLessThan(130);
  await page.screenshot({ path: ".artifacts/teacher-simplicity/book-audiences.png", animations: "disabled" });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const button of await actions.getByRole("button").all()) {
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: ".artifacts/teacher-simplicity/book-audiences-phone.png", animations: "disabled" });
  await page.getByRole("button", { name: "Back to reading library", exact: true }).click();
  await page.getByRole("button", { name: "Back to Teach" }).click();
  await expect.poll(() => page.evaluate(() => window.__guidedReadingBack)).toBe(true);
});

test("teacher recommendation cards and explanations agree with reviewed App text bands", async ({ page }) => {
  await page.goto("/preview/guided-reading-preview.html?mode=teacher&library&saved-reading");
  const recommendations = page.getByRole("region", { name: "Guided reading recommendations", exact: true });
  await expect(recommendations).toContainText("App level D books to consider");
  const cards = recommendations.locator("article");
  expect(await cards.count()).toBeGreaterThan(0);
  for (const card of await cards.all()) {
    await expect(card).toContainText("App level D");
    await expect(card).not.toContainText("Level B");
    await expect(card).toContainText("no specific skill match");
  }
  await recommendations.locator("summary").first().click();
  await expect(recommendations).toContainText("Opening a book does not establish independent reading ability");
  // Opening one reason must not stretch all of the other book cards.
  expect(await cards.nth(1).evaluate(node => node.getBoundingClientRect().height)).toBeLessThan(300);
  await page.screenshot({ path: ".artifacts/teacher-simplicity/reading-recommendations.png", animations: "disabled" });
});

test("Present opens the current class cycle and offers deliberate saved-lesson selection", async ({ page }) => {
  await page.addInitScript(id => localStorage.setItem(`lp-present-workspace:${id}`, JSON.stringify({ version: 1, cycleId: "cycle-9", day: "friday" })), classId);
  await page.goto(`/preview/teacher-a11y.html?surface=present&workspace-class=${classId}&cycle=cycle-6`);
  const cycle = page.getByRole("combobox", { name: "Cycle", exact: true });
  await expect(cycle).toHaveValue("cycle-6");
  await expect(page.getByRole("button", { name: "Back to Teach" })).toBeVisible();
  await page.getByRole("button", { name: "Use saved lesson", exact: true }).click();
  await expect(cycle).toHaveValue("cycle-9");
  await expect(page.getByRole("combobox", { name: "Day", exact: true })).toHaveValue("friday");
  await expect(page.getByRole("status")).toContainText("from the beginning");
  await page.getByRole("button", { name: "Use current class lesson", exact: true }).click();
  await expect(cycle).toHaveValue("cycle-6");
  await cycle.selectOption("cycle-8");
  await page.reload();
  await expect(cycle).toHaveValue("cycle-6");
  await expect(page.getByText(/Saved lesson:/)).toContainText("Cycle 9");
  await page.screenshot({ path: ".artifacts/teacher-simplicity/present-current-lesson.png", animations: "disabled" });
});

test("worksheet suggestion is ready to preview while every activity remains discoverable", async ({ page }) => {
  await page.goto(`/preview/teacher-a11y.html?surface=worksheets&workspace-class=${classId}&cycle=cycle-10`);
  const suggestion = page.getByRole("region", { name: "Suggested worksheet activity" });
  await expect(suggestion).toContainText("Build and spell words");
  await expect(page.getByRole("button", { name: "Open print preview", exact: true })).toBeEnabled();
  const catalogue = page.locator(".ws-all-activities");
  await expect(catalogue).not.toHaveAttribute("open", "");
  await page.getByRole("button", { name: "Change activity", exact: true }).click();
  await expect(page.getByRole("searchbox", { name: "Find an activity" })).toBeFocused();
  await expect(page.getByRole("radiogroup", { name: "Available printable activities" })).toBeVisible();
  await page.getByRole("radio", { name: /Letter formation/ }).click();
  await expect(suggestion).toContainText("Your chosen activity");
  await page.getByRole("button", { name: "Use cycle suggestion", exact: true }).click();
  await expect(suggestion).toContainText("Suggested for this cycle");
  await page.getByRole("combobox", { name: "Pack length", exact: true }).selectOption("4");
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Pack length", exact: true })).toHaveValue("4");
  await expect(catalogue).not.toHaveAttribute("open", "");
  await page.screenshot({ path: ".artifacts/teacher-simplicity/worksheet-suggestion.png", animations: "disabled" });
});

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test(`child continuation leads the page and keeps all eight destinations at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/preview/student-home-preview.html?scenario=continuation");
    const primary = page.locator('[data-home-priority="primary"]');
    await expect(primary).toHaveAccessibleName("Continue Sound Seekers — 135 adventures left");
    await expect(primary).toHaveAccessibleDescription("Planks for the Ford Your daily adventure is complete, so this is a good next choice.");
    await expect(primary).toBeInViewport({ ratio: 1 });
    const heroBeforeHollow = await page.locator(".kg-home-feature").evaluate(node => node.firstElementChild?.classList.contains("kg-home-continue"));
    expect(heroBeforeHollow).toBe(true);
    await expect(page.locator('[data-home-priority="choice"]')).toHaveCount(8);
    await page.getByRole("button", { name: "Hear this", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-student-guide-spoken", "Carry on where you stopped. Sound Seekers. Planks for the Ford. Your daily adventure is complete, so this is a good next choice.");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `.artifacts/teacher-simplicity/child-home-${viewport.width}.png`, animations: "disabled" });
    await primary.click();
    await expect(page.locator("html")).toHaveAttribute("data-student-destination", "sound-seekers");
  });
}
