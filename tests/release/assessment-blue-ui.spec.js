import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { STUDENT_DEVICE_PROFILES } from "../../src/policy/studentDeviceMatrix.js";
import { expectVisibleImagesReady } from "./support/visualReadiness.js";

// The production bank is a cold lazy import. Per-action guards stay unchanged.
test.describe.configure({ timeout: 90000 });
const skillsUrl = "/preview/child-surfaces.html?surface=skills-practice&preserveSkills=1";

async function expectBundledFonts(page) {
  const result = await page.evaluate(async () => {
    await document.fonts.ready;
    const families = [];
    for (const family of ["Nunito", "Andika"]) {
      // check() alone accepts an absent font via fallback. load() must return
      // real registered faces whose network-backed status is loaded.
      const faces = await document.fonts.load(`700 16px "${family}"`, "Literacy Guide s v f y");
      families.push({ requested: family, faces: faces.map(face => ({ family: face.family, status: face.status, weight: face.weight })) });
    }
    const fontFor = selector => {
      const element = document.querySelector(selector);
      return element ? getComputedStyle(element).fontFamily : null;
    };
    return { families, visibleFonts: { control: fontFor(".skills-practice-tools button,.assessment-topbar button"),
      answer: fontFor(".assessment-answer-card span,.visual-assessment-card-button,.ixl-answer-button"),
      instruction: fontFor(".assessment-prompt h2") } };
  });
  for (const family of result.families) {
    expect(family.faces.length, `Bundled ${family.requested} must exist and load`).toBeGreaterThan(0);
    expect(family.faces.every(face => face.status === "loaded" && face.family.replaceAll('"', "") === family.requested)).toBe(true);
  }
  const fontProof = test.info().outputPath("actual-bundled-fonts.json");
  await writeFile(fontProof, JSON.stringify(result, null, 2));
  await test.info().attach("actual-bundled-fonts", { path: fontProof, contentType: "application/json" });
}

async function audio(page) {
  await page.addInitScript(() => {
    crypto.randomUUID = () => "test-session";
    window.Audio = class extends EventTarget {
      constructor() { super(); this.currentTime = 0; this.readyState = 4; this.duration = 0.02; this.paused = true; }
      load() { this.dispatchEvent(new Event("canplay")); }
      play() { this.paused = false; this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event("ended")); }, 20); return Promise.resolve(); }
      pause() { clearTimeout(this.timer); this.paused = true; }
    };
  });
}

async function startSkills(page) {
  await audio(page);
  await page.goto(skillsUrl);
  await page.locator(".skills-practice-stops").getByRole("button", { name: /^Initial Sounds/ }).click();
  await page.locator("[data-child-primary]").click();
  await expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();
  await expect(page.locator('.assessment-question-layout[aria-busy="false"]')).toBeVisible();
  await expectBundledFonts(page);
}

