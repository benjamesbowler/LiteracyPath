import { useEffect, useRef, useState } from "react";
import {
  HOLLOW_ROOMS,
  DEFAULT_HOLLOW_SPOTS,
  hollowSpotsFor,
  getCachedHollowOverride,
  loadHollowSpotsOverride,
  saveHollowSpots
} from "../../data/hollowSpots.js";

function clamp(n) { return Math.max(0, Math.min(100, n)); }
function round1(n) { return Math.round(n * 10) / 10; }

function buildAll(override) {
  const out = {};
  for (const room of HOLLOW_ROOMS) out[room.id] = hollowSpotsFor(room.id, override).map(([x, y]) => [x, y]);
  return out;
}

// Admin tool: drag each numbered trophy spot onto the exact shelf/niche in the
// real room art, save, and every child's Hollow uses those positions.
export function HollowSpotEditor() {
  const [spots, setSpots] = useState(() => buildAll(getCachedHollowOverride()));
  const [roomId, setRoomId] = useState(HOLLOW_ROOMS[0].id);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const dragIdx = useRef(-1);
  const boxRef = useRef(null);

  useEffect(() => {
    let alive = true;
    loadHollowSpotsOverride().then(ov => { if (alive) setSpots(buildAll(ov)); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const room = HOLLOW_ROOMS.find(r => r.id === roomId) || HOLLOW_ROOMS[0];
  const roomSpots = spots[roomId] || [];

  function onMove(event) {
    const i = dragIdx.current;
    if (i < 0 || !boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    const x = round1(clamp((event.clientX - r.left) / r.width * 100));
    const y = round1(clamp((event.clientY - r.top) / r.height * 100));
    setSpots(prev => {
      const next = { ...prev };
      const arr = [...(next[roomId] || [])];
      arr[i] = [x, y];
      next[roomId] = arr;
      return next;
    });
  }
  function endDrag() { dragIdx.current = -1; }

  async function save() {
    setSaving(true);
    setStatus("Saving…");
    try {
      await saveHollowSpots(spots);
      setStatus("Saved. Every child's Hollow now uses these spot positions.");
    } catch (err) {
      setStatus(String(err?.message).includes("not_authorized")
        ? "Not saved — you need to be an admin."
        : "Could not save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  function resetRoom() {
    setSpots(prev => ({ ...prev, [roomId]: DEFAULT_HOLLOW_SPOTS[roomId].map(([x, y]) => [x, y]) }));
    setStatus(`${room.name} reset to defaults (not saved yet).`);
  }

  return (
    <section className="report-panel page-stack admin-section admin-section-panel">
      <div className="admin-section-heading">
        <div>
          <h3>Hollow Spots</h3>
          <p className="muted-text">
            Drag each numbered spot onto the exact shelf or niche in the room art, then Save.
            This is where a child&apos;s trophies and decorations sit. Each room has its own art,
            so each room is placed separately.
          </p>
        </div>
      </div>

      <div className="button-row" style={{ gap: 8, flexWrap: "wrap" }}>
        {HOLLOW_ROOMS.map(r => (
          <button
            key={r.id}
            type="button"
            className={r.id === roomId ? "report-button active" : "report-button"}
            onClick={() => setRoomId(r.id)}
          >
            {r.name}
          </button>
        ))}
      </div>

      <div
        ref={boxRef}
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        style={{
          position: "relative", display: "block", width: "min(100%, 960px)",
          margin: "12px 0", borderRadius: 14, overflow: "hidden", touchAction: "none",
          boxShadow: "0 8px 30px rgba(15,23,42,.25)", lineHeight: 0, background: "#101828"
        }}
      >
        <img
          src={room.image}
          alt={room.name}
          draggable={false}
          style={{ width: "100%", height: "auto", display: "block", userSelect: "none" }}
        />
        {roomSpots.map((p, i) => (
          <button
            key={i}
            type="button"
            title={`Spot ${i + 1} — ${p[0]}%, ${p[1]}%`}
            onPointerDown={event => { dragIdx.current = i; event.currentTarget.setPointerCapture?.(event.pointerId); }}
            style={{
              position: "absolute", left: `${p[0]}%`, top: `${p[1]}%`, transform: "translate(-50%,-50%)",
              width: 44, height: 44, borderRadius: 12, border: "3px dashed #ffd84d",
              background: "rgba(12,107,101,.55)", color: "#fff", fontWeight: 800, fontSize: 15,
              cursor: "grab", touchAction: "none", boxShadow: "0 2px 8px rgba(0,0,0,.55)",
              display: "grid", placeItems: "center", padding: 0
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="button-row" style={{ gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="report-button" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save positions"}
        </button>
        <button type="button" className="report-button" onClick={resetRoom} disabled={saving}>
          Reset {room.name} to defaults
        </button>
        {status && <span className="muted-text" role="status" aria-live="polite">{status}</span>}
      </div>

      <p className="muted-text" style={{ fontSize: 12 }}>
        The square marker is roughly the size of a placed item, so what you see is where the
        trophy will sit. Current: {roomSpots.map((p, i) => `${i + 1}: ${p[0]},${p[1]}`).join("  ·  ")}
      </p>
    </section>
  );
}
