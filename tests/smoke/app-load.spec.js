import { expect, test } from "@playwright/test";

const FATAL_CONSOLE_PATTERNS = [
  /uncaught/i,
  /unhandled/i,
  /failed to load module script/i,
  /supabase is not configured/i,
  /error loading dynamically imported module/i
];

function isFatalConsoleMessage(message) {
  if (message.type() !== "error") return false;
  const text = message.text();
  return FATAL_CONSOLE_PATTERNS.some(pattern => pattern.test(text));
}

test.describe("app startup smoke", () => {
  test("loads the unauthenticated app shell without fatal startup errors", async ({ page }) => {
    const fatalConsoleErrors = [];
    const pageErrors = [];

    page.on("console", message => {
      if (isFatalConsoleMessage(message)) {
        fatalConsoleErrors.push(message.text());
      }
    });
    page.on("pageerror", error => {
      pageErrors.push(error.message);
    });

    await page.goto("/");
    await expect(page).toHaveTitle("Literacy Guide");
    await expect(page.locator("#root")).not.toHaveText("");
    await expect(page.getByRole("heading", { name: "Choose your space" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Children: Little Literacy Guides" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" })).toBeVisible();

    await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
    await expect(page.getByRole("heading", { name: "Teacher sign-in" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Literacy Guide" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();

    const rootBox = await page.locator("#root").boundingBox();
    expect(rootBox?.width ?? 0).toBeGreaterThan(0);
    expect(rootBox?.height ?? 0).toBeGreaterThan(0);
    expect(fatalConsoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});
