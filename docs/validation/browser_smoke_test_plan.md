# Browser Smoke Test Plan

Date: 2026-06-03

## Current Automation

The first browser smoke test lives at `tests/smoke/app-load.spec.js` and runs with Playwright against the built app served by Vite preview.

Before running the smoke suite in a fresh environment, install the Playwright browser binary once:

```bash
npx playwright install chromium
```

It currently checks:

- The app starts at `/` without a blank root.
- The page title is `Literacy Guide`.
- The unauthenticated Teacher Login screen renders.
- The main `Literacy Guide` logo image is visible.
- Login and signup buttons are visible.
- Fatal console errors are not emitted during startup.
- Uncaught page errors are not emitted during startup.
- The same smoke path runs at desktop and mobile viewport sizes.

## Still Manual Or Auth-Gated

Authenticated teacher, student, report, and admin flows remain manual for now. This pass does not add test-only auth bypasses, production auth changes, fixture users, Supabase schema changes, or seeded credentials.

## Future Target Flows

- Login
- Student selection
- Skills page
- Initial Sounds round
- HFW round
- Story Quest library
- Story Quest player
- Guided Reading shelf
- Guided Reading reader
- Teacher Dashboard
- Admin Dashboard

## Notes

The smoke test is intentionally shallow. It is meant to catch deployment-blocking failures such as white screens, fatal import errors, missing startup UI, and uncaught browser errors before deeper authenticated test coverage exists.
