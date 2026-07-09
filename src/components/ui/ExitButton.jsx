import { useState } from "react";
import { X } from "lucide-react";

/**
 * Top-right exit button with a confirmation modal. Use on any screen where
 * losing in-flight state would be a bummer.
 */
export default function ExitButton({ onExit, confirmText = "Quit this session and go back to the start?" }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label="Exit to home"
        title="Exit to home"
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 70,
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 0.15s ease, transform 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--text-primary)";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-secondary)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <X size={18} aria-hidden="true" />
      </button>

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-confirm-title"
          className="overlay-in"
          onClick={() => setConfirming(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card animate-scale-in"
            style={{ maxWidth: 360, textAlign: "center" }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">🚪</div>
            <h3
              id="exit-confirm-title"
              className="font-display"
              style={{ fontSize: 20, marginBottom: 8 }}
            >
              Quit this session?
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.5 }}>
              {confirmText}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn-secondary"
                onClick={() => setConfirming(false)}
                style={{ flex: 1 }}
              >
                Keep cooking
              </button>
              <button
                className="btn-primary"
                onClick={() => { setConfirming(false); onExit(); }}
                style={{ flex: 1 }}
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
