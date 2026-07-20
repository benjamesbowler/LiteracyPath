// Bounded, deterministic Hollow history policy.
//
// The ledger uses random record ids so cross-device merges can union actions,
// but an uncapped union grows forever. Normal play has hard semantic limits:
// each beastie needs at most eight feeds and the catalogue cannot legitimately
// produce hundreds of purchases. Apply the same normalization at load,
// persist, and merge boundaries so every device converges on one bounded list.

export const MAX_HOLLOW_PURCHASE_RECORDS = 128;
export const MAX_HOLLOW_FEEDS_PER_SPECIES = 8;

function compareRecords(a, b) {
  const atA = String(a?.at || "");
  const atB = String(b?.at || "");
  if (atA !== atB) return atA < atB ? -1 : 1;
  const idA = String(a?.id || "");
  const idB = String(b?.id || "");
  return idA < idB ? -1 : idA > idB ? 1 : 0;
}

export function uniqueHollowRecords(records = []) {
  const byId = new Map();
  for (const record of Array.isArray(records) ? records : []) {
    const id = String(record?.id || "");
    if (!id || byId.has(id)) continue;
    byId.set(id, record);
  }
  return [...byId.values()].sort(compareRecords);
}

export function boundedHollowPurchases(records = []) {
  // Keep the earliest accepted history. Purchases are irreversible ownership
  // and spend records; if a corrupt legacy ledger exceeds the generous cap,
  // retaining later rows at the expense of early gear would take items away.
  return uniqueHollowRecords(records).slice(0, MAX_HOLLOW_PURCHASE_RECORDS);
}

export function boundedHollowFeeds(records = []) {
  const counts = new Map();
  const bounded = [];
  for (const record of uniqueHollowRecords(records)) {
    const species = String(record?.species || "");
    if (!species) continue;
    const count = counts.get(species) || 0;
    if (count >= MAX_HOLLOW_FEEDS_PER_SPECIES) continue;
    counts.set(species, count + 1);
    bounded.push(record);
  }
  return bounded;
}
