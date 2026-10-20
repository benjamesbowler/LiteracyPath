import fs from 'node:fs'
import path from 'node:path'

// These image families use explicit WebP URLs in their runtime catalogues.
// Keep their PNG authoring originals in Git, but avoid storing both formats
// in every deployment. Do not apply this to dynamically named game sprites.
const imageRoots = [
  'guided-reading/pages',
  'guided-reading/covers',
  'guided-reading/regen',
  'images/child-mode',
  'images/emotions',
  'images/learn-games',
  'media/learn/images'
]
const textExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.json', '.html', '.css', '.sql'])

function filesUnder(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? filesUnder(file) : entry.isFile() ? [file] : []
  })
}

function imageReferences(text) {
  return text.match(/\/(?:guided-reading|images|media\/learn\/images)\/[^\s"'`<>\\)]+?\.(?:png|webp)\b/g) || []
}

// These generated recordings are resolved by complete URLs in the catalogues,
// including frozen assessment banks. Never prune dynamically named story audio.
const generatedRecording = /^audio\/production\/en-US\/(?:assessment_passage|assessment_prompt|guided_page|instruction|isolated_word|letter_name|report|story_page|supplemental)\/[^/]+-[a-f0-9]{10}\.mp3$/
function audioReferences(text) {
  return text.match(/\/audio\/production\/en-US\/[^\s"'`<>\\)]+?\.mp3\b/g) || []
}

export function publicImageStoragePlugin() {
  let config
  return {
    name: 'literacy-path-public-image-storage',
    apply: 'build',
    configResolved(resolved) { config = resolved },
    writeBundle(_, bundle) {
      if (!config.publicDir || config.build.copyPublicDir === false) return
      const outputDirectory = path.resolve(config.root, config.build.outDir)
      const publicDirectory = path.resolve(config.publicDir)
      const overlaps = (parent, child) => {
        const relative = path.relative(parent, child)
        return !relative || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
      }
      if (overlaps(outputDirectory, publicDirectory) || overlaps(publicDirectory, outputDirectory)) {
        throw new Error('Image storage optimization requires output separate from source artwork')
      }

      // Require positive evidence that this build uses the WebP counterpart.
      const builtReferences = new Set(Object.values(bundle).flatMap(item =>
        imageReferences(item.type === 'chunk' ? item.code : String(item.source))))
      // Also preserve PNGs mentioned by source catalogues or public manifests,
      // even when their referencing module is not part of this particular build.
      const sourceTexts = ['src', 'demos', 'public', 'supabase'].flatMap(directory =>
        filesUnder(path.join(config.root, directory))
          .filter(file => textExtensions.has(path.extname(file)))
          .map(file => fs.readFileSync(file, 'utf8')))
      const sourceReferences = new Set(sourceTexts.flatMap(imageReferences))

      let files = 0
      let bytes = 0
      for (const directory of imageRoots) {
        for (const original of filesUnder(path.join(publicDirectory, directory))) {
          if (!original.endsWith('.png')) continue
          const relative = path.relative(publicDirectory, original).split(path.sep).join('/')
          const webp = relative.replace(/\.png$/, '.webp')
          if (sourceReferences.has(`/${relative}`) || builtReferences.has(`/${relative}`) || !builtReferences.has(`/${webp}`)) continue
          const outputOriginal = path.join(outputDirectory, relative)
          if (!fs.existsSync(path.join(outputDirectory, webp)) || !fs.existsSync(outputOriginal)) continue
          bytes += fs.statSync(outputOriginal).size
          fs.unlinkSync(outputOriginal)
          files += 1
        }
      }
      config.logger.info(`[image-storage] Omitted ${files} duplicate PNG originals (${(bytes / 1e6).toFixed(1)} MB); source artwork retained.`)

      const usedRecordings = new Set([
        ...sourceTexts.flatMap(audioReferences),
        ...Object.values(bundle).flatMap(item => audioReferences(item.type === 'chunk' ? item.code : String(item.source)))
      ])
      let recordings = 0
      let recordingBytes = 0
      for (const original of filesUnder(path.join(publicDirectory, 'audio/production/en-US'))) {
        const relative = path.relative(publicDirectory, original).split(path.sep).join('/')
        if (!generatedRecording.test(relative) || usedRecordings.has(`/${relative}`)) continue
        const outputOriginal = path.join(outputDirectory, relative)
        if (!fs.existsSync(outputOriginal)) continue
        recordingBytes += fs.statSync(outputOriginal).size
        fs.unlinkSync(outputOriginal)
        recordings += 1
      }
      config.logger.info(`[audio-storage] Omitted ${recordings} uncatalogued generated recordings (${(recordingBytes / 1e6).toFixed(1)} MB); source recordings retained.`)
    }
  }
}
