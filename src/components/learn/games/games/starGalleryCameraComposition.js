// Framing uses every current label equally, plus the actual vehicle sole plane.
// Only the camera changes: no position, answer, collider or simulation clock.
export function composeGroveCamera(THREE, camera, { width, height, promptBottom, labels, player }) {
  camera.clearViewOffset(); camera.zoom = 1; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const worldPoints = labels.filter(point => new THREE.Vector3(...point).applyMatrix4(camera.matrixWorldInverse).z < -.1);
  const projected = () => worldPoints.map(point => new THREE.Vector3(...point).project(camera));
  const horizontalExtent = Math.max(.001, ...projected().map(point => Math.abs(point.x)));
  if (width < 650 && height > 430) camera.zoom = Math.min(1, .76 / horizontalExtent);
  camera.updateProjectionMatrix();
  let shift = 0;
  for (let attempt = 0; attempt < 6; attempt++) {
    const points = projected(), playerPoint = new THREE.Vector3(...player).project(camera);
    const labelTop = Math.min(height, ...points.map(point => (1 - point.y) * height / 2));
    const requiredShift = Math.max(0, promptBottom + 26 - labelTop);
    const availableShift = Math.max(0, height - 20 - (1 - playerPoint.y) * height / 2);
    shift = Math.min(requiredShift, availableShift);
    if (requiredShift <= availableShift || camera.zoom <= .45) break;
    camera.zoom *= .9; camera.updateProjectionMatrix();
  }
  if (shift > 0) camera.setViewOffset(width, height, 0, -shift, width, height);
  return { zoom: camera.zoom, shift, promptBottom };
}
