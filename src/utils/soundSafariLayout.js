// The moving habitat, word cue and collected sounds occupy separate regions.
export function soundSafariLayout(width, height, count) {
  const w = Math.max(320, width), h = Math.max(220, height);
  const shallow = h < 360;
  count = Math.min(count, shallow ? 4 : 8);
  // The authored host owns the two top corners. A narrow screen puts its cue
  // below that row; a wide screen keeps one compact card between the corners.
  const belowTitle = w < 840;
  const guideWidth = Math.min(620, belowTitle ? w - 24 : w - 464);
  const guide = { x: (w - guideWidth) / 2, y: belowTitle ? (shallow ? 76 : 88) : 8, w: guideWidth, h: 56 };
  const fieldTop = Math.max(76, guide.y + guide.h + 8), fieldBottom = h - (shallow ? 64 : 118);
  const fieldHeight = Math.max(56, fieldBottom - fieldTop);
  const maxColumns = Math.max(2, Math.floor((w - 24) / 64));
  const columns = fieldHeight < 180 && count <= maxColumns ? count
    : Math.min(count, maxColumns, Math.max(2, Math.ceil(Math.sqrt(count * w / (fieldHeight * 1.5)))));
  const rows = Math.ceil(count / columns);
  const cellW = (w - 24) / columns, cellH = fieldHeight / rows;
  const radius = Math.max(10, Math.min(42, cellW * 0.16, (cellH - 58) / 2.5));
  const plateWidth = Math.max(56, Math.min(140, cellW - 18));
  return {
    guide,
    replay: { x: guide.x + guide.w - 60, y: guide.y, w: 56, h: 56 },
    positions: Array.from({ length: count }, (_, i) => {
      const row = Math.floor(i / columns), column = i % columns;
      const countInRow = Math.min(columns, count - row * columns);
      const centerX = w / 2 + (column - (countInRow - 1) / 2) * cellW;
      const centerY = fieldTop + row * cellH + (cellH - 56) / 2 + radius * 0.42;
      return { x: centerX, y: centerY, radius, plateWidth,
        travelX: Math.max(0, (cellW - plateWidth) / 2 - 8),
        travelY: Math.max(0, (cellH - radius * 2.5 - 56) / 2 - 3) };
    })
  };
}
