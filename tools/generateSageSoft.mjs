// GENERATE the "sage-soft" layer — the de-comic-ing of the student sub-pages.
//
// Owner call (2026-07-17): under the sage skin, every student area except the
// Arcade and the Hollow should read like the sage home — soft palette, no
// heavy ink outlines, no hard offset drop-shadows. The comic look is not a
// list of special cases, it is two REPEATED PATTERNS across the comic layer:
//
//   1. thick borders   (>= 2px, usually var(--comic-ink))
//   2. hard shadows    (box-shadow: Npx Npx 0 <ink>, no blur — the pop-art
//                       offset slab)
//
// Hand-overriding hundreds of such rules would drift the moment the comic
// layer changes, so this tool PARSES the comic layer and EMITS one soft
// override per offending rule into src/styles/sage-soft.generated.css:
//
//   border-width  ->  1.5px hairline (semantic border COLOURS are kept —
//                     right/wrong feedback still reads; the palette was
//                     already remapped by sage-subpages.css)
//   box-shadow    ->  one soft ambient shadow
//
// Every emitted selector is scoped to the sage skin and EXEMPTS the Arcade
// and Hollow subtrees, which keep the full comic look by design.
//
//   npm run generate:sage-soft     (also runs in prebuild)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Heaviness lives in three layers: the comic reskin, the vibrant student
// layer beneath it, and the shared App.css component styles. All three are
// parsed; the .lp-skin-sage scope keeps every override student-side only.
const SOURCES = [
  path.join(ROOT, "src", "styles", "comic-theme.css"),
  path.join(ROOT, "src", "styles", "student-vibrant.css"),
  path.join(ROOT, "src", "App.css")
];
const OUT = path.join(ROOT, "src", "styles", "sage-soft.generated.css");

const SOFT_SHADOW = "0 1px 3px rgba(30, 40, 30, 0.10)";
const SOFT_BORDER_WIDTH = "1.5px";
const EXEMPT = ":not(:is(.hollow-page, .student-surface-arcade, .companion-picker) *)";

// A hard pop-art shadow: at least one layer shaped "Npx Npx 0[px] <color>"
// (offset slab, zero blur). Soft ambient shadows (with blur) are left alone.
const HARD_SHADOW = /(^|,)\s*(inset\s+)?-?\d+(\.\d+)?px\s+-?\d+(\.\d+)?px\s+0(px)?\s/;

// Border declarations at 2px and above count as "heavy". 1.5px and below is
// already the sage hairline.
function heavyBorderWidth(value) {
  const match = /^(-?\d+(?:\.\d+)?)px/.exec(String(value).trim());
  return match ? Number(match[1]) >= 2 : false;
}

function scopeSelector(selector) {
  const trimmed = selector.trim();
  // Never touch rules that are already skin-, hollow- or arcade-specific.
  if (/lp-skin-sage|lp-home-sage|hollow|arcade/i.test(trimmed)) return null;
  // Keyframe steps and pseudo-roots pass through untouched.
  if (trimmed.startsWith("@") || /^(from|to|\d+%)$/.test(trimmed)) return null;
  const scoped = trimmed.includes(".student-mode-app")
    ? trimmed.replace(/\.student-mode-app/, ".student-mode-app.lp-skin-sage")
    : `.lp-skin-sage ${trimmed}`;
  // A pseudo-ELEMENT must stay last: `.x::before:not(...)` is invalid CSS and
  // failed the Vercel build's minifier (observed 2026-07-17). The exemption
  // goes on the originating element instead: `.x:not(...)::before`.
  const pseudo = /(::?(before|after|placeholder|marker|selection|backdrop|first-line|first-letter))$/i.exec(scoped);
  if (pseudo) {
    const base = scoped.slice(0, pseudo.index);
    return `${base}${EXEMPT}${pseudo[1]}`;
  }
  return `${scoped}${EXEMPT}`;
}

const overrides = [];
let borders = 0;
let shadows = 0;

