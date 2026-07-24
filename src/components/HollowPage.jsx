import { useEffect, useMemo, useState } from "react";
import { computeTreasury } from "../utils/treasureTrail.js";
import {
  computeHollow, canBuy, findCatalogItem,
  COIN_RATES, BEASTIES, EXPANSIONS, WELCOME_EGG, CARAVAN_ICONS
} from "../utils/hollowEconomy.js";
import { loadHollowLedger, recordPurchase, recordFeed, saveLayout, markCoinsSeen } from "../utils/hollowState.js";
import { DEN_THEMES, isDenThemeUnlocked } from "../utils/denRewards.js";
import { hollowSpotsFor, getCachedHollowOverride, loadHollowSpotsOverride } from "../data/hollowSpots.js";
import { loadStudentProfile, saveStudentProfile, getCompanion } from "../utils/studentProfile.js";
import { playStarChime } from "../utils/audio/gameSfx.js";
import { CoinIcon, BerryIcon } from "./shared/CurrencyIcons.jsx";

// My Hollow - Rewards V2. A GAME ROOM, not a webpage: one slim top bar
// (title + tabs + wallet) and a stage that fills the rest of the screen.
// Nothing scrolls. The Hollow itself pages sideways between "rooms" (the
// main hollow, each owned expansion, and the next locked one); the Market
// splits into shelves that each fit the stage. Earnings are derived
// (hollowEconomy.js); only spending is stored.

function hideOnError(event) {
  event.currentTarget.style.display = "none";
}

