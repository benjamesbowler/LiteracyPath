import { expect, test } from "@playwright/test";

async function expectTappable(control) {
  await expect(control).toBeVisible();
  const fits = await control.evaluate(node => {
    const box = node.getBoundingClientRect();
    const pane = node.closest(".kg-main").getBoundingClientRect();
    return box.top >= pane.top && box.bottom <= pane.bottom &&
      box.left >= pane.left && box.right <= pane.right &&
      node.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  });
  expect(fits, `Out of frame: ${await control.getAttribute("aria-label") || await control.textContent()}`).toBe(true);
}

for (const [width, height] of [[320, 568], [568, 320]]) {
 test(`Hollow entry, room navigation and world picker fit at ${width}x${height}`, async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width, height });
  await page.goto("/preview/child-surfaces.html?surface=my-hollow", { waitUntil: "domcontentloaded" });
  for (const choice of ["Open your gift", "Decorate", "My Guide", "Beasties"]) {
    await expectTappable(page.getByRole("button", { name: choice, exact: true }));
  }
  const overview = await page.locator(".hollow-home-scene").evaluate(node => {
    const art = node.getBoundingClientRect();
    const pane = node.closest(".kg-main").getBoundingClientRect();
    return art.height > 0 && art.top >= pane.top && art.bottom <= pane.bottom + 1;
  });
  expect(overview).toBe(true);
  await page.getByRole("button", { name: "Decorate", exact: true }).click();

  const world = page.getByRole("button", { name: "Change world" });
  const garden = page.getByRole("button", { name: "Go to The Garden" });
  await expectTappable(world);
  await expectTappable(garden);
  await expectTappable(page.getByRole("button", { name: "Choose a decoration" }));
  await world.click();
  const picker = page.getByRole("dialog", { name: "Choose your world" });
  const close = picker.getByRole("button", { name: "Close", exact: true });
  await expectTappable(picker.getByRole("button", { name: "Meadow Farm", exact: true }));
  await expectTappable(close);
  await close.click();
  await garden.click();
  await expect(page.getByRole("navigation", { name: "Places in your Hollow" })).toContainText("The Garden");
  await expectTappable(page.getByRole("button", { name: "Previous place" }));
  expect(await page.locator(".hollow-simple").evaluate(node => node.scrollTop)).toBe(0);
});
}
