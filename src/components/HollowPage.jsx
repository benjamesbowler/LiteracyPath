import { useEffect, useMemo, useState } from "react";
import { computeTreasury } from "../utils/treasureTrail.js";
import {
  computeHollow, canBuy, findCatalogItem,
  COIN_RATES, BEASTIES, EXPANSIONS
} from "../utils/hollowEconomy.js";
import { loadHollowLedger, recordPurchase, recordFeed, saveLayout, markCoinsSeen } from "../utils/hollowState.js";
import { DEN_THEMES } from "../utils/denRewards.js";
import { loadStudentProfile, saveStudentProfile, getCompanion } from "../utils/studentProfile.js";
import { playStarChime } from "../utils/audio/gameSfx.js";

// My Hollow - Rewards V2 (replaces the Treasure Den). One place the child
// OWNS: a fantasy hollow they decorate, a pal they dress, beasties they hatch
// and grow by reading, and a market to spend every coin they earn anywhere.
// Earnings are derived (see hollowEconomy.js); only spending is stored.

function hideOnError(event) {
  event.currentTarget.style.display = "none";
}

// Emoji stand-ins render behind the real art (which hides itself on error),
// so the page works before the Seedream batch lands and after.
const EMOJI = {
  "gear-meadow-crown": "👑", "gear-explorer-pack": "🎒", "gear-acorn-shield": "🛡️",
  "gear-willow-wand": "🪄", "gear-trail-boots": "🥾", "gear-wizard-hat": "🧙",
  "gear-starweave-scarf": "🧣", "gear-moth-wings": "🪽", "gear-dino-helm": "🪖",
  "gear-bone-charm": "🦴", "gear-raptor-wings": "🪽", "gear-petal-hood": "🌸",
  "gear-leaf-cloak": "🍃", "gear-falcon-wings": "🪽",
  "hollow-glow-jar": "🫙", "hollow-mushroom-stool": "🍄", "hollow-moon-lantern": "🏮",
  "hollow-moss-rug": "🟩", "hollow-star-banner": "🚩", "hollow-root-table": "🪵",
  "hollow-owl-perch": "🌿", "hollow-story-shelf": "📚", "hollow-ember-pit": "🔥",
  "hollow-crystal-cluster": "💎", "hollow-dino-skull": "🦕", "hollow-fern-fountain": "⛲",
  "hollow-moonwell": "🌙", "hollow-waterfall": "🏞️",
  "exp-garden": "🌿", "exp-pond": "🪷", "exp-cave": "🕳️", "exp-treetop": "🌳",
  "egg-bronze": "🥚", "egg-silver": "🥚", "egg-gold": "🥚",
  "beastie-moss-sprite": "🌱", "beastie-ember-fox": "🦊", "beastie-pebble-toad": "🐸",
  "beastie-sun-moth": "🦋", "beastie-fern-snail": "🐌", "beastie-star-owl": "🦉",
  "beastie-thorn-stag": "🦌", "beastie-glow-lynx": "🐈", "beastie-river-dragon": "🐉",
  "beastie-moon-wyrm": "🐲"
};

function ItemArt({ id, stage, size = 52 }) {
  const file = stage ? `${id}-s${stage}` : id;
  return (
    <span className="hollow-art" style={{ width: size, height: size }} aria-hidden="true">
      <span className="hollow-art-emoji">{EMOJI[id] || "✨"}</span>
      <img src={`/images/hollow/${file}.webp`} alt="" loading="lazy" onError={hideOnError} />
    </span>
  );
}

function CoinPrice({ verdict, price }) {
  if (verdict.reason === "owned") return <span className="hollow-price owned">Owned ✓</span>;
  if (verdict.ok) return <span className="hollow-price can">🪙 {price}</span>;
  return <span className="hollow-price cant">🪙 {price} · {verdict.short} to go</span>;
}

