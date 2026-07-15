# Practice-sheet generator

Turns a child's weakest sounds (the teacher dashboard's weakest-five, from
Sound Seekers mastery evidence) into a printable home-practice pack: a teacher
page (5-minute routine + "Got it / Almost there / Needs re-teaching" sort) and
a student page (large-type decodable word grids). Words come from
`wordsForTarget()`, so decodability at the child's curriculum position holds
by construction (rubric P-E5, see tools/rubrics/).

    npm run export:practice-sheet -- --name "Sam" --targets sh,ch,e,ll,st --stop 13

Output: docs/previews/practice-sheets/<name>-<date>/ — practice.json plus
rendered .html previews and editable .docx per page.

`render/` is vendored from anthropics/k12-teacher-skills (Apache-2.0,
Anthropic PBC + Learning Commons — NOTICE and LICENSE inside). Requires
python3 + python-docx for the .docx output; the JSON and HTML render without it.

Follow-up (not built yet): a button on the teacher dashboard that calls this
with the live weakest-five for the selected child.
