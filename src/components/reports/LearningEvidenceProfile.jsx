import { learningEvidenceResponseSummary } from "../../utils/learningEvidenceInsights.js";

export function LearningEvidenceProfile({ profile, title = "Question coverage and teaching detail" }) {
  if (!profile) return null;
  const totals = profile.totals;
  return (
    <section className="lg-report-assessment-card" aria-label={title}>
      <h3>{title}</h3>
      <p>{profile.summary}</p>
      {totals.presented > 0 && (
        <>
          <p>{totals.distinctItems} distinct recorded {totals.distinctItems === 1 ? "item" : "items"} · {totals.repeatedPresentations} repeat {totals.repeatedPresentations === 1 ? "presentation" : "presentations"}{totals.itemIdentityMissing ? ` · ${totals.itemIdentityMissing} item identities not recorded` : ""}</p>
          <details className="lg-report-technical-details">
            <summary>Targets, recorded responses and teaching moves</summary>
            <div className="lg-report-practice-list">
              {profile.targets.map(row => (
                <article key={row.key}>
                  <strong>{row.label} · {row.constructLabel}</strong>
                  <p>{learningEvidenceResponseSummary(row)}</p>
                  {row.exampleWords?.length > 0 && <p>Saved {row.exampleWords.length === 1 ? "example" : "examples"}: {row.exampleWords.join(", ")}.</p>}
                  <p>Question formats: {row.formatLabels.join(", ") || "Not recorded"}.</p>
                  {row.confusions.map(contrast => (
                    <p key={`${contrast.selected}:${contrast.expected}`}>Selected “{contrast.selected}”; expected “{contrast.expected}” ({contrast.count} {contrast.count === 1 ? "response" : "responses"}).</p>
                  ))}
                  {row.recordedResponses.filter(response => !row.confusions.some(contrast => contrast.selected === response.selected && response.kind === "incorrect")).map(response => (
                    <p key={`${response.kind}:${response.selected}`}>Response: “{response.selected}” ({response.kind === "supported" ? "with support" : "incorrect"}; {response.count} {response.count === 1 ? "response" : "responses"}).</p>
                  ))}
                  <p><strong>Teach next:</strong> {row.nextAction}</p>
                </article>
              ))}
            </div>
          </details>
        </>
      )}
      <small>{profile.claimBoundary}</small>
    </section>
  );
}
