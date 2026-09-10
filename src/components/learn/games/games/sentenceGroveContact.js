// The cut prompt and cut action share the same physical target selection.
export const GROVE_CUT_REACH = 4.2;
export function nearestCuttableTree(player, tokens) {
  let nearest = null;
  let distance = GROVE_CUT_REACH;
  for (const token of tokens) {
    if (token.smashed || token.cooldown > 0) continue;
    const position = token.group?.position || token.position;
    if (!position) continue;
    const next = Math.hypot(player.x - position.x, player.z - position.z);
    if (next < distance) { nearest = token; distance = next; }
  }
  return nearest;
}

// The authored bonnet points along local -Z; movement uses heading +Z.
export const groveVehicleYaw = heading => heading + Math.PI;
