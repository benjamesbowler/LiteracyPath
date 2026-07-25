# Fleet error budget

## Decision

LiteracyPath uses a strict operational diagnostic budget for each deployment
release:

- rolling window: 24 hours;
- fatal retained events allowed: 0;
- repeat-fingerprint alerts allowed: 0;
- a fingerprint becomes an alert on its fifth retained occurrence inside one
  minute.

One fatal event or one repeat-fingerprint alert breaches the release budget.
Ordinary sampled errors remain visible for diagnosis but do not consume the
budget until the fatal or repeat-alert threshold is met.

This is deliberately not described as an availability percentage. The monitor
does not collect a child/session denominator, and global browser events are
sampled. Claiming “99.9% uptime” from these data would be false. A release with
no retained event is shown as **No data**, not healthy, until the seeded release
journey proves the end-to-end monitor path.

## Dashboard and response

The administrator Fleet error monitor evaluates the policy per release and
shows event, fingerprint, fatal, alert, budget, and latest-event values for the
same rolling window.

When a release is breached:

1. identify its release ID, fingerprint, first retained generated frame, and
   affected surface;
2. obtain the private source-map artifact for that exact release from the
   restricted CI artifact store;
3. symbolicate the frame locally:

   `node tools/symbolicateFrame.mjs --maps <private-map-directory> --frame <assets/file.js:line:column>`

4. reproduce using non-production data;
5. stop or roll back when a core student, assessment, evidence-saving, or
   teacher workflow is unavailable;
6. record the incident, owner, remediation, and fixed release;
7. run the seeded monitor journey and confirm the replacement release is within
   budget.

Never copy source maps into the public deployment, a support ticket, or a
general release-evidence artifact. Never add child identity, answers, account
IDs, URLs, or raw messages to the event.

## Private source-map control

Normal `npm run build` output contains no source maps. The
`check:private-source-maps` gate makes a separate production build with hidden
maps, verifies that every source-bearing page asset has a map, proves a
generated monitoring frame resolves to `src/utils/errorLog.js`, and confirms
deployed assets contain no `sourceMappingURL`.

The coverage claim applies to every source-bearing page asset visible to the
browser error monitor. Rolldown may emit source-less runtime/facade chunks, and
the separately generated `sw.js` service worker is outside the page monitor;
the gate identifies these exceptions by construction and fails if any
source-bearing page chunk lacks a map.

CI copies only the maps and their non-sensitive verification manifest into a
separate private artifact named for the commit. The artifact is retained for 30
days, matching error-event retention, and is available only through repository
artifact permissions. General release evidence never contains the maps.
