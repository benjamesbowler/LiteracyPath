// Collected letters and arriving notes never enter the press-pad region.
export function soundBeatLayout(width, height) {
  const wordY = height < 300 ? 66 : height < 380 ? 96 : Math.max(104, Math.min(180, height * 0.24));
  const slotsY = wordY + 22;
  const stageY = slotsY + 38;
  const cueWidth = Math.min(height < 300 ? 184 : height < 380 ? 200 : 420, width * 0.52);
  return { wordY, slotsY, stageY, cueWidth, cueX: (width - cueWidth) / 2, hitY: Math.max(stageY + 26, height - 110), padY: height - 40 };
}

export function soundBeatCollectedRail(notes, beatIndex, width) {
  const available = Math.min(640, width - 24);
  let count = Math.min(notes.length, width < 740 ? 3 : 6);
  let start, widths;
  do {
    start = Math.max(0, Math.min(notes.length - count, beatIndex - Math.floor(count / 2)));
    widths = notes.slice(start, start + count).map(note => Math.max(40, note.length * 13 * 0.62 + 16));
    if (widths.reduce((sum, value) => sum + value, 0) + (count - 1) * 8 <= available || count === 1) break;
    count -= 1;
  } while (count > 0);
  let x = (width - widths.reduce((sum, value) => sum + value, 0) - (count - 1) * 8) / 2;
  return widths.map((slotWidth, offset) => {
    const index = start + offset, slot = { index, x, width: slotWidth, fontSize: Math.max(13, Math.min(18, (slotWidth - 16) / (notes[index].length * 0.62))) };
    x += slotWidth + 8; return slot;
  });
}
