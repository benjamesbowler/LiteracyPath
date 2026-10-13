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

function workflowStep(workflow, name) {
  const marker = `      - name: ${name}\n`;
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, name);
  const end = workflow.indexOf('\n      - ', start + marker.length);
  return workflow.slice(start, end < 0 ? undefined : end);
}

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

test('authenticated continuation selects only its declared subset and freshly seeds all six authenticated groups', () => {
  const plan = teacherSimplicityLinuxPlan({ authenticatedOnly: true });
  const authenticatedGroups = ['teacher-navigation-reports', 'teacher-e2e', 'teacher-history-states',
    'teacher-retry-states', 'teacher-settings-history', 'teacher-accessibility'];
  assert.deepEqual(plan.map(step => step.id), [
    'lint', 'gate-contract-units', 'database-boundaries', 'build', 'repo-hygiene', 'book-level-details',
    ...authenticatedGroups.flatMap(id => [`seed-${id}`, id])
  ]);
  assert.deepEqual(plan.find(step => step.id === 'gate-contract-units').command, [
    'node', '--test', 'tests/unit/teacherSimplicityLinuxGate.test.js', 'tests/unit/teacherSimplicitySupabase.test.js'
  ]);
  assert.deepEqual(plan.find(step => step.id === 'database-boundaries').command, ['npm', 'run', 'verify:task', '--', 'supabase-local']);
  const details = plan.find(step => step.id === 'book-level-details');
  assert.ok(details.command.includes('tests/release/reader-space-and-book-levels.spec.js'));
  assert.equal(details.command[details.command.indexOf('--grep') + 1], 'children can browse|teachers can browse');
  const full = teacherSimplicityLinuxPlan();
  for (const id of authenticatedGroups) {
    const index = plan.findIndex(step => step.id === id);
    assert.deepEqual(plan[index - 1].command, ['npm', 'run', 'seed:audit-school']);
    assert.deepEqual(plan[index], full.find(step => step.id === id), `${id} must retain every existing authenticated assertion`);
  }
  assert.equal(plan.filter(step => step.command[0] === 'npx').length, 7);
  for (const step of plan.filter(step => step.command[0] === 'npx')) {
    assert.ok(step.command.includes('--update-snapshots=none'));
    assert.equal(step.preview, false);
  }
  assert.equal(plan.some(step => step.command.includes('--update-snapshots=all')), false);
  assert.deepEqual(teacherSimplicityLinuxPlan({ authenticatedOnly: true, verifyOnly: true }), plan);
  assert.deepEqual(teacherSimplicityLinuxPlan({ authenticatedOnly: false }), full);
  assert.equal(full.filter(step => step.command.includes('--update-snapshots=all')).length, 6);
  assert.deepEqual(full.find(step => step.id === 'source-unit-sql').command, ['npm', 'test']);
});

test('workflow continuation is explicit, cannot publish baselines, and retains isolated SQL lifecycle', () => {
  const workflow = fs.readFileSync(new URL('../../.github/workflows/refresh-visual-baselines.yml', import.meta.url), 'utf8');
  assert.match(workflow, /teacher_authenticated_only:\n {8}description: [^\n]+\n {8}required: false\n {8}default: false\n {8}type: boolean/);
  const guard = workflowStep(workflow, 'Reject teacher continuation outside its scope');
  assert.match(guard, /if: inputs\.teacher_authenticated_only && inputs\.scope != 'teacher-simplicity'/);
  assert.match(guard, /exit 1/);
  assert.ok(workflow.indexOf(guard) < workflow.indexOf('      - run: npm ci'));
  for (const name of ['Install pinned audio verification tools for the full unit suite', 'Verify full-unit audio normalization capabilities']) {
    assert.match(workflowStep(workflow, name), /if: inputs\.scope == 'teacher-simplicity' && !inputs\.teacher_authenticated_only/);
  }
  assert.match(workflowStep(workflow, 'Upload approved Linux baselines'), /if: success\(\) && \(inputs\.scope != 'teacher-simplicity' \|\| !inputs\.teacher_authenticated_only\)/);
  assert.match(workflowStep(workflow, 'Upload teacher simplicity Linux evidence'), /if: always\(\) && inputs\.scope == 'teacher-simplicity'/);
  for (const name of ['Prepare unique teacher simplicity audit stack', 'Start and seed isolated audit database',
    'Seed deterministic audit school', 'Stop isolated teacher simplicity Supabase']) {
    assert.doesNotMatch(workflowStep(workflow, name), /teacher_authenticated_only/, `${name} must remain active in continuation`);
  }
  assert.match(workflowStep(workflow, 'Start and seed isolated audit database'), /supabase db reset --local --no-seed "\$\{audit_supabase_args\[@\]\}"/);
  assert.match(workflowStep(workflow, 'Stop isolated teacher simplicity Supabase'), /always\(\)[\s\S]*steps\.teacher-audit-stack\.outcome == 'success'[\s\S]*prepareTeacherSimplicitySupabase\.mjs --stop/);
});

