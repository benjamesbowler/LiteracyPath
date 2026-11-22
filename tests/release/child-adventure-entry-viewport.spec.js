import { expect, test } from "@playwright/test";

async function expectUncovered(control) {
  await expect(control).toBeVisible();
  const result = await control.evaluate(node => {
    const rect = node.getBoundingClientRect();
    const main = node.closest(".kg-main");
    const pane = main?.getBoundingClientRect() ?? { top: 0, right: innerWidth, bottom: innerHeight, left: 0 };
    const text = document.createRange();
    text.selectNodeContents(node);
    const painted = [...text.getClientRects()].some(box => box.width > 5 && box.height > 5);
    const hit = node.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    return { fits: rect.top >= pane.top && rect.left >= pane.left && rect.bottom <= pane.bottom && rect.right <= pane.right, painted, hit };
  });
  expect(result).toEqual({ fits: true, painted: true, hit: true });
}

test("Adventure Map makes its current destination instruction visible on a short phone", async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto("/preview/child-surfaces.html?surface=adventure-map", { waitUntil: "domcontentloaded" });
  await expectUncovered(page.getByText("Your pal is waiting at Farm Gate."));
  await expectUncovered(page.locator(".kg-atlas-continue-button"));
  await expectUncovered(page.locator(".kg-atlas-browse"));
});

test("Sound Seekers keeps Home and both adventures in view on a narrow phone", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/preview/child-surfaces.html?surface=sound-seekers", { waitUntil: "domcontentloaded" });
  const title = page.locator(".rc-game .rc-title");
  await expectUncovered(title.getByRole("button", { name: "Start exploring" }));
  await expectUncovered(title.getByRole("button", { name: "Woodland Homecoming" }));
  await expectUncovered(title.getByRole("button", { name: "Home", exact: true }));
  expect(await title.evaluate(node => node.scrollHeight)).toBeLessThanOrEqual(await title.evaluate(node => node.clientHeight + 1));
});
