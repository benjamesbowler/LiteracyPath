const SCENE_WIDTH = 1920;
const SCENE_HEIGHT = 1080;
const DECORATION_MARGIN = 80;

// Use a uniform camera: fill the room without stretching the source art, then
// pull back only when needed to keep every authored display spot in view.
export function hollowRoomViewBox(width, height, spots = []) {
  if (!(width > 0) || !(height > 0)) return [0, 0, SCENE_WIDTH, SCENE_HEIGHT];
  const points = spots.filter(spot => Number.isFinite(spot.x) && Number.isFinite(spot.y));
  if (!points.length) return [0, 0, SCENE_WIDTH, SCENE_HEIGHT];
  const left = Math.min(...points.map(spot => spot.x * SCENE_WIDTH / 100)) - DECORATION_MARGIN;
  const right = Math.max(...points.map(spot => spot.x * SCENE_WIDTH / 100)) + DECORATION_MARGIN;
  const top = Math.min(...points.map(spot => spot.y * SCENE_HEIGHT / 100)) - DECORATION_MARGIN;
  const bottom = Math.max(...points.map(spot => spot.y * SCENE_HEIGHT / 100)) + DECORATION_MARGIN;
  const scale = Math.min(
    Math.max(width / SCENE_WIDTH, height / SCENE_HEIGHT),
    width / (right - left),
    height / (bottom - top)
  );
  const viewWidth = width / scale;
  const viewHeight = height / scale;
  return [
    Math.max(right - viewWidth, Math.min(left, (SCENE_WIDTH - viewWidth) / 2)),
    Math.max(bottom - viewHeight, Math.min(top, (SCENE_HEIGHT - viewHeight) / 2)),
    viewWidth,
    viewHeight
  ];
}
