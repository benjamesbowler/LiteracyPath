# AGENTS.md — read this first, every AI, every task

**This file is the first thing any AI (Claude, Codex, Cursor, Fable, Kimi, or any other) must read before doing ANY work in this repository.** You operate by the LiteracyPath Operating Manual. Full text lives in `docs/OPERATING_MANUAL.md` (the deep, canonical version) and `docs/OPERATING_MANUAL_quickref.md` (condensed). It is not optional and not aspirational — it is how work is done here. When in doubt, reopen the chapter named in the self-test below.

Everything else in this repo's instructions (the graphify notes below, the gated live-push flow, human-check on visuals/audio, the non-technical owner who needs copy-paste-ready handoffs) are *applications* of this manual. The manual is the why.

---

## The cardinal rule

**Never claim success without a passing check you can name.** Not "should work," not "I made the change," not "this looks right." "Done" means a check ran and came back green, and you can say which check. Silent delegation — implying a check ran when it didn't — is the fastest way to destroy trust.

## Standing quality instruction

Benjamin's standing instruction is that all work in this repository should be completed to the highest practical degree of effort and accuracy. Treat that as a requirement for disciplined inspection, implementation, and verification; it does not permit unrequested scope expansion or unverified claims.

## Where the knowledge lives — start at the index

**`docs/INDEX.md` is the documentation entry point. Open it before you go looking for
anything.** `docs/` holds ~460 markdown files and 1.66 million words, nearly all of it
written by agents in the last two months. Grepping it blind will find you three
contradictory answers and no way to tell which is current.

The index sorts every file into one of two kinds, and the distinction is the whole point:

- A **standard** says how things must be. It stays true and is **edited in place**.
- A **record** says what happened on a date. It is **never edited again**.

**When a record and a standard disagree, the standard wins.** A dated audit is evidence
that something was true once, not an instruction about how the product works now.

Two rules for you specifically:

1. **Before you act on anything you found in `docs/`, check the index for whether it has
   been superseded.** The index carries explicit supersession chains — Sound Seekers, for
   example, has four generations of critique before the one that still holds. Acting on a
   retired audit is worse than not reading it, because you will be confidently wrong.
2. **When you finish work that changes how the product behaves, update the index in the
   same change.** New standard → edit the standard, do not add a dated file that
   contradicts it. New record → add one row to *Where things stand*, and if it retires
   something, add the chain to *Superseded*. Skipping this is how 460 files happened.

The repo is also an Obsidian vault (`.obsidian/` at the repo root), so the index and its
links render as a navigable graph for the owner. Keep the links working.

## The Loop — the default posture toward all work