test('workflow dispatch and CLI choose continuation only after explicit opt-in', () => {
  const workflow = fs.readFileSync(new URL('../../.github/workflows/refresh-visual-baselines.yml', import.meta.url), 'utf8');
  const step = workflowStep(workflow, 'Verify teacher simplicity on isolated Linux services');
  assert.match(step, /TEACHER_AUTHENTICATED_ONLY: \$\{\{ inputs\.teacher_authenticated_only \}\}/);
  const script = step.slice(step.indexOf('        run: |\n') + '        run: |\n'.length).split('\n').map(line => line.replace(/^ {10}/, '')).join('\n');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'teacher-continuation-dispatch-'));
  try {
    const recorded = path.join(directory, 'command.jsonl');
    fs.writeFileSync(path.join(directory, 'node'), '#!/bin/sh\nprintf "%s\\n" "$@" > "$LP_GATE_COMMAND_LOG"\n', { mode: 0o755 });
    for (const [authenticatedOnly, verifyOnly, expected] of [
      ['false', 'false', []], ['false', 'true', ['--verify-only']],
      ['true', 'false', ['--authenticated-only']], ['true', 'true', ['--authenticated-only']],
      ['', 'false', []]
    ]) {
      const result = spawnSync('/bin/bash', ['-c', script], { encoding: 'utf8', env: {
        ...process.env, PATH: directory, LP_GATE_COMMAND_LOG: recorded,
        TEACHER_AUTHENTICATED_ONLY: authenticatedOnly, VERIFY_ONLY: verifyOnly
      } });
      assert.equal(result.status, 0, result.stderr);
      assert.deepEqual(fs.readFileSync(recorded, 'utf8').trim().split('\n'), ['tools/teacherSimplicityLinuxGate.mjs', ...expected]);
    }
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../../tools/teacherSimplicityLinuxGate.mjs', import.meta.url)), '--plan', '--authenticated-only'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), teacherSimplicityLinuxPlan({ authenticatedOnly: true }));
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

test('continuation keeps authentication and local-only execution while clearly recording subset success or failure', () => {
  for (const failureId of [null, 'teacher-retry-states']) {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'teacher-continuation-run-'));
    const calls = [];
    try {
      const status = runTeacherSimplicityLinuxGate({ authenticatedOnly: true, platform: 'linux', cwd,
        environment: { ...environment, LP_AUDIT_ALLOW_REMOTE_TEST_PROJECT: '1', SUPABASE_ACCESS_TOKEN: 'never-forward-token',
          SUPABASE_SERVICE_ROLE_KEY: 'never-forward-service-role', SUPABASE_URL: 'https://hosted.example', DATABASE_URL: 'postgresql://hosted.example/database' },
        execute(command, args, options) {
          calls.push({ command, args, options });
          return { status: failureId && options.env.PLAYWRIGHT_JSON_OUTPUT_FILE?.endsWith(`/${failureId}.json`) ? 8 : 0 };
        }
      });
      assert.equal(status, failureId ? 8 : 0);
      for (const { options } of calls) {
        assert.equal(options.env.LP_AUDIT_TEACHER_PASSWORD, environment.LP_AUDIT_TEACHER_PASSWORD);
        assert.equal(options.env.SUPABASE_URL, environment.LP_AUDIT_SUPABASE_URL);
        assert.equal(options.env.DATABASE_URL, environment.LP_AUDIT_DATABASE_URL);
        assert.equal(options.env.SUPABASE_DB_URL, environment.LP_AUDIT_DATABASE_URL);
        assert.equal(options.env.LP_PLAYWRIGHT_REUSE_SERVER, '0');
        for (const secret of ['LP_AUDIT_ALLOW_REMOTE_TEST_PROJECT', 'SUPABASE_ACCESS_TOKEN', 'SUPABASE_SERVICE_ROLE_KEY']) assert.equal(options.env[secret], undefined);
        assert.equal(options.shell, false);
      }
      const manifest = JSON.parse(fs.readFileSync(path.join(cwd, evidenceDirectory, 'manifest.json'), 'utf8'));
      assert.equal(manifest.mode, 'authenticated-continuation');
      assert.equal(manifest.authenticatedOnly, true);
      assert.equal(manifest.fullGatePassed, false);
      assert.equal(manifest.status, failureId ? 'failed' : 'passed');
      assert.equal(manifest.steps.at(-1).id, failureId || 'teacher-accessibility');
      assert.match(manifest.evidenceScope, /not a full gate or new baseline capture pass/);
      assert.doesNotMatch(JSON.stringify(manifest), /synthetic-local-only|postgresql:|never-forward|hosted\.example/);
    } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
  }
});

test('continuation rejects a hosted audit target before running any command or writing evidence', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'teacher-continuation-host-'));
  try {
    assert.throws(() => runTeacherSimplicityLinuxGate({ authenticatedOnly: true, platform: 'linux', cwd,
      environment: { ...environment, LP_AUDIT_SUPABASE_URL: 'https://hosted.example' },
      execute() { assert.fail('No command may execute against a hosted target'); }
    }), /hosted targets are prohibited/);
    assert.deepEqual(fs.readdirSync(cwd), []);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});
