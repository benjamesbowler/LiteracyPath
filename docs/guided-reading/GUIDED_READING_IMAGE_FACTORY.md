# Guided Reading Image Factory

This is the production system for completing the guided-reading visual replacement ledger. It replaces one-page-at-a-time prompting with resumable batches that retain series style, cast references, attempts, QA and review decisions.

## Non-negotiable art rule

- Fiction is always an illustration matching its established series cartoon language.
- Recurring people and animals retain the same design, clothing, markings, proportions, palette and personality traits.
- Nonfiction uses factual naturalistic or photographic rendering.
- Low-cost draft generation must never overwrite a live reader image. Only a reviewed, approved candidate may be installed.

## Default production settings

- Model: `gpt-image-2`
- Batch ceiling: 50 pages
- Quality: `low`
- Maximum output edge: 1536 pixels, with the source page aspect ratio preserved
- Reference fidelity: `low`
- Concurrent requests: 3
- Request starts: at most one every 15 seconds
- Retry policy: three attempts for temporary API and rate-limit failures

These settings make a complete review batch inexpensive. Individual failed pages can be retried at `medium`; `high` is not part of the normal guided-reading workflow.

## One-command batch

```bash
npm run gr:images:batch
```

This synchronises the current audit into the local database, chooses up to 50 pending pages without splitting books where possible, generates resumable candidates, runs technical QA and builds a contact sheet.

## Review

```bash
npm run gr:images:review
```

The local review board compares every candidate with the current page and exposes the page text, continuity lock, issue list and technical checks. Approve, retry or reject each candidate. The install command writes only approved candidates and rebuilds the audit once after the complete group.

```bash
npm run gr:images -- install
```

## Useful commands

```bash
npm run gr:images -- status
npm run gr:images -- queue --limit 50 --quality low
npm run gr:images -- generate
npm run gr:images -- generate --max-jobs 1
npm run gr:images -- sheet
npm run gr:images -- retry --jobs 12,15,18
npm run gr:images -- generate --quality medium
```

The local SQLite ledger and candidates live under `.artifacts/guided-reading-image-factory/` and are intentionally ignored by Git. The tracked audit, source stories, series profiles and installed-page registry remain the durable project record.
