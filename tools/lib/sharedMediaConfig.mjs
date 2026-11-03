import { COHORTS, MEDIA_ROOTS, validateRelease } from '../../infra/shared-media/protocol.mjs';
import { getTransformedRoutes } from '@vercel/routing-utils';

export function sharedMediaVercelConfig(base, release) {
  if (!validateRelease(release)) return structuredClone(base);
  const { routes: original, error } = getTransformedRoutes(structuredClone(base));
  if (error) throw new Error(`Invalid base Vercel routing: ${error.message}`);
  const patterns = [
    '^(/audio/production/en-US/isolated_word/.*)$',
    '^(/audio/production/en-US/(?:assessment_prompt|assessment_passage|instruction)/.*)$',
    '^(/audio/production/en-US/(?:guided_page|supplemental|story_page|comprehension)/.*)$',
    `^(/(?:${MEDIA_ROOTS.join('|')})/.*)$`
  ];
  const mediaRoutes = COHORTS.map((cohort, index) => ({
    src: patterns[index], dest: `${release.cohorts[cohort].origin}$1`,
    transforms: ['cookie', 'authorization', 'x-vercel-protection-bypass', 'x-forwarded-for', 'x-real-ip', 'forwarded', 'true-client-ip']
      .map(key => ({ type: 'request.headers', op: 'set', target: { key }, args: '' }))
  }));
  const config = structuredClone(base);
  for (const name of ['headers', 'rewrites', 'redirects', 'cleanUrls', 'trailingSlash']) delete config[name];
  const split = original.findIndex(rule => rule.handle === 'filesystem');
  if (split < 0) throw new Error('Shared media requires filesystem precedence');
  return { ...config, routes: [...original.slice(0, split + 1), ...mediaRoutes, ...original.slice(split + 1)] };
}
