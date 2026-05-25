# Pilot Public-Domain Guided Reading Ingestion Report

Generated: 2026-05-25T23:41:08.081Z

## Pilot Books Chosen

These five were chosen first because they are high-value K-2 candidates from stable public-domain sources and have relatively clean Project Gutenberg text routes where available.

| Book | Why chosen | Download result | Target local path |
| --- | --- | --- | --- |
| McGuffey's Eclectic Primer | Controlled primer text; best fit for earliest guided reading. | failed (fetch failed) | /Users/benjaminbowler/Desktop/LiteracyPath/raw/public-domain/mcguffeys-eclectic-primer/source.txt |
| A Apple Pie | Alphabet/pre-reader structure and strong picture-book potential. | failed (fetch failed) | /Users/benjaminbowler/Desktop/LiteracyPath/raw/public-domain/a-apple-pie/source.txt |
| The Tale of Peter Rabbit | Classic animal story with strong sequencing and illustration support. | failed (fetch failed) | /Users/benjaminbowler/Desktop/LiteracyPath/raw/public-domain/tale-of-peter-rabbit/source.txt |
| The Tale of Benjamin Bunny | Classic animal story with familiar character continuity. | failed (fetch failed) | /Users/benjaminbowler/Desktop/LiteracyPath/raw/public-domain/tale-of-benjamin-bunny/source.txt |
| The Tale of Squirrel Nutkin | Classic animal story useful for comprehension and sequencing. | failed (fetch failed) | /Users/benjaminbowler/Desktop/LiteracyPath/raw/public-domain/tale-of-squirrel-nutkin/source.txt |

## Ingestion Result

- Books successfully downloaded: 0
- Books successfully processed into page images/manifests: 0
- Active public-domain books added to app: 0
- Validation status: safe empty registry; no fake assets generated.

## Blocker

The local command environment could not resolve/download external Project Gutenberg URLs (`fetch failed`). The downloader created metadata folders and exact target paths, but source files were not available locally, so the ingestion pipeline correctly refused to generate manifests or active books.

## Next Command Once Network Works

```bash
npm run download:curated-public-domain-pilot
npm run ingest:public-domain-book -- --book mcguffeys-eclectic-primer
npm run validate:public-domain-books
npm run build
```

## Manual Fallback

Download each `downloadUrl` from `docs/guided-reading/curated_download_report.json` in a browser and save it to the listed `target` path, then rerun the ingest commands.
