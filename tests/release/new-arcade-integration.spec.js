import { expect, test } from "@playwright/test";
import { buildRallyPalsRounds } from "../../src/utils/rallyPalsRules.js";
import { buildBurrowMissions } from "../../src/utils/burrowBuildersRules.js";

const NEW_GAMES = [
  { id: "drum-trail", title: "Drum Trail", engine: ".drum-trail", total: 16, resumeSupport: "resume_without_support_record", independent: "independentOralPractice" },
  { id: "lantern-lagoon", title: "Lantern Lagoon", engine: ".lantern-lagoon", total: 8, resumeSupport: "resume_without_support_record", independent: "independent" },
  { id: "tower-tumble", title: "Tower Tumble", engine: ".tower-tumble", total: 9, resumeSupport: "resume_without_support_record", independent: "independentEncodingPractice" },
  { id: "rally-pals", title: "Rally Pals", engine: ".rally-pals-game", total: 6, resumeSupport: "resume-without-support-record", independent: "independentPractice" },
  { id: "burrow-builders", title: "Burrow Builders", engine: ".burrow-builders", total: 6, resumeSupport: "resume-without-support-history", independent: "independentPractice" }
];
const snapshot = page => page.evaluate(() => window.__arcadePreviewSnapshot?.());
const supportOf = state => state?.supportReasons || state?.support || [];
const responseSupportOf = response => response?.supportReasons || response?.supportUsed || [];
async function openToolsIfPresent(page) {
  const trigger = page.getByRole("button", { name: "Open game controls", exact: true });
  if (await trigger.isVisible()) {
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Game controls", exact: true })).toBeVisible();
    await expect.poll(async () => (await snapshot(page))?.paused).toBe(true);
  }
}
const motorState = state => ({
  position: state.player || state.position || state.world?.player,
  ball: state.ball,
  clock: state.elapsedSeconds ?? state.elapsed,
  weather: state.world?.weatherTick
});

// Read-only fixtures discover the task; every response still goes through the
// real native controller, including Tower's physical route and Rally's swing.
async function answerFirstTask(page, id) {
  const state = await snapshot(page);
  if (id === "drum-trail") {
    await page.getByRole("button", { name: `Choose the path with ${state.syllables} ${state.syllables === 1 ? "drum" : "drums"}`, exact: true }).click();
  } else if (id === "lantern-lagoon") {
    await page.locator(`[data-choice-id="${state.deck.rounds[0].answerId}"]`).click();
  } else if (id === "tower-tumble") {
    await page.getByRole("button", { name: "Reach bricks", exact: true }).click();
    await page.getByRole("button", { name: `Reach and smash ${state.chunks[0]} brick`, exact: true }).click();
  } else if (id === "rally-pals") {
    const [, difficulty, seed, journey] = state.roundId.split(":");
    const task = buildRallyPalsRounds(difficulty, Number(seed), Number(journey))[state.index];
    await page.getByRole("button", { name: `Aim at ${task.expected}`, exact: true }).click();
    await page.getByRole("button", { name: "Serve", exact: true }).click();
  } else {
    const task = buildBurrowMissions("easy", state.seed, 0)[state.cursor];
    await page.getByRole("button", { name: `Place ${task.chunks[0]} block on the blueprint`, exact: true }).click();
  }
  await expect.poll(async () => (await snapshot(page))?.evidence.firstResponses.length, { timeout: 20_000 }).toBeGreaterThan(0);
  return (await snapshot(page)).evidence.firstResponses[0];
}

