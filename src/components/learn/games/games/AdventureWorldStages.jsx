/* eslint-disable react-hooks/refs -- The frame simulation owns mutable coordinates; React renders a snapshot on each animation frame. */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CAST } from "../../../../features/soundSeekers/v3/content/cast.js";
import { getChildWordAsset } from "../../../../data/childAssets.js";
import { useRecordedPracticeCue } from "../shared/useRecordedPracticeCue.js";
import { advanceCarryWorld, carryRackX, carryStationX, carryWorldSnapshot, createCarryWorld, requestCarryAction, advanceConveyor, createConveyorWorld, divertConveyor, resolveConveyorDelivery, gardenSeedChoices } from "./adventureWorldModel.js";
import "./AdventureWorldStages.css";
function Character({
  id,
  style,
  moving = false,
  carrying = null
}) {
  const cast = CAST[id];
  return <div className={`aw-character${moving ? " is-moving" : ""}`} style={style} aria-label={cast.name}>
    <img src={cast.heroSprite || cast.sprite} alt="" draggable="false" />
    {carrying && <span className="aw-carried">{carrying}</span>}
  </div>;
}
function Plant({
  flower,
  grown,
  image
}) {
  const tree = /tree|bush/.test(flower);
  return <div className={`aw-plant${grown ? " is-grown" : ""}${tree ? " is-tree" : ""}`} data-plant={flower} aria-hidden="true">
    <svg viewBox="0 0 140 180"><path d="M70 180 Q60 120 72 62" fill="none" stroke="#386c38" strokeWidth={tree ? 16 : 8} />
      <path d="M69 143 Q14 150 18 105 Q58 97 69 143M71 117 Q115 133 124 87 Q83 83 71 117" fill="#5a9d47" stroke="#35663a" strokeWidth="3" />
      {tree ? <><path d="M21 86 Q-4 30 40 26 Q66 -8 94 23 Q146 15 131 75 Q144 120 92 115 Q46 140 21 86" fill="#69a64c" stroke="#35663a" strokeWidth="4" />{[35, 66, 102, 89, 46].map((x, i) => <circle key={i} cx={x} cy={40 + i * 13} r="9" fill={flower.includes("fig") ? "#8065a3" : "#d86c78"} />)}</> : <>{[0, 60, 120, 180, 240, 300].map(a => <ellipse key={a} cx="70" cy="28" rx="17" ry="28" transform={`rotate(${a} 70 65)`} fill={flower === "bluebell" ? "#9991dc" : flower === "rose" || flower === "poppy" ? "#df7f86" : "#edcb65"} stroke="#8c6f4666" strokeWidth="2" />)}<circle cx="70" cy="65" r="20" fill="#ad713e" /></>}
    </svg>
    {grown && image && <img src={image} alt="" className="aw-grown-picture" />}
  </div>;
}
function CarryStage({
  mode,
  rounds,
  state,
  isSoundEnabled,
  difficulty = "easy"
}) {
  const worldRef = useRef(null);
  if (!worldRef.current) worldRef.current = createCarryWorld(mode, state.index, rounds.length, state.worldSnapshot);
  const world = worldRef.current;
  const [, redraw] = useState(0);
  const [notice, setNotice] = useState(mode === "rescue" ? "Fetch a plank. Carry it to the bridge." : "Take a seed to the word bed.");
  const [size, setSize] = useState({
    width: 1000,
    height: 500
  });
  const host = useRef(null);
  const latest = useRef({});
  const round = rounds[state.index] || rounds.at(-1);
  const {
    canHear,
    replay
  } = useRecordedPracticeCue(round.word, isSoundEnabled && !state.paused);
  const [failedTarget, setFailedTarget] = useState(null);
  const targetAsset = getChildWordAsset(round.word);
  const targetImage = failedTarget === round.word ? null : targetAsset?.image || targetAsset?.fallbackImage;
  const values = mode === "rescue" ? round.choices : gardenSeedChoices(round, difficulty);
  const viewWidth = size.width < 520 ? 850 : 1120;
  const scale = size.width / viewWidth;
  const sx = x => (x - world.camera) * scale;
  const stationX = carryStationX(world, state.index);
  const solved = mode === "rescue" ? state.planks : state.index + (state.grown.some(g => g.id === round.id) ? 1 : 0);
  const settling = solved > state.index;
  useLayoutEffect(() => {
    latest.current = {
      state,
      round,
      canHear
    };
    world.index = state.index;
    world.solved = solved;
  }, [state, round, canHear, world, solved]);
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const r = entries[0].contentRect;
      setSize({
        width: r.width,
        height: r.height
      });
    });
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let raf;
    let last;
    let saveClock = 0;
    const tick = now => {
      const dt = last === undefined ? 0 : Math.min(.05, (now - last) / 1000);
      last = now;
      const {
        state: current,
        round: task,
        canHear: spoken
      } = latest.current;
      if (!current.paused) {
        advanceCarryWorld(world, dt, viewWidth);
        const event = world.event;
        if (event?.type === "pickup") {
          world.carry = {
            value: event.value,
            index: current.index
          };
          setNotice(mode === "rescue" ? `Carry ${event.value} to the bridge.` : `Plant ${event.value} in the open letter space.`);
        } else if (event?.type === "place" && world.carry?.index === current.index) {
          const value = world.carry.value;
          const correct = mode === "rescue" ? value === task.word : value === task.word[task.changeIndex];
          if (mode === "rescue") current.choose(value, spoken);else current.pickLetter(value);
          world.carry = null;
          setNotice(correct ? mode === "rescue" ? "The plank fits! Cross to the next supply dock." : `${task.word}! The bed is growing.` : mode === "rescue" ? `${value} does not match. Try another plank.` : `That makes ${[...task.sourceWord].map((c, i) => i === task.changeIndex ? value : c).join("")}. Try another seed.`);
        } else if (event?.type === "discovery") {
          if (!world.discoveries.includes(event.value)) world.discoveries.push(event.value);
          setNotice("A trail star! Keep exploring.");
        } else if (event?.type === "rescued") {
          current.finish?.();
        }
        saveClock += dt;
        if (event || saveClock > .6) {
          saveClock = 0;
          current.onWorldSnapshot?.(carryWorldSnapshot(world));
        }
        redraw(n => n + 1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, viewWidth, world]);
  useEffect(() => {
    if (state.paused) {
      world.input = 0;
      world.target = null;
    }
  }, [state.paused, world]);
  const move = dir => {
    if (!state.paused) {
      world.input = dir;
      world.target = null;
    }
  };
  const action = (type, value, x) => {
    if (!state.paused && !state.arrivalReady && !settling) requestCarryAction(world, {
      type,
      value,
      x
    });
  };
  const interact = () => {
    if (world.carry) {
      action("place", null, stationX);
      return;
    }
    const nearest = values.map((v, i) => ({
      v,
      x: carryRackX(world, state.index, i)
    })).sort((a, b) => Math.abs(a.x - world.x) - Math.abs(b.x - world.x))[0];
    if (nearest) action("pickup", nearest.v, nearest.x);
  };
  return <section className={`aw-stage aw-${mode}`} data-aw-mode={mode} data-aw-index={state.index} data-hero-x={world.x.toFixed(1)} data-carry={world.carry?.value || ""} data-built={solved} tabIndex={0} onKeyDown={e => {
    if (e.target.tagName === "BUTTON") return;
    if (["ArrowLeft", "a", "A"].includes(e.key)) {
      e.preventDefault();
      move(-1);
    }
    if (["ArrowRight", "d", "D"].includes(e.key)) {
      e.preventDefault();
      move(1);
    }
    if (["Enter", " ", "e", "E"].includes(e.key)) {
      e.preventDefault();
      interact();
    }
  }} onKeyUp={e => {
    if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(e.key)) move(0);
  }} onBlur={e => {
    if (!e.currentTarget.contains(e.relatedTarget)) move(0);
  }}>
    <header className="aw-objective">
      {mode === "rescue" ? <strong>{canHear ? "Find the spoken word" : <>Find <b data-aw="target">{round.word}</b></>}</strong> : <strong><span>{round.sourceWord}</span> → {targetImage ? <img src={targetImage} alt={round.targetLabel || round.word} onError={() => setFailedTarget(round.word)} /> : <b>{round.word}</b>}</strong>}
      <span>{solved}/{rounds.length}</span><button type="button" disabled={!canHear} onClick={replay} aria-label="Hear target word">♪</button>
    </header>
    <div className="aw-landscape" ref={host} data-aw="world" style={{
      backgroundPosition: `${50 - Math.min(15, world.camera / 800)}% center`
    }}>
      <div className="aw-terrain" />
      {rounds.map((task, i) => {
        const base = i * world.section;
        const station = carryStationX(world, i);
        if (base > world.camera + viewWidth + 200 || base + world.section < world.camera - 200) return null;
        const finished = mode === "rescue" ? i < state.planks : state.grown.some(g => g.id === task.id);
        return <div key={task.id || i}>
          {mode === "rescue" ? <>
            <div className="aw-river" style={{
              left: sx(base + 900),
              width: 220 * scale
            }}><i /><i /><i /></div>
            <div className={`aw-built-plank${finished ? " is-built" : ""}`} data-aw="bridge" data-solid={finished} data-section={i} style={{
              left: sx(base + 880),
              width: 260 * scale
            }}>{finished ? task.word : ""}</div>
            {i === state.index && !state.arrivalReady && <button type="button" className="aw-station" style={{
              left: sx(station)
            }} disabled={!world.carry || state.paused} onClick={() => action("place", null, station)} data-aw="place">Lay plank</button>}
          </> : <div className={`aw-garden-bed${finished ? " is-grown" : ""}`} style={{
            left: sx(station + 100)
          }}>
            <Plant flower={task.flower} grown={finished} image={getChildWordAsset(task.word)?.image || getChildWordAsset(task.word)?.fallbackImage} />
            <div className="aw-soil" />
            <div className="aw-word-bed" aria-label={finished ? task.word : task.sourceWord}>
              {[...task.sourceWord].map((letter, j) => j === task.changeIndex && i === state.index && !finished ? <button type="button" key={j} className="aw-change-space" data-aw="place" disabled={!world.carry || state.paused} onClick={() => action("place", null, station)} aria-label={`Plant a letter instead of ${letter}`}>{letter}<small>↓</small></button> : <span key={j} data-stable-letter={j !== task.changeIndex || undefined}>{finished && j === task.changeIndex ? task.word[j] : letter}</span>)}
            </div>
            {finished && <span className="aw-plant-name">{task.plantName}</span>}
          </div>}
        </div>;
      })}
      {!state.arrivalReady && values.map((value, i) => {
        const x = carryRackX(world, state.index, i);
        return <button type="button" key={`${state.index}-${value}`} className={`aw-pickup ${mode === "rescue" ? "is-plank" : "is-seed"}`} data-aw="pickup" data-value={value} style={{
          left: sx(x)
        }} onFocus={() => {
          if (!state.paused && (x < world.camera + 80 || x > world.camera + viewWidth - 80)) action("approach", null, x);
        }} disabled={state.paused || settling || Boolean(world.carry)} onClick={() => action("pickup", value, x)} aria-label={`Fetch ${value}${mode === "rescue" ? " plank" : " seed"}`}><strong>{value}</strong>{mode === "garden" && <span aria-hidden="true">❧</span>}</button>;
      })}
      {mode === "rescue" && <Character id="splashy" style={{
        left: sx(world.friendX),
        bottom: "24%"
      }} moving={solved === rounds.length && !world.rescued} />}
      <Character id={mode === "rescue" ? "speedy" : "woolly"} style={{
        left: sx(world.x),
        bottom: "24%",
        "--aw-facing": world.facing
      }} moving={world.moving} carrying={world.carry?.value} />
      {!world.discoveries.includes(state.index) && <button type="button" className="aw-local-discoveries" aria-label="Explore the trail star" disabled={state.paused} style={{
        left: sx(state.index * world.section + 700)
      }} onClick={() => action("discovery", state.index, state.index * world.section + 700)}>✦</button>}
    </div>
    <footer className="aw-controls">
      <div>{[-1, 1].map(dir => <button key={dir} type="button" aria-label={dir < 0 ? "Walk left" : "Walk right"} onPointerDown={e => {
          e.currentTarget.setPointerCapture(e.pointerId);
          move(dir);
        }} onPointerUp={() => move(0)} onPointerCancel={() => move(0)} onLostPointerCapture={() => move(0)} onKeyDown={e => {
          if (["Enter", " "].includes(e.key)) move(dir);
        }} onKeyUp={() => move(0)}>{dir < 0 ? "←" : "→"}</button>)}</div>
      <p role="status" data-aw="feedback">{notice}</p>
      <button type="button" onClick={interact} disabled={state.paused || state.arrivalReady || settling} aria-label={world.carry ? mode === "rescue" ? "Carry plank to bridge" : "Carry seed to bed" : "Fetch nearest piece"}>{world.carry ? "Carry →" : "Fetch"}</button>
    </footer>
  </section>;
}
export function RescueWorldStage(props) {
  return <CarryStage {...props} mode="rescue" />;
}
export function GardenWorldStage(props) {
  return <CarryStage {...props} mode="garden" />;
}
export function FactoryWorldStage({
  sort,
  state,
  isSoundEnabled
}) {
  const item = sort.items[state.index] || sort.items.at(-1);
  const [manual, setManual] = useState(Boolean(state.worldSnapshot?.factoryManual));
  const worldRef = useRef(null);
  if (!worldRef.current || worldRef.current.index !== state.index) worldRef.current = {
    ...createConveyorWorld(item.word, manual),
    index: state.index
  };
  const world = worldRef.current;
  const [, redraw] = useState(0);
  const [notice, setNotice] = useState("Send the word to its starting letters.");
  const latest = useRef({});
  const host = useRef(null);
  const drag = useRef(null);
  const {
    canHear,
    replay
  } = useRecordedPracticeCue(item.word, isSoundEnabled && !state.paused);
  useLayoutEffect(() => {
    latest.current = {
      state,
      item
    };
  }, [state, item]);
  useEffect(() => {
    let raf,
      last,
      saveClock = 0;
    const tick = now => {
      const dt = last === undefined ? 0 : Math.min(.05, (now - last) / 1000);
      last = now;
      const {
        state: current,
        item: active
      } = latest.current;
      if (!current.paused) {
        advanceConveyor(world, dt);
        if (world.event?.type === "deliver") {
          const correct = world.chosen === active.bin;
          current.sortItem(world.chosen);
          resolveConveyorDelivery(world, correct);
          setNotice(correct ? `${active.word} delivered.` : `${active.word} returns. Its beginning is ${active.bin}.`);
        }
        saveClock += dt;
        if (saveClock > .6 || world.event) {
          saveClock = 0;
          current.onWorldSnapshot?.({
            factoryManual: manual
          });
        }
        if (current.arrivalReady && world.phase === "accepted" && world.elapsed > 1.05) current.finish();
        redraw(n => n + 1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [world, manual]);
  useEffect(() => {
    if (state.paused && world.phase === "dragging") {
      world.phase = "ready";
      world.x = 500;
      world.y = 260;
      drag.current = null;
    }
  }, [state.paused, world]);
  const choose = side => {
    if (!state.paused) divertConveyor(world, side === 0 ? sort.binA : sort.binB, side);
  };
  const dragTo = e => {
    if (!drag.current) return;
    const r = host.current.getBoundingClientRect();
    world.x = (e.clientX - r.left) / r.width * 1000;
    world.y = (e.clientY - r.top) / r.height * 640;
    redraw(n => n + 1);
  };
  const cancel = () => {
    if (world.phase === "dragging") {
      world.phase = "ready";
      world.x = 500;
      world.y = 260;
    }
    drag.current = null;
  };
  return <section className="aw-stage aw-factory" data-aw-mode="sort" data-aw-index={state.index} data-belt-phase={world.phase}>
    <header className="aw-objective"><strong>Match the first letters</strong><span>{state.index}/{sort.items.length}</span><button type="button" disabled={!canHear} onClick={replay} aria-label="Hear word">♪</button></header>
    <div className="aw-machine" ref={host}>
      <div className="aw-factory-window" /><div className="aw-machine-gears" aria-hidden="true">⚙</div>
      <div className="aw-conveyor"><div className="aw-rollers" style={{
          backgroundPositionX: `${world.rollers * 30}px`
        }} /></div>
      <svg className="aw-belt-routes" viewBox="0 0 1000 640" preserveAspectRatio="none" aria-hidden="true"><path d="M500 260 Q480 330 240 470M500 260 Q520 330 760 470" /><path className="aw-return-route" d="M240 470 Q100 600 500 550 Q900 600 760 470" /></svg>
      <Character id="chompy" style={{
        left: "9%",
        bottom: "25%"
      }} />
      {[sort.binA, sort.binB].map((bin, i) => <button type="button" key={bin} className="aw-chute" data-aw="chute" data-bin={bin} style={{
        left: `${i ? 76 : 24}%`
      }} disabled={state.paused || !["feeding", "ready", "dragging"].includes(world.phase)} onClick={() => choose(i)} aria-label={`Divert to ${bin} chute`}><strong>{bin}</strong><span className="aw-chute-mouth" /></button>)}
      {!state.arrivalReady && <button type="button" className="aw-parcel" data-aw="parcel" style={{
        left: `${world.x / 10}%`,
        top: `${world.y / 6.4}%`
      }} aria-label={`Drag ${item.word} to a chute`} disabled={state.paused || !["feeding", "ready", "dragging"].includes(world.phase)} onPointerDown={e => {
        if (state.paused) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = true;
        world.phase = "dragging";
      }} onPointerMove={dragTo} onPointerCancel={cancel} onLostPointerCapture={cancel} onPointerUp={e => {
        if (!drag.current) return;
        drag.current = null;
        const bins = [...host.current.querySelectorAll('[data-aw="chute"]')];
        const side = bins.findIndex(b => {
          const r = b.getBoundingClientRect();
          return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        });
        if (side >= 0) choose(side);else {
          world.phase = "ready";
          world.x = 500;
          world.y = 260;
        }
      }}><strong>{item.word}</strong></button>}
      <div className="aw-output" aria-label={`${state.index} parcels sorted`}>{sort.items.slice(0, state.index).map((output, i) => <span key={i}>{output.word}</span>)}</div>
    </div>
    <footer className="aw-controls"><button type="button" aria-pressed={manual} onClick={() => {
        setManual(v => !v);
        if (!manual && world.phase === "feeding") world.phase = "waiting";else if (manual && world.phase === "waiting") world.phase = "feeding";
      }}>Manual feed</button><p role="status" data-aw="feedback">{notice}</p>{world.phase === "waiting" && <button type="button" onClick={() => {
        world.phase = "feeding";
      }}>Feed parcel</button>}</footer>
  </section>;
}
