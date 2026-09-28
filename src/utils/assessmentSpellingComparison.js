/** Align written forms for teacher inspection only. This never judges a sound or scores an answer. */
export function alignWrittenForms(expected = "", written = "") {
  const target = Array.from(String(expected).trim().toLowerCase());
  const response = Array.from(String(written).trim().toLowerCase());
  const cost = Array.from({ length: target.length + 1 }, (_, i) => Array.from({ length: response.length + 1 }, (_, j) => i ? (j ? 0 : i) : j));
  for (let i = 1; i <= target.length; i += 1) {
    for (let j = 1; j <= response.length; j += 1) {
      cost[i][j] = Math.min(cost[i - 1][j] + 1, cost[i][j - 1] + 1, cost[i - 1][j - 1] + (target[i - 1] === response[j - 1] ? 0 : 1));
    }
  }
  const parts = [];
  let i = target.length;
  let j = response.length;
  while (i || j) {
    if (i && j && cost[i][j] === cost[i - 1][j - 1] + (target[i - 1] === response[j - 1] ? 0 : 1)) {
      parts.unshift({ expected: target[i - 1], written: response[j - 1], differs: target[i - 1] !== response[j - 1] });
      i -= 1; j -= 1;
    } else if (i && cost[i][j] === cost[i - 1][j] + 1) {
      parts.unshift({ expected: target[i - 1], written: "", differs: true });
      i -= 1;
    } else {
      parts.unshift({ expected: "", written: response[j - 1], differs: true });
      j -= 1;
    }
  }
  return parts;
}
