import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { id: "desktop", width: 1280, height: 900 },
  { id: "phone", width: 390, height: 844 }
];

for (const viewport of VIEWPORTS) {
  test(`A2.7 class-code panel is focused and balanced at ${viewport.id}`, async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/preview/student-login-preview.html");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    const panel = page.locator(".student-flow-card");
    const classCode = page.getByRole("textbox", { name: "Class code", exact: true });
    const go = page.getByRole("button", { name: "Go", exact: true });
    const teacherEscape = page.getByRole("button", { name: "I am a teacher", exact: true });
    const example = page.getByLabel("Class code example: ABC123", { exact: true });

    await expect(page.getByRole("heading", { name: "Enter your class code" })).toBeVisible();
    await expect(classCode).toBeVisible();
    await expect(go).toBeVisible();
    await expect(example).toBeVisible();
    await expect(example).toContainText("ABC123");
    await expect(teacherEscape).toBeVisible();
    await classCode.fill("AB12CD");
    await expect(go).toBeEnabled();

    const hierarchy = await page.evaluate(() => {
      const primary = getComputedStyle(document.querySelector(".student-flow-code-go"));
      const escape = getComputedStyle(document.querySelector(".student-teacher-escape"));
      return {
        primaryBackgroundImage: primary.backgroundImage,
        primaryFontSize: Number.parseFloat(primary.fontSize),
        escapeBackground: escape.backgroundColor,
        escapeFontSize: Number.parseFloat(escape.fontSize)
      };
    });
    expect(hierarchy.primaryBackgroundImage).not.toBe("none");
    expect(hierarchy.escapeBackground).toBe("rgba(0, 0, 0, 0)");
    expect(hierarchy.escapeFontSize).toBeLessThan(hierarchy.primaryFontSize);

    const dimensions = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight
    }));
    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
    expect(dimensions.documentHeight).toBeLessThanOrEqual(dimensions.viewportHeight);

    await expect(panel).toHaveScreenshot(`student-login-panel-${viewport.id}.png`, {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.01
    });
    expect(pageErrors).toEqual([]);
  });
}
