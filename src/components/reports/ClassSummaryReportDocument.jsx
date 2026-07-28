function formatReportDate(value) {
  const date = new Date(value || Date.now());
  if (!Number.isFinite(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function displayAccuracy(value) {
  const numeric = Number(value);
  return value !== null
    && value !== undefined
    && value !== ""
    && Number.isFinite(numeric)
    ? `${Math.round(numeric)}%`
    : "Not enough results";
}

function provenanceValue(rows, field) {
  return rows.find(row => row.field === field)?.value || "";
}

export function ClassSummaryReportDocument({
  model,
  provenanceOptions = {},
  provenanceRows = []
}) {
  const priorities = (model?.focusRows || []).slice(0, 3);
  const groups = (model?.groups || []).slice(0, 3);
  const secureSkills = (model?.masteryRows || []).slice(0, 6);
  const generated = formatReportDate(model?.generatedAt);
  const period = provenanceOptions?.filters?.["Assessment period"]
    || provenanceValue(provenanceRows, "Assessment period")
    || "Selected period";
  const totalStudents = Number(model?.snapshot?.totalStudents || 0);
  const readyStudents = Number(model?.snapshot?.policyReadyStudents || 0);

  return (
    <article
      aria-label={`Class summary for ${model?.className || "selected class"}`}
      className="formal-class-report-document class-summary-report-document"
      data-report-detail="concise"
    >
      <section className="formal-class-report-page class-summary-report-page">
        <div className="formal-class-report-running-header">
          <span>Literacy Guide · Class summary</span>
          <span>{model?.className || "Selected class"} · {period}</span>
        </div>
        <div className="formal-class-report-page-body">
          <header className="formal-class-report-hero">
            <span>Class summary</span>
            <h1>{model?.className || "Selected class"}</h1>
            <p>{model?.teacherName || "Teacher"} · {period} · Generated {generated}</p>
          </header>

          <section className="formal-class-report-section-band">
            <div className="formal-class-report-section-stripe" aria-hidden="true" />
            <div>
              <h3>Quick view</h3>
              <p>Use this one-page summary for planning. Open the separate EL report when a formal assessment record is required.</p>
              <div className="formal-class-report-metrics">
                <article className="formal-class-report-metric teal">
                  <span>Students</span>
                  <strong>{totalStudents}</strong>
                </article>
                <article className="formal-class-report-metric blue">
                  <span>Enough results</span>
                  <strong>{readyStudents} of {totalStudents}</strong>
                </article>
                <article className="formal-class-report-metric green">
                  <span>Class accuracy</span>
                  <strong>{displayAccuracy(model?.snapshot?.averageAccuracy)}</strong>
                </article>
              </div>
            </div>
          </section>

          <div className="class-summary-report-columns">
            <section>
              <h3>Teach next</h3>
              {priorities.length ? (
                <ol>
                  {priorities.map(priority => (
                    <li key={priority.skill}>
                      <strong>{priority.skill}</strong>
                      <span>{displayAccuracy(priority.classAccuracy)}</span>
                      {priority.suggestedAction && <p>{priority.suggestedAction}</p>}
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No shared class priority is ready. More results are needed before making a class-wide judgement.</p>
              )}
            </section>

            <section>
              <h3>Suggested groups</h3>
              {groups.length ? (
                <ul>
                  {groups.map((group, index) => (
                    <li key={`${group.focus}-${index}`}>
                      <strong>{group.focus}</strong>
                      <span>{group.students?.join(", ") || "No students listed"}</span>
                      {group.suggestedActivity && <p>{group.suggestedActivity}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No group is suggested yet. Use individual student reports for student-specific planning.</p>
              )}
            </section>
          </div>

          <section className="class-summary-secure-skills">
            <h3>Secure class skills</h3>
            {secureSkills.length ? (
              <ul>
                {secureSkills.map(row => (
                  <li key={row.skill}>{row.skill}</li>
                ))}
              </ul>
            ) : (
              <p>No class skill has enough results to be marked secure yet.</p>
            )}
          </section>

          <section className="formal-class-report-provenance" aria-label="Report details">
            <h3>How to read this</h3>
            <p>
              “Enough results” means the student has enough recent scored answers
              for a fair summary. Missing or incomplete results are not counted as zero.
            </p>
            <dl>
              <div>
                <dt>Assessment period</dt>
                <dd>{period}</dd>
              </div>
              <div>
                <dt>Generated</dt>
                <dd>{generated}</dd>
              </div>
            </dl>
          </section>
        </div>
        <div className="formal-class-report-running-footer">
          <span>Page 1</span>
          <span>For teacher planning · {model?.className || "Selected class"}</span>
        </div>
      </section>
    </article>
  );
}

export default ClassSummaryReportDocument;
