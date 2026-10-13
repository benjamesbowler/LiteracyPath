// Public world navigation only: no question, response, or progress inputs.
export function campaignRouteBreadcrumbs(start, route, spacing = 1.25, limit = 32) {
  const points = [];
  let previous = start, remaining = spacing;
  for (const next of route) {
    const distance = Math.hypot(next.x - previous.x, next.z - previous.z);
    if (distance > 0) {
      while (remaining <= distance && points.length < limit) {
        const fraction = remaining / distance;
        points.push({ x: previous.x + (next.x - previous.x) * fraction, z: previous.z + (next.z - previous.z) * fraction });
        remaining += spacing;
      }
      remaining -= distance;
    }
    previous = next;
    if (points.length === limit) break;
  }
  return points;
}

export function campaignDiscoveryTargets(layout, state = {}) {
  return layout.discoveries.filter(item => item.kind !== 'carry' || !(state.discoveredIds || []).includes(item.id)).map(item => {
    const delivering = item.kind === 'carry' && state.carrying === item.id;
    return { id: item.id, kind: 'discovery', objectKind: item.itemKind,
      label: delivering ? `Bring ${item.itemTitle} to the entrance` : item.kind === 'carry' ? `Find the ${item.itemTitle}` : item.title,
      action: item.kind === 'operate' ? 'operate' : delivering ? 'place' : 'pickup',
      point: delivering ? item.destination : item.source };
  });
}

// Optional objects yield space to mission portraits and actual HUD rectangles.
// Returning the original coordinates prevents a cue from pointing at another prop.
export function campaignUnobscuredDiscoveries(discoveries, missions, bounds, blocked = []) {
  const kept = [];
  for (const cue of discoveries) {
    if (!cue.visible || cue.x < 36 || cue.x > bounds.width - 36 || cue.y < 100 || cue.y > bounds.height - 100) continue;
    if (blocked.some(box => cue.x + 34 > box.left && cue.x - 34 < box.right && cue.y + 34 > box.top && cue.y - 34 < box.bottom)) continue;
    if ([...missions.filter(item => item.visible), ...kept].some(item => Math.hypot(item.x - cue.x, item.y - cue.y) < 82)) continue;
    kept.push(cue);
  }
  return kept;
}
