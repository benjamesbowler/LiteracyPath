export function resolveSequencedRows({
  sequence,
  currentSequence,
  data
} = {}) {
  return {
    current: sequence === currentSequence,
    valid: Array.isArray(data),
    rows: Array.isArray(data) ? data : []
  };
}
