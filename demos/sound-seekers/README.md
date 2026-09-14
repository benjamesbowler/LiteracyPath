# Sound Seekers: The Lost Little Lights

A separately runnable five-minute design demo requested for review. This is the new concept's only entry point; the existing classroom game is not replaced by this demo.

The child explores as Meadow Pals' Bouncy, listens for initial sounds to pack a picnic, chooses sound stones to repair a brook crossing, and plants three-letter words to bloom a lantern garden. Each completed task returns one light to the great tree. Free movement and five optional firefly discoveries support exploration; only sound/word decisions advance the three repairs. There is no countdown or required waiting to pad play time.

Art direction: sculpted storybook woodland, rounded branching trees, mossy edges, cream paths, coral mushroom cottage, teal water and warm lanterns. Golden wool, spring legs and a red scarf preserve Bouncy's identity. The live scene provides the title backdrop. The camera is a damped elevated three-quarter view; activity close-ups keep the world behind large tactile objects. Target states: title in the woodland; small hero on the winding trail; big picture tokens at the picnic; letter stones spanning water; letter seeds in three persistent flower slots; all lamps lit at the finale. Sparse warm paper UI, 56px or larger controls, no blocky protagonist or default engine chrome.

Scope: three six-round tasks; keyboard, pointer and touch navigation; replayable recorded phonics; specific supported retries; no Check gate; pause and local resume; replay with fresh arrangements; a complete ending and exit. Ages approximately 5–7, already familiar with the included single-letter sounds and CVC blending. This demo introduces no learner profile, remote reporting, analytics, or runtime external service. Local storage contains anonymous demo progress only.

Run from the repository root:

```sh
node node_modules/vite/bin/vite.js --config demos/sound-seekers/vite.config.mjs
```

Open `http://127.0.0.1:5199/`. Build using the same command with `build` before `--config`; output is ignored `.artifacts/sound-seekers-demo-build/`. To play the packaged build, replace `build` with `preview` and append `--port 5200 --strictPort`, then open `http://localhost:5200/`. Blender sources and asset provenance are retained in `source/`; runtime uses only selected GLBs, images and audio from `assets/`.

Verification must cover the full journey, wrong attempts, repeated inputs, pause/visibility, reload, replay variation, viewport fit, reduced motion and asset failure. Automated/browser evidence is separate from physical iPad, human listening and child observation. Evidence and measured play duration belong in `.artifacts/`, not in product claims.
