# The public area, in plain terms

Written 2026-08-07. This is the short human version of `FREE_TIER_SPEC.md`, which has the detail and
the file references. If the two ever disagree, the spec is right and this file is stale.

---

## What it is

A stranger finds LiteracyPath, types an email and a password, adds their child's first name, and the
child is playing within about two minutes. They get roughly a fifth of the children's activities. No
reports, no class code, no waiting for anyone to approve them, no school involved at all.

The point isn't to give away a free product. It's so that a parent — or a teacher who is quietly
shopping for their school and doesn't want a sales call — can see the thing actually working, with a
real child, without talking to you.

## How it works

Right now every single person who uses LiteracyPath got in through a school. A teacher signs up, you
approve them by hand, they make a class, the class gets a code, and children join through that code.
Every child in the system hangs off a teacher who hangs off a school that you personally let in.

The public area is a second door into the same building. Behind that door, a family account works like
a very small school: one invisible class that nobody ever sees, up to two children in it, and no class
code because nobody else is ever joining. The children's side of the app is exactly the same code —
same games, same books, same picture-code login. The only difference is that most of the content is
locked, and there is no teacher dashboard on the other side of it.

That "invisible class" trick matters more than it sounds. In the database, a child cannot exist
without a class. Rather than tear that rule out — which would touch every query and every security
rule in the app — a family just gets a class of its own that stays hidden. It's the difference between
a week of work and a month of it.

What the parent sees is deliberately not a report. Reporting is your professional product and it's the
thing schools pay for; giving it away free would be giving away the wrong half. What they get is more
like a scrapbook: your child read three books this week, here's what they made, here's a badge they
earned. Warm, honest, and useless as a substitute for the teacher product.

## What we'd need to open it

Four things genuinely block it. Everything else is ordinary work.

**The app has no concept of "you get less than everything."** I searched the whole codebase for any
notion of a plan, a tier, a trial, a paywall, a locked feature — there is nothing. Every account that
gets in gets all of it. So before a single parent can sign up, the app has to learn the sentence "this
account may see these things and not those things," and that has to be enforced in the database and
not just in the screen. A limit that only exists in the front end is a marketing banner, not a limit —
anyone slightly technical walks straight through it.

**The database currently refuses to create a parent.** Three separate rules stop it: signing up
demands a school name and fails at the database level without one, an account must be approved by you
before it can do anything, and, as above, a child must belong to a class. None of these are hard to
change. All three have to be changed on purpose and carefully, because they're the same rules that
make the school product safe.

**Somebody has to choose the 20%.** This is a curriculum decision, not a technical one, and it's the
one I can't make for you. The temptation is to give away the first fifth — the first books, the first
phonics cycles. That's the worst choice: a parent sees Level A books and easy sounds and concludes the
app is for babies. The slice should be a cross-section — a little of everything, including one genuinely
impressive thing — so what they see is a smaller version of the real product rather than the shallow
end of it.

**The legal position has to change first, and it takes the longest.** This is the real critical path,
and it's worth being blunt about it.

## The legal thing, since it's the one that actually stops you

Your privacy policy currently says, in writing, that you do not offer independent child sign-up outside
a school. Your consent materials say the same thing in a different way. That isn't sloppy drafting —
it's the whole basis on which you're allowed to hold children's data.

Under the school model, the school gives consent on the parents' behalf, on the reasoning that this is
education and the school stands in for the parent. That's a well-established route and yours is set up
correctly for it.

The moment a parent signs up directly, that reasoning is gone. You become the party responsible for
getting consent yourself, from each parent, verifiably — and you're doing it for children under 13,
which is the most heavily regulated category there is. The US regulator has said explicitly that you
cannot push that responsibility onto schools or onto parents. The updated rules have been binding
since April 2026.

Practically that means: rewritten privacy policy and consent materials covering both routes; an actual
consent step inside the app, which doesn't exist anywhere today — no age gate, no terms acceptance, no
"I am this child's parent" attestation; a published retention schedule with a job that enforces it,
because keeping children's data forever is not allowed; and a written security programme with a named
person responsible for it.

None of that is exotic. It's just slow, and it can't be done in parallel with the build because it
determines what the signup screen has to collect.

## The dangers, honestly ranked

**Children's data, collected without proper consent.** This is the one that could actually end the
business rather than embarrass it. It's not a risk of building the feature badly — it's a risk of
building it *before* the legal work lands. The mitigation is boring and completely effective: do the
legal work first.

**Your approval queue stops being a filter.** Today, every account that exists was let in by you
personally. That single human check is quietly doing an enormous amount of security work — no
spam accounts, no automated abuse, no fake schools, no scraping. A public signup form removes it
entirely, in one step. You'd need a captcha and rate limiting on day one, not as a follow-up.

**One specific hole to close before launch, not after.** There's a leaderboard function that anyone can
call without logging in, and it returns children's display names. It's currently safe by accident: it
refuses to return anything unless a school is attached, and a family account has no school. That is
luck, not design, and the next person to edit that function won't know it's holding a door shut. It
needs a test that fails loudly if anyone changes it.

**Free is not free.** Every free child costs you database rows, sync traffic and audio bandwidth
forever, and there are nearly 22,000 media files in the app. Before you open it, know roughly what one
free child costs per month, because that number decides how long you keep inactive accounts — and
you'll want that answer in hand anyway for the retention schedule.

**Giving away the thing you sell.** Least likely, worth naming. The instinct when a free tier feels
thin is to add a bit of reporting. Don't. Reporting is the product. A parent scrapbook and a teacher
report are different objects and should stay different objects.

**One thing that is genuinely not a danger:** the children's side itself. Child login is already rate
limited, device fingerprinted, and locks out after five failed attempts. It's the most carefully
protected part of the app. The soft spot is the grown-up door, not the child one — which is exactly
what the account authorisation plan is about.

## The order I'd do it in

Legal work starts first and runs the whole time, because it's the long pole and nothing else waits on
it. Meanwhile, build the "this account gets less than everything" layer and ship it to the *school*
product first, where every account gets full access and nothing visibly changes — that way the riskiest
new machinery is proven under no pressure at all. Then choose and build the 20% slice, then family
accounts, then the signup and consent screens, then the parent scrapbook, then the abuse protections
and the cost dashboard.

The two decisions that are yours and not mine: what the 20% contains, and what happens when a child
reaches the end of it. A wall, a waitlist, or a "tell your school about us" path. That second one is
the most important product decision in the whole tier, and it isn't technical.
