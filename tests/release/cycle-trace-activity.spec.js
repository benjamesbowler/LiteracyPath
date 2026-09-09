import { mkdir, writeFile, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const harnessFiles = new Set();
test.beforeEach(async ({ page }) => {
  page.on("pageerror", error => { throw error; });
});
test.afterEach(async () => {
  for (const file of harnessFiles) await rm(file, { force: true });
  harnessFiles.clear();
});

async function loadTrace(page, grapheme = "a", reducedMotion = false) {
  const file = `.artifacts/cycle-trace-${randomUUID()}.jsx`;
  await mkdir(".artifacts", { recursive: true });
  await writeFile(file, `
import React from 'react';
import { createRoot } from 'react-dom/client';
import CycleTraceActivity from '/src/components/cycle-practice/CycleTraceActivity.jsx';
import { createCycleTraceModel } from '/src/components/cycle-practice/cycleTraceRules.js';
window.__trace = {commits:[], retries:[], supports:[], interactions:0, model:createCycleTraceModel(${JSON.stringify(grapheme)})};
document.body.style.cssText = 'margin:0;padding:28px;background:#f0f5e9;font-family:Arial;box-sizing:border-box';
const root=createRoot(document.getElementById('root'));
const props={
  round:{id:'trace-test',targetGrapheme:${JSON.stringify(grapheme)},targetWord:'apple',image:'/images/assessment/objective-words/apple.webp'},
  reducedMotion:${reducedMotion},
  onCommit:value=>{if(window.__trace.rejectCommit)return false;window.__trace.commits.push(value);return true;},
  onRetry:value=>window.__trace.retries.push(value),
  onSupport:value=>window.__trace.supports.push(value),
  onInteraction:()=>{window.__trace.interactions+=1;}
};
window.__trace.setDisabled=disabled=>root.render(React.createElement(CycleTraceActivity,{...props,disabled}));
window.__trace.setDisabled(false);`);
  harnessFiles.add(file);
  await page.route("**/cycle-trace-component-check", async route => {
    const response = await page.request.get("/preview/child-surfaces.html");
    await route.fulfill({ contentType: "text/html", body: (await response.text()).replace("/src/child-surfaces-preview.jsx", `/${file}`) });
  });
  await page.goto("/cycle-trace-component-check");
  await expect(page.locator('[data-mechanic-stage="cycle-trace"]')).toBeVisible();
  await expect.poll(() => page.locator(".cycle-trace__picture-card img").evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
}

async function targetStrokes(page) {
  return page.evaluate(() => {
    const transform = document.querySelector(".cycle-trace__pad").getScreenCTM();
    return window.__trace.model.strokes.map(stroke => stroke.points.filter((_, index) => index % 3 === 0 || index === stroke.points.length - 1).map(([x, y]) => {
      const point = new DOMPoint(x, y).matrixTransform(transform);
      return [point.x, point.y];
    }));
  });
}

async function drawStroke(page, points, release = true) {
  await page.mouse.move(...points[0]);
  await page.mouse.down();
  for (const point of points.slice(1)) await page.mouse.move(...point);
  if (release) await page.mouse.up();
}

test("tracing accepts wobbly reversed strokes automatically only after release with no check button", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await loadTrace(page);
  await page.screenshot({ path: ".artifacts/cycle-trace-ipad-landscape.png" });
  await expect(page.getByRole("button", { name: /check|submit|next|writing|answer/i })).toHaveCount(0);
  const strokes = (await targetStrokes(page)).reverse().map(stroke => stroke.reverse().map(([x, y], i) => [x + 6 * Math.sin(i), y + 5 * Math.cos(i)]));
  for (const stroke of strokes.slice(0, -1)) await drawStroke(page, stroke);
  expect(await page.evaluate(() => window.__trace.commits.length)).toBe(0);
  await drawStroke(page, strokes.at(-1), false);
  expect(await page.evaluate(() => window.__trace.commits.length)).toBe(0);
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.__trace.commits.length)).toBe(1);
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  const result = await page.evaluate(() => window.__trace.commits[0]);
  expect(result.correct).toBe(true);
  expect(result.evidence.independent).toBe(false);
  expect(result.evidence.supportUsed).toEqual(["trace_model"]);
  expect(await page.evaluate(() => window.__trace.interactions)).toBeGreaterThanOrEqual(4);
  await page.mouse.click(strokes[0][0][0], strokes[0][0][1]);
  expect(await page.evaluate(() => window.__trace.commits.length)).toBe(1);
});

