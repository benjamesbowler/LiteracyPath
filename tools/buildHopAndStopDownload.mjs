import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = process.argv[2];
if (!destination) throw new Error('Pass the output package directory.');
const output = path.resolve(destination);
const withSong = process.argv.includes('--with-song');
const temporary = fs.mkdtempSync(path.join(repo, '.artifacts/hop-and-stop-download-'));
try {
  const entry = path.join(temporary, 'entry.jsx');
  fs.writeFileSync(entry, `import React from 'react';\nimport {createRoot} from 'react-dom/client';\nimport '@fontsource/andika/latin-400.css';\nimport '@fontsource/andika/latin-700.css';\nimport {HopAndStopUnit} from ${JSON.stringify(path.join(repo, 'src/components/action-songs/HopAndStopUnit.jsx'))};\ncreateRoot(document.getElementById('root')).render(React.createElement(HopAndStopUnit,{songAvailable:${withSong}}));\n`);
  const result = await build({ root: repo, configFile: false, publicDir: false, plugins: [react()], logLevel: 'warn', define: { 'import.meta.hot': 'false', 'process.env.NODE_ENV': JSON.stringify('production') }, build: { write: false, cssCodeSplit: false, minify: true, lib: { entry, name: 'HopAndStopReaderGame', formats: ['iife'], fileName: 'unit' } } });
  const files = (Array.isArray(result) ? result : [result]).flatMap(item => item.output);
  const js = files.filter(file => file.type === 'chunk').map(file => file.code).join('\n').replaceAll('/action-songs/hop-and-stop', '.');
  const css = files.filter(file => file.type === 'asset' && file.fileName.endsWith('.css')).map(file => String(file.source)).join('\n');
  if (!js || !css) throw new Error('Standalone script or styles missing.');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hop and Stop - Reader and Game</title><link rel="icon" href="data:,"><style>${css}</style></head><body class="hop-stop-preview"><div id="root"></div><script>${js.replaceAll('</script', '<\\/script')}</script></body></html>`);
  const media = path.join(repo, 'public/action-songs/hop-and-stop');
  for (const name of ['reader', 'actions', 'audio']) fs.cpSync(path.join(media, name), path.join(output, name), { recursive: true });
  fs.copyFileSync(path.join(media, 'hop-and-stop-reader.pdf'), path.join(output, 'hop-and-stop-reader.pdf'));
  if (withSong) for (const name of ['hop-and-stop.mp4', 'hop-and-stop.mp3']) fs.copyFileSync(path.join(media, name), path.join(output, name));
  fs.writeFileSync(path.join(output, 'START-HERE.txt'), 'HOP AND STOP - READER AND GAME\n\nOpen index.html in a browser. Read Together plays the eight-page story; Play the action game starts eight untimed picture rounds. Press Hear for recorded words or use Show the word for supported practice. Nothing is scored or uploaded.\n\nPrint hop-and-stop-reader.pdf for the picture reader. Keep the reader, actions and audio folders beside index.html. All media and fonts are included; no login is needed.\n\nThis package contains the reader and game. The matching song video is supplied separately when production is finished.\n');
  if (withSong) {
    const html = path.join(output, 'index.html');
    fs.writeFileSync(html, fs.readFileSync(html, 'utf8').replace('<title>Hop and Stop - Reader and Game</title>', '<title>Hop and Stop - Watch, Read and Play</title>'));
    fs.writeFileSync(path.join(output, 'START-HERE.txt'), 'HOP AND STOP - WATCH, READ AND PLAY\n\nOpen index.html in a browser. Watch plays the complete song video; Read Together plays the eight-page story; Play starts eight untimed picture rounds. Press Hear for recorded words or choose Show the word for supported practice. Nothing is scored or uploaded.\n\nPrint hop-and-stop-reader.pdf for the matching picture reader. The video and song are also supplied as hop-and-stop.mp4 and hop-and-stop.mp3. Keep all files and folders together. Media and fonts are included; no login is needed.\n');
  }
  const zip = output + '.zip';
  execFileSync('/usr/bin/ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', output, zip]);
  console.log(JSON.stringify({ package: output, zip, htmlBytes: fs.statSync(path.join(output, 'index.html')).size, zipBytes: fs.statSync(zip).size }));
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
