#!/usr/bin/env node
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { spawn } from "node:child_process";
import {
  createReadStream,
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPORARY_ROOT_PREFIX = "literacy-path-quest-offline-";
const TEMPORARY_ROOT_MARKER = ".quest-offline-test-root.json";
const TEMPORARY_ROOT_PURPOSE = "quest-offline-temporary-build-v1";
const TEMPORARY_ROOT_IDENTITIES = new WeakMap();
const MIME = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp"
});

function authorizedControlRequest(request) {
  const shutdownToken = process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN || "";
  const suppliedHeader = request.headers["x-quest-offline-shutdown-token"];
  const supplied = typeof suppliedHeader === "string" ? suppliedHeader : "";
  return request.method === "POST"
    && /^[a-f0-9]{64}$/u.test(shutdownToken)
    && Buffer.byteLength(supplied) === Buffer.byteLength(shutdownToken)
    && timingSafeEqual(Buffer.from(supplied), Buffer.from(shutdownToken));
}

function isBelow(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return Boolean(relative) && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

function fsyncPath(value) {
  const descriptor = openSync(value, "r");
  try { fsyncSync(descriptor); } finally { closeSync(descriptor); }
}

export function validateQuestOfflineRoot(value) {
  if (typeof value !== "string" || !path.isAbsolute(value)) {
    throw new TypeError("quest offline root must be an absolute path");
  }
  const resolved = path.resolve(value);
  const forbidden = [path.parse(resolved).root, os.homedir(), REPOSITORY_ROOT];
  if (forbidden.includes(resolved) || isBelow(REPOSITORY_ROOT, resolved) || isBelow(os.homedir(), resolved) && !isBelow(os.tmpdir(), resolved)) {
    throw new TypeError("quest offline root is an unsafe project, home, or filesystem location");
  }
  const stat = lstatSync(resolved);
  if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(resolved) !== resolved) {
    throw new TypeError("quest offline root must be one real non-symlink directory");
  }
  return resolved;
}

