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
    await expect(page.getByRole("heading", { name: "Teacher Login" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Literacy Guide" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log In" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign Up" })).toBeVisible();

    const rootBox = await page.locator("#root").boundingBox();
    expect(rootBox?.width ?? 0).toBeGreaterThan(0);
    expect(rootBox?.height ?? 0).toBeGreaterThan(0);
    expect(fatalConsoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});
