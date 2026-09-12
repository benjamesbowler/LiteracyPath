// Canvas padding changes the billboard size, not the character's world scale.
export const HERO_BILLBOARD = Object.freeze({ size:512, x:256, footY:496, drawHeight:310, worldSize:3.2*512/384 });
export const RESIDENT_BILLBOARD = Object.freeze({ size:384, x:192, footY:380, drawHeight:215, worldSize:2.65*384/256 });

/** Keep the camera on the player side of even a nearby tree/trunk hit. */
export function cameraReachBeforeObstacle(desiredReach, hitDistance) {
  if (!Number.isFinite(hitDistance) || hitDistance <= 0) return desiredReach;
  return Math.min(desiredReach, hitDistance - Math.min(1, hitDistance * .25));
}

/** The landscape owns this canvas. A disposed renderer does not reset WebGL's
 * pixel-store flags, while Three creates empty 3D textures in its constructor.
 * Normalize that inherited upload state before constructing the next renderer. */
export function prepareLandscapeContext(canvas) {
  const gl = canvas.getContext('webgl2', { alpha:false, antialias:true, depth:true, stencil:false, premultipliedAlpha:true, preserveDrawingBuffer:false, powerPreference:'high-performance' });
  if (!gl) throw new Error('This landscape needs a WebGL2 context.');
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
  for (const key of ['UNPACK_ROW_LENGTH','UNPACK_IMAGE_HEIGHT','UNPACK_SKIP_PIXELS','UNPACK_SKIP_ROWS','UNPACK_SKIP_IMAGES']) gl.pixelStorei(gl[key], 0);
  return gl;
}
