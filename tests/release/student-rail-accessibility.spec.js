import { expect, test } from "@playwright/test";
import {
  getLedaInstructionAudioPath,
  getLedaWordAudioPath
} from "../../src/data/ledaProductionAudio.js";

const FULL_TABS = [
  ["home", "Home", "home"],
  ["sounds", "Sounds", "soundWaves"],
  ["books", "Books", "book"],
  ["games", "Games", "arcade"],
  ["hollow", "Hollow", "hollow"]
];

const FULL_DOORS = ["map", "books", "stories", "arcade", "phonics", "hollow"];

function expectedAudioPath(label) {
  return getLedaInstructionAudioPath(label) || getLedaWordAudioPath(label);
}

async function installSpeechRecorder(page) {
  await page.addInitScript(() => {
    window.__spokenRailAudio = [];
    class RecordedAudio {
      constructor(src) {
        this.src = src;
        this.listeners = new Map();
      }

      addEventListener(type, listener) {
        this.listeners.set(type, listener);
      }

      play() {
        window.__spokenRailAudio.push(this.src);
        queueMicrotask(() => this.listeners.get("ended")?.());
        return Promise.resolve();
      }
    }
    Object.defineProperty(window, "Audio", {
      configurable: true,
      value: RecordedAudio
    });
  });
}

test("A2.5 full child navigation exposes stable tabs, all destinations, and recorded doorway labels", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await installSpeechRecorder(page);
  await page.goto("/preview/student-home-preview.html");

  const navigation = page.getByRole("navigation", { name: "Where to go" });
  const doors = page.locator(".kg-home-doors");
  await expect(navigation).toHaveAttribute("data-choice-mode", "full");
  await expect(navigation.locator("[data-tab]")).toHaveCount(FULL_TABS.length);
  await expect(doors).toHaveAttribute("data-choice-mode", "full");
  await expect(doors.locator("[data-rail-destination]")).toHaveCount(FULL_DOORS.length);
  await expect.poll(() => doors.locator("[data-rail-destination]").evaluateAll(items => (
    items.map(item => item.getAttribute("data-home-priority"))
  ))).toEqual(FULL_DOORS.map(() => "choice"));

  for (const [id, label, icon] of FULL_TABS) {
    const tab = navigation.locator(`[data-tab="${id}"]`);
    await expect(tab).toHaveAccessibleName(label);
    await expect(tab.locator(`[data-kg-icon="${icon}"]`)).toHaveCount(1);
  }
  await expect.poll(() => doors.locator("[data-rail-destination]").evaluateAll(items => (
    items.map(item => item.getAttribute("data-child-emphasis"))
  ))).toEqual(FULL_DOORS.map(() => "choice"));
  await expect(doors.locator("[data-rail-destination]")).toHaveCount(6);

  await page.locator(".kg-home-explore").getByRole("button", { name: "Hear this" }).click();
  await expect.poll(() => page.evaluate(() => window.__spokenRailAudio)).toEqual(
    ["Adventure Map", "Books", "Story Quests", "Arcade", "Letters", "My Hollow"]
      .map(expectedAudioPath)
  );
  expect(pageErrors).toEqual([]);
});

test("A2.5 teacher-reduced choices close alternate tab routes, persist, and remain hearable", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installSpeechRecorder(page);
  await page.goto("/preview/student-home-preview.html?scenario=reduced-choice");

  const navigation = page.getByRole("navigation", { name: "Where to go" });
  const doors = page.locator(".kg-home-doors");
  await expect(navigation).toHaveAttribute("data-choice-mode", "reduced");
  await expect(navigation.locator("[data-tab]")).toHaveCount(3);
  await expect(navigation.locator(".kg-tab-label")).toHaveText(["Home", "Sounds", "Books"]);
  await expect(doors).toHaveAttribute("data-choice-mode", "reduced");
  await expect(doors.locator("[data-rail-destination]")).toHaveCount(2);
  await expect(doors.locator(".kg-card-title")).toHaveText(["Books", "Letters"]);

  await page.locator(".kg-home-explore").getByRole("button", { name: "Hear this" }).click();
  await expect.poll(() => page.evaluate(() => window.__spokenRailAudio)).toEqual(
    ["Books", "Letters"].map(expectedAudioPath)
  );

  await expect(navigation).toHaveScreenshot("student-rail-reduced-choice-v2.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixelRatio: 0.01
  });

  await page.goto("/preview/student-home-preview.html");
  const persistedNavigation = page.getByRole("navigation", { name: "Where to go" });
  await expect(persistedNavigation).toHaveAttribute("data-choice-mode", "reduced");
  await expect(persistedNavigation.locator(".kg-tab-label")).toHaveText(["Home", "Sounds", "Books"]);
  expect(pageErrors).toEqual([]);
});
