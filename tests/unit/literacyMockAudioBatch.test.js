import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { listLiteracyMockAudioGaps } from '../../src/data/literacyMockItems.js';

const cwd = fileURLToPath(new URL('../..', import.meta.url));
const runner = 'tools/generateAssessmentLedaGaps.mjs';
const run = args => spawnSync(process.execPath, [runner, ...args], { cwd, encoding: 'utf8', timeout: 30000 });

test('mock audio dry run resolves only the authored mock gaps and never mutates the shared mapping', async () => {
  const mapping = `${cwd}/src/data/generated/assessmentLedaGaps.generated.js`;
  const before = fs.readFileSync(mapping, 'utf8');
  const gaps = await listLiteracyMockAudioGaps();
  const result = run(['--literacy-mock-only', '--dry-run', '--max-billable-characters=0']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`Assessment Leda gaps: ${gaps.length}; processing ${gaps.length}`));
  assert.match(result.stdout, /retry-inclusive cap: 0; no synthesis requests sent/);
  for (const gap of gaps) assert.ok(result.stdout.includes(gap.text));
  assert.equal(fs.readFileSync(mapping, 'utf8'), before);
});

test('mock audio work cannot accidentally broaden into a different generation scope', () => {
  for (const scope of ['--literacy-practice-only', '--literacy-teaching-only', '--progress-check-only', '--sentence-express-only', '--authored', '--skills=rhyming']) {
    const result = run(['--literacy-mock-only', '--dry-run', scope]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /cannot be combined with another content scope/);
  }
});

test('mock synthesis without an explicit retry-inclusive cap stops before processing files', () => {
  const result = run(['--literacy-mock-only']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires an explicit --max-billable-characters cap/);
  assert.doesNotMatch(result.stdout, /Submitted character budget|Generated \d/);
});
