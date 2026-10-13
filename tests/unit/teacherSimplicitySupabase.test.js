import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { configuredSupabasePorts, reserveSupabasePorts, isolateSupabaseConfig, prepareTeacherSimplicitySupabase, isolatedSupabaseStopArgs } from '../../tools/prepareTeacherSimplicitySupabase.mjs';

const config = fs.readFileSync(new URL('../../supabase/config.toml', import.meta.url), 'utf8');
test('ephemeral config changes only project identity and every declared listener port', () => {
  assert.deepEqual(configuredSupabasePorts(config), ['api.port', 'db.port', 'db.shadow_port']);
  const expanded = `${config}\n[analytics]\nenabled = true\nport = 54327\n`;
  const keys = configuredSupabasePorts(expanded);
  const ports = Object.fromEntries(keys.map((key, index) => [key, 31001 + index]));
  const isolated = isolateSupabaseConfig(expanded, 'lp-teacher-123-2', ports);
  assert.match(isolated, /project_id = "lp-teacher-123-2"/);
  assert.match(isolated, /\[analytics\]\nenabled = true\nport = 31004/);
  const originalLines = expanded.split('\n');
  isolated.split('\n').forEach((line, index) => {
    if (line !== originalLines[index]) assert.match(line, /^(project_id|\w*port) = /);
  });
  assert.throws(() => isolateSupabaseConfig(config, 'literacy-path-audit', ports), /Invalid isolated/);
  assert.throws(() => isolateSupabaseConfig(config, 'lp-teacher-123-2', { ...ports, 'db.port': ports['api.port'] }), /unique reserved/);
});

test('OS port reservations coexist, avoid an occupied listener, and release without disturbing it', async () => {
  const existing = net.createServer();
  await new Promise((resolve, reject) => { existing.once('error', reject); existing.listen({ port: 0, host: '0.0.0.0' }, resolve); });
  try {
    const occupied = existing.address().port;
    const reservation = await reserveSupabasePorts(['api.port', 'db.port', 'db.shadow_port']);
    assert.equal(new Set(Object.values(reservation.ports)).size, 3);
    assert.equal(Object.values(reservation.ports).includes(occupied), false);
    assert.equal(existing.listening, true);
    await reservation.release();
    assert.equal(existing.listening, true, 'pre-existing services must never be stopped');
    const probe = net.createServer();
    await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen({ port: reservation.ports['db.port'], host: '0.0.0.0' }, resolve); });
    await new Promise(resolve => probe.close(resolve));
  } finally { await new Promise(resolve => existing.close(resolve)); }
});

test('preparation preserves canonical config and cleanup can target only this exact run project', async () => {
  const temporary = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'teacher-audit-isolation-')));
  const root = path.join(temporary, 'checkout');
  fs.mkdirSync(path.join(root, 'supabase/migrations'), { recursive: true });
  fs.writeFileSync(path.join(root, 'supabase/config.toml'), config);
  fs.writeFileSync(path.join(root, 'supabase/migrations/001.sql'), 'select 1;');
  const environment = { GITHUB_ACTIONS: 'true', GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '2', RUNNER_TEMP: temporary, GITHUB_ENV: path.join(temporary, 'github-env') };
  let released = false;
  try {
    const manifest = await prepareTeacherSimplicitySupabase({ environment, root, reserve: async keys => ({
      ports: Object.fromEntries(keys.map((key, index) => [key, 32001 + index])), release: async () => { released = true; }
    }) });
    assert.equal(released, true);
    assert.equal(fs.readFileSync(path.join(root, 'supabase/config.toml'), 'utf8'), config);
    assert.equal(fs.readFileSync(path.join(manifest.workdir, 'supabase/migrations/001.sql'), 'utf8'), 'select 1;');
    const scoped = { ...environment, LP_TEACHER_CI_SUPABASE_WORKDIR: manifest.workdir, LP_TEACHER_CI_SUPABASE_PROJECT_ID: manifest.projectId };
    assert.deepEqual(isolatedSupabaseStopArgs(scoped), ['stop', '--workdir', manifest.workdir, '--project-id', 'lp-teacher-123-2', '--no-backup']);
    assert.throws(() => isolatedSupabaseStopArgs({ ...scoped, LP_TEACHER_CI_SUPABASE_PROJECT_ID: 'literacy-path-audit' }), /outside this run/);
    assert.throws(() => isolatedSupabaseStopArgs({ ...scoped, GITHUB_RUN_ATTEMPT: '3' }), /outside this run/);
    assert.throws(() => isolatedSupabaseStopArgs({ ...scoped, LP_TEACHER_CI_SUPABASE_WORKDIR: root }), /outside this run/);
    assert.match(fs.readFileSync(environment.GITHUB_ENV, 'utf8'), /LP_TEACHER_CI_SUPABASE_PROJECT_ID=lp-teacher-123-2/);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});

test('workflow prepares before starting and routes start/reset/status/stop through the isolated workdir', () => {
  const workflow = fs.readFileSync(new URL('../../.github/workflows/refresh-visual-baselines.yml', import.meta.url), 'utf8');
  assert.ok(workflow.indexOf('Prepare unique teacher simplicity audit stack') < workflow.indexOf('Start and seed isolated audit database'));
  assert.match(workflow, /audit_supabase_args=\(--workdir "\$LP_TEACHER_CI_SUPABASE_WORKDIR"\)/);
  for (const command of ['start --exclude', 'db reset --local --no-seed', 'status -o env']) {
    assert.ok(workflow.split('\n').some(line => line.includes(`supabase ${command}`) && line.includes('"${audit_supabase_args[@]}"')));
  }
  assert.match(workflow, /Stop isolated teacher simplicity Supabase[\s\S]*?steps\.teacher-audit-stack\.outcome == 'success'[\s\S]*?prepareTeacherSimplicitySupabase\.mjs --stop/);
  assert.match(workflow, /Stop local Supabase\n\s*if: always\(\) && inputs\.scope != 'teacher-simplicity'/);
});
