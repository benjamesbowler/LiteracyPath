# Public site delivery

`src/policy/pageMetadata.js` owns public route metadata, the public sitemap
allowlist and fixed application titles. Never put learner names, class names,
report contents, invitation tokens or URL fragments in document metadata.
The family route is excluded from discovery and marked `noindex`; access
continues to depend on authentication and the existing school invitation rules.

`tools/vitePageMetadataPlugin.mjs` writes the root, family and Sound Keys HTML
heads during builds, so crawlers receive metadata before JavaScript runs. It
also adds sharing metadata to the existing legal HTML, generates robots/sitemap
files, and preserves the source legal titles and descriptions. Vercel serves
`public/404.html` as the branded missing-page response with HTTP 404.

Run `node tools/buildUiImageVariants.mjs` to regenerate the navigation and
brand delivery renditions. The original navigation WebP and brand PNG files
are active authoring inputs and must be retained. Runtime UI imports use the
smaller renditions; full-page book artwork is outside this optimisation.
