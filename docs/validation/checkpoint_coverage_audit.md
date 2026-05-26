# Checkpoint Coverage Audit

Generated: 2026-05-26T01:39:52.235Z

Checkpoint pass decisions now require both:

- accuracy pass
- complete required target coverage for the current skill/level

## Required Targets

- Final Sounds Level 1: b, d, g, l, m, n, p, t
- Final Sounds Level 2: sh, th, ll, ng, nd, nk, st, sk, ft, lt
- CVC Short Vowels: short_a, short_e, short_i, short_o, short_u
- Rhyming Words: at, an, ap, am, ag, ad, ed, en, et, eg, ig, in, ip, it, og, op, ot, ug, un, up, ut

## Simulated Decisions

| Case | Accuracy Passed | Coverage Complete | Missing Targets | Expected Pass | Actual Pass |
| --- | --- | --- | --- | --- | --- |
| Final Sounds Level 1 7/8 with 100% accuracy | yes | no | l | no | no |
| Final Sounds Level 1 8/8 with 100% accuracy | yes | yes | none | yes | yes |
| Final Sounds Level 2 partial with 100% accuracy | yes | no | lt | no | no |
| CVC Short Vowels partial with 100% accuracy | yes | no | short_u | no | no |
| Rhyming partial rime coverage with 100% accuracy | yes | no | ut | no | no |

## Failures

- none
