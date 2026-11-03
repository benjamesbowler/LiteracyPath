# Shared public media: free static hosting

The user requires **zero spend**, not a billable service with a free allowance.
Do not activate R2, upgrade a plan, add paid bindings or accept usage-based billing.
The earlier R2 implementation is superseded and remains recoverable in Git.

Status: free-only implementation in preparation on `infra/shared-media-storage`.
`config/shared-media-release.json` stays disabled until publication and hosted
verification. Production delivery is unchanged while disabled.

## Hosting and limits

[Cloudflare static assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
have no storage charge and free unlimited static requests. This deployment has
**no Worker script**, R2, KV, D1 or other metered binding. Keep Workers Free;
limits must fail without an upgrade or charge.

The publisher uses four collections: isolated words, assessment/instruction
speech, story recordings and other public media. Each stays below 19,000 files,
leaving headroom under the [20,000-file Free limit](https://developers.cloudflare.com/workers/platform/limits/).
Files above 25 MiB remain on Vercel, including the recent Hop and Stop MP4.
The current build externalizes about 3.76 GB; canonical source assets are retained.

## Publication and ongoing builds

Existing browser URLs stay on literacy.guide. `vercel.mjs` keeps canonical base
headers and routes from `config/vercel-base.json`, checks the local filesystem
first, then forwards public media to immutable Cloudflare version origins.
Cookies, authorization and client-address headers are cleared for forwarding.
Browser CSP, media controls and offline-cache URLs stay unchanged.

Each collection includes a source hash/size catalog. Publication stages clones
of final build media, deploys assets-only Workers, pins their exact public version
URLs, then downloads and SHA-256 verifies **every** served file. No source or
deployment copy is removed during publication. It produces an ignored candidate;
it does not automatically activate routing or modify Production.

To publish or refresh media, with authorized local Wrangler access:

```sh
SHARED_MEDIA_PREPARE=1 npm run build
npm run shared-media:plan
CLOUDFLARE_ACCOUNT_ID=<account-id> npm run shared-media:publish
```

Review `.artifacts/shared-media-free/verified-candidate.json`, place the verified
receipt in `config/shared-media-release.json`, then build and test a READY Vercel
preview. Check served hashes, actual pictures/audio, video playback and seeking,
reader/page audio, game rounds, offline loading, security/cache headers and
actual removal of private request headers. Verify live only after preview proof
and normal protected-branch checks. Retain the preceding working deployment.

Regular builds require **no Cloudflare credential in Vercel**. Postbuild fetches
all four pinned catalogs and verifies their checked-in digests before pruning.
Only identical published files are removed from generated `dist`. New, changed
or oversized files remain local and work through filesystem precedence. Refresh
shared media when new local copies become material; never strip unverified files.
A failed catalog/hash check stops the build before removal.

## Rollback and cleanup

Old deployments keep their own pinned immutable media versions. Never delete a
retained version or disable its Version URL while a retained deployment uses it.
To disable shared hosting for a new release, disable the receipt and rebuild;
do not change routing on already stripped prebuilt output.

Run `node --test tests/unit/sharedMediaStorage.test.js` for free-only receipt,
routing precedence, source/staging boundaries, exact-byte verification and
failure-safety checks. Remove task-created staging clones and full builds after
compact proof is retained. Keep native song/animation work and protected shelves
untouched. Vercel's historical storage metric will not clear immediately.
