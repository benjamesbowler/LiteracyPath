import { ProgressSafeReload } from "./ProgressSafeReload.jsx";

// Full-page fallback shown by the root ErrorBoundary if the app ever throws
// above every in-app boundary. Plain inline styles so it renders even if app
// CSS failed to load.
export function AppCrashFallback({ onRetry }) {
  return (
    <div style={{
      minHeight: "100dvh", display: "grid", placeItems: "center", padding: "24px",
      fontFamily: "Lexend, Inter, system-ui, sans-serif", background: "#F1F5F9", color: "#172033"
    }}>
      <div style={{
        maxWidth: "420px", textAlign: "center", background: "#fff", borderRadius: "16px",
        padding: "32px 28px", boxShadow: "0 4px 24px rgba(15,23,42,.08)"
      }}>
        <h1 style={{ fontSize: "1.4rem", margin: "0 0 8px", color: "#3454C8" }}>We couldn&apos;t open the app</h1>
        <p style={{ margin: "0 0 20px", color: "#51607A" }}>
          Check your connection, then try opening the app again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          style={{
            minHeight: "44px", padding: "10px 22px", border: 0, borderRadius: "12px",
            background: "#3454C8", color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer"
          }}
        >
          Try again
        </button>
        <ProgressSafeReload style={{ marginTop: "12px", minHeight: "44px", padding: "0 16px" }} />
      </div>
    </div>
  );
}
