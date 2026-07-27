#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { summarizePilotDataset } from "./pilotData.mjs";

function parseArguments(argv) {
  const options = {
    input: "",
    output: "",
    minimumSubgroupSize: 5,
    overwrite: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--input") {
      options.input = argv[index + 1] || "";
      index += 1;
    } else if (argument === "--output") {
      options.output = argv[index + 1] || "";
      index += 1;
    } else if (argument === "--minimum-subgroup-size") {
      options.minimumSubgroupSize = Number(argv[index + 1]);
      index += 1;
    } else if (argument === "--overwrite") {
      options.overwrite = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (!options.input) throw new Error("--input is required");
  if (!options.output) throw new Error("--output is required");
  if (!Number.isInteger(options.minimumSubgroupSize) || options.minimumSubgroupSize < 5) {
    throw new Error("--minimum-subgroup-size must be an integer of at least 5");
  }
  return options;
}

export async function writePilotSummary({
  inputPath,
  outputPath,
  minimumSubgroupSize = 5,
  overwrite = false
}) {
  const resolvedInput = path.resolve(inputPath);
  const resolvedOutput = path.resolve(outputPath);
  const parsedOutput = path.parse(resolvedOutput);
  if (resolvedOutput === parsedOutput.root) {
    throw new Error("Refusing to use a filesystem root as the summary output");
  }
  if (!overwrite) {
    try {
      await fs.access(resolvedOutput);
      throw new Error("Refusing to overwrite an existing summary. Use a new path or pass --overwrite.");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  const dataset = JSON.parse(await fs.readFile(resolvedInput, "utf8"));
  const summary = summarizePilotDataset(dataset, { minimumSubgroupSize });
  await fs.mkdir(path.dirname(resolvedOutput), { recursive: true });
  await fs.writeFile(resolvedOutput, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  return {
    outputPath: resolvedOutput,
    summary
  };
}

async function main(argv) {
  const options = parseArguments(argv);
  const result = await writePilotSummary({
    inputPath: options.input,
    outputPath: options.output,
    minimumSubgroupSize: options.minimumSubgroupSize,
    overwrite: options.overwrite
  });
  console.log(`Descriptive pilot summary written: ${result.outputPath}`);
  console.log(`Child participants: ${result.summary.flow.childParticipants}`);
  console.log(`Minimum subgroup size: ${result.summary.provenance.minimumSubgroupSize}`);
  console.log("No causal, significance, mastery or automatic release claim was produced.");
}

const isMain = process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
