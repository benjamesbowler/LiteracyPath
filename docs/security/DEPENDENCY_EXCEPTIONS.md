# Dependency vulnerability exceptions

The default is no exception. `npm audit --audit-level=high` is a required
release gate and high or critical findings block release.

An exception is available only when a patched dependency cannot be adopted
without a larger safety regression and the exposure is demonstrably outside
the product's reachable runtime. It is not a way to turn a red audit green.

## Required record

Every proposed exception must be recorded in the issue or pull request containing:

- package, installed version, advisory ID, severity, and complete dependency
  path;
- whether the package is present in production, development, or both;
- evidence showing whether the vulnerable function is reachable;
- the attempted upgrade or replacement and the failure it caused;
- compensating controls and a test that proves each control;
- one named security owner and one independent reviewer;
- an expiry date no more than 30 days after approval;
- the fixed version or replacement being tracked and the removal plan.

The author cannot be the independent reviewer. Missing fields, an expired
date, or a missing independent review make the exception invalid.

## Gate changes

The audit command is not allowlist-aware. A valid exception therefore remains
visibly red until a separate, reviewed gate change is committed. That commit
must include a `CHECK-CHANGE:` block explaining:

1. the exact advisory excluded;
2. why the release intent remains intact;
3. the narrower assertion replacing the audit result;
4. the automatic expiry behavior; and
5. the test that fails when the package, version, dependency path, reachability,
   or expiry changes.

Blanket package exclusions, severity downgrades, `--omit` changes, and
unbounded expiry dates are prohibited. There are currently no active
dependency exceptions.
