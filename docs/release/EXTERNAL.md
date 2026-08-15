# External validation register

External work is never inferred from an automated check. A row can move to `EXTERNAL-CLOSED` only when its named human evidence and sign-off are present in the repository or linked evidence store.

These programmes do not block deployment to the current beta. Pending media is
test-visible, human review status remains explicit, and any observed bad pairing
can be quarantined immediately.

| Item | Required external work | Status | Current truth |
| --- | --- | --- | --- |
| A1.10 | Independent literacy review, consented child pilot, teacher workflow observation, outcome analysis and signed closure package | EXTERNAL-READY | Human execution not started. No participant results or certification are included. |
| A4.10 | Independent calibration administration, item and subgroup review, reteach adjudication, differential-item review and signed threshold decision | EXTERNAL-READY | Human execution not started. The dashboard fixture is synthetic demonstration data, not child evidence. |
| Accessibility manual audit | Keyboard, screen-reader, zoom, contrast, motion and representative-route review by qualified human auditors | EXTERNAL-READY | Human execution not started. Automated accessibility checks are supporting evidence only. |

See `docs/research/README.md`, `docs/research/CALIBRATION_PROTOCOL.md`, and `docs/accessibility/MANUAL_AUDIT_PROGRAM.md` for execution protocols.
