# Security release gates

`npm run check:security-remediation` runs the dependency audit, CSV and private
source-map regressions, database boundary contracts, and the isolated PostgreSQL
progress/login/retired-leaderboard behavior check. The audit retains the existing
high/critical blocking policy; no advisory exceptions are introduced.

The Security GitHub workflow runs on main pushes, pull requests and manual
dispatches with read-only repository permission. Vercel runs the same security
command before building and checks the emitted public tree for source maps.
Vercel installs the committed lockfile with `npm ci`. A failure blocks that
deployment even when a GitHub workflow is unavailable. These scoped protections
do not replace the whole-product release manifest or its other applicable gates.

Private source-map builds must specify an absolute output directory outside the
repository and its ancestors. Symlinks and CLI output overrides are checked.
The private-map verification command uses an isolated temporary directory;
any retained map vault must satisfy the same path boundary. Public builds reject
source-map overrides, and the public-artifact check rejects maps and references.

Database changes remain immutable forward migrations. The security behavior
check replays all migrations using synthetic records in PGlite and exercises
existing malformed progress, learner RPCs, teacher RLS, checkpoints, login and
session failures. It never connects to or seeds the hosted project. Hosted
application and read-back evidence are separate from this local proof.
