import { useEffect, useRef, useState } from "react";
import {
  WIDE_WORLDS,
  WORLD_LANDMARKS_WIDE,
  DEFAULT_WIDE_MAP_POINTS,
  wideMapPointsFor,
  getCachedWideOverride,
  loadWideMapOverride,
  saveWideMapPoints
} from "../../data/mapStops.js";

function clamp(n) { return Math.max(0, Math.min(100, n)); }
function round1(n) { return Math.round(n * 10) / 10; }

function buildAll(override) {
  const out = {};
  for (const w of WIDE_WORLDS) out[w.id] = wideMapPointsFor(w.id, override).map(([x, y]) => [x, y]);
  return out;
}

// Admin tool: drag each numbered stop to the exact spot on the real map, save,
// and the Skills Quest map uses those positions for everyone.
export function MapStopEditor() {
  const [points, setPoints] = useState(() => buildAll(getCachedWideOverride()));
  const [worldId, setWorldId] = useState(WIDE_WORLDS[0].id);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const dragIdx = useRef(-1);
  const boxRef = useRef(null);

  useEffect(() => {
    let alive = true;
    loadWideMapOverride().then(ov => { if (alive) setPoints(buildAll(ov)); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const world = WIDE_WORLDS.find(w => w.id === worldId) || WIDE_WORLDS[0];
  const worldPoints = points[worldId] || [];
  const labels = WORLD_LANDMARKS_WIDE[worldId] || [];

  function onMove(event) {
    const i = dragIdx.current;
    if (i < 0 || !boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    const x = round1(clamp((event.clientX - r.left) / r.width * 100));
    const y = round1(clamp((event.clientY - r.top) / r.height * 100));
    setPoints(prev => {
      const next = { ...prev };
      const arr = [...(next[worldId] || [])];
      arr[i] = [x, y];
      next[worldId] = arr;
      return next;
    });
  }
  function endDrag() { dragIdx.current = -1; }

  async function save() {
    setSaving(true);
    setStatus("Saving…");
    try {
      await saveWideMapPoints(points);
      setStatus("Saved. The Skills Quest maps now use these positions for everyone.");
    } catch (err) {
      setStatus(String(err?.message).includes("not_authorized")
        ? "Not saved — you need to be an admin."
        : "Could not save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  function resetWorld() {
    setPoints(prev => ({ ...prev, [worldId]: DEFAULT_WIDE_MAP_POINTS[worldId].map(([x, y]) => [x, y]) }));
    setStatus(`${world.name} reset to defaults (not saved yet).`);
  }

  return (
    <section className="report-panel page-stack admin-section admin-section-panel">
      <div className="admin-section-heading">
        <div>
          <h3>Map Stops</h3>
          <p className="muted-text">Drag each numbered stop onto the exact spot on the map, then Save. These positions apply to every student on the wide (laptop/projector) map.</p>
        </div>
      </div>

      <div className="button-row" style={{ gap: 8, flexWrap: "wrap" }}>
        {WIDE_WORLDS.map(w => (
          <button
            key={w.id}
            type="button"
            className={w.id === worldId ? "report-button active" : "report-button"}
            onClick={() => setWorldId(w.id)}
          >
            {w.name}
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
          boxShadow: "0 8px 30px rgba(15,23,42,.25)", lineHeight: 0
        }}
      >
        <img src={world.image} alt={world.name} draggable={false} style={{ width: "100%", height: "auto", display: "block", userSelect: "none" }} />
        {worldPoints.map((p, i) => (
          <button
            key={i}
            type="button"
            title={labels[i] || `Stop ${i + 1}`}
            onPointerDown={event => { dragIdx.current = i; event.currentTarget.setPointerCapture?.(event.pointerId); }}
            style={{
              position: "absolute", left: `${p[0]}%`, top: `${p[1]}%`, transform: "translate(-50%,-50%)",
              width: 34, height: 34, borderRadius: "50%", border: "3px solid #0c6b65",
              background: "#fff", color: "#0f172a", fontWeight: 800, fontSize: 15,
              cursor: "grab", touchAction: "none", boxShadow: "0 2px 8px rgba(0,0,0,.45)",
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
        <button type="button" className="report-button" onClick={resetWorld} disabled={saving}>
          Reset {world.name} to defaults
        </button>
        {status && <span className="muted-text" role="status" aria-live="polite">{status}</span>}
      </div>
      <p className="muted-text" style={{ fontSize: 12 }}>
        Tip: stop 1 is the first cycle in that land, stop 9 the last. Hover a pin to see its landmark name.
      </p>
    </section>
  );
}