export function createQuestOfflineTemporaryBuildRoot() {
  const temporaryParent = realpathSync(os.tmpdir());
  const container = realpathSync(mkdtempSync(path.join(temporaryParent, TEMPORARY_ROOT_PREFIX)));
  const outputDir = path.join(container, "dist");
  mkdirSync(outputDir, { mode: 0o700 });
  const containerStat = lstatSync(container);
  const outputStat = lstatSync(outputDir);
  const ownershipToken = randomBytes(32);
  const ownershipDigest = createHash("sha256").update(ownershipToken).digest("hex");
  const markerPath = path.join(container, TEMPORARY_ROOT_MARKER);
  writeFileSync(markerPath, `${JSON.stringify({
    schemaVersion: 1,
    purpose: TEMPORARY_ROOT_PURPOSE,
    rootRealpath: container,
    device: containerStat.dev,
    inode: containerStat.ino,
    ownershipDigest
  })}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
  fsyncPath(markerPath);
  fsyncPath(container);
  const markerStat = lstatSync(markerPath);
  const handle = Object.freeze({ container, outputDir });
  TEMPORARY_ROOT_IDENTITIES.set(handle, Object.freeze({
    containerDevice: containerStat.dev,
    containerInode: containerStat.ino,
    outputDevice: outputStat.dev,
    outputInode: outputStat.ino,
    markerDevice: markerStat.dev,
    markerInode: markerStat.ino,
    ownershipDigest
  }));
  ownershipToken.fill(0);
  return handle;
}

export function validateQuestOfflineTemporaryBuildRoot(value) {
  if (!value || typeof value !== "object" || !TEMPORARY_ROOT_IDENTITIES.has(value)) {
    throw new TypeError("quest offline temporary build root requires its original ownership handle");
  }
  const identity = TEMPORARY_ROOT_IDENTITIES.get(value);
  const outputDir = validateQuestOfflineRoot(value.outputDir);
  const container = path.dirname(outputDir);
  const temporaryParent = realpathSync(os.tmpdir());
  if (value.container !== container
    || path.basename(outputDir) !== "dist"
    || path.dirname(container) !== temporaryParent
    || !path.basename(container).startsWith(TEMPORARY_ROOT_PREFIX)) {
    throw new TypeError("quest offline temporary build root is outside the marked OS-temp boundary");
  }
  const containerStat = lstatSync(container);
  const outputStat = lstatSync(outputDir);
  if (!containerStat.isDirectory() || containerStat.isSymbolicLink() || realpathSync(container) !== container
    || containerStat.dev !== identity.containerDevice || containerStat.ino !== identity.containerInode
    || outputStat.dev !== identity.outputDevice || outputStat.ino !== identity.outputInode) {
    throw new TypeError("quest offline temporary build directory identity changed");
  }
  const markerPath = path.join(container, TEMPORARY_ROOT_MARKER);
  const markerStat = lstatSync(markerPath);
  if (!markerStat.isFile() || markerStat.isSymbolicLink() || realpathSync(markerPath) !== markerPath
    || (markerStat.mode & 0o777) !== 0o600
    || markerStat.dev !== identity.markerDevice || markerStat.ino !== identity.markerInode
    || markerStat.uid !== containerStat.uid
    || typeof process.geteuid === "function" && markerStat.uid !== process.geteuid()) {
    throw new TypeError("quest offline temporary build marker is not a real file");
  }
  let marker;
  try {
    marker = JSON.parse(readFileSync(markerPath, "utf8"));
  } catch (error) {
    throw new TypeError("quest offline temporary build marker is malformed", { cause: error });
  }
  if (!marker || Object.keys(marker).join(",") !== "schemaVersion,purpose,rootRealpath,device,inode,ownershipDigest"
    || marker.schemaVersion !== 1 || marker.purpose !== TEMPORARY_ROOT_PURPOSE
    || marker.rootRealpath !== container
    || marker.device !== containerStat.dev || marker.inode !== containerStat.ino
    || marker.ownershipDigest !== identity.ownershipDigest) {
    throw new TypeError("quest offline temporary build marker is invalid");
  }
  return outputDir;
}

export function cleanupQuestOfflineTemporaryBuildRoot(value) {
  const outputDir = validateQuestOfflineTemporaryBuildRoot(value);
  const container = path.dirname(outputDir);
  rmSync(container, { recursive: true, force: false });
  if (existsSync(container)) throw new Error("quest offline temporary build cleanup did not complete");
  TEMPORARY_ROOT_IDENTITIES.delete(value);
}

export function parseSingleRange(header, size) {
  if (!Number.isSafeInteger(size) || size <= 0 || typeof header !== "string") {
    throw new RangeError("invalid byte range");
  }
  const match = /^bytes=(\d*)-(\d*)$/u.exec(header.trim());
  if (!match || (!match[1] && !match[2])) throw new RangeError("only one byte range is supported");
  let start;
  let end;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) throw new RangeError("invalid suffix range");
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) {
      throw new RangeError("unsatisfiable byte range");
    }
    end = Math.min(end, size - 1);
  }
  return Object.freeze({ start, end });
}

function requestFile(root, requestUrl) {
  const rawPath = new URL(requestUrl, "http://127.0.0.1").pathname;
  let pathname;
  try { pathname = decodeURIComponent(rawPath); } catch { throw new TypeError("malformed URL path"); }
  if (pathname.includes("\0") || pathname.split("/").includes("..")) throw new TypeError("path traversal rejected");
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const candidate = path.resolve(root, relative);
  if (!isBelow(root, candidate)) throw new TypeError("request path escapes offline root");
  let stat = null;
  let component = root;
  const segments = relative.split(path.sep);
  for (const [index, segment] of segments.entries()) {
    component = path.join(component, segment);
    stat = lstatSync(component);
    if (stat.isSymbolicLink()) throw new TypeError("request path contains a symlink");
    if (index < segments.length - 1 && !stat.isDirectory()) {
      throw new TypeError("request path component is not a directory");
    }
  }
  if (!stat?.isFile()) throw new TypeError("request target is not a regular file");
  const real = realpathSync(candidate);
  if (!isBelow(root, real)) throw new TypeError("request target resolves outside offline root");
  return { filePath: real, stat };
}

export function createQuestOfflineRangeServer({ root }) {
  const safeRoot = validateQuestOfflineRoot(root);
  const server = createServer((request, response) => {
    if (request.url === "/.quest-offline-test/shutdown") {
      if (!authorizedControlRequest(request)) {
        response.writeHead(404);
        response.end();
        return;
      }
      response.writeHead(202, { "Cache-Control": "no-store", Connection: "close" });
      response.end(() => {
        server.close();
      });
      return;
    }
    if (!request.method || !["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }
    let target;
    try {
      target = requestFile(safeRoot, request.url || "/");
    } catch {
      response.writeHead(404);
      response.end();
      return;
    }
    const headers = {
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
      "Content-Type": MIME[path.extname(target.filePath).toLocaleLowerCase("en-US")] || "application/octet-stream"
    };
    let status = 200;
    let start = 0;
    let end = target.stat.size - 1;
    if (request.headers.range) {
      try {
        ({ start, end } = parseSingleRange(request.headers.range, target.stat.size));
        status = 206;
        headers["Content-Range"] = `bytes ${start}-${end}/${target.stat.size}`;
      } catch {
        response.writeHead(416, { ...headers, "Content-Range": `bytes */${target.stat.size}`, "Content-Length": "0" });
        response.end();
        return;
      }
    }
    headers["Content-Length"] = String(end - start + 1);
    response.writeHead(status, headers);
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    const stream = createReadStream(target.filePath, { start, end });
    stream.on("error", () => response.destroy());
    stream.pipe(response);
  });
  server.addressInfo = null;
  server.on("listening", () => {
    const address = server.address();
    if (address && typeof address === "object") server.addressInfo = { host: address.address, port: address.port, exclusive: true };
  });
  server.restart = () => new Promise((resolve, reject) => {
    if (server.listening || !server.addressInfo) {
      reject(new Error("offline range listener is not in a restartable state"));
      return;
    }
    const onError = error => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(server.addressInfo);
  });
  return server;
}

export function createQuestOfflineControlServer({ assetServer }) {
  if (!assetServer || typeof assetServer.restart !== "function") {
    throw new TypeError("a restartable offline range server is required");
  }
  return createServer(async (request, response) => {
    if (request.url !== "/.quest-offline-test/restart" || !authorizedControlRequest(request)) {
      response.writeHead(404, { "Cache-Control": "no-store" });
      response.end();
      return;
    }
    try {
      await assetServer.restart();
      response.writeHead(202, { "Cache-Control": "no-store", Connection: "close" });
      response.end();
    } catch {
      response.writeHead(409, { "Cache-Control": "no-store", Connection: "close" });
      response.end();
    }
  });
}

function withTimeout(promise, milliseconds, label) {
  let timer = null;
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} exceeded ${milliseconds}ms`)), milliseconds);
      timer.unref?.();
    })
  ]).finally(() => clearTimeout(timer));
}

