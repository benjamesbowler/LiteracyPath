import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { TraceMap, originalPositionFor } from "@jridgewell/trace-mapping";

const FRAME_PATTERN = /^((?:assets|src)\/[A-Za-z0-9._/-]+):([0-9]+):([0-9]+)$/;

async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(target));
    if (entry.isFile()) files.push(target);
  }
  return files;
}

function normalizeOriginalSource(source) {
  const normalized = String(source || "").replaceAll("\\", "/");
  const sourceIndex = normalized.lastIndexOf("/src/");
  if (sourceIndex >= 0) return normalized.slice(sourceIndex + 1);
  return normalized.replace(/^(\.\.\/)+/, "");
}

export function parseSanitizedFrame(frame) {
  const match = String(frame || "").match(FRAME_PATTERN);
  if (!match) {
    throw new Error(
      "Frame must use the retained assets/path.js:line:column format."
    );
  }
  return {
    assetPath: match[1],
    line: Number(match[2]),
    column: Number(match[3])
  };
}

export async function symbolicateFrame({ mapsRoot, frame }) {
  const parsed = parseSanitizedFrame(frame);
  const expectedSuffix = `${parsed.assetPath}.map`;
  const mapFiles = (await walkFiles(mapsRoot)).filter(file => file.endsWith(".map"));
  const mapPath = mapFiles.find(file => (
    file.replaceAll("\\", "/").endsWith(expectedSuffix)
  ));
  if (!mapPath) {
    throw new Error(`No private source map matches ${parsed.assetPath}.`);
  }

  const traceMap = new TraceMap(JSON.parse(await readFile(mapPath, "utf8")));
  const original = originalPositionFor(traceMap, {
    line: parsed.line,
    // Browser stack-frame columns are one-based; source-map generated columns
    // are zero-based.
    column: Math.max(0, parsed.column - 1)
  });
  if (!original.source || original.line == null || original.column == null) {
    throw new Error(`No original mapping exists for ${frame}.`);
  }

  return {
    generatedFrame: frame,
    source: normalizeOriginalSource(original.source),
    line: original.line,
    column: original.column + 1,
    name: original.name || null,
    mapPath
  };
}
