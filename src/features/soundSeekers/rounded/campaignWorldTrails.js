// Ground coordinates are authored at the scale of each place. The first mark
// is close to the entrance and the last looks onto the local repair landmark.
const routes = {
  'meadow-01': [[-4, 17], [-1, 7], [-9, -10]],
  'meadow-02': [[8, 18], [16, 4], [1, -12]],
  'meadow-03': [[-8, 18], [-13, 2], [-4, -16]],
  'meadow-04': [[-6, 17], [-12, 6], [-9, -6]],
  'meadow-05': [[4, 17], [14, 2], [10, -4]],
  'meadow-06': [[-10, 17], [-14, 4], [1, -7]],
  'meadow-07': [[-7, 18], [2, 15], [7, 2]],
  'meadow-08': [[7, 18], [8, 0], [5, -12]],
  'meadow-09': [[-10, 18], [-13, 5], [-4, -8]],
  'meadow-10': [[-6, 18], [-5, 5], [-1, -9]],
  'dino-11': [[-9, 18], [-14, 5], [-9, -6], [-2, -11]],
  'dino-12': [[12, 17], [14, 7], [9, -1], [8, -9]],
  'dino-13': [[4, 19], [10, 10], [16, -2], [8, -7]],
  'dino-14': [[-13, 17], [-14, 5], [-14, -2], [-7, -4]],
  'dino-15': [[11, 18], [16, 4], [11, -3], [1, -7]],
  'dino-16': [[-5, 18], [-8, 7], [-3, -2], [-4, -9]],
  'dino-17': [[-4, 18], [3, 12], [12, 2], [11, -6]],
  'dino-18': [[0, 18], [-4, 8], [-8, 0], [-2, -7]],
  'dino-19': [[0, 18], [8, 11], [16, 6], [10, -7]],
  'dino-20': [[-16, 17], [-14, 5], [-9, -2], [-5, -10]],
  'moonwood-21': [[-15, 17], [-14, 5], [-10, -4], [-3, -8]],
  'moonwood-22': [[9, 18], [12, 9], [10, 1], [10, -9]],
  'moonwood-23': [[-4, 17], [-6, 8], [-13, 0], [-5, -8]],
  'moonwood-24': [[-10, 18], [-13, 7], [-15, -5], [-2, -10]],
  'moonwood-25': [[-16, 17], [-16, 5], [-12, -4], [-4, -8]],
  'moonwood-26': [[5, 18], [11, 10], [14, -1], [7, -7]],
  'moonwood-27': [[-3, 17], [-5, 7], [-9, -2], [-3, -8]],
  'moonwood-28': [[2, 18], [-3, 8], [-8, -2], [-2, -8]],
  'moonwood-29': [[2, 18], [9, 12], [16, 1], [8, -7]],
  'moonwood-30': [[-14, 17], [-14, 6], [-11, -3], [-3, -10]],
};

const themeLabels = {
  meadow: { label: 'Flower trail', marker: 'flower' },
  dino: { label: 'Amber trail', marker: 'amber stone' },
  moonwood: { label: 'Starlight trail', marker: 'star' },
};

export const CAMPAIGN_TRAIL_ID = 'trail';
export const CAMPAIGN_TRAIL_REACH = 1.45;

export function getCampaignTrail(layout) {
  const points = routes[layout?.stageId];
  const theme = themeLabels[layout?.worldId];
  if (!points || !theme) return null;
  const checkpoints = points.map(([x, z], index) => ({
    x,
    z,
    label: index === points.length - 1 ? 'Lookout' : `Trail ${theme.marker}`,
  }));
  return { id: CAMPAIGN_TRAIL_ID, stageId: layout.stageId, worldId: layout.worldId, label: theme.label, origin: layout.spawn, checkpoints };
}

export function campaignTrailTarget(trail, index) {
  const point = trail?.checkpoints[index];
  return point ? { id: trail.id, kind: CAMPAIGN_TRAIL_ID, label: point.label, point } : null;
}

export function advanceCampaignTrail(trail, index, player) {
  const target = campaignTrailTarget(trail, index);
  const distance = target && Math.hypot(player.x - target.point.x, player.z - target.point.z);
  return target && distance <= CAMPAIGN_TRAIL_REACH ? index + 1 : index;
}
