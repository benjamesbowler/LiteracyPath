# Sound Seekers: The Lost Little Lights

A separately runnable 3D adventure with two reviewable entries: the approved
five-minute design demo at `index.html`, and the expanded woodland chapter at
`chapter.html`. The existing classroom game is not replaced by these entries.

The [woodland chapter](CHAPTER_ONE.md) contains five projects, 15 visits and 120
contextual rounds across five interactions. It adds sound-parcel sorting and
spoken on/in/under placement, new paths and visible repairs, branching projects,
and exact per-project resume. Its 30–40-minute duration is an authoring target,
pending child-paced observation; there is no timer or forced waiting to pad it.

Run the chapter from the repository root:

```sh
node node_modules/vite/bin/vite.js --config demos/sound-seekers/chapter.config.mjs
```

Open `http://127.0.0.1:5201/chapter.html`. Add `build` before `--config` to create
`.artifacts/sound-seekers-chapter-build/`. For the packaged chapter, use `preview`
instead and append `--port 5202 --strictPort`; open `http://localhost:5202/chapter.html`.
The entries use distinct save keys and distinct build folders.

The original design demo remains available as follows.

The child explores as Meadow Pals' Bouncy, listens for initial sounds to pack a picnic, chooses sound stones to repair a brook crossing, and plants three-letter words to bloom a lantern garden. Each completed task returns one light to the great tree. Free movement and five optional firefly discoveries support exploration; only sound/word decisions advance the three repairs. There is no countdown or required waiting to pad play time.

Art direction: sculpted storybook woodland, rounded branching trees, mossy edges, cream paths, coral mushroom cottage, teal water and warm lanterns. Golden wool, spring legs and a red scarf preserve Bouncy's identity. The live scene provides the title backdrop. The camera is a damped elevated three-quarter view; activity close-ups keep the world behind large tactile objects. Target states: title in the woodland; small hero on the winding trail; big picture tokens at the picnic; letter stones spanning water; letter seeds in three persistent flower slots; all lamps lit at the finale. Sparse warm paper UI, 56px or larger controls, no blocky protagonist or default engine chrome.

Scope: three six-round tasks; keyboard, pointer and touch navigation; replayable recorded phonics; specific supported retries; no Check gate; pause and local resume; replay with fresh arrangements; a complete ending and exit. Ages approximately 5–7, already familiar with the included single-letter sounds and CVC blending. This demo introduces no learner profile, remote reporting, analytics, or runtime external service. Local storage contains anonymous demo progress only.

Run from the repository root:

```sh
node node_modules/vite/bin/vite.js --config demos/sound-seekers/vite.config.mjs
```

Open `http://127.0.0.1:5199/`. Build using the same command with `build` before `--config`; output is ignored `.artifacts/sound-seekers-demo-build/`. To play the packaged build, replace `build` with `preview` and append `--port 5200 --strictPort`, then open `http://localhost:5200/`. Blender sources and asset provenance are retained in `source/`; runtime uses only selected GLBs, images and audio from `assets/`.

Verification must cover the full journey, wrong attempts, repeated inputs, pause/visibility, reload, replay variation, viewport fit, reduced motion and asset failure. Automated/browser evidence is separate from physical iPad, human listening and child observation. Evidence and measured play duration belong in `.artifacts/`, not in product claims.
