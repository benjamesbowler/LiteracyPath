import fs from 'node:fs'
import path from 'node:path'

// These image families use explicit WebP URLs in their runtime catalogues.
// Keep their PNG authoring originals in Git, but avoid storing both formats
// in every deployment. Do not apply this to dynamically named game sprites.
const imageRoots = [
  'guided-reading/pages',
  'guided-reading/covers',
  'guided-reading/regen',
  'images/child-mode'
]
const textExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.json', '.html', '.css'])

function filesUnder(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? filesUnder(file) : entry.isFile() ? [file] : []
  })
}

function imageReferences(text) {
  return text.match(/\/(?:guided-reading|images\/child-mode)\/[^\s"'`<>\\)]+?\.(?:png|webp)\b/g) || []
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
      const relativePublic = path.relative(outputDirectory, publicDirectory)
      if (!relativePublic || (!relativePublic.startsWith(`..${path.sep}`) && relativePublic !== '..')) {
        throw new Error('Image storage optimization requires output separate from source artwork')
      }

      // Require positive evidence that this build uses the WebP counterpart.
      const builtReferences = new Set(Object.values(bundle).flatMap(item =>
        imageReferences(item.type === 'chunk' ? item.code : String(item.source))))
      // Also preserve PNGs mentioned by source catalogues or public manifests,
      // even when their referencing module is not part of this particular build.
      const sourceReferences = new Set(['src', 'demos', 'public'].flatMap(directory =>
        filesUnder(path.join(config.root, directory))
          .filter(file => textExtensions.has(path.extname(file)))
          .flatMap(file => imageReferences(fs.readFileSync(file, 'utf8')))))

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
    }
  }
}
