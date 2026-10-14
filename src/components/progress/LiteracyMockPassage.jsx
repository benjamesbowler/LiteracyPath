import { useEffect, useRef, useState } from 'react';

/** Keep the complete authored text readable while answer controls stay in view. */
export function LiteracyMockPassage({ text }) {
  const body = useRef(null);
  const measure = useRef(null);
  const [pages, setPages] = useState([text]);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    let active = true;
    const fit = () => {
      if (!active || !body.current || !measure.current) return;
      const height = body.current.clientHeight;
      if (height < 44) return;
      const words = text.match(/\S+\s*/g) || [text];
      const next = [];
      let offset = 0;
      while (offset < words.length) {
        let low = 1, high = words.length - offset, count = 1;
        while (low <= high) {
          const middle = Math.floor((low + high) / 2);
          measure.current.textContent = words.slice(offset, offset + middle).join('');
          if (measure.current.getBoundingClientRect().height <= height + 1) { count = middle; low = middle + 1; }
          else high = middle - 1;
        }
        next.push(words.slice(offset, offset + count).join(''));
        offset += count;
      }
      setPages(previous => previous.length === next.length && previous.every((value, i) => value === next[i]) ? previous : next);
      setIndex(previous => Math.min(previous, next.length - 1));
    };
    const observer = new ResizeObserver(fit);
    observer.observe(body.current);
    void document.fonts?.ready.then(fit);
    fit();
    return () => { active = false; observer.disconnect(); };
  }, [text]);
  return <>
    <div className="literacy-mock-passage-body" ref={body}>
      <p className="literacy-mock-passage">{pages[index]}</p>
      <p className="literacy-mock-passage-measure" aria-hidden="true" ref={measure}/>
    </div>
    <nav className="literacy-mock-passage-parts" aria-label="Passage parts">
      {pages.length > 1 ? <>
        <button type="button" disabled={index === 0} onClick={() => setIndex(value => value - 1)}>Previous part</button>
        <span role="status">Part {index + 1} of {pages.length}</span>
        <button type="button" disabled={index === pages.length - 1} onClick={() => setIndex(value => value + 1)}>Read next part</button>
      </> : <span>Read the box, then choose your answer.</span>}
    </nav>
  </>;
}
