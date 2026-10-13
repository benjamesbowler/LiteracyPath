import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { teacherSimplicityLinuxPlan, requireLocalTeacherSimplicityEnvironment, runTeacherSimplicityLinuxGate, evidenceDirectory } from '../../tools/teacherSimplicityLinuxGate.mjs';

const environment = { VITE_SUPABASE_URL: 'http://127.0.0.1:54321', LP_AUDIT_SUPABASE_URL: 'http://127.0.0.1:54321',
  LP_AUDIT_DATABASE_URL: 'postgresql://audit:synthetic@127.0.0.1:54322/postgres', VITE_SUPABASE_ANON_KEY: 'synthetic',
  LP_AUDIT_SUPABASE_ANON_KEY: 'synthetic', LP_AUDIT_TEACHER_PASSWORD: 'synthetic-local-only', GITHUB_SHA: 'reviewed-commit' };

test('active workflow exposes the scoped runner without bypassing its local database or verify-only mode', () => {
  const workflow = fs.readFileSync(new URL('../../.github/workflows/refresh-visual-baselines.yml', import.meta.url), 'utf8');
  assert.match(workflow, /^ {10}- teacher-simplicity$/m);
  assert.match(workflow, /VERIFY_ONLY: \$\{\{ inputs\.verify_only \}\}/);
  assert.match(workflow, /node tools\/teacherSimplicityLinuxGate\.mjs --verify-only/);
  assert.match(workflow, /supabase db reset --local --no-seed/);
  assert.doesNotMatch(workflow.slice(workflow.indexOf('Install Supabase CLI'), workflow.indexOf('Refresh every reviewed Linux baseline')), /inputs\.scope != 'teacher-simplicity'/);
  assert.match(workflow, /Install pinned audio verification tools for the full unit suite[\s\S]*?tools\/installVerificationFfmpeg\.sh/);
  assert.match(workflow, /name: teacher-simplicity-linux-evidence-\$\{\{ github\.sha \}\}/);
});

test('verify-only never updates snapshots and every capture has a separate no-update comparison', () => {
  const refresh = teacherSimplicityLinuxPlan();
  const verify = teacherSimplicityLinuxPlan({ verifyOnly: true });
  assert.equal(refresh.filter(step => step.command.includes('--update-snapshots=all')).length, 6);
  assert.equal(verify.some(step => step.command.includes('--update-snapshots=all')), false);
  assert.deepEqual(verify.find(step => step.id === 'source-unit-sql').command, ['npm', 'test']);
  assert.deepEqual(verify.find(step => step.id === 'media-integrity').command, ['npm', 'run', 'verify:task', '--', 'image-integrity']);
  for (const step of refresh.filter(value => value.id.startsWith('capture-'))) {
    assert.ok(verify.find(value => value.id === step.id.replace('capture-', 'verify-'))?.command.includes('--update-snapshots=none'));
  }
  for (const step of verify.filter(value => value.command[0] === 'npx')) assert.ok(step.command.includes('--update-snapshots=none'));
  for (const name of ['teacher-simplicity', 'teacher-simplicity-depth', 'teacher-report-simplicity', 'teacher-session-simplicity', 'teacher-e2e', 'teacher-accessibility', 'teacher-assessment-history-evidence', 'literacy-practice-content-recovery', 'literacy-practice-media-recovery', 'reader-space-and-book-levels', 'book-cover-delivery']) {
    assert.ok(verify.some(step => step.command.includes(`tests/release/${name}.spec.js`)), `${name} must run`);
  }
  for (const step of refresh) for (const argument of step.command) {
    if (argument.startsWith('tests/')) assert.ok(fs.existsSync(new URL(`../../${argument}`, import.meta.url)), argument);
  }
});

