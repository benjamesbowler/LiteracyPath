import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { questOfflinePlugin } from './tools/viteQuestOfflinePlugin.mjs'

const releaseQuestPreview = process.env.QUEST_RELEASE_PREVIEW === 'true'
const offlineBuildVariant = process.env.QUEST_OFFLINE_BUILD_VARIANT || ''

function bundleAnalysisPlugin() {
  return {
    name: 'literacy-path-bundle-analysis',
    generateBundle(_, bundle) {
      if (process.env.ANALYZE_BUNDLE !== 'true') return

      const chunks = Object.values(bundle)
        .filter(item => item.type === 'chunk')
        .map(chunk => {
          const modules = Object.entries(chunk.modules || {})
            .map(([id, moduleInfo]) => ({
              id,
              renderedLength: moduleInfo.renderedLength || 0,
              originalLength: moduleInfo.originalLength || 0
            }))
            .sort((a, b) => b.renderedLength - a.renderedLength)

          return {
            fileName: chunk.fileName,
            isEntry: chunk.isEntry,
            isDynamicEntry: chunk.isDynamicEntry,
            imports: chunk.imports,
            dynamicImports: chunk.dynamicImports,
            renderedLength: modules.reduce((total, item) => total + item.renderedLength, 0),
            modules
          }
        })
        .sort((a, b) => b.renderedLength - a.renderedLength)

      this.emitFile({
        type: 'asset',
        fileName: 'bundle-analysis.json',
        source: `${JSON.stringify({ generatedAt: new Date().toISOString(), chunks }, null, 2)}\n`
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), bundleAnalysisPlugin(), questOfflinePlugin({
    includeQuestPreview: releaseQuestPreview,
    buildVariant: offlineBuildVariant
  })],
  define: {
    global: 'globalThis',
    'typeof CANVAS_RENDERER': 'true',
    'typeof WEBGL_RENDERER': 'false',
    'typeof WEBGL_DEBUG': 'false',
    'typeof FEATURE_SOUND': 'true'
  },
  optimizeDeps: {
    include: ['phaser'],
    rolldownOptions: {
      transform: {
        define: {
          global: 'globalThis',
          'typeof CANVAS_RENDERER': 'true',
          'typeof WEBGL_RENDERER': 'false',
          'typeof WEBGL_DEBUG': 'false',
          'typeof FEATURE_SOUND': 'true'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      phaser: fileURLToPath(new URL('./src/vendor/phaserSoundSeekers.cjs', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      ...(releaseQuestPreview ? {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          quest: fileURLToPath(new URL('./preview/quest.html', import.meta.url)),
          questEvidence: fileURLToPath(new URL('./preview/quest-evidence.html', import.meta.url))
        }
      } : {}),
      output: {
        manualChunks(id) {
          // Precise package matches: the old '/node_modules/react' prefix also
          // captured react-confetti (and any react-*), forcing lazy-only libs
          // into the boot-critical vendor chunk.
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/scheduler/') ||
            id.includes('/node_modules/framer-motion') ||
            id.includes('/node_modules/motion-')
          ) {
            return 'vendor-react'
          }
          if (id.includes('/node_modules/@supabase/')) {
            return 'vendor-supabase'
          }
          if (id.includes('/src/data/publicMediaInventory')) {
            return 'admin-media-inventory'
          }
          if (id.includes('/src/data/audioManifest')) {
            return 'audio-manifest'
          }
          if (
            id.includes('/node_modules/exceljs') ||
            id.includes('/node_modules/jszip') ||
            id.includes('/node_modules/file-saver')
          ) {
            return 'report-export-libs'
          }
          if (
            id.includes('/src/utils/answerOptions') ||
            id.includes('/src/utils/assessmentChoiceIntent') ||
            id.includes('/src/data/hfwAssessmentFormatConfig') ||
            id.includes('/src/data/highFrequencyWordBands')
          ) {
            return 'assessment-shared-utils'
          }
          if (
            id.includes('/src/content/initialSounds/initialSoundWordBank')
          ) {
            return 'initial-sound-word-bank'
          }
          // hfwAssessmentQuestions + hfwLevel2Questions are always co-imported
          // (both loaders trigger on any HFW band), so they stay one chunk.
          // hfwApprovedQuestionBank is deliberately NOT grouped here: runtime
          // only imports the slim hfwEligibilityKeys projection, so the full
          // approved bank should drop out of the bundle entirely.
          if (
            id.includes('/src/data/generated/hfwAssessmentQuestions.generated') ||
            id.includes('/src/data/generated/hfwLevel2Questions.generated')
          ) {
            return 'generated-hfw-banks'
          }
          if (
            id.includes('/src/data/blendPatternData') ||
            id.includes('/src/data/digraphPatternData') ||
            id.includes('/src/data/longVowelPatternData')
          ) {
            return 'assessment-pattern-data'
          }
          // The remaining generated question banks (early-skill split banks,
          // language/grammar banks, per-skill assessment banks) and the
          // hand-written expansion banks are each dynamic-imported separately
          // by loadAssessmentSkillBank with per-skill/per-family conditions,
          // so they intentionally have NO manualChunks grouping: rollup emits
          // one chunk per dynamic import and a skill only downloads its own.
          if (
            id.includes('/src/data/generated/hfwCuratedSentences.generated') ||
            id.includes('/src/data/generated/skillWordBank.generated')
          ) {
            return 'generated-word-banks'
          }
          if (
            id.includes('/src/data/guidedReadingBooks') ||
            id.includes('/src/data/guidedReadingRegenBooks') ||
            id.includes('/src/data/guidedStoryBooks')
          ) {
            return 'guided-reading-data'
          }
        }
      }
    }
  }
})
