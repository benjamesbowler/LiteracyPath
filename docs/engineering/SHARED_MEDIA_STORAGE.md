# Shared public media storage

Status: implemented on `infra/shared-media-storage`; activation is blocked on
Cloudflare sign-in and R2 activation. No cloud resources or uploads have been
created. With `SHARED_MEDIA_ORIGIN` unset, builds retain original Vercel media.

## Delivery contract

Images, audio and video retain existing same-origin URLs. `vercel.mjs` loads
canonical security/routing rules from `config/vercel-base.json` and adds external
rewrites only when activated. Rewrites clear cookies, authorization and client
address headers before forwarding public media. Browser CSP and offline paths
stay intact. Covered roots are defined once in `infra/shared-media/protocol.mjs`.

The private R2 Standard bucket stores content once by SHA-256. Immutable manifest
shards map each exact Git commit's paths to content. Every deployment pins its
own snapshot, preserving rollback media. The Worker exposes GET/HEAD only,
supports native byte ranges and validators, and has no administration endpoint.
Public `r2.dev` access is unnecessary.

After Vite and offline-manifest generation, the postbuild publisher verifies
size/MD5, manifest readback and a fresh complete bucket listing before stripping
generated deployment copies. Missing secrets, upload failure, inconsistent bytes
or a conflicting immutable snapshot fail the build. `public/` and native
song/animation sources are untouched.

## Free allowance

[R2 Standard pricing](https://developers.cloudflare.com/r2/pricing/) includes
10 GB-month storage, 1 million Class A and 10 million Class B operations monthly,
with free internet egress. The November 3 build has about 3.77 GB of unique media;
unchanged content is reused across releases. Keep the Worker on its
[Free plan](https://developers.cloudflare.com/workers/platform/pricing/)
(100,000 requests/day), without automatic upgrades.

The publisher refuses a dedicated bucket projected above 8,000,000,000 bytes,
including retained snapshots. This is headroom, **not an account-wide billing
cap**. Other buckets, operations and external writes also count. Check actual
account-wide usage before activation. R2 activation can require checkout/payment
details and can bill overages; the user must complete account/legal/billing steps.

## Activate

1. Obtain the user's signed-in Cloudflare account and activated R2 subscription.
   Check Standard storage and Workers Free; do not select paid add-ons.
2. Create dedicated bucket `literacy-guide-media`, bind it as `MEDIA` using
   `infra/shared-media/wrangler.jsonc`, then deploy the Worker with
   `npx wrangler deploy --config infra/shared-media/wrangler.jsonc`.
   Keep observability disabled. Record the real account ID and Worker origin.
3. Store bucket-scoped R2 Object Read/Write credentials in server-side Vercel
   environment variables: `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`,
   `R2_SECRET_ACCESS_KEY`, plus `SHARED_MEDIA_ORIGIN=https://<worker>.workers.dev`.
   Never use `VITE_` prefixes, commit keys or paste them into chats/reports.
4. Enable Preview first. Git builds use `VERCEL_GIT_COMMIT_SHA`; local/prebuilt
   builds must supply the exact source SHA as `SHARED_MEDIA_SNAPSHOT` to both
   config evaluation and build. Run the full build; do not deploy stripped output
   until the upload and verification have succeeded.
5. Exercise a READY hosted preview: source hashes, actual images/audio, the
   complete 27-file Hop and Stop pack, Cycle Shorts, HEAD/range/304, complete
   native video playback and seeking, reader page recordings, all reader pages
   and game rounds, offline loading, CSP and security/cache headers. Verify
   actual Vercel rewrites do not forward cookies or authorization. Local fixture
   success does not establish hosted proxy or R2 behavior.
6. After preview proof and normal protected-branch checks, set the same server
   variables in Production and release. Verify live media and storage resources;
   retain the preceding working deployment. Vercel's rolling storage metric will
   not reset immediately.

`shared-media-release.json` in the generated deployment describes its snapshot.
After a normal build, `SHARED_MEDIA_SNAPSHOT=<sha> npm run shared-media:plan`
produces the source inventory without cloud writes.

## Rollback and maintenance

Restore a verified preceding Vercel deployment. Its media snapshot remains
available; the pre-migration deployment still includes its original local media.
To disable storage for a new build, unset `SHARED_MEDIA_ORIGIN` and rebuild.
Never remove routing from already stripped prebuilt output.

Remote deletion is never automatic. Preserve every object referenced by retained
deployment snapshots. Reaching the safety budget requires maintenance, not an
automatic upgrade or deletion of rollback media.

`node --test tests/unit/sharedMediaStorage.test.js` covers transfer/checksum
failure, reuse, rollback snapshots and HTTP range semantics. The local fixture
tool `tools/serveSharedMediaPreview.mjs --prepare` creates disposable APFS clones
from `dist` with `SHARED_MEDIA_SNAPSHOT=<source-sha>`, verifies and strips output.
Running it without `--prepare` serves that fixture on loopback port 5187 through
the actual Worker. Build the existing song/child preview entries for browser
tests. This is a filesystem substitute, not cloud proof. Stop it before cleanup.
