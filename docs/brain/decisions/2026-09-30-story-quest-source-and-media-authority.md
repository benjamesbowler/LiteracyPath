---
type: decision
status: active
date: 2026-09-30
authority: orientation-only
---

# Story Quest source and media authority

`src/data/storyQuests.js` is the only current manuscript and route catalogue:
fourteen books, 190 scenes and 52 finite routes. Its image inventory contains
190 scenes, fourteen covers and six active Sam/Pam picture-word cards. The
[production contract](../../content/STORY_QUEST_PRODUCTION.md) and two-part
[Story Bible](../../content/STORY_AND_STORY_QUEST_BIBLE.md) govern subsequent work.
Do not restore the retired page graph or use old Admin QA text as a manuscript.

The exact Leda narration manifest, dedicated covers, meaningful scene alt text
and current visual review hashes move with the authored runtime. Canon sheets
in `docs/content/references/story-quests/` remain active production inputs.
Historical exposure and completion are retained without treating them as mastery.

`tools/syncStoryQuestMediaQa.mjs` rebuilds the scoped Admin QA inventory and its
`--check` mode is part of the Story Quest release check. Saved decisions preserve
quarantine without replacing current content; review notes apply to the current
revision only when their media fingerprint matches.

The [cleanup record](../../CURRENT_SYSTEM_CLEANUP_2026-07-31.md) describes scoped
media retirement and recovery. Original audit findings, all page dispositions,
generation receipts and local verification remain in the ignored
`.artifacts/story-quests-remediation-2026-09-29/` evidence pack. Local generation,
hash checks and browser tests do not establish human listening, physical-device,
classroom or hosted-release evidence; consult the current task's release status.
