# Rewards V2 — Research & System Plan (2026-07-08)

Replaces the Treasure Den / trail / badge wall. Goal: a spend-based, fantasy-themed reward system where every activity pays out, kids buy things they own and show off, and there is no end point.

---

## 1. What the successful apps do (research)

| App | Earn | Spend on | Why it works |
|---|---|---|---|
| **Raz-Kids / Kids A-Z** | Stars for every reading/recording/quiz activity | **Raz Rocket** — buy furniture, robots, aliens to build out your own rocket room; **Avatar Builder** — clothes/parts; seasonal items available 60 days, refreshed quarterly; 500-star welcome bonus | Two ownable spaces; constant small payouts; seasonal rotation = never "done" |
| **ABCmouse** | Tickets for completing any activity | Avatar outfits, room decor, **aquarium fish, hamster tubes/mazes, pet park**, extra hamsters | Multiple little worlds to grow; spending itself is a fun decision activity |
| **Reading Eggs** | Golden eggs per lesson/book | Avatar clothes, **house furniture**, arcade mini-games (pay-to-play), plus a free **critter** collectible after every lesson | Mixes purchases with automatic collection; games as a sink |
| **Prodigy** | Gold/stars from answering questions | 100+ **pets that level up and evolve** (appearance changes), gear | Collection + *growth* — pets visibly improve, strongest hook of all |
| **Teach Your Monster** | Stars/presents through play | Dress and feed **your monster** (it's the avatar and the pet) | The reward target is the character the kid already loves |
| **Khan Academy Kids** | Automatic | Collect bugs, hats, toys for characters | Zero-friction collecting for the youngest kids |

**The winning pattern:** small payouts from *every* activity → spent on things the kid **owns, arranges, and can show** (avatar gear, a room/base, pets) → kept endless via **seasonal rotation, collections with visible gaps, and things that grow**. Trophies/badges are consistently the weakest mechanic (confirms your instinct — our badge wall does nothing).

**Pitfall to avoid (research + common sense):** kids rushing activities just to farm currency. Mitigation: pay more for *stars/quality* than for completion, and cap repeat-payouts of the same item per day (replays pay a trickle, not full price).

---

## 2. The system: **Coins → the Hollow**

One currency, three sinks, one home for all of it. Fantasy/nature theme matched to our three worlds (Meadow Farm / Dinosaur Valley / Moonwood Forest).

### Currency: **Coins** (one, only one)
- The existing coin balance (Aaron: 569) becomes the wallet. **Gems, arcade points, trail, badge wall are retired** (see migration).
- Wallet always visible in the header; every payout flies coins into it (the feedback loop).

### The place: **My Hollow** (replaces Treasure Den)
A magical hollow tree home that starts almost empty and becomes the kid's own place. One page, four tabs:
1. **My Hollow** — the scene itself. Buy lanterns, mushroom stools, banners, bookshelves, plants, creatures-in-residence; tap to place/rearrange. **Expansion plots** open new areas (garden → pond → cave → treetop) at rising prices — a big, uncapped sink.
2. **My Pal** — dress the companion (they already appear in the header, maps and games, so gear is visible everywhere): hats, capes, scarves, wands, lanterns, wings. **Seasonal sets** available ~6 weeks then rotated (Raz model) = endless catalogue without endless art debt.
3. **Beasties** — the growth hook (Prodigy model). Buy **mystery eggs** (bronze/silver/gold tiers). Eggs hatch into fantasy creatures (moss sprite, ember fox, star owl, river dragon…). Feed them earned **Berries** (auto-earned alongside coins from reading) to grow them Baby → Young → Grand, with visible appearance change. Collection book shows silhouettes of unowned beasties — the gap kids want to fill. New sets per season, rarities included.
4. **Market** — the shop, run by a merchant character (fantasy trading post). Tabs: Pal Gear / Hollow / Eggs. Clear prices, "not enough yet — 12 to go" states, seasonal shelf with a leaves-fall/return timer.

### Earning (wired to what already exists)
| Action | Coins |
|---|---|
| Quest station complete | 5 + 2/star (3★ = 11) |
| Arcade round complete | 4 + 2/star; Medium ×1.5, Hard ×2 |
| Book finished (listen+read) | 10 |
| Story quest chapter | 8 (+2 per word found) |
| Daily 3-task chest | 20 bonus |
| 5-day streak chest | 50 bonus (the flame icon finally means this) |
| First-time-ever completions | ×2 |
| Repeats of same item same day | 25% payout (anti-farming) |
| Berries (beastie food) | 1 per book/story chapter — reading feeds your creatures |

Typical day (3 tasks + a bit) ≈ **45–60 coins**. Prices: small decor 30–80, gear 50–150, bronze egg 100 / silver 250 / gold 500, expansions 300 → 600 → 1,000 → … So: something small most days, an egg most weeks, an expansion monthly — steady dopamine at three time-scales.

### Why it can't hit a limit
- Seasonal gear + beastie sets rotate (retire/return), so the catalogue refreshes without infinite art.
- Beasties grow (long consumable: Berries) and new sets keep the collection book incomplete.
- Expansion plots + premium "wonder" items (e.g. 1,500-coin waterfall) absorb any surplus.
- Prices can tier upward forever; nothing in the design has a final trophy.

### Migration (one-off)
- Wallet = old coins + (gems × 10) → Aaron: 569 + 370 = 939 starting coins (plus a "welcome to the Hollow" 100-coin gift — the Raz endowment trick).
- Trail items already earned convert to exclusive starter decorations placed in the Hollow ("Dino Egg" becomes an actual egg → first free beastie hatch).
- Badge wall deleted; XP/level/shield hidden from kid UI (parent dashboard only).

---

## 3. Build plan (when approved)

1. **Data**: `hollowState` (placed items, owned gear, beasties + stages, wallet, berries) in Supabase; pure module `rewardsEconomy.js` (payout table, prices, anti-farm rules) with unit tests.
2. **Earn hooks**: single `awardCoins(source, stars)` called from stations, games, readers; coin-burst overlay component.
3. **Hollow page**: scene renderer (layered PNGs + slots), Market, Pal gear (renders on companion sprite), Beasties book.
4. **Art batches**: hollow base + 20 decor, 12 gear items, 6 beasties × 3 stages, merchant, eggs — via the Kimi pipeline (with watermark + duplicate checks).
5. Replace Den routes; migrate balances; retire badge wall.

Mockups: `mockups/rewards-v2/01–04…` (see files alongside this doc).

---

*Sources: Raz-Plus student incentives & Kids A-Z avatar/seasonal docs (learninga-z.com, raz-plus.com), ABCmouse tickets & hamster/aquarium support docs (abcmouse.com), Reading Eggs rewards KB (readingeggs.com), Prodigy pets/membership pages (prodigygame.com), Teach Your Monster reviews (commonsense.org, phonics.org), Khan Academy Kids (khanacademy.org).*
