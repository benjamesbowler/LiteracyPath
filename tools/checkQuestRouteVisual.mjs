import { chromium } from "playwright";
import sharp from "sharp";

const BASE = process.env.QUEST_PREVIEW_URL || "http://127.0.0.1:5174";
const SOFTWARE_RENDERER_STARTUP_TIMEOUT = 45_000;
const SOFTWARE_GATE_HANDOFF_TIMEOUT = 60_000;

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
      () => document.querySelector(".qh-root.is-ready, .qh-root.has-fallback"),
      null,
      { timeout: SOFTWARE_RENDERER_STARTUP_TIMEOUT }
    );
    const state = await page.evaluate(() => {
      const root = document.querySelector(".qh-root");
      const canvas = document.querySelector(".qh-canvas");
      const rectangle = canvas?.getBoundingClientRect();
      return {
        ready: root?.classList.contains("is-ready"),
        error: root?.classList.contains("has-fallback"),
        chapter: root?.dataset.chapter,
        topology: root?.dataset.routeTopology,
        canvas: rectangle ? { width: rectangle.width, height: rectangle.height } : null
      };
    });
    const pixels = await pixelEvidence(await page.screenshot({ fullPage: false }));
    const expectedCanvas = state.canvas?.width === scenario.viewport.width && state.canvas?.height === scenario.viewport.height;
    const nonBlank = pixels.deviation > 18 && pixels.colourBins > 80;
    return {
      ok: state.ready && !state.error && expectedCanvas && nonBlank && errors.length === 0,
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
    await page.goto(`${BASE}/preview/quest.html?view=world&stop=s8&done=7&checkpoint=gate&creature=showcase&display=low`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000
    });
    await page.waitForFunction(
      () => document.querySelector(".qh-root.is-ready"),
      null,
      { timeout: SOFTWARE_RENDERER_STARTUP_TIMEOUT }
    );
    const gate = page.getByRole("button", { name: /The gate is open/ });
    await gate.click({ force: true, timeout: 5_000 });
    await page.waitForFunction(
      () => document.querySelector(".qh-land-title strong")?.textContent?.trim() === "Trail 9 of 40",
      null,
      { timeout: SOFTWARE_GATE_HANDOFF_TIMEOUT }
    );
    const state = await page.evaluate(() => ({
      trail: document.querySelector(".qh-land-title strong")?.textContent?.trim(),
      chapter: document.querySelector(".qh-root")?.dataset.chapter,
      topology: document.querySelector(".qh-root")?.dataset.routeTopology,
      inWorld: Boolean(document.querySelector(".qh-root")) && !document.querySelector(".q-den")
    }));
    return { ok: state.trail === "Trail 9 of 40" && state.inWorld && errors.length === 0, state, errors };
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
});

let failed = false;
try {
  const scenarios = [
    {
      name: "desktop-meander",
      viewport: { width: 1180, height: 820 },
      url: "/preview/quest.html?view=world&stop=s1&creature=showcase"
    },
    {
      name: "phone-island-loop",
      viewport: { width: 390, height: 844 },
      url: "/preview/quest.html?view=world&stop=s20&done=19&creature=showcase"
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
}

if (failed) process.exitCode = 1;
