# Word Climb — Moonwood ascent

The target frame is a woodland boy climbing the ribbed trunk of an ancient tree,
with moss-capped branch shelves, amber mushrooms at the roots, blue aerial mist
between distant trunks, and a lantern lookout in the upper canopy. Words are
engraved on the vertical fronts of the physical shelves. Their upper edges are
the collision surfaces, and all three destinations have equal visual emphasis.

Pip follows `docs/content/STORY_BIBLE_PART_2_CANON.md` §3 (MOON-PIP). The exact
reference is `public/game-assets/sound-seekers/v3/cast/moonwood/pip-hero.webp`.
This asset adapts the original semantic Pip mesh from the Sound Racer production
source with its owner's permission; it does not alter that source. The kart and
vehicle bones are removed. The separate climbing source retains named clothing,
hair, face, hand, boot and body surfaces and authors new standing, crouch, reach,
grip, alternating climbing, recovery and summit contacts.

Source snapshot: `../sound-racer/pip-kart.blend`, SHA-256
`ee12f4192b8930476b11a4158ed1a157843be3d830f7ade585ca7dc82efc30e9`.
Original mesh recipe: `../sound-racer/build_racer.py`, SHA-256
`accef677c04f3a2848e40f76b87079da32b0168e681fdf6c9a99f4c742e4cd55`.

`build_climber.py` creates the independent editable `pip-climber.blend` and its
runtime glTF. World geometry is authored in the dedicated `wordClimbSceneKit.js`
source, with deterministic ring profiles, branch curves, moss lips and roots;
no external mesh, texture or generated picture is incorporated. Runtime lighting
and shadow geometry use the same world coordinates as the physical ledges.

Acceptance requires direct rendered review of the canonical likeness, boot to
ledge contact, reach/recovery motion, root/canopy/summit progression and readable
native 56px word targets at desktop, portrait and short landscape sizes. Asset
presence and automatic tests alone do not establish visual or device approval.

Each outing contains 13,600 units of active climbing at a maximum 108 units per
second, plus its reviewed 6/8/10 word jumps. Rootways, Windward Canopy and Lantern
Ridge have different bends, branch sides, palette and wind. Small holds provide
local motor recovery only after physical contact. Optional lanterns do not award
reading accuracy or replace word evidence. Summits expose the shared next/replay
session boundary and never automatically exit the game.

The runtime retains native keyboard and 56px touch controls. An exact embedded
copy recovers a failed character URL; a visible route silhouette, obstruction
and lantern layer preserves navigation when WebGL is unavailable.
