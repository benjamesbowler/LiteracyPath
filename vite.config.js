import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

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
  plugins: [react(), bundleAnalysisPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/react') || id.includes('/node_modules/framer-motion') || id.includes('/node_modules/motion-')) {
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
            id.includes('/src/data/generated/hfwAssessmentQuestions.generated') ||
            id.includes('/src/data/generated/hfwLevel2Questions.generated') ||
            id.includes('/src/data/generated/hfwApprovedQuestionBank.generated')
          ) {
            return 'generated-hfw-banks'
          }
          if (
            id.includes('/src/data/generated/earlySkillQuestions.generated') ||
            id.includes('/src/data/generated/finalSounds.generated') ||
            id.includes('/src/data/generated/cvc.generated') ||
            id.includes('/src/data/generated/rhyming.generated') ||
            id.includes('/src/data/generated/shortVowel.generated')
          ) {
            return 'generated-early-skills'
          }
          if (
            id.includes('/src/data/generated/languageSkillQuestions.generated') ||
            id.includes('/src/data/generated/grammarAssessmentQuestions.generated') ||
            id.includes('/src/data/generated/secondBlockSkillTopUpQuestions.generated')
          ) {
            return 'generated-language-banks'
          }
          if (
            id.includes('/src/data/generated/skillLevelGapQuestions.generated') ||
            id.includes('/src/data/generated/blendsAssessmentQuestions.generated') ||
            id.includes('/src/data/generated/digraphsAssessmentQuestions.generated') ||
            id.includes('/src/data/generated/longVowelsAssessmentQuestions.generated') ||
            id.includes('/src/data/generated/vowelTeamsVarietyQuestions.generated') ||
            id.includes('/src/data/generated/firstTenSkillTopUpQuestions.generated')
          ) {
            return 'generated-assessment-banks'
          }
          if (
            id.includes('/src/data/generated/hfwCuratedSentences.generated') ||
            id.includes('/src/data/generated/skillWordBank.generated')
          ) {
            return 'generated-word-banks'
          }
          if (
            id.includes('/src/data/assessmentMedia') ||
            id.includes('/src/data/questionMediaResolver') ||
            id.includes('/src/data/generated/media')
          ) {
            return 'assessment-media-registry'
          }
          if (
            id.includes('/src/data/guidedReadingBooks') ||
            id.includes('/src/data/guidedReadingRegenBooks') ||
            id.includes('/src/data/guidedStoryBooks')
          ) {
            return 'guided-reading-data'
          }
          if (
            id.includes('/src/data/generatedQuestions') ||
            id.includes('/src/data/templateExpansion') ||
            id.includes('/src/data/questionBankExpansion8') ||
            id.includes('/src/data/templateComprehensionAdvanced')
          ) {
            return 'question-bank-extra'
          }
        }
      }
    }
  }
})
