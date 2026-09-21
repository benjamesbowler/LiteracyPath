import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { publicImageStoragePlugin } from '../../tools/vitePublicImageStoragePlugin.mjs'

test('build omits only unused authoring duplicates with a shipped WebP used by the bundle', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lp-image-storage-'))
  try {
    const write = (relative, value = 'image bytes') => {
      const file = path.join(root, relative)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, value)
    }
    const images = ['optimized', 'referenced', 'manifest', 'built-only', 'dynamic', 'missing-webp']
    for (const name of images) {
      for (const directory of ['public', 'dist']) {
        write(`${directory}/guided-reading/pages/${name}.png`)
        if (name !== 'missing-webp') write(`${directory}/guided-reading/pages/${name}.webp`)
      }
    }
    for (const directory of ['public', 'dist']) {
      write(`${directory}/game-assets/sprite.png`)
      write(`${directory}/game-assets/sprite.webp`)
    }
    write('src/catalogue.js', 'const picture = "/guided-reading/pages/referenced.png"')
    write('public/catalogue.json', '{"image":"/guided-reading/pages/manifest.png"}')
    const plugin = publicImageStoragePlugin()
    plugin.configResolved({ root, publicDir: path.join(root, 'public'), build: { outDir: 'dist' }, logger: { info() {} } })
    const code = [...images.filter(name => name !== 'dynamic').map(name => `/guided-reading/pages/${name}.webp`), '/game-assets/sprite.webp', '/guided-reading/pages/built-only.png'].map(JSON.stringify).join(';')
    plugin.writeBundle({}, { chunk: { type: 'chunk', code } })
    assert.equal(fs.existsSync(path.join(root, 'dist/guided-reading/pages/optimized.png')), false)
    assert.equal(fs.readFileSync(path.join(root, 'public/guided-reading/pages/optimized.png'), 'utf8'), 'image bytes')
    assert.equal(fs.readFileSync(path.join(root, 'dist/guided-reading/pages/optimized.webp'), 'utf8'), 'image bytes')
    for (const name of images.filter(name => name !== 'optimized')) {
      assert.ok(fs.existsSync(path.join(root, `dist/guided-reading/pages/${name}.png`)), name)
    }
    assert.ok(fs.existsSync(path.join(root, 'dist/game-assets/sprite.png')))
    plugin.configResolved({ root, publicDir: path.join(root, 'public'), build: { outDir: 'public' }, logger: { info() {} } })
    assert.throws(() => plugin.writeBundle({}, {}), /separate from source artwork/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