for (const { id, title, engine, total, resumeSupport, independent } of NEW_GAMES) {
  test(`${title} first-question checkpoint without local support history is conservative`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(({ gameId, totalLevels }) => {
      localStorage.setItem("literacy-guide-learn-games:fullscreen-overlay-preview", JSON.stringify({ v: 1, games: {
        [gameId]: { checkpoints: { easy: { level: 0, totalLevels, sessionSeed: 913, chapter: 0 } } }
      } }));
    }, { gameId: id, totalLevels: total });
    await page.goto(`/preview/game-overlay.html?game=${id}&sound=0&taughtCycle=15`);
    await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
    await expect(page.locator(engine)).toHaveCount(0);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.locator(engine)).toBeVisible();
    await expect.poll(async () => supportOf(await snapshot(page))).toContain(resumeSupport);
    const resumed = await snapshot(page);
    expect(resumed.index ?? resumed.cursor ?? resumed.round).toBe(0);
    const first = await answerFirstTask(page, id);
    expect(first.correct).toBe(true);
    expect(first[independent]).toBe(false);
    expect(responseSupportOf(first)).toContain(resumeSupport);
  });

  test(`${title} opens from the complete real Arcade catalogue`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/preview/child-surfaces.html?surface=arcade");
    await expect(page.locator(".lg-game-tile")).toHaveCount(27);
    await page.locator(`.lg-game-tile[data-game-id="${id}"]`).click();
    await expect(page.locator(".lg-game-player")).toHaveAttribute("data-surface-name", title);
    await expect(page.locator(engine)).toBeVisible();
    await expect(page.locator(`${engine} button`).first()).toBeVisible();
  });

  test(`${title} exact assignment cannot expose a different game`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/preview/child-surfaces.html?surface=arcade&lockedGame=${id}`);
    await expect(page.locator(".lg-game-tile")).toHaveCount(1);
    await expect(page.locator(".lg-game-tile")).toHaveAttribute("data-game-id", id);
    await expect(page.locator(engine)).toBeVisible();
    await page.goto("/preview/child-surfaces.html?surface=arcade&lockedGame=unavailable-game");
    await expect(page.getByRole("heading", { name: "Game unavailable", exact: true })).toBeVisible();
    await expect(page.locator(".lg-game-player")).toHaveCount(0);
    await expect(page.locator(".lg-game-tile")).toHaveCount(0);
  });

  test(`${title} shared mission help pauses the real engine and retains support`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/preview/game-overlay.html?game=${id}&sound=0&taughtCycle=15`);
    await expect(page.locator(engine)).toBeVisible();
    await expect.poll(() => page.evaluate(() => Boolean(window.__arcadePreviewSnapshot?.()))).toBe(true);
    await openToolsIfPresent(page);
    await page.getByRole("button", { name: `Open ${title} mission guide`, exact: true }).click();
    await expect(page.getByRole("dialog", { name: `${title} mission guide`, exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => {
      const snapshot = window.__arcadePreviewSnapshot?.();
      return { paused: snapshot?.paused, supported: (snapshot?.supportReasons || snapshot?.support || []).includes("mission-help") };
    })).toEqual({ paused: true, supported: true });
    await page.getByRole("button", { name: "Keep playing", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__arcadePreviewSnapshot?.().paused)).toBe(false);
    await expect.poll(async () => supportOf(await snapshot(page))).toContain("mission-help");
    const first = await answerFirstTask(page, id);
    expect(first.correct).toBe(true);
    expect(first[independent]).toBe(false);
    expect(responseSupportOf(first)).toContain("mission-help");
  });
}

for (const { id, title, engine } of NEW_GAMES.slice(2)) {
  test(`${title} Tools traps focus, freezes play and returns native keyboard control`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/preview/game-overlay.html?game=${id}&sound=0`);
    await expect(page.locator(engine)).toBeVisible();
    await expect.poll(async () => Boolean(await snapshot(page))).toBe(true);
    await openToolsIfPresent(page);
    const tools = page.getByRole("dialog", { name: "Game controls", exact: true });
    await expect(tools.getByRole("button", { name: "Back to the game", exact: true })).toBeFocused();
    const before = motorState(await snapshot(page));
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(450);
    await page.keyboard.up("ArrowRight");
    expect(motorState(await snapshot(page))).toEqual(before);
    const buttons = tools.locator("button");
    await buttons.last().focus();
    await page.keyboard.press("Tab");
    await expect(buttons.first()).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(buttons.last()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(tools).toHaveCount(0);
    await expect(page.locator(".lg-game-player-main")).toBeFocused();
    await expect(page.getByRole("dialog", { name: /leave|quit|exit/i })).toHaveCount(0);
    await expect.poll(async () => (await snapshot(page)).paused).toBe(false);
    const position = motorState(await snapshot(page)).position;
    await page.keyboard.down("ArrowRight");
    await expect.poll(async () => JSON.stringify(motorState(await snapshot(page)).position)).not.toBe(JSON.stringify(position));
    await page.keyboard.up("ArrowRight");
    await openToolsIfPresent(page);
    const sound = tools.getByRole("button", { name: "Turn spoken audio and game sounds on", exact: true });
    await sound.click();
    await expect(tools.getByRole("button", { name: "Turn spoken audio and game sounds off", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(async () => (await snapshot(page)).paused).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.locator(".lg-game-player-main")).toBeFocused();
  });
}

test("Lantern reading eligibility travels through the actual Phonics/Arcade host without difficulty or class-cycle inference", async ({ page }) => {
  await page.goto("/preview/child-surfaces.html?surface=arcade&lockedGame=lantern-lagoon&placementCycle=10");
  await expect(page.locator(".lantern-lagoon")).toHaveAttribute("data-mode", "reading");
  await page.goto("/preview/child-surfaces.html?surface=arcade&lockedGame=lantern-lagoon&teachingCycle=25");
  await expect(page.locator(".lantern-lagoon")).toHaveAttribute("data-mode", "listening");
  await page.goto("/preview/game-overlay.html?game=lantern-lagoon&difficulty=hard&sound=0");
  await expect(page.locator(".lantern-lagoon")).toHaveAttribute("data-mode", "listening");
  await expect(page.getByText("Sound is off.", { exact: false })).toBeVisible();
});
