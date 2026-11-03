import { MEDIA_ROOTS, SNAPSHOT_PATTERN } from '../../infra/shared-media/protocol.mjs';
import { getTransformedRoutes } from '@vercel/routing-utils';

export function sharedMediaSettings(env = process.env) {
  if (!env.SHARED_MEDIA_ORIGIN) return null;
  const origin = new URL(env.SHARED_MEDIA_ORIGIN);
  if (origin.protocol !== 'https:' || origin.username || origin.password
    || origin.pathname !== '/' || origin.search || origin.hash || origin.port
    || origin.hostname === 'localhost' || /^[\d.]+$/.test(origin.hostname)
    || origin.hostname.includes(':')) {
    throw new Error('SHARED_MEDIA_ORIGIN must be a public HTTPS origin without a path or credentials');
  }
  const snapshot = env.VERCEL_GIT_COMMIT_SHA || env.SHARED_MEDIA_SNAPSHOT;
  if (!SNAPSHOT_PATTERN.test(snapshot || '')) {
    throw new Error('Shared media requires the exact 40-character Git commit in VERCEL_GIT_COMMIT_SHA or SHARED_MEDIA_SNAPSHOT');
  }
  return { origin: origin.origin, snapshot };
}

export function sharedMediaVercelConfig(base, env = process.env) {
  const settings = sharedMediaSettings(env);
  if (!settings) return structuredClone(base);
  const { routes: originalRoutes, error } = getTransformedRoutes(structuredClone(base));
  if (error) throw new Error(`Invalid base Vercel routing: ${error.message}`);
  const mediaRoutes = MEDIA_ROOTS.map(root => ({
    src: `^/${root}/(.*)$`,
    dest: `${settings.origin}/v1/${settings.snapshot}/${root}/$1`,
    transforms: Object.entries({
      cookie: '', authorization: '', 'x-vercel-protection-bypass': '',
      'x-forwarded-for': '', 'x-real-ip': '', forwarded: '', 'true-client-ip': ''
    }).map(([key, value]) => ({ type: 'request.headers', op: 'set', target: { key }, args: value }))
  }));
  const config = structuredClone(base);
  for (const name of ['headers', 'rewrites', 'redirects', 'cleanUrls', 'trailingSlash']) delete config[name];
  const filesystem = (originalRoutes || []).findIndex(rule => rule.handle === 'filesystem');
  const split = filesystem < 0 ? (originalRoutes || []).length : filesystem;
  return {
    ...config,
    routes: [
      ...(originalRoutes || []).slice(0, split), ...mediaRoutes,
      ...(originalRoutes || []).slice(split)
    ]
  };
}
