import { expect, test } from "@playwright/test";

const route = "/preview/child-surfaces.html?surface=my-hollow";
const items = ["hollow-glow-jar", "hollow-mushroom-stool", "hollow-moon-lantern", "hollow-moss-rug", "hollow-star-banner", "hollow-root-table"];
const viewports = [{ width: 1467, height: 830 }, { width: 1024, height: 768 }, { width: 320, height: 568 }, { width: 568, height: 320 }];

async function seedRoom(page, theme = "meadow") {
  await page.addInitScript(({ theme, items }) => {
    const scope = "child-surface-preview";
    localStorage.setItem(`lp-student-profile:${scope}`, JSON.stringify({ companionId: "fluff", denTheme: theme }));
    localStorage.setItem(`lp-hollow:${scope}`, JSON.stringify({
      purchases: [...items.map((item, i) => ({ id: `owned-${i}`, item, cost: 0 })), { id: "gift", item: "egg-welcome", cost: 0 }], feeds: [], chests: [],
      layout: { slots: Object.fromEntries(items.map((item, i) => [`s${i + 1}`, item])), equipped: {} }
    }));
    localStorage.setItem(`literacyPath.guidedReadingRecords.${scope}`, JSON.stringify(Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`book-${i}`, { readCount: 1 }]))));
  }, { theme, items });
}

async function roomGeometry(page) {
  return page.locator(".hollow-simple").evaluate(root => {
    const scene = root.querySelector(".hollow-home-scene"), frame = scene.getBoundingClientRect();
    const image = scene.querySelector("image"), art = image.getBoundingClientRect(), matrix = image.getScreenCTM();
    return {
      roomFraction: frame.height / root.getBoundingClientRect().height,
      fillsWidth: art.left <= frame.left + 1 && art.right >= frame.right - 1,
      fillsHeight: art.top <= frame.top + 1 && art.bottom >= frame.bottom - 1,
      uniform: Math.abs(matrix.a - matrix.d) < .000001,
      decorationsContained: [...scene.querySelectorAll("[data-decoration-id]")].every(item => {
        const r = item.getBoundingClientRect();
        return r.left >= frame.left && r.right <= frame.right && r.top >= frame.top && r.bottom <= frame.bottom;
      }),
      buttonHeights: [...root.querySelectorAll(".hollow-doorways button")].map(b => b.getBoundingClientRect().height),
      duplicateTask: Boolean(root.querySelector(".hollow-next-card")),
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1
    };
  });
}

for (const theme of ["meadow", "dino", "moonwood"]) {
  for (const viewport of viewports) {
    test(`${theme} room has compact controls and six complete decorations at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
      await page.setViewportSize(viewport);
      await seedRoom(page, theme);
      await page.goto(route);
      await expect(page.locator(".hollow-simple")).toHaveAttribute("data-pal-world", theme);
      await expect(page.locator("[data-decoration-id]")).toHaveCount(6);
      await expect.poll(async () => (await roomGeometry(page)).decorationsContained).toBe(true);
      const geometry = await roomGeometry(page);
      expect(geometry.uniform).toBe(true);
      expect(geometry.duplicateTask).toBe(false);
      expect(geometry.horizontalOverflow).toBe(false);
      for (const height of geometry.buttonHeights) { expect(height).toBeGreaterThanOrEqual(56); expect(height).toBeLessThanOrEqual(64); }
      if (viewport.width >= 1024) {
        expect(geometry.roomFraction).toBeGreaterThanOrEqual(.8);
        expect(geometry.fillsWidth).toBe(true);
        expect(geometry.fillsHeight).toBe(true);
      }
      await page.locator(".hollow-home-scene").scrollIntoViewIfNeeded();
      for (const item of await page.locator("[data-decoration-id]").all()) await expect(item).toBeInViewport({ ratio: .99 });
      await page.screenshot({ path: info.outputPath("room.png") });
      await page.getByRole("button", { name: "My Guide", exact: true }).click();
      await expect(page.getByRole("heading", { name: "My Guide", exact: true })).toBeVisible();
    });
  }
}

test("the saved room reframes after rotation and every doorway still opens its task", async ({ page }) => {
  await seedRoom(page);
  await page.setViewportSize({ width: 1467, height: 830 });
  await page.goto(route);
  const scene = page.locator(".hollow-home-scene"), firstCamera = await scene.getAttribute("viewBox");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => scene.getAttribute("viewBox")).not.toBe(firstCamera);
  expect((await roomGeometry(page)).decorationsContained).toBe(true);
  await page.getByRole("button", { name: "Decorate", exact: true }).click();
  await expect(page.locator(".hollow-spot.filled")).toHaveCount(6);
  await page.getByRole("button", { name: "← My Hollow", exact: true }).click();
  await page.getByRole("button", { name: "Beasties", exact: true }).click();
  await expect(page.locator(".hollow-beastie")).toHaveCount(1);
});

test("the painted-room guard detects the original letterbox regression", async ({ page }) => {
  await seedRoom(page);
  await page.setViewportSize({ width: 1467, height: 830 });
  await page.goto(route);
  await expect.poll(async () => (await roomGeometry(page)).fillsWidth).toBe(true);
  await page.locator(".hollow-home-scene").evaluate(scene => scene.setAttribute("viewBox", "0 0 1920 1080"));
  expect((await roomGeometry(page)).fillsWidth).toBe(false);
});
