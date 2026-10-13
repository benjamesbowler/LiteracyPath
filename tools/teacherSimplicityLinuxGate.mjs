import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const evidenceDirectory = '.artifacts/teacher-simplicity-linux';
const browser = (id, files, { grep, preview = false, update = false } = {}) => ({
  id, preview,
  output: `${evidenceDirectory}/${id}`,
  report: `${evidenceDirectory}/${id}.json`,
  command: ['npx', 'playwright', 'test', ...files.map(file => `tests/release/${file}.spec.js`),
    ...(grep ? ['--grep', grep] : []), '--project=desktop', '--workers=1', '--max-failures=1',
    `--update-snapshots=${update ? 'all' : 'none'}`, '--reporter=line,json', `--output=${evidenceDirectory}/${id}`]
});
const seed = id => ({ id, command: ['npm', 'run', 'seed:audit-school'] });

export function teacherSimplicityLinuxPlan({ verifyOnly = false, authenticatedOnly = false } = {}) {
  const snapshots = [
    ['home-cards', ['student-home-card-states', 'student-home-hierarchy'], {}],
    ['home-routes', ['key-route-visuals'], { grep: '(Student Home|Guided Reading) matches' }],
    ['home-reading-devices', ['student-device-matrix'], { grep: 'A3\\.6 (student-home|reading-library) passes' }],
    ['home-emphasis', ['student-emphasis-budget'], { grep: 'student-home|reading-library' }],
    ['roster-authenticated', ['teacher-roster-device-matrix'], {}],
    ['roster-preview', ['teacher-roster-device-matrix'], { preview: true }]
  ];
  const plan = [
    { id: 'lint', command: ['npm', 'run', 'lint', '--', '--max-warnings=0'] },
    authenticatedOnly
      ? { id: 'gate-contract-units', command: ['node', '--test', 'tests/unit/teacherSimplicityLinuxGate.test.js', 'tests/unit/teacherSimplicitySupabase.test.js'] }
      : { id: 'source-unit-sql', command: ['npm', 'test'] },
    { id: 'database-boundaries', command: ['npm', 'run', 'verify:task', '--', 'supabase-local'] },
    ...(!authenticatedOnly ? [{ id: 'media-integrity', command: ['npm', 'run', 'verify:task', '--', 'image-integrity'] }] : []),
    { id: 'build', command: ['npm', 'run', 'build'] },
    { id: 'repo-hygiene', command: ['npm', 'run', 'check:repo-hygiene'] }
  ];
  if (!authenticatedOnly) {
    if (!verifyOnly) {
      plan.push(seed('seed-captures'));
      plan.push(...snapshots.map(([id, files, options]) => browser(`capture-${id}`, files, { ...options, update: true })));
    }
    // Comparison is a separate pass even after captures: missing images cannot
    // silently become accepted baselines during verification.
    plan.push(seed('seed-snapshot-verification'));
    plan.push(...snapshots.map(([id, files, options]) => browser(`verify-${id}`, files, options)));
    plan.push(browser('simplification', ['teacher-simplicity', 'teacher-simplicity-depth', 'teacher-report-simplicity', 'teacher-session-simplicity']));
    plan.push(browser('session-workflows', ['student-session-controls', 'teacher-workflow-focus', 'teacher-cycle-context', 'worksheet-cycle-context']));
    plan.push(browser('mock-protocol', ['literacy-mock']));
    plan.push(browser('practice-recovery', ['literacy-practice-content-recovery', 'literacy-practice-media-recovery']));
    plan.push(browser('reading-route-controls', ['key-route-visuals', 'student-device-matrix'], { grep: 'Reading Library|Guided Reading' }));
  }
  plan.push(browser('book-level-details', ['reader-space-and-book-levels'], { grep: 'children can browse|teachers can browse' }));
  if (!authenticatedOnly) plan.push(browser('book-cover-delivery', ['book-cover-delivery']));
  for (const [id, files] of [
    ['teacher-navigation-reports', ['teacher-dashboard-contracts']],
    ['teacher-e2e', ['teacher-e2e', 'el-assessment-route-and-final-review']],
    ['teacher-history-states', ['teacher-assessment-history-evidence']],
    ['teacher-retry-states', ['teacher-edge-workflows']],
    ['teacher-settings-history', ['teacher-settings-route-state']],
    ['teacher-accessibility', ['teacher-accessibility']]
  ]) {
    plan.push(seed(`seed-${id}`));
    plan.push(browser(id, files));
  }
  // A continuation collects every browser failure so one stale contract cannot
  // hide later groups. The full capture/verification plans remain fail-fast.
  return authenticatedOnly ? plan.map(step => step.report
    ? { ...step, command: step.command.map(argument => argument === '--max-failures=1' ? '--max-failures=0' : argument) }
    : step) : plan;
}

