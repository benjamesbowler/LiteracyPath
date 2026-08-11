# LiteracyPath Maths implementation dossier

Status: implementation-ready product specification

Scope: Foundation to Year 2

Primary curriculum alignment: Australian Curriculum v9

Cross-map: Common Core Mathematics K–2

Voice: `en-US-Chirp3-HD-Leda`

Privacy: no child voice or image recording

This dossier is the build authority for the proposed Maths subject area. It does
not change the running product until implemented. The current application and its
tests remain authoritative for shared platform behaviour.

## Decision

Build Maths as a subject module inside the existing LiteracyPath application.
Reuse accounts, schools, classes, learners, picture-code sign-in, privacy,
assignments, evidence storage, reporting primitives, exports and teacher UI.
Do not clone the repository, Supabase project or learner records.

The product navigation becomes:

```text
LiteracyPath
├── Literacy
│   ├── Teach
│   ├── Assess
│   ├── Practise
│   ├── Books
│   └── Reports
└── Maths
    ├── Teach
    ├── Assess
    ├── Practise
    ├── Number Stories
    └── Reports
```

## Documents

1. [Product requirements and experience map](PRODUCT_REQUIREMENTS.md)
2. [Platform architecture and code contracts](PLATFORM_ARCHITECTURE.md)
3. [Curriculum, assessment and reporting](CURRICULUM_ASSESSMENT_REPORTING.md)
4. [Number Stories and songs launch pack](CONTENT_LAUNCH_PACK.md)
5. [Manipulatives, learning activities and arcade games](GAMES_AND_MANIPULATIVES.md)
6. [Audio, image and media production](MEDIA_PRODUCTION.md)
7. [Implementation backlog and release gates](IMPLEMENTATION_BACKLOG.md)

## Product promise

Maths must help a teacher answer four questions:

1. What mathematical idea is this learner developing?
2. Which representation or strategy are they using?
3. What misconception, if any, is visible in the evidence?
4. What should the teacher or family do next?

Games, page turns, speed and time-on-task are participation evidence. They cannot
by themselves create a formal `Secure` judgement.

## Launch definition

The first public Maths release is complete only when it includes:

- Foundation number sense through part–whole understanding to 10;
- Year 1 number, addition/subtraction within 20 and two-digit place value;
- Year 2 number to 1,000, facts within 20 and early multiplication/division;
- 12 interactive manipulatives;
- 8 assessment interaction types;
- 12 original Number Stories with complete page text;
- 10 original maths songs;
- 8 curriculum-integrated arcade games;
- teacher presentation, small-group plan, worksheet and Family Bridge modes;
- subject-specific reporting and misconception guidance;
- exact-text LEDA narration and instruction audio;
- accessibility, privacy, offline and evidence-integrity gates.

## Research and curriculum basis

- [Australian Curriculum v9 Mathematics](https://www.australiancurriculum.edu.au/curriculum-information/understand-this-learning-area/mathematics)
- [Foundation achievement standard](https://v9.australiancurriculum.edu.au/resources/work-samples/mathematics/foundation/ws01-knowing-numbers)
- [Year 1 achievement standard](https://www.australiancurriculum.edu.au/resources/work-samples/mathematics/year-1/ws03-place-value)
- [Year 2 achievement standard](https://www.australiancurriculum.edu.au/resources/work-samples/mathematics/year-2/ws01-fractions)
- [Common Core Mathematics](https://corestandards.org/wp-content/uploads/2023/09/Math_Standards1.pdf)
- [EEF: Improving Mathematics in the Early Years and Key Stage 1](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/early-maths)
- [EEF: manipulatives and representations](https://educationendowmentfoundation.org.uk/early-years/maths/use-manipulatives-and-representations-to-develop-understanding)

## Non-negotiable boundaries

- No child voice recording, camera, image upload or biometric processing.
- No speed score may be interpreted as conceptual mastery.
- Every assessment claim names its evidence source and representation.
- A learner who has not been assessed is `Not checked`, never red or behind.
- Mathematics content uses stable authored manifests, not generated-at-runtime
  questions.
- Every visual quantity is programmatically countable and independently audited.
- Number Stories support mathematical talk; reading difficulty never determines a
  learner's maths result.
- Currency, measurement and terminology are locale-aware.
- Teacher-selected accommodations do not lower the mathematical construct unless
  the report explicitly says the construct changed.
