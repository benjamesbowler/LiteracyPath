# LiteracyPath Phonics Question Model Framework v1

## Purpose

This document defines the approved phonics question models used in LiteracyPath.

The framework exists to ensure:
- educational validity
- adaptive mastery integrity
- developmental appropriateness
- ESL accessibility
- consistent instructional quality

The system should assess:
real decoding ability,
not visual shortcut strategies.

This framework works together with:
- docs/PRODUCT_VISION.md
- docs/instructional_standards.md

---

# Core Principle

Different question formats measure different kinds of literacy evidence.

A child should not achieve mastery from:
- visual pattern spotting alone
- repeated exposure to one question type
- guessing
- recognizing letter chunks without decoding

Mastery requires varied evidence.

---

# Framework Goals

The framework should:
- classify question types
- define educational strength
- define mastery eligibility
- define appropriate usage stages
- improve audit quality
- support adaptive mastery logic

---

# Question Metadata Schema

Questions may include:

```js
{
  formatType: "APM",
  masteryStage: "practice",
  targetPattern: "short_a",
  anchorWord: "cat",
  hadPTD: true,
  phonicsPosition: "initial",
  crossPatternGroup: "long_a"
}