You are working in LiteracyPath.

Goal:
$ARGUMENTS

Rules:
- Inspect before editing.
- Find the root cause before changing code.
- Make the smallest safe fix.
- Do not touch unrelated files.
- Do not invent architecture.
- Preserve existing working behavior.
- Do not claim success without running validation.

Loop (repeat until clean or a genuine blocker):
1. Inspect relevant files and data.
2. Explain the likely root cause briefly.
3. Make the fix.
4. Run:
   - npm run build
   - git diff --check
   - git status --short
   - any existing npm run check:* / validate:* / audit:* script directly relevant to the changed area (see package.json scripts)
5. If any check fails, read the failure, fix, and re-run.
6. Repeat until all checks pass.

Do not ask Benjamin to test manually unless there is no automated path.
Do not stop after the first implementation.

Final answer:
1. Root cause
2. Files changed
3. Checks run
4. Pass/fail status
5. Remaining risks
6. Copy-paste git push command
