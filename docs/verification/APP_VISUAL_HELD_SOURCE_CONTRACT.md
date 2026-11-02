# App visual retained-source dispositions

`approved` means that the current image bytes received the required direct
visual review. `held-source` does not approve pixels. It preserves an exact
original that remains an authoring, quarantine, or historical input while
proving that current learner consumers cannot display that original. An exact
historical administrative QA thumbnail may still display its original evidence;
that separate purpose is recorded and never becomes child artwork approval.

The source inventory remains complete: held sources are counted and hashed,
not excluded. Unknown sources and unknown disposition kinds fail closed.

`tools/manifests/app-visual-held-sources.json` contains:

```json
{
  "schemaVersion": 1,
  "assets": [
    {
      "id": "held-example",
      "path": "/guided-reading/pages/gr-a-26-page-1.webp",
      "sha256": "exact current 64-character SHA-256",
      "kind": "guided-reading-unpublished-source",
      "bookId": "gr-a-26",
      "role": "page",
      "pageIndex": 0
    }
  ],
  "proof": "complete current evaluator output object"
}
```

The matching visual record has `status: "held-source"`, the same path/hash,
and `sourceDispositionId` equal to the asset ID. The scope retains total
`imageCount`, plus separate `heldSourceCount` and
`directlyReviewedImageCount` counts. A held original must never be described
as clean artwork or as a regenerated image.

Only these bounded kinds are supported:

| Kind | Exact source boundary | Required current evidence |
| --- | --- | --- |
| `guided-reading-unpublished-source` | The 23 named Pack 8 original books, 161 cover/page images | Exact raw book and every page remain inactive, need regeneration, and retain their authoring reasons. No original slot appears in the current reader or discovery index. Page role uses a zero-based `pageIndex`; covers use `role: "cover"`. |
| `unselected-legacy-word-source` | The 15 aliases enumerated in the validator | No learner binding in the complete current finite consumer bounds, retention, or any of the 15 accepted MAP history branches. Existing private eligibility rules remain sealed in the proof. The current V2 `ton` cue is excluded and uses its normal approved-art contract. |
| `unreachable-legacy-author-source` | The nine avatar/material/biome inputs enumerated in the validator | Their specific authoring modules remain absent from a fresh complete main import graph; only their exact known source/review roles can refer to them. |
| `historical-assessment-review-source` | The 271 exact historical paths and 962 QA pairings in `app-visual-historical-review-sources.json` | The exact merged administrative QA row identities, status, targets and image bytes remain unchanged. No QA question ID or image is selected in all 78 actual current/formal, retention, accepted MAP history, current/saved practice and classroom-reference domains. |
| `unselected-reviewed-assessment-source` | The two exact fan/pink variant paths in that same source cohort | No QA pairing or learner selection; exact existing raw/composite source-decision hashes remain present and unaltered. This preserves prior evidence without granting a new pixel approval. |

The historical cohort pins the administrative caller, merge behavior, QA data,
source-decision authorities and exact literal-source roles. The evaluator
recomputes every eligible question domain from current modules. Only an exact
`Admin Media QA actual all-row thumbnail selector` binding matching the current
merged review ID and image path may receive the administrative purpose. Only
the two pinned source variants may receive the exact source-decision purpose.
Every other finite binding remains a learner reachability guard. Those
administrative and source records still prevent deletion; this classification
does not waive the retirement gate or discard review evidence.

Clean regenerated books may reuse an original book ID. The disposition binds
the held original cover and page paths, their raw hold metadata, and every
current public reader/index image binding. It does not hide a current book
merely because its ID once belonged to Pack 8.

An unread metadata field is insufficient evidence of inactivity. In
particular, Chompy's old `pose-ready.webp` is dynamically selected by actual
Present documents and cannot receive a held-source disposition. The inventory
and proof enumerate all actual offered Present documents, including their
computed character paths. The rounded campaign landscape loader is also
enumerated for the relevant legacy author-art namespace.

After final consumer changes and exact visual records are written, run:

```sh
node tools/auditAppVisualHeldSources.mjs --registry=path/to/candidate.json --output=path/to/proof.json
node tools/checkAppVisualReview.mjs
```

Review the fresh evaluator output before binding it to the checked-in
registry. It must have zero errors. It seals current source/tool bytes,
complete main graph and unresolved-import checks, exact current reader and
discovery-index bindings, current dynamic loader outputs, finite lexical
coverage, accepted history, exact image hashes, and source roles. Source/tool
changes during evaluation fail. The gate reruns the evaluator and requires an
exact current proof match.

Do not automatically refresh a stale proof. Review the changed consumers and
any added dynamic loader domains first. This contract is not a general unused
file exception, a deletion authorization, a quarantine transfer, or proof of
hosted/device/classroom behavior. A newly selected or published original
fails the contract and needs its normal production remedy.
