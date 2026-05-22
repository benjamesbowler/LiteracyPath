# LiteracyPath — Kimi Context

## What is LiteracyPath?

LiteracyPath is an adaptive early literacy assessment and learning platform for kindergarten and early elementary students.

The system includes:
- teacher-led literacy assessments
- adaptive skill progression
- item mastery tracking
- Child Learning World gameplay
- phonics/CVC instruction
- ESL-friendly literacy support

The product is designed for:
- kindergarten students
- ESL learners
- touchscreen/mobile usage
- teachers needing fast instructional insight

---

# Current Architecture

## Teacher Mode
Professional assessment platform.

Includes:
- class management
- student management
- adaptive assessments
- checkpoint progression
- item mastery tracking
- reports
- exports
- admin dashboard

Teacher Mode should feel:
- calm
- professional
- efficient
- readable

NOT:
- childish
- overloaded
- game-like

---

## Child Mode / Learning World

Current world:
Echo Caves (Short-A)

Child Mode includes:
- image-supported decoding
- heard-word decoding
- mastery confirmation
- adaptive phonics gameplay
- audio/image support

Child Mode should feel:
- warm
- magical
- emotionally safe
- highly readable
- low frustration

Inspired by:
- Khan Kids
- Duolingo ABC
- Lingokids

---

# Current Priorities

1. Cleaner Teacher Mode UX
2. Better Child Mode visuals
3. Better phonics interactions
4. Asset scaling
5. Adaptive remediation
6. Mobile optimization

---

# Design Style

## Teacher Mode
- compact
- modern
- clean
- calm
- low cognitive load

## Child Mode
- playful
- warm
- fantasy-light
- not overstimulating
- readable on small screens

---

# Current Technical Stack

- React
- Vite
- Supabase
- CSS modules / custom CSS
- responsive layouts

---

# Important Constraints

Do NOT break:
- EL assessments
- exports
- Supabase persistence
- mastery tracking
- reporting flow

Do NOT redesign:
- core assessment logic
- database architecture

Focus areas suitable for Kimi:
- UI cleanup
- responsive layouts
- CSS refinement
- component organization
- visual polish
- image/audio assets
- child-friendly UX
- compact navigation
- spacing systems

---

# Current Active Work

Recently completed:
- Child Learning World
- Echo Caves Short-A
- mastery tracking
- item coverage
- checkpoint vs mastery split
- image/audio asset integration

Current UX issue:
Teacher Mode top header/navigation is too tall and cluttered.

Desired direction:
- thin breadcrumb row
- compact action row
- smaller cleaner buttons
- less wasted vertical space

---

# Response Style

When suggesting UI/code:
- prefer incremental safe refactors
- preserve working systems
- avoid giant rewrites
- prioritize responsive usability
- think like production educational software