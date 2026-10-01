import { useEffect, useMemo, useRef, useState } from "react";
import { computeTreasury } from "../utils/treasureTrail.js";
import {
  computeHollow, canBuy, findCatalogItem,
  EXPANSIONS, WELCOME_EGG
} from "../utils/hollowEconomy.js";
import { loadHollowLedger, recordPurchase, recordFeed, saveLayout, markCoinsSeen } from "../utils/hollowState.js";
import { DEN_THEMES, isDenThemeUnlocked } from "../utils/denRewards.js";
import { hollowSpotsFor, getCachedHollowOverride, loadHollowSpotsOverride } from "../data/hollowSpots.js";
import {
  changeLittleLiteracyGuide,
  COMPANIONS,
  getAvailableGuideStars,
  getCompanion,
  LITTLE_LITERACY_GUIDE_CHANGE_COST,
  loadStudentProfile,
  saveStudentProfile
} from "../utils/studentProfile.js";
import { playStarChime } from "../utils/audio/gameSfx.js";
import { CoinIcon, BerryIcon } from "./shared/CurrencyIcons.jsx";
import { BookOpenText, SpeakerHigh } from "@phosphor-icons/react";
import { lockedItemAffordance } from "../policy/lockedItemAffordance.js";
import { hollowNextAction } from "../policy/hollowNextActionPolicy.js";
import { speakStudentRailLabel } from "../policy/studentRailPolicy.js";

// My Hollow - Rewards V2. Decoration scenes remain fitted to their stage.
// The full owned collections and shop use natural cards and native scrolling.
// The Decorate view moves sideways between rooms (the main hollow, each owned
// expansion, and the next locked one). Earnings are derived
// (hollowEconomy.js); only spending is stored.

function hideOnError(event) {
  event.currentTarget.style.display = "none";
}

// These small webps render the same authored object or creature wherever it is
// chosen or placed. The fallback is sized from the image box in pixels.
function ItemArt({ id, stage, size = 52 }) {
  const artId = id === WELCOME_EGG.id ? "egg-bronze" : id;
  const file = stage ? `${artId}-s${stage}` : artId;
  return (
    <span className="hollow-art" style={{ width: size, height: size }} aria-hidden="true">
      <span className="hollow-art-fallback" data-art-id={id} />
      <img src={`/images/hollow/${file}.webp`} alt="" onError={hideOnError} />
    </span>
  );
}

function ChevronGlyph({ direction = "right" }) {
  return (
    <svg className="hollow-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={direction === "left" ? "M14.5 5 7.5 12l7 7" : "m9.5 5 7 7-7 7"} />
    </svg>
  );
}

function CoinPrice({ verdict, price }) {
  if (verdict.reason === "owned") return <span className="hollow-price owned">Owned ✓</span>;
  if (verdict.reason === "complete") return <span className="hollow-price owned">All hatched ✓</span>;
  const balance = Math.max(0, Number(price) - (Number(verdict.short) || 0));
  const affordance = lockedItemAffordance({ cost: price, balance });
  if (verdict.ok) {
    return (
      <span className="hollow-price can" aria-label={affordance.priceText}>
        <CoinIcon size={15} /> {affordance.priceText}
      </span>
    );
  }
  return (
    <span
      className="hollow-price cant"
      data-locked-item="hollow-market"
      data-shortfall={affordance.shortfall}
    >
      <CoinIcon size={15} />
      <span>{affordance.text}</span>
    </span>
  );
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
  { id: "home", label: "Decorations" },
  { id: "gear", label: "Guide gear" },
  { id: "eggs", label: "Eggs" },
  { id: "caravan", label: "Specials" }
];

