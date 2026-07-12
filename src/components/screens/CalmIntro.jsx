import { useState } from "react";
import Mark from "../ui/Mark";

// The calm night's front door. Deliberate, private, zero drama — warm plain
// words, no therapy-speak. Both partners opt in together; nobody is ambushed.
// The check-in is one soft optional tap, and skipping is a first-class path.
export default function CalmIntro({ onStart, onBack }) {
  const [mood, setMood] = useState(null); // null | 'day' | 'us' — optional, never required

  return (
    <div className="screen-center bg-deep calm-scene" style={{ textAlign: "center" }}>
      <div style={{ width: "100%", maxWidth: 380, padding: "0 20px" }} className="animate-calm-in">
        <div className="calm-flame" aria-hidden="true" style={{ marginBottom: 24 }}>
          <Mark variant="flame" size={60} color="#E8703A" />
        </div>

        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 700, marginBottom: 12 }}>
          A calm night
        </h1>

        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 28 }}>
          One dish, made together. No scores, no winner, no rush.
          Cooking next to each other is the whole game tonight.
        </p>

        {/* One soft thing, fine to skip. Only ever bends things gentler. */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>
            If you want to say — no pressure:
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              className={`chip ${mood === "day" ? "selected" : ""}`}
              onClick={() => setMood(mood === "day" ? null : "day")}
            >
              Rough day
            </button>
            <button
              className={`chip ${mood === "us" ? "selected" : ""}`}
              onClick={() => setMood(mood === "us" ? null : "us")}
            >
              Rough us
            </button>
          </div>
        </div>

        <button className="btn-primary" onClick={() => onStart({ calmMood: mood })}>
          We're both in
        </button>

        <button className="btn-ghost" onClick={onBack} style={{ marginTop: 14, width: "100%" }}>
          Not tonight — and that's fine
        </button>
      </div>
    </div>
  );
}