// Base scene placement spots plus four per owned expansion.
const BASE_SLOTS = ["s1", "s2", "s3", "s4", "s5", "s6"];
function slotsForExpansions(ownedExpansions) {
  const slots = [...BASE_SLOTS];
  for (const exp of ownedExpansions) {
    for (let i = 1; i <= exp.slots; i += 1) slots.push(`${exp.id}-${i}`);
  }
  return slots;
}

const GEAR_SLOT_LABELS = { head: "Head", neck: "Neck", back: "Back", held: "Held", feet: "Feet" };

export function HollowPage({ studentName, progressScopeKey = "default", onBack }) {
  const scope = progressScopeKey;
  const [ledgerVersion, setLedgerVersion] = useState(0);
  const treasury = useMemo(() => computeTreasury(scope), [scope]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- ledgerVersion re-reads after every purchase/feed/layout change
  const ledger = useMemo(() => loadHollowLedger(scope), [scope, ledgerVersion]);
  const hollow = useMemo(() => computeHollow(ledger, treasury.breakdown), [ledger, treasury]);
  const companion = useMemo(() => getCompanion(scope), [scope]);
  const [tab, setTab] = useState("hollow");
  const [pickingSlot, setPickingSlot] = useState("");
  const [hatched, setHatched] = useState(null);
  const [theme, setTheme] = useState(() => loadStudentProfile(scope).denTheme || "meadow");

  // Visiting the Hollow "collects" the home-page coin pop-up.
  useEffect(() => {
    markCoinsSeen(scope, hollow.coinsEarnedTotal);
  }, [scope, hollow.coinsEarnedTotal]);

  const refresh = () => setLedgerVersion(v => v + 1);

  function buy(itemId) {
    const verdict = canBuy(hollow, itemId);
    if (!verdict.ok) return;
    const record = recordPurchase(scope, verdict.item);
    playStarChime();
    if (itemId.startsWith("egg-")) {
      // Recompute with the new purchase so the reveal matches the ledger hatch.
      const next = computeHollow(loadHollowLedger(scope), treasury.breakdown);
      const before = new Set(hollow.beasties.map(b => b.id));
      setHatched(next.beasties.find(b => !before.has(b.id)) || next.beasties[0] || null);
    }
    refresh();
    return record;
  }

  function feed(speciesId) {
    if (hollow.berries < 1) return;
    recordFeed(scope, speciesId);
    playStarChime();
    refresh();
  }

  function placeItem(slotId, itemId) {
    const slots = { ...hollow.slots };
    if (itemId) slots[slotId] = itemId;
    else delete slots[slotId];
    saveLayout(scope, { equipped: hollow.equipped, slots });
    setPickingSlot("");
    refresh();
  }

  function toggleGear(gear) {
    const equipped = { ...hollow.equipped };
    if (equipped[gear.slot] === gear.id) delete equipped[gear.slot];
    else equipped[gear.slot] = gear.id;
    saveLayout(scope, { equipped, slots: hollow.slots });
    refresh();
  }

  function chooseTheme(next) {
    setTheme(next.id);
    const profile = loadStudentProfile(scope);
    saveStudentProfile(scope, { ...profile, denTheme: next.id });
  }

  const activeTheme = DEN_THEMES.find(t => t.id === theme) || DEN_THEMES[0];
  const sceneSlots = slotsForExpansions(hollow.ownedExpansions);
  const placedIds = new Set(Object.values(hollow.slots));
  const placeable = hollow.ownedHollowItems.filter(i => !placedIds.has(i.id));
  const nextExpansion = EXPANSIONS.find(e => !hollow.ownedIds.has(e.id));
  const hungry = hollow.beasties.filter(b => b.growth.next && hollow.berries > 0).length;
  const marketNews = hollow.market.season;

  const earnWays = [
    { icon: "⭐", label: "Win a quest star", pays: `${COIN_RATES.questStar} coins` },
    { icon: "🎮", label: "Win a game star", pays: `${COIN_RATES.gameStar} coins` },
    { icon: "📖", label: "Read a book", pays: `${COIN_RATES.bookRead} coins + 1 berry` },
    { icon: "🗺️", label: "Finish a story quest", pays: `${COIN_RATES.storyQuest} coins + 2 berries` },
    { icon: "🧰", label: "Finish all 3 daily tasks", pays: `${COIN_RATES.dailyChest} coin chest` }
  ];

  return (
    <main className="rewards-page hollow-page" data-pal-world={activeTheme.id}>
      <div className="den-backdrop" aria-hidden="true" style={{ backgroundImage: `url(${activeTheme.art})` }} />

      <header className="den-header">
        <button className="sbq-ghost-button" type="button" onClick={onBack}>← Home</button>
        <div className="den-title">
          <h1>{studentName ? `${studentName}'s Hollow` : "My Hollow"}</h1>
          <p>Everything you earn, you keep. Everything you buy is yours.</p>
        </div>
        <span className="hollow-wallet" aria-label={`${hollow.coins} coins and ${hollow.berries} berries`}>
          <strong className="hollow-wallet-coins">🪙 {hollow.coins}</strong>
          <em className="hollow-wallet-berries">🫐 {hollow.berries}</em>
        </span>
      </header>

      <nav className="hollow-tabs" aria-label="Hollow areas">
        {[
          { id: "hollow", label: "My Hollow" },
          { id: "pal", label: "My Pal" },
          { id: "beasties", label: `Beasties${hungry ? ` · ${hungry} hungry` : ""}` },
          { id: "market", label: `Market · ${marketNews.daysLeft}d` }
        ].map(t => (
          <button
            key={t.id}
            type="button"
            className={`hollow-tab${tab === t.id ? " active" : ""}`}
            aria-pressed={tab === t.id}
            onClick={() => { setTab(t.id); setPickingSlot(""); }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "hollow" && (
        <section className="den-card" aria-label="Your hollow">
          <h2>🌳 Your Hollow</h2>
          <p className="hollow-hint">Tap a spot to place something you own. Tap a placed thing to put it away.</p>
          <div className="hollow-scene">
            {sceneSlots.map(slotId => {
              const itemId = hollow.slots[slotId];
              const item = itemId ? findCatalogItem(itemId) : null;
              return item ? (
                <button key={slotId} type="button" className="hollow-slot filled" title={`Put away ${item.name}`} onClick={() => placeItem(slotId, "")}>
                  <ItemArt id={item.id} size={64} />
                  <span className="hollow-slot-name">{item.name}</span>
                </button>
              ) : (
                <button key={slotId} type="button" className="hollow-slot empty" aria-label="Empty spot - add something" onClick={() => setPickingSlot(slotId)}>
                  ＋
                </button>
              );
            })}
            {hollow.beasties.filter(b => b.growth.stage === 3).map(b => (
              <span key={b.id} className="hollow-slot resident" title={`${b.name} lives here now`}>
                <ItemArt id={b.id} stage={3} size={64} />
                <span className="hollow-slot-name">{b.name}</span>
              </span>
            ))}
          </div>

          {pickingSlot && (
            <div className="hollow-picker" role="dialog" aria-label="Choose something to place">
              {placeable.length === 0
                ? <p className="den-empty">Nothing to place yet - the Market has plenty!</p>
                : placeable.map(item => (
                  <button key={item.id} type="button" className="hollow-pick" onClick={() => placeItem(pickingSlot, item.id)}>
                    <ItemArt id={item.id} size={44} />
                    <span>{item.name}</span>
                  </button>
                ))}
              <button type="button" className="hollow-pick cancel" onClick={() => setPickingSlot("")}>Cancel</button>
            </div>
          )}

          {nextExpansion && (
            <div className="hollow-expansion">
              <strong>{EMOJI[nextExpansion.id]} {nextExpansion.name}</strong>
              <span>Opens a whole new part of your Hollow with {nextExpansion.slots} more spots.</span>
              <button
                type="button"
                className="hollow-buy"
                disabled={!canBuy(hollow, nextExpansion.id).ok}
                onClick={() => buy(nextExpansion.id)}
              >
                <CoinPrice verdict={canBuy(hollow, nextExpansion.id)} price={nextExpansion.price} />
              </button>
            </div>
          )}

          <div className="den-themes hollow-worlds">
            {DEN_THEMES.map(world => (
              <button
                key={world.id}
                type="button"
                className={`den-theme${activeTheme.id === world.id ? " active" : ""}`}
                onClick={() => chooseTheme(world)}
              >
                <img src={world.art} alt="" onError={hideOnError} />
                <strong>{world.name}</strong>
                <em>{activeTheme.id === world.id ? "Your world!" : "Tap to choose"}</em>
              </button>
            ))}
          </div>
        </section>
      )}

      {tab === "pal" && (
        <section className="den-card" aria-label="Dress your pal">
          <h2>🎽 Dress your Pal</h2>
          <div className="hollow-pal-row">
            <div className="hollow-pal-stage">
              {companion && <img className="hollow-pal-img" src={companion.image} alt={companion.name} onError={hideOnError} />}
              {Object.entries(hollow.equipped).map(([slot, gearId]) => (
                <span key={slot} className={`hollow-worn hollow-worn-${slot}`}><ItemArt id={gearId} size={46} /></span>
              ))}
              <p className="hollow-pal-caption">
                {Object.keys(hollow.equipped).length
                  ? `Wearing: ${Object.values(hollow.equipped).map(id => findCatalogItem(id)?.name).filter(Boolean).join(", ")}`
                  : "Buy gear at the Market, then tap it here to wear it."}
              </p>
            </div>
            <div className="hollow-gear-grid">
              {hollow.ownedGear.length === 0 && <p className="den-empty">No gear yet - the Market caravan is in town!</p>}
              {hollow.ownedGear.map(gear => {
                const worn = hollow.equipped[gear.slot] === gear.id;
                return (
                  <button key={gear.id} type="button" className={`hollow-gear${worn ? " worn" : ""}`} onClick={() => toggleGear(gear)}>
                    <ItemArt id={gear.id} size={44} />
                    <strong>{gear.name}</strong>
                    <em>{worn ? "Wearing ✓" : GEAR_SLOT_LABELS[gear.slot] || gear.slot}</em>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {tab === "beasties" && (
        <section className="den-card" aria-label="Your beasties">
          <h2>🐾 Beasties</h2>
          <p className="hollow-hint">
            Berries come from reading books and story quests. Feed a beastie to grow it: Baby → Young → Grand.
            Grand beasties move into your Hollow.
          </p>
          <div className="hollow-beastie-grid">
            {hollow.beasties.map(b => (
              <div key={b.id} className={`hollow-beastie rarity-${b.rarity}`}>
                {b.rarity !== "common" && <span className="hollow-rarity">{b.rarity === "epic" ? "Epic" : "Rare"}</span>}
                <ItemArt id={b.id} stage={b.growth.stage} size={72} />
                <strong>{b.name}</strong>
                <em>{b.growth.name}{b.growth.next ? ` · ${b.growth.feedsToNext} more to grow` : " · fully grown!"}</em>
                <span className="hollow-meter" role="progressbar" aria-valuemin={0} aria-valuemax={8} aria-valuenow={Math.min(8, b.growth.feeds)}>
                  <span style={{ width: `${Math.min(100, (b.growth.feeds / 8) * 100)}%` }} />
                </span>
                {b.growth.next ? (
                  <button type="button" className="hollow-buy" disabled={hollow.berries < 1} onClick={() => feed(b.id)}>
                    {hollow.berries < 1 ? "Read to earn berries" : "Feed 🫐"}
                  </button>
                ) : (
                  <span className="hollow-price owned">In your Hollow ✓</span>
                )}
              </div>
            ))}
            {BEASTIES.filter(species => !hollow.beasties.some(b => b.id === species.id)).map(species => (
              <div key={species.id} className="hollow-beastie mystery">
                <span className="hollow-silhouette" aria-hidden="true">{EMOJI[species.id]}</span>
                <strong>? ? ?</strong>
                <em>{species.rarity === "epic" ? "Gold egg only" : species.rarity === "rare" ? "Silver or gold egg" : "Any egg"}</em>
              </div>
            ))}
          </div>
          <button type="button" className="hollow-buy hollow-market-cta" onClick={() => setTab("market")}>
            Get an egg at the Market →
          </button>
        </section>
      )}

      {tab === "market" && (
        <section className="den-card" aria-label="The market">
          <h2>🛒 The Market</h2>
          <div className="hollow-caravan">
            <strong>🌙 {marketNews.name} is in town!</strong>
            <span>New things on the shelf for {marketNews.daysLeft} more day{marketNews.daysLeft === 1 ? "" : "s"} - then the caravan moves on.</span>
          </div>

          <h3 className="hollow-shelf-title">Pal gear</h3>
          <div className="hollow-market-grid">
            {hollow.market.gear.map(item => (
              <button key={item.id} type="button" className="hollow-ware" disabled={!canBuy(hollow, item.id).ok} onClick={() => buy(item.id)}>
                {item.caravan !== undefined && <span className="hollow-seasonal">Caravan</span>}
                <ItemArt id={item.id} size={54} />
                <strong>{item.name}</strong>
                <CoinPrice verdict={canBuy(hollow, item.id)} price={item.price} />
              </button>
            ))}
          </div>

          <h3 className="hollow-shelf-title">For your Hollow</h3>
          <div className="hollow-market-grid">
            {hollow.market.hollow.map(item => (
              <button key={item.id} type="button" className="hollow-ware" disabled={!canBuy(hollow, item.id).ok} onClick={() => buy(item.id)}>
                {item.caravan !== undefined && <span className="hollow-seasonal">Caravan</span>}
                <ItemArt id={item.id} size={54} />
                <strong>{item.name}</strong>
                <CoinPrice verdict={canBuy(hollow, item.id)} price={item.price} />
              </button>
            ))}
          </div>

          <h3 className="hollow-shelf-title">Mystery eggs</h3>
          <div className="hollow-market-grid hollow-eggs">
            {hollow.market.eggs.map(egg => (
              <button key={egg.id} type="button" className={`hollow-ware egg-${egg.tier}`} disabled={!canBuy(hollow, egg.id).ok} onClick={() => buy(egg.id)}>
                <ItemArt id={egg.id} size={54} />
                <strong>{egg.name}</strong>
                <em className="hollow-egg-note">
                  {egg.tier === "bronze" ? "Hatches a beastie" : egg.tier === "silver" ? "Better chance of rare" : "Always rare or better"}
                </em>
                <CoinPrice verdict={canBuy(hollow, egg.id)} price={egg.price} />
              </button>
            ))}
          </div>

          <div className="den-earn-grid hollow-earn">
            {earnWays.map(way => (
              <div key={way.label} className="den-earn">
                <span aria-hidden="true">{way.icon}</span>
                <strong>{way.label}</strong>
                <em>{way.pays}</em>
              </div>
            ))}
          </div>
        </section>
      )}

      {hatched && (
        <div className="hollow-hatch-overlay" role="dialog" aria-label={`Your egg hatched a ${hatched.name}`}>
          <div className="hollow-hatch-card">
            <span className="hollow-hatch-burst">Your egg hatched!</span>
            <ItemArt id={hatched.id} stage={1} size={110} />
            <h3>{hatched.name}</h3>
            <p>{hatched.rarity === "epic" ? "An EPIC beastie!" : hatched.rarity === "rare" ? "A rare beastie!" : "A new friend for your Hollow."} Feed it berries to help it grow.</p>
            <button type="button" className="hollow-buy" onClick={() => { setHatched(null); setTab("beasties"); }}>
              Meet {hatched.name} →
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
