// Camera framing is shared by native targets and the rendered collision tops.
// Short landscape reserves enough vertical separation for Pip and a shelf face;
// the invisible touch margin remains 56px without inflating the stone itself.
export function climbViewportMetrics(width,height) {
  const short=height<200;
  const viewHeight=short?300:350;
  return {viewHeight,cameraOffset:short?45:0,viewWidth:viewHeight*width/Math.max(1,height),heroPixels:Math.min(108,Math.max(60,height*.24)),shelfPixels:Math.min(42,Math.max(32,height*.07))};
}
