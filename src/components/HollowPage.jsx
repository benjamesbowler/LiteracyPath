import { useEffect, useMemo, useState } from "react";
import { computeTreasury } from "../utils/treasureTrail.js";
import {
  computeHollow, canBuy, findCatalogItem,
  COIN_RATES, BEASTIES, EXPANSIONS, WELCOME_EGG, CARAVAN_ICONS
} from "../utils/hollowEconomy.js";
import { loadHollowLedger, recordPurchase, recordFeed, saveLayout, markCoinsSeen } from "../utils/hollowState.js";
import { DEN_THEMES } from "../utils/denRewards.js";
import { loadStudentProfile, saveStudentProfile, getCompanion } from "../utils/studentProfile.js";
import { playStarChime } from "../utils/audio/gameSfx.js";
import { CoinIcon, BerryIcon } from "./shared/CurrencyIcons.jsx";

// My Hollow - Rewards V2 (replaces the Treasure Den). One place the child
// OWNS: a fantasy hollow scene they decorate, a pal they dress, beasties they
// hatch and grow by reading, and a Market to spend every coin earned anywhere.
// Earnings are derived (hollowEconomy.js); only spending is stored.

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
  "egg-bronze": "🥚", "egg-silver": "🥚", "egg-gold": "🥚", "egg-welcome": "🎁",
  "market-merchant": "🦡",
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

// Affordability lives ONLY here - item art always stays full colour.
function CoinPrice({ verdict, price }) {
  if (verdict.reason === "owned") return <span className="hollow-price owned">Owned ✓</span>;
  if (verdict.ok) return <span className="hollow-price can"><CoinIcon size={15} /> {price}</span>;
  return <span className="hollow-price cant"><CoinIcon size={13} /> {price} · {verdict.short} to go</span>;
}

