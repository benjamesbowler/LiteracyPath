export const BETA_RELEASE_POLICY = Object.freeze({
  channel: "beta",
  continuousHumanReview: true,
  unreportedMediaIsAccepted: true,
  quarantineBlocksPublication: true
});

export function isBetaMediaPairingTestVisible(status = "accepted") {
  if (status === "quarantined") return false;
  return ["accepted", "approved", "pending", ""].includes(String(status || ""));
}
