export const practiceEvidence = (construct, supportUsed) => ({ construct, supportUsed, practiceOnly: true, independent: false, audioDelivery: 'not_measured' });

export function wordTargetLayout(width, height, words, time = 0) {
  const columns = width >= 510 ? 3 : 2;
  const rows = Math.ceil(words.length / columns);
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const longest = Math.max(1, ...words.map(word => word.length));
  const fontSize = Math.min(25, Math.max(17, (cellWidth - 30) / (longest * 0.62)));
  const targetWidth = Math.min(cellWidth - 12, Math.max(104, longest * fontSize * 0.62 + 22));
  const targetHeight = Math.min(78, Math.max(56, cellHeight - 20));
  return words.map((word, index) => ({
    word,
    x: (index % columns + 0.5) * cellWidth + Math.sin(time * 0.6 + index * 2.2) * Math.max(0, (cellWidth - targetWidth - 10) * 0.4),
    y: (Math.floor(index / columns) + 0.5) * cellHeight + Math.sin(time * 0.45 + index * 1.7) * Math.max(0, Math.min(18, (cellHeight - targetHeight - 10) * 0.4)),
    width: targetWidth, height: targetHeight, fontSize
  }));
}

function hashWord(value) {
  let result = 2166136261;
  for (const ch of value) result = Math.imul(result ^ ch.charCodeAt(0), 16777619);
  return result >>> 0;
}

export function hopscotchRoutes(sentences) {
  let globalStep = 0;
  return sentences.map((sentence, sentenceIndex) => {
    const words = String(sentence).replace(/[.?!]/g, '').split(/\s+/).filter(Boolean);
    return words.map((word, index) => {
      const targetLane = hashWord(`${sentence}:${index}`) % 2;
      const decoys = [...new Set(words)].filter(candidate => candidate !== word);
      const decoy = decoys[hashWord(`${word}:${index}`) % Math.max(1, decoys.length)] || (word === 'The' ? 'A' : 'The');
      const x = (++globalStep) * 180;
      return [0, 1].map(lane => ({
        id: `stone-${sentenceIndex}-${index}-${lane}`, sentenceIndex, index, x,
        y: lane === 0 ? 0.35 : 0.76, word: lane === targetLane ? word : decoy,
        accepted: lane === targetLane
      }));
    });
  });
}

export function hopPosition(from, to, progress) {
  const t = Math.max(0, Math.min(1, progress));
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, lift: Math.sin(t * Math.PI) * 62 };
}
