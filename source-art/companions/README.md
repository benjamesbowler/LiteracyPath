# Current Guide artwork

The active six Guide IDs remain `fluff`, `chips`, `socks`, `chompy`, `muddy` and
`pip`. `src/utils/hollowEconomy.js` owns the fourteen gear IDs, slots and prices;
`gear-appearance.json` owns only their visual descriptions. Existing ownership,
Guide-change cost, profile IDs and saved equipment are preserved.

`GUIDE-SOCKS` is the brown monkey with a cream heart-shaped face, curled tail and
red buttoned vest, as expressly chosen in
`docs/content/STORY_BIBLE_PART_2_CANON.md` section 3.6. `HUMAN-SOCKS` is the
separate dog in Aiden and Betty. The Guide selection describes the monkey as a
Little Literacy Guide instead of claiming he is that book's dog.

Current source authority is `clean-cartoon/registration.json` for 96 canonical
outputs: six portraits and six sets of one base plus fourteen genuine worn
outfits. Each portrait is a measured meaningful crop of its own accepted new
base. `clean-cartoon/composition-registration.json` separately records 114 alpha
composition derivatives. Both are consumed by `clean-cartoon/manifest.json` and
`tools/buildCompanionArtwork.mjs`. Every delivery has an exact source hash,
rectangular crop, resize, placement, encoding and output hash. Native imagegen
prompts and receipts live beside their current sources. Historical generator
prompts do not certify current pixels.

`src/data/companionArtwork.generated.js` explicitly lists all 275 known selection paths: 96 canonical Guide images,
114 composition layers and the 65 finite Hollow ItemArt files (61 active, four expansion
icons retained without a normal image caller). The fourteen
standalone gear icons have their exact source recipes in
`source-art/hollow/gear-clean-cartoon/registration.json`; the other 51 Hollow
items retain their own current source authority.
`companionArtwork.js` applies the current repaired-image revision to the actual
portrait, full-outfit and layer selectors. This avoids the old inventory gap
where a templated filename hid ninety active full outfits from collection.

A single equipped item displays its complete worn outfit. Multiple slots use
one true-alpha body reproduced mechanically from the full native recipe: the
held outfit supplies its correct arm pose, otherwise the boot outfit or base
supplies the body. Back gear renders behind that body; six rectangular front
strap crops keep backpack shoulder straps visible below each chin. This prevents
a bedroll or wing from covering a broad face. Head, back and neck use actual true-alpha
equipment, created by built-in image editing of the accepted worn banks. Held
foreground and lower boots use rectangular crops of original source alpha.
Their original pixels and source hashes remain reproducible; no code-painted
gear or invented alpha contour removes a body. A two-pixel lower-body overlap
prevents a rounding gap when boots and a held pose are combined. The former
fading whole-body slot masks are removed because they produced ghost bodies,
missing wing sections and a hidden boot. Failed equipment hides independently;
a failed body falls back to its base and then the correct Guide portrait.

Run `node tools/buildCompanionArtwork.mjs --check` to verify all native sources,
provenance, current Guide outputs, alpha derivatives, fourteen gear icons, base-reference
derivation and the
consumed registry. `--write` reproduces the current deliveries; `--registry-only`
updates only the literal selection registry. The legacy generation tools share
the corrected appearance/identity/style constraints but are not the generation
route for these built-in-imagegen sources.

Visual acceptance includes full native inspection, complete saved characters at
390/128 pixels and the actual production `PalFigure`, `HollowPage` and
`CyclePracticePage` with their normal CSS. Scoped local fixtures exercise each
single outfit, four interacting five-slot combinations, owned-gear toggles,
all six portrait choices, three Pip Cycle picture branches and genuine missing
body/layer requests. The current manifest's review records the exact evidence.
Local viewport evidence does not imply an authenticated cloud save, deployment,
physical-device run or human listening review.