export function HollowPage({ studentName, progressScopeKey = "default", onOpenBooks }) {
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
  const ledger = useMemo(() => { void hydrationTick; return loadHollowLedger(scope); }, [scope, ledgerVersion, hydrationTick]);
  const hollow = useMemo(() => computeHollow(ledger, treasury.breakdown), [ledger, treasury]);
  const [companion, setCompanionState] = useState(() => getCompanion(scope));
  const [tab, setTab] = useState("hollow");
  const [decorating, setDecorating] = useState(false);
  const [pendingItem, setPendingItem] = useState("");
  const [notice, setNotice] = useState("");
  const [roomIndex, setRoomIndex] = useState(0);
  const [shelf, setShelf] = useState("home");
  const [pickingSpot, setPickingSpot] = useState(null);
  const pickerRef = useRef(null);
  const pickerTriggerRef = useRef(null);
  const [pickingWorld, setPickingWorld] = useState(false);
  const [hatched, setHatched] = useState(null);
  const [guidePickerOpen, setGuidePickerOpen] = useState(false);
  const [guideNotice, setGuideNotice] = useState("");
  const [speechStatus, setSpeechStatus] = useState("");
  const [theme, setTheme] = useState(() => loadStudentProfile(scope).denTheme || "meadow");
  // Admin-placed spot positions (Admin → Hollow Spots). Cached first so the
  // room never renders with the wrong spots for a frame, then refreshed.
  const [spotOverride, setSpotOverride] = useState(() => getCachedHollowOverride());

  useEffect(() => {
    if (!hatched) return;
    const timer = window.setTimeout(() => setHatched(null), 4000);
    return () => window.clearTimeout(timer);
  }, [hatched]);

  function closePlacementPicker() {
    setPickingSpot(null);
  }

  useEffect(() => {
    let alive = true;
    loadHollowSpotsOverride().then(ov => { if (alive) setSpotOverride(ov); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    function handleHydrated(event) {
      if (event.detail?.studentId && event.detail.studentId !== scope) return;
      setCompanionState(getCompanion(scope));
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
  const guideStarsEarned =
    (Number(treasury.breakdown?.questStars) || 0)
    + (Number(treasury.breakdown?.gameStars) || 0)
    + (Number(treasury.breakdown?.soundSeekerStars) || 0);
  const guideStarsAvailable = getAvailableGuideStars(scope, guideStarsEarned);

  function chooseGuide(companionId) {
    const result = changeLittleLiteracyGuide(scope, companionId, {
      earnedStars: guideStarsEarned
    });
    if (!result.ok) {
      setGuideNotice(`Earn ${result.short} more star${result.short === 1 ? "" : "s"} to change your guide.`);
      return;
    }
    setCompanionState(result.guide);
    setGuidePickerOpen(false);
    setGuideNotice(result.reason === "first-choice"
      ? `${result.guide.name} is now your Little Literacy Guide.`
      : `${result.guide.name} is now your guide. ${result.cost} stars were used.`);
    playStarChime();
  }

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
      setTab("beasties");
    } else if (item.slot) {
      saveLayout(scope, { equipped: { ...hollow.equipped, [item.slot]: item.id }, slots: hollow.slots });
      setTab("pal");
      setNotice(`${item.name} is on your Guide.`);
    } else if (item.id.startsWith("hollow-")) {
      setPendingItem(item.id);
      setTab("hollow");
      setDecorating(true);
      const openRoom = rooms.findIndex(r => r.kind === "open" && r.spots.some(s => !hollow.slots[s.spotId]));
      setRoomIndex(Math.max(0, openRoom));
      setNotice("Tap an empty spot to place it.");
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
    setNotice("Fed! Your friend is growing.");
    refresh();
  }

  function placeItem(spotId, itemId) {
    const slots = { ...hollow.slots };
    if (itemId) slots[spotId] = itemId;
    else delete slots[spotId];
    saveLayout(scope, { equipped: hollow.equipped, slots });
    setPickingSpot(null);
    if (itemId) setPendingItem("");
    setNotice(itemId ? `${findCatalogItem(itemId)?.name || "Your decoration"} is in your Hollow.` : "Put away. You can place it again.");
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
  useEffect(() => {
    if (pickingSpot) {
      pickerRef.current?.querySelector("button:not([disabled])")?.focus();
    } else if (pickerTriggerRef.current) {
      const trigger = pickerTriggerRef.current;
      const returnTo = trigger.disabled
        ? trigger.closest(".hollow-room")?.querySelector("[data-child-primary]")
        : trigger;
      returnTo?.focus();
      pickerTriggerRef.current = null;
    }
  }, [pickingSpot, placeable.length]);
  const nextExpansion = EXPANSIONS.find(e => !hollow.ownedIds.has(e.id));
  const welcomeEggWaiting = !ledger.purchases.some(p => p?.item === WELCOME_EGG.id);
  const season = hollow.market.season;
  const caravanWares = [...hollow.market.gear, ...hollow.market.hollow].filter(i => i.caravan !== undefined);
  const everydayGear = hollow.market.gear.filter(i => i.caravan === undefined);
  const everydayHollow = hollow.market.hollow.filter(i => i.caravan === undefined);
  const marketItems = (shelf === "caravan"
    ? caravanWares
    : shelf === "gear"
      ? everydayGear
      : shelf === "home"
        ? everydayHollow
        : hollow.market.eggs).slice().sort((a, b) => {
          const rank = item => canBuy(hollow, item.id).ok ? 0 : hollow.ownedIds.has(item.id) ? 2 : 1;
          return rank(a) - rank(b) || a.price - b.price;
        });

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
  const nextAction = hollowNextAction({
    placeable,
    spots: room?.kind === "open" ? room.spots : [],
    slots: hollow.slots,
    welcomeEggWaiting
  });
  const recommendedSpotId = nextAction.spotId || "";
  const replacementSpotId = pendingItem && !recommendedSpotId && room?.kind === "open"
    ? room.spots.find(spot => hollow.slots[spot.spotId])?.spotId || "" : "";

  function openMarket() {
    setPickingSpot(null);
    setPickingWorld(false);
    setTab("market");
    setShelf("home");
  }

  function followEmptyAction() {
    if (welcomeEggWaiting) {
      setPickingSpot(null);
      grant(WELCOME_EGG);
    } else openMarket();
  }

  function hearNextAction() {
    setSpeechStatus(speakStudentRailLabel(instruction)
      ? "Reading it out."
      : "Sound is unavailable. You can still follow the words and picture.");
  }

  function renderSpot(spot) {
    const itemId = hollow.slots[spot.spotId];
    const item = itemId ? findCatalogItem(itemId) : null;
    const style = { left: `${spot.x}%`, top: `${spot.y}%` };
    if (item) {
      return (
        <button key={spot.spotId} type="button" className="hollow-spot filled" style={style} title={`Put away ${item.name}`} onClick={() => placeItem(spot.spotId, "")}
          {...(spot.spotId === replacementSpotId ? { "data-child-primary": "", "data-child-emphasis": "primary" } : {})}>
          <ItemArt id={item.id} size={86} />
          <span className="hollow-spot-name">{item.name}</span>
          {spot.spotId === replacementSpotId && <span className="hollow-spot-next" data-child-emphasis-cue="">Make space</span>}
        </button>
      );
    }
    return (
      <button
        key={spot.spotId}
        type="button"
        className={`hollow-spot empty${spot.spotId === recommendedSpotId ? " recommended" : ""}`}
        style={style}
        disabled={!placeable.length}
        aria-label={!placeable.length ? "Empty display spot" : spot.spotId === recommendedSpotId
          ? "Empty spot - add something. Recommended next."
          : "Empty spot - add something"}
        onClick={event => {
          if (pendingItem) placeItem(spot.spotId, pendingItem);
          else { pickerTriggerRef.current = event.currentTarget; setPickingSpot({ id: spot.spotId, x: spot.x, y: spot.y }); }
        }}
        data-child-primary={!pickingSpot && spot.spotId === recommendedSpotId ? "" : undefined}
        data-child-emphasis={spot.spotId === recommendedSpotId ? "primary" : "choice"}
      >
        <span aria-hidden="true">＋</span>
        {spot.spotId === recommendedSpotId && (
          <span className="hollow-spot-next" data-child-emphasis-cue="">Place next</span>
        )}
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
      <div ref={pickerRef} className="hollow-picker" style={style} role="dialog" aria-label="Choose something to place" onKeyDown={event => { if (event.key === "Escape") closePlacementPicker(); }}>
        {placeable.length === 0
          ? <div className="hollow-picker-empty">
              <ItemArt id={welcomeEggWaiting ? "egg-welcome" : everydayHollow[0]?.id || "egg-welcome"} size={52} />
              <p>{welcomeEggWaiting ? "Your gift is waiting." : "Find something at the Market."}</p>
              <button type="button" className="hollow-buy" onClick={followEmptyAction} data-child-primary="" data-child-emphasis="primary"><span data-child-emphasis-cue="">{welcomeEggWaiting ? "Open your gift" : "Visit the Market"}</span></button>
              <button type="button" className="hollow-pick hollow-hear" aria-label="Hear what to do next" onClick={hearNextAction}><SpeakerHigh size={22} aria-hidden="true" /></button>
            </div>
          : placeable.map((item, index) => (
            <button key={item.id} type="button" className="hollow-pick" title={item.name} onClick={() => placeItem(pickingSpot.id, item.id)}
              {...(index === 0 ? { "data-child-primary": "", "data-child-emphasis": "primary" } : {})}>
              <ItemArt id={item.id} size={52} />
              <span data-child-emphasis-cue={index === 0 ? "" : undefined}>{item.name}</span>
            </button>
          ))}
        <button type="button" className="hollow-pick cancel" aria-label="Close placement choices" onClick={closePlacementPicker}>✕</button>
      </div>
    );
  }

  const visibleBeasties = hollow.beasties;
  const feedNext = visibleBeasties.find(b => b.growth.next && hollow.berries > 0);
  const foodNext = onOpenBooks && hollow.berries < 1 ? visibleBeasties.find(b => b.growth.next) : null;
  const instruction = tab === "market" ? "Choose something for your Hollow."
    : tab === "pal" ? "Tap your gear to wear it."
    : tab === "beasties" ? (welcomeEggWaiting ? "Tap the egg to meet your first friend." : "Feed your friends to help them grow.")
    : decorating ? (replacementSpotId ? "Tap a decoration to make space." : recommendedSpotId ? "Tap a blue spot to place your decoration." : "Choose a decoration for your Hollow.")
    : welcomeEggWaiting ? "Tap the egg to meet your first friend." : "Make yourself at home.";
  const primaryProps = { "data-child-primary": "", "data-child-emphasis": "primary" };
  const title = tab === "pal" ? "My Guide" : tab === "beasties" ? "My Beasties"
    : tab === "market" ? "Shop" : decorating ? "Decorate" : studentName ? `${studentName}'s Hollow` : "My Hollow";

  function goHome() {
    setTab("hollow"); setDecorating(false); setPickingSpot(null);
    setPickingWorld(false); setPendingItem(""); setNotice(""); setGuidePickerOpen(false);
  }

  function renderWare(item, primary = false) {
    const verdict = canBuy(hollow, item.id);
    return <button key={item.id} type="button" className="hollow-ware"
      data-locked-item-card={verdict.reason === "coins" ? "hollow-market" : undefined}
      disabled={!verdict.ok} onClick={() => buy(item.id)} {...(primary ? primaryProps : {})}>
      <ItemArt id={item.id} size={76} />
      <strong>{item.name}</strong>
      <CoinPrice verdict={verdict} price={item.price} />
      {primary && <span data-child-emphasis-cue="">{shelf === "eggs" ? "Hatch an egg" : "Choose this"}</span>}
    </button>;
  }

  return (
    <main className="hollow-page hollow-simple" data-pal-world={activeTheme.id} data-child-surface="my-hollow" data-hollow-view={tab === "hollow" ? decorating ? "room" : "entry" : "collection"}>
      <header className="hollow-topbar">
        {(tab !== "hollow" || decorating) && <button type="button" className="hollow-back" onClick={goHome}>← My Hollow</button>}
        <h1 className="hollow-title" data-child-title="">{title}</h1>
        <span className="hollow-progress" data-child-progress="">{hollow.beasties.length} {hollow.beasties.length === 1 ? "friend" : "friends"} at home</span>
        {tab === "market" && <span className="hollow-wallet" aria-label={`${hollow.coins} coins`}><CoinIcon size={22} /> <strong>{hollow.coins}</strong></span>}
        {tab === "beasties" && hollow.beasties.length > 0 && <span className="hollow-wallet" aria-label={`${hollow.berries} berries`}><BerryIcon size={22} /> <strong>{hollow.berries}</strong></span>}
      </header>
      <div className="hollow-instruction-row">
        <p data-child-instruction="">{instruction}</p>
        <button type="button" className="hollow-hear" aria-label="Hear what to do next" onClick={hearNextAction}><SpeakerHigh size={24} aria-hidden="true" /></button>
        <span className="hollow-notice" role="status">{notice}</span>
      </div>
      <section className="hollow-stage" data-child-choices="" aria-label={title}>
        {tab === "hollow" && !decorating && <div className="hollow-overview" style={{ backgroundImage: rooms[0].image }}>
          <div className="hollow-next-card">
            <ItemArt id={welcomeEggWaiting ? "egg-welcome" : "hollow-glow-jar"} size={110} />
            <div><h2>{welcomeEggWaiting ? "A gift for you" : "Your cosy home"}</h2>
              <p>{welcomeEggWaiting ? "A new friend is waiting inside." : "Choose a decoration and make it yours."}</p>
              <button type="button" className="hollow-buy" {...primaryProps} onClick={() => {
                if (welcomeEggWaiting) grant(WELCOME_EGG);
                else { setDecorating(true); setRoomIndex(0); }
              }}><span data-child-emphasis-cue="">{welcomeEggWaiting ? "Open your gift" : "Decorate my Hollow"}</span></button>
            </div>
          </div>
          <nav className="hollow-doorways" aria-label="Things to do in your Hollow">
            <button type="button" onClick={() => { setDecorating(true); setRoomIndex(0); }}><ItemArt id="hollow-mushroom-stool" size={64} /><strong>Decorate</strong></button>
            <button type="button" onClick={() => setTab("pal")}><img src={companion?.image} alt="" /><strong>My Guide</strong></button>
            <button type="button" onClick={() => setTab("beasties")}><ItemArt id={hollow.beasties[0]?.id || "egg-welcome"} stage={hollow.beasties[0]?.growth.stage} size={64} /><strong>Beasties</strong></button>
          </nav>
        </div>}

        {tab === "hollow" && decorating && room && <div className="hollow-room-frame">
          {room.kind === "open" ? <div className="hollow-room" style={{ backgroundImage: room.image }}>
            {room.tint && <span className="hollow-room-tint" style={{ background: room.tint }} aria-hidden="true" />}
            <span className="hollow-room-name">{room.name}</span>
            {room.spots.filter(spot => hollow.slots[spot.spotId] || placeable.length > 0).map(renderSpot)}
            {renderPicker()}
            {!recommendedSpotId && !replacementSpotId && !pickingSpot && <aside className="hollow-room-next">
              <ItemArt id="hollow-glow-jar" size={64} />
              <button type="button" className="hollow-buy" onClick={openMarket} {...primaryProps}><span data-child-emphasis-cue="">Choose a decoration</span></button>
            </aside>}
            <div className="hollow-room-tools">
              {recommendedSpotId && <button type="button" className="hollow-back" onClick={openMarket}>Shop</button>}
              <button type="button" className="hollow-world-button" onClick={() => setPickingWorld(v => !v)}>Change world</button>
            </div>
            {pickingWorld && <div className="hollow-world-pop" role="dialog" aria-label="Choose your world">
              {DEN_THEMES.map(world => <button key={world.id} type="button" disabled={!isDenThemeUnlocked(world, treasury.gems)}
                className={`hollow-world-thumb${activeTheme.id === world.id ? " active" : ""}`} onClick={() => chooseTheme(world)}>
                <img src={world.art} alt="" /><span>{isDenThemeUnlocked(world, treasury.gems) ? world.name : `${world.name} · ${world.at} gems`}</span>
              </button>)}
              <button type="button" onClick={() => setPickingWorld(false)}>Close</button>
            </div>}
          </div> : <div className="hollow-room locked" style={{ backgroundImage: room.image }}><div className="hollow-room-lock">
            <h2>{room.name}</h2><p>More space for your decorations.</p>
            <button type="button" className="hollow-buy" disabled={!canBuy(hollow, room.expansion.id).ok} onClick={() => buy(room.expansion.id)}>
              <CoinPrice verdict={canBuy(hollow, room.expansion.id)} price={room.expansion.price} />
            </button>
          </div></div>}
          {rooms.length > 1 && <nav className="hollow-room-navigation" aria-label="Places in your Hollow">
            <button type="button" disabled={roomIndex === 0} aria-label="Previous place" onClick={() => { setRoomIndex(i => Math.max(0, i - 1)); setPickingSpot(null); }}><ChevronGlyph direction="left" /></button>
            <span>{room.name}</span>
            <button type="button" disabled={roomIndex >= rooms.length - 1} aria-label={rooms[roomIndex + 1] ? `Go to ${rooms[roomIndex + 1].name}` : "No more places"} onClick={() => { setRoomIndex(i => Math.min(rooms.length - 1, i + 1)); setPickingSpot(null); }}><ChevronGlyph /></button>
          </nav>}
        </div>}

        {tab === "pal" && <div className="hollow-panel">
          <div className="hollow-pal-row">
            <div className="hollow-pal-stage"><PalFigure companion={companion} equipped={hollow.equipped} /><h2>{companion?.name || "Choose a Guide"}</h2>
              <button type="button" className="hollow-change-guide" onClick={() => { setGuideNotice(""); setGuidePickerOpen(v => !v); }}>Change Guide</button>
            </div>
            <div className="hollow-gear-grid">
              {hollow.ownedGear.map(gear => <button key={gear.id} type="button" className={`hollow-gear${hollow.equipped[gear.slot] === gear.id ? " worn" : ""}`} onClick={() => toggleGear(gear)}>
                <ItemArt id={gear.id} size={64} /><strong>{gear.name}</strong><em>{hollow.equipped[gear.slot] === gear.id ? "Wearing ✓" : GEAR_SLOT_LABELS[gear.slot]}</em>
              </button>)}
              <button type="button" className="hollow-buy" {...primaryProps} onClick={() => { setTab("market"); setShelf("gear"); }}><span data-child-emphasis-cue="">Find Guide gear</span></button>
            </div>
          </div>
          {guidePickerOpen && <section className="hollow-guide-picker" role="dialog" aria-label="Choose a Little Literacy Guide">
            <header><div><h2>Choose your Guide</h2><p>Changing costs {LITTLE_LITERACY_GUIDE_CHANGE_COST} stars. You have {guideStarsAvailable}.</p></div><button type="button" onClick={() => setGuidePickerOpen(false)} aria-label="Close guide choices">×</button></header>
            <div>{COMPANIONS.map(item => { const current = companion?.id === item.id; return <button key={item.id} type="button" className={current ? "active" : ""}
              disabled={!current && guideStarsAvailable < LITTLE_LITERACY_GUIDE_CHANGE_COST} onClick={() => chooseGuide(item.id)}>
              <img src={item.image} alt="" /><strong>{item.name}</strong><em>{current ? "Your Guide" : `★ ${LITTLE_LITERACY_GUIDE_CHANGE_COST}`}</em></button>; })}</div>
          </section>}
          {guideNotice && <p role="status">{guideNotice}</p>}
        </div>}

        {tab === "beasties" && <div className="hollow-panel">
          {welcomeEggWaiting && <div className="hollow-next-card hollow-gift"><ItemArt id="egg-welcome" size={100} /><div><h2>A gift for you</h2>
            <button type="button" className="hollow-buy" onClick={() => grant(WELCOME_EGG)} {...primaryProps}><span data-child-emphasis-cue="">Open your gift</span></button></div></div>}
          <div className="hollow-beastie-grid">
            {visibleBeasties.map(b => <div key={b.id} className="hollow-beastie">
              <ItemArt id={b.id} stage={b.growth.stage} size={100} /><strong>{b.name}</strong>
              <em>{b.growth.next ? `${b.growth.feedsToNext} feeds to grow` : "Fully grown!"}</em>
              <span className="hollow-meter" role="progressbar" aria-label={`${b.name} growth`} aria-valuemin={0} aria-valuemax={8} aria-valuenow={Math.min(8, b.growth.feeds)}><span style={{ width: `${Math.min(100, b.growth.feeds / 8 * 100)}%` }} /></span>
              {b.growth.next && <button type="button" className="hollow-buy" disabled={hollow.berries < 1} onClick={() => feed(b.id)} {...(!welcomeEggWaiting && feedNext?.id === b.id ? primaryProps : {})}>
                <span data-child-emphasis-cue="">Feed {b.name}</span><BerryIcon size={18} /></button>}
              {b.growth.next && hollow.berries < 1 && <div className="hollow-feed-help"><small>Read a book to earn food.</small>
                {onOpenBooks && <button type="button" className="hollow-back hollow-read-for-food" {...(!welcomeEggWaiting && foodNext?.id === b.id ? primaryProps : {})} onClick={onOpenBooks}><BookOpenText size={24} aria-hidden="true" /> <span data-child-emphasis-cue="">Go to Books</span></button>}
              </div>}
            </div>)}
          </div>
          {!welcomeEggWaiting && <div className="hollow-beastie-actions">
            <button type="button" className={feedNext || foodNext ? "hollow-back" : "hollow-buy"} {...(!feedNext && !foodNext ? primaryProps : {})} onClick={() => { setTab("market"); setShelf("eggs"); }}><span data-child-emphasis-cue="">Find another friend</span></button>
          </div>}
        </div>}

        {tab === "market" && <div className="hollow-panel hollow-market">
          <nav className="hollow-shelf-tabs" aria-label="Shop shelves">{MARKET_SHELVES.map(s => <button key={s.id} type="button" className={`hollow-shelf-tab${shelf === s.id ? " active" : ""}`} aria-pressed={shelf === s.id} onClick={() => setShelf(s.id)}><ItemArt id={{ home: "hollow-glow-jar", gear: "gear-trail-boots", eggs: "egg-bronze", caravan: "hollow-star-banner" }[s.id]} size={36} />{s.label}</button>)}</nav>
          {shelf === "caravan" && <p className="hollow-hint">{season.name} specials · {season.daysLeft} days left</p>}
          <div className="hollow-market-grid">{marketItems.map(item => renderWare(item, item.id === marketItems.find(i => canBuy(hollow, i.id).ok)?.id))}</div>
          <p className="hollow-hint">Read and play to earn coins.</p>
          {!marketItems.some(i => canBuy(hollow, i.id).ok) && <button type="button" className="hollow-buy" {...primaryProps} onClick={goHome}><span data-child-emphasis-cue="">Back to my Hollow</span></button>}
        </div>}
      </section>
      <p className="sr-only" role="status">{speechStatus} {notice}</p>
      {hatched && <aside className="hollow-hatched-notice" role="status"><ItemArt id={hatched.id} stage={1} size={64} /><strong>{hatched.name} is home!</strong><button type="button" className="hollow-back" aria-label="Close new friend message" onClick={() => setHatched(null)}>×</button></aside>}
    </main>
  );
}