test("a tap retries without awarding the letter and valid partial ink survives a cancelled gesture", async ({ page }) => {
  await loadTrace(page, "A");
  const strokes = await targetStrokes(page);
  await page.mouse.click(...strokes[0][0]);
  expect(await page.evaluate(() => window.__trace.commits.length)).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__trace.retries.length)).toBe(1);
  await drawStroke(page, strokes[0]);
  const progress = await page.getByRole("progressbar").getAttribute("aria-valuenow");
  expect(Number(progress)).toBeGreaterThan(0);
  await page.locator(".cycle-trace__pad").evaluate(element => element.addEventListener("pointerdown", event => { window.__trace.pointerId = event.pointerId; }, { once: true }));
  await page.mouse.move(...strokes[1][0]);
  await page.mouse.down();
  await page.locator(".cycle-trace__pad").dispatchEvent("pointercancel", { pointerId: await page.evaluate(() => window.__trace.pointerId), pointerType: "mouse" });
  await page.mouse.up();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", progress);
  for (const stroke of strokes.slice(1)) await drawStroke(page, stroke);
  await expect.poll(() => page.evaluate(() => window.__trace.commits.length)).toBe(1);
  const result = await page.evaluate(() => window.__trace.commits[0]);
  expect(result.evidence.firstResponse.correct).toBe(false);
  expect(result.evidence.attempts).toBe(2);
});

test("keyboard motor support completes each modeled part and remains explicitly supported", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await loadTrace(page, "sh", true);
  await page.getByRole("button", { name: "Show me the letter trail" }).click();
  await expect(page.locator("[data-trace-model]")).toBeVisible();
  const help = page.getByRole("button", { name: "Help me trace one part" });
  await help.focus();
  const count = await page.evaluate(() => window.__trace.model.strokes.length);
  for (let index = 0; index < count; index += 1) await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => window.__trace.commits.length)).toBe(1);
  const result = await page.evaluate(() => window.__trace.commits[0]);
  expect(result.evidence.supportUsed).toEqual(["trace_model", "trace_demo", "switch_trace"]);
  expect(result.evidence.independent).toBe(false);
  expect(result.evidence.drawingReleases).toBe(0);
  for (const control of await page.getByRole("button").all()) {
    const box = await control.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(56);
    expect(box.height).toBeGreaterThanOrEqual(56);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("touch tracing a letter team works in portrait with several finger lifts", async ({ page, context }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await loadTrace(page, "th");
  const strokes = await targetStrokes(page);
  const client = await context.newCDPSession(page);
  await client.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  for (const stroke of strokes.reverse()) {
    const middle = Math.max(1, Math.floor(stroke.length / 2));
    for (const part of [stroke.slice(0, middle + 1), stroke.slice(middle)]) {
      await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: part[0][0], y: part[0][1] }] });
      for (const [x, y] of part.slice(1)) await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
      await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    }
  }
  await expect.poll(() => page.evaluate(() => window.__trace.commits.length)).toBe(1);
  expect(await page.evaluate(() => window.__trace.commits[0].evidence.supportUsed)).toEqual(["trace_model"]);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await client.detach();
});

test("pausing during a held trace releases the pointer and keeps completed strokes for resume", async ({ page }) => {
  await loadTrace(page, "A");
  const strokes = await targetStrokes(page);
  await drawStroke(page, strokes[0]);
  const progress = await page.getByRole("progressbar").getAttribute("aria-valuenow");
  await drawStroke(page, strokes[1], false);
  await page.evaluate(() => window.__trace.setDisabled(true));
  await expect(page.locator(".cycle-trace__pad")).toHaveAttribute("aria-disabled", "true");
  await page.evaluate(() => window.__trace.setDisabled(false));
  await expect(page.locator(".cycle-trace__pad")).toHaveAttribute("aria-disabled", "false");
  await page.mouse.up();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", progress);
  expect(await page.evaluate(() => window.__trace.commits)).toHaveLength(0);
  for (const stroke of strokes.slice(1)) await drawStroke(page, stroke);
  await expect.poll(() => page.evaluate(() => window.__trace.commits.length)).toBe(1);
});

test("a rejected parent response leaves a finished trail usable after audio or visibility recovers", async ({ page }) => {
  await loadTrace(page, "a");
  await page.evaluate(() => { window.__trace.rejectCommit = true; });
  const strokes = await targetStrokes(page);
  for (const stroke of strokes) await drawStroke(page, stroke);
  expect(await page.evaluate(() => window.__trace.commits)).toHaveLength(0);
  await expect(page.locator(".cycle-trace__pad")).toHaveAttribute("aria-disabled", "false");
  await page.evaluate(() => { window.__trace.rejectCommit = false; });
  await drawStroke(page, strokes[0]);
  await expect.poll(() => page.evaluate(() => window.__trace.commits.length)).toBe(1);
  expect(await page.evaluate(() => window.__trace.commits[0].evidence.supportUsed)).toEqual(["trace_model"]);
});
