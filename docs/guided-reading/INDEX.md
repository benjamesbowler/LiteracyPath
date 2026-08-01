# Guided Reading

The live book modules are the authority:

- `src/data/guidedReadingBooks.js`
- `src/data/guidedReadingRegenBooks.js`
- `src/data/guidedStoryBooks.js`
- `src/data/firstFactsActualLevelABooks.js`

Every readable word and page narration must resolve through the current production
audio paths. Continuous reading follows page order and page timing. Current automated
coverage tests enforce these contracts.

Import receipts, contact sheets, text-revision queues, audio inventories, replacement
manifests, and provider-specific handoff reports are retired. They must not be restored
or used to override the live book modules.
