import { access } from "node:fs/promises";
import path from "node:path";

import { symbolicateFrame } from "./lib/sourceMapSymbolication.mjs";

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

const mapsRoot = path.resolve(readArgument("--maps"));
const frame = readArgument("--frame");

if (!readArgument("--maps") || !frame) {
  throw new Error(
    "Usage: node tools/symbolicateFrame.mjs --maps <private-map-directory> "
    + "--frame <assets/file.js:line:column>"
  );
}

await access(mapsRoot);
const result = await symbolicateFrame({ mapsRoot, frame });
console.log(
  `${result.generatedFrame} -> ${result.source}:${result.line}:${result.column}`
  + (result.name ? ` (${result.name})` : "")
);
