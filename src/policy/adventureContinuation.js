// Use the same saved station evidence and four-station gate in the map and
// station menu. An ordinary continuation must never bypass the mixed quest gate.
export function adventureStationContinuation(stations, savedCycle = {}, sessionStations = {}) {
  const savedStations = savedCycle.stations || {};
  const cycleFinished = Boolean(savedCycle.stars);
  const stationDone = id => Boolean(sessionStations[id] || savedStations[id] || (id === "check" && cycleFinished));
  const practiceDone = stations.filter(station => station.id !== "check" && stationDone(station.id)).length;
  const checkLocked = practiceDone < 4 && !cycleFinished;
  const nextStation = stations.find(station => station.id !== "check" && !station.optional && !stationDone(station.id))
    || (!checkLocked ? stations.find(station => station.id === "check") : null);
  return { stationDone, practiceDone, checkLocked, nextStation };
}
