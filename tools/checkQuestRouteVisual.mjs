import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const BASE = process.env.QUEST_PREVIEW_URL || "http://127.0.0.1:5174";
const SOFTWARE_RENDERER_STARTUP_TIMEOUT = 45_000;
const SOFTWARE_GATE_HANDOFF_TIMEOUT = 60_000;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// This gate used to ASSUME a dev server was already listening on BASE — true
// on a laptop with `npm run dev` open, false on every fresh CI machine, so the
// first CI run ever died with ERR_CONNECTION_REFUSED before checking a single
// pixel. Same pattern as shootQuest.mjs / checkQuestSliceCamera.mjs now: use a
// server if one is there, boot our own if not, and kill the whole process
// group on exit so a crashed run can't squat on the port.
async function reachable() {
  try {
    const response = await fetch(BASE, { signal: AbortSignal.timeout(1500) });
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await reachable()) return () => {};
  const port = new URL(BASE).port || "5174";
  const proc = spawn("npx", ["vite", "--host", "127.0.0.1", "--port", port, "--strictPort"], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", "ignore", "pipe"],
    env: {
      ...process.env,
      BROWSER: "none",
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || BASE,
      VITE_SUPABASE_ANON_KEY:
        process.env.VITE_SUPABASE_ANON_KEY || "quest-route-visual-test-key"
    }
  });
  proc.stderr.on("data", data => process.stderr.write(`  [vite] ${data}`));
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await reachable()) {
      return () => { try { process.kill(-proc.pid, "SIGTERM"); } catch { /* already gone */ } };
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  try { process.kill(-proc.pid, "SIGTERM"); } catch { /* already gone */ }
  throw new Error(`Quest preview did not start on ${BASE}`);
}

async function pixelEvidence(buffer) {
  const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  let sumSquares = 0;
  let samples = 0;
  const colours = new Set();
  const step = Math.max(1, Math.floor((info.width * info.height) / 12000));
  for (let pixel = 0; pixel < info.width * info.height; pixel += step) {
    const offset = pixel * info.channels;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    sum += luminance;
    sumSquares += luminance * luminance;
    samples += 1;
    colours.add(`${red >> 4}:${green >> 4}:${blue >> 4}`);
  }
  const mean = sum / samples;
  const deviation = Math.sqrt(Math.max(0, sumSquares / samples - mean * mean));
  return { width: info.width, height: info.height, mean, deviation, colourBins: colours.size };
}

async function inspectWorld(browser, scenario) {
  const page = await browser.newPage({ viewport: scenario.viewport, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  try {
    await page.goto(`${BASE}${scenario.url}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForFunction(
      () => document.querySelector(".qp-root[data-ready='true'], .q-world-error"),
      null,
      { timeout: SOFTWARE_RENDERER_STARTUP_TIMEOUT }
    );
    const state = await page.evaluate(() => {
      const root = document.querySelector(".qp-root");
      const canvas = document.querySelector(".qp-canvas canvas");
      const rectangle = canvas?.getBoundingClientRect();
      const map = window.__questPixelRuntime?.getLayoutSnapshot?.().map || null;
      return {
        ready: root?.dataset.ready === "true",
        error: Boolean(document.querySelector(".q-world-error")),
        chapter: root?.querySelector(".qp-place span")?.textContent?.trim() || null,
        stopId: map?.stopId || null,
        authorship: map?.authorship || null,
        topology: map?.topology || null,
        routeSignature: map?.routeSignature || [],
        canvas: rectangle ? { width: rectangle.width, height: rectangle.height } : null
      };
    });
    const pixels = await pixelEvidence(await page.screenshot({ fullPage: false }));
    const expectedCanvas = state.canvas?.width === scenario.viewport.width && state.canvas?.height === scenario.viewport.height;
    const nonBlank = pixels.deviation > 18 && pixels.colourBins > 80;
    return {
      ok: state.ready
        && !state.error
        && state.authorship === "route-authored"
        && Boolean(state.topology)
        && state.routeSignature.length === 5
        && expectedCanvas
        && nonBlank
        && errors.length === 0,
      state,
      pixels,
      errors
    };
  } finally {
    await page.close();
  }
}

async function inspectGateHandoff(browser) {
  const page = await browser.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  try {
    await page.goto(`${BASE}/preview/quest.html?view=world&stop=s8&done=7&checkpoint=gate&creature=showcase&display=pixel`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000
    });
    await page.waitForFunction(
      () => document.querySelector(".q-journey-layer.is-active .qp-root[data-ready='true']"),
      null,
      { timeout: SOFTWARE_RENDERER_STARTUP_TIMEOUT }
    );
    await page.keyboard.down("ArrowUp");
    try {
      await page.waitForFunction(() => {
        const activeLayer = document.querySelector(".q-journey-layer.is-active");
        return activeLayer?.getAttribute("data-stop") === "s9"
          && Boolean(activeLayer.querySelector(".qp-root[data-ready='true']"));
      }, null, { timeout: SOFTWARE_GATE_HANDOFF_TIMEOUT });
    } finally {
      await page.keyboard.up("ArrowUp");
    }
    const state = await page.evaluate(() => ({
      stopId: document.querySelector(".q-journey-layer.is-active")?.getAttribute("data-stop") || null,
      trail: document.querySelector(".q-journey-layer.is-active .qp-place strong")?.textContent?.trim() || null,
      chapter: document.querySelector(".q-journey-layer.is-active .qp-place span")?.textContent?.trim() || null,
      topology: window.__questPixelRuntime?.getLayoutSnapshot?.().map?.topology || null,
      inWorld: Boolean(document.querySelector(".q-journey-layer.is-active .qp-root[data-ready='true']")) && !document.querySelector(".q-den")
    }));
    return { ok: state.stopId === "s9" && state.trail === "Wheelhouse Bend" && state.inWorld && errors.length === 0, state, errors };
  } finally {
    await page.close();
  }
}

const stopServer = await ensureServer();
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
});

let failed = false;
try {
  const scenarios = [
    {
      name: "desktop-meander",
      viewport: { width: 1180, height: 820 },
      url: "/preview/quest.html?view=world&stop=s1&creature=showcase&display=pixel"
    },
    {
      name: "phone-island-loop",
      viewport: { width: 390, height: 844 },
      url: "/preview/quest.html?view=world&stop=s20&done=19&creature=showcase&display=pixel"
    }
  ];
  for (const scenario of scenarios) {
    const result = await inspectWorld(browser, scenario);
    console.log(`${result.ok ? "PASS" : "FAIL"} ${scenario.name}`, JSON.stringify({ state: result.state, pixels: result.pixels, errors: result.errors }));
    if (!result.ok) failed = true;
  }
  const handoff = await inspectGateHandoff(browser);
  console.log(`${handoff.ok ? "PASS" : "FAIL"} curved-gate-handoff`, JSON.stringify(handoff));
  if (!handoff.ok) failed = true;
} finally {
  await browser.close();
  stopServer();
}

if (failed) process.exitCode = 1;
