const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// One live geometry authority for the painted rotating barrel, aim ray and
// actual foam-projectile origin. No target selection or answer snapping.
export function rhymeLauncherGeometry(width, height, aim = {}) {
  const portrait = width < 520, compact = portrait && height <= 520;
  const supportFloor = portrait && !compact ? height - 72 : height - (height <= 420 ? 8 : 18);
  const barrelLength = compact ? clamp((height-340)*.6+24, 24, 72)
    : portrait ? Math.min(clamp(height*.19, 54, width*.28), Math.max(24, (height-448)/2.5))
      : clamp(height * .19, 54, Math.min(132, width * .28));
  const pivot = { x: portrait ? width * (compact ? .67 : .77) : width * .5,
    y: compact ? supportFloor - 20 : portrait ? supportFloor - clamp(height*.16, 32, 92) : height - clamp(height * .16, 32, 92) };
  const target = { x: clamp(Number(aim.x) || width * .5, 20, width - 20),
    y: clamp(Number(aim.y) || height * .36, 24, pivot.y - 24) };
  const angle = Math.atan2(target.y - pivot.y, target.x - pivot.x);
  const direction = { x: Math.cos(angle), y: Math.sin(angle) };
  return { pivot, angle, direction, barrelLength, barrelHeight: barrelLength * .37, supportFloor,
    muzzle: { x: pivot.x + direction.x * barrelLength, y: pivot.y + direction.y * barrelLength }, target };
}

// Local entry and wind share the same vacant slot. Keep independent printed
// choices separated even when seven balloons occupy a short landscape row.
// This changes visual travel, never choice membership or impact ordering.
export function stepRhymeBalloon(balloon, layout, level, elapsed, dt) {
  const slot = layout.slots[balloon.slot];
  const travel = balloon.entering ? balloon.travel+dt*60 : balloon.travel;
  const progress = balloon.entering ? Math.min(1, travel/18) : 1;
  if (layout.circulation) {
    const { top, bend, left, right } = layout.circulation;
    const first = left+bend, last = right-bend, straight = last-first;
    const perimeter = straight*2+Math.PI*bend*2;
    let distance = (balloon.slot*perimeter/layout.slots.length+elapsed*(22+(level.act || 0)*5+level.dropRate*10))%perimeter;
    let x, y;
    if (distance < straight) { x = first+distance; y = top; }
    else if ((distance -= straight) < Math.PI*bend) {
      const angle = -Math.PI/2+distance/bend; x = last+Math.cos(angle)*bend; y = top+bend+Math.sin(angle)*bend;
    } else if ((distance -= Math.PI*bend) < straight) { x = last-distance; y = top+bend*2; }
    else {
      const angle = Math.PI/2+(distance-straight)/bend; x = first+Math.cos(angle)*bend; y = top+bend+Math.sin(angle)*bend;
    }
    return { r: slot.r, x, y, travel, entering: progress < 1 };
  }
  const sameRow = layout.slots.filter(row => row.y === slot.y).length;
  const spacing = layout.width/sameRow;
  const wind = layout.width < 520 ? 3 : Math.min(48, layout.width*.035);
  const amplitude = Math.min(wind, Math.max(0, (spacing-slot.r*2-14)/2));
  const speed = .8+level.dropRate+(level.act || 0)*.13;
  const wave = level.act === 0 ? Math.sin(elapsed*.9+balloon.phase) : level.act === 1
    ? Math.sin(elapsed*1.1+balloon.phase)*.7 : Math.sin(elapsed*.7+balloon.phase)+Math.sin(elapsed*.35)*.4;
  return { r: slot.r, x: slot.x+Math.sin(elapsed*speed+balloon.phase)*amplitude+balloon.direction*6*(1-progress),
    y: slot.y+wave*(layout.height <= 420 ? 3 : 12)+6*(1-progress), travel, entering: progress < 1 };
}

// Physical nearest impact along a frame's travel, rather than array order or
// an intended choice. This also prevents a fast shot tunnelling through a
// balloon while retaining the same radius and wall-bank play.
export function firstRhymeImpact(from, to, balloons, shotRadius = 0) {
  const dx = to.x - from.x, dy = to.y - from.y, a = dx * dx + dy * dy;
  let earliest = null;
  for (const balloon of balloons) {
    const x = from.x - balloon.x, y = from.y - balloon.y;
    const radius = balloon.r + shotRadius * .85, c = x * x + y * y - radius * radius;
    let u = c <= 0 ? 0 : null;
    if (u === null && a > 0) {
      const b = 2 * (x * dx + y * dy), discriminant = b * b - 4 * a * c;
      if (discriminant >= 0) { const hit = (-b - Math.sqrt(discriminant)) / (2 * a); if (hit >= 0 && hit <= 1) u = hit; }
    }
    if (u !== null && (!earliest || u < earliest.u)) earliest = { balloon, u, x: from.x + dx * u, y: from.y + dy * u };
  }
  return earliest;
}

// Split a bank at its actual wall-contact time, then sweep the reflected
// remainder. An obstacle before the wall always wins; no diagonal shortcut
// through the corner or answer-dependent reflection is possible.
export function stepRhymeProjectile(shot, dt, width, balloons) {
  let x = shot.x, y = shot.y, vx = shot.vx, remaining = Math.max(0, dt), banks = 0;
  const left = width * .06 + shot.r, right = width * .94 - shot.r;
  for (let segment = 0; segment < 3 && remaining > 0; segment++) {
    const wall = vx < 0 ? left : right;
    const toWall = vx ? (wall - x) / vx : Infinity;
    const bank = toWall >= 0 && toWall <= remaining, duration = bank ? toWall : remaining;
    const endpoint = { x: x + vx * duration, y: y + shot.vy * duration };
    const impact = firstRhymeImpact({ x, y }, endpoint, balloons, shot.r);
    if (impact) return { x: impact.x, y: impact.y, vx, banks, impact };
    x = endpoint.x; y = endpoint.y; remaining -= duration;
    if (bank) { vx *= -1; banks++; } else break;
  }
  return { x, y, vx, banks, impact: null };
}
