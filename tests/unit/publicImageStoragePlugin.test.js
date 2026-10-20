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
    plugin.configResolved({ root, publicDir: path.join(root, 'public'), build: { outDir: 'public/nested-output' }, logger: { info() {} } })
    assert.throws(() => plugin.writeBundle({}, {}), /separate from source artwork/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('delivery keeps frozen-bank and manifest recordings, dynamic audio and source masters', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lp-media-storage-'))
  try {
    const write = (relative, value) => {
      const file = path.join(root, relative)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, value)
    }
    const audioRoot = 'audio/production/en-US/'
    const clips = [
      'assessment_prompt/frozen-1234567890.mp3',
      'isolated_word/manifest-1234567890.mp3',
      'instruction/bundle-1234567890.mp3',
      'isolated_word/replaced-1234567890.mp3',
      'meadow_science/book/page-1.mp3',
      'pattern/dynamic-1234567890.mp3',
      'isolated_word/unknown-name.mp3',
      'assessment_passage/server-1234567890.mp3'
    ]
    for (const clip of clips) for (const directory of ['public', 'dist']) {
      write(`${directory}/${audioRoot}${clip}`, `recording ${clip}`)
    }
    write('src/content/frozen-bank.generated.js', `export const path = '/${audioRoot}${clips[0]}'`)
    write('public/offline.json', JSON.stringify({ audio: `/${audioRoot}${clips[1]}?v=1` }))
    write('supabase/migrations/published.sql', `select '/${audioRoot}${clips[7]}';`)
    const pictures = ['images/emotions/happy', 'images/learn-games/icon', 'media/learn/images/cycle-1/word']
    for (const picture of pictures) for (const directory of ['public', 'dist']) {
      write(`${directory}/${picture}.png`, 'source image')
      write(`${directory}/${picture}.webp`, 'delivery image')
    }
    const plugin = publicImageStoragePlugin()
    plugin.configResolved({ root, publicDir: path.join(root, 'public'), build: { outDir: 'dist' }, logger: { info() {} } })
    plugin.writeBundle({}, { chunk: { type: 'chunk', code: JSON.stringify([`/${audioRoot}${clips[2]}`, ...pictures.map(p => `/${p}.webp`)]) } })
    for (const clip of clips) {
      const original = `${audioRoot}${clip}`
      assert.equal(fs.existsSync(path.join(root, 'dist', original)), !clip.startsWith('isolated_word/replaced-'), clip)
      assert.equal(fs.readFileSync(path.join(root, 'public', original), 'utf8'), `recording ${clip}`)
    }
    for (const picture of pictures) {
      assert.equal(fs.existsSync(path.join(root, `dist/${picture}.png`)), false)
      assert.equal(fs.readFileSync(path.join(root, `dist/${picture}.webp`), 'utf8'), 'delivery image')
      assert.equal(fs.readFileSync(path.join(root, `public/${picture}.png`), 'utf8'), 'source image')
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
