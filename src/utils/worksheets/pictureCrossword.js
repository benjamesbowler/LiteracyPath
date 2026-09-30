// Connected beginner crosswords. A crossing shares exactly one letter; parallel
// neighbours and accidental extra words are forbidden. Clue numbers follow
// reading order and are shared when an across/down pair starts in one square.
export function makePictureCrossword(sourceWords, limit = 4) {
  const words = [...new Set(sourceWords)].filter(word => /^[a-z]{2,5}$/.test(word));
  const size = 15;
  const grid = Array.from({ length: size }, () => Array(size).fill(null));
  const placements = [];
  function canPlace(word, row, col, direction, first = false) {
    const dr = direction === 'down' ? 1 : 0;
    const dc = direction === 'across' ? 1 : 0;
    if (row < 0 || col < 0 || row + dr * (word.length - 1) >= size || col + dc * (word.length - 1) >= size) return false;
    if (grid[row - dr]?.[col - dc] || grid[row + dr * word.length]?.[col + dc * word.length]) return false;
    let crossings = 0;
    for (let i = 0; i < word.length; i += 1) {
      const r = row + dr * i, c = col + dc * i;
      const cell = grid[r][c];
      if (cell) {
        if (cell.letter !== word[i] || cell.directions.includes(direction)) return false;
        crossings += 1;
      } else if (direction === 'across' ? grid[r - 1]?.[c] || grid[r + 1]?.[c] : grid[r]?.[c - 1] || grid[r]?.[c + 1]) return false;
    }
    return first || crossings === 1;
  }
  function place(word, row, col, direction) {
    const dr = direction === 'down' ? 1 : 0, dc = direction === 'across' ? 1 : 0;
    [...word].forEach((letter, i) => {
      const r = row + dr * i, c = col + dc * i;
      if (grid[r][c]) grid[r][c].directions.push(direction);
      else grid[r][c] = { letter, directions: [direction] };
    });
    placements.push({ word, row, col, direction });
  }
  if (!words.length) return { grid: [], placements: [] };
  place(words[0], 7, 5, 'across');
  for (const word of words.slice(1)) {
    if (placements.length >= limit) break;
    let chosen;
    for (const parent of placements) {
      const direction = parent.direction === 'across' ? 'down' : 'across';
      for (let i = 0; i < parent.word.length && !chosen; i += 1) {
        for (let j = 0; j < word.length && !chosen; j += 1) {
          if (parent.word[i] !== word[j]) continue;
          const row = parent.row + (parent.direction === 'down' ? i : 0) - (direction === 'down' ? j : 0);
          const col = parent.col + (parent.direction === 'across' ? i : 0) - (direction === 'across' ? j : 0);
          if (canPlace(word, row, col, direction)) chosen = { row, col, direction };
        }
      }
      if (chosen) break;
    }
    if (chosen) place(word, chosen.row, chosen.col, chosen.direction);
  }
  const rows = placements.flatMap(p => [p.row, p.row + (p.direction === 'down' ? p.word.length - 1 : 0)]);
  const cols = placements.flatMap(p => [p.col, p.col + (p.direction === 'across' ? p.word.length - 1 : 0)]);
  const minRow = Math.min(...rows), maxRow = Math.max(...rows), minCol = Math.min(...cols), maxCol = Math.max(...cols);
  const starts = [...new Set(placements.map(p => `${p.row},${p.col}`))].sort((a,b) => {
    const [ar,ac] = a.split(',').map(Number), [br,bc] = b.split(',').map(Number);
    return ar - br || ac - bc;
  });
  return {
    grid: grid.slice(minRow, maxRow + 1).map(row => row.slice(minCol, maxCol + 1).map(cell => cell?.letter || '')),
    placements: placements.map(p => ({ ...p, number: starts.indexOf(`${p.row},${p.col}`) + 1, row: p.row - minRow, col: p.col - minCol }))
  };
}
