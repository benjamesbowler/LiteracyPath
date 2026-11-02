import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';

// Parse cat-file's size-delimited binary protocol without retaining blob bodies.
// The SHA is the raw file SHA256 used by media receipts, not Git's object ID.
export function createGitBlobHashParser(specs) {
  const hashes = new Map();
  let index = 0, state = 'header', header = Buffer.alloc(0), remaining = 0, digest;
  function write(chunk) {
    let offset = 0;
    while (offset < chunk.length) {
      if (state === 'header') {
        if (index >= specs.length) throw new Error('Unexpected extra git blob response');
        const end = chunk.indexOf(10, offset);
        const part = chunk.subarray(offset, end < 0 ? chunk.length : end);
        header = Buffer.concat([header, part]);
        if (header.length > 8192) throw new Error('Oversized git blob response header');
        offset = end < 0 ? chunk.length : end + 1;
        if (end < 0) continue;
        const match = /^([a-f0-9]{40}|[a-f0-9]{64}) blob (0|[1-9][0-9]*)$/.exec(header.toString('utf8'));
        if (!match || !Number.isSafeInteger(Number(match[2]))) throw new Error(`Missing or invalid git blob: ${specs[index]}`);
        remaining = Number(match[2]); header = Buffer.alloc(0);
        digest = createHash('sha256'); state = remaining ? 'body' : 'separator';
      } else if (state === 'body') {
        const size = Math.min(remaining, chunk.length - offset);
        digest.update(chunk.subarray(offset, offset + size));
        remaining -= size; offset += size;
        if (!remaining) state = 'separator';
      } else {
        if (chunk[offset++] !== 10) throw new Error('Invalid git blob separator');
        hashes.set(specs[index++], digest.digest('hex'));
        state = 'header';
      }
    }
  }
  return { write, finish() {
    if (index !== specs.length || state !== 'header' || header.length) throw new Error('Truncated git blob batch');
    return hashes;
  } };
}

export async function hashGitBlobs(root, requestedSpecs) {
  if (!Array.isArray(requestedSpecs) || requestedSpecs.some(spec => typeof spec !== 'string' || !spec || /[\r\n\0]/.test(spec))) throw new Error('Invalid git blob request');
  const specs = [...new Set(requestedSpecs)];
  if (!specs.length) return new Map();
  const parser = createGitBlobHashParser(specs);
  return new Promise((resolve, reject) => {
    const child = spawn('git', ['cat-file', '--batch'], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
    let error = null, stderr = '';
    child.on('error', value => { error ??= value; });
    child.stdin.on('error', value => { error ??= value; });
    child.stdout.on('data', chunk => {
      if (error) return;
      try { parser.write(chunk); } catch (value) { error = value; child.kill(); }
    });
    child.stderr.on('data', chunk => { stderr = (stderr + chunk.toString('utf8')).slice(-65536); });
    child.on('close', code => {
      if (error) return reject(error);
      if (code !== 0) return reject(new Error(`git cat-file failed (${code}): ${stderr.trim()}`));
      try { resolve(parser.finish()); } catch (value) { reject(value); }
    });
    child.stdin.end(specs.join('\n') + '\n');
  });
}
