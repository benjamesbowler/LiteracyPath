// Conservative estimated active play, not a wall-clock duration or evidence of
// learning. Ephemeral timestamps never enter a checkpoint or cloud payload.
export const CAMPAIGN_IDLE_MS = 30_000;
const milliseconds = value => Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
export function campaignPlayTimeSnapshot(value = {}) {
  const estimatedActiveMs = milliseconds(value.estimatedActiveMs);
  return { v: 1, estimatedActiveMs, estimatedHelpMs: Math.min(estimatedActiveMs, milliseconds(value.estimatedHelpMs)) };
}
export function mergeCampaignPlayTime(a, b) {
  const left = campaignPlayTimeSnapshot(a), right = campaignPlayTimeSnapshot(b);
  return { v: 1, estimatedActiveMs: Math.max(left.estimatedActiveMs, right.estimatedActiveMs),
    estimatedHelpMs: Math.max(left.estimatedHelpMs, right.estimatedHelpMs) };
}
export function createCampaignPlayClock(saved = {}, nowMs = 0) {
  const now = milliseconds(nowMs);
  return { ...campaignPlayTimeSnapshot(saved), lastTickMs: now, lastActivityMs: now, blocked: true, helpOpen: false };
}
export function advanceCampaignPlayClock(clock, { nowMs, activity = false, paused = false, hidden = false, loading = false, helpOpen = false } = {}) {
  if (!Number.isFinite(nowMs) || nowMs < clock.lastTickMs) return { ...clock };
  const now = Math.floor(nowMs), blocked = hidden || loading || (paused && !helpOpen);
  const delta = now - clock.lastTickMs;
  // A long/unobserved frame is not proof of play. Also never retroactively
  // count the idle interval immediately before a returning input event.
  const eligible = !blocked && !clock.blocked && delta <= 1000;
  const elapsed = eligible ? Math.max(0, Math.min(now, clock.lastActivityMs + CAMPAIGN_IDLE_MS) - clock.lastTickMs) : 0;
  return { ...clock, estimatedActiveMs: clock.estimatedActiveMs + elapsed,
    estimatedHelpMs: clock.estimatedHelpMs + (helpOpen && clock.helpOpen ? elapsed : 0),
    lastTickMs: now, lastActivityMs: activity ? now : clock.lastActivityMs, blocked, helpOpen };
}

export function summarizeCampaignPlayTime(progress) {
  const campaign = progress?.campaign || {};
  const result = { metric: 'estimated-active-play', completedFirstPlayMs: 0, unfinishedFirstPlayMs: 0,
    retainedReplayActiveMs: 0, estimatedHelpMs: 0, completedMissionsWithoutTiming: 0 };
  for (const completion of Object.values(campaign.completedMissions || {})) {
    if (!completion.playTime) result.completedMissionsWithoutTiming++;
    const time = campaignPlayTimeSnapshot(completion.playTime);
    result.completedFirstPlayMs += time.estimatedActiveMs; result.estimatedHelpMs += time.estimatedHelpMs;
  }
  for (const [id, checkpoint] of Object.entries(campaign.checkpoints || {})) {
    const time = campaignPlayTimeSnapshot(checkpoint.playTime);
    if (checkpoint.replayOrdinal > 0) result.retainedReplayActiveMs += time.estimatedActiveMs;
    else if (!campaign.completedMissions?.[id]) result.unfinishedFirstPlayMs += time.estimatedActiveMs;
    else continue;
    result.estimatedHelpMs += time.estimatedHelpMs;
  }
  // Only the retained replay checkpoint is measured; older replay attempts
  // are not added or reconstructed from response logs.
  return result;
}
