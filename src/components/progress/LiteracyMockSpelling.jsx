import { useRef } from 'react';
import { Backspace } from '@phosphor-icons/react';

const letters = [...'abcdefghijklmnopqrstuvwxyz'];

export function LiteracyMockSpelling({ word, onChange, disabled }) {
  const input = useRef(null);
  const range = useRef([word.length, word.length]);
  function rememberRange() {
    if (input.current) range.current = [input.current.selectionStart, input.current.selectionEnd];
  }
  function edit(letter) {
    const [start, end] = range.current.map(index => Math.min(index, word.length));
    const from = !letter && start === end ? Math.max(0, start - 1) : start;
    const updated = word.slice(0, from) + letter + word.slice(end);
    if (updated.length > 64) return;
    onChange(updated);
    const cursor = from + letter.length;
    range.current = [cursor, cursor];
    requestAnimationFrame(() => input.current?.setSelectionRange(cursor, cursor));
  }
  return <div className="literacy-mock-spelling">
    <label>Spell the word
      <input ref={input} type="text" aria-label="Your spelling" autoCapitalize="none" autoComplete="off"
        autoCorrect="off" spellCheck={false} maxLength={64} disabled={disabled} value={word}
        onSelect={rememberRange} onBlur={rememberRange} onChange={event => {
          const text = event.target.value.toLowerCase().replace(/[^a-z]/g, '');
          range.current = [Math.min(event.target.selectionStart, text.length), Math.min(event.target.selectionEnd, text.length)];
          onChange(text);
        }}/>
    </label>
    <div className="literacy-mock-alphabet" role="group" aria-label="Alphabet">
      {letters.map(letter => <button key={letter} type="button" disabled={disabled}
        onMouseDown={event => event.preventDefault()} onClick={() => edit(letter)}>{letter}</button>)}
    </div>
    <button type="button" className="literacy-mock-backspace" disabled={disabled || !word} aria-label="Erase a letter"
      onMouseDown={event => event.preventDefault()} onClick={() => edit('')}><Backspace aria-hidden="true"/></button>
  </div>;
}
