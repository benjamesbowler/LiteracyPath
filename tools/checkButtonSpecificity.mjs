#!/usr/bin/env node
// checkButtonSpecificity.mjs — catch component button rules that `.app button` silently beats.
//
// Added 2026-07-27, after this exact trap shipped to the deployed preview twice.
//
// `.app button` in src/App.css is specificity (0,1,1) and declares display, border,
// border-radius, padding, min-height, font-weight, text-align and more. Any component
// rule written as a SINGLE class — `.teacher-funnel-option`, (0,1,0) — loses to it on
// every one of those properties, silently. There is no warning; the CSS is valid and the
// rule appears to exist. It simply never wins.
//
// Symptom when it happens: the component renders as a bare bold centred button with no
// border, no card, and 10px/16px padding it did not ask for.
//
// This gate finds every class that is used on a <button> in src/ AND has a (0,1,0) rule
// declaring a property `.app button` also declares. Fix by scoping the rule under its
// container so it reaches (0,2,0) — never with !important.
//
// Run: node tools/checkButtonSpecificity.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs.readFileSync(path.join(root, "src/App.css"), "utf8");

// 1. What does `.app button` actually declare?
const appButton = /\.app button\s*\{([^}]*)\}/.exec(css);
if (!appButton) {
  console.log("`.app button` no longer exists — this gate is obsolete, delete it.");
  process.exit(0);
}
const owned = new Set(
  [...appButton[1].matchAll(/^\s*([a-z-]+)\s*:/gm)].map(m => m[1])
    .flatMap(p => p === "border" ? ["border", "border-color", "border-width", "border-style"]
           : p === "padding" ? ["padding"] : [p])
);

const norm = v => String(v == null ? "" : v).replace(/\s+/g, " ").trim().toLowerCase();
const appDecls = Object.fromEntries(
  [...appButton[1].matchAll(/^\s*([a-z-]+)\s*:\s*([^;]+);/gm)].map(d => [d[1], d[2].trim()])
);
const appOwnedValue = prop => {
  if (appDecls[prop] !== undefined) return appDecls[prop];
  // `border: none` also settles border-width/style/color.
  if (/^border-(width|style|color)$/.test(prop) && appDecls.border !== undefined) return appDecls.border;
  return null;
};

// 2. Which class names are used on a <button> anywhere in src/?
const buttonClasses = new Set();
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) return e.name === "generated" ? [] : walk(p);
  return /\.(jsx|js)$/.test(e.name) ? [p] : [];
});
for (const file of walk(path.join(root, "src"))) {
  const src = fs.readFileSync(file, "utf8");
  for (const m of src.matchAll(/<button\b[^>]*?className=(?:"([^"]*)"|\{`([^`]*)`\})/gs)) {
    for (const cls of (m[1] || m[2] || "").split(/[\s${}?:'"]+/)) {
      if (/^[a-z][a-z0-9-]+$/i.test(cls)) buttonClasses.add(cls);
    }
  }
}

// 3. Single-class rules (0,1,0) on those classes that collide.
const problems = [];
for (const m of css.matchAll(/(^|\})\s*([^{}]+?)\s*\{([^}]*)\}/gm)) {
  const body = m[3];
  for (const sel of m[2].split(",").map(s => s.trim())) {
    const single = /^\.([a-z][a-z0-9-]*)$/i.exec(sel);
    if (!single || !buttonClasses.has(single[1])) continue;
    // Only a DIFFERENT value is a real defect. `.lp-button` asking for the same
    // border-radius `.app button` already gives it is a collision that changes nothing;
    // flagging those would make this gate permanently red and therefore worthless.
    const clashes = [];
    for (const d of body.matchAll(/^\s*([a-z-]+)\s*:\s*([^;]+);/gm)) {
      const prop = d[1], value = d[2].trim();
      if (!owned.has(prop)) continue;
      const mine = norm(value), theirs = norm(appOwnedValue(prop));
      if (theirs !== null && mine !== theirs) clashes.push(`${prop} (wants \`${value.trim()}\`, gets \`${appOwnedValue(prop)}\`)`);
    }
    if (clashes.length) {
      const line = css.slice(0, m.index).split("\n").length;
      problems.push(`src/App.css:${line}  ${sel}\n      ${clashes.join("\n      ")}`);
    }
  }
}

// This trap predates the gate: 46 rules were already losing when it was written. Fixing
// all of them at once would be a large untested restyle of live child-facing screens, so
// the gate ratchets instead. Known losers are baselined; a NEW one fails the build. Work
// the baseline down deliberately, verifying each in a browser — several of these may be
// harmless (the rule wants what `.app button` already gives) and several are almost
// certainly real. Do not add to the baseline to make a build pass.
const baselinePath = path.join(root, "tools/buttonSpecificityBaseline.json");
const baseline = fs.existsSync(baselinePath)
  ? new Set(JSON.parse(fs.readFileSync(baselinePath, "utf8")).selectors)
  : new Set();

const selectorOf = entry => entry.split("  ")[1]?.split("\n")[0]?.trim() || entry;
const fresh = problems.filter(p => !baseline.has(selectorOf(p)));
const fixed = [...baseline].filter(sel => !problems.some(p => selectorOf(p) === sel));

console.log(`\`.app button\` owns ${owned.size} properties; ${buttonClasses.size} classes sit on <button> elements.`);
console.log(`${problems.length} rules lose to it; ${baseline.size} are baselined.`);
if (fixed.length) {
  console.log(`\nFixed since the baseline (remove these from tools/buttonSpecificityBaseline.json):`);
  for (const sel of fixed) console.log(`  + ${sel}`);
}
if (fresh.length) {
  console.error(`\nButton specificity FAILED — ${fresh.length} NEW rule(s) that will never win:`);
  for (const p of fresh) console.error(`- ${p}`);
  console.error("\nFix: scope the rule under its container so it reaches (0,2,0). Never !important.");
  process.exit(1);
}
console.log("\nNo new component button rule is beaten by `.app button`.");
