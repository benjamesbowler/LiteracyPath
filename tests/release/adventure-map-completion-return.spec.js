import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { buildStationRounds } from "../../src/components/elQuest/elQuestEngine.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { emptyElQuestProgress } from "../../src/utils/adventureMapProgress.js";
import { resolveAdventureRoundAudio } from "../../src/components/elQuest/adventureRoundAudio.js";

test.use({ trace: process.env.LP_CYCLE_FULL_MAP_TOUR === '1' ? 'off' : 'retain-on-failure' });

async function finishQuest(page, cycleNumber = 1, beforeAnswer = async () => {}, touch = false) {
  const activate = button => touch ? button.tap() : button.click();
  const view = page.locator('[data-quest-view="round"]');
  await expect(view).toBeVisible();
  const seed = await view.getAttribute("data-run-seed");
  const cycle = elSkillsBlockCycles.find(item => item.cycleNumber === cycleNumber);
  const rounds = buildStationRounds(cycle, "check", { seed });
  for (const [index, round] of rounds.entries()) {
    await expect(view.getByRole("heading", { name: `${index + 1} of ${rounds.length}`, exact: true })).toBeVisible();
    await beforeAnswer(round, index);
    if (round.mechanicId === "wordMemory") {
      for (const word of round.words) {
        for (const card of round.cards.filter(item => item.word === word)) {
          await activate(view.locator(`[data-card-id="${card.id}"]`));
        }
      }
    } else if (round.mechanicId === "letterGrid") {
      for (const cell of round.cells.filter(item => item.matches)) {
        await activate(view.locator(`[data-cell-id="${cell.id}"]`));
      }
    } else if (round.mechanicId === "missingLetter") {
      await activate(view.getByRole("button", { name: round.missingGrapheme, exact: true }));
    } else {
      const answers = Array.isArray(round.answer) ? round.answer : [round.answer];
      for (const answer of answers) {
        await activate(view.getByRole("button", {
          name: round.choiceStyle === "picture" || round.mechanicId === "sightWordChoice" ? `Choose ${answer}` : answer,
          exact: true
        }));
      }
    }
  }
  await expect(page.getByRole("heading", { name: `Cycle ${cycleNumber} complete!`, exact: true })).toBeVisible();
}

