import { expect, test } from "@playwright/test";
import { getStoryQuestLedaAudioPath } from "../../src/data/storyQuestLedaAudio.js";
import { storyQuestPlayText } from "../../src/data/storyQuestReaderCopy.js";
import { getStoryQuestById } from "../../src/data/storyQuests.js";
import { showStoryQuestCard, showStoryQuestReaderPane } from "./helpers/storyQuestShelf.js";

test("scene actions and their Leda recordings play independently of path selection", async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    const BrowserAudio = window.Audio;
    window.__sceneAudio = [];
    window.Audio = function RecordedSceneAudio(source) {
      const audio = new BrowserAudio(source);
      audio.addEventListener("play", () => window.__sceneAudio.push(audio));
      return audio;
    };
    window.Audio.prototype = BrowserAudio.prototype;
  });

  const quest = getStoryQuestById("mw_ra_c_01_pip_stone_loud_thing");
  const scene = quest.pages.find(candidate => candidate.id === "p04_inside_marsh");
  const [action, otherAction] = scene.play.actions;
  const instructionsPath = getStoryQuestLedaAudioPath(storyQuestPlayText(scene.play));
  const revealPath = getStoryQuestLedaAudioPath(action.reveal);
  const scenePaths = [instructionsPath, revealPath, getStoryQuestLedaAudioPath(otherAction.reveal)];
  expect(instructionsPath).toBeTruthy();
  expect(revealPath).toBeTruthy();

  await page.goto("/preview/child-surfaces.html?surface=story-quests");
  await page.getByRole("button", { name: "Moonwood", exact: true }).click();
  const card = await showStoryQuestCard(page, page.locator(".kg-quest-open").filter({ hasText: quest.shortTitle }));
  await card.click();
  const reader = page.locator(".story-quest-reader");
  await reader.getByRole("button", { name: "Next", exact: true }).click();
  await expect(reader).toHaveAttribute("data-page-id", scene.id);
  await showStoryQuestReaderPane(reader, "Explore");
  const exploration = reader.getByRole("region", { name: "Explore the scene", exact: true });
  const audioStarted = path => page.evaluate(path => window.__sceneAudio.some(audio => (
    new URL(audio.src).pathname === path && audio.currentTime > 0 && !audio.error
  )), path);
  const allAudioStopped = () => page.evaluate(paths => window.__sceneAudio.every(audio => (
    !paths.includes(new URL(audio.src).pathname) || audio.paused
  )), scenePaths);
  for (const path of scenePaths) expect(await audioStarted(path)).toBe(false);

  await exploration.getByRole("button", { name: "Hear the scene actions", exact: true }).click();
  await expect.poll(() => audioStarted(instructionsPath)).toBe(true);
  await expect(reader).toHaveAttribute("data-page-id", scene.id);
  await expect(exploration.getByText(action.reveal, { exact: true })).toHaveCount(0);
  await exploration.getByRole("button", { name: action.label, exact: true }).click();
  await expect(exploration.getByText(action.reveal, { exact: true })).toBeVisible();
  await expect.poll(allAudioStopped).toBe(true);
  expect(await audioStarted(revealPath)).toBe(false);

  await exploration.getByRole("button", { name: "Hear what you found", exact: true }).click();
  await expect.poll(() => audioStarted(revealPath)).toBe(true);
  await exploration.getByRole("button", { name: otherAction.label, exact: true }).click();
  await expect.poll(allAudioStopped).toBe(true);
  await expect(exploration.getByText(otherAction.reveal, { exact: true })).toBeVisible();
  await expect(reader).toHaveAttribute("data-page-id", scene.id);

  await showStoryQuestReaderPane(reader, "Choose");
  await reader.getByRole("button", { name: scene.choices[0].label, exact: true }).click();
  await expect(reader).toHaveAttribute("data-page-id", scene.choices[0].nextPageId);
});
