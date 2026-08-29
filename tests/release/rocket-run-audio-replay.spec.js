import { expect, test } from "@playwright/test";

import { rocketRunLadder } from "../../src/utils/rocketRunRounds.js";

test("Rocket Run keeps the exact target sound replayable without hiding the target", async ({ page }) => {
  const target = rocketRunLadder("easy")[0];
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:rocket-run", "1");
  });
  await page.goto("/preview/game-overlay.html?game=rocket-run&sound=1&music=0");

  const player = page.getByRole("dialog", { name: "Rocket Run", exact: true });
  await expect(player).toBeVisible();
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });

  const replay = player.locator('[data-rr="hear-target"]');
  await expect(replay).toBeVisible();
  await expect(replay).toBeEnabled();
  await expect(replay).toHaveAttribute("aria-label", `Hear the ${target} sound again`);
  await expect(replay.locator('[data-rr="letter"]')).toHaveText(target);
  const bounds = await replay.boundingBox();
  expect(bounds?.width).toBeGreaterThanOrEqual(56);
  expect(bounds?.height).toBeGreaterThanOrEqual(56);
  await replay.click();

  await page.getByRole("button", { name: "Turn spoken audio and game sounds off", exact: true }).click();
  await expect(replay).toBeDisabled();
  await expect(replay).toBeVisible();
  await expect(replay).toHaveAttribute("aria-label", `Target ${target}; sound is off`);
  await expect(replay.locator('[data-rr="letter"]')).toHaveText(target);

  await page.getByRole("button", { name: "Turn spoken audio and game sounds on", exact: true }).click();
  await expect(replay).toBeEnabled();
  expect(pageErrors).toEqual([]);
});
