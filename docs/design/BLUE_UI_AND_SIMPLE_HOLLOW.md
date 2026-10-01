# Blue interface and simpler Hollow

Approved by the product owner on 30 September 2026 after reviewing the interactive
Literacy Guide design comparison. This direction supersedes the earlier sage and
liquid-glass palette and panel recipes for application chrome. Existing artwork,
world identity, teaching glyph fonts, responsive geometry and touch requirements
remain authoritative.

Use chalk white `#F7F8FA`, white panels, navy ink `#18263E`, secondary ink
`#5C677A`, cobalt action `#3454C8`, hover `#2844A9`, selected fill `#E9EDF9`,
quiet borders `#DFE3EB` and control boundaries `#929DAF`. Use Source Sans 3 for
the shared adult interface. Preserve Andika and the established teaching fonts
where letter forms are part of learning. Success, warning and error colours
retain their meanings; world and character art keep their source colours.

Panels and navigation are opaque with quiet borders and restrained shadows.
Give the next action the cobalt emphasis; avoid giving every card a different
accent, glowing edge or translucent gradient. Maintain a visible focus shape.

Hollow entry shows one task and three picture doorways: Decorate, My Guide and
Beasties. The first task opens the free welcome egg and immediately reveals the
owned friend. Later visits lead to decorating. The Beasties doorway is the
permanent home of the owned collection; it replaces the duplicated room nook.
Do not display a wall of unowned silhouettes.

Show coins in the shop, berries with feeding, and stars/cost when changing the
Guide. Hide the global reward wallet while Hollow is open. Shop entry starts
with ordinary decorations, sorted affordable first, then price; special seasonal
stock is an explicit shelf. Each selected shop or Beasties shelf shows its complete
collection with natural card height and a single native scroll when needed. Buying a decoration opens placement; choosing a spot saves it
immediately. Buying gear equips it immediately; tapping owned gear can remove
or replace it. Feeding saves immediately. The hatch message dismisses itself
and never blocks the next task.

Existing ledger, cloud hydration, balances, purchases, feeds, growth thresholds,
Guide-change cost, world unlocks, rooms and gear composition are unchanged.
Room editing, theme choices, additional rooms and shop categories are disclosed
inside their relevant task. Preserve saved slot identifiers across upgrades.

Verification includes Hollow gift, purchase, placement, feeding, equip and reload
flows; painted control/card containment and complete collection reachability
including 320×568 and 568×320; shared child contracts;
student device/emphasis screenshots; teacher and child accessibility checks;
and regression/build. Browser emulation is distinct from physical school-device
and classroom observation.

## Visible collections and menu objects — 1 October 2026

The owner selected the simpler paper/wood navigation symbols. Home now offers
Map, Books, Stories, Arcade, Letters, Words, Sounds and Hollow in a 4×2 grid at
roomy widths, with native scrolling and fewer columns on small screens. Words
opens the existing Word Workshop and retains all taught-letter prerequisites.
Eight separate transparent WebP objects live in `public/images/navigation/`
and use one registry in `src/policy/studentTabBar.js`. The exported source and
codec provenance are recorded in `public/images/navigation/manifest.json`.
Letters and Words use real Andika glyphs over blank wooden faces. Original
game art, covers and canonical Guides remain. Collections allocate natural art,
name, price/status and action space, including two-friend and three-egg cases.
A feed-disabled friend explains how to earn food and offers a direct Books path.
