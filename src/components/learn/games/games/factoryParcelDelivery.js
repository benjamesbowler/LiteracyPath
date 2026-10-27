// Presentation geometry only: the existing result owner controls acceptance,
// save, pause and the next parcel. Hidden compact mouths use the chute body.
export function factoryParcelDelivery(parcel, chute, mouth) {
  if (!parcel || !chute || !(parcel.width > 0 && parcel.height > 0 && chute.width > 0 && chute.height > 0)) return null;
  const destination = mouth?.width > 0 && mouth?.height > 0 ? mouth : chute;
  const x = destination.x + destination.width / 2 - parcel.x - parcel.width / 2;
  const y = destination.y + destination.height / 2 - parcel.y - parcel.height / 2;
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}
