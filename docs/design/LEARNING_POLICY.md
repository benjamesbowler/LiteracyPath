# Learning policy

**Owner:** `src/policy/learningPolicy.js`
**Permanent gate:** `npm run check:learning-policy`

LiteracyPath uses one versioned policy for learner accuracy conclusions. A
reporting or presentation layer must call the policy; it must not recreate a
numeric cutoff.

## Current contract

- **Secure:** 85–100%.
- **Developing:** 70–84%.
- **Needs support:** below 70%.
- **Not enough evidence:** the accuracy is based on fewer than eight scored
  learner responses, fewer than three independent attempts for an exact item,
  missing or stale evidence, or an otherwise insufficient confidence basis.
- **Not checked:** no scored evidence exists.
- Accuracy conclusions use evidence from the latest 90-day window.
- Stronger confidence requires at least 20 responses across at least three
  skills; moderate confidence requires at least two skills. Limited diversity
  is disclosed and may support an item-level conclusion only when the item
  attempt minimum and recency rule are met.
- Progression requires a Secure exact-item conclusion and at least two correct
  responses. Practice exposure alone cannot establish progression.
- Class outliers require policy-ready learner evidence and a distance of at
  least 15 percentage points from the policy-ready class median.

Every derived conclusion stores `policyVersion`. Historical assessment records
retain their recorded scoring-policy version; current report conclusions also
state the current learning-policy version so a future policy change is
auditable rather than silently rewriting history.

## Product behavior

A sparse or stale sample never creates a reteach group, outlier, mastery,
average, or challenge recommendation. The UI renders **Not enough evidence**
and discloses attempts, diversity, recency, confidence, and recorded support
use. A current, sufficiently large sample may resolve to Secure, Developing,
or Needs support.

## Change control

Change the policy version whenever a threshold, recency window, confidence
requirement, or progression rule changes. Update its unit boundary tests,
authenticated sparse-learner route test, reporting definitions, exports, and
this document in the same commit.
