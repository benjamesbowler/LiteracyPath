import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { cpSync, mkdirSync } from 'node:fs';
const root = fileURLToPath(new URL('.', import.meta.url));
const out = fileURLToPath(new URL('../../.artifacts/sound-seekers-chapter-build/', import.meta.url));
export default defineConfig({
  root, publicDir: false,
  plugins: [react(), { name: 'owned-chapter-assets', closeBundle() {
    mkdirSync(out + '/assets', { recursive: true });
    cpSync(root + '/assets', out + '/assets', { recursive: true });
  } }],
  server: { host: '127.0.0.1', port: 5201, strictPort: true },
  build: { outDir: out, emptyOutDir: true, chunkSizeWarningLimit: 1500,
    rollupOptions: { input: root + '/chapter.html' } },
});
