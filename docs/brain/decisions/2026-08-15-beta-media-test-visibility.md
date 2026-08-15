---
type: decision
status: active
date: 2026-08-15
authority: release-policy
---

# Beta media test visibility

## Decision

LiteracyPath is currently a beta. A runtime-reachable media pairing with a
`pending` review status is visible during beta testing. `approved` continues to
mean an explicit human decision; beta publication must not rewrite pending rows
or claim that human image or listening review occurred.

`quarantined` remains fail-closed and removes the pairing from runtime
immediately. The Admin Media QA surface remains the route for approving or
quarantining individual pairings.

Human image review and listening review are quality programmes during beta, not
deployment blockers. Structural integrity, path resolution, media quality,
watermark policy, curriculum, accessibility, security and build failures remain
blocking release gates.

## Authority and rollback

The runtime rule is defined in `src/policy/betaReleasePolicy.js`. Runtime media
selection uses `isMediaPairingRuntimeAllowed`, while
`isMediaPairingApproved` retains its narrower human-decision meaning. The main
release registry runs `check:media-review-beta`; the stricter
`check:media-review-release` remains available to measure genuine review
completion.

An individual error is rescinded by recording `quarantined`. Ending the beta
policy requires changing the shared policy and canonical release gate together,
with their behavioural tests, rather than editing generated review inventories.
