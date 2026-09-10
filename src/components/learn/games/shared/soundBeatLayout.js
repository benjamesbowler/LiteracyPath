// Collected letters and arriving notes never enter the press-pad region.
export function soundBeatLayout(width, height) {
  const wordY = height < 320 ? 66 : Math.max(76, Math.min(180, height * 0.24));
  const slotsY = wordY + 22;
  const stageY = slotsY + 38;
  return { wordY, slotsY, stageY, hitY: Math.max(stageY + 26, height - 110), padY: height - 40 };
}
