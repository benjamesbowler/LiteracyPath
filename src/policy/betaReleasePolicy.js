export const BETA_RELEASE_POLICY = Object.freeze({
  channel: "beta",
  pendingMediaIsTestVisible: true,
  humanImageReviewBlocksDeployment: false,
  humanListeningReviewBlocksDeployment: false
});

export function isBetaMediaPairingTestVisible(status = "pending") {
  if (status === "quarantined") return false;
  if (status === "approved") return true;
  return status === "pending" && BETA_RELEASE_POLICY.pendingMediaIsTestVisible;
}
