# Mobile Responsive Audit

Generated: 2026-05-29

## Summary

This pass focused on the Teacher Dashboard and reporting layer because it was the largest mobile risk: long reports, wide tables, export controls, and multiple dashboard sections were competing on one page.

## Screens

| Screen | Desktop | Tablet | Mobile | Issues / Fix |
|---|---|---|---|---|
| Login / account access | OK | OK | OK | Existing stacked auth card remains usable. |
| Student selection | OK | OK | Watch | No change in this pass; keep button rows stacked in future QA. |
| Student Overview | OK | OK | Watch | Existing cards stack; future visual QA recommended. |
| Skills | OK | OK | Watch | Existing skill grids should be checked on narrow devices. |
| Assessment question screen | OK | OK | Watch | No scoring/layout changes in this pass; current responsive assessment contracts still pass. |
| Assessment completion/result screen | OK | OK | OK | Existing action rows stack through shared mobile styles. |
| EL Assessments | OK | OK | OK | Formal assessment pages already use focused card layout. |
| Guided Reading book selection | OK | OK | Watch | No book data/layout changes in this pass. |
| Guided Reading reading screen | OK | OK | Watch | Existing read-aloud controls untouched. |
| Guided Reading completion/conference screen | OK | OK | Watch | Word status rows should remain card-like on mobile. |
| Teacher Dashboard | Improved | Improved | Improved | Uses desktop tab grid and mobile `Choose dashboard section` dropdown. |
| Teacher Dashboard Overview | Improved | Improved | Improved | Summary cards and action cards stack on mobile. |
| Teacher Dashboard Classes | OK | OK | OK | Management tables already use responsive admin table cards. |
| Teacher Dashboard Students | OK | OK | OK | Management tables already use responsive admin table cards. |
| Teacher Dashboard Reports | Rebuilt | Rebuilt | Rebuilt | Added responsive report controls, section checkboxes, expandable detail sections, bounded tables, and mobile table cards. |
| Teacher Dashboard Guided Reading | OK | OK | OK | Export button and summary cards stack. |
| Teacher Dashboard Assessment | OK | OK | OK | Existing heatmap uses bounded horizontal scroll; regular tables become cards. |
| Teacher Dashboard HFW | OK | OK | OK | HFW summary table uses responsive admin table behavior. |
| Teacher Dashboard Exports | OK | OK | OK | Export cards stack and buttons remain full width on mobile. |
| Admin Dashboard | OK | OK | OK | Admin tabs stack for non-teacher dashboard on mobile. |
| Finished Report page | OK | OK | Watch | Existing report actions remain stacked; deeper mobile QA still recommended. |
| Modals/dialogs | OK | OK | Watch | QA delete modal remains compact; browser confirm dialogs are native. |
| Export/report controls | Improved | Improved | Improved | Detailed report controls use responsive grid; export actions stack on mobile. |
| Class creation / class dashboard | OK | OK | OK | Tables use responsive card conversion. |

## Fixes Applied

- Teacher reports now use a dedicated detailed report workspace instead of a long unstructured report dump.
- Report filters use `detailed-report-controls`, a responsive grid that stacks on mobile.
- Section choices use checkboxes in `detailed-report-section-toggles`.
- Skill/item detail is grouped in expandable `detailed-report-section` blocks.
- Wide item tables are wrapped in `bounded-report-table` and become card rows on mobile through existing admin table CSS.
- Guided Reading report detail uses compact cards.
- Export buttons use `detailed-report-actions` and stack on mobile.

## Remaining TODO

- Run manual device QA for Guided Reading reading/conference screens.
- Run manual child assessment viewport checks at 360px and 430px.
- Consider a later browser-based visual regression pass for the full app once the dashboard data stabilizes.
