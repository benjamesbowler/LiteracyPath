/**
 * What an account is allowed to do.
 *
 * WHY THIS EXISTS. Searching the codebase for entitlement, subscription, trial,
 * locked, premium, paywall, plan, tier, billing or checkout returns nothing
 * relevant — every keyword hit is something else (`premiumGameStandard.js` is
 * GPU setpiece budgets, `lockedItemAffordance.js` is the in-game coin shop).
 * The app has exactly one access gate, `isTeacherAccountApproved()`, and it is
 * binary: you are in, or you are out. There has never been a way to say "this
 * account gets some of it".
 *
 * Two things now need that sentence. The anonymous try-mode gets a slice of the
 * content and stores nothing at all; a family tier later gets a slice and keeps
 * progress. Neither can be built on top of a binary gate.
 *
 * THIS PHASE CHANGES NOTHING FOR ANY EXISTING ACCOUNT. Every real account
 * resolves to SCHOOL, which allows everything, and a missing entitlement row
 * resolves to SCHOOL too. That is deliberate: the riskiest new machinery in the
 * product should be proved under zero user pressure before a single person
 * depends on it. When it is time, the free tier is a different plan id, not a
 * refactor.
 *
 * NOTHING HERE TOUCHES REACT, THE NETWORK OR STORAGE. It is a pure function
 * from an account to a capability set, so it can be tested from node --test in
 * the same shape as childTrailPolicy.js and studentRailPolicy.js.
 */

export const ENTITLEMENT_POLICY_VERSION = "2026.08.07-entitlements-1";

export const PLAN_IDS = Object.freeze({
  /** A teacher inside an approved school. Everything, no limits. */
  SCHOOL: "school",
  /** The anonymous try-mode. A content slice and, crucially, no persistence. */
  DEMO_TRY: "demo_try",
  /** Reserved. A registered family on the free tier — a slice, but progress kept. */
  FAMILY_FREE: "family_free",
  /** Reserved. A paying family. */
  FAMILY_PAID: "family_paid"
});

export const CONTENT_SCOPES = Object.freeze({
  FULL: "full",
  SAMPLE: "sample"
});

/**
 * The capabilities. Every one is a thing some plan genuinely withholds — a flag
 * nothing ever turns off is a flag nobody maintains.
 *
 * `persistProgress` is the load-bearing one. It is false for exactly one plan,
 * and when it is false NOTHING may reach localStorage or the database. That is
 * not a preference; it is the entire legal basis on which an anonymous child
 * may use the product without consent, so it is enforced at the storage and
 * network boundaries rather than trusted to each feature.
 */
export const CAPABILITIES = Object.freeze([
  "persistProgress",
  "cloudSync",
  "reporting",
  "export",
  "leaderboard",
  "assessments",
  "createLearners"
]);

const FULL_ACCESS = Object.freeze({
  persistProgress: true,
  cloudSync: true,
  reporting: true,
  export: true,
  leaderboard: true,
  assessments: true,
  createLearners: true
});

export const PLANS = Object.freeze({
  [PLAN_IDS.SCHOOL]: Object.freeze({
    id: PLAN_IDS.SCHOOL,
    label: "School",
    contentScope: CONTENT_SCOPES.FULL,
    learnerSlots: null,
    capabilities: FULL_ACCESS
  }),

  [PLAN_IDS.DEMO_TRY]: Object.freeze({
    id: PLAN_IDS.DEMO_TRY,
    label: "Try it",
    contentScope: CONTENT_SCOPES.SAMPLE,
    learnerSlots: 0,
    capabilities: Object.freeze({
      // The whole point. Nothing is written anywhere, so nothing is collected,
      // so there is nothing to consent to.
      persistProgress: false,
      cloudSync: false,
      reporting: false,
      export: false,
      // Off for a second reason as well as the first: get_game_leaderboard is
      // anon-callable and returns other children's display names.
      leaderboard: false,
      // An assessment result nobody can keep is a waste of a child's attention.
      assessments: false,
      createLearners: false
    })
  }),

  [PLAN_IDS.FAMILY_FREE]: Object.freeze({
    id: PLAN_IDS.FAMILY_FREE,
    label: "Family",
    contentScope: CONTENT_SCOPES.SAMPLE,
    learnerSlots: 2,
    capabilities: Object.freeze({
      persistProgress: true,
      cloudSync: true,
      // Reporting is the school product. Giving it away free would be giving
      // away the half that is actually sold.
      reporting: false,
      export: false,
      leaderboard: false,
      assessments: false,
      createLearners: true
    })
  }),

  [PLAN_IDS.FAMILY_PAID]: Object.freeze({
    id: PLAN_IDS.FAMILY_PAID,
    label: "Family plus",
    contentScope: CONTENT_SCOPES.FULL,
    learnerSlots: 2,
    capabilities: Object.freeze({
      persistProgress: true,
      cloudSync: true,
      reporting: false,
      export: false,
      leaderboard: false,
      assessments: false,
      createLearners: true
    })
  })
});

