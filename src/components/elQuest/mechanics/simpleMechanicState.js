function evidence(round, response, supportLevel) {
  return { construct: round.construct, target: round.answer ?? round.targetLetters ?? round.targetGrapheme, response, supportLevel: Math.max(0, Number(supportLevel) || 0) };
}

export function chooseSimpleAnswer(round, selected, supportLevel = 0) {
  const target = round.mechanicId === "missingLetter" ? round.missingGrapheme : round.answer;
  const correct = Array.isArray(target)
    ? Array.isArray(selected) && selected.length === target.length && new Set(selected).size === target.length && target.every(word => selected.includes(word))
    : selected === target;
  return { correct, selected, evidence: evidence(round, selected, supportLevel) };
}

export function createCollection() { return { found: [], wrong: "", complete: false }; }

export function collectTarget(state, round, id, supportLevel = 0) {
  if (state.complete || state.found.includes(id)) return { state, outcome: null };
  const items = round.cells || round.objects || [];
  const itemId = item => String(item.id ?? item.word);
  const item = items.find(entry => itemId(entry) === id);
  if (!item) return { state, outcome: null };
  if (!item.matches) return {
    state: { ...state, wrong: id },
    outcome: { correct: false, selected: item.word || item.letter, evidence: evidence(round, item.word || item.letter, supportLevel) }
  };
  const found = [...state.found, id];
  const complete = items.filter(entry => entry.matches).every(entry => found.includes(itemId(entry)));
  const response = items.filter(entry => found.includes(itemId(entry))).map(entry => entry.word || entry.id);
  return {
    state: { found, wrong: "", complete },
    outcome: complete ? { correct: true, selected: response, evidence: evidence(round, response, supportLevel) } : null
  };
}

export function createMemory() { return { open: [], matched: [], mismatch: false, complete: false }; }
export function resetMemoryMiss(state) { return state.mismatch ? { ...state, open: [], mismatch: false } : state; }

export function flipMemoryCard(state, round, id, supportLevel = 0) {
  const card = round.cards.find(entry => entry.id === id);
  if (!card || state.complete || state.mismatch || state.open.includes(id) || state.matched.includes(id)) return { state, outcome: null };
  const open = [...state.open, id];
  if (open.length === 1) return { state: { ...state, open }, outcome: null };
  const words = open.map(cardId => round.cards.find(entry => entry.id === cardId).word);
  if (words[0] !== words[1]) return {
    state: { ...state, open, mismatch: true },
    outcome: { correct: false, selected: words, evidence: evidence(round, words, supportLevel) }
  };
  const matched = [...state.matched, ...open];
  const complete = matched.length === round.cards.length;
  return {
    state: { open: [], matched, mismatch: false, complete },
    outcome: complete ? { correct: true, selected: round.words, evidence: evidence(round, round.words, supportLevel) } : null
  };
}
