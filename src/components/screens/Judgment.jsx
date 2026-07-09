import { useState, useEffect } from "react";

const LOADING_MESSAGES = [
  "The judge is reviewing your crimes against cuisine...",
  "Consulting the culinary gods...",
  "Preparing the verdict...",
  "Tasting the air for signs of greatness...",
  "This is taking longer than expected. That's either very good or very bad.",
  "The judge requires a moment of silence.",
  "Calculating the damage...",
];

export default function Judgment({ isLoading, error, onRetry }) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <div
      className="screen-center bg-deep"
      style={{ minHeight: "100vh", textAlign: "center" }}
      role="status"
      aria-live="polite"
      aria-busy={!!isLoading}
    >
      <div style={{ position: "relative", zIndex: 2, padding: "0 24px" }}>
        {/* Judge silhouette */}
        <div
          aria-hidden="true"
          style={{
            fontSize: 80,
            marginBottom: 32,
            animation: isLoading ? "pulse 1.5s ease infinite" : "none",
            display: "inline-block",
          }}
        >
          👨‍⚖️
        </div>

        {isLoading && (
          <>
            {/* Three breathing dots — quieter than a spinner, reads as
                "the judge is thinking" rather than "the app is loading". */}
            <div aria-hidden="true" style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28 }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--accent-gold)",
                    animation: `pulse 1.4s ease-in-out ${i * 0.22}s infinite`,
                    display: "inline-block",
                  }}
                />
              ))}
            </div>

            <p
              className="font-display"
              key={msgIdx}
              style={{
                fontSize: 18,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                maxWidth: 320,
                margin: "0 auto",
                animation: "fadeIn 0.5s ease",
              }}
            >
              {LOADING_MESSAGES[msgIdx]}
            </p>
          </>
        )}

        {error && (
          <div style={{ textAlign: "center" }} role="alert">
            <p style={{ color: "var(--accent-red)", marginBottom: 8, fontSize: 15 }}>
              The judge had a moment. Try again?
            </p>
            {typeof error === "string" && error.trim() && (
              <p style={{ color: "var(--text-secondary)", marginBottom: 20, fontSize: 12, opacity: 0.7 }}>
                ({error})
              </p>
            )}
            <button className="btn-primary" onClick={onRetry} style={{ maxWidth: 240, margin: "0 auto" }}>
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
