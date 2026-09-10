import { createElement, useEffect, useRef, useState } from 'react';

// Piece pickup and placement uses pointer capture, with tap-select/tap-place and
// native keyboard buttons as equal paths. Only a completed drop applies an answer.
export function usePiecePlacement(onPlace, disabled = false) {
  const [selected, setSelected] = useState(null);
  const [drag, setDrag] = useState(null);
  const [overSlot, setOverSlot] = useState(null);
  const active = useRef(null);
  const onPlaceRef = useRef(onPlace);
  useEffect(() => { onPlaceRef.current = onPlace; }, [onPlace]);
  useEffect(() => {
    if (!disabled) return;
    active.current = null;
    queueMicrotask(() => { setDrag(null); setSelected(null); setOverSlot(null); });
  }, [disabled]);
  const finish = event => {
    const current = active.current;
    if (!current || current.pointerId !== event.pointerId) return;
    active.current = null;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-piece-slot]');
    if (current.moved && target && target.closest('.pp-play') === current.root && !disabled) {
      onPlaceRef.current(current.piece, Number(target.dataset.pieceSlot));
      setSelected(null);
    } else if (!current.moved && !disabled) setSelected(current.piece);
    setDrag(null); setOverSlot(null);
  };
  const pieceProps = piece => ({
    'aria-pressed': selected?.id === piece.id,
    onPointerDown(event) {
      if (disabled) return;
      event.preventDefault();
      setSelected(null);
      event.currentTarget.setPointerCapture(event.pointerId);
      active.current = { piece, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false, root: event.currentTarget.closest('.pp-play') };
    },
    onPointerMove(event) {
      const current = active.current;
      if (!current || current.pointerId !== event.pointerId || disabled) return;
      current.moved ||= Math.hypot(event.clientX - current.startX, event.clientY - current.startY) > 7;
      if (current.moved) {
        setDrag({ piece, x: event.clientX, y: event.clientY });
        const slot = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-piece-slot]');
        setOverSlot(slot?.closest('.pp-play') === current.root ? Number(slot.dataset.pieceSlot) : null);
      }
    },
    onPointerUp: finish,
    onPointerCancel() { active.current = null; setDrag(null); setOverSlot(null); },
    onLostPointerCapture() { if (active.current) { active.current = null; setDrag(null); setOverSlot(null); } },
    onClick(event) { if (event.detail === 0 && !disabled) setSelected(piece); }
  });
  const placeSelected = index => {
    if (!selected || disabled) return;
    onPlaceRef.current(selected, index);
    setSelected(null);
  };
  const ghost = drag ? createElement('div', { className: 'pp-drag-piece', 'aria-hidden': true, style: { left: drag.x, top: drag.y } }, drag.piece.grapheme || drag.piece.label) : null;
  return { selected, setSelected, pieceProps, placeSelected, ghost, overSlot };
}
