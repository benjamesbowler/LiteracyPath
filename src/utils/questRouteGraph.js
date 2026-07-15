const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

const point = (x, z, y = 0) => ({ x, y, z });

const ROUTE_TEMPLATES = Object.freeze({
  meander: {
    points: [point(0, 8), point(-5, -8), point(4, -25), point(-7, -43), point(5, -62), point(-3, -82), point(6, -103), point(1, -124)]
  },
  "branching-grove": {
    points: [point(0, 8), point(3, -9), point(-5, -27), point(4, -47), point(0, -66), point(-6, -86), point(2, -106), point(0, -126)],
    branches: [
      { id: "west-cache", startProgress: 0.29, endProgress: 0.29, offsets: [point(0, 0), point(-12, -2), point(-16, 8)] },
      { id: "east-return", startProgress: 0.55, endProgress: 0.72, offsets: [point(0, 0), point(14, -4), point(10, -15), point(0, 0)] }
    ]
  },
  horseshoe: {
    points: [point(0, 8), point(-10, -4), point(-19, -20), point(-22, -40), point(-17, -58), point(-5, -69), point(10, -69), point(21, -58), point(24, -40), point(20, -22), point(10, -8), point(7, -25)]
  },
  switchback: {
    points: [point(0, 8), point(-18, -4, 0.2), point(17, -18, 0.55), point(-18, -34, 0.9), point(18, -51, 1.25), point(-14, -68, 1.7), point(16, -86, 2.05), point(0, -104, 2.35)]
  },
  "ridge-climb": {
    points: [point(0, 8, 0), point(7, -8, 0.3), point(-5, -24, 0.8), point(10, -40, 1.45), point(-8, -57, 2.1), point(7, -74, 2.85), point(-3, -92, 3.4), point(2, -112, 3.8)]
  },
  "island-loop": {
    points: [point(0, 8), point(-12, -2), point(-20, -18), point(-18, -37), point(-5, -48), point(12, -46), point(21, -32), point(19, -13), point(9, -1), point(4, -18), point(5, -39), point(1, -62)]
  },
  "figure-eight": {
    points: [point(0, 8), point(-13, -5), point(-18, -23), point(-8, -38), point(7, -44, 0.5), point(19, -57, 1.2), point(17, -76, 1.2), point(4, -88, 0.4), point(-10, -91), point(-18, -106), point(-7, -122), point(5, -128)]
  },
  spiral: {
    points: [point(0, 8), point(-14, 1), point(-24, -13), point(-25, -31), point(-15, -47), point(2, -54), point(17, -48), point(24, -34), point(21, -19), point(10, -10), point(-1, -13), point(-7, -24), point(-5, -38), point(4, -48), point(10, -61)]
  },
  "hub-and-spokes": {
    points: [point(0, 8), point(-5, -9), point(1, -27), point(0, -46), point(7, -64), point(-4, -82), point(2, -102), point(0, -122)],
    branches: [
      { id: "west-spoke", startProgress: 0.37, endProgress: 0.37, offsets: [point(0, 0), point(-14, -4), point(-18, 4)] },
      { id: "east-spoke", startProgress: 0.37, endProgress: 0.37, offsets: [point(0, 0), point(14, -3), point(18, 5)] },
      { id: "return-spoke", startProgress: 0.61, endProgress: 0.75, offsets: [point(0, 0), point(14, -5), point(10, -15), point(0, 0)] }
    ]
  },
  constellation: {
    points: [point(0, 8, 0), point(11, -5, 0.8), point(-6, -18, 1.7), point(16, -34, 2.6), point(-15, -50, 3.4), point(10, -67, 4.2), point(-8, -84, 5), point(14, -102, 5.8), point(0, -122, 6.5)]
  }
});

export const QUEST_ROUTE_TOPOLOGIES = Object.freeze(Object.keys(ROUTE_TEMPLATES));

export function routeMovementVector(direction, { lateral = 0, forward = 0 } = {}) {
  const directionX = finite(direction?.x);
  const directionZ = finite(direction?.z, -1);
  const planarLength = Math.hypot(directionX, directionZ) || 1;
  const forwardX = directionX / planarLength;
  const forwardZ = directionZ / planarLength;
  const rightX = -forwardZ;
  const rightZ = forwardX;
  const x = rightX * finite(lateral) + forwardX * finite(forward);
  const z = rightZ * finite(lateral) + forwardZ * finite(forward);
  return {
    x: Math.abs(x) < Number.EPSILON ? 0 : x,
    z: Math.abs(z) < Number.EPSILON ? 0 : z
  };
}

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
}

function transformPoint(source, origin, rotation, mirror) {
  const localX = (source.x - origin.x) * mirror;
  const localZ = source.z - origin.z;
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  return {
    x: origin.x + localX * cosine - localZ * sine,
    y: source.y,
    z: origin.z + localX * sine + localZ * cosine
  };
}

