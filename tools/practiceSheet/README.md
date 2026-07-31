# Practice-sheet generator

Turns a child's weakest sounds (the teacher dashboard's weakest-five, from
Sound Seekers mastery evidence) into a printable home-practice pack: a teacher
page (5-minute routine + "Got it / Almost there / Needs re-teaching" sort) and
a student page (large-type decodable word grids). Words come from
`wordsForTarget()`, so decodability at the child's curriculum position holds
by construction (rubric P-E5, see tools/rubrics/).

    npm run export:practice-sheet -- --name "Sam" --targets sh,ch,e,ll,st --stop 13

Output: .artifacts/practice-sheets/<name>-<date>/ — practice.json plus
rendered .html previews and editable .docx per page.

`render/` is vendored from anthropics/k12-teacher-skills (Apache-2.0,
Anthropic PBC + Learning Commons — NOTICE and LICENSE inside). Requires
python3 + python-docx for the .docx output; the JSON and HTML render without it.

This pack also lives IN the app now (`src/utils/worksheets/practicePack.js`):
each child's Sound map on the teacher dashboard has a "Print practice pack"
button (tapped sounds, or the live weakest-five, at the child's furthest
stop), and the Worksheet generator page has a manual per-child builder. The
in-app version prints via the browser; keep this CLI for editable .docx.
