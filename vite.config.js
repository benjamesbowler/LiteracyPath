import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { questOfflinePlugin } from './tools/viteQuestOfflinePlugin.mjs'

const releaseQuestPreview = process.env.QUEST_RELEASE_PREVIEW === 'true'
const offlineBuildVariant = process.env.QUEST_OFFLINE_BUILD_VARIANT || ''
const privateSourceMaps = process.env.LP_PRIVATE_SOURCE_MAPS === 'true'
const privateSourceMapOutputDirectory = (
  process.env.LP_PRIVATE_SOURCE_MAP_OUTPUT_DIR || 'dist'
)
const appReleaseId = (
  process.env.VITE_APP_RELEASE_ID
  || process.env.VERCEL_GIT_COMMIT_SHA
  || process.env.GITHUB_SHA
  || process.env.SOURCE_VERSION
  || 'local-unversioned'
).slice(0, 120)

function bundleAnalysisPlugin() {
  return {
    name: 'literacy-path-bundle-analysis',
    generateBundle(_, bundle) {
      const outputChunks = Object.values(bundle)
        .filter(item => item.type === 'chunk')
      const metadata = outputChunks
        .map(chunk => ({
          fileName: chunk.fileName,
          isEntry: chunk.isEntry,
          isDynamicEntry: chunk.isDynamicEntry
        }))
        .sort((a, b) => a.fileName.localeCompare(b.fileName))

      this.emitFile({
        type: 'asset',
        fileName: 'bundle-metadata.json',
        source: `${JSON.stringify({ chunks: metadata }, null, 2)}\n`
      })

      if (process.env.ANALYZE_BUNDLE !== 'true') return

      const chunks = outputChunks.map(chunk => {
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
  // Playwright writes HTML snapshots while a test is running. They are
  // evidence, not app entries: watching them reloads and erases live sessions.
  server: {
    watch: { ignored: ['**/.artifacts/**', '**/test-results/**', '**/playwright-report/**'] }
  },
  plugins: [react(), bundleAnalysisPlugin(), questOfflinePlugin({
    includeQuestPreview: releaseQuestPreview,
    buildVariant: offlineBuildVariant
  })],
  define: {
    global: 'globalThis',
    __APP_RELEASE_ID__: JSON.stringify(appReleaseId),
    'typeof CANVAS_RENDERER': 'true',
    'typeof WEBGL_RENDERER': 'false',
    'typeof WEBGL_DEBUG': 'false',
    'typeof FEATURE_SOUND': 'false'
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
          'typeof FEATURE_SOUND': 'false'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // The app targets evergreen browsers, so use ExcelJS's official
      // polyfill-free browser build. It is loaded only by export actions and
      // avoids shipping the library's legacy compatibility layer.
      'exceljs': fileURLToPath(new URL('./node_modules/exceljs/dist/exceljs.bare.min.js', import.meta.url)),
      phaser: fileURLToPath(new URL('./src/vendor/phaserSoundSeekers.cjs', import.meta.url))
    }
  },
  build: {
    // Source maps are generated only by the private verification/vault path.
    // `hidden` prevents production assets from advertising a public map URL.
    sourcemap: privateSourceMaps ? 'hidden' : false,
    outDir: privateSourceMaps ? privateSourceMapOutputDirectory : 'dist',
    emptyOutDir: true,
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
          if (
            id.includes('/node_modules/phaser/src/physics/') ||
            id.includes('/node_modules/phaser/src/geom/')
          ) {
            return 'vendor-phaser-physics'
          }
          if (
            id.includes('/node_modules/phaser/src/math/') ||
            id.includes('/node_modules/phaser/src/input/')
          ) {
            return 'vendor-phaser-input-numeric'
          }
          if (id.includes('/node_modules/phaser/src/gameobjects/components/')) {
            return 'vendor-phaser-gameobject-components'
          }
          if (
            id.includes('/node_modules/phaser/src/gameobjects/text/') ||
            id.includes('/node_modules/phaser/src/gameobjects/graphics/') ||
            id.includes('/node_modules/phaser/src/gameobjects/shape/')
          ) {
            return 'vendor-phaser-drawing'
          }
          if (id.includes('/node_modules/phaser/src/gameobjects/')) {
            return 'vendor-phaser-gameobjects'
          }
          if (
            id.includes('/node_modules/phaser/src/textures/') ||
            id.includes('/node_modules/phaser/src/renderer/') ||
            id.includes('/node_modules/phaser/src/display/') ||
            id.includes('/node_modules/phaser/src/filters/') ||
            id.includes('/node_modules/phaser/src/animations/')
          ) {
            return 'vendor-phaser-renderer'
          }
          if (
            id.includes('/node_modules/phaser/src/loader/') ||
            id.includes('/node_modules/phaser/src/cameras/') ||
            id.includes('/node_modules/phaser/src/tweens/') ||
            id.includes('/node_modules/phaser/src/time/')
          ) {
            return 'vendor-phaser-scene-motion'
          }
          if (id.includes('/node_modules/phaser/')) {
            return 'vendor-phaser-runtime'
          }
          if (id.includes('/src/data/vocabularyAudioPreferences')) {
            return 'child-assets-vocabulary-audio'
          }
          if (id.includes('/src/data/generated/k3VocabularyMediaManifest.generated')) {
            return 'child-assets-k3-media'
          }
          if (id.includes('/src/data/childWordMediaManifest')) {
            return 'child-word-media'
          }
          if (id.includes('/src/data/cleanAudioManifest')) {
            return 'child-assets-clean-audio'
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
          // These independent generated catalogues used to be hidden inside a
          // large shared assessmentMediaRegistry chunk. Keep their
          // real data boundaries separate so neither crosses the 250 kB
          // new-chunk ceiling and consumers still fetch them only with the
          // assessment media registry.
          if (id.includes('/src/data/generated/vocabularyRuntime.generated')) {
            return 'vocabulary-runtime'
          }
          if (id.includes('/src/data/generated/assessmentImageVariants.generated')) {
            return 'assessment-image-variants'
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
          if (id.includes('/src/data/firstFactsLevelABooks')) {
            return 'guided-reading-first-facts-a'
          }
          if (id.includes('/src/data/firstFactsActualLevelABooks')) {
            return 'guided-reading-first-facts-a-original'
          }
          if (id.includes('/src/data/firstFactsLevelCBooks')) {
            return 'guided-reading-first-facts-c'
          }
          if (id.includes('/src/data/moonwoodTalesBooks')) {
            return 'guided-reading-moonwood'
          }
          if (id.includes('/src/data/guidedReadingSeriesBooks')) {
            return 'guided-reading-series'
          }
          if (id.includes('/src/data/guidedReadingRegenBooks')) {
            return 'guided-reading-regen'
          }
          if (id.includes('/src/data/guidedStoryBooks')) {
            return 'guided-reading-stories'
          }
          if (id.includes('/src/data/generated/guidedReadingNarrationClearance.generated')) {
            return 'guided-reading-narration-clearance'
          }
          if (id.includes('/src/data/generated/guidedReadingLedaGaps.generated')) {
            return 'guided-reading-leda-gaps'
          }
          if (id.includes('/src/data/generated/guidedReadingNarrationProvenance.generated')) {
            return 'guided-reading-narration-provenance'
          }
          if (id.includes('/src/content/guidedReadingStoryBibleRewrites')) {
            return 'guided-reading-story-bible-rewrites'
          }
          if (id.includes('/src/content/guidedReadingHumanFictionRewrites')) {
            return 'guided-reading-human-fiction-rewrites'
          }
          if (id.includes('/src/content/guidedReadingWorldFictionRewrites')) {
            return 'guided-reading-world-fiction-rewrites'
          }
          if (id.includes('/src/data/guidedReadingBooks')) {
            return 'guided-reading-runtime'
          }
          // Keep the large Guided Reading catalogues independently cacheable.
          // The runtime combines them for product behavior, but a child should
          // not pay for every authored series when only one shelf or book is
          // being opened.
          if (id.includes('/src/data/guidedReadingWorldExpansionBooks')) {
            return 'guided-reading-world-expansion'
          }
        }
      }
    }
  }
})