for (const source of SOURCES) {
const parsed = postcss.parse(fs.readFileSync(source, "utf8"));

parsed.walkRules(rule => {
  if (rule.parent?.type === "atrule" && /keyframes/i.test(rule.parent.name || "")) return;
  const declarations = [];
  rule.walkDecls(decl => {
    const prop = decl.prop.toLowerCase();
    if (prop === "box-shadow" && HARD_SHADOW.test(decl.value)) {
      declarations.push(`box-shadow: ${decl.value.includes("inset") ? "none" : SOFT_SHADOW}`);
      shadows += 1;
    } else if ((prop === "border" || /^border-(top|right|bottom|left)$/.test(prop)) && heavyBorderWidth(decl.value)) {
      const side = prop === "border" ? "border" : prop;
      declarations.push(`${side}-width: ${SOFT_BORDER_WIDTH}`);
      borders += 1;
    } else if (/^border(-(top|right|bottom|left))?-width$/.test(prop) && heavyBorderWidth(decl.value)) {
      declarations.push(`${decl.prop}: ${SOFT_BORDER_WIDTH}`);
      borders += 1;
    } else if (prop === "text-shadow" && HARD_SHADOW.test(decl.value)) {
      declarations.push("text-shadow: none");
      shadows += 1;
    }
  });
  if (!declarations.length) return;
  const scoped = rule.selectors.map(scopeSelector).filter(Boolean);
  if (!scoped.length) return;
  overrides.push(`${scoped.join(",\n")} {\n  ${[...new Set(declarations)].join(";\n  ")};\n}`);
});
}

// ── DOES ANY OF THIS MATCH THE APP? ────────────────────────────────────────
//
// This tool reads STYLESHEETS and emits overrides for what it finds there.
// Stylesheets outlive the markup that used them, so that is a generator which
// will confidently produce rules for classes the app stopped rendering years
// ago — and every one of them passes the syntax check below, ships, and does
// nothing.
//
// That is exactly what happened. The previous output claimed "128 borders
// softened, 66 shadows feathered" against `.comic-btn`, `.comic-chip`,
// `.comic-tab`, `.comic-banner` and `.comic-title` — none of which appear in
// ANY .jsx file. The deployed site kept its hard comic chrome while the file
// that was supposed to soften it reported success.
//
// So: before writing, every emitted rule is checked against the class names
// the components actually use. A rule whose classes are all absent is dropped
// and reported. A generator that cannot tell live CSS from dead CSS is worse
// than no generator, because it produces confident evidence of work not done.
const JSX_SOURCES = [];
(function collectSources(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectSources(full);
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) JSX_SOURCES.push(fs.readFileSync(full, "utf8"));
  }
})(path.join(ROOT, "src"));

const APP_SOURCE = JSX_SOURCES.join("\n");
// Conservative on purpose: any occurrence of the bare token anywhere in src/
// counts, so a class assembled in a template literal or a lookup table is
// still treated as live. We only ever drop a rule when the name appears
// NOWHERE — which cannot be a false positive.
const liveClass = name => APP_SOURCE.includes(name);

const dead = [];
const liveOverrides = overrides.filter(rule => {
  const classes = [...new Set((rule.split("{")[0].match(/\.[A-Za-z0-9_-]+/g) || []).map(c => c.slice(1)))]
    // The scoping wrapper and the exemptions are ours, not the app's.
    .filter(c => !["student-mode-app", "lp-skin-sage", "hollow-page", "student-surface-arcade", "companion-picker"].includes(c));
  if (!classes.length) return true;
  if (classes.some(liveClass)) return true;
  dead.push(classes.join(", "));
  return false;
});

const banner = `/* GENERATED by tools/generateSageSoft.mjs — do not edit by hand.
   Soft overrides for every heavy comic border/shadow, scoped to the sage
   skin, Arcade + Hollow exempt. Regenerate: npm run generate:sage-soft.
   Sources: comic-theme, student-vibrant, App.css · ${borders} borders softened · ${shadows} shadows feathered.
   ${liveOverrides.length} rules kept, ${dead.length} dropped as dead (no such class in src/). */
`;

const output = banner + "\n" + liveOverrides.join("\n\n") + "\n";

// SELF-VALIDATE with the SAME minifier the production build uses, so a
// selector this tool emits can never again pass every sandbox gate and then
// fail on Vercel. If lightningcss rejects the output, this tool fails — and
// it runs in prebuild, so the build fails HERE, with a pointer to the rule.
const { transform } = await import("lightningcss");
try {
  transform({ filename: "sage-soft.generated.css", code: Buffer.from(output), minify: true });
} catch (error) {
  console.error("sage-soft output does not survive the production minifier:");
  console.error(error.message);
  process.exit(1);
}

fs.writeFileSync(OUT, output);
console.log(`sage-soft: ${liveOverrides.length} live rules (${borders} borders, ${shadows} shadows) -> ${path.relative(ROOT, OUT)} (minifier-validated)`);
if (dead.length) {
  // Not a build failure: stale selectors in a legacy stylesheet are a cleanup
  // job, not a broken build. But they are printed every single time so the
  // number cannot quietly grow, and so nobody again reads a large "softened"
  // count as evidence the app changed.
  console.log(`sage-soft: dropped ${dead.length} rules whose classes no longer exist in src/:`);
  for (const entry of dead.slice(0, 12)) console.log(`  · ${entry}`);
  if (dead.length > 12) console.log(`  … and ${dead.length - 12} more`);
}
