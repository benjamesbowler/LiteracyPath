# Learning policy

**Owner:** `src/policy/learningPolicy.js`
**Permanent gate:** `npm run check:learning-policy`

LiteracyPath uses one versioned policy for learner accuracy conclusions. A
reporting or presentation layer must call the policy; it must not recreate a
numeric cutoff.

## Current contract

- **Secure:** 90–100%.
- **Developing:** 70–89%.
- **Needs support:** below 70%.
- **Not enough evidence:** the accuracy does not meet the declared conclusion
  scope, is missing or stale, or has an otherwise insufficient confidence
  basis.
- **Not checked:** no scored evidence exists.
- Accuracy conclusions use evidence from the latest 90-day window.
- Every policy call declares one of three scopes:
  - **General learner/class:** at least ten current scored responses across
    at least two distinct skills. One heavily practised skill cannot become a
    whole-learner or whole-class judgement.
  - **Named skill:** at least ten current scored responses for that named
    skill. The UI must keep the skill name attached to the conclusion.
  - **Exact item instructional progression:** at least three independent current
    attempts at that exact item. Repeated variants in one sitting count once.
    This is a practice-progression rule, not a reportable proficiency judgement.
- Stronger general confidence requires at least 20 responses across at least
  three skills; moderate general confidence requires at least two skills.
  Single-skill evidence is sufficient only for an explicitly named skill or
  exact-item conclusion.
- Progression requires a Secure exact-item conclusion and at least two correct
  responses. Practice exposure alone cannot establish progression.
- Class outliers require policy-ready learner evidence and a distance of at
  least 15 percentage points from the policy-ready class median.
- Class summaries always distinguish learner-weighted accuracy (each
  policy-ready learner counts once) from response-weighted accuracy (each
  scored response counts once), with both denominators visible.
- A single headline class average is comparable only with at least two
  policy-ready learners, at least 70% policy-ready learner coverage, and no
  more than a 4:1 response-count imbalance. When any condition fails, both
  descriptive views remain visible but the single headline is suppressed.
- **Secure** is a current acquisition judgement. A separate retained-learning
  claim additionally needs Secure evidence on at least two separate days and a
  successful re-probe 14–28 days later. Until those longitudinal observations
  are stored, the app must not claim that retention has been validated.

Every derived conclusion stores `policyVersion`. Historical assessment records
retain their recorded scoring-policy version; current report conclusions also
state the current learning-policy version so a future policy change is
auditable rather than silently rewriting history.

## Product behavior

A sparse or stale sample never creates a reteach group, outlier, mastery,
average, or challenge recommendation. A single-skill result may create a
clearly named skill conclusion, but it cannot create an overall learner band,
class average, outlier or general recommendation. The UI renders **Not enough
evidence** for the broader scope and discloses attempts, diversity, recency,
confidence, and recorded support use.

## Change control

Change the policy version whenever a threshold, recency window, confidence
requirement, or progression rule changes. Update its unit boundary tests,
authenticated sparse-learner route test, reporting definitions, exports, and
this document in the same commit.

## Cycle Practice activity and check evidence

`src/policy/cyclePracticePolicy.js` owns Cycle Practice policy v2. The existing
30-minute requirement counts active participation, not a browser left open.
Active time is credited only between learner inputs in visible, unpaused
practice. Interactions more than 60 seconds apart are treated as an idle gap
and earn no time for that gap. This is an explicit conservative product rule,
not a measurement of attention. Background, pause, check and offline refresh
intervals earn no practice time. A monotonic clock separates session elapsed,
active practice and check duration; practice freezes when the check starts.
Refresh restores the same session, item, support history and frozen submission.

Checks preserve the first response. Supported and unavailable-media records are
unscored, disclosed separately, and leave independent evidence incomplete.
Accuracy uses only independently scored responses. Actual mechanic constructs
(e.g. memory retrieval or supported formation) remain distinct from decoding
and handwriting proficiency. Cycle checks never establish formal Skills/EL
placement. Failed saving retries the identical attempt and answers.
