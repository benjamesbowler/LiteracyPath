# Privacy-preserving error monitoring

## Purpose

LiteracyPath sends a minimal diagnostic event when an application error reaches
an error boundary or a sampled global browser handler. The monitor exists to
identify broken releases and repeated fleet failures. It is not product
analytics and must not be used to inspect a child, their answers, or their
activity.

The on-device 20-event ring buffer remains active when remote delivery is
unavailable. It stores the same redacted fields as the remote monitor.

## Collected fields

- deployment release ID;
- random client event ID for delivery de-duplication;
- stable error fingerprint;
- `warning`, `error`, or `fatal` severity;
- coarse surface (`app`, `app-root`, or `assessment`);
- JavaScript error type;
- fixed source (`boundary`, `window-error`, `unhandled-rejection`,
  `vite-preload-error`, or a release-gate probe);
- up to 12 normalized `assets/…:line:column` or
  `src/…:line:column` positions;
- configured sample rate, event time, alert flag, and expiry time.

The reporting RPC has no parameter for error messages, URLs, arbitrary context,
user IDs, teacher IDs, school IDs, class IDs, learner IDs, names, class codes,
passwords, answers, tokens, or response content. The server rejects malformed
frames and common secret/PII patterns before insertion.

## Sampling

- React error-boundary events: 100%.
- Global browser errors and unhandled promise rejections: 25%.
- Fatal events: always delivered, regardless of the configured sample rate.

Sampling is recorded on each retained event. The local fallback records every
event that reaches the client hook.

## Retention and region

Remote events expire 30 days after collection. The administrator-only cleanup
function deletes expired rows, and the retention job must invoke it at least
daily. Local events are capped at 20 and are removed by the administrator’s
“Clear log” action or browser-storage clearing.

Remote diagnostics are stored in the same configured Supabase project and
region as the application database. No separate error-monitoring vendor is
introduced. A deployment owner must confirm the Supabase project region and
subprocessor disclosure before production use.

## Release attribution and alerts

Builds take their release ID, in priority order, from:

1. `VITE_APP_RELEASE_ID`;
2. `VERCEL_GIT_COMMIT_SHA`;
3. `GITHUB_SHA`;
4. `SOURCE_VERSION`;
5. `local-unversioned` for local builds only.

An event requires review when it is fatal or when the same fingerprint reaches
five occurrences inside one minute. The administrator Fleet error monitor
shows alert counts, release totals, affected fingerprints, latest event time,
and recent redacted events.

When an alert appears:

1. identify the release and fingerprint;
2. reproduce against the named surface using non-production data;
3. stop or roll back a release if a core student, assessment, saving, or teacher
   workflow is unavailable;
4. record the incident and remediation;
5. verify the fixed release in the monitor;
6. never request child names, answers, raw screenshots, or account identifiers
   to enrich the diagnostic record.

## Verification

`npm run check:error-monitoring` proves the collection contract, client
redaction, release tag, sampling, retention, alert policy, local fallback, and
an authenticated deliberate-error journey into the administrator monitor.
