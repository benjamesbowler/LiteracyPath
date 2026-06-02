# Kimi Question Audit Response

Date: 2026-06-02

## Summary

Kimi's question audit was useful for locating child-facing wording issues, but several severe coverage findings came from static inspection of files that do not represent the full runtime assessment pool. Runtime checks show the generated and template-expanded banks are present.

## Findings Checked

- HFW, vowel teams, r-controlled vowels, homophones, and other generated banks: treated as static-audit false positives because the app imports generated/runtime banks through `src/App.jsx` and `src/content/skillMedia/skillAssetRegistry.js`.
- Sentence comprehension questions without passages: not reproduced in the active runtime pool. Checked 253 sentence-comprehension items; 0 were missing passages.
- Inference prompts using adult-facing wording: reproduced in active data. Several live inference items used `infer` or `inference` in visible prompt text.
- Context-clue wording using `probably mean`: reproduced in active template data and legacy data.
- Legacy examples in `src/questions.js`: Kimi's examples are present there, but that legacy file is not imported by the current app startup or active assessment bank assembly. The two stale stems that matched Kimi's wording concern were cleaned anyway.

## Fix Applied

Updated active inference question stems to use child-facing clue language:

- `What can we infer...` -> `What do the clues show...`
- `What can you infer...` -> `What do the clues show...`
- `Which clue supports the inference?` -> `Which clue supports that idea?`

Updated context-clue stems:

- `What does trembling probably mean?` -> `What does trembling mean in this passage?`

Only prompt text changed. Answers, choices, skill IDs, item keys, mastery logic, routing, and media files were left unchanged.

## Runtime Recheck

Targeted runtime audit after the edit:

- Active inference prompts containing `infer` or `inference`: 0
- Active sentence-comprehension items checked: 253
- Active sentence-comprehension items missing passages: 0
- Remaining active exact Kimi wording match for `What does trembling probably mean?`: 0
