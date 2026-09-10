# Sound Racer authored production assets

`pip-kart.blend` retains separate editable surfaces, named semantic bones, skin weights and six NLA clips. The reference for Pip is the existing canonical `public/game-assets/sound-seekers/v3/cast/moonwood/pip-hero.webp`: brown swept hair, pointed ears, olive hooded tunic, leather belt, satchel and boots. The kart geometry is original; the old closed hatchback is retained only as a parked scenery vehicle.

Regenerate from the worktree root with Blender 5.2:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --threads 2 --python artwork/games/sound-racer/build_racer.py -- "$PWD"
```

The builder saves the editable source before joining runtime surfaces by material, exports the GLB, regenerates its byte-identical lazy recovery payload, records its SHA-256, and renders three review views under `.artifacts/full-game-upgrades/racer-production`. In the editable file the six NLA tracks are muted to show the clean seated pose; unmute/solo one named track to preview it. There are no external images, mesh buffers or textures in the driver GLB.

Runtime coordinates are +Y up and -Z forward. Four roll bones use local Y along each axle, inside separate vertical steering/suspension pivots. The chassis and driver can react independently while wheel centres retain road contact. Driver hands rotate around the actual steering ring, and feet remain on the pedals. The analytic rig solver preserves edit-bone roll and explicitly composes parent/child target transforms.

`asset-record.json` records the driver export. `scenery-provenance.json` records the retained CC0 KayKit files, licenses, exact library source revisions and local hashes. No additional model bank was copied. Roadside placement checks the complete route, including neighbouring hairpin arms. Joined kerbs and barriers use the same sampled physical route as the kart and gates.

Focused regression: `tests/unit/soundRacerProduction.test.js` checks exported skinned contacts and runtime mixer behaviour, not only glTF metadata. Browser checks are in `tests/release/sound-racer-production.spec.js` and the existing circuit suite. Mechanical and desktop browser evidence does not establish physical-device performance, listening approval or child-play validation.
