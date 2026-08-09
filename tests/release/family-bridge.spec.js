import { expect, test } from "@playwright/test";

test("Family Bridge creates a cycle-linked Spanish family plan and printable privacy-safe document", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=resources");
  const card = page.locator('[data-resource-kind="family-bridge"]').locator("..");
  await card.getByRole("button", { name: "Make a family plan" }).click();
  const bridge = page.getByRole("main", { name: "Family Bridge" });
  await expect(bridge).toBeVisible();
  await bridge.getByLabel("Plan for").selectOption("student-aarav");
  await bridge.getByLabel("Family language").selectOption("es");
  await expect(bridge).toContainText("Cinco momentos breves de lectura");
  await expect(bridge).toContainText("práctica de lectura en inglés");
  await expect(bridge.locator(".family-bridge-preview li")).toHaveCount(5);
  await expect(bridge).toContainText("does not record a child’s voice or image");

  await page.evaluate(() => {
    window.__familyPrint = { html: "", printed: false };
    window.open = () => ({
      document: {
        open() {},
        write(html) { window.__familyPrint.html = html; },
        close() {}
      },
      focus() {},
      print() { window.__familyPrint.printed = true; }
    });
  });
  await bridge.getByRole("button", { name: "Print family plan" }).click();
  const printed = await page.evaluate(() => window.__familyPrint);
  expect(printed.printed).toBe(true);
  expect(printed.html).toContain("Cinco momentos breves de lectura");
  expect(printed.html).toContain("Nothing on this sheet records a child’s voice or image");
});

test("Family Bridge fits a phone-sized teaching screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/teacher-a11y.html?surface=resources");
  await page.locator('[data-resource-kind="family-bridge"]').locator("..").getByRole("button").click();
  const bridge = page.getByRole("main", { name: "Family Bridge" });
  const overflow = await bridge.evaluate(element => element.scrollWidth - element.clientWidth);
  expect(overflow).toBe(0);
});
