export const MATHS_MANIPULATIVE_IDS = Object.freeze([
  "counter_tray",
  "five_frame",
  "ten_frame",
  "number_line",
  "part_whole"
]);

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || 0));

export function createManipulativeState(id, options = {}) {
  const maximum = clamp(options.maximum ?? (id === "five_frame" ? 5 : 10), 1, 20);
  switch (id) {
    case "counter_tray":
      return { id, maximum, counters: [], selectedGroup: "a" };
    case "five_frame":
    case "ten_frame":
      return { id, maximum: id === "five_frame" ? 5 : maximum, cells: Array(id === "five_frame" ? 5 : maximum).fill("empty") };
    case "number_line":
      return { id, minimum: 0, maximum: Math.max(10, maximum), start: 0, current: 0, jumps: [] };
    case "part_whole":
      return { id, maximum, whole: maximum, parts: [0, maximum], selectedPart: 0 };
    default:
      throw new TypeError(`Unknown Maths manipulative: ${id}`);
  }
}

export function manipulativeTotal(state) {
  if (!state) return 0;
  if (state.id === "counter_tray") return state.counters.length;
  if (["five_frame", "ten_frame"].includes(state.id)) return state.cells.filter(cell => cell !== "empty").length;
  if (state.id === "number_line") return state.current;
  if (state.id === "part_whole") return state.parts.reduce((sum, part) => sum + part, 0);
  return 0;
}

export function describeManipulativeState(state) {
  const total = manipulativeTotal(state);
  if (state.id === "counter_tray") {
    const a = state.counters.filter(counter => counter.groupId === "a").length;
    const b = total - a;
    return `${total} counters altogether. ${a} in group A and ${b} in group B.`;
  }
  if (["five_frame", "ten_frame"].includes(state.id)) {
    const partA = state.cells.filter(cell => cell === "part_a").length;
    const partB = state.cells.filter(cell => cell === "part_b").length;
    return `${total} filled spaces out of ${state.cells.length}. ${partA} in part A and ${partB} in part B.`;
  }
  if (state.id === "number_line") {
    return `At ${state.current} on a number line from ${state.minimum} to ${state.maximum}, after ${state.jumps.length} jumps.`;
  }
  return `The whole is ${state.whole}. The parts are ${state.parts.join(" and ")}.`;
}

export function mathsManipulativeReducer(state, action) {
  if (!state || !action?.type) return state;
  if (action.type === "restore" && action.state?.id === state.id) return action.state;
  if (action.type === "reset") return createManipulativeState(state.id, { maximum: state.maximum });
  if (state.id === "counter_tray") {
    if (action.type === "select_group") return { ...state, selectedGroup: action.groupId === "b" ? "b" : "a" };
    if (action.type === "add" && state.counters.length < state.maximum) {
      const number = state.counters.length + 1;
      return { ...state, counters: [...state.counters, { id: `counter-${number}`, groupId: action.groupId || state.selectedGroup, slot: number - 1 }] };
    }
    if (action.type === "remove") return { ...state, counters: state.counters.slice(0, -1) };
    if (action.type === "deal_next" && state.counters.length < state.maximum) {
      const groupId = state.counters.length % 2 === 0 ? "a" : "b";
      return mathsManipulativeReducer(state, { type: "add", groupId });
    }
  }
  if (["five_frame", "ten_frame"].includes(state.id) && action.type === "toggle_cell") {
    const index = clamp(action.index, 0, state.cells.length - 1);
    const cells = [...state.cells];
    const part = action.part === "part_b" ? "part_b" : "part_a";
    cells[index] = cells[index] === "empty" ? part : cells[index] === part ? "empty" : part;
    return { ...state, cells };
  }
  if (state.id === "number_line" && action.type === "jump") {
    const to = clamp(action.to, state.minimum, state.maximum);
    if (to === state.current) return state;
    const jump = { from: state.current, to, direction: to > state.current ? "forward" : "back", magnitude: Math.abs(to - state.current) };
    return { ...state, current: to, jumps: [...state.jumps, jump] };
  }
  if (state.id === "part_whole") {
    if (action.type === "select_part") return { ...state, selectedPart: action.index === 1 ? 1 : 0 };
    if (action.type === "set_part") {
      const index = action.index === 1 ? 1 : 0;
      const value = clamp(action.value, 0, state.whole);
      const parts = [...state.parts];
      parts[index] = value;
      parts[index === 0 ? 1 : 0] = state.whole - value;
      return { ...state, parts };
    }
  }
  return state;
}

export function snapshotManipulativeState(state) {
  return JSON.stringify(state);
}
