# Improvement workflow

The current app is the baseline. Make the smallest coherent change, prove that its
reachable behavior still works, and keep only the source and documentation required
to maintain that behavior.

## Workflow

1. Trace the live import, route, registry, or database boundary before changing it.
2. Treat unreferenced dated data, duplicate banks, generated review inventories,
   handoff prompts, screenshots, and historical audit output as deletion candidates.
3. Update the single current standard when a rule changes. Do not add a new dated
   document that competes with it.
4. Add or update a focused automated test for behavior that could regress.
5. Run the focused test, the complete unit suite, and the production build.
6. Keep human review as product feedback where it is genuinely needed, never as a
   hidden runtime flag or a person-specific publication requirement.

## Authority

- Runtime imports and registries define what the app uses.
- Automated tests and build checks define reproducible acceptance.
- Current standards explain intent; they do not override contradictory live code.
- Historical records have no authority and do not belong in the active repository.
- No rule may depend on a named person's approval.
- No arbitrary percentage is binding unless it exists in the current runtime policy
  and is protected by a current test.

## Definition of done

A change is done when the reachable behavior is correct, focused checks pass, the
complete unit suite and production build pass, and no duplicate or superseded source
was left behind.
