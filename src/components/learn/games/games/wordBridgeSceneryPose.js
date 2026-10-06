import { registeredPalCanvasPose } from '../shared/registeredPalArt.js';

// Bank, rack and workbench art remains uniformly scaled. A measured surface
// socket, rather than the rectangle's bottom edge, meets the control plane.
export function wordBridgeSceneryPose(atlas, frame, { x, y, width, socket = 'ground', mirror = false } = {}) {
  if (![x, y, width].every(Number.isFinite) || width <= 0 || typeof mirror !== 'boolean'
    || typeof socket !== 'string' || !frame?.sockets?.[socket]) return null;
  const sourceWidth = frame.cell?.[2] - frame.cell?.[0];
  if (!Number.isFinite(sourceWidth) || sourceWidth <= 0) return null;
  const unitScale = width * atlas.pixelsPerUnit / sourceWidth;
  const base = registeredPalCanvasPose(atlas, frame, { x: 0, y: 0, unitScale, mirror });
  const origin = { x: x - base.sockets[socket].x, y: y - base.sockets[socket].y };
  const pose = registeredPalCanvasPose(atlas, frame, { ...origin, unitScale, mirror });
  return { placement: { ...origin, unitScale, mirror }, pose, socket, attachment: { x, y } };
}
