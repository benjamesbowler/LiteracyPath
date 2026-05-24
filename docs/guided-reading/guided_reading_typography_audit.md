# Guided Reading Typography Audit

Date: 2026-05-25

## Chosen Font System

Guided Reading now uses a reading-first font stack:

- Primary reading font: Lexend
- Accessibility fallback: Atkinson Hyperlegible
- Additional friendly fallback: Nunito
- System fallbacks for resilience

CSS tokens:

- `--lp-font-ui`
- `--lp-font-reading`
- `--lp-font-readable`

## Rationale

Lexend was chosen for Guided Reading text because it is rounded, spacious, and designed for reading comfort. It has strong lowercase distinction, generous letterforms, and a calmer feel than harsh system UI fonts.

Atkinson Hyperlegible is included as an accessibility fallback because it prioritizes character distinction and visual clarity.

The main app UI can continue using Inter, but Guided Reading text, book titles, reader headings, generated covers, and library controls use the reading-friendly stack where appropriate.

## Mobile Readability

Reader text uses:

- large responsive sizing
- generous line height
- slight word spacing
- no negative letter spacing
- normal sentence text instead of word-chip styling
- rounded but not decorative letterforms

The reading area should remain comfortable on iPhone Safari and tablet screens without feeling like a dense dashboard.

## Dyslexia and Accessibility Considerations

The font stack avoids:

- narrow condensed fonts
- decorative classroom fonts
- cramped line spacing
- all-caps reading text
- negative letter spacing

The selected stack supports:

- clear lowercase forms
- good spacing between words
- readable punctuation
- strong contrast on warm white surfaces

## Font Sizing Rules By Level

Level A:
- largest text
- short lines
- high line height
- strong image support

Level B:
- large text
- simple sentence spacing
- high line height

Level C:
- large paragraph text
- comfortable line height
- paragraph spacing where needed

Level D:
- paragraph text remains large enough for shared reading
- avoid compact novel-style pages

Level E:
- may use slightly denser paragraphs, but must remain teacher-led and tablet-readable

Current implementation uses one responsive reader size as the default foundation. Level-specific typography can be added later when the reader supports level-aware styling.
