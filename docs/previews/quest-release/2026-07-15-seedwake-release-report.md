# Sound Seekers Seedwake Release Report

**Date:** 15 July 2026  
**Build scope:** Seedwake Meadow, stops s1-s5  
**Decision:** Software release candidate for staging and stakeholder QA  
**Not claimed:** Public child-rollout sign-off or production completion of chapters 2-8

## Result

The opening chapter now completes continuously from Hollow Tree through Bramble Gate and the chapter reward. It does not reset to the letter screen, mount duplicate world layers, freeze at a gate, repeat a floor-letter collision, or lose cumulative equipment. Rich 3D, low-power 3D, and accessible 2D now share the same task and evidence model.

The most serious child-facing defects from the review are closed:

1. Encounter misses no longer become movement commands.
2. Correct floor objects lock once, release collision cleanly, and advance without vibration or repeated speech.
3. Left and right movement use route-relative screen orientation.
4. Gate handoff keeps the child in the journey and enters the next trail with one live world layer.
5. Residents stand beyond the answer arc, face the child, and no longer cover centre choices.
6. Instructions are short objectives such as "Find the first sound in 'mats'", with replay audio and no answer spoken in the instruction.
7. Three widely spaced choices are used for early practice, with large invisible hit areas and contrast-aware letters.
8. The child-created Beastie keeps body, dye, pattern, eyes, mouth, crest, tail, feet, and cumulative gear in the 3D world and reward ceremony.
9. Finds persist across gates, open caches, bank Sparks, and connect immediately to the Trading Post.
10. The accessible 2D route uses the same physical tasks, answers, corrections, mastery credit, and rewards as 3D.

## Browser Certification

Manual testing used the real preview UI rather than changing progress records mid-action.

- Desktop rich mode: an exact pointer selection advanced the phoneme slot and reward progress.
- Desktop rich mode: a pointer miss on blank ground recorded nothing and did not redirect the player.
- Keyboard: the semantic `Choose m` control advanced the same task with Enter.
- Phone at 390x844: the encounter HUD, three choices, player, resident, and phoneme slots stayed within the viewport; a real tap advanced the task.
- Gate: crossing the first gate entered Fern Steps, retained one canvas and one journey layer, and did not return to the menu.
- 2D fallback: the same `m/t/s` task advanced to the same next `t/a/s` stage with the same progress.
- Ceremony: the cumulative Beastie and Stone Staff were present; Tab focus remained inside the dialog and the world behind it was inert.
- Map: production and preview chapter labels were honest; both phone actions remained readable.
- Trading Post: purchasing Spikes reduced Sparks from 1200 to 1160, changed the item to owned, and equipped it immediately without deleting earned gear.

## Automated Evidence

| Gate | Result |
| --- | --- |
| Unit suite | PASS, 463 tests |
| Lint | PASS, zero errors; 19 unrelated existing hook warnings remain outside Sound Seekers |
| Quest curriculum | PASS, 40 stops, 103 sounds, 430 decodable words, 60 heart words |
| Seedwake release contract | PASS, 5 trails, 20 physical tasks, 15 signature tasks, 3 residents, 15 landmark groups, 60 finds, 120 Sparks |
| 3D asset contract | PASS, 12 rigged characters, 7 scenery models, 7.4 MB character source |
| Art contract | PASS, 43 checked images, valid alpha, no sky-covering layer |
| Music contract | PASS, three distinct world scores |
| Camera and interaction matrix | PASS, 20 phone/tablet encounter views, all choices safe and ray-clear |
| Route visual | PASS, desktop meander, phone island loop, and curved Trail 9 gate handoff |
| Gate handoff | PASS, Fern Steps, Trail 2 of 40 |
| Continuous journey | PASS, s1-s5 completed through live gates and cumulative reward |
| Full product screenshots | PASS, 12 screens across phone, tablet, and desktop |
| Production build | PASS, Vite production bundle built from 830 modules |

Primary visual evidence is stored in:

- `docs/previews/slice/`
- `docs/previews/shots/`
- `docs/previews/slice/camera-report.json`
- `docs/previews/slice/journey-report.json`

## Known Boundaries

These are not hidden software failures and must not be relabelled as complete:

1. Sixteen later-trail sound recordings are absent: `y_ie`, `y_ee`, `oo_short`, `ow_ou`, `aw`, `ore`, `air`, `are`, `ear`, `ure`, `c_s`, `g_j`, `ch_k`, `ea_e`, `le`, and `tion`. The product requirement is approved human voice only, so those tasks remain silent or gated until the later whole-app voice pass.
2. Chapters 2-8 are prototypes. They remain curriculum-valid and technically traversable, but the map labels them preview content because their authored mechanics, cast, environment kits, and chapter-specific production proof do not yet match Seedwake.
3. The rich renderer is materially better, but the remaining low-poly source kit prevents an honest literal PS3-fidelity claim. Asset replacement remains Workstream 5, not a lighting tweak.
4. Representative school iPad, low-end Chromebook, and phone traces require the physical devices.
5. Child comprehension, delight, fatigue, and verb recognition require observed child sessions. Automated play cannot certify those human outcomes.

## Next Sequence

1. Run physical-device and assistive-technology certification on this exact Seedwake build.
2. Observe children on a clean run, a wrong-answer run, and a resumed run; close every comprehension or fatigue issue.
3. Replace the remaining low-poly/procedural Seedwake source assets only where the contact sheet still falls below the art bar, then rerun every visual gate.
4. Record and approve the deferred voice set before enabling affected audio-led tasks.
5. Promote River Gardens only after it receives five authored verbs, a compatible cast and environment kit, adaptive score, accessibility parity, and the complete Seedwake proof contract.

No later chapter should be promoted by copying this report or changing metadata. It must generate its own evidence.
