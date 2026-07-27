import { expect, test } from "@playwright/test";

const CASES = [
  {
    scenario: "code-not-found",
    title: "That code was not found",
    detail: "Check each letter and number. Your code is still in the box.",
    audio: "/audio/ui/voice/did-not-match.mp3"
  },
  {
    scenario: "offline",
    title: "You are offline",
    detail: "Reconnect this device, then try the same code again.",
    audio: "/audio/ui/voice/try-again.mp3"
  },
  {
    scenario: "ask-teacher",
    title: "Ask your teacher",
    detail: "The class list could not open. Your teacher can check the class code.",
    audio: "/audio/ui/voice/ask-teacher.mp3"
  }
];

async function installAudioRecorder(page) {
  await page.addInitScript(() => {
    window.__studentLoginAudio = [];
    class RecordedAudio {
      constructor(src) {
        this.src = src;
        this.currentTime = 0;
        this.volume = 1;
        this.listeners = new Map();
      }

      addEventListener(type, listener) {
        this.listeners.set(type, listener);
      }

      pause() {}

      play() {
        window.__studentLoginAudio.push(this.src);
        return Promise.resolve();
      }
    }
    Object.defineProperty(window, "Audio", {
      configurable: true,
      value: RecordedAudio
    });
  });
}

for (const recoveryCase of CASES) {
  test(`A2.6 ${recoveryCase.scenario} is illustrated, announced, hearable, and preserves the code`, async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await installAudioRecorder(page);
    await page.goto(`/preview/student-login-preview.html?scenario=${recoveryCase.scenario}`);

    const codeInput = page.getByRole("textbox", { name: "Class code" });
    await codeInput.fill("AB12CD");
    await page.getByRole("button", { name: "Go", exact: true }).click();

    const recovery = page.locator(`[data-login-recovery="${recoveryCase.scenario}"]`);
    await expect(recovery).toHaveAttribute("role", "alert");
    await expect(recovery).toHaveAttribute("aria-live", "assertive");
    await expect(recovery.getByRole("heading", { name: recoveryCase.title })).toBeVisible();
    await expect(recovery).toContainText(recoveryCase.detail);
    await expect(codeInput).toHaveValue("AB12CD");

    const illustration = recovery.locator(`[data-recovery-illustration="${recoveryCase.scenario}"]`);
    await expect(illustration).toBeVisible();
    await expect.poll(() => illustration.evaluate(image => (
      image.complete && image.naturalWidth > 0
    ))).toBe(true);

    await expect.poll(() => page.evaluate(() => window.__studentLoginAudio.at(-1)))
      .toBe(recoveryCase.audio);
    const hear = recovery.getByRole("button", { name: `Hear: ${recoveryCase.title}` });
    await expect(hear).toBeVisible();
    await hear.click();
    await expect.poll(() => page.evaluate(() => window.__studentLoginAudio.length))
      .toBeGreaterThanOrEqual(2);
    await expect.poll(() => page.evaluate(() => window.__studentLoginAudio.at(-1)))
      .toBe(recoveryCase.audio);

    await expect(page.locator(".student-flow-card")).toHaveScreenshot(
      `student-login-${recoveryCase.scenario}.png`,
      {
        animations: "disabled",
        caret: "hide",
        maxDiffPixelRatio: 0.01
      }
    );
    expect(pageErrors).toEqual([]);
  });
}
