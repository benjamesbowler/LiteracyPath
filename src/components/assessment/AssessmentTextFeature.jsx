import '../../styles/assessment-text-feature.css';

export function AssessmentTextFeature({ feature }) {
  return <section className={`assessment-text-feature text-feature-${feature.kind}`} aria-label={feature.title || 'Book page'}>
    <h3>{feature.title}</h3>
    {feature.subtitle && <p>{feature.subtitle}</p>}
    {feature.credits?.map((credit, index) => <p key={index}>{credit.label} {credit.name}</p>)}
    {feature.context && <p>{feature.context}</p>}
    {feature.kind === 'contents' && <table><tbody>{feature.entries.map(entry => <tr key={`${entry.label}:${entry.page}`}><th scope="row">{entry.label}</th><td>{entry.page}</td></tr>)}</tbody></table>}
    {feature.kind === 'glossary' && <dl>{feature.entries.map((entry, index) => <div key={`${entry.term}:${index}`}><dt>{entry.term}</dt><dd>{entry.definition}</dd></div>)}</dl>}
    {feature.author && <p>Written by {feature.author}</p>}
    {feature.illustrator && <p>Pictures by {feature.illustrator}</p>}
    {feature.description && <p>{feature.description}</p>}
  </section>;
}