/**
 * The plan an unknown account gets.
 *
 * SCHOOL, not the most restrictive option, and that is a considered choice for
 * this phase only. Every account that exists today is a school teacher, the
 * entitlements table has not been populated yet, and a resolver that failed
 * closed would lock every real user out of a product they are already using in
 * classrooms. Failing open here risks nothing, because no plan below SCHOOL can
 * be reached without a row deliberately saying so.
 *
 * WHEN THE FAMILY TIER SHIPS THIS MUST FLIP. At that point an account with no
 * row is a bug rather than a backlog item, and the safe default becomes the
 * smallest plan. `entitlementPolicy.test.js` names this so the change is a
 * failing test rather than an oversight.
 */
export const DEFAULT_PLAN_ID = PLAN_IDS.SCHOOL;

export function planFor(planId) {
  return PLANS[String(planId || "").toLowerCase()] || PLANS[DEFAULT_PLAN_ID];
}

/**
 * The single answer to "what may this account do".
 *
 * Read ONCE at sign-in into a context, never per render. A capability check
 * that hits the database on every keystroke is a capability check that gets
 * cached badly somewhere else.
 */
export function resolveEntitlement(row = null, { now = null } = {}) {
  const planId = row?.plan_id || row?.planId || DEFAULT_PLAN_ID;
  const plan = planFor(planId);
  const expired = isExpired(row, now);

  // An expired row falls back to the default rather than to nothing. Losing
  // access to a classroom mid-lesson because a date passed is a worse failure
  // than a lapsed plan staying open until someone notices.
  const effective = expired ? planFor(DEFAULT_PLAN_ID) : plan;

  return Object.freeze({
    planId: effective.id,
    label: effective.label,
    contentScope: effective.contentScope,
    learnerSlots: effective.learnerSlots,
    capabilities: effective.capabilities,
    expired,
    // True when nothing about this session may be written down, anywhere.
    ephemeral: effective.capabilities.persistProgress === false,
    source: row?.source || (row ? "row" : "default"),
    policyVersion: ENTITLEMENT_POLICY_VERSION
  });
}

function isExpired(row, now) {
  const endsAt = row?.ends_at || row?.endsAt;
  if (!endsAt) return false;
  const end = new Date(endsAt).getTime();
  if (!Number.isFinite(end)) return false;
  const at = now ? new Date(now).getTime() : Date.now();
  return end < at;
}

/** `can(entitlement, "reporting")`. Unknown capability names are denied. */
export function can(entitlement, capability) {
  if (!CAPABILITIES.includes(capability)) return false;
  return entitlement?.capabilities?.[capability] === true;
}

/**
 * May this session write anything at all — localStorage, IndexedDB, a database
 * row, a log line? The storage and network boundaries both ask this, so that
 * "stores nothing" is a property of the system rather than a promise each
 * feature has to keep.
 */
export function mayPersist(entitlement) {
  return can(entitlement, "persistProgress");
}

/** How many learners this account may create. `null` means no limit. */
export function learnerSlotsFor(entitlement) {
  return entitlement?.learnerSlots ?? null;
}

export function hasFullContent(entitlement) {
  return entitlement?.contentScope === CONTENT_SCOPES.FULL;
}

/** The entitlement for the anonymous try-mode. Never comes from a database row. */
export function demoEntitlement() {
  return resolveEntitlement({ plan_id: PLAN_IDS.DEMO_TRY, source: "anonymous" });
}
