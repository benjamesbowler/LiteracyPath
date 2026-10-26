import { Vector3 } from 'three';

// The opaque board is 428/512 of the sprite width: 3.05m, just inside
// the 3.15m lane pitch. Decorative gate growth must not shrink the words.
export const RACER_WORD_LABEL = Object.freeze({ width: 3.65, height: 1.78, rise: 1.24, forward: .25, textEm: 112 / 256 });

export function sizeRacerWordLabel(sprite, gateScale) {
  const inverse = 1 / Math.max(.001, gateScale);
  sprite.scale.set(RACER_WORD_LABEL.width * inverse, RACER_WORD_LABEL.height * inverse, inverse);
  sprite.position.set(0, RACER_WORD_LABEL.rise * inverse, RACER_WORD_LABEL.forward * inverse);
}

/** The actual Three billboard transform also owns Canvas and DEV measurements. */
export function racerWordLabelFrame(sprite, camera, width, height) {
  if (!sprite || !(width > 0 && height > 0)) return null;
  sprite.updateWorldMatrix(true, false);
  const position = new Vector3().setFromMatrixPosition(sprite.matrixWorld);
  const depth = -position.clone().applyMatrix4(camera.matrixWorldInverse).z;
  if (!(depth > camera.near)) return null;
  const scale = new Vector3().setFromMatrixScale(sprite.matrixWorld);
  const projected = position.project(camera);
  const w = scale.x * camera.projectionMatrix.elements[0] * width / (2 * depth);
  const h = scale.y * camera.projectionMatrix.elements[5] * height / (2 * depth);
  const x = (projected.x + 1) * width / 2 - w * sprite.center.x;
  const y = (1 - projected.y) * height / 2 - h * (1 - sprite.center.y);
  return { x, y, width: w, height: h, depth, textEmHeight: h * RACER_WORD_LABEL.textEm };
}
