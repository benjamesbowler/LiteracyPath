#!/usr/bin/env node
import process from "node:process";

import {
  batchDetails,
  buildContactSheet,
  createBatch,
  databasePath,
  generateBatch,
  installApproved,
  latestBatchId,
  openFactoryDatabase,
  planBatch,
  recheckBatchQa,
  setReviewDecision,
  startReviewServer,
  statusSummary,
  syncFactory,
} from "./guidedReadingImageFactoryLib.mjs";

function parseArgs(argv) {
  const positional = [];
  const options = {};
  for (let index = 0; index < argv.length; index++) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      positional.push(value);
      continue;
    }
    const key = value.slice(2).replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
    if (argv[index + 1] && !argv[index + 1].startsWith("--")) options[key] = argv[++index];
    else options[key] = true;
  }
  return { command: positional[0] || "status", positional: positional.slice(1), options };
}

function print(value) {
  console.log(JSON.stringify(value, null, 2));
}

function progress(event) {
  if (event.kind === "plan-start") console.log(`Planning book ${event.bookNumber}: ${event.title} (${event.pages} pages)`);
  if (event.kind === "plan-complete") console.log(`Planned book ${event.bookNumber} (${event.pages} pages)`);
  if (event.kind === "plan-skip") console.log(`Plan already current for book ${event.bookNumber}`);
  if (event.kind?.startsWith("plan-")) return;
  const label = `book ${event.job.book_number}, page ${event.job.page_number}`;
  if (event.kind === "start") console.log(`Generating ${label}`);
  if (event.kind === "complete") console.log(`Completed ${label} (QA ${event.qa})`);
  if (event.kind === "error") console.error(`Failed ${label}: ${event.error}`);
}

function resolveBatchId(db, options) {
  return options.batch || latestBatchId(db);
}

function parseJobIds(options) {
  return String(options.jobs || options.job || "")
    .split(",")
    .map(value => Number(value.trim()))
    .filter(Number.isInteger);
}

const { command, options } = parseArgs(process.argv.slice(2));
const db = openFactoryDatabase(options.database || databasePath);

try {
  if (command === "sync") {
    print(syncFactory(db));
  } else if (command === "status") {
    syncFactory(db);
    print(statusSummary(db));
  } else if (command === "queue") {
    syncFactory(db);
    const batch = createBatch(db, options);
    if (!batch) console.log("No pending pages are available to queue.");
    else print({ id: batch.id, state: batch.state, quality: batch.quality, jobs: batch.jobs.length });
  } else if (command === "generate") {
    syncFactory(db);
    const batchId = resolveBatchId(db, options);
    if (!batchId) throw new Error("No batch exists. Run the queue or batch command first.");
    if (!options.skipPlan) await planBatch(db, batchId, { model: options.plannerModel, onProgress: progress });
    const result = await generateBatch(db, batchId, { concurrency: options.concurrency, maxJobs: options.maxJobs, onProgress: progress });
    print({
      batch: batchId,
      generated: result.results.filter(item => item.ok).length,
      failed: result.results.filter(item => !item.ok).length,
      contactSheetPath: result.contactSheetPath,
    });
  } else if (command === "batch") {
    syncFactory(db);
    const batch = createBatch(db, options);
    if (!batch) {
      console.log("No pending pages are available to queue.");
    } else {
      console.log(`Queued ${batch.jobs.length} pages in ${batch.id} at ${batch.quality} quality.`);
      await planBatch(db, batch.id, { model: options.plannerModel, onProgress: progress });
      const result = await generateBatch(db, batch.id, { concurrency: options.concurrency, onProgress: progress });
      print({
        batch: batch.id,
        generated: result.results.filter(item => item.ok).length,
        failed: result.results.filter(item => !item.ok).length,
        contactSheetPath: result.contactSheetPath,
      });
    }
  } else if (command === "plan") {
    syncFactory(db);
    const batchId = resolveBatchId(db, options);
    if (!batchId) throw new Error("No batch exists. Run the queue or batch command first.");
    print(await planBatch(db, batchId, {
      model: options.plannerModel,
      bookNumber: options.book,
      maxBooks: options.maxBooks,
      force: options.force,
      onProgress: progress,
    }));
  } else if (command === "sheet") {
    const batchId = resolveBatchId(db, options);
    if (!batchId) throw new Error("No batch exists.");
    print({ batch: batchId, contactSheetPath: await buildContactSheet(db, batchId) });
  } else if (command === "recheck") {
    const batchId = resolveBatchId(db, options);
    if (!batchId) throw new Error("No batch exists.");
    print(await recheckBatchQa(db, batchId));
  } else if (["approve", "reject", "retry"].includes(command)) {
    const decision = command === "approve" ? "approved" : command === "reject" ? "rejected" : "retry";
    let jobIds = parseJobIds(options);
    if (options.all) {
      const batchId = resolveBatchId(db, options);
      if (!batchId) throw new Error("No batch exists.");
      const eligibleStates = decision === "approved" ? ["generated"] : ["generated", "approved", "rejected"];
      const placeholders = eligibleStates.map(() => "?").join(", ");
      jobIds = db.prepare(`
        SELECT id FROM jobs
        WHERE batch_id = ? AND state IN (${placeholders})
        ORDER BY book_number, page_number
      `).all(batchId, ...eligibleStates).map(row => row.id);
    }
    if (!jobIds.length) throw new Error(`Use --jobs 12,13,14 or --batch BATCH_ID --all with the ${command} command.`);
    print(jobIds.map(jobId => setReviewDecision(db, jobId, decision, options.notes || "")));
  } else if (command === "install") {
    const batchId = resolveBatchId(db, options);
    if (!batchId) throw new Error("No batch exists.");
    print(await installApproved(db, batchId));
  } else if (command === "review") {
    const batchId = resolveBatchId(db, options);
    if (!batchId) throw new Error("No batch exists.");
    const { server, url } = await startReviewServer(db, { batchId, port: options.port, host: options.host });
    console.log(`Guided-reading image review: ${url}`);
    const close = () => server.close(() => process.exit(0));
    process.on("SIGINT", close);
    process.on("SIGTERM", close);
    await new Promise(() => {});
  } else if (command === "show") {
    const batchId = resolveBatchId(db, options);
    if (!batchId) throw new Error("No batch exists.");
    print(batchDetails(db, batchId));
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
} finally {
  if (command !== "review") db.close();
}