// Emoji stand-ins render behind the real art (which hides itself on error).
const EMOJI = {
  "gear-meadow-crown": "👑", "gear-explorer-pack": "🎒", "gear-acorn-shield": "🛡️",
  "gear-willow-wand": "🪄", "gear-trail-boots": "🥾", "gear-wizard-hat": "🧙",
  "gear-starweave-scarf": "🧣", "gear-moth-wings": "🪽", "gear-dino-helm": "🪖",
  "gear-bone-charm": "🦴", "gear-raptor-wings": "🪽", "gear-petal-hood": "🌸",
  "gear-leaf-cloak": "🍃", "gear-falcon-wings": "🪽",
  "hollow-glow-jar": "🫙", "hollow-mushroom-stool": "🍄", "hollow-moon-lantern": "🏮",
  "hollow-moss-rug": "🧺", "hollow-star-banner": "🚩", "hollow-root-table": "🪵",
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

// Eager by default: these are small webps and the page never scrolls, so
// everything is "above the fold". The fallback is sized in PIXELS from the
// box size (a %-of-font-size fallback rendered as a microscopic emoji).
function ItemArt({ id, stage, size = 52 }) {
  const file = stage ? `${id}-s${stage}` : id;
  return (
    <span className="hollow-art" style={{ width: size, height: size }} aria-hidden="true">
      <span className="hollow-art-emoji" style={{ fontSize: Math.round(size * 0.66) }}>{EMOJI[id] || "✨"}</span>
      <img src={`/images/hollow/${file}.webp`} alt="" onError={hideOnError} />
    </span>
  );
}

function CoinPrice({ verdict, price }) {
  if (verdict.reason === "owned") return <span className="hollow-price owned">Owned ✓</span>;
  if (verdict.reason === "complete") return <span className="hollow-price owned">All hatched ✓</span>;
  if (verdict.ok) return <span className="hollow-price can"><CoinIcon size={15} /> {price}</span>;
  return <span className="hollow-price cant"><CoinIcon size={13} /> {price} · {verdict.short} to go</span>;
}

// Where the trophy/decoration spots sit on each room's painted shelves and
// niches now lives in ../data/hollowSpots.js — defaults there, and an admin can
// drag them into place in the "Hollow Spots" editor (Admin → Hollow Spots).
// Spot ids are unchanged ("s1".."s6" for the main room, "<exp-id>-1".."-4" for
// an expansion) so every child's already-placed items stay where they are.
const ROOM_TINTS = {
  "exp-garden": "rgba(62, 137, 72, 0.30)",
  "exp-pond": "rgba(30, 90, 140, 0.30)",
  "exp-cave": "rgba(91, 75, 138, 0.38)",
  "exp-treetop": "rgba(30, 127, 120, 0.30)"
};

const GEAR_SLOT_LABELS = { head: "Head", neck: "Neck", back: "Back", held: "Held", feet: "Feet" };

/* The dress-up pal. Art comes from tools/generate-pal-avatars.mjs. Each dressed
   image is aligned to the same base pose, so slot masks can reveal the relevant
   part of every equipped variant at once. This keeps a pack, boots, hat, scarf,
   and held item composable without pretending independently generated images
   are pixel-perfect transparent layers.
   Falls back gracefully: missing layer -> base -> portrait.
   Idle animation runs always; tapping the pal spins it in 3D. */
export function PalFigure({ companion, equipped = {} }) {
  const [spinKey, setSpinKey] = useState(0);
  const [baseFailed, setBaseFailed] = useState(false);
  if (!companion) return null;
  const gear = Object.values(equipped)
    .map(findCatalogItem)
    .filter(item => item?.slot);
  const base = `/images/companions/full/${companion.id}.webp`;
  return (
    <button
      type="button"
      key={spinKey}
      className={`hollow-pal-figure${spinKey ? " spin" : ""}`}
      onClick={() => setSpinKey(k => k + 1)}
      aria-label={`${companion.name} - tap to spin`}
    >
      {baseFailed ? (
        <img className="hollow-pal-layer" src={companion.image} alt="" onError={hideOnError} />
      ) : (
        <>
          <img
            className="hollow-pal-layer hollow-pal-base"
            src={base}
            alt=""
            onError={() => setBaseFailed(true)}
          />
          {gear.map(item => (
            <img
              key={item.slot}
              className={`hollow-pal-layer hollow-pal-gear hollow-pal-gear-${item.slot}`}
              data-gear={item.id}
              src={`/images/companions/full/${companion.id}--${item.id}.webp`}
              alt=""
              onError={hideOnError}
            />
          ))}
        </>
      )}
      <span className="hollow-pal-ground" aria-hidden="true" />
    </button>
  );
}

const MARKET_SHELVES = [
  { id: "caravan", label: "Caravan" },
  { id: "gear", label: "Pal gear" },
  { id: "home", label: "For your Hollow" },
  { id: "eggs", label: "Mystery eggs" }
];

export function HollowPage({ studentName, progressScopeKey = "default" }) {
  const scope = progressScopeKey;
  const [ledgerVersion, setLedgerVersion] = useState(0);
  // Cloud progress hydrates AFTER mount; recompute the wallet when it lands
  // so a fresh device never shows (or spends against) a stale coin count.
  const [hydrationTick, setHydrationTick] = useState(0);
  const treasury = useMemo(() => {
    void hydrationTick; // recompute when cloud progress hydrates (effect below)
    return computeTreasury(scope);
  }, [scope, hydrationTick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- ledgerVersion re-reads after every purchase/feed/layout change
  const ledger = useMemo(() => loadHollowLedger(scope), [scope, ledgerVersion]);
  const hollow = useMemo(() => computeHollow(ledger, treasury.breakdown), [ledger, treasury]);
  const companion = useMemo(() => getCompanion(scope), [scope]);
  const [tab, setTab] = useState("hollow");
  const [roomIndex, setRoomIndex] = useState(0);
  const [shelf, setShelf] = useState("caravan");
  const [pickingSpot, setPickingSpot] = useState(null);
  const [pickingWorld, setPickingWorld] = useState(false);
  const [hatched, setHatched] = useState(null);
  const [theme, setTheme] = useState(() => loadStudentProfile(scope).denTheme || "meadow");
  // Admin-placed spot positions (Admin → Hollow Spots). Cached first so the
  // room never renders with the wrong spots for a frame, then refreshed.
  const [spotOverride, setSpotOverride] = useState(() => getCachedHollowOverride());

  useEffect(() => {
    let alive = true;
    loadHollowSpotsOverride().then(ov => { if (alive) setSpotOverride(ov); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    function handleHydrated(event) {
      if (event.detail?.studentId && event.detail.studentId !== scope) return;
      setHydrationTick(tick => tick + 1);
    }
    window.addEventListener("lp-progress-hydrated", handleHydrated);
    return () => window.removeEventListener("lp-progress-hydrated", handleHydrated);
  }, [scope]);

  // Visiting the Hollow "collects" the home-page coin pop-up.
  useEffect(() => {
    markCoinsSeen(scope, hollow.coinsEarnedTotal);
  }, [scope, hollow.coinsEarnedTotal]);

  const refresh = () => setLedgerVersion(v => v + 1);

  function grant(item) {
    // Idempotent for one-time gifts: a fast double-tap on "Crack it open!"
    // must not grant two welcome eggs.
    if (item?.id === WELCOME_EGG.id
      && loadHollowLedger(scope).purchases?.some(p => p?.item === WELCOME_EGG.id)) {
      refresh();
      return;
    }
    const before = new Set(hollow.beasties.map(b => b.id));
    const purchase = recordPurchase(scope, item, treasury.breakdown);
    if (!purchase) {
      refresh();
      return;
    }
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
    const recorded = recordFeed(scope, speciesId, treasury.breakdown);
    if (!recorded) {
      refresh();
      return;
    }
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
    if (!isDenThemeUnlocked(next, treasury.gems)) return;
    setTheme(next.id);
    setPickingWorld(false);
    const profile = loadStudentProfile(scope);
    saveStudentProfile(scope, { ...profile, denTheme: next.id });
  }

  const activeTheme = DEN_THEMES.find(t => t.id === theme && isDenThemeUnlocked(t, treasury.gems)) || DEN_THEMES[0];
  const placedIds = new Set(Object.values(hollow.slots));
  const placeable = hollow.ownedHollowItems.filter(i => !placedIds.has(i.id));
  const nextExpansion = EXPANSIONS.find(e => !hollow.ownedIds.has(e.id));
  const residents = hollow.beasties.filter(b => b.growth.stage === 3);
  const hungry = hollow.beasties.filter(b => b.growth.next && hollow.berries > 0).length;
  const welcomeEggWaiting = !ledger.purchases.some(p => p?.item === WELCOME_EGG.id);
  const season = hollow.market.season;
  const caravanIcon = CARAVAN_ICONS[season.caravan] || "🌙";
  const caravanWares = [...hollow.market.gear, ...hollow.market.hollow].filter(i => i.caravan !== undefined);
  const everydayGear = hollow.market.gear.filter(i => i.caravan === undefined);
  const everydayHollow = hollow.market.hollow.filter(i => i.caravan === undefined);
  const gearShopPreview = [...hollow.market.gear].sort((a, b) => a.price - b.price).slice(0, 3);

  // The rooms a child can page through: main hollow, each owned expansion,
  // then the next locked expansion as a "door" with its price.
  const rooms = [
    {
      kind: "open", id: "main", name: "The Hollow",
      image: `url(/images/hollow/scene-${activeTheme.id}.webp), url(${activeTheme.art})`,
      tint: null,
      spots: hollowSpotsFor(activeTheme.id, spotOverride)
        .map(([x, y], index) => ({ id: `s${index + 1}`, x, y, spotId: `s${index + 1}` }))
    },
    ...hollow.ownedExpansions.map(exp => ({
      kind: "open", id: exp.id, name: exp.name,
      image: `url(/images/hollow/band-${exp.id.slice(4)}.webp), url(${activeTheme.art})`,
      tint: ROOM_TINTS[exp.id] || null,
      spots: hollowSpotsFor(exp.id, spotOverride)
        .map(([x, y], index) => ({ x, y, spotId: `${exp.id}-${index + 1}` }))
    })),
    ...(nextExpansion ? [{
      kind: "locked", id: nextExpansion.id, name: nextExpansion.name,
      image: `url(/images/hollow/band-${nextExpansion.id.slice(4)}.webp), url(${activeTheme.art})`,
      expansion: nextExpansion
    }] : [])
  ];
  const room = rooms[Math.min(roomIndex, rooms.length - 1)];
  const recommendedSpotId = room?.kind === "open"
    ? room.spots.find(spot => !hollow.slots[spot.spotId])?.spotId || ""
    : "";

  const earnWays = [
    { icon: "⭐", label: "Quest star", pays: `${COIN_RATES.questStar}` },
    { icon: "🎮", label: "Game star", pays: `${COIN_RATES.gameStar}` },
    { icon: "📖", label: "Book", pays: `${COIN_RATES.bookRead} + 🫐` },
    { icon: "🗺️", label: "Story quest", pays: `${COIN_RATES.storyQuest} + 🫐🫐` },
    { icon: "🧰", label: "All 3 daily tasks", pays: `${COIN_RATES.dailyChest}` }
  ];

  function renderSpot(spot) {
    const itemId = hollow.slots[spot.spotId];
    const item = itemId ? findCatalogItem(itemId) : null;
    const style = { left: `${spot.x}%`, top: `${spot.y}%` };
    if (item) {
      return (
        <button key={spot.spotId} type="button" className="hollow-spot filled" style={style} title={`Put away ${item.name}`} onClick={() => placeItem(spot.spotId, "")}>
          <ItemArt id={item.id} size={86} />
          <span className="hollow-spot-name">{item.name}</span>
        </button>
      );
    }
    return (
      <button
        key={spot.spotId}
        type="button"
        className={`hollow-spot empty${spot.spotId === recommendedSpotId ? " recommended" : ""}`}
        style={style}
        aria-label={spot.spotId === recommendedSpotId
          ? "Empty spot - add something. Recommended next."
          : "Empty spot - add something"}
        onClick={() => setPickingSpot({ id: spot.spotId, x: spot.x, y: spot.y })}
        data-child-primary={spot.spotId === recommendedSpotId ? "" : undefined}
      >
        ＋
      </button>
    );
  }

  function renderPicker() {
    if (!pickingSpot) return null;
    const style = {
      left: `${Math.min(70, Math.max(16, pickingSpot.x))}%`,
      top: pickingSpot.y > 50 ? `${pickingSpot.y - 32}%` : `${pickingSpot.y + 20}%`
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

  function renderWare(item) {
    return (
      <button key={item.id} type="button" className="hollow-ware" disabled={!canBuy(hollow, item.id).ok} onClick={() => buy(item.id)}>
        <ItemArt id={item.id} size={62} />
        <strong>{item.name}</strong>
        <CoinPrice verdict={canBuy(hollow, item.id)} price={item.price} />
      </button>
    );
  }

  return (
    <main className="hollow-page" data-pal-world={activeTheme.id} data-child-surface="my-hollow">
      <header className="hollow-topbar">
        {/* Global student back circle sits top-left; keep the corner clear. */}
        <h1 className="hollow-title" data-child-title="">{studentName ? `${studentName}'s Hollow` : "My Hollow"}</h1>
        <nav className="hollow-tabs" aria-label="Hollow areas" data-child-choices="">
          {[
            { id: "hollow", label: "My Hollow" },
            { id: "pal", label: "My Pal" },
            { id: "beasties", label: "Beasties", note: welcomeEggWaiting ? "gift!" : hungry ? `${hungry} hungry` : "" },
            { id: "market", label: "Market", note: caravanIcon }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              className={`hollow-tab${tab === t.id ? " active" : ""}`}
              aria-pressed={tab === t.id}
              onClick={() => { setTab(t.id); setPickingSpot(null); setPickingWorld(false); }}
            >
              {t.label}{t.note ? <span className="hollow-tab-note">{t.note}</span> : null}
            </button>
          ))}
        </nav>
        <span className="hollow-wallet" aria-label={`${hollow.coins} coins and ${hollow.berries} berries`} data-child-progress="">
          <strong className="hollow-wallet-coins"><CoinIcon size={20} /> {hollow.coins}</strong>
          <em className="hollow-wallet-berries"><BerryIcon size={17} /> {hollow.berries}</em>
        </span>
      </header>

      <section className="hollow-stage">
        {tab === "hollow" && room && (
          <div className="hollow-room-frame">
            {room.kind === "open" ? (
              <div className="hollow-room" style={{ backgroundImage: room.image }}>
                {room.tint && <span className="hollow-room-tint" style={{ background: room.tint }} aria-hidden="true" />}
                <span className="hollow-room-name">{room.id === "main" ? "🌳" : EMOJI[room.id]} {room.name}</span>
                {room.spots.map(renderSpot)}
                {room.id === "main" && residents.map((b, index) => (
                  <span key={b.id} className="hollow-resident" style={{ left: `${18 + index * 16}%`, top: "90%" }} title={`${b.name} lives here`}>
                    <ItemArt id={b.id} stage={3} size={72} />
                  </span>
                ))}
                {renderPicker()}
                <p className="hollow-room-hint" data-child-instruction="">Tap a glowing spot to place something you own. Tap a placed thing to put it away.</p>
                <button
                  type="button"
                  className="hollow-world-button"
                  onClick={() => setPickingWorld(v => !v)}
                  data-child-primary={!recommendedSpotId ? "" : undefined}
                >
                  🌍 World
                </button>
                {pickingWorld && (
                  <div className="hollow-world-pop" role="dialog" aria-label="Choose your world">
                    {DEN_THEMES.map(world => {
                      const unlocked = isDenThemeUnlocked(world, treasury.gems);
                      return (
                        <button key={world.id} type="button" disabled={!unlocked} className={`hollow-world-thumb${activeTheme.id === world.id ? " active" : ""}`} onClick={() => chooseTheme(world)}>
                          <img src={world.art} alt="" onError={hideOnError} />
                          <span>{unlocked ? world.name : `${world.name} · ${world.at} gems`}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="hollow-room locked" style={{ backgroundImage: room.image }}>
                <div className="hollow-room-lock">
                  <span className="hollow-room-lock-icon" aria-hidden="true">{EMOJI[room.id]}</span>
                  <strong>{room.name}</strong>
                  <span>A whole new part of your Hollow, with {room.expansion.slots} more spots.</span>
                  <button type="button" className="hollow-buy" disabled={!canBuy(hollow, room.expansion.id).ok} onClick={() => { buy(room.expansion.id); }}>
                    <CoinPrice verdict={canBuy(hollow, room.expansion.id)} price={room.expansion.price} />
                  </button>
                </div>
              </div>
            )}

            {rooms.length > 1 && (
              <>
                <button
                  type="button"
                  className="hollow-room-arrow left"
                  disabled={roomIndex === 0}
                  aria-label="Previous place"
                  onClick={() => { setRoomIndex(i => Math.max(0, i - 1)); setPickingSpot(null); }}
                >‹</button>
                <button
                  type="button"
                  className="hollow-room-arrow right"
                  disabled={roomIndex >= rooms.length - 1}
                  aria-label={roomIndex + 1 < rooms.length ? `Go to ${rooms[roomIndex + 1].name}` : "No more places"}
                  onClick={() => { setRoomIndex(i => Math.min(rooms.length - 1, i + 1)); setPickingSpot(null); }}
                >›</button>
                <div className="hollow-room-dots" aria-hidden="true">
                  {rooms.map((r, index) => (
                    <span key={r.id} className={index === roomIndex ? "on" : ""}>{r.kind === "locked" ? "🔒" : ""}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === "pal" && (
          <div className="hollow-panel">
            <div className="hollow-pal-row">
              <div className="hollow-pal-stage">
                <PalFigure companion={companion} equipped={hollow.equipped} />
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
                      <ItemArt id={gear.id} size={52} />
                      <strong>{gear.name}</strong>
                      <em>{worn ? "Wearing ✓" : GEAR_SLOT_LABELS[gear.slot] || gear.slot}</em>
                    </button>
                  );
                })}
                {hollow.ownedGear.length === 0 && gearShopPreview.map(gear => (
                  <button key={gear.id} type="button" className="hollow-gear preview" onClick={() => { setTab("market"); setShelf("gear"); }}>
                    <ItemArt id={gear.id} size={52} />
                    <strong>{gear.name}</strong>
                    <CoinPrice verdict={canBuy(hollow, gear.id)} price={gear.price} />
                    <em>In the Market now →</em>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "beasties" && (
          <div className="hollow-panel">
            <p className="hollow-hint">Berries come from reading. Feed a beastie to grow it: Baby → Young → Grand. Grand beasties move into your Hollow.</p>

            {welcomeEggWaiting && (
              <div className="hollow-welcome-egg">
                <ItemArt id="egg-welcome" size={58} />
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
                  <ItemArt id={b.id} stage={b.growth.stage} size={64} />
                  <strong>{b.name}</strong>
                  <em>{b.growth.name}{b.growth.next ? ` · ${b.growth.feedsToNext} more to grow` : " · fully grown!"}</em>
                  <span className="hollow-meter" role="progressbar" aria-valuemin={0} aria-valuemax={8} aria-valuenow={Math.min(8, b.growth.feeds)}>
                    <span style={{ width: `${Math.min(100, (b.growth.feeds / 8) * 100)}%` }} />
                  </span>
                  {b.growth.next ? (
                    <button type="button" className="hollow-buy small" disabled={hollow.berries < 1} onClick={() => feed(b.id)}>
                      {hollow.berries < 1 ? "Read to earn berries" : <>Feed <BerryIcon size={14} /></>}
                    </button>
                  ) : (
                    <span className="hollow-price owned">In your Hollow ✓</span>
                  )}
                </div>
              ))}
              {BEASTIES.filter(species => !hollow.beasties.some(b => b.id === species.id)).map(species => (
                <div key={species.id} className="hollow-beastie mystery">
                  <span className="hollow-silhouette"><ItemArt id={species.id} stage={1} size={56} /></span>
                  <strong>? ? ?</strong>
                  <em>{species.rarity === "epic" ? "Gold egg only" : species.rarity === "rare" ? "Silver or gold egg" : "Any egg"}</em>
                </div>
              ))}
            </div>
            <button type="button" className="hollow-buy hollow-market-cta" onClick={() => { setTab("market"); setShelf("eggs"); }}>
              Get an egg at the Market →
            </button>
          </div>
        )}

        {tab === "market" && (
          <div className="hollow-panel hollow-market">
            <div className="hollow-market-top">
              <div className="hollow-shelf-tabs">
                {MARKET_SHELVES.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className={`hollow-shelf-tab${shelf === s.id ? " active" : ""}`}
                    aria-pressed={shelf === s.id}
                    onClick={() => setShelf(s.id)}
                  >
                    {s.id === "caravan" ? `${caravanIcon} ` : ""}{s.label}
                  </button>
                ))}
              </div>
              {shelf === "caravan" && (
                <span className="hollow-caravan-note">{season.name} is in town for {season.daysLeft} more day{season.daysLeft === 1 ? "" : "s"}!</span>
              )}
            </div>

            {shelf === "caravan" && (
              <div className="hollow-shelf hollow-caravan-shelf">
                <div className="hollow-merchant">
                  <ItemArt id="market-merchant" size={92} />
                  <span>New things on this shelf, then the caravan moves on!</span>
                </div>
                <div className="hollow-market-grid">
                  {caravanWares.map(renderWare)}
                </div>
              </div>
            )}
            {shelf === "gear" && (
              <div className="hollow-shelf">
                <div className="hollow-market-grid">{everydayGear.map(renderWare)}</div>
              </div>
            )}
            {shelf === "home" && (
              <div className="hollow-shelf">
                <div className="hollow-market-grid">{everydayHollow.map(renderWare)}</div>
              </div>
            )}
            {shelf === "eggs" && (
              <div className="hollow-shelf">
                <div className="hollow-market-grid hollow-eggs">
                  {hollow.market.eggs.map(egg => (
                    <button key={egg.id} type="button" className={`hollow-ware egg-${egg.tier}`} disabled={!canBuy(hollow, egg.id).ok} onClick={() => buy(egg.id)}>
                      <ItemArt id={egg.id} size={84} />
                      <strong>{egg.name}</strong>
                      <em className="hollow-egg-note">
                        {egg.tier === "bronze" ? "Hatches a beastie" : egg.tier === "silver" ? "Better chance of rare" : "Always rare or better"}
                      </em>
                      <CoinPrice verdict={canBuy(hollow, egg.id)} price={egg.price} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="hollow-earn-row" aria-label="How to earn coins">
              <span className="hollow-earn-title">Earn coins:</span>
              {earnWays.map(way => (
                <span key={way.label} className="hollow-earn-chip" title={way.label}>
                  <span aria-hidden="true">{way.icon}</span> {way.label} <strong><CoinIcon size={13} /> {way.pays}</strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

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
