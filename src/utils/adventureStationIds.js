// Older links and saved completion use the former station name. Keep their
// current compound-word game reachable without exposing the retired activity.
export function normalizeAdventureStationId(id) {
  return id === "poem" ? "compound" : id;
}