async function expectOwnedViewport(page) {
  await expect.poll(() => page.locator(".kg-stage").evaluate(element => Math.round(element.getBoundingClientRect().width))).toBe((await page.viewportSize()).width);
  await expect.poll(() => page.locator(".kg-stage").evaluate(element => Math.round(element.getBoundingClientRect().height))).toBe((await page.viewportSize()).height);
  const geometry = await page.evaluate(() => {
    const bounds = node => { const r = node.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
    const pane = bounds(document.querySelector(".kg-main"));
    const tabs = bounds(document.querySelector(".kg-tabbar"));
    const shell = bounds(document.querySelector(".assessment-shell"));
    const topbar = bounds(document.querySelector(".assessment-topbar"));
    const question = bounds(document.querySelector(".assessment-question-layout"));
    const tools = bounds(document.querySelector(".skills-practice-tools"));
    const controls = [...document.querySelectorAll(".skills-practice-tools button,.assessment-topbar button")].filter(element => element.getClientRects().length > 0).map(element => {
      const rect = bounds(element), point = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return { label: element.textContent.trim(), ...rect, ownsHit: element === point || element.contains(point) };
    });
    const target = document.querySelector(".assessment-answer-card,.ixl-answer-button,.visual-assessment-card-button");
    return { pane, tabs, shell, topbar, question, tools, controls, pad: getComputedStyle(target).backgroundColor,
      documentWidth: document.documentElement.scrollWidth, documentHeight: document.documentElement.scrollHeight,
      width: innerWidth, height: innerHeight, stageScale: getComputedStyle(document.querySelector(".kg-stage")).getPropertyValue("--kg-scale") };
  });
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.width + 1);
  expect(geometry.documentHeight).toBeLessThanOrEqual(geometry.height + 1);
  expect(geometry.shell.top).toBeGreaterThanOrEqual(geometry.tools.bottom - 1);
  expect(geometry.shell.bottom).toBeLessThanOrEqual(geometry.tabs.top + 1);
  expect(geometry.topbar.top).toBeGreaterThanOrEqual(geometry.pane.top - 1);
  expect(geometry.question.top).toBeGreaterThanOrEqual(geometry.topbar.bottom - 1);
  expect(geometry.question.bottom).toBeLessThanOrEqual(geometry.tabs.top + 1);
  expect(geometry.question.height).toBeGreaterThan(50);
  expect(geometry.pad).toBe("rgb(255, 255, 255)");
  expect(geometry.controls.map(control => control.label)).toEqual(expect.arrayContaining(["Choose a skill", "Show me", "Try another"]));
  for (const control of geometry.controls) {
    expect(control.ownsHit, JSON.stringify(control)).toBe(true);
    expect(control.top).toBeGreaterThanOrEqual(geometry.pane.top - 1);
    expect(control.bottom).toBeLessThanOrEqual(geometry.tabs.top + 1);
    expect(control.width).toBeGreaterThanOrEqual(56);
    expect(control.height).toBeGreaterThanOrEqual(56);
  }
  return geometry;
}

