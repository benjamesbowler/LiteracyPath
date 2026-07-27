import { expect, test } from "@playwright/test";

test("@guided-reading-decoding-support shows seeded support-use events in the teacher report", async ({
  page
}) => {
  await page.goto("/tests/fixtures/guided-reading-support-report.html");

  await expect(page.getByRole("heading", { name: "Aarav · Guided Reading", exact: true })).toBeVisible();
  await expect(page.getByLabel("Report summary")).toContainText("Decoding supports");
  await expect(page.getByLabel("Report summary")).toContainText("3");

  await page.getByText("One Night in the Deep Dark", { exact: true }).click();
  const supportSection = page.getByRole("heading", { name: "Decoding support used", exact: true })
    .locator("..");
  await expect(supportSection).toContainText("night");
  await expect(supportSection).toContainText("Whole-word audio");
  await expect(supportSection).toContainText("Sound-by-sound support");
  await expect(supportSection).toContainText("Reread prompt");
  await expect(supportSection).toContainText("Page 1");
});
