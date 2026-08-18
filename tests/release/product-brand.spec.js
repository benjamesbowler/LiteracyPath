import { expect, test } from "@playwright/test";

const PRODUCT_NAME = "Literacy Guide";
const LEGACY_PRODUCT_NAME = /Literacy\s*Path/i;

test("the browser shell and no-script loading screen use the current product name", async ({ browser, page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(PRODUCT_NAME);
  await expect(page.locator('meta[name="application-name"]')).toHaveAttribute("content", PRODUCT_NAME);
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute("content", PRODUCT_NAME);
  await expect(page.locator("body")).not.toContainText(LEGACY_PRODUCT_NAME);

  const noScriptContext = await browser.newContext({ javaScriptEnabled: false });
  const noScriptPage = await noScriptContext.newPage();
  await noScriptPage.goto("/");
  await expect(noScriptPage.getByRole("status")).toContainText(PRODUCT_NAME);
  await expect(noScriptPage.getByRole("status")).not.toContainText(LEGACY_PRODUCT_NAME);
  await noScriptContext.close();
});
