# Public-Domain Guided Reading Ingestion Pipeline

This pipeline converts public-domain beginner books into the app's Guided Reading runtime format without touching auth, Supabase, teacher dashboard, class logic, or assessment skills.

## Folder Layout

Raw source files go here:

```text
raw/public-domain/{bookId}/
  metadata.json
  source.pdf
  source.txt
  page-001.png
```

Processed runtime files are generated here:

```text
public/guided-reading/
  covers/{bookId}-cover.webp
  pages/{bookId}/page-001.webp
  audio/
  manifests/{bookId}.json
```

The generated registry is:

```text
src/data/generated/publicDomainGuidedReadingBooks.generated.js
```

It is imported by `src/data/guidedReadingBooks.js`, so valid processed books can be registered without manually editing the main guided-reading data file.

## Raw Metadata

Each raw book folder should include `metadata.json`:

```json
{
  "id": "little-red-hen",
  "title": "The Little Red Hen",
  "author": "",
  "source": "https://example.org/source-page",
  "publicDomain": true,
  "readingLevel": "early",
  "guidedReadingLevel": "A",
  "type": "fiction",
  "tags": ["animals", "folk tale", "sequencing"],
  "active": false,
  "qaStatus": "needs_review"
}
```

Books remain inactive unless metadata explicitly sets `"active": true` and validation passes.

## Commands

Ingest one book from a local source file:

```bash
npm run ingest:public-domain-book -- --book little-red-hen --source raw/public-domain/little-red-hen/source.pdf
```

Extract page images only:

```bash
npm run extract:public-domain-pages -- --book little-red-hen
```

Extract text only:

```bash
npm run extract:public-domain-text -- --book little-red-hen --pages 24
```

Build manifest from already processed pages/text:

```bash
npm run build:public-domain-manifest -- --book little-red-hen
```

Validate every processed book and regenerate the registry:

```bash
npm run validate:public-domain-books
```

## PDF Processing Tools

PDF page rendering uses Poppler and ImageMagick when PDFs are present.

Recommended macOS install:

```bash
brew install poppler imagemagick
```

If these tools are missing, the scripts stop with the exact install guidance instead of generating fake assets.

## Validation Rules

`tools/public-domain/validateBook.js` checks:

- required manifest fields exist
- `publicDomain` is true
- cover image exists
- every page has an image
- every page has text
- page numbers are sequential
- page image paths resolve

Only valid manifests are written into the generated app registry.

## Future Fields

The manifest structure leaves room for:

- human narration
- word-level audio
- click-to-read
- comprehension questions
- vocabulary extraction
- richer QA status