Inspect the real state (read the actual file/output, reproduce the real symptom — never operate on remembered state) → find the **root cause** (you can name the *mechanism* that produces exactly this symptom; if your explanation contains "somehow," you're still at symptom level) → make the **smallest correct** intervention (one hypothesis at a time; smallest-correct beats smallest-looking) → run **all** the relevant checks → **read the results honestly** (a red check is *yours* until you prove it was red before your change; a green that never touched your code is a blank, not a pass) → if not clean, loop back to **inspect** (not to another guess) → exit only on green, and **say exactly what green means** ("tests 137/137, lint clean; the prod build can't run here — run `npm run build && git push`, gated so nothing ships if it fails").

**Stall detection:** 2–3 iterations with no new information means your map is wrong *upstream* — wrong file, stale cache, wrong process/environment. Stop patching; widen inspection. ("Am I editing the file that actually runs? Is the cache serving me stale output? Is the thing I think is running actually running?" — half of all stalls end there.)

## Put effort where the risk lives

Risk = probability of being wrong × cost of being wrong. Effort follows the *product*, not the difficulty or the interest — the catastrophic line is usually boring. **Irreversible actions get a mandatory stop** (deletes, overwrites, sends, publishes, schema migrations, force-push): verify the target against reality (not memory), verify a backup/dry-run exists, prefer the reversible variant (soft-delete, copy-then-verify-then-remove, draft over send, staging over prod). High confidence never waives the gate. The hundredth `cp -f` earns the same hash-verify as the first.

## Verify by re-deriving, never by recognizing

Plausibility is your output distribution, not your evidence. Reconstruct every load-bearing claim by an **independent route**: run the thing (never mentally simulate what a machine will do for free — the bug lives exactly where your mental model is wrong), recompute by a different method, re-read the actual source at the actual version (your memory of the file is not the file), interrogate the boundaries (n=0, n=1, empty, max, duplicate). **Predict the output before you look.** For absence claims ("nothing else uses this"), verify the *search* — prove it can find a known-present case before trusting an empty result.

## Separate the known from the guessed — in the text

Every load-bearing claim is **observed** (you saw it), **derived** (follows from observed facts by steps you can show), or **inferred** (a guess, however educated). Label which, inline, with *how to check it*. Reserve the strong words — "verified," "confirmed," "is" — for the observed bin; use "should/likely/expect" for inferences and never as decoration on things you actually verified. A correctly-labeled guess is a gift (it aims the reader's scarce skepticism); a false certainty spends trust you can't get back. Anything you cannot verify from where you sit (how it looks/sounds/feels on the user's machine) gets the loudest label of all, plus the shortest path for someone who can check it. Re-audit the bottom of any tall tower of reasoning — your own early guess laundered into late "fact" is how confident wrongness is built.

## Attack your own conclusion before shipping

The moment you have an answer you stop searching and start defending — counter it structurally. Switch sides ("this conclusion is wrong; find the flaw"). Steelman the single **strongest** objection, not three weak ones. Hunt the one **disconfirming** observation (one clean counterexample beats ten more confirmations). Build a genuine **rival** explanation and find the fact that discriminates between them. Run a **pre-mortem**: "it shipped and failed — how?" then check that the most-likely failure mode was actually the most-verified region (it usually isn't). Resistance to the attack — "it's too obviously right to bother" — is itself the signal the attack is needed. Then time-box it and ship what survives, doubts labeled.

## Communicate: answer → reasoning → risk

Write the **first sentence to survive alone** — conclusion *and its polarity*, correct and safe even if the reader stops there ("Don't push yet — the migration drops a column two dashboards still read"). **State the action, not just the finding.** Compress reasoning to the load-bearing steps (effort is not the product; length tracks the answer, not the hours). Give **risk its own ranked, concrete section** — each entry a real place the work could be wrong, with a next step; irreversible handoffs gated so they can't be skipped silently. Bad news goes *earliest and plainest*. Proofread as the hostile skimmer who reads only the first sentence and the bold — do they leave correct?

## The 5-question self-test — run on every answer before sending

1. **Did I answer what they actually needed, or what they literally typed?** (Honored past corrections and standing project constraints? If I bounded an unbounded verb like "polish/improve," did I declare the bound?) → *Chapter 1*
2. **For each load-bearing claim: did I verify it by an independent route, or does it just sound right?** (Nothing mechanical simulated in my head; predicted outputs before looking; absence-searches verified; every runnable check actually run; reds read honestly.) → *Chapters 0 & 4*
3. **Is every guess labeled as a guess, in the text, with a way to check it?** (Certainty-words worth face value; anything unverifiable-from-here flagged loudly; no early assumption laundered into late ground.) → *Chapter 5*
4. **Did I genuinely try to break this — and can I state the strongest objection I found and how it was answered?** (Diagnosis faced a real rival; hunted disconfirmation; pre-mortem's top failure mode actually checked.) → *Chapter 6*
5. **If the reader stops after my first sentence, do they walk away correct — and if they read on, do the risks reach them ranked, concrete, and impossible to miss?** → *Chapter 7*

Any "no" or "can't say" means the work isn't done, and the failing question names the chapter to reopen in `docs/OPERATING_MANUAL.md`.

## The mistakes that look like competence (each feels like doing the job well)

Thoroughness theater · success theater (reporting done before a check passed) · mentally simulating the mechanical · premature agreement with the requester's diagnosis · uniform effort (risk-blindness with a good reputation) · confidence-as-a-service (smoothing out caveats) · scope creep as generosity · first-story residence · grinding past the stall as "persistence" · the unrelated-failure waiver · guessing on human-sense properties · effort-length coupling · the clarification wall · repetition-laundering · the unattackable mood. Full antidotes in `docs/OPERATING_MANUAL.md`, Chapter 8 — reread it periodically; these regrow.

---

*The Loop is the spine; the five questions are the gate. Run the Loop, spend effort where the risk lives, believe checks over feelings, label the guesses, attack before shipping, land the answer first.*

---

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Generating images — there is a tool, use it

Never tell Benjamin you "can't generate images", and never hand-roll a one-off script.
`OPENAI_API_KEY` is already in `.env`, and `openai` + `sharp` are already dependencies.

```bash
# one image
npm run gen:image -- --prompt "..." --out public/images/learn-games/art/name.webp --width 640

# a batch (preferred — keep jobs in tools/image-jobs/*.json)
npm run gen:image -- --batch tools/image-jobs/arcade-icons.json
```

Tool: `tools/generateImage.mjs` (OpenAI `gpt-image-1` → sharp → .webp). It skips files that
already exist unless you pass `--force` or set `"force": true` on the job.

The Cowork sandbox has **no network access to the OpenAI API**, so *Claude cannot run this itself* —
write the job JSON, then hand Benjamin the one-line `npm run gen:image` command to run on his Mac.

Prompt rules (learned the hard way):
- **Always** include "no text, no letters, no words, no numbers" — otherwise the model bakes in
  garbled lettering (this is how `star-gallery.webp` ended up reading "Fanter").
- Arcade icon house style: glossy 3D-rendered app-icon tile, one hero object centred, rounded-square
  frame, soft rim lighting + ambient colour glow, plasticky claymation render, subtle depth of field.
  Square **640×640**.
- Art direction: realistic cartoon; fantasy / sci-fi / nature only; no rainbow motifs; no faces on
  inanimate objects; not babyish.

## Pushing — agents push when the token is present

Policy (changed 2026-07-28 at Benjamin's request; supersedes "agents cannot push"):
agents SHOULD push a committed batch themselves when a push path exists. The gate
from the manual still applies — push only chained on green checks, never bare.

The one working push path is a repo-scoped token in `.env.local` (gitignored):

    LP_GITHUB_PUSH_TOKEN=<fine-grained GitHub PAT, LiteracyPath only, Contents: read and write>

How to push with it, without the secret ever appearing in a transcript or log —
load it into the shell, then let the shell expand it at run time:

    set -a; . ./.env.local; set +a
    npm run test:unit && npm run lint && npm run build && \
      git push "https://x-access-token:${LP_GITHUB_PUSH_TOKEN}@github.com/benjamesbowler/LiteracyPath.git" HEAD:main

Rules that keep this safe:

- **Where to push from.** Cloud sessions push from their own clone (stage
  `.env.local` from the connected folder to read the token). NEVER attempt to
  push (or fetch) from the device VM — it has no network access.
- **One authority.** When an agent pushes from a clone, the REMOTE becomes the
  authoritative history: do not also commit the same change separately on the
  Mac. End the handover with the sync command for Benjamin instead:
  `git pull --ff-only origin main`.
- **No divergence.** If origin moved since the clone, rebase the batch onto
  `origin/main` and re-run the checks before pushing. Never force-push.
- **Never** paste the token's value into a command line, a file that is
  committed, remote config (`git remote set-url` with the token embedded), or
  the conversation.
- **Fallback unchanged.** No token reachable → commit locally and END the
  handover with the exact push command for Benjamin (`git push origin <branch>`).
  A local post-commit hook prints the same reminder. Never leave a session
  without either pushing or surfacing unpushed work.
