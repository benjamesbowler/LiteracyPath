const GLIMPSE_PATTERNS = Object.freeze(["dice", "arc", "split", "frame"]);

const clampWhole = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Math.trunc(Number(value) || 0)));

const freezeSlots = slots => Object.freeze(slots.map(slot => Object.freeze(slot)));

const dicePoints = Object.freeze({
  1: [[50, 50]],
  2: [[27, 27], [73, 73]],
  3: [[27, 27], [50, 50], [73, 73]],
  4: [[27, 27], [73, 27], [27, 73], [73, 73]],
  5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]]
});

const arcPoints = Object.freeze({
  1: [[50, 28]],
  2: [[32, 43], [68, 43]],
  3: [[20, 62], [50, 25], [80, 62]],
  4: [[13, 70], [38, 34], [62, 34], [87, 70]],
  5: [[10, 72], [29, 43], [50, 24], [71, 43], [90, 72]]
});

function normalizedParts(total, suppliedParts) {
  const supplied = Array.isArray(suppliedParts)
    ? suppliedParts.map(value => Math.max(0, Math.trunc(Number(value) || 0))).slice(0, 2)
    : [];
  if (supplied.length === 2 && supplied[0] + supplied[1] === total) return Object.freeze(supplied);
  const first = Math.min(2, total);
  return Object.freeze([first, total - first]);
}

function splitPoints(total, parts) {
  const firstCount = parts[0];
  const secondCount = parts[1];
  const groupPoints = (count, centreX) => {
    if (count === 0) return [];
    if (count === 1) return [[centreX, 50]];
    if (count === 2) return [[centreX - 11, 50], [centreX + 11, 50]];
    return [[centreX - 12, 62], [centreX, 36], [centreX + 12, 62]];
  };
  return [
    ...groupPoints(firstCount, secondCount ? 28 : 35).map(point => [...point, 1]),
    ...groupPoints(secondCount, 73).map(point => [...point, 2])
  ].slice(0, total);
}

export function buildGlimpseLayout(model = {}) {
  const total = clampWhole(model.total, 1, 5);
  const capacity = clampWhole(model.capacity || 5, total, 5);
  const pattern = GLIMPSE_PATTERNS.includes(model.pattern) ? model.pattern : "frame";
  const parts = normalizedParts(total, model.parts);
  let slots;

  if (pattern === "frame") {
    slots = Array.from({ length: capacity }, (_, index) => ({
      cell: index + 1,
      group: index < parts[0] ? 1 : 2,
      occupied: index < total,
      x: 10 + (index * 20),
      y: 50
    }));
  } else {
    const points = pattern === "dice"
      ? dicePoints[total]
      : pattern === "arc"
        ? arcPoints[total]
        : splitPoints(total, parts);
    slots = points.map(([x, y, suppliedGroup], index) => ({
      cell: index + 1,
      group: suppliedGroup || (index < parts[0] ? 1 : 2),
      occupied: true,
      x,
      y
    }));
  }

  const frozenSlots = freezeSlots(slots);
  const signature = `${pattern}:${total}:${frozenSlots.map(slot => `${slot.occupied ? 1 : 0}@${slot.x},${slot.y},g${slot.group}`).join("|")}`;
  const accessibleDescription = {
    dice: `${total} glowbugs in a familiar dice pattern`,
    arc: `${total} glowbugs arranged in a curved arc`,
    split: `${total} glowbugs split into groups of ${parts[0]} and ${parts[1]}`,
    frame: `${total} glowbugs filling the first ${total} ${total === 1 ? "space" : "spaces"} of a five-frame`
  }[pattern];

  return Object.freeze({ accessibleDescription, capacity, parts, pattern, signature, slots: frozenSlots, total });
}

export function glimpseResponseEvidence(layout, { accessMode, optionSlot } = {}) {
  return Object.freeze({
    accessMode: accessMode === "untimed_counting" ? "untimed_counting" : "visual_glimpse",
    component: "glimpse_garden",
    layoutSignature: layout.signature,
    optionSlot,
    parts: layout.parts,
    pattern: layout.pattern,
    renderedPattern: layout.pattern,
    renderedSlots: layout.slots.map(({ cell, group, occupied, x, y }) => ({ cell, group, occupied, x, y }))
  });
}

function normalizedRows(total, suppliedRows) {
  const rows = Array.isArray(suppliedRows)
    ? suppliedRows.map(value => Math.max(0, Math.trunc(Number(value) || 0))).filter(Boolean)
    : [];
  if (rows.length && rows.reduce((sum, value) => sum + value, 0) === total) return rows;
  return [total];
}

export function buildCountCarryLayout({ selectedPlan, total: suppliedTotal, rows } = {}) {
  const total = clampWhole(suppliedTotal, 1, 20);
  const authoredRows = normalizedRows(total, rows);
  const selected = selectedPlan === "ten_and_more" || selectedPlan === "make_row" ? selectedPlan : "move_once";
  const layoutRows = authoredRows;
  let offset = 0;
  const groups = layoutRows.map((size, rowIndex) => {
    const itemIndexes = Array.from({ length: size }, (_, index) => offset + index);
    offset += size;
    const label = selected === "ten_and_more"
      ? (rowIndex === 0 ? "Ten" : "Extras")
      : selected === "make_row" && layoutRows.length > 1
        ? (rowIndex === 0 ? "Five" : "More")
        : "Clear row";
    return Object.freeze({ itemIndexes: Object.freeze(itemIndexes), label, size });
  });
  const layoutMode = selected === "move_once" ? "meadow_grid" : selected === "ten_and_more" ? "ten_then_extras" : "structured_rows";
  return Object.freeze({
    authoredRows: Object.freeze([...authoredRows]),
    groups: Object.freeze(groups),
    layoutMode,
    layoutRows: Object.freeze([...layoutRows]),
    selectedPlan: selected,
    total
  });
}

export function countCarryResponseEvidence(layout, { movedItemIndexes, optionSlot, options } = {}) {
  return Object.freeze({
    authoredRows: layout.authoredRows,
    component: "one_to_one_carry",
    countingStrategy: layout.selectedPlan,
    layoutMode: layout.layoutMode,
    layoutRows: layout.layoutRows,
    movedItemIndexes: Object.freeze([...(movedItemIndexes || [])]),
    optionSlot,
    options: Object.freeze([...(options || [])]),
    selectedPlan: layout.selectedPlan
  });
}

export const glimpsePatternNames = GLIMPSE_PATTERNS;
