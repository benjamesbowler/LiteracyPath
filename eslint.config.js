import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // src/vendor holds third-party builds (minified three.js). Linting a vendored
  // bundle reports thousands of errors in code we neither own nor edit, and
  // buries the ones that matter.
  globalIgnores(['dist', 'dist-quest-offline', 'dist-quest-update-*', '.artifacts/**', 'src/vendor/**', 'Phonics app extension/**', '_DELETE_ME_*/**', 'mockups/**']),
  {
    // Node, not the browser. Tests run under `node --test`, so they get
    // process/__dirname — linting them as browser code fails on `process`.
    // `.mjs` is in the glob because five quest gates and the screenshot tool
    // are .mjs files that were entirely unlinted for weeks (neither this
    // pattern nor the browser one matched them — a gate nobody lints is a
    // gate that drifts).
    files: ['tools/**/*.{js,mjs}', 'scripts/**/*.{js,mjs}', 'tests/**/*.{js,mjs}', '*.config.js', 'server.js'],
    extends: [
      js.configs.recommended,
    ],
    languageOptions: {
      // node AND browser: the Playwright gates embed page.evaluate(() => ...)
      // blocks that legitimately touch window/document from a node file.
      globals: { ...globals.node, ...globals.browser },
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
  },
  {
    files: ['**/*.{js,jsx,mjs}'],
    ignores: ['tools/**', 'scripts/**', 'tests/**', '*.config.js', 'server.js'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'react-refresh/only-export-components': ['error', {
        allowConstantExport: true,
        extraHOCs: ['lazyWithRetry'],
      }],
    },
  },
])
