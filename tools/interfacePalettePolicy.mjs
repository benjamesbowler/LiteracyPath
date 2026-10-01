import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";
import crypto from "node:crypto";
import { soundSeekersRoundedCssVariables } from "../src/features/soundSeekers/visual/visualTokens.js";

const NAMED_GREENS = Object.freeze({
  chartreuse: [127, 255, 0], darkgreen: [0, 100, 0], darkolivegreen: [85, 107, 47],
  darkseagreen: [143, 188, 143], forestgreen: [34, 139, 34], green: [0, 128, 0],
  greenyellow: [173, 255, 47], honeydew: [240, 255, 240], lawngreen: [124, 252, 0],
  lightgreen: [144, 238, 144], lime: [0, 255, 0], limegreen: [50, 205, 50],
  mediumaquamarine: [102, 205, 170], mediumseagreen: [60, 179, 113],
  mediumspringgreen: [0, 250, 154], mintcream: [245, 255, 250], olive: [128, 128, 0],
  olivedrab: [107, 142, 35], palegreen: [152, 251, 152], seagreen: [46, 139, 87],
  springgreen: [0, 255, 127], yellowgreen: [154, 205, 50]
});

// Production imports, including Vite's @ alias and literal lazy imports.
// Preview-only/retired sheets are reported separately, never used as release proof.
export function collectProductionSources(root = process.cwd()) {
  const seen = new Set();
  // Public legal pages share this static sheet; Present loads its standalone
  // runtime script from generated decks rather than through the React graph.
  const queue = ["src/main.jsx", "public/legal.css", "public/present/deck.js"];
  while (queue.length) {
    const file = queue.shift();
    if (seen.has(file) || !fs.existsSync(path.join(root, file))) continue;
    seen.add(file);
    const source = fs.readFileSync(path.join(root, file), "utf8");
    const imports = file.endsWith(".css")
      ? /@import\s+["']([^"']+)["']/g
      : /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["']((?:\.|@\/)[^"']+)["']/g;
    for (const match of source.matchAll(imports)) {
      const reference = match[1].split("?")[0];
      const raw = path.normalize(reference.startsWith("@/")
        ? path.join("src", reference.slice(2))
        : path.join(path.dirname(file), reference));
      const resolved = [raw, ...[".js", ".jsx", ".ts", ".tsx", ".css"].map(ext => raw + ext),
        path.join(raw, "index.js"), path.join(raw, "index.jsx")]
        .find(candidate => fs.existsSync(path.join(root, candidate))
          && fs.statSync(path.join(root, candidate)).isFile());
      if (resolved) queue.push(resolved);
    }
  }
  return [...seen].sort();
}

