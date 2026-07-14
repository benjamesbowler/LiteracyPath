export function anticipatedJourneyState(state, completedStopId) {
  if (!completedStopId) return state;
  return {
    ...state,
    trail: {
      ...state.trail,
      stopsDone: [...new Set([...(state.trail?.stopsDone || []), completedStopId])]
    }
  };
}

export function promotePreparedJourneyLayers(layers) {
  const holding = layers.find(layer => layer.status === "holding");
  const incoming = layers.find(layer => layer.status === "preloading" && layer.ready);
  if (!holding || !incoming) return layers;
  return layers.map(layer => {
    if (layer.stopId === holding.stopId) return { ...layer, status: "departing" };
    if (layer.stopId === incoming.stopId) return { ...layer, status: "arriving" };
    return layer;
  });
}

export function prepareJourneyLayer(layers, fromStopId, nextStopId) {
  const active = layers.find(layer => layer.stopId === fromStopId && layer.status === "active");
  if (!active || layers.some(layer => layer.stopId === nextStopId)) return layers;
  return [
    ...layers,
    { stopId: nextStopId, status: "preloading", ready: false, anticipatedFrom: fromStopId }
  ];
}

export function markJourneyLayerReady(layers, stopId) {
  return promotePreparedJourneyLayers(layers.map(layer => (
    layer.stopId === stopId ? { ...layer, ready: true } : layer
  )));
}

export function finishJourneyLayer(layers, finishedStopId, nextStopId) {
  let nextLayers = layers.map(layer => (
    layer.stopId === finishedStopId ? { ...layer, status: "holding" } : layer
  ));
  if (!nextLayers.some(layer => layer.stopId === nextStopId)) {
    nextLayers = [
      ...nextLayers,
      { stopId: nextStopId, status: "preloading", ready: false, anticipatedFrom: finishedStopId }
    ];
  }
  return promotePreparedJourneyLayers(nextLayers);
}
