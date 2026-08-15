import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function expectNoContrastViolations(page, selector, state) {
  const result = await new AxeBuilder({ page })
    .include(selector)
    .withRules(["color-contrast"])
    .analyze();
  const failures = result.violations.flatMap(violation =>
    violation.nodes.map(node => ({
      target: node.target.join(" "),
      summary: node.failureSummary
    }))
  );
  expect(failures, `${state} must preserve disabled-state contrast`).toEqual([]);
}

test("A3.8 locked book-character pieces name their real Sparks cost and shortfall", async ({ page }) => {
  await page.goto("/preview/quest.html?view=creator&sound=0&adapt=0&sparks=8");
  const dialog = page.getByRole("dialog", { name: "Change your book character", exact: true });
  await dialog.getByRole("tab", { name: "Colours", exact: true }).click();
  const locked = dialog.locator('[data-locked-item="quest-creature"]');
  const twentySparkItem = locked.filter({ hasText: "20 Sparks — earn 12 more" }).first();

  await expect(dialog).toBeVisible();
  await expect(twentySparkItem).toBeVisible();
  await expect(twentySparkItem).toBeDisabled();
  await expect(twentySparkItem).toHaveAccessibleName(/20 Sparks — earn 12 more/);
  await expect(twentySparkItem.locator(".q-option-cost svg")).toHaveCount(1);
  await expectNoContrastViolations(
    page,
    '[data-locked-item="quest-creature"]',
    "Quest book-character creator locked items"
  );
});

test("A3.8 a real Hollow item visibly and accessibly says 20 coins — earn 12 more", async ({
  page
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("lp-hollow:child-surface-preview", JSON.stringify({
      purchases: [{
        id: "a3-8-crown",
        item: "gear-meadow-crown",
        cost: 120,
        at: "2026-07-24T08:00:00.000Z"
      }],
      feeds: [],
      chests: [],
      layout: { at: "", equipped: {}, slots: {} }
    }));
  });
  await page.goto("/preview/child-surfaces.html?surface=my-hollow");
  await page.evaluate(() => {
    localStorage.setItem("lp-quest:child-surface-preview", JSON.stringify({
      trail: { stars: { s1: 3, s2: 1 } }
    }));
    window.dispatchEvent(new CustomEvent("lp-progress-hydrated", {
      detail: { studentId: "child-surface-preview" }
    }));
  });

  await expect(page.locator(".hollow-wallet-coins")).toContainText("8");
  await page.getByRole("button", { name: /Market/ }).click();
  await page.getByRole("button", { name: "For your Hollow", exact: true }).click();

  const item = page.getByRole("button", {
    name: "Glow jar 20 coins — earn 12 more",
    exact: true
  });
  const copy = item.locator('[data-locked-item="hollow-market"]');
  await expect(item).toBeVisible();
  await expect(item).toBeDisabled();
  await expect(copy).toHaveText("20 coins — earn 12 more");
  await expect(copy).toHaveAttribute("data-shortfall", "12");
  await expect(copy.locator("svg")).toHaveCount(1);
  await expectNoContrastViolations(
    page,
    '[data-locked-item-card="hollow-market"]',
    "Hollow market locked items"
  );
});
