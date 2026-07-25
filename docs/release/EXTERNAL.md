# External dependencies

Codex may prepare these items but must never simulate or self-certify the required human work.

| Item | Human dependency | Status | Owner | Prepared evidence | Human closure evidence |
|---|---|---|---|---|---|
| A1.10 | Expert curriculum review and pre/post pilot | EXTERNAL-READY | Ben | `docs/research/`: versioned pack manifest, measurement plan, independent 30-skill review rubric, child/teacher pilot protocol, consent/assent/withdrawal templates, de-identified data dictionary, evidence-to-revision workflow, validated CSV/JSON exporter, descriptive summary script and permanent readiness gate. Human execution not started; no human results or certification claimed. | — |
| A2 pilot | Child usability observation, delivered through the A1.10 pack | EXTERNAL-READY | Ben | `docs/research/PILOT_PROTOCOL.md` includes first-use/familiar-use child tasks, observable outcomes, assent, stop rules, adult-prompt logging, accessibility barriers and recovery checks. Human execution not started. | — |
| A4.10 | Literacy-specialist threshold and difficulty calibration | TODO | Ben | — | — |
| A8.2 review | Privacy/security review of the live leaderboard RPC | READY | Ben | Token-derived class/school scope, pseudonym-only response, teacher opt-in, fail-closed live DB gate, and `docs/legal/LEADERBOARD_PRIVACY.md` | — |
| A8.10 | Qualified legal review of the compliance pack | EXTERNAL-READY | Ben | `docs/legal/` contains the versioned 12-document pack and public-policy sync: draft ToS and DPA, provider/subprocessor and region/transfer register, security and accessibility summaries, incident process, school/parent/learner notices and consent/assent materials, COPPA/FERPA/PPRA/UK/EU decision matrix, candid unresolved deployment facts, and an unchecked counsel review record. Implementation commit `6d77c791`; `docs/release/artifacts/2026-07-25T03-21-54-118Z/manifest.partial.json` passes lint, 1,228 tests, build, and the fail-closed legal-pack gate. No legal approval, executed contract, lawful-basis decision, provider-region confirmation, transfer approval, or compliance certification is claimed. | — |
| A10.8 manual | Manual assistive-technology audits | TODO | Ben | — | — |
| A10.10 | Recurring teacher and child observation programme | TODO | Ben | — | — |