export function parseColour(colour) {
  colour = colour.trim().toLowerCase();
  if (NAMED_GREENS[colour]) return NAMED_GREENS[colour];
  // Three.js/canvas scene palettes use numeric hexadecimal colours as well.
  if (/^0x[\da-f]{6}$/i.test(colour)) colour = `#${colour.slice(2)}`;
  if (colour.startsWith("#")) {
    let hex = colour.slice(1);
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map(c => c + c).join("");
    if (hex.length !== 6 && hex.length !== 8) return null;
    return [0, 2, 4].map(index => Number.parseInt(hex.slice(index, index + 2), 16));
  }
  const match = /^rgba?\(\s*([\d.]+%?)[, ]+([\d.]+%?)[, ]+([\d.]+%?)/i.exec(colour);
  if (match) return match.slice(1, 4).map(channel => Number.parseFloat(channel) * (channel.endsWith("%") ? 2.55 : 1));
  const hsl = /^hsla?\(\s*([\d.]+)(?:deg)?[, ]+([\d.]+)%[, ]+([\d.]+)%/i.exec(colour);
  if (!hsl) return null;
  const hue = Number(hsl[1]) / 360, saturation = Number(hsl[2]) / 100, lightness = Number(hsl[3]) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs((hue * 6) % 2 - 1));
  const channels = hue < 1 / 6 ? [chroma, x, 0] : hue < 2 / 6 ? [x, chroma, 0]
    : hue < 3 / 6 ? [0, chroma, x] : hue < 4 / 6 ? [0, x, chroma]
      : hue < 5 / 6 ? [x, 0, chroma] : [chroma, 0, x];
  return channels.map(channel => 255 * (channel + lightness - chroma / 2));
}

export function isGreenInterfaceColour(colour) {
  if (NAMED_GREENS[colour.trim().toLowerCase()]) return true;
  const rgb = parseColour(colour);
  if (!rgb) return false;
  const [r, g, b] = rgb.map(channel => channel / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  // Include subtle sage tints and forest inks, but exclude neutral greys.
  if (delta < 0.025) return false;
  let hue = max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  hue = (hue * 60 + 360) % 360;
  return hue >= 60 && hue <= 180;
}

export const COLOUR_LITERAL = /(?<!&)#[\da-f]{3,8}\b|\b0x[\da-f]{6}\b|(?:rgba?|hsla?)\([^)]*\)/ig;
const CSS_COLOUR_LITERAL = new RegExp(`${COLOUR_LITERAL.source}|(?<![\\w-])(?:${Object.keys(NAMED_GREENS).join("|")})(?![\\w-])`, "ig");
const INLINE_NAMED_COLOUR = new RegExp(`(?:\\b(?:color|background(?:Color)?|fill|stroke|borderColor|outlineColor)\\s*[:=]\\s*["']?)(${Object.keys(NAMED_GREENS).join("|")})(?=[\\s;"'])`, "ig");

// Exact authored illustration/print boundaries. A button, status or label inside
// one of these scenes is still UI: these exceptions permit only painted layers.
const CSS_EXCEPTIONS = JSON.parse(fs.readFileSync(new URL("./interfacePaletteCssExceptions.json", import.meta.url), "utf8"));
export function permittedGreenDeclaration(file, selector, property) {
  return CSS_EXCEPTIONS.find(entry => entry.file === file && entry.selector === selector && entry.property === property)?.reason || null;
}

export function resolveColourVariables(value, variables = new Map(), visiting = new Set()) {
  const values = [value];
  for (const match of value.matchAll(/var\(\s*(--[\w-]+)/g)) {
    const name = match[1];
    if (visiting.has(name)) continue;
    for (const definition of variables.get(name) || []) {
      values.push(...resolveColourVariables(definition, variables, new Set([...visiting, name])));
    }
  }
  return values;
}

export function inventoryCss(file, source, variables = new Map()) {
  const rows = [];
  postcss.parse(source, { from: file }).walkDecls(declaration => {
    const selector = declaration.parent.selector || declaration.parent.name || "";
    for (const match of resolveColourVariables(declaration.value, variables).join(" ").matchAll(CSS_COLOUR_LITERAL)) {
      if (!isGreenInterfaceColour(match[0])) continue;
      rows.push({ file, line: declaration.source.start.line, selector, property: declaration.prop,
        colour: match[0], exception: permittedGreenDeclaration(file, selector, declaration.prop) });
    }
  });
  return rows;
}

export function productionCssInventory(root = process.cwd()) {
  const sources = collectProductionSources(root);
  const cssFiles = sources.filter(file => file.endsWith(".css"));
  const sheets = cssFiles.map(file => [file, fs.readFileSync(path.join(root, file), "utf8")]);
  const variables = new Map(Object.entries(soundSeekersRoundedCssVariables()).map(([name, value]) => [name, [value]]));
  for (const [file, source] of sheets) postcss.parse(source, { from: file }).walkDecls(declaration => {
    if (!declaration.prop.startsWith("--")) return;
    const values = variables.get(declaration.prop) || [];
    if (!values.includes(declaration.value)) variables.set(declaration.prop, [...values, declaration.value]);
  });
  const rows = sheets.flatMap(([file, source]) => inventoryCss(file, source, variables));
  return { sources, cssFiles, rows, violations: rows.filter(row => !row.exception) };
}

export function inlineFingerprint(source) {
  return crypto.createHash("sha256").update(source.trim()).digest("hex");
}

// Inline colours include canvas/model paints, printed output and CSS strings.
// Each retained line was reviewed by context; exact source fingerprints make
// the exception narrower than an entire game file or rendering function.
export function productionInlineInventory(root = process.cwd()) {
  const exceptions = JSON.parse(fs.readFileSync(path.join(root, "tools/interfacePaletteExceptions.json"), "utf8"));
  const approved = new Map(exceptions.map(entry => [`${entry.file}:${entry.fingerprint}`, entry.reason]));
  const rows = [];
  for (const file of collectProductionSources(root).filter(file => /\.[jt]sx?$/.test(file))) {
    let line = 0;
    for (const source of fs.readFileSync(path.join(root, file), "utf8").split("\n")) {
      line += 1;
      const colours = [...source.matchAll(COLOUR_LITERAL)].map(match => match[0]);
      colours.push(...[...source.matchAll(INLINE_NAMED_COLOUR)].map(match => match[1]));
      for (const colour of colours) {
        if (!isGreenInterfaceColour(colour)) continue;
        const fingerprint = inlineFingerprint(source);
        rows.push({ file, line, colour, fingerprint,
          exception: approved.get(`${file}:${fingerprint}`) || null });
      }
    }
  }
  return { rows, violations: rows.filter(row => !row.exception) };
}
