#!/usr/bin/env node
import { timingSafeEqual } from "node:crypto";
import { createReadStream, lstatSync, realpathSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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

function isBelow(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return Boolean(relative) && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
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
  const shutdownToken = process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN || "";
  const server = createServer((request, response) => {
    if (request.url === "/.quest-offline-test/shutdown") {
      const suppliedHeader = request.headers["x-quest-offline-shutdown-token"];
      const supplied = typeof suppliedHeader === "string" ? suppliedHeader : "";
      const authorized = request.method === "POST"
        && /^[a-f0-9]{64}$/u.test(shutdownToken)
        && Buffer.byteLength(supplied) === Buffer.byteLength(shutdownToken)
        && timingSafeEqual(Buffer.from(supplied), Buffer.from(shutdownToken));
      if (!authorized) {
        response.writeHead(404);
        response.end();
        return;
      }
      response.writeHead(202, { "Cache-Control": "no-store", Connection: "close" });
      response.end(() => {
        server.close(error => {
          if (error) return;
          setTimeout(() => server.listen(server.addressInfo), 3_000);
        });
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
  return server;
}

async function main() {
  const args = process.argv.slice(2);
  const envIndex = args.indexOf("--root-env");
  const hostIndex = args.indexOf("--host");
  const portIndex = args.indexOf("--port");
  if (envIndex < 0 || hostIndex < 0 || portIndex < 0) throw new TypeError("--root-env, --host, and --port are required");
  const root = process.env[args[envIndex + 1]];
  const host = args[hostIndex + 1];
  const port = Number(args[portIndex + 1]);
  if (host !== "127.0.0.1" || !Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new TypeError("offline test server is loopback-only with a valid unprivileged port");
  }
  const server = createQuestOfflineRangeServer({ root, host, port });
  const shutdown = () => {
    const timer = setTimeout(() => process.exit(1), 10_000);
    timer.unref();
    server.close(error => process.exit(error ? 1 : 0));
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  server.on("error", error => {
    console.error(`Quest offline range server failed: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen({ host, port, exclusive: true }, () => {
    console.log(`Quest offline range server listening on http://${host}:${port}`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(`Quest offline range server failed: ${error.message}`);
    process.exitCode = 1;
  });
}