for (const profile of STUDENT_DEVICE_PROFILES) {
  test(`Skills controls and picture choices remain reachable in blue at ${profile.id}`, async ({ page }, info) => {
    await page.setViewportSize({ width: profile.width, height: profile.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await startSkills(page);
    const geometry = await expectOwnedViewport(page);
    await info.attach("viewport", { body: JSON.stringify(geometry, null, 2), contentType: "application/json" });
    const options = page.locator(".assessment-answer-card,.ixl-answer-button,.visual-assessment-card-button");
    await expect(options).toHaveCount(4);
    if (["small-phone-portrait", "small-phone-landscape"].includes(profile.id)) {
      // The first view must show a usable problem, before any scroll action.
      const panel = await page.locator(".assessment-question-layout").boundingBox();
      for (const answer of await options.all()) {
        const rect = await answer.boundingBox();
        expect(rect.y).toBeGreaterThanOrEqual(panel.y - 1);
        expect(rect.y + rect.height).toBeLessThanOrEqual(panel.y + panel.height + 1);
      }
      const instruction = profile.id === "small-phone-landscape"
        ? page.locator(".assessment-compact-instruction") : page.locator(".assessment-prompt h2");
      await expect(instruction).toBeVisible();
      expect(await instruction.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      await expect(page.getByRole("button", { name: "Hear the word", exact: true })).toBeVisible();
      for (const label of await options.locator("span").all()) {
        if ((await label.textContent()).trim().length === 1) expect(await label.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(28);
      }
    }
    // Scroll every live choice into the owned question panel and hit-test it.
    for (const choice of await options.all()) {
      await choice.scrollIntoViewIfNeeded();
      const rect = await choice.boundingBox();
      expect(rect.width).toBeGreaterThanOrEqual(56);
      expect(rect.height).toBeGreaterThanOrEqual(56);
      expect(await choice.evaluate(element => { const r = element.getBoundingClientRect(); const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return element === hit || element.contains(hit); })).toBe(true);
    }
    await expectVisibleImagesReady(page, `blue Skills ${profile.id}`);
    await page.locator(".assessment-question-layout").evaluate(element => { element.scrollTop = 0; });
    await page.screenshot({ path: info.outputPath(`assessment-blue-${profile.id}.png`) });
    await page.getByRole("button", { name: "Show me", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Show me", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Choose a skill", exact: true }).click();
    await expect(page.locator("[data-child-primary]")).toHaveText("Carry on");
  });
}

test("resizing an active Skills question preserves the exact question and supported session", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await startSkills(page);
  const before = await page.locator(".assessment-question-layout").getAttribute("data-assessment-question-id");
  expect(before).toBeTruthy();
  const storageKey = "literacy-guide-learn-games:child-surface-preview";
  const saved = await page.evaluate(key => localStorage.getItem(key), storageKey);
  await page.setViewportSize({ width: 320, height: 568 });
  await expectOwnedViewport(page);
  expect(await page.locator(".assessment-question-layout").getAttribute("data-assessment-question-id")).toBe(before);
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(saved);
  await page.setViewportSize({ width: 568, height: 320 });
  await expectOwnedViewport(page);
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(saved);
});

for (const profile of STUDENT_DEVICE_PROFILES.filter(row => ["small-phone-portrait", "small-phone-landscape", "chromebook-landscape"].includes(row.id))) {
  test(`focused formal assessment keeps all picture answers available at ${profile.id}`, async ({ page }, info) => {
    await page.setViewportSize({ width: profile.width, height: profile.height });
    await audio(page);
    await page.goto("/preview/assessment-media-evidence.html?scenario=compact-visual-grid&locked=1");
    const question = page.locator('.assessment-question-layout[aria-busy="false"]');
    await expect(question).toBeVisible();
    await expectBundledFonts(page);
    const shell = await page.locator(".assessment-shell").boundingBox();
    expect(shell.y).toBeGreaterThanOrEqual(0);
    expect(shell.y + shell.height).toBeLessThanOrEqual(profile.height + 1);
    const choices = page.locator(".visual-assessment-card-button,.ixl-answer-button,.assessment-answer-card");
    await expect(choices).toHaveCount(4);
    for (const choice of await choices.all()) {
      await choice.scrollIntoViewIfNeeded();
      const rect = await choice.boundingBox();
      expect(rect.width).toBeGreaterThanOrEqual(56);
      expect(rect.height).toBeGreaterThanOrEqual(56);
      expect(await choice.evaluate(element => { const r = element.getBoundingClientRect(); const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return element === hit || element.contains(hit); })).toBe(true);
    }
    await expectVisibleImagesReady(page, `focused assessment ${profile.id}`);
    await question.evaluate(element => { element.scrollTop = 0; });
    await page.screenshot({ path: info.outputPath(`formal-blue-${profile.id}.png`) });
    // This authored visual fixture has no save handler. Check keyboard access;
    // the real neutral save/receipt path is exercised separately below.
    await choices.first().focus();
    await expect(choices.first()).toBeFocused();
  });
}

test("blue formal assessment saves one response and advances without exposing correctness", async ({ page }) => {
  let saves = 0;
  await page.route("**/__preview_assessment_answer__", route => {
    saves += 1;
    return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.goto("/preview/assessment-media-evidence.html?scenario=response-latency");
  await expectBundledFonts(page);
  await page.getByRole("button", { name: "Picture of sun sun", exact: true }).click();
  await expect(page.locator('[data-preview-surface="assessment-media-evidence"]')).toHaveAttribute("data-answer-count", "1");
  await expect(page.locator('[data-assessment-question-id="second-safe-picture-item"]')).toBeVisible({ timeout: 750 });
  await expect(page.getByText("Correct", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Incorrect", { exact: true })).toHaveCount(0);
  expect(saves).toBe(1);
});
