# Arcade leaderboard privacy

## Product rule

The arcade leaderboard is a child-facing motivational feature, not a public
ranking service.

- A live, unexpired student session token is required for every read.
- The server derives the learner, class, school, and permitted scope. Browser
  storage and caller-supplied school or class identifiers are not authority.
- The default scope is the signed-in learner's class.
- A teacher may explicitly opt one class into a school-wide board. The control
  states that the board remains nickname-only and asks for confirmation before
  widening the scope.
- The database returns deterministic `Reader XXXXXX` pseudonyms. It never
  returns student names, school names, class names, student IDs, or class IDs.
- Archived learners and learners without game progress are excluded.
- Invalid, expired, revoked, or missing student tokens fail closed.

## Verification

`npm run check:db-policies` runs against the deterministic audit school and
proves:

1. an anonymous caller with no valid student token is rejected;
2. an anonymous caller cannot change scope;
3. a valid learner token sees only the 12 active scored learners in its class;
4. every returned identity matches the pseudonym contract and no fixture name
   is returned;
5. an authenticated teacher can explicitly widen their own class to the
   25-learner school board; and
6. the test restores class-only scope before it exits.

## Human review boundary

Automated checks do not replace an independent privacy/security review of the
deployed RPC, product copy, school governance, telemetry, and operational
configuration. The prepared implementation is tracked as A8.2 in
`docs/release/EXTERNAL.md`; it must not be marked externally closed without
reviewer evidence.
