import * as THREE from 'three';
import { campaignCanWalk, campaignRoadSamples, campaignTerrainHeight, segmentDistance } from './campaignWorldLayouts.js';

export function campaignGroundColour(theme, x, z) {
  const patch = (Math.sin(x * .32) + Math.cos(z * .23 + x * .12) + 2) / 4;
  return new THREE.Color(theme.soil).lerp(new THREE.Color(theme.grass), .28 + patch * .6);
}

export function sampleCampaignRoads(layout) {
  return layout.roads.map(road => ({ points: campaignRoadSamples(road), halfWidth: road.width / 2 }));
}

// The road keeps its exact authored width and centreline. A vertex-coloured
// shoulder blends into the same ground palette without alpha sorting, another
// mesh, or a changed walking rule. Crossroads share paint, avoiding dark seams.
export function campaignRoadGeometry(layout, road, theme, roads = sampleCampaignRoads(layout)) {
  const points = campaignRoadSamples(road), positions = [], colours = [], uvs = [], indices = [];
  const strips = [-1, -.86, -.65, .65, .86, 1];
  const paint = new THREE.Color(theme.soil).lerp(new THREE.Color(theme.road), .8);
  const roadDistance = (x, z) => {
    let nearest = Infinity;
    for (const candidate of roads) for (let i = 1; i < candidate.points.length; i++) {
      nearest = Math.min(nearest, segmentDistance(x, z, candidate.points[i - 1], candidate.points[i]) / candidate.halfWidth);
    }
    return nearest;
  };
  const vertex = (x, z) => {
    positions.push(x, campaignTerrainHeight(layout, x, z) + .04, z);
    uvs.push(x / 240 + .5, .5 - z / 240);
    const edge = Math.max(0, Math.min(1, (roadDistance(x, z) - .65) / .35));
    const colour = paint.clone().lerp(campaignGroundColour(theme, x, z), edge * edge * (3 - 2 * edge));
    colours.push(colour.r, colour.g, colour.b);
  };
  for (let i = 0; i < points.length; i++) {
    const previous = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
    const distance = Math.hypot(next[0] - previous[0], next[1] - previous[1]) || 1;
    const nx = -(next[1] - previous[1]) / distance * road.width / 2;
    const nz = (next[0] - previous[0]) / distance * road.width / 2;
    const [x, z] = points[i];
    for (const offset of strips) {
      const px = x + nx * offset, pz = z + nz * offset;
      vertex(px, pz);
    }
    if (i < points.length - 1) for (let strip = 0; strip < strips.length - 1; strip++) {
      const a = i * strips.length + strip, b = a + strips.length;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  // Round a terminal edge only inside clear existing ground. These caps do not
  // create a new route through water or a trunk, or alter the route graph.
  for (const end of [0, points.length - 1]) {
    const a = points[end], b = points[end === 0 ? 1 : points.length - 2];
    const dx = a[0] - b[0], dz = a[1] - b[1], length = Math.hypot(dx, dz) || 1;
    const arc = Array.from({ length: 13 }, (_, i) => {
      const angle = -Math.PI / 2 + i * Math.PI / 12;
      return [a[0] + (dx * Math.cos(angle) - dz * Math.sin(angle)) / length * road.width / 2,
        a[1] + (dz * Math.cos(angle) + dx * Math.sin(angle)) / length * road.width / 2];
    });
    if (!arc.every(([x, z]) => campaignCanWalk(layout, x, z))) continue;
    const centre = positions.length / 3;vertex(...a);arc.forEach(point => vertex(...point));
    for (let i = 0; i < arc.length - 1; i++) {
      const cross = (arc[i][0] - a[0]) * (arc[i + 1][1] - a[1]) - (arc[i][1] - a[1]) * (arc[i + 1][0] - a[0]);
      indices.push(centre, centre + i + (cross <= 0 ? 1 : 2), centre + i + (cross <= 0 ? 2 : 1));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
