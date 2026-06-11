# Product Plan — From Islands to One Daily Loop

*Prepared 12 June 2026. Decision document: what we build, what we refuse
to build, and the order.*

## The one-sentence strategy

We are not a general literacy platform. We are **the best EL-aligned
early literacy app** — and the product is one daily loop:

> **Log in → Today's Mission (one quest station + one book + one game,
> chosen from the child's own data) → finish → streak, reward, and the
> teacher and family see it.**

Everything below either feeds that loop or gets cut.

---

## What we should NOT build (and why)

**Family messaging / parent accounts (the ClassDojo lane).** Parent
auth, two-way messaging, translation, moderation, notifications, quiet
hours — this is a second product with serious child-safety and privacy
surface. A weekly **printable/emailable family digest** delivers 70% of
the visibility for 5% of the cost. Revisit accounts only after schools
ask for them by name.

**Content scale war (the IXL/Raz lane).** They have thousands of books
and a decade of authoring. We have 144 narrated books that exactly match
the EL skills block — that is a *positioning win*, not a weakness, if we
say it plainly: "every book, game, and lesson maps to the EL cycle your
class is on this week." Claim the niche; don't dilute it.

**True adaptive ML.** A rules engine over our existing mastery data
("missed /m/ twice → bridge round on /m/") is explainable to teachers
and 95% as effective at this age. IXL-style ML is years of work.

**Student annotations and open-ended portfolios.** High moderation and
storage burden, low K-1 value. One "best read" recording per book
(phase 4, optional) covers the student-voice need.

---

## Phase 1 — The Daily Mission (the spine) ~1–2 rounds of work

The student home stops being a menu and becomes a mission.

1. **Mission builder**: a rules module that reads the student's mastery
   and assessment data plus Skills Quest progress and outputs today's
   three tiles: one quest station (their current cycle, weakest skill
   first), one book (their level, narrated, unread first), one game
   (rotating mechanic, word pool biased to missed sounds).
2. **Home screen rework**: "Today's Mission" hero with the three tiles
   and a visible 0/3 → 3/3 tracker; existing areas remain below as
   "Explore" for free time.
3. **Mission complete moment**: 3/3 triggers the celebration (Phinny,
   confetti, fanfare), advances the streak, and grants the day's
   collectible (see Phase 3).
4. **Streaks done kindly**: per-school-day streak with one automatic
   "streak shield" per week so a sick day doesn't reset a 5-year-old's
   month. Streak shows on home and in the teacher roster.
5. **"Why this" line** on each tile ("because /sh/ was tricky
   yesterday") — the IXL feel with one sentence of rules output.

## Phase 2 — Reading Room + teacher action cards ~2 rounds

6. **Reading Room v1**: the library reshaped into leveled shelves
   (A → D as a visible ladder), with reread counts, a 3-question
   picture quiz after each book (generated from each book's own text,
   teacher-reviewable), and a **level-up ceremony** with certificate
   when a shelf is cleared. No recordings yet.
7. **Teacher action cards**: above the roster, max three cards built
   from existing data: "These 4 students missed /sh/ this week —
   run the reteach group" (with the matching quest station linked),
   "These students haven't read this week — assign a book,"
   "Celebrate: Aaron mastered 3 new sounds." Each card has one button
   that does the thing.
8. **Assign a book**: teacher picks book(s) for a student/class; the
   assigned book becomes the mission's reading tile.

## Phase 3 — Identity, rewards, family digest ~2 rounds

9. **Avatar**: pick a creature companion at first login (dragon, robot,
   fox... matching the art direction; one Kimi image batch). It appears
   on home, celebrations, and the leaderboard.
10. **Collections**: one collectible per completed mission/cycle check
    (gems, creatures, banners — one Kimi sheet), displayed on a shelf;
    finishing a set unlocks a printable certificate.
11. **Certificates**: auto-generated printable PDFs for cycle
    completion, level-up, and collection sets — child's name, school,
    teacher line. Teachers love printing these; it's free emotional glue.
12. **Family digest v0**: one-page weekly PDF per student from existing
    data — minutes read, books finished, sounds mastered, streak, a
    "practice at home" word list for the current cycle. Teacher clicks
    "print/email digests" once a week. No parent accounts.

## Phase 4 — Voice + polish (optional, after the above sticks)

13. "Best read" recording: one short recording per book via the
    browser, stored privately, playable by teacher and in the digest.
14. Report-to-recommendation pass over remaining teacher reports.
15. Positioning pass over all copy: "EL-aligned early literacy
    intervention," never "literacy platform."

---

## Why this order

Phase 1 changes what the app *is* (loop, not toolkit) using parts that
already exist — it's wiring, not invention. Phase 2 makes the two paying
audiences (teachers choosing tools, schools buying reading practice)
see daily value. Phase 3 makes children drag parents back to it. Phase 4
is gravy. At every step the question for any new idea stays the same:
**does it feed the daily loop?** If not, it waits.
