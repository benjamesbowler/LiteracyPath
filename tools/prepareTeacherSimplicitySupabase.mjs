import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestName = 'teacher-simplicity-stack.json';

function runIdentity(environment) {
  if (environment.GITHUB_ACTIONS !== 'true' || !/^\d+$/.test(environment.GITHUB_RUN_ID || '')
    || !/^\d+$/.test(environment.GITHUB_RUN_ATTEMPT || '') || !path.isAbsolute(environment.RUNNER_TEMP || '')) {
    throw new Error('A GitHub run identity and absolute runner temporary directory are required.');
  }
  return `lp-teacher-${environment.GITHUB_RUN_ID}-${environment.GITHUB_RUN_ATTEMPT}`;
}

export function configuredSupabasePorts(config) {
  const ports = [];
  let section = '';
  for (const line of config.split('\n')) {
    const heading = line.match(/^\s*\[([\w.]+)\]\s*(?:#.*)?$/);
    if (heading) section = heading[1];
    const entry = line.match(/^\s*([\w]*port)\s*=\s*(\d+)\s*(?:#.*)?$/);
    if (entry) ports.push(`${section}.${entry[1]}`);
  }
  for (const required of ['api.port', 'db.port', 'db.shadow_port']) {
    if (!ports.includes(required)) throw new Error(`The canonical audit config is missing ${required}.`);
  }
  if (new Set(ports).size !== ports.length) throw new Error('The audit config has duplicate port definitions.');
  return ports;
}

export async function reserveSupabasePorts(keys) {
  const reservations = [];
  const release = async () => { await Promise.all(reservations.map(({ server }) => new Promise(resolve => server.close(resolve)))); };
  try {
    for (const key of keys) {
      const server = net.createServer();
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen({ port: 0, host: '0.0.0.0', exclusive: true }, resolve);
      });
      reservations.push({ key, server, port: server.address().port });
    }
    return { ports: Object.fromEntries(reservations.map(({ key, port }) => [key, port])), release };
  } catch (error) { await release(); throw error; }
}

export function isolateSupabaseConfig(config, projectId, ports) {
  if (!/^lp-teacher-\d+-\d+$/.test(projectId)) throw new Error('Invalid isolated audit project identity.');
  const keys = configuredSupabasePorts(config);
  if (keys.some(key => !Number.isInteger(ports[key]) || ports[key] < 1024 || ports[key] > 65535)
    || new Set(keys.map(key => ports[key])).size !== keys.length) throw new Error('Every configured port needs a unique reserved port.');
  if ((config.match(/^project_id\s*=/gm) || []).length !== 1) throw new Error('Expected one local Supabase project_id.');
  let section = '';
  return config.split('\n').map(line => {
    const heading = line.match(/^\s*\[([\w.]+)\]\s*(?:#.*)?$/);
    if (heading) section = heading[1];
    if (/^project_id\s*=/.test(line)) return `project_id = "${projectId}"`;
    const entry = line.match(/^(\s*)([\w]*port)\s*=\s*\d+(\s*(?:#.*)?)$/);
    return entry ? `${entry[1]}${entry[2]} = ${ports[`${section}.${entry[2]}`]}${entry[3]}` : line;
  }).join('\n');
}

export async function prepareTeacherSimplicitySupabase({ environment = process.env, root = repositoryRoot,
  reserve = reserveSupabasePorts } = {}) {
  const projectId = runIdentity(environment);
  const config = fs.readFileSync(path.join(root, 'supabase/config.toml'), 'utf8');
  const reservation = await reserve(configuredSupabasePorts(config));
  try {
    const workdir = fs.mkdtempSync(path.join(environment.RUNNER_TEMP, `${projectId}-`));
    fs.mkdirSync(path.join(workdir, 'supabase'));
    fs.writeFileSync(path.join(workdir, 'supabase/config.toml'), isolateSupabaseConfig(config, projectId, reservation.ports));
    fs.cpSync(path.join(root, 'supabase/migrations'), path.join(workdir, 'supabase/migrations'), { recursive: true });
    const manifest = { projectId, workdir, runId: environment.GITHUB_RUN_ID, attempt: environment.GITHUB_RUN_ATTEMPT, ports: reservation.ports };
    fs.writeFileSync(path.join(workdir, manifestName), `${JSON.stringify(manifest, null, 2)}\n`);
    if (environment.GITHUB_ENV) {
      fs.appendFileSync(environment.GITHUB_ENV, `LP_TEACHER_CI_SUPABASE_WORKDIR=${workdir}\nLP_TEACHER_CI_SUPABASE_PROJECT_ID=${projectId}\n`);
    }
    const evidence = path.join(root, '.artifacts/teacher-simplicity-linux');
    fs.mkdirSync(evidence, { recursive: true });
    fs.writeFileSync(path.join(evidence, 'supabase-stack.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    return manifest;
  } finally {
    // Reservations coexist until all ports are chosen, then close immediately
    // before the workflow's next step starts this exact stack. No service is killed.
    await reservation.release();
  }
}

export function isolatedSupabaseStopArgs(environment) {
  const projectId = runIdentity(environment);
  const workdir = environment.LP_TEACHER_CI_SUPABASE_WORKDIR || '';
  if (environment.LP_TEACHER_CI_SUPABASE_PROJECT_ID !== projectId
    || path.dirname(workdir) !== environment.RUNNER_TEMP || !path.basename(workdir).startsWith(`${projectId}-`)) {
    throw new Error('Refusing to stop a Supabase project outside this run.');
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(workdir, manifestName), 'utf8'));
  if (manifest.projectId !== projectId || manifest.workdir !== workdir
    || manifest.runId !== environment.GITHUB_RUN_ID || manifest.attempt !== environment.GITHUB_RUN_ATTEMPT
    || fs.realpathSync(workdir) !== workdir) throw new Error('The isolated Supabase manifest does not match this run.');
  return ['stop', '--workdir', workdir, '--project-id', projectId, '--no-backup'];
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    if (process.argv.includes('--stop')) {
      const result = spawnSync('supabase', isolatedSupabaseStopArgs(process.env), { stdio: 'inherit', shell: false });
      process.exitCode = result.error || result.signal ? 1 : result.status;
    } else {
      const manifest = await prepareTeacherSimplicitySupabase();
      console.log(`Prepared isolated Supabase project ${manifest.projectId}; ${Object.keys(manifest.ports).length} free local ports.`);
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
