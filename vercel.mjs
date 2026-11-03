import base from './config/vercel-base.json' with { type: 'json' };
import { sharedMediaVercelConfig } from './tools/lib/sharedMediaConfig.mjs';

// Vercel evaluates this once per deployment. The snapshot is immutable and
// deployment-specific, so a rollback never silently reads a newer media bank.
export const config = sharedMediaVercelConfig(base);
