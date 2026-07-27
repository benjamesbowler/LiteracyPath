# Teacher UI primitives

The teacher product uses one implementation for its structural UI. Route files
own teaching content and data; `src/components/teacher/ui/` owns the visual and
interaction contract below.

| Primitive | Contract | Product adoption |
|---|---|---|
| Teacher tokens | Minimum target, page/panel spacing, card/control radius, and action-column width. | Product stylesheet, state matrix, roster filters, action cards, page shells. |
| `TeacherPageShell` | One teacher product container with optional product and intention identifiers. | Today, Classes, Assess, Progress, Plan/Resources. |
| `TeacherPageHeader` | Eyebrow, title, description, optional brand, and context slot. | Today, Classes, Assess, Progress, Plan/Resources. |
| `TeacherFilterBar` | Named filter region that remains usable at tablet breakpoints. | Active learner roster. |
| `TeacherDataTable` | Named keyboard-scrollable region around a semantic table. | Active learner roster. |
| `TeacherChart` | Text-named chart wrapper with decorative marks hidden from assistive technology. | Class sound map. |
| `TeacherDialog` | Initial focus, Escape close, optional focus trap, and focus restoration. | Destructive confirmation, reset confirmation, contextual teacher modals. |
| `TeacherModal` | Modal overlay specialization of `TeacherDialog`. | Roster import, class code, login cards, help, learner access operations. |
| `TeacherDrawer` | Non-modal, Escape-close specialization with focus restoration. | Learner detail drawer. |

## Ownership rules

- Teacher route files must compose these primitives instead of recreating their
  wrapper markup or focus code.
- Page content may add a route-specific class, but the shared class and semantic
  attributes come from the primitive.
- A chart provides a complete text alternative. Its visual tiles are redundant.
- A data table keeps native table semantics. The primitive only owns the named
  scroll region.
- Modal dialogs trap focus; the non-modal learner drawer does not trap Tab, but
  both close with Escape and return focus to the control that opened them.
- Low-frequency destructive dialogs stay lazy. Consolidation must not move
  teacher-only or admin-only code into the initial child bundle.

## Regression contract

`npm run check:teacher-ui-primitives` performs three independent checks:

1. A duplication guard rejects local page-shell, table-wrapper, chart-role,
   dialog, and drawer implementations in the migrated teacher surfaces.
2. Server-rendered unit fixtures verify exact element hierarchy, labels, roles,
   modal state, data attributes, and closed-dialog behavior.
3. The authenticated device matrix compares the real roster and learner drawer
   with four committed Chromebook/tablet screenshots. The existing 2.5% pixel
   tolerance is unchanged.

The production build and bundle ratchet remain separate release gates. Moving
the destructive dialogs into their own lazy chunk reduced the main entry rather
than spending the available budget.
