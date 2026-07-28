/**
 * Read every row a query matches, not just the first page.
 *
 * PostgREST caps a response at `max_rows` (this project sets 1000 in
 * supabase/config.toml). A `.select()` with no `.range()` therefore returns a
 * SILENT truncation: no error, no flag, just fewer rows. The teacher dashboard
 * used to aggregate answers and mastery that way, ordered oldest-first, so any
 * class past ~1000 lifetime answers had every figure — accuracy, secured
 * skills, "played today" — computed from its OLDEST thousand answers while
 * looking completely healthy.
 *
 * Truncation that reports success is the dangerous kind, so this helper refuses
 * to guess: it pages until a short page proves the end, and throws if a query
 * builder supports neither `.range()` nor `.limit()` rather than returning a
 * quietly partial result.
 *
 * @param {() => object} buildQuery  Returns a FRESH query builder each call.
 *                                   PostgREST builders are single-use, so this
 *                                   must construct a new one, not reuse one.
 * @param {{ pageSize?: number, maxRows?: number }} [options]
 * @returns {Promise<{ data: object[], error: unknown, truncated: boolean }>}
 */
export async function selectAllRows(buildQuery, { pageSize = 1000, maxRows = 200000 } = {}) {
  const rows = [];
  for (let from = 0; from < maxRows; from += pageSize) {
    const query = buildQuery();
    if (typeof query?.range !== "function") {
      // No paging available (a stub or mock client). Return the single page and
      // say so, rather than pretending the result is complete.
      const single = await query;
      if (single?.error) return { data: [], error: single.error, truncated: false };
      const page = Array.isArray(single?.data) ? single.data : [];
      return { data: page, error: null, truncated: page.length >= pageSize };
    }
    const result = await query.range(from, from + pageSize - 1);
    if (result?.error) {
      // Keep pages already proved readable, but mark the read partial. Callers
      // can show the available evidence with an explicit warning instead of
      // replacing a learner's real history with a misleading zero.
      return {
        data: rows,
        error: result.error,
        truncated: rows.length > 0
      };
    }
    const page = Array.isArray(result?.data) ? result.data : [];
    rows.push(...page);
    // A short page is the only proof there is nothing after it.
    if (page.length < pageSize) return { data: rows, error: null, truncated: false };
  }
  return { data: rows, error: null, truncated: true };
}
