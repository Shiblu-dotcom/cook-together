import { useState, useEffect } from "react";

export default function TimeUp({ onContinue }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2000);
    const t2 = setTimeout(() => setPhase(2), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className="screen-center"
      onClick={() => phase < 2 && setPhase(2)}
      style={{
        minHeight: "100vh",
        background: "var(--bg-deep)",
        textAlign: "center",
        gap: 0,
        cursor: phase < 2 ? "pointer" : "default",
      }}
    >
      <div style={{ position: "relative", zIndex: 2 }}>
        {phase === 0 && (
          <div style={{ animation: "shakeIntense 0.4s ease" }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>⏱️</div>
            <h1
              className="font-display text-gold"
              style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-1px" }}
            >
              STOP.
              <br />
              EVERYTHING.
            </h1>
          </div>
        )}

        {phase >= 1 && (
          <div className="animate-fade-in" style={{ animationFillMode: "forwards" }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>⏱️</div>
            <h1
              className="font-display text-gold"
              style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-1px", marginBottom: 24 }}
            >
              STOP.
              <br />
              EVERYTHING.
            </h1>
            <p style={{ fontSize: 18, color: "var(--text-secondary)", marginBottom: 12 }}>
              Put down the spoons.
            </p>
            <p style={{ fontSize: 18, color: "var(--text-secondary)" }}>
              Step away from the stove.
            </p>
          </div>
        )}

        {phase >= 2 && (
          <div className="animate-fade-in-up" style={{ animationFillMode: "forwards", marginTop: 48 }}>
            <p style={{ fontSize: 22, color: "var(--text-primary)", marginBottom: 40 }}>
              Now let's see what you've made 👀
            </p>
            <button className="btn-primary" onClick={onContinue} style={{ maxWidth: 300, margin: "0 auto" }}>
              We're ready →
            </button>
          </div>
        )}
      </div>

      {/* Flash overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(255,77,77,0.05)",
          animation: "screenFlash 0.8s ease 2",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
