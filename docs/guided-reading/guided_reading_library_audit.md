# Guided Reading Library Audit

Generated: 2026-05-24

## Active Library Summary

- Active approved books: 46
- Active approved pages: 276
- Navigation model: category -> level -> books
- Available categories: Fiction, Non-Fiction
- Available levels: A, B, C, D, E
- Level F: no active approved books yet, so it is hidden until content exists

## Active Books By Type And Level

| Type | Level A | Level B | Level C | Level D | Level E | Level F | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| Fiction | 5 | 4 | 5 | 4 | 5 | 0 | 23 |
| Non-Fiction | 4 | 5 | 4 | 5 | 5 | 0 | 23 |
| Total | 9 | 9 | 9 | 9 | 10 | 0 | 46 |

## Excluded Books

The following regenerated books remain excluded from the student reader because they are missing all six page images:

| Book ID | Title | Type | Level | Reason |
|---|---|---|---|---|
| gr-a-30 | At the Park | nonfiction | A | Missing page images 1-6 |
| gr-b-10 | The Gift | fiction | B | Missing page images 1-6 |
| gr-c-40 | Weather | nonfiction | C | Missing page images 1-6 |
| gr-d-20 | The Magic Show | fiction | D | Missing page images 1-6 |

## Metadata Checks

- Books missing type: 0 active
- Books missing level: 0 active
- Books missing cover: 0 active
- Books missing pages: 0 active
- Books with non-approved QA status in runtime: 0 active

## Completion Tracking

Guided Reading now tracks local per-student reading progress in the existing localStorage pattern:

- studentId
- bookId
- title
- level
- type
- firstReadAt
- lastReadAt
- readCount
- completedPages
- totalPages
- completed

A book is marked complete when the teacher finishes the final page. Rereading is allowed and increments readCount while preserving the completion tick.

## Persistence Status

Persistence is localStorage-only for now to avoid Supabase schema risk.

Recommended future Supabase table:

```text
reading_records
  id
  student_id
  book_id
  title
  level
  type
  first_read_at
  last_read_at
  read_count
  completed_pages
  total_pages
  completed
```

## Reports And Export

The Reports page now includes a Reading Report panel with:

- total books read
- fiction/non-fiction totals
- in-progress book count
- reread count
- latest reading date
- completed book rows

The export button creates an Excel workbook named:

```text
StudentName - DD-MM-YYYY - Reading Report.xlsx
```

Workbook sheets:

- Summary
- Completed Books
- In Progress Books
