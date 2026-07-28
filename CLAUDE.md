# ⚑ READ FIRST — the Operating Manual governs all work here

Before doing ANY work in this repo, operate by the **LiteracyPath Operating Manual**. The full distillation is in **`AGENTS.md`** (read it); the canonical deep text is **`docs/OPERATING_MANUAL.md`** and a condensed version is **`docs/OPERATING_MANUAL_quickref.md`**. This is how work is done here — not optional.

The non-negotiables, applied on every task:

- **Cardinal rule:** never claim success without a passing check you can name. "Done" = a named check ran and came back green. No "should work."
- **The Loop:** inspect the real state → name the root-cause *mechanism* (not "somehow") → smallest correct fix → run ALL checks → read results honestly (a red check is yours until you prove it pre-existed) → loop back to *inspect*, not to another guess → exit only on green, stating exactly what green means. A stall (2–3 iterations, no new info) means your map is wrong upstream — widen inspection.
- **Effort where the risk lives** (probability × cost); irreversible actions (delete/overwrite/send/publish/migrate/force-push) get a mandatory stop — verify the target against reality, prefer the reversible variant. Confidence never waives the gate.
- **Verify by re-deriving, not recognizing:** run it (never mentally simulate what a machine will do for free), re-read the actual source, predict output before looking, verify a search can find things before trusting an empty result.
- **Label known vs guessed in the text:** observed / derived / inferred, inline, with how to check. Reserve "verified/is/confirmed" for what you saw. Flag anything unverifiable-from-here loudly with the shortest path for whoever can check it (this project's owner is non-technical — hand over copy-paste-ready commands and rendered previews, never "should look right").
- **Attack your own conclusion before shipping** (strongest objection, disconfirming test, rival explanation, pre-mortem), then land the answer first: **answer → reasoning → risk**, first sentence correct if read alone, bad news earliest, irreversible handoffs gated (`… && git push`).

Run the **5-question self-test** (in `AGENTS.md`) before sending any answer. Any "no" → the work isn't done.

## Documentation: start at `docs/INDEX.md`

`docs/` holds ~460 files and 1.66M words. **Always enter through `docs/INDEX.md`** — it
separates **standards** (how things must be; edited in place; still true) from
**records** (what happened on a date; never edited again), and tracks which audits have
been **superseded**. When a record and a standard disagree, the standard wins.

Check the index before acting on anything you found in `docs/`, and update it in the same
change when your work alters how the product behaves. See `AGENTS.md` for the full rule.

Everything below (graphify, and the repo's live-push/human-check conventions) are *applications* of the manual.

---

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Pushing

Agents SHOULD push a committed batch themselves when the push token is present
(policy changed 2026-07-28 at Benjamin's request). The mechanism, the safety
rules, and the no-token fallback live in **`AGENTS.md` → "Pushing — agents push
when the token is present"**: in short, read `LP_GITHUB_PUSH_TOKEN` from the
gitignored `.env.local`, push from the session's clone chained on green checks,
never from the device VM, never force, never exposing the token; with no token
reachable, commit locally and END the handover with the exact push command for
Benjamin (`git push origin <branch>`). A local post-commit hook prints the same
reminder. Never leave a session without either pushing or surfacing unpushed
work.
