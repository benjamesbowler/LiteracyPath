# Release traceability register

This register separates completed implementation from work that requires independent people or live operational evidence. `EXTERNAL-READY` means the materials are prepared; it does not mean the human work has happened or that the outcome is approved.

| Item | Area | Priority | Status | Evidence boundary |
| --- | ---: | --- | --- | --- |
| A1.10 | 1 | P1 EXTERNAL | EXTERNAL-READY | The research pack is complete. Expert review, child pilot sessions, teacher workflow observation, analysis and sign-off have not started. |
| A4.10 | 4 | P1 EXTERNAL | EXTERNAL-READY | The calibration protocol and synthetic preview are ready. Independent administration, specialist adjudication and signed calibration remain outstanding. |
| Beta media publication | 1, 3, 4 | RELEASE POLICY | BETA-TEST-VISIBLE | All current pending pairings are available for full beta testing. Pending remains distinct from human approved; quarantine remains immediately enforceable. |
| Hosted database v4 boundary | 5, 6, 7, 8 | RELEASE | APPLIED | Linked migrations through `20260814172000` were applied on 2026-08-15; PostgREST exposed all 101 app-called RPCs and linked database lint returned zero errors. |

Machine-readable pack status is held in `docs/research/PACK_MANIFEST.json` and `docs/research/CALIBRATION_PACK_MANIFEST.json`.
