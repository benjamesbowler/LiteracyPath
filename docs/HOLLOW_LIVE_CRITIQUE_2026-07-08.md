# My Hollow — live critique on Vercel preview (2026-07-08)

Walked as Aaron (Bens/Trial, fresh device): all four tabs, placement picker, Market shelves.
Wallet was 9 coins / 5 berries with Glow jar + Mushroom stool + Garden owned — perfect for seeing
the broke-kid experience. Couldn't test: buying, egg hatch overlay, feeding (needs coins/beasties).

**Verdict: the system works — the scene doesn't sell it yet.** The economy, tabs, picker, expansion
bar, caravan countdown and earn-rates strip all function. But the page a child sees undersells the
fantasy in six specific, fixable ways.

## P0 — makes it feel broken
1. **The Hollow scene is a grey void.** The scene box is a flat grey gradient with 10 identical
   dashed squares in a row — it reads as an upload form, not a magical home. The three world
   panoramas sit BELOW as picker cards, so "choosing your world" visibly changes nothing.
   → Use the chosen world panorama as the scene's background-image; scatter slots at varied
   positions/sizes over it; picker cards become small thumbnails.
2. **A broke wallet greys out the entire Market.** With 9 coins every card is ghosted
   (opacity + grey prices) — the shop looks broken/sad exactly when a kid should be dreaming.
   → Keep item art full colour always; affordability lives ONLY in the price pill
   ("🪙 40" vs "36 to go"); drop `opacity` from the disabled state.
3. **The coin icon reads as a grey rock.** The 🪙 emoji at chip/price size renders as a dull ball —
   in the header, the wallet, and on every price. The one symbol that must scream GOLD doesn't.
   → Small inline SVG coin (gold, black outline, pop-art) used everywhere; same for a berry icon.

## P1 — undersells the loop
4. **Expansions don't show.** Buying The Garden just appended four more identical grey squares;
   nothing is named, no visual band, no reveal. → Each expansion = a labelled, tinted band of the
   scene ("🌿 The Garden") that unfurls on purchase.
5. **Placement picker appears far from the tap** (bottom of the card, small chips). → Popover at
   the tapped slot with big art tiles.
6. **Beasties cold start = 10 grey silhouettes.** A new kid's collection tab is 100% "? ? ?" —
   nothing owned, nothing to do. → Hatch a free starter egg on first visit (welcome gift), so the
   tab always opens with one living beastie and the feed loop visible.

## P2 — polish
- Caravan banner is hardcoded 🌙 (wrong for Dinosaur Caravan); give each caravan its own icon and
  a dedicated shelf strip instead of inline "Caravan" tags.
- Section headers are ALL CAPS (PAL GEAR / FOR YOUR HOLLOW / MYSTERY EGGS) — sentence-case them
  (our own audit rule).
- "Market · 26d" tab label is cryptic for pre-readers → "Market" + small caravan dot; countdown
  lives inside the tab's banner.
- Berries chip is low-contrast (dark blue on lilac).
- My Pal tab with no gear is a near-empty page — show 2–3 "coming to the caravan" preview cards.
- Egg cards have no art yet and inherit the ghost state — they're the flagship purchase and
  currently the least visible thing on the page.
- Manual check still needed when funds allow: buy → coin deduction, egg hatch overlay, feeding
  growth, Grand beastie appearing in the scene.

## What already works well
- Tab structure is clear; wallet always visible; earn-rates strip (purple numbers) is the best
  teaching moment on the page; expansion pricing ladder shows; caravan countdown runs; the new
  Seedream item art (glow jar, mushroom stool, wand, dino helm…) looks exactly right for the
  pop-art direction; picker/place/put-away round-trips correctly.