function hermitePoint(a, b, c, d, t, tension = 0.16) {
  const tangentScale = (1 - tension) * 0.5;
  const m1 = {
    x: (c.x - a.x) * tangentScale,
    y: (c.y - a.y) * tangentScale,
    z: (c.z - a.z) * tangentScale
  };
  const m2 = {
    x: (d.x - b.x) * tangentScale,
    y: (d.y - b.y) * tangentScale,
    z: (d.z - b.z) * tangentScale
  };
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return {
    x: h00 * b.x + h10 * m1.x + h01 * c.x + h11 * m2.x,
    y: h00 * b.y + h10 * m1.y + h01 * c.y + h11 * m2.y,
    z: h00 * b.z + h10 * m1.z + h01 * c.z + h11 * m2.z
  };
}

function samplePolyline(points, density = 1.35) {
  if (points.length < 2) return { samples: points.map(source => ({ ...source, distance: 0, progress: 0 })), totalLength: 0 };
  const rawSamples = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[Math.max(0, index - 1)];
    const start = points[index];
    const end = points[index + 1];
    const next = points[Math.min(points.length - 1, index + 2)];
    const steps = Math.max(8, Math.ceil(distance(start, end) * density));
    for (let step = index ? 1 : 0; step <= steps; step += 1) {
      rawSamples.push(hermitePoint(previous, start, end, next, step / steps));
    }
  }

  let totalLength = 0;
  const cumulative = [0];
  for (let index = 1; index < rawSamples.length; index += 1) {
    totalLength += distance(rawSamples[index - 1], rawSamples[index]);
    cumulative.push(totalLength);
  }

  const samples = rawSamples.map((source, index) => {
    const before = rawSamples[Math.max(0, index - 1)];
    const after = rawSamples[Math.min(rawSamples.length - 1, index + 1)];
    const tangentLength = distance(before, after) || 1;
    return {
      ...source,
      distance: cumulative[index],
      progress: totalLength ? cumulative[index] / totalLength : 0,
      tangentX: (after.x - before.x) / tangentLength,
      tangentY: (after.y - before.y) / tangentLength,
      tangentZ: (after.z - before.z) / tangentLength
    };
  });
  return { samples, totalLength };
}

function boundsFor(samples, padding) {
  const xs = samples.map(sample => sample.x);
  const ys = samples.map(sample => sample.y);
  const zs = samples.map(sample => sample.z);
  return {
    minX: Math.min(...xs) - padding,
    maxX: Math.max(...xs) + padding,
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    minZ: Math.min(...zs) - padding,
    maxZ: Math.max(...zs) + padding
  };
}

function interpolateSamples(samples, progress) {
  const target = clamp01(progress);
  if (target <= 0) return { ...samples[0] };
  if (target >= 1) return { ...samples.at(-1) };
  let low = 0;
  let high = samples.length - 1;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (samples[middle].progress < target) low = middle;
    else high = middle;
  }
  const a = samples[low];
  const b = samples[high];
  const span = Math.max(0.000001, b.progress - a.progress);
  const t = (target - a.progress) / span;
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
    distance: a.distance + (b.distance - a.distance) * t,
    progress: target,
    tangentX: a.tangentX + (b.tangentX - a.tangentX) * t,
    tangentY: a.tangentY + (b.tangentY - a.tangentY) * t,
    tangentZ: a.tangentZ + (b.tangentZ - a.tangentZ) * t
  };
}

function buildBranches(template, route, rotation, mirror) {
  return (template.branches || []).map(branch => {
    const start = interpolateSamples(route.samples, branch.startProgress);
    const end = interpolateSamples(route.samples, branch.endProgress);
    const offsets = branch.offsets.map(offset => transformPoint(
      point(start.x + offset.x, start.z + offset.z, start.y + offset.y),
      point(start.x, start.z, start.y),
      rotation,
      mirror
    ));
    offsets[0] = { x: start.x, y: start.y, z: start.z };
    if (branch.endProgress !== branch.startProgress) offsets[offsets.length - 1] = { x: end.x, y: end.y, z: end.z };
    const sampled = samplePolyline(offsets, 1.2);
    sampled.samples.forEach(sample => {
      sample.routeProgress = branch.startProgress + (branch.endProgress - branch.startProgress) * sample.progress;
    });
    return { ...branch, points: offsets, samples: sampled.samples, totalLength: sampled.totalLength };
  });
}

export function buildQuestRoute({ topology = "meander", seed = 1, width = 4.25 } = {}) {
  const template = ROUTE_TEMPLATES[topology] || ROUTE_TEMPLATES.meander;
  const origin = template.points[0];
  const rotation = ((Math.abs(Math.floor(finite(seed, 1))) - 1) % 4) * (Math.PI / 2);
  const mirror = Math.floor(Math.abs(finite(seed, 1)) / 4) % 2 ? -1 : 1;
  const points = template.points.map(source => transformPoint(source, origin, rotation, mirror));
  const sampled = samplePolyline(points);
  const route = {
    id: `${topology}-${Math.abs(Math.floor(finite(seed, 1)))}`,
    topology: ROUTE_TEMPLATES[topology] ? topology : "meander",
    seed: finite(seed, 1),
    width: finite(width, 4.25),
    points,
    samples: sampled.samples,
    totalLength: sampled.totalLength,
    branches: [],
    bounds: boundsFor(sampled.samples, finite(width, 4.25) + 8)
  };
  route.branches = buildBranches(template, route, rotation, mirror);
  const allSamples = [...route.samples, ...route.branches.flatMap(branch => branch.samples)];
  route.bounds = boundsFor(allSamples, route.width + 8);
  return route;
}

