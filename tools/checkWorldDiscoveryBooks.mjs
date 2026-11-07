#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateWorldDiscoveryCohortDrafts, validateRelease } from "./worldDiscoveryValidationLib.mjs";
export * from "./worldDiscoveryValidationLib.mjs";

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (!["--draft", "--release"].includes(args[0]) || args.slice(1).some(arg => arg !== "--complete")) {
    console.error("Usage: node tools/checkWorldDiscoveryBooks.mjs --draft|--release [--complete]");
    process.exitCode = 1;
  } else {
    const { checkRegisteredWorldDiscoveryCohorts } = await import("./registerWorldDiscoveryCohorts.mjs");
    const { entries } = await checkRegisteredWorldDiscoveryCohorts({ complete: args.includes("--complete") });
    const books = entries.flatMap(entry => entry.books);
    const result = validateWorldDiscoveryCohortDrafts(entries);
    if (args[0] === "--release" && !result.failures.length) {
      const reviews = Object.assign({}, ...entries.map(entry => entry.reviews));
      const released = await validateRelease(books, reviews, entries);
      result.failures.push(...released.failures);
      console.log(`Release media: ${released.images} image paths; ${released.audioFiles} audio paths. Structural/hash evidence only.`);
    }
    console.log(`World Discovery ${args[0].slice(2)}: ${books.length} books, ${books.reduce((sum, book) => sum + (book.pages?.length || 0), 0)} pages; ${result.failures.length} failures, ${result.warnings.length} repetition observations.`);
    for (const failure of result.failures) console.error(`- ${failure}`);
    for (const warning of result.warnings) console.log(`Note: ${warning}`);
    if (result.failures.length) process.exitCode = 1;
  }
}
