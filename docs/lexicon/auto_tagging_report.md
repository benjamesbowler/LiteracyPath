# Auto Tagging Report

Generated: 2026-05-25T23:16:19.700Z

The master lexicon is built automatically from active literacy content and media-backed question banks. It deduplicates normalized words, then applies heuristic phonics tagging for initial sound, final sound, medial vowel, rime, syllable count, syllable type, and vowel pattern.

## Counts

- Total words scanned after dedupe: 713
- Missing core phonics tags: 0
- Words with no linked media reference: 20
- Words with unknown syllable type: 306

## Notes

- The lexicon is intentionally isolated from the app startup route to avoid loading generated content globally.
- Ambiguous cases remain available for manual QA rather than being guessed silently.
- This is now the shared foundation for future adaptive selectors, decodable readers, spelling, remediation, and tutoring tools.
