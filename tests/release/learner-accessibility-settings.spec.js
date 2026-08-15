import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__playedLearnerAudio = [];
    class MockAudio {
      constructor(src = "") {
        this.src = src;
        this.volume = 1;
        this.playbackRate = 1;
        this.currentTime = 0;
        this.duration = 10;
        this.paused = true;
      }
      addEventListener() {}
      removeEventListener() {}
      removeAttribute() {}
      pause() {
        this.paused = true;
      }
      play() {
        this.paused = false;
        window.__playedLearnerAudio.push({
          src: this.src,
          volume: this.volume,
          playbackRate: this.playbackRate
        });
        return Promise.resolve();
      }
    }
    window.Audio = MockAudio;
  });
});

test("A3.4 teacher settings persist and every learner effect is active", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=classes&learner=1");

  // The current Students design uses an in-page labelled region, not the
  // retired drawer dialog. The direct preview route keeps this audit stable
  // without depending on whichever roster row is visible after sorting.
  const studentPanel = page.getByRole("region", { name: "Student details: Aarav" });
  await studentPanel.getByText("More for Aarav", { exact: true }).click();
  await studentPanel.getByRole("button", { name: "Student settings", exact: true }).click();
  await page.getByRole("dialog", { name: "Options for Aarav" })
    .getByRole("button", { name: "Accessibility settings", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Accessibility settings for Aarav" });
  await expect(dialog).toBeVisible();

  const settingLabels = [
    "Reduced effects",
    "Untimed or extended response",
    "Lower audio intensity",
    "Narration",
    "Simplified backgrounds"
  ];
  for (const label of settingLabels) {
    const checkbox = dialog.getByRole("checkbox", { name: new RegExp(`^${label}`) });
    await expect(checkbox).not.toBeChecked();
    await checkbox.check();
  }
  await dialog.getByRole("button", { name: "Save accessibility settings" }).click();
  await expect(dialog).toBeHidden();

  const write = await page.evaluate(() => window.__lpLastAccessibilityWrite);
  expect(write).toMatchObject({
    student_id: "student-aarav",
    area: "profile",
    key: "__all__",
    payload: {
      accessibilitySettings: {
        reducedEffects: true,
        extendedResponse: true,
        lowerAudioIntensity: true,
        narration: true,
        simplifiedBackgrounds: true
      },
      accessibilitySettingsAt: "2026-07-24T17:30:00.000Z",
      accessibilitySettingsBy: "teacher-a"
    }
  });

  await page.reload();
  const reloadedPanel = page.getByRole("region", { name: "Student details: Aarav" });
  await reloadedPanel.getByText("More for Aarav", { exact: true }).click();
  await reloadedPanel.getByRole("button", { name: "Student settings", exact: true }).click();
  await page.getByRole("dialog", { name: "Options for Aarav" })
    .getByRole("button", { name: "Accessibility settings", exact: true })
    .click();
  const reloadedDialog = page.getByRole("dialog", { name: "Accessibility settings for Aarav" });
  for (const label of settingLabels) {
    await expect(
      reloadedDialog.getByRole("checkbox", { name: new RegExp(`^${label}`) })
    ).toBeChecked();
  }

  await page.goto("/preview/teacher-a11y.html?surface=accessibility");
  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-lp-reduced-effects", "true");
  await expect(root).toHaveAttribute("data-lp-extended-response", "true");
  await expect(root).toHaveAttribute("data-lp-lower-audio-intensity", "true");
  await expect(root).toHaveAttribute("data-lp-narration", "true");
  await expect(root).toHaveAttribute("data-lp-simplified-backgrounds", "true");

  const effectSample = page.locator("[data-effect-sample]");
  await expect(effectSample).toHaveCSS("animation-name", "none");
  await expect(effectSample).toHaveCSS("background-image", "none");
  await expect(page.locator(".qw-run-clock")).toHaveCount(0);
  await expect(page.getByText("No timer — choose a fork.")).toBeVisible();
  await expect(page.getByText("Narration is on — each page reads aloud.")).toBeVisible();

  await expect.poll(
    () => page.evaluate(() => window.__playedLearnerAudio.filter(item =>
      String(item.src).includes("/guided_page/")
    ).at(-1) || null)
  ).toMatchObject({ volume: 0.55, playbackRate: 0.88 });
});
