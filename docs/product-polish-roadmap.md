# Product Polish Roadmap

This splits the full-app audit into six implementation sections so each pass can be shipped and checked cleanly.

## Section 1: Foundation, Entry, Login, And Shell

Status: complete in this pass.

- Upgrade the public entry screen so student and teacher routes are clearly separated.
- Improve teacher login/signup/reset language and accessible status handling.
- Improve student login loading, empty, and error states across school, class, student, and picture password steps.
- Clarify global navigation labels and disabled states.
- Tighten student home sign-out affordance and first-use polish.

## Section 2: Teacher Dashboard, Classes, And Roster Operations

Status: complete in this pass.

- Turn the dashboard into a command center with clearer current-class context.
- Finish alignment and density polish for class creation, student creation, login cards, and roster tables.
- Add clearer empty states for no classes, no students, and setup-required accounts.
- Improve roster actions so common teacher tasks are faster and harder to mis-click.

## Section 3: Assessment Experience And Checkpoint Reliability

Status: complete in this pass.

- Consolidate assessment loading, transition, retry, and error states into one predictable shell.
- Add full-screen and fit-to-screen controls for child-facing assessment and phonics flows.
- Audit audio prompts so sound names, letter names, and vowel sounds are always distinct.
- Add regression checks for question transitions and media preloading.

## Section 4: Practice, Phonics, Story Quests, And Guided Reading

Status: complete in this pass.

- Make the child practice areas feel like one coherent student product.
- Improve activity selection, progress feedback, and return paths.
- Finish game and phonics layout checks across desktop, tablet, and small screens.
- Separate student guided-reading mode from teacher running-record tools more clearly.

## Section 5: Reports, Admin, Content QA, And Release Readiness

Status: complete in this pass.

- Redesign reports around drill-downs, mastery evidence, and export-ready summaries.
- Add admin tools for school/class/user cleanup and content QA workflows.
- Replace truncated report summaries with complete mastered-item lists.
- Finish performance, stability, accessibility, and deployment checks for release.

## Section 6: Teacher Export Center, Product Finish, And Final Contract Closure

Status: complete in this pass.

- Add a dedicated teacher export workspace for formal assessment, guided reading, and archive downloads.
- Surface EL formal assessment evidence fields clearly in teacher-facing export controls.
- Close teacher dashboard data-contract gaps that were still failing after the first five passes.
- Add a final product-finish check so the last polish layer stays protected.
