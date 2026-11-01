import { interpolateArcadeMotion } from '../shared/arcadeMotion.js';
const playerKeys = ['air', 'yaw', 'surfacePitch', 'surfaceRoll'];

// Scene transforms retain their authoritative latest-step pose separately from
// the fractional presentation. Camera damping always starts from simulation,
// never from the interpolated position submitted on the preceding frame.
export function createSpellSkateRenderMotion(objects, player) {
  let previous = null, current = null, discontinuous = false;
  const capture = () => ({ objects: objects.map(object => ({ position: object.position.clone(), quaternion: object.quaternion.clone() })),
    player: { ...player, pos: player.pos.clone() } });
  const restore = () => {
    if (!current) return;
    objects.forEach((object, index) => {
      object.position.copy(current.objects[index].position);
      object.quaternion.copy(current.objects[index].quaternion);
    });
  };
  return {
    beforeStep() {
      discontinuous = Boolean(current && current.player.pos.distanceToSquared(player.pos) > 1e-8);
      restore(); previous = capture();
    },
    afterStep() {
      current = capture();
      if (discontinuous || previous.player.pos.distanceToSquared(current.player.pos) > 6.25) previous = current;
    },
    reset() { restore(); previous = current = null; },
    sample(alpha) {
      if (!previous || !current) return player;
      const amount = Math.max(0, Math.min(1, alpha));
      objects.forEach((object, index) => {
        object.position.lerpVectors(previous.objects[index].position, current.objects[index].position, amount);
        object.quaternion.slerpQuaternions(previous.objects[index].quaternion, current.objects[index].quaternion, amount);
      });
      const view = interpolateArcadeMotion(previous.player, current.player, amount, { ...player }, playerKeys, ['yaw']);
      view.pos = player.pos.clone().lerpVectors(previous.player.pos, current.player.pos, amount);
      return view;
    }
  };
}
