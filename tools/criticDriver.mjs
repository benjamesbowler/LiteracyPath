// Critic driver: walks the live skills-critic preview for each skill,
// screenshots rendered questions, and dumps runtime payload evidence.
// Usage: node tools/criticDriver.mjs [skillId ...]   (default: all 30)
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("critic-evidence");
const BASE = "http://127.0.0.1:4174/preview/skills-critic.html";

const ALL_SKILLS = [
  "initial_sounds", "final_sounds", "rhyming", "cvc_short_vowels", "short_vowel_discrimination",
  "hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100",
  "digraphs", "blends", "long_vowels", "vowel_teams", "r_controlled",
  "nouns", "verbs", "adjectives", "prepositions", "plurals", "prefix_suffix",
  "antonyms_synonyms", "homophones",
  "sentence_comprehension", "key_details", "main_idea", "sequencing",
  "cause_effect", "inference", "context_clues", "theme"
];

const skills = process.argv.slice(2).length ? process.argv.slice(2) : ALL_SKILLS;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const summary = [];

for (const skill of skills) {
  const dir = path.join(OUT, skill);
  fs.mkdirSync(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", e => consoleErrors.push(`pageerror: ${e.message}`));

  const record = { skill, ok: false, questionsSeen: 0, shots: [], formats: {}, consoleErrors, imageResults: [], notes: [] };
  try {
    await page.goto(`${BASE}?skill=${skill}`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__critic?.ready || /failed/.test(window.__critic?.state?.().message || ""), { timeout: 30_000 });

    const bank = await page.evaluate(() => window.__critic.bank());
    fs.writeFileSync(path.join(dir, "bank.runtime.json"), JSON.stringify(bank, null, 1));
    record.bankSize = bank.length;

    const roundLength = await page.evaluate(() => window.__critic.roundLength);
    record.roundLength = roundLength;

    const seenFormats = new Set();
    // Walk one full round, screenshotting every question; capture per-format
    // extra shots on first sight.
    for (let i = 0; i < roundLength + 2; i++) {
      const state = await page.evaluate(() => window.__critic.state());
      if (!state.question) break;
      const q = state.question;
      record.questionsSeen++;
      const fmt = String(q.formatType || q.templateType || q.questionType || "unknown");
      record.formats[fmt] = (record.formats[fmt] || 0) + 1;

      // image load audit for this question's rendered img tags
      const images = await page.evaluate(() =>
        [...document.querySelectorAll("img")].map(img => ({
          src: img.getAttribute("src"), complete: img.complete, naturalWidth: img.naturalWidth, alt: img.alt
        }))
      );
      record.imageResults.push({ id: q.id, images });

      // Let every rendered image finish loading before the screenshot —
      // half-loaded cards read as missing art and poison the critique.
      await page.waitForFunction(
        () => [...document.images].every(img => img.complete),
        { timeout: 8000 }
      ).catch(() => {});
      const shot = path.join(dir, `q${String(i + 1).padStart(2, "0")}_${fmt}${seenFormats.has(fmt) ? "" : "_first"}.png`);
      await page.screenshot({ path: shot, fullPage: false });
      record.shots.push(path.basename(shot));
      seenFormats.add(fmt);

      fs.writeFileSync(path.join(dir, `q${String(i + 1).padStart(2, "0")}.json`), JSON.stringify({ question: q, spokenSoFar: state.spoken.length }, null, 1));

      await page.evaluate(() => window.__critic.answerCorrect());
      await page.waitForTimeout(350);
      // feedback screen (first two only, to show the feedback experience)
      if (i < 2) {
        const fbShot = path.join(dir, `q${String(i + 1).padStart(2, "0")}_feedback.png`);
        await page.screenshot({ path: fbShot });
        record.shots.push(path.basename(fbShot));
      }
      await page.evaluate(() => window.__critic.next());
      await page.waitForTimeout(250);
    }

    const finalState = await page.evaluate(() => window.__critic.state());
    fs.writeFileSync(path.join(dir, "spoken.json"), JSON.stringify(finalState.spoken, null, 1));
    record.spokenCalls = finalState.spoken.length;
    record.ok = record.questionsSeen > 0;
  } catch (error) {
    record.notes.push(String(error?.message || error));
  }
  fs.writeFileSync(path.join(dir, "driver-summary.json"), JSON.stringify(record, null, 1));
  summary.push(record);
  await page.close();
  console.log(`${record.ok ? "OK " : "FAIL"} ${skill} seen=${record.questionsSeen}/${record.roundLength ?? "?"} bank=${record.bankSize ?? "?"} errors=${consoleErrors.length}`);
}

await browser.close();
fs.writeFileSync(path.join(OUT, "driver-summary.json"), JSON.stringify(summary, null, 1));
console.log("done");