function observeChild(child) {
  let settled = false;
  const done = new Promise((resolve, reject) => {
    child.once("error", error => {
      settled = true;
      reject(error);
    });
    child.once("close", (code, signal) => {
      settled = true;
      resolve({ code: code ?? 1, signal });
    });
  });
  done.catch(() => {});
  return Object.freeze({ child, done, isSettled: () => settled });
}

async function terminateChild(childState, milliseconds = 10_000) {
  if (!childState || childState.isSettled()) return;
  childState.child.kill("SIGTERM");
  try {
    await withTimeout(childState.done, milliseconds, "quest offline build termination");
  } catch (error) {
    if (childState.isSettled()) throw error;
    childState.child.kill("SIGKILL");
    await withTimeout(childState.done, milliseconds, "quest offline forced build termination");
  }
}

function listen(listener, options) {
  return new Promise((resolve, reject) => {
    const onError = error => {
      listener.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      listener.off("error", onError);
      resolve();
    };
    listener.once("error", onError);
    listener.once("listening", onListening);
    try {
      listener.listen(options);
    } catch (error) {
      listener.off("error", onError);
      listener.off("listening", onListening);
      reject(error);
    }
  });
}

function closeListener(listener) {
  if (!listener?.listening) return Promise.resolve();
  return new Promise((resolve, reject) => {
    listener.close(error => error ? reject(error) : resolve());
  });
}

