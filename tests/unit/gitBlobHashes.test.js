import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createGitBlobHashParser, hashGitBlobs } from '../../tools/lib/gitBlobHashes.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const response = bytes => Buffer.concat([Buffer.from(`${'a'.repeat(40)} blob ${bytes.length}\n`), bytes, Buffer.from('\n')]);
test('batch parser hashes binary and empty bodies across arbitrary stream boundaries', () => {
  const binary = Buffer.from([0, 10, 13, 255, 0, 97, 10]);
  const parser = createGitBlobHashParser(['first', 'empty', 'same-body']);
  const stream = Buffer.concat([response(binary), response(Buffer.alloc(0)), response(binary)]);
  for (const byte of stream) parser.write(Buffer.from([byte]));
  assert.deepEqual([...parser.finish()], [['first', sha(binary)], ['empty', sha(Buffer.alloc(0))], ['same-body', sha(binary)]]);
});
for (const [label, bytes] of [
  ['truncated header', Buffer.from('a'.repeat(40) + ' blob 2')],
  ['truncated body', Buffer.from('a'.repeat(40) + ' blob 3\nab')],
  ['missing body separator', Buffer.from('a'.repeat(40) + ' blob 2\nab')],
  ['wrong separator', Buffer.from('a'.repeat(40) + ' blob 2\nabX')],
  ['missing path', Buffer.from('HEAD:missing.webp missing\n')],
  ['non-blob object', Buffer.from('a'.repeat(40) + ' tree 0\n\n')],
  ['unsafe size', Buffer.from('a'.repeat(40) + ' blob 9007199254740992\n')],
  ['extra object', Buffer.concat([response(Buffer.alloc(0)), response(Buffer.alloc(0))])]
]) test('batch parser rejects ' + label, () => {
  const parser = createGitBlobHashParser(['one']);
  assert.throws(() => { parser.write(bytes); parser.finish(); });
});
test('batch lookup preserves exact revision/path identity and matches git show raw-byte SHA', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lp-git-blob-test-'));
  const git = args => execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    git(['init', '-q']);
    fs.mkdirSync(path.join(root, 'public/images'), { recursive: true });
    fs.writeFileSync(path.join(root, 'public/images/a file.webp'), Buffer.from([0, 10, 255, 7]));
    fs.writeFileSync(path.join(root, 'public/images/other.webp'), 'different');
    git(['add', '.']);
    git(['-c', 'user.name=Blob test', '-c', 'user.email=blob-test@example.invalid', 'commit', '-qm', 'fixture']);
    const revision = git(['rev-parse', 'HEAD']).toString().trim();
    const specs = ['HEAD:public/images/a file.webp', `${revision}:public/images/a file.webp`, 'HEAD:public/images/other.webp'];
    const actual = await hashGitBlobs(root, [...specs, specs[0]]);
    assert.equal(actual.size, 3);
    for (const spec of specs) assert.equal(actual.get(spec), sha(git(['show', spec])));
    assert.notEqual(actual.get(specs[0]), actual.get(specs[2]));
    await assert.rejects(hashGitBlobs(root, ['HEAD:public/images/missing.webp']), /Missing or invalid git blob/);
    await assert.rejects(hashGitBlobs(root, [specs[0] + '\nHEAD:other']), /Invalid git blob request/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