test('teacher scope enables pinned normalization tools and exercises them before the full unit suite', () => {
  const workflow = fs.readFileSync(new URL('../../.github/workflows/refresh-visual-baselines.yml', import.meta.url), 'utf8');
  const install = workflow.slice(workflow.indexOf('      - name: Install pinned audio verification tools for the full unit suite'), workflow.indexOf('      - name: Verify teacher simplicity on isolated Linux services'));
  assert.match(install, /if: inputs\.scope == 'teacher-simplicity'/);
  assert.match(install, /apt-get install --yes --no-install-recommends pkg-config libmp3lame-dev/);
  assert.match(install, /LP_VERIFICATION_FFMPEG_FULL_UNIT=1 bash tools\/installVerificationFfmpeg\.sh/);
  assert.match(install, /name: Verify full-unit audio normalization capabilities[\s\S]*if: inputs\.scope == 'teacher-simplicity'[\s\S]*run: node --test tests\/unit\/assessmentLedaNormalization\.test\.js/);
  assert.equal((workflow.match(/LP_VERIFICATION_FFMPEG_FULL_UNIT=1/g) || []).length, 1);
  const installer = fs.readFileSync(new URL('../../tools/installVerificationFfmpeg.sh', import.meta.url), 'utf8');
  assert.match(installer, /task_ffmpeg_version=8\.1\.2/);
  assert.match(installer, /task_ffmpeg_sha256=464beb5e7bf0c311e68b45ae2f04e9cc2af88851abb4082231742a74d97b524c/);
  const fullUnitProfile = installer.match(/^ {2}1\)([\s\S]*?)^ {4};;/m)?.[1] || '';
  for (const capability of ['--enable-indev=lavfi', '--enable-libmp3lame', '--enable-encoder=libmp3lame', '--enable-muxer=mp3']) {
    assert.ok(fullUnitProfile.includes(capability), capability);
  }
  assert.match(fullUnitProfile, /--enable-filter=sine,volume,atrim,highpass,loudnorm,asetpts,afade,areverse,apad/);
  assert.match(installer, /--enable-muxer=null,pcm_s16le,pcm_f32le,wav/);
  assert.doesNotMatch(fullUnitProfile, /--enable-muxer=[^\n]*pcm_/);
  assert.match(installer, /--disable-network/);
});

test('pinned installer rejects invalid profiles and missing encoder dependencies before downloading', () => {
  const installer = fileURLToPath(new URL('../../tools/installVerificationFfmpeg.sh', import.meta.url));
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'teacher-ffmpeg-profile-'));
  try {
    for (const [mode, error] of [['invalid', /must be 0 or 1/], ['1', /requires pkg-config and libmp3lame development files/]]) {
      const result = spawnSync('/bin/bash', [installer, path.join(directory, 'unused-install')], {
        encoding: 'utf8', env: { ...process.env, PATH: directory, LP_VERIFICATION_FFMPEG_FULL_UNIT: mode }
      });
      assert.equal(result.status, 1);
      assert.match(result.stderr, error);
      assert.deepEqual(fs.readdirSync(directory), []);
    }
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('Linux gate rejects hosted endpoints and incomplete authentication before executing anything', () => {
  assert.doesNotThrow(() => requireLocalTeacherSimplicityEnvironment(environment, 'linux'));
  assert.throws(() => requireLocalTeacherSimplicityEnvironment(environment, 'darwin'), /actual Linux/);
  for (const name of ['VITE_SUPABASE_URL', 'LP_AUDIT_SUPABASE_URL', 'LP_AUDIT_DATABASE_URL']) {
    assert.throws(() => requireLocalTeacherSimplicityEnvironment({ ...environment, [name]: 'https://hosted.example' }, 'linux'), /hosted targets are prohibited/);
  }
  assert.throws(() => requireLocalTeacherSimplicityEnvironment({ ...environment, LP_AUDIT_TEACHER_PASSWORD: '' }, 'linux'), /required/);
  assert.throws(() => requireLocalTeacherSimplicityEnvironment({ ...environment, VITE_SUPABASE_URL: 'http://127.0.0.1:54331' }, 'linux'), /same local/);
});

test('runner uses isolated preview credentials, writes identity and stops on a failed comparison', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'teacher-simplicity-linux-'));
  const calls = [];
  try {
    const status = runTeacherSimplicityLinuxGate({ verifyOnly: true, environment, platform: 'linux', cwd,
      execute(command, args, options) {
        calls.push({ command, args, options });
        return { status: options.env.PLAYWRIGHT_JSON_OUTPUT_FILE?.endsWith('simplification.json') ? 9 : 0 };
      } });
    assert.equal(status, 9);
    const preview = calls.find(call => call.args.includes(`--output=${evidenceDirectory}/verify-roster-preview`));
    const authenticated = calls.find(call => call.args.includes(`--output=${evidenceDirectory}/verify-roster-authenticated`));
    assert.equal(preview.options.env.LP_AUDIT_TEACHER_PASSWORD, undefined);
    assert.equal(authenticated.options.env.LP_AUDIT_TEACHER_PASSWORD, environment.LP_AUDIT_TEACHER_PASSWORD);
    assert.ok(calls.every(call => call.options.env.LP_PLAYWRIGHT_REUSE_SERVER === '0'));
    assert.ok(calls.every(call => call.options.env.SUPABASE_URL === environment.LP_AUDIT_SUPABASE_URL));
    const manifest = JSON.parse(fs.readFileSync(path.join(cwd, evidenceDirectory, 'manifest.json'), 'utf8'));
    assert.equal(manifest.commit, environment.GITHUB_SHA); assert.equal(manifest.status, 'failed');
    assert.equal(manifest.steps.at(-1).id, 'simplification');
    assert.doesNotMatch(JSON.stringify(manifest), /synthetic-local-only|postgresql:/);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});
