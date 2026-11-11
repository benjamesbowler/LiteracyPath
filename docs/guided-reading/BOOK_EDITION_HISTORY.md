# Book editions and saved reading

The five whole-topic World Discovery replacements dated 10 November 2026
keep their public book IDs, cohort membership and shelf order. The bounded
policy in `src/utils/guidedReading/editions.js` owns their retired titles and
edition marker. Retired page counts are pinned to the audited original
publication for records that omitted their count. Activation follows the actual
current manuscript title. Small
text corrections and all other books retain their existing progress identity.

A replacement uses an internal progress key consisting of its public ID, `::`
and the edition marker. Its previous record remains at the original key, with
its original dates, page position, marks, words and notes. No learner data is
rewritten at release. New-topic reading starts fresh; device/cloud hydration
and offline queue merging continue independently for the two keys. Lifetime
reading history and earned Hollow rewards include the earlier topic. Library
completion, continuation, suggestions and level milestones use the current
edition only.

Reports and Excel retain separate rows for the earlier and current texts.
Historical word marks use their stored words. The earlier text does not inherit
the replacement's current complexity review; its saved source level remains
available as historical evidence.

Shared reading uses the same internal edition key as `reading_sessions.book_id`
for these five topics, and scopes the existing v1 `content_version` with the
edition marker. The unchanged marks RPC therefore keeps its session ownership,
roster, page bounds, active-session and duplicate-event checks while saving to
the correct progress record. The browser maps that key back to the stable public
ID for routing and page lookup. Old-topic sessions cannot open the new topic or
apply their word indices to it. Ordinary books keep the existing v1 contract
across normal app deployments. Assigned-book focus sessions keep their public
ID and existing frozen title. An old or missing frozen title for these five
new topics follows the existing assigned-book-unavailable path, so a teacher
assignment cannot silently become a different topic. There is no database migration or global
session-version bump. Exact pending operations from an earlier topic may be
replayed through the same validated RPC against their original frozen session,
without opening the new manuscript. Only acknowledged queue entries are removed;
failed operations remain available for retry. The old session can then end before
a new group starts.

Verification lives in `tests/unit/guidedReadingEditions.test.js` and the existing
library, completion, reporting, progress and shared-reading suites. Isolated
synthetic database tests exercise the existing marks RPC; they do not claim a
hosted write or migration.
