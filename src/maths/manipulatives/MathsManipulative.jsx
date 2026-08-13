import { useEffect, useId, useMemo, useReducer, useRef, useState } from "react";
import {
  createManipulativeState,
  describeManipulativeState,
  mathsManipulativeReducer,
  manipulativeTotal
} from "./mathsManipulatives.js";

const LABELS = {
  counter_tray: "Counter tray",
  five_frame: "Five frame",
  ten_frame: "Ten frame",
  number_line: "Number line",
  part_whole: "Part–whole model"
};

function Frame({ state, dispatch }) {
  const [part, setPart] = useState("part_a");
  const cellRefs = useRef([]);
  const columns = 5;
  const moveFocus = (event, index) => {
    const movement = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns }[event.key];
    if (!movement) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(state.cells.length - 1, index + movement));
    cellRefs.current[next]?.focus();
  };
  const frameLabel = state.cells.length === 20 ? "Double ten-frame" : LABELS[state.id];
  return <div className={`maths-frame maths-frame--${state.cells.length}`} role="grid" aria-label={frameLabel}>
    {state.cells.map((cell, index) => (
      <button
        aria-label={`Space ${index + 1}, ${cell === "empty" ? "empty" : cell === "part_a" ? "purple counter" : "orange counter"}`}
        aria-pressed={cell !== "empty"}
        className={`maths-frame-cell is-${cell}`}
        key={index}
        onClick={() => dispatch({ type: "toggle_cell", index, part })}
        onKeyDown={event => moveFocus(event, index)}
        ref={element => { cellRefs.current[index] = element; }}
        role="gridcell"
        tabIndex={index === 0 ? 0 : -1}
        type="button"
      ><span /></button>
    ))}
    <div className="maths-part-switch" role="group" aria-label="Counter colour">
      <button className={part === "part_a" ? "is-selected" : ""} onClick={() => setPart("part_a")} type="button">Part A, striped</button>
      <button className={part === "part_b" ? "is-selected" : ""} onClick={() => setPart("part_b")} type="button">Part B, dotted</button>
    </div>
  </div>;
}

function CounterTray({ state, dispatch }) {
  const groups = ["a", "b"];
  return <div>
    <div className="maths-counter-groups">
      {groups.map(groupId => {
        const count = state.counters.filter(counter => counter.groupId === groupId).length;
        return <button className={state.selectedGroup === groupId ? "is-selected" : ""} key={groupId} onClick={() => dispatch({ type: "select_group", groupId })} type="button">
          <strong>Group {groupId.toUpperCase()}</strong><span>{count}</span>
        </button>;
      })}
    </div>
    <div className="maths-counter-stage" aria-label={`${state.counters.length} counters`}>
      {state.counters.map(counter => <span className={`maths-counter is-${counter.groupId}`} key={counter.id} />)}
    </div>
    <div className="maths-manipulative-actions">
      <button onClick={() => dispatch({ type: "add" })} disabled={state.counters.length >= state.maximum} type="button">Add counter</button>
      <button onClick={() => dispatch({ type: "remove" })} disabled={!state.counters.length} type="button">Take one away</button>
      <button onClick={() => dispatch({ type: "deal_next" })} disabled={state.counters.length >= state.maximum} type="button">Deal fairly</button>
    </div>
  </div>;
}

function NumberLine({ state, dispatch }) {
  return <div className="maths-number-line" role="group" aria-label="Choose a number on the number line">
    {Array.from({ length: state.maximum - state.minimum + 1 }, (_, index) => index + state.minimum).map(number => (
      <button className={number === state.current ? "is-current" : ""} key={number} onClick={() => dispatch({ type: "jump", to: number })} type="button"><span>{number}</span></button>
    ))}
  </div>;
}

function PartWhole({ state, dispatch }) {
  const idPrefix = useId();
  return <div className="maths-part-whole">
    <div className="maths-whole"><span>Whole</span><strong>{state.whole}</strong></div>
    <div className="maths-part-branches" aria-hidden="true" />
    <div className="maths-parts">
      {state.parts.map((value, index) => <div key={index}>
        <label htmlFor={`${idPrefix}-part-${index}`}>Part {index + 1}</label>
        <input id={`${idPrefix}-part-${index}`} max={state.whole} min="0" onChange={event => dispatch({ type: "set_part", index, value: event.target.value })} type="range" value={value} />
        <strong>{value}</strong>
      </div>)}
    </div>
  </div>;
}

export function MathsManipulative({
  id = "ten_frame",
  initialState = null,
  maximum = 10,
  mode = "explore",
  target = null,
  onStateChange,
  onSubmit
}) {
  const startingState = useMemo(() => initialState || createManipulativeState(id, { maximum }), [id, initialState, maximum]);
  const [state, dispatch] = useReducer(mathsManipulativeReducer, startingState);
  const [history, setHistory] = useState([]);
  const previousRef = useRef(startingState);
  const description = describeManipulativeState(state);
  useEffect(() => {
    if (previousRef.current !== state) {
      const priorState = previousRef.current;
      setHistory(items => [...items.slice(-19), priorState]);
      previousRef.current = state;
      onStateChange?.(state);
    }
  }, [onStateChange, state]);
  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory(items => items.slice(0, -1));
    previousRef.current = previous;
    dispatch({ type: "restore", state: previous });
  };
  const total = manipulativeTotal(state);
  return <section className="maths-manipulative" data-manipulative={id} data-mode={mode}>
    <header><div><p>Hands-on model</p><h2>{id === "ten_frame" && maximum > 10 ? "Double ten-frame" : LABELS[id]}</h2></div><output aria-atomic="true" aria-live="polite">{description}</output></header>
    <div className="maths-manipulative-canvas">
      {id === "counter_tray" && <CounterTray dispatch={dispatch} state={state} />}
      {["five_frame", "ten_frame"].includes(id) && <Frame dispatch={dispatch} state={state} />}
      {id === "number_line" && <NumberLine dispatch={dispatch} state={state} />}
      {id === "part_whole" && <PartWhole dispatch={dispatch} state={state} />}
    </div>
    <footer>
      <button disabled={!history.length} onClick={undo} type="button">Undo</button>
      <button onClick={() => dispatch({ type: "reset" })} type="button">Reset</button>
      {onSubmit && <button className="maths-primary" onClick={() => onSubmit({ state, total, target })} type="button">Check my model</button>}
    </footer>
  </section>;
}
