export function LiteracyMockHeader({ onEnd }) {
  return <header className="literacy-mock-header">
    <h1 data-child-title>Adaptive Literacy Test</h1>
    <span>Reading &amp; language</span>
    {onEnd && <button type="button" className="literacy-mock-exit" onClick={onEnd}>End class test</button>}
  </header>;
}
