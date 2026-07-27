import { expect, test } from "@playwright/test";

import { onsetGrapheme } from "../../src/components/elQuest/elQuestEngine.js";
import { soundRacerLadder } from "../../src/utils/soundRacerTracks.js";

test("A2.9 Sound Racer renders the current target example apart from steering help", async ({ page }) => {
  const difficulty = "medium";
  const level = 3;
  const expectedTarget = soundRacerLadder(difficulty)[level];
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.removeItem("lp-arcade-onboarded-v1:sound-racer");
  });
  await page.goto(`/preview/sound-racer-preview.html?difficulty=${difficulty}&level=${level}&sound=0`);

  const overlay = page.locator('[data-sr="overlay"]');
  const phonics = overlay.getByRole("region", { name: "Sound example" });
  const motor = overlay.getByRole("region", { name: "How to steer" });
  await expect(phonics).toBeVisible();
  await expect(motor).toBeVisible();

  const target = await phonics.locator('[data-sr="tutorial-target"]').innerText();
  const exampleWord = await phonics.locator('[data-sr="tutorial-word"]').innerText();
  expect(target.toLowerCase()).toBe(expectedTarget);
  expect(onsetGrapheme(exampleWord)).toBe(expectedTarget);
  const hearExample = phonics.getByRole("button", {
    name: `Hear ${expectedTarget.toUpperCase()} in ${exampleWord}`
  });
  await expect(hearExample).toBeVisible();
  await hearExample.click();
  await expect(phonics).toBeVisible();
  await expect(motor).toContainText("Steer left or right");
  await expect(phonics).not.toContainText("Use ← →");

  await expect(overlay).toHaveScreenshot("sound-racer-current-target-tutorial.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixelRatio: 0.02
  });
  expect(pageErrors).toEqual([]);
});