// Organic placement spots (percent coordinates inside each scene band).
const MAIN_SPOTS = [
  { id: "s1", x: 10, y: 66 }, { id: "s2", x: 25, y: 42 }, { id: "s3", x: 41, y: 70 },
  { id: "s4", x: 57, y: 40 }, { id: "s5", x: 73, y: 66 }, { id: "s6", x: 88, y: 44 }
];
const BAND_SPOT_OFFSETS = [{ x: 14, y: 58 }, { x: 38, y: 42 }, { x: 62, y: 60 }, { x: 86, y: 46 }];
const BAND_TINTS = {
  "exp-garden": "rgba(62, 137, 72, 0.42)",
  "exp-pond": "rgba(30, 90, 140, 0.42)",
  "exp-cave": "rgba(91, 75, 138, 0.5)",
  "exp-treetop": "rgba(30, 127, 120, 0.42)"
};

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
  const [pickingSpot, setPickingSpot] = useState(null);
  const [hatched, setHatched] = useState(null);
  const [theme, setTheme] = useState(() => loadStudentProfile(scope).denTheme || "meadow");

  // Visiting the Hollow "collects" the home-page coin pop-up.
  useEffect(() => {
    markCoinsSeen(scope, hollow.coinsEarnedTotal);
  }, [scope, hollow.coinsEarnedTotal]);

  const refresh = () => setLedgerVersion(v => v + 1);

  function grant(item) {
    const before = new Set(hollow.beasties.map(b => b.id));
    recordPurchase(scope, item);
    playStarChime();
    if (item.id.startsWith("egg-")) {
      const next = computeHollow(loadHollowLedger(scope), treasury.breakdown);
      setHatched(next.beasties.find(b => !before.has(b.id)) || next.beasties[0] || null);
    }
    refresh();
  }

  function buy(itemId) {
    const verdict = canBuy(hollow, itemId);
    if (!verdict.ok) return;
    grant(verdict.item);
  }

  function feed(speciesId) {
    if (hollow.berries < 1) return;
    recordFeed(scope, speciesId);
    playStarChime();
    refresh();
  }

  function placeItem(spotId, itemId) {
    const slots = { ...hollow.slots };
    if (itemId) slots[spotId] = itemId;
    else delete slots[spotId];
    saveLayout(scope, { equipped: hollow.equipped, slots });
    setPickingSpot(null);
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
  const placedIds = new Set(Object.values(hollow.slots));
  const placeable = hollow.ownedHollowItems.filter(i => !placedIds.has(i.id));
  const nextExpansion = EXPANSIONS.find(e => !hollow.ownedIds.has(e.id));
  const residents = hollow.beasties.filter(b => b.growth.stage === 3);
  const hungry = hollow.beasties.filter(b => b.growth.next && hollow.berries > 0).length;
  const season = hollow.market.season;
  const caravanIcon = CARAVAN_ICONS[season.caravan] || "🌙";
  const caravanGear = hollow.market.gear.filter(i => i.caravan !== undefined);
  const caravanHollow = hollow.market.hollow.filter(i => i.caravan !== undefined);
  const everydayGear = hollow.market.gear.filter(i => i.caravan === undefined);
  const everydayHollow = hollow.market.hollow.filter(i => i.caravan === undefined);
  const welcomeEggWaiting = !ledger.purchases.some(p => p?.item === WELCOME_EGG.id);
  const gearShopPreview = [...hollow.market.gear].sort((a, b) => a.price - b.price).slice(0, 3);

  const earnWays = [
    { icon: "⭐", label: "Win a quest star", pays: `${COIN_RATES.questStar} coins` },
    { icon: "🎮", label: "Win a game star", pays: `${COIN_RATES.gameStar} coins` },
    { icon: "📖", label: "Read a book", pays: `${COIN_RATES.bookRead} coins + 1 berry` },
    { icon: "🗺️", label: "Finish a story quest", pays: `${COIN_RATES.storyQuest} coins + 2 berries` },
    { icon: "🧰", label: "Finish all 3 daily tasks", pays: `${COIN_RATES.dailyChest} coin chest` }
  ];

  // One scene band per area: the main hollow plus each owned expansion, then
  // the next locked expansion rendered as its own dark "unfurl me" band.
  function renderSpot(spot, spotId) {
    const itemId = hollow.slots[spotId];
    const item = itemId ? findCatalogItem(itemId) : null;
    const style = { left: `${spot.x}%`, top: `${spot.y}%` };
    if (item) {
      return (
        <button key={spotId} type="button" className="hollow-spot filled" style={style} title={`Put away ${item.name}`} onClick={() => placeItem(spotId, "")}>
          <ItemArt id={item.id} size={68} />
          <span className="hollow-spot-name">{item.name}</span>
        </button>
      );
    }
    return (
      <button
        key={spotId}
        type="button"
        className="hollow-spot empty"
        style={style}
        aria-label="Empty spot - add something"
        onClick={() => setPickingSpot({ id: spotId, x: spot.x, y: spot.y })}
      >
        ＋
      </button>
    );
  }

  function renderPicker() {
    if (!pickingSpot) return null;
    const style = {
      left: `${Math.min(72, Math.max(14, pickingSpot.x))}%`,
      top: pickingSpot.y > 50 ? `${pickingSpot.y - 34}%` : `${pickingSpot.y + 22}%`
    };
    return (
      <div className="hollow-picker" style={style} role="dialog" aria-label="Choose something to place">
        {placeable.length === 0
          ? <p className="hollow-picker-empty">Nothing left to place - the Market has plenty!</p>
          : placeable.map(item => (
            <button key={item.id} type="button" className="hollow-pick" title={item.name} onClick={() => placeItem(pickingSpot.id, item.id)}>
              <ItemArt id={item.id} size={52} />
              <span>{item.name}</span>
            </button>
          ))}
        <button type="button" className="hollow-pick cancel" onClick={() => setPickingSpot(null)}>✕</button>
      </div>
    );
  }

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
          <strong className="hollow-wallet-coins"><CoinIcon size={22} /> {hollow.coins}</strong>
          <em className="hollow-wallet-berries"><BerryIcon size={19} /> {hollow.berries}</em>
        </span>
      </header>

      <nav className="hollow-tabs" aria-label="Hollow areas">
        {[
          { id: "hollow", label: "My Hollow" },
          { id: "pal", label: "My Pal" },
          { id: "beasties", label: "Beasties", note: welcomeEggWaiting ? "gift!" : hungry ? `${hungry} hungry` : "" },
          { id: "market", label: "Market", note: `${caravanIcon} in town` }
        ].map(t => (
          <button
            key={t.id}
            type="button"
            className={`hollow-tab${tab === t.id ? " active" : ""}`}
            aria-pressed={tab === t.id}
            onClick={() => { setTab(t.id); setPickingSpot(null); }}
          >
            {t.label}{t.note ? <span className="hollow-tab-note">{t.note}</span> : null}
          </button>
        ))}
      </nav>

      {tab === "hollow" && (
        <section className="den-card" aria-label="Your hollow">
          <h2>🌳 Your Hollow</h2>
          <p className="hollow-hint">Tap a glowing spot to place something you own. Tap a placed thing to put it away.</p>

          <div className="hollow-scene" style={{ backgroundImage: `url(/images/hollow/scene-${activeTheme.id}.webp), url(${activeTheme.art})` }}>
            {MAIN_SPOTS.map(spot => renderSpot(spot, spot.id))}
            {residents.map((b, index) => (
              <span key={b.id} className="hollow-resident" style={{ left: `${18 + index * 16}%`, top: "88%" }} title={`${b.name} lives here`}>
                <ItemArt id={b.id} stage={3} size={62} />
              </span>
            ))}
            {renderPicker()}
          </div>

          {hollow.ownedExpansions.map(exp => (
            <div key={exp.id} className="hollow-band" style={{ backgroundImage: `url(/images/hollow/band-${exp.id.slice(4)}.webp), url(${activeTheme.art})` }}>
              <span className="hollow-band-tint" style={{ background: BAND_TINTS[exp.id] || "rgba(16,24,32,0.35)" }} aria-hidden="true" />
              <span className="hollow-band-name">{EMOJI[exp.id]} {exp.name}</span>
              {BAND_SPOT_OFFSETS.map((offset, index) => renderSpot(offset, `${exp.id}-${index + 1}`))}
            </div>
          ))}

          {nextExpansion && (
            <div className="hollow-band locked">
              <div className="hollow-band-lock">
                <strong>{EMOJI[nextExpansion.id]} {nextExpansion.name}</strong>
                <span>A whole new part of your Hollow, with {nextExpansion.slots} more spots.</span>
                <button type="button" className="hollow-buy" disabled={!canBuy(hollow, nextExpansion.id).ok} onClick={() => buy(nextExpansion.id)}>
                  <CoinPrice verdict={canBuy(hollow, nextExpansion.id)} price={nextExpansion.price} />
                </button>
              </div>
            </div>
          )}

          <div className="hollow-worlds-row">
            <span className="hollow-worlds-label">Your world:</span>
            {DEN_THEMES.map(world => (
              <button
                key={world.id}
                type="button"
                className={`hollow-world-thumb${activeTheme.id === world.id ? " active" : ""}`}
                aria-pressed={activeTheme.id === world.id}
                onClick={() => chooseTheme(world)}
              >
                <img src={world.art} alt="" onError={hideOnError} />
                <span>{world.name}</span>
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
              {hollow.ownedGear.map(gear => {
                const worn = hollow.equipped[gear.slot] === gear.id;
                return (
                  <button key={gear.id} type="button" className={`hollow-gear${worn ? " worn" : ""}`} onClick={() => toggleGear(gear)}>
                    <ItemArt id={gear.id} size={48} />
                    <strong>{gear.name}</strong>
                    <em>{worn ? "Wearing ✓" : GEAR_SLOT_LABELS[gear.slot] || gear.slot}</em>
                  </button>
                );
              })}
              {hollow.ownedGear.length === 0 && gearShopPreview.map(gear => (
                <button key={gear.id} type="button" className="hollow-gear preview" onClick={() => setTab("market")}>
                  <ItemArt id={gear.id} size={48} />
                  <strong>{gear.name}</strong>
                  <CoinPrice verdict={canBuy(hollow, gear.id)} price={gear.price} />
                  <em>In the Market now →</em>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === "beasties" && (
        <section className="den-card" aria-label="Your beasties">
          <h2>🐾 Beasties</h2>
          <p className="hollow-hint">
            Berries come from reading. Feed a beastie to grow it: Baby → Young → Grand. Grand beasties move into your Hollow.
          </p>

          {welcomeEggWaiting && (
            <div className="hollow-welcome-egg">
              <ItemArt id="egg-welcome" size={64} />
              <div>
                <strong>A welcome gift from the Market!</strong>
                <span>Your very first egg, free. Something is moving inside…</span>
              </div>
              <button type="button" className="hollow-buy" onClick={() => grant(WELCOME_EGG)}>Crack it open!</button>
            </div>
          )}

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
                    {hollow.berries < 1 ? "Read to earn berries" : <>Feed <BerryIcon size={15} /></>}
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
            <span className="hollow-caravan-icon" aria-hidden="true">
              <ItemArt id="market-merchant" size={58} />
            </span>
            <div>
              <strong>{season.name} is in town!</strong>
              <span>New things on this shelf for {season.daysLeft} more day{season.daysLeft === 1 ? "" : "s"} - then the caravan moves on.</span>
            </div>
          </div>
          <div className="hollow-market-grid hollow-caravan-shelf">
            {[...caravanGear, ...caravanHollow].map(item => (
              <button key={item.id} type="button" className="hollow-ware" disabled={!canBuy(hollow, item.id).ok} onClick={() => buy(item.id)}>
                <span className="hollow-seasonal">{caravanIcon}</span>
                <ItemArt id={item.id} size={54} />
                <strong>{item.name}</strong>
                <CoinPrice verdict={canBuy(hollow, item.id)} price={item.price} />
              </button>
            ))}
          </div>

          <h3 className="hollow-shelf-title">Pal gear</h3>
          <div className="hollow-market-grid">
            {everydayGear.map(item => (
              <button key={item.id} type="button" className="hollow-ware" disabled={!canBuy(hollow, item.id).ok} onClick={() => buy(item.id)}>
                <ItemArt id={item.id} size={54} />
                <strong>{item.name}</strong>
                <CoinPrice verdict={canBuy(hollow, item.id)} price={item.price} />
              </button>
            ))}
          </div>

          <h3 className="hollow-shelf-title">For your Hollow</h3>
          <div className="hollow-market-grid">
            {everydayHollow.map(item => (
              <button key={item.id} type="button" className="hollow-ware" disabled={!canBuy(hollow, item.id).ok} onClick={() => buy(item.id)}>
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
