// Camera framing is shared by native targets and the rendered collision tops.
// The full world sits behind floating controls. Its next physical word station
// clears the upper cue while the climber's feet stay above the motor controls.
// Preserve the compact projection for legacy sub-200px embedded playfields.
export function climbViewportMetrics(width,height) {
  const short=height<200;
  const narrowShort=!short&&width<=520&&height<420;
  const viewHeight=short?300:narrowShort?600:500;
  return {viewHeight,cameraOffset:short?45:narrowShort?-20:0,viewWidth:viewHeight*width/Math.max(1,height),heroPixels:Math.min(108,Math.max(60,height*.24)),shelfPixels:Math.min(42,Math.max(32,height*.07))};
}

// Both authored palms and the physics sole keep the same x/y. Their depth
// clears the branch faces so a passing rest shelf cannot hide the climber.
export function climbActorDepth(surfaceDepth, ledgeFront, onTrunk) {
  return onTrunk ? Math.max(surfaceDepth + 6, ledgeFront + 36) : ledgeFront + 20;
}

export function climbGripVineMode(state) {
  if (["climbing", "gripping"].includes(state)) return "ascent";
  if (["clinging", "recovering"].includes(state)) return "safety";
  return null;
}
