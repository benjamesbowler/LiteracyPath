# Release traceability register

This register separates completed implementation from ongoing human and live operational evidence. `ACTIVE` means the programme is running pass-by-exception; the repository does not fabricate participant results or certification.

| Item | Area | Priority | Status | Evidence boundary |
| --- | ---: | --- | --- | --- |
| A1.10 | 1 | P1 EXTERNAL | ACTIVE | Ongoing pass-by-exception; unreported behaviour is accepted and reported defects are quarantined. |
| A4.10 | 4 | P1 EXTERNAL | ACTIVE | Ongoing pass-by-exception; the synthetic preview remains demonstration data rather than child evidence. |
| Beta media publication | 1, 3, 4 | RELEASE POLICY | CONTINUOUS-REVIEW | Current pairings are accepted; quarantine remains immediately enforceable for reported defects. |
| Hosted database v4 boundary | 5, 6, 7, 8 | RELEASE | APPLIED | Linked migrations through `20260814172000` were applied on 2026-08-15; PostgREST exposed all 101 app-called RPCs and linked database lint returned zero errors. |

Machine-readable pack status is held in `docs/research/PACK_MANIFEST.json` and `docs/research/CALIBRATION_PACK_MANIFEST.json`.
