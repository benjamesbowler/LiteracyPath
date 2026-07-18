# Vendored Three.js (r128)

Local, pinned copy of Three.js used by the 3D arcade games (Rocket Run,
Sound Racer). It replaces the previous runtime `<script>` load from
cdnjs.cloudflare.com, which had no integrity hash and failed offline.

## Files

| File           | What it is                                                        |
| -------------- | ----------------------------------------------------------------- |
| `three.min.js` | Official minified UMD build of Three.js r128 (sets `window.THREE`) |
| `LICENSE`      | The MIT License, Copyright 2010-2021 three.js authors             |

## Provenance

- Source URL: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
- License URL: `https://raw.githubusercontent.com/mrdoob/three.js/r128/LICENSE`
- Upstream project: https://github.com/mrdoob/three.js (tag `r128`)

## Integrity (sha256, via `shasum -a 256`)

```
9274bbcec8d96168626c732b5d31c775aa8cfb7eaa0599bec0c175908a2c1ce2  three.min.js
7dddf7c5b8fd10ee654db8857d75d104b5557889aa5a91fc4ca545ea7c07062f  LICENSE
```

## Loading

`src/components/learn/games/shared/threeShell.js` injects a `<script>` tag
pointing at this file (resolved through the Vite `?url` asset pipeline, so it
works in dev and in production builds). The loader is idempotent and
promise-based; games keep their previous `loadThree().then(THREE => ...)`
call shape.

Note: Star Gallery and Grammar Grind use the bundled npm `three` package
(see `package.json`) instead of this global build — that is intentional,
they rely on post-r128 APIs (`outputColorSpace`).