export function requireLocalTeacherSimplicityEnvironment(environment, platform = process.platform) {
  if (platform !== 'linux') throw new Error('This gate must capture and compare actual Linux rendering.');
  for (const name of ['VITE_SUPABASE_URL', 'LP_AUDIT_SUPABASE_URL', 'LP_AUDIT_DATABASE_URL']) {
    let target;
    try { target = new URL(environment[name]); } catch { throw new Error(`${name} must identify the isolated local audit service.`); }
    if (target.hostname !== '127.0.0.1') throw new Error(`${name} must use 127.0.0.1; hosted targets are prohibited.`);
  }
  if (environment.VITE_SUPABASE_URL.replace(/\/$/, '') !== environment.LP_AUDIT_SUPABASE_URL.replace(/\/$/, '')) {
    throw new Error('The application and audit client must use the same local Supabase URL.');
  }
  for (const name of ['VITE_SUPABASE_ANON_KEY', 'LP_AUDIT_SUPABASE_ANON_KEY', 'LP_AUDIT_TEACHER_PASSWORD']) {
    if (!environment[name]) throw new Error(`${name} is required for authenticated local tests.`);
  }
}

export function runTeacherSimplicityLinuxGate({ verifyOnly = false, authenticatedOnly = false, environment = process.env,
  platform = process.platform, cwd = root, execute = spawnSync } = {}) {
  requireLocalTeacherSimplicityEnvironment(environment, platform);
  const evidenceRoot = path.join(cwd, evidenceDirectory);
  fs.mkdirSync(evidenceRoot, { recursive: true });
  const manifest = { schemaVersion: 2, commit: environment.GITHUB_SHA || '', platform,
    mode: authenticatedOnly ? 'authenticated-continuation' : verifyOnly ? 'verify-only' : 'refresh-and-verify',
    authenticatedOnly, verifyOnly, fullGatePassed: false,
    evidenceScope: authenticatedOnly
      ? 'Authenticated continuation subset and book-details follow-up only. Join with separately recorded prefix evidence; this is not a full gate or new baseline capture pass.'
      : 'Complete planned teacher simplicity Linux gate.',
    startedAt: new Date().toISOString(), status: 'running', steps: [] };
  const writeManifest = () => fs.writeFileSync(path.join(evidenceRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  writeManifest();
  let firstFailureStatus = 0;
  for (const step of teacherSimplicityLinuxPlan({ verifyOnly, authenticatedOnly })) {
    const stepEnvironment = { ...environment, CI: 'true', LP_PLAYWRIGHT_PORT: '4174', LP_PLAYWRIGHT_REUSE_SERVER: '0',
      SUPABASE_URL: environment.LP_AUDIT_SUPABASE_URL, DATABASE_URL: environment.LP_AUDIT_DATABASE_URL,
      SUPABASE_DB_URL: environment.LP_AUDIT_DATABASE_URL };
    delete stepEnvironment.LP_AUDIT_ALLOW_REMOTE_TEST_PROJECT;
    delete stepEnvironment.SUPABASE_ACCESS_TOKEN;
    delete stepEnvironment.SUPABASE_SERVICE_ROLE_KEY;
    if (step.preview) delete stepEnvironment.LP_AUDIT_TEACHER_PASSWORD;
    if (step.report) stepEnvironment.PLAYWRIGHT_JSON_OUTPUT_FILE = path.join(cwd, step.report);
    console.log(`Teacher simplicity Linux ${authenticatedOnly ? 'authenticated continuation' : 'gate'}: ${step.id}`);
    const started = Date.now();
    const result = execute(step.command[0], step.command.slice(1), { cwd, env: stepEnvironment, stdio: 'inherit', shell: false });
    const passed = !result.error && !result.signal && result.status === 0;
    const failureStatus = Number.isInteger(result.status) && result.status > 0 ? result.status : 1;
    if (!passed && !firstFailureStatus) firstFailureStatus = failureStatus;
    const failure = !passed && authenticatedOnly ? {
      exitCode: Number.isInteger(result.status) ? result.status : null,
      signal: result.signal || null,
      // Keep launch diagnostics without copying arbitrary process error text or
      // environment values into evidence. Browser assertion details remain in
      // the step's retained Playwright report and inherited command output.
      ...(result.error ? { error: { name: result.error.name || 'Error', code: result.error.code || null } } : {})
    } : {};
    manifest.steps.push({ ...step, status: passed ? 'passed' : 'failed', durationMs: Date.now() - started, ...failure });
    manifest.status = firstFailureStatus ? 'failed' : 'running';
    writeManifest();
    if (!passed && (!authenticatedOnly || !step.report)) {
      // A failed prerequisite or seed makes later browser evidence unsafe or
      // uninterpretable, even if an earlier browser group also failed.
      manifest.finishedAt = new Date().toISOString(); writeManifest();
      return failureStatus;
    }
  }
  manifest.status = firstFailureStatus ? 'failed' : 'passed';
  manifest.fullGatePassed = !authenticatedOnly && !firstFailureStatus;
  manifest.finishedAt = new Date().toISOString(); writeManifest();
  return firstFailureStatus;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const options = { verifyOnly: process.argv.includes('--verify-only'), authenticatedOnly: process.argv.includes('--authenticated-only') };
  if (process.argv.includes('--plan')) console.log(JSON.stringify(teacherSimplicityLinuxPlan(options), null, 2));
  else {
    try { process.exitCode = runTeacherSimplicityLinuxGate(options); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}
