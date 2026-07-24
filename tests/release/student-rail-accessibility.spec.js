import { expect, test } from "@playwright/test";

const FULL_DESTINATIONS = [
  ["home", "Home", "home"],
  ["sounds", "Sound Seekers", "sound"],
  ["phonics", "Phonics", "phonics"],
  ["map", "Adventure Map", "map"],
  ["books", "Books", "book"],
  ["stories", "Story Quests", "story"],
  ["arcade", "Arcade", "arcade"],
  ["hollow", "My Hollow", "hollow"]
];

async function installSpeechRecorder(page) {
  await page.addInitScript(() => {
    window.__spokenRailLabels = [];
    class RecordedUtterance {
      constructor(text) {
        this.text = text;
      }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: RecordedUtterance
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        cancel() {},
        speak(utterance) {
          window.__spokenRailLabels.push({
            text: utterance.text,
            lang: utterance.lang,
            rate: utterance.rate
          });
        }
      }
    });
  });
}

test("A2.5 full student rail exposes stable named destinations and exact tap-to-hear labels", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await installSpeechRecorder(page);
  await page.goto("/preview/student-home-preview.html");

  const rail = page.getByRole("navigation", { name: "Places to play" });
  await expect(rail).toHaveAttribute("data-choice-mode", "full");
  await expect(rail.locator("[data-rail-destination]")).toHaveCount(FULL_DESTINATIONS.length);

  for (const [id, label, icon] of FULL_DESTINATIONS) {
    const destination = rail.locator(`[data-rail-destination="${id}"]`);
    await expect(destination.getByRole("button", { name: label, exact: true })).toHaveCount(1);
    await expect(destination.locator(`[data-rail-icon="${icon}"]`)).toHaveCount(1);
    await expect(destination.getByRole("button", { name: `Hear ${label}`, exact: true })).toHaveCount(1);
  }

  await rail.getByRole("button", { name: "Hear Adventure Map", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__spokenRailLabels)).toEqual([
    { text: "Adventure Map", lang: "en-GB", rate: 0.88 }
  ]);
  expect(pageErrors).toEqual([]);
});

test("A2.5 teacher-reduced choices persist and every visible place remains hearable", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installSpeechRecorder(page);
  await page.goto("/preview/student-home-preview.html?scenario=reduced-choice");

  const rail = page.getByRole("navigation", { name: "Places to play" });
  const reducedLabels = ["Home", "Sound Seekers", "Phonics", "Books"];
  await expect(rail).toHaveAttribute("data-choice-mode", "reduced");
  await expect(rail.locator("[data-rail-destination]")).toHaveCount(reducedLabels.length);
  await expect(rail.locator("[data-rail-destination] .hs-nav-destination")).toHaveText(reducedLabels);

  for (const label of reducedLabels) {
    await rail.getByRole("button", { name: `Hear ${label}`, exact: true }).click();
  }
  await expect.poll(() => page.evaluate(() => (
    window.__spokenRailLabels.map(item => item.text)
  ))).toEqual(reducedLabels);

  await expect(rail.locator(".hs-nav-status")).toHaveCSS("position", "absolute");
  await expect(page.locator(".hs-side")).toHaveScreenshot("student-rail-reduced-choice-v2.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixelRatio: 0.01
  });

  await page.goto("/preview/student-home-preview.html");
  const persistedRail = page.getByRole("navigation", { name: "Places to play" });
  await expect(persistedRail).toHaveAttribute("data-choice-mode", "reduced");
  await expect(persistedRail.locator("[data-rail-destination] .hs-nav-destination")).toHaveText(reducedLabels);
  expect(pageErrors).toEqual([]);
});
