import { expect, test } from "@playwright/test";

test("A2.8 Guided Reading makes Read Page primary and groups view controls", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/preview/guided-reading-preview.html?book=level-c-nonfiction-01-bees");

  const reader = page.getByLabel("Bees full-screen reader");
  const readAloud = reader.getByRole("group", { name: "Read aloud controls" });
  const readPage = readAloud.getByRole("button", { name: "Read Page", exact: true });
  const progress = reader.getByRole("status", { name: "Reading progress" });
  const viewControls = reader.getByRole("group", { name: "Reader view controls" });

  await expect(readPage).toBeVisible();
  await expect(readPage).toHaveClass(/lp-button-primary/);
  await expect(readPage).toHaveAttribute("data-control-priority", "primary");
  await expect(readAloud.getByRole("button", { name: "Read Whole Book", exact: true }))
    .toHaveClass(/lp-button-secondary/);

  await expect(progress).toHaveText(/Page 1 of \d+/);
  await expect(progress).toHaveJSProperty("tagName", "P");
  await expect(viewControls.getByRole("button", { name: "Full Screen", exact: true }))
    .toHaveClass(/lp-button-secondary/);
  await expect(viewControls.getByRole("button", { name: "Back to Library", exact: true }))
    .toHaveClass(/lp-button-secondary/);
  await expect(viewControls.getByRole("button", { name: "Read Page", exact: true }))
    .toHaveCount(0);
  await expect(reader.locator(".guided-reader-header")).toHaveScreenshot(
    "guided-reading-control-hierarchy.png",
    {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.01
    }
  );

  await page.keyboard.press("ArrowRight");
  await expect(progress).toHaveText(/Page 2 of \d+/);

  await viewControls.getByRole("button", { name: "Full Screen", exact: true }).click();
  await expect(reader.getByRole("group", { name: "Page navigation" })).toBeVisible();
  await expect(viewControls.getByRole("button", { name: "Exit", exact: true })).toBeVisible();
  await expect(viewControls.getByRole("button", { name: "Back to Library", exact: true }))
    .toHaveCount(0);
  await expect(reader.getByRole("status", { name: "Reading progress" }))
    .toHaveText(/Page 2 of \d+/);

  expect(pageErrors).toEqual([]);
});
