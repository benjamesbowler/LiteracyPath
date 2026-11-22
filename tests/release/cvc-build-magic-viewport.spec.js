import { expect, test } from "@playwright/test";
import { STUDENT_DEVICE_PROFILES } from "../../src/policy/studentDeviceMatrix.js";
import { expectInChildPane } from "./helpers/childPagedChoices.js";

test.describe.configure({ timeout: 90_000 });

for (const profile of STUDENT_DEVICE_PROFILES.filter(item => item.family === "small-phone")) {
  test(`Word Workshop Build and Magic keep every letter and replay in the pane at ${profile.id}`, async ({ page }, info) => {
    await page.setViewportSize({ width: profile.width, height: profile.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/*.mp3", route => route.abort());
    await page.goto("/preview/child-surfaces.html?surface=phonics&island=words", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "at word family, Play", exact: true }).click();
    const flow = page.locator(".cvc-learning-flow");
    await flow.getByRole("button", { name: "Next Word", exact: true }).click();
    await flow.getByRole("button", { name: "Next Word", exact: true }).click();
    await flow.getByRole("button", { name: "Continue", exact: true }).click();
    const back = flow.getByRole("button", { name: "Back to words", exact: true });
    await expectInChildPane(back);

    for (const word of ["cat", "bat", "hat"]) {
      const task = flow.locator(`[data-practice-question="cvc-build:at:${word}"]`);
      const slots = task.locator(".learning-guided-action");
      await expect(task).toHaveAttribute("data-learning-phase", "answer");
      await expectInChildPane(task.getByRole("button", { name: "Listen again", exact: true }));
      await expectInChildPane(slots);
      if (word === "cat") {
        await page.screenshot({ path: info.outputPath("word-build.png") });
        await task.getByRole("button", { name: "Choose d", exact: true }).click();
        await expect(task).toHaveAttribute("data-learning-phase", "receipt");
        await expectInChildPane(task.getByRole("status"), { touch: false });
        await expect(task).toHaveAttribute("data-learning-phase", "teaching");
        await expectInChildPane(slots);
      }
      for (const letter of word) {
        const tile = task.getByRole("button", { name: `Choose ${letter}`, exact: true });
        await expectInChildPane(tile);
        await tile.click();
      }
    }

    await expect(flow).toHaveAttribute("data-cvc-step", "3");
    for (const [base, target] of [["cat", "bat"], ["bat", "hat"]]) {
      const task = flow.locator(`[data-practice-question="magic:at:${base}:${target}"]`);
      await expect(task).toHaveAttribute("data-learning-phase", "answer");
      await expectInChildPane(task.getByRole("button", { name: "Listen again", exact: true }));
      await expectInChildPane(task.locator(".learning-guided-action"));
      if (base === "cat") await page.screenshot({ path: info.outputPath("word-magic.png") });
      await task.getByRole("button", { name: `Choose ${target[0]}`, exact: true }).click();
    }

    await expect(flow).toHaveAttribute("data-cvc-step", "celebration");
    const returnToWords = flow.getByRole("button", { name: "New Words", exact: true });
    await expectInChildPane(returnToWords);
    await expectInChildPane(flow.getByRole("button", { name: "Play Again", exact: true }));
    await returnToWords.click();
    await expect(page.getByRole("button", { name: "at word family, Complete", exact: true })).toBeFocused();
  });
}