test.describe('all-cycle native-audio completion tour', () => {
  test.use({ hasTouch: true, viewport: { width: 1024, height: 768 } });
  test.describe.configure({ mode: 'parallel' });
  for (const cycle of elSkillsBlockCycles.filter(item => item.cycleNumber)) {
    test(`Cycle ${cycle.cycleNumber} completes every quest question with native audio`, async ({ page }, testInfo) => {
      test.skip(process.env.LP_CYCLE_FULL_MAP_TOUR !== '1', 'Opt-in all-cycle recorded-audio completion tour.');
      test.setTimeout(6 * 60_000);
      page.setDefaultTimeout(15_000);
      page.setDefaultNavigationTimeout(30_000);
      const errors = [], mediaFailures = [], delivered = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => {
        if (response.status() >= 400 && /\.(mp3|webp|png|jpg|woff2?)(\?|$)/.test(response.url())) mediaFailures.push(response.url());
      });
      await page.addInitScript(() => {
        window.__questNativeCompletions = [];
        const play = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function (...args) {
          const clip = { src: this.src, ended: false };
          window.__questNativeCompletions.push(clip);
          this.addEventListener('ended', () => { clip.ended = true; }, { once: true });
          return play.apply(this, args);
        };
      });
      await page.goto(`/preview/child-surfaces.html?surface=adventure-map&quest=${cycle.id}&station=check&preserveAdventure=1`);
      await finishQuest(page, cycle.cycleNumber, async (round, index) => {
        const audio = resolveAdventureRoundAudio(round);
        const expected = [...new Set([audio.instructionAudio, ...audio.targetAudio].filter(Boolean))];
        expect(expected.length).toBeGreaterThan(0);
        await page.evaluate(() => { window.__questNativeCompletions = []; });
        await page.getByRole('button', { name: 'Hear instructions again', exact: true }).tap();
        await expect.poll(() => page.evaluate(paths => paths.every(path => window.__questNativeCompletions.some(clip => clip.src.endsWith(path) && clip.ended)), expected), { timeout: 35_000 }).toBe(true);
        delivered.push({ question: index + 1, mechanic: round.mechanicId, completedRecordings: expected });
        await writeFile(testInfo.outputPath('quest-progress.json'), JSON.stringify({ cycle: cycle.id, completedAudioRounds: delivered.length }));
      }, true);
      expect(errors).toEqual([]);
      expect(mediaFailures).toEqual([]);
      await page.getByRole('button', { name: 'Back to your path', exact: true }).tap();
      await expect(page.locator('.sbq-map-viewport')).toBeVisible();
      await expect(page.locator('.sbq-map-progress')).toContainText('1 of 27 stops complete');
      await expect.poll(async () => {
        const stored = await page.evaluate(() => localStorage.getItem('lp-el-quest:child-surface-preview'));
        return JSON.parse(stored)?.cycles?.[cycle.id]?.stars || 0;
      }).toBeGreaterThan(0);
      await page.reload();
      await expect(page.locator('[data-quest-view="round"]')).toBeVisible();
      const recovered = await page.evaluate(() => JSON.parse(localStorage.getItem('lp-el-quest:child-surface-preview')));
      expect(recovered.cycles[cycle.id].stars).toBeGreaterThan(0);
      expect(recovered.cycles[cycle.id].plays).toBe(1);
      expect(errors).toEqual([]);
      expect(mediaFailures).toEqual([]);
      const resultPath = testInfo.outputPath('quest-result.json');
      await writeFile(resultPath, JSON.stringify({ cycle: cycle.id, delivered, recovered: recovered.cycles[cycle.id], errors, mediaFailures }, null, 2));
      await testInfo.attach('completed-quest-audio', { path: resultPath, contentType: 'application/json' });
    });
  }
});

test("a completed cycle returns to the current map and opens the next stop", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/preview/child-surfaces.html?surface=adventure-map");
  await expect(page.locator('[data-stop="cycle-1"]')).toBeVisible();
  // A returning learner has finished four practice stations; complete the
  // scored quest through the real controls rather than seeding its result.
  await page.evaluate(progress => {
    localStorage.setItem("lp-el-quest:child-surface-preview", JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent("lp-progress-hydrated"));
  }, { ...emptyElQuestProgress(), cycles: { "cycle-1": { stations: { letters: true, sounds: true, hunt: true, quick: true } } } });
  await page.locator('[data-child-primary]').click();
  await page.getByRole("button", { name: /^Cycle Quest/ }).click();
  await finishQuest(page);
  await page.getByRole("button", { name: "Back to the map", exact: true }).click();
  await expect(page.locator('[data-stop="cycle-1"]')).toHaveAttribute("data-node-state", "done");
  await expect(page.locator('[data-stop="cycle-2"]')).toHaveAttribute("data-node-state", "next");
  await expect(page.locator('[data-stop="cycle-2"]')).toBeVisible();
  await expect(page.getByText("Your sound and word path", { exact: true })).toHaveCount(0);
  await page.locator('[data-child-primary]').click();
  await expect(page.locator('[data-quest-view="cycle"] .sbq-kicker')).toHaveText("Cycle 2");
});

test("the standalone quest return has a visible map viewport after completion", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/preview/child-surfaces.html?surface=adventure-map&quest=cycle-1&station=check");
  await finishQuest(page);
  await page.getByRole("button", { name: "Back to your path", exact: true }).click();
  const viewport = page.locator(".sbq-map-viewport");
  await expect(viewport).toBeVisible();
  expect((await viewport.boundingBox()).height).toBeGreaterThan(200);
  await expect(page.locator(".sbq-stop.next")).toBeVisible();
  await expect(page.locator(".sbq-map-progress")).toContainText("1 of 27");
});
