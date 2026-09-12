---
name: ui-verification
description: Design, change or review LiteracyPath screen layout, navigation, responsive controls, accessibility or game presentation. Use for clipping, mobile/iPad fit and interaction defects; not for backend-only changes.
---

# UI implementation and verification

Inspect the running surface and its current components. Use
[child surface rules](../../../docs/design/CHILD_SURFACE_RULES.md) for learner
routes and [teacher primitives](../../../docs/teacher/UI_PRIMITIVES.md) and
[state matrix](../../../docs/teacher/STATE_MATRIX.md) for teacher routes.
For game presentation or gameplay work, read the relevant sections of the
[Game Design Bible](../../../docs/design/GAME_DESIGN_BIBLE.md) and
[production guide](../../../docs/design/GAME_VISUAL_PLAYABILITY_PRODUCTION_GUIDE.md).

Follow the product's [design system](../../../docs/LITTLE_LITERACY_GUIDES_DESIGN_SYSTEM.md)
and the user's visual direction. Choose styling and motion for the learner and
interaction; a preset's fonts, animation library, marketing layout or image
quota is not a product requirement. A spacing repair does not require new art.

Exercise the affected controls and loading, error, empty, complete and resumed
states. Check child reading load, visible next action, focus, labels, reduced
motion, touch reachability, overlays and the persistent bottom navigation.
Use current dimensions and target sizes from
[the device policy](../../../src/policy/studentDeviceMatrix.js), without copying
thresholds into this skill. Keep physical game controls responsive during audio.

Use `mobile-layout` in [task gates](../../../docs/verification/TASK_GATES.md),
then the affected route's browser tests and direct interaction. Inspect actual
rendered images/screenshots at the relevant sizes; DOM metadata alone cannot
show whether controls are obscured. Browser emulation is separate from testing
physical iPad Safari. If content, scoring or media changes, use its specialist
skill as well.