export function routePointAt(route, progress, lateral = 0) {
  if (!route?.samples?.length) return { x: 0, y: 0, z: 0, progress: 0, tangentX: 0, tangentY: 0, tangentZ: -1 };
  const result = interpolateSamples(route.samples, progress);
  const planarLength = Math.hypot(result.tangentX, result.tangentZ) || 1;
  const normalX = -result.tangentZ / planarLength;
  const normalZ = result.tangentX / planarLength;
  return {
    ...result,
    x: result.x + normalX * finite(lateral),
    z: result.z + normalZ * finite(lateral),
    normalX,
    normalZ
  };
}

export function routeDirectionAt(route, progress) {
  const pointAtProgress = routePointAt(route, progress);
  return {
    x: pointAtProgress.tangentX,
    y: pointAtProgress.tangentY,
    z: pointAtProgress.tangentZ,
    heading: Math.atan2(pointAtProgress.tangentX, pointAtProgress.tangentZ)
  };
}

export function routeSidePoint(route, progress, side = 1, offset = 0) {
  const width = (route?.width || 4.25) + finite(offset);
  return routePointAt(route, progress, (side < 0 ? -1 : 1) * width);
}

function nearestOnSamples(position, samples, maxProgress, progressKey = "progress") {
  let nearest = null;
  for (let index = 1; index < samples.length; index += 1) {
    const a = samples[index - 1];
    let b = samples[index];
    const aProgress = finite(a[progressKey], a.progress);
    const bProgress = finite(b[progressKey], b.progress);
    if (Math.min(aProgress, bProgress) > maxProgress + 0.000001) continue;
    if (bProgress > maxProgress && bProgress !== aProgress) {
      const cap = (maxProgress - aProgress) / (bProgress - aProgress);
      b = {
        x: a.x + (b.x - a.x) * cap,
        y: a.y + (b.y - a.y) * cap,
        z: a.z + (b.z - a.z) * cap,
        [progressKey]: maxProgress,
        progress: a.progress + (b.progress - a.progress) * cap
      };
    }
    const vx = b.x - a.x;
    const vz = b.z - a.z;
    const lengthSquared = vx * vx + vz * vz;
    if (lengthSquared < 0.000001) continue;
    const t = Math.max(0, Math.min(1, ((finite(position.x) - a.x) * vx + (finite(position.z) - a.z) * vz) / lengthSquared));
    const x = a.x + vx * t;
    const z = a.z + vz * t;
    const distanceSquared = (finite(position.x) - x) ** 2 + (finite(position.z) - z) ** 2;
    if (!nearest || distanceSquared < nearest.distanceSquared) {
      nearest = {
        x,
        y: a.y + (b.y - a.y) * t,
        z,
        progress: aProgress + (finite(b[progressKey], b.progress) - aProgress) * t,
        tangentX: vx / Math.sqrt(lengthSquared),
        tangentZ: vz / Math.sqrt(lengthSquared),
        distanceSquared
      };
    }
  }
  return nearest;
}

export function routeProgressAt(route, position) {
  if (!route?.samples?.length) return 0;
  const nearest = nearestOnSamples(position || route.samples[0], route.samples, 1);
  return clamp01(nearest?.progress || 0);
}

export function clampRoutePosition(position, route, maxProgress = 1) {
  if (!route?.samples?.length) return { x: finite(position?.x), y: finite(position?.y), z: finite(position?.z), routeProgress: 0 };
  const limit = clamp01(maxProgress);
  const candidates = [nearestOnSamples(position || route.samples[0], route.samples, limit)];
  route.branches.forEach(branch => {
    if (branch.startProgress <= limit + 0.000001) {
      candidates.push(nearestOnSamples(position, branch.samples, limit, "routeProgress"));
    }
  });
  const nearest = candidates.filter(Boolean).sort((a, b) => a.distanceSquared - b.distanceSquared)[0]
    || nearestOnSamples(route.samples[0], route.samples, limit);
  const dx = finite(position?.x, nearest.x) - nearest.x;
  const dz = finite(position?.z, nearest.z) - nearest.z;
  const offsetLength = Math.hypot(dx, dz);
  const allowedOffset = Math.min(route.width, offsetLength);
  const offsetScale = offsetLength > 0.000001 ? allowedOffset / offsetLength : 0;
  return {
    x: nearest.x + dx * offsetScale,
    y: nearest.y,
    z: nearest.z + dz * offsetScale,
    routeProgress: clamp01(Math.min(limit, nearest.progress))
  };
}