export async function runQuestOfflineRangeServerLifecycle(options, dependencies = {}) {
  const {
    temporaryBuild,
    root: externalRoot = null,
    host,
    port,
    controlPort,
    buildTimeoutMs = 120_000
  } = options || {};
  if (host !== "127.0.0.1" || !Number.isInteger(port) || port < 1024 || port > 65535
    || !Number.isInteger(controlPort) || controlPort < 1024 || controlPort > 65535 || controlPort === port) {
    throw new TypeError("offline test server is loopback-only with a valid unprivileged port");
  }
  if (typeof temporaryBuild !== "boolean" || !temporaryBuild && typeof externalRoot !== "string") {
    throw new TypeError("quest offline lifecycle requires a temporary build or external root");
  }
  if (!Number.isSafeInteger(buildTimeoutMs) || buildTimeoutMs <= 0) {
    throw new TypeError("quest offline build timeout must be a positive integer");
  }

  const processLike = dependencies.processLike || process;
  const createTemporary = dependencies.createTemporaryBuildRoot || createQuestOfflineTemporaryBuildRoot;
  const validateTemporary = dependencies.validateTemporaryBuildRoot || validateQuestOfflineTemporaryBuildRoot;
  const cleanupTemporary = dependencies.cleanupTemporaryBuildRoot || cleanupQuestOfflineTemporaryBuildRoot;
  const spawnProcess = dependencies.spawnProcess || spawn;
  const assertOfflineBuild = dependencies.assertOfflineBuild || (async outputDir => {
    const checker = await import("./checkQuestOffline.mjs");
    checker.assertQuestOfflineBuild({ outputDir });
  });
  const createRangeServer = dependencies.createRangeServer || createQuestOfflineRangeServer;
  const createControlServer = dependencies.createControlServer || createQuestOfflineControlServer;
  let temporary = null;
  let childState = null;
  let server = null;
  let controlServer = null;
  let shutdownRequested = false;
  let resolveShutdown;
  const shutdown = new Promise(resolve => {
    resolveShutdown = resolve;
  });
  const requestShutdown = () => {
    if (shutdownRequested) return;
    shutdownRequested = true;
    resolveShutdown();
  };
  processLike.once("SIGINT", requestShutdown);
  processLike.once("SIGTERM", requestShutdown);

  try {
    let root = externalRoot;
    if (temporaryBuild) {
      temporary = createTemporary();
      const child = spawnProcess("npm", [
        "run", "build:quest-offline-test", "--", "--outDir", temporary.outputDir
      ], { cwd: REPOSITORY_ROOT, env: { ...process.env }, stdio: "inherit" });
      childState = observeChild(child);
      const buildOutcome = await withTimeout(Promise.race([
        childState.done.then(result => ({ kind: "build", result })),
        shutdown.then(() => ({ kind: "shutdown" }))
      ]), buildTimeoutMs, "quest offline build");
      if (buildOutcome.kind === "shutdown") return;
      if (buildOutcome.result.code !== 0) {
        throw new Error(`quest offline temporary build failed with exit code ${buildOutcome.result.code}`);
      }
      root = validateTemporary(temporary);
      await assertOfflineBuild(root);
    }

    server = createRangeServer({ root });
    controlServer = createControlServer({ assetServer: server });
    const listenResults = await Promise.allSettled([
      listen(server, { host, port, exclusive: true }),
      listen(controlServer, { host, port: controlPort, exclusive: true })
    ]);
    const bindFailure = listenResults.find(result => result.status === "rejected");
    if (bindFailure) throw bindFailure.reason;
    console.log(`Quest offline control server listening on http://${host}:${controlPort}`);
    console.log(`Quest offline range server listening on http://${host}:${port}`);
    await dependencies.onReady?.({ server, controlServer });
    await shutdown;
  } finally {
    processLike.off("SIGINT", requestShutdown);
    processLike.off("SIGTERM", requestShutdown);
    try {
      await terminateChild(childState);
      await Promise.all([closeListener(server), closeListener(controlServer)]);
    } finally {
      if (temporary) cleanupTemporary(temporary);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const temporaryBuild = args.includes("--temporary-build");
  const envIndex = args.indexOf("--root-env");
  const hostIndex = args.indexOf("--host");
  const portIndex = args.indexOf("--port");
  if ((!temporaryBuild && envIndex < 0) || hostIndex < 0 || portIndex < 0) {
    throw new TypeError("--root-env or --temporary-build, plus --host and --port, are required");
  }
  const host = args[hostIndex + 1];
  const port = Number(args[portIndex + 1]);
  await runQuestOfflineRangeServerLifecycle({
    temporaryBuild,
    root: temporaryBuild ? null : process.env[args[envIndex + 1]],
    host,
    port,
    controlPort: Number(process.env.QUEST_OFFLINE_CONTROL_PORT || port + 2)
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(`Quest offline range server failed: ${error.message}`);
    process.exitCode = 1;
  });
}
