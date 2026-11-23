import { expect, test } from "@playwright/test";
import { getStoryQuestLedaAudioPath, getStoryQuestPageAudioUrl } from "../../src/data/storyQuestLedaAudio.js";
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

test("story narration retries its exact recording after connectivity returns without moving scenes", async ({ page }) => {
  test.setTimeout(90_000);
  const quest = getStoryQuestById("mw_ra_c_01_pip_stone_loud_thing");
  const start = quest.pages.find(scene => scene.id === quest.startPageId);
  const path = getStoryQuestPageAudioUrl(start);
  expect(path).toBeTruthy();
  let offline = true;
  await page.route(url => url.pathname === path, route => offline ? route.abort("internetdisconnected") : route.continue());
  await page.goto("/preview/child-surfaces.html?surface=story-quests", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Moonwood", exact: true }).click();
  const card = await showStoryQuestCard(page, page.locator(".kg-quest-open").filter({ hasText: quest.shortTitle }));
  await card.click();
  const reader = page.locator(".story-quest-reader");
  const hear = reader.getByRole("button", { name: "Hear the story", exact: true });
  await hear.click();
  await expect(reader.getByText("That audio could not play.", { exact: false })).toBeVisible();
  await expect(hear).toBeEnabled();
  offline = false;
  const resumed = page.waitForResponse(response => new URL(response.url()).pathname === path && response.ok());
  await hear.click();
  await resumed;
  await expect(reader).toHaveAttribute("data-page-id", start.id);
  await expect(reader.getByText("That audio could not play.", { exact: false })).toHaveCount(0);
  const stop = reader.getByRole("button", { name: "Stop audio", exact: true });
  await expect(stop).toBeVisible();
  await stop.click();
  await hear.click();
  await expect(stop).toBeVisible();
  await expect(reader.getByText("That audio could not play.", { exact: false })).toHaveCount(0);
  await reader.getByRole("button", { name: "Back to Story Quests" }).click();
  await expect(reader).toHaveCount(0);
});
