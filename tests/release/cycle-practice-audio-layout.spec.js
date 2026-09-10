import { expect, test } from "@playwright/test";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { buildCyclePlan } from "../../src/components/cycle-practice/cyclePracticeState.js";
import { resolveCyclePracticeAudio } from "../../src/components/cycle-practice/cyclePracticeAudio.js";

const cycle = elSkillsBlockCycles.find(row => row.id === "cycle-1");
const plan = buildCyclePlan(cycle, "child-surface-preview:preview").rounds;

async function installAudioSpy(page) {
  await page.addInitScript(() => {
    window.__cyclePracticePlayedAudio = [];
    window.__cyclePracticeAudioEvents = [];
    window.__cyclePracticeCreatedAudio = [];
    window.Audio = class CyclePracticeTestAudio extends EventTarget {
      constructor() {
        super();
        this._src = "";
        Object.defineProperty(this, "src", {
          configurable: true,
          get: () => this._src,
          set: value => {
            this._src = String(value || "");
            window.__cyclePracticeCreatedAudio.push(this._src);
          }
        });
        this.currentTime = 0;
        this.volume = 1;
        this.preload = "";
        this.timer = null;
      }

      load() {
        this.dispatchEvent(new Event("canplay"));
      }

      play() {
        window.__cyclePracticePlayedAudio.push(this.src);
        window.__cyclePracticeAudioEvents.push({ src: this.src, mechanic: document.querySelector("[data-mechanic-stage]")?.getAttribute("data-mechanic-stage") });
        if (this.timer !== null) window.clearTimeout(this.timer);
        this.timer = window.setTimeout(() => {
          this.timer = null;
          this.dispatchEvent(new Event("ended"));
        }, 4);
        return Promise.resolve();
      }

      pause() {
        if (this.timer !== null) window.clearTimeout(this.timer);
        this.timer = null;
      }
    };
  });
}

test("Cycle Practice warms the next activities and automatically speaks the instruction then the phoneme", async ({ page }) => {
  await installAudioSpy(page);
  await page.goto("/preview/child-surfaces.html?surface=cycle-practice&cycle=cycle-1");
  await expect(page.locator('[data-cycle-id="cycle-1"]')).toBeVisible();
  await expect(page.locator(".cycle-play-overlay")).toHaveCount(0);
  await expect(page.locator(".cycle-listen-button")).toHaveAttribute("data-audio-state", "ready");
  await expect(page.locator(".cycle-playground")).toHaveAttribute("data-mechanic-stage", "pictureSound");
  const resolved = resolveCyclePracticeAudio(plan[0]);
  const played = await page.evaluate(() => window.__cyclePracticePlayedAudio);
  expect(played.slice(-resolved.sequence.length)).toEqual(resolved.sequence);
  expect(resolved.sequence[0]).toBe(resolved.instructionAudio);
  expect(resolved.sequence.at(-1)).toBe(plan[0].soundAudio);
  // The named correct picture must not replace discrimination of its sound.
  expect(played).not.toContain(plan[0].audio);
  const nextWindow = plan.slice(0, 3).flatMap(round => [...resolveCyclePracticeAudio(round).sequence, ...(round.choices || []).map(choice => choice.audio)]).filter(Boolean);
  await expect.poll(() => page.evaluate(paths => paths.every(path => window.__cyclePracticeCreatedAudio.includes(path)), nextWindow)).toBe(true);
  await page.getByRole("button", { name: "Hear what to do", exact: true }).click();
  await expect(page.locator(".cycle-listen-button")).toHaveAttribute("data-audio-state", "ready");
  expect((await page.evaluate(() => window.__cyclePracticePlayedAudio)).slice(-resolved.sequence.length)).toEqual(resolved.sequence);
});

test("Cycle Practice uses large picture targets and an individual recorded-name replay for every picture", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await installAudioSpy(page);
  await page.goto("/preview/child-surfaces.html?surface=cycle-practice&cycle=cycle-1");

  await expect(page.locator(".cycle-play-overlay")).toHaveCount(0);
  await expect(page.locator(".cycle-listen-button")).toHaveAttribute("data-audio-state", "ready");
  const cards = page.locator(".cycle-answer--picture");
  await expect(cards).toHaveCount(plan[0].choices.length);
  for (const [index, choice] of plan[0].choices.entries()) {
    const box = await cards.nth(index).boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(56);
    expect(box.height).toBeGreaterThanOrEqual(56);
    const image = cards.nth(index).locator("img");
    await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await page.getByRole("button", { name: `Hear ${choice.label}`, exact: true }).click();
    await expect.poll(() => page.evaluate(path => window.__cyclePracticePlayedAudio.at(-1) === path, choice.audio)).toBe(true);
  }
  await expect(page.locator(".cycle-answer--picture[aria-pressed='true']")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /check my|submit|start cycle check|sound gate|remember the word/i })).toHaveCount(0);
});
