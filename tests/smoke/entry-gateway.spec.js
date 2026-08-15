import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("student and teacher entry gateway", () => {
  test("separates both brands, responds cleanly, and opens both sign-in paths", async ({ page }, testInfo) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    await page.goto("/");

    const studentCard = page.getByRole("button", { name: "Children: Little Literacy Guides" });
    const teacherCard = page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" });
    await expect(page.getByRole("heading", { name: "Choose your space" })).toBeVisible();
    await expect(studentCard).toBeVisible();
    await expect(teacherCard).toBeVisible();
    await expect(studentCard).toContainText("Children: Little Literacy Guides");
    await expect(teacherCard).toContainText("Teachers: Literacy Guide Teacher Tools");

    const brandImages = page.locator(".entry-brand-logo");
    await expect(brandImages).toHaveCount(2);
    await expect.poll(async () => brandImages.evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);

    const [studentBox, teacherBox] = await Promise.all([studentCard.boundingBox(), teacherCard.boundingBox()]);
    expect(studentBox).not.toBeNull();
    expect(teacherBox).not.toBeNull();
    if (testInfo.project.name === "mobile") {
      expect(Math.abs(studentBox.x - teacherBox.x)).toBeLessThan(2);
      expect(teacherBox.y).toBeGreaterThan(studentBox.y + studentBox.height - 2);
    } else {
      expect(Math.abs(studentBox.y - teacherBox.y)).toBeLessThan(2);
      expect(teacherBox.x).toBeGreaterThan(studentBox.x + studentBox.width - 2);
    }

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(hasHorizontalOverflow).toBe(false);

    const accessibility = await new AxeBuilder({ page }).include(".student-entry-page").analyze();
    const seriousViolations = accessibility.violations.filter(({ impact }) => impact === "serious" || impact === "critical");
    expect(seriousViolations).toEqual([]);

    await studentCard.focus();
    await expect(studentCard).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Enter your class code" })).toBeVisible();

    await page.reload();
    const reloadedTeacherCard = page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" });
    await reloadedTeacherCard.click();
    await expect(page.getByRole("heading", { name: "Teacher sign-in" })).toBeVisible();
    await page.getByRole("button", { name: "Back to selection" }).click();
    await expect(page.getByRole("heading", { name: "Choose your space" })).toBeVisible();

    await page.setViewportSize({ width: 820, height: 500 });
    const shortViewportLayout = await page.locator(".student-entry-page").evaluate(pageRoot => {
      const cards = [...pageRoot.querySelectorAll(".student-entry-card")];
      const actions = [...pageRoot.querySelectorAll(".student-entry-card-cta")];
      return {
        pageHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        cardBottoms: cards.map(card => card.getBoundingClientRect().bottom),
        actionBottoms: actions.map(action => action.getBoundingClientRect().bottom),
        horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth
      };
    });
    expect(shortViewportLayout.pageHeight).toBeGreaterThan(shortViewportLayout.viewportHeight);
    expect(shortViewportLayout.horizontalOverflow).toBeLessThanOrEqual(1);
    expect(shortViewportLayout.cardBottoms.every(bottom => bottom <= shortViewportLayout.pageHeight)).toBe(true);
    expect(shortViewportLayout.actionBottoms.every((bottom, index) => bottom <= shortViewportLayout.cardBottoms[index] + 1)).toBe(true);
    expect(pageErrors).toEqual([]);
  });
});
