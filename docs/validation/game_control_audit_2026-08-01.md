# Child game control audit — 2026-08-01

Standard: [Game Design Bible](../design/GAME_DESIGN_BIBLE.md)
Scope: the shipped child games with movement or a held action

## Result

The two four-way/free-roaming games now use the required iPad split: forward/back at lower left, steering/actions at lower right. Three established side-on games already had the correct left-movement/right-action split; this batch added pointer capture, cancellation and accessible names where they were missing.

| Game | Control model | Layout | Keyboard parity | Release/cancel safety | Result |
| --- | --- | --- | --- | --- | --- |
| Sound Seekers | four-way free roam + listen | forward/back lower-left; left/right/listen lower-right | arrows + WASD | up/cancel/lost capture | Pass in code/unit and browser at 1024×768 and 1180×820; physical iPad still required |
| Spell & Skate | free roam + jump/boost | forward/back lower-left; left/right/actions lower-right | arrows + WASD; Space/Enter; Shift | up/cancel/lost capture | Pass in code/unit and browser at 1024×768 and 1180×820; physical iPad still required |
| Letter Leap | side movement + jump | left/right lower-left; jump lower-right | arrows; Space/Up | fixed in this batch: capture/cancel/lost capture | Pass in code |
| Word Bridge | side movement + pick/drop | left/right lower-left; action lower-right | arrows/A-D; Space/Enter/Up | fixed in this batch: capture/cancel/lost capture | Pass in code |
| Reel & Read | side movement + cast | left/right lower-left; cast lower-right | arrows/A-D; Space/Enter/Up/Down | fixed in this batch: capture/cancel/lost capture | Pass in code |
| Rocket Run | lane change | direct lane touch zones | left/right arrows | discrete tap, no held state | Not subject to four-way split; next UI pass should make the lane zones visibly named controls |
| Sound Racer | lane change | direct lane touch zones | left/right arrows | discrete tap, no held state | Not subject to four-way split; next UI pass should make the lane zones visibly named controls |
| Star Gallery | four-way pointer steering + cut | drag/tap surface; cut lower-right | arrows/WASD + action | pointer surface owns active pointer | Exception pending: add a non-drag movement alternative before claiming full Game Bible conformance |
| Sound Safari | two-axis net target | direct target placement | four arrows | discrete placement | Exception pending: confirm single-tap alternative and visible target cue in browser |

## Checks for the browser/device pass

1. At 1024×768 and 1180×820, no control intersects the prompt, progress strip, semantic answers or safe-area inset.
2. Every visible target is at least 56×56 CSS pixels with 8px separation.
3. Press, hold, slide outside and release each movement button. Movement must stop on every release path.
4. Tap quickly. The avatar must move visibly even when the pointer is released before the next frame.
5. Repeat with keyboard after touch; no key or pointer state remains stuck.
6. Rotate portrait/landscape and re-run steps 1–5.

Physical iPad status is deliberately not claimed by this record. Desktop touch emulation cannot prove grip comfort, OS gesture interference or real-device latency.

## Recorded browser evidence

- Sound Seekers at 1024×768 and 1180×820: all five controls rendered 58×58 pixels; adjacent controls had 8 pixels of clear separation; the outer controls remained 16 pixels inside the viewport.
- Spell & Skate at both sizes: movement/steering controls rendered 64–68 pixels high and Boost rendered 58 pixels high; control gaps were 10 pixels. The easy-mode guide ended 16 pixels above the steering/action row, so it no longer intercepts or obscures controls.
- Spell & Skate source and unit checks confirm that each ordered spelling step creates three unique scattered choices with exactly one correct segment. Browser inspection confirmed manual forward/back/turn controls, no easy-mode auto-drive, persistent sound slots and the free-roaming park camera.
- The Sound Seekers map now treats each painted world plate as the route artwork. The duplicate generic road overlay was removed, five world-specific stop anchors were placed on the authored road, and the plate is displayed at its native landscape proportion on tablet/desktop.
- The character equipment harness rendered Muddy, Chompy and Pip with back, head, neck and held slots equipped at once. Visual inspection confirmed wings behind the body, hats above the eyes, scarves at the neck and staffs in front beside the hand.

Named automated check: `node --test tests/unit/bookCharacterAvatar.test.js tests/unit/gameSurfaces.test.js tests/unit/questRouteGraph.test.js tests/unit/questRuntimeSystems.test.js tests/unit/soundSeekersArcadeAudit.test.js` — 76 passed, 0 failed on 2026-08-01.
