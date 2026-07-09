import { useState, useEffect, useRef, useCallback } from "react";
import Timer from "../ui/Timer";
import MemoryCapture from "../ui/MemoryCapture";
import { getCalmMoment, getCalmQuestion } from "../../data/calm";
import { sfxChime } from "../../utils/sfx";
import { startAmbient, stopAmbient } from "../../utils/ambient";
import { useVoice } from "../../hooks/useVoice";

// The calm cook. Fully cooperative from the first second: one dish, four
// hands, slow on purpose. No twists, no chaos, no competition UI. One small
// designed instant of contact mid-cook, and one gentle question late — both
// skippable without penalty. Silence counts as success.
export default function CalmCook({ theme, memories, onAddMemory, onDone }) {
  const [paused, setPaused] = useState(false);
  const [moment, setMoment] = useState(null);
  const [question, setQuestion] = useState(null);
  const [phase, setPhase] = useState("cooking"); // cooking | naming
  const [dishName, setDishName] = useState("");
  const momentRef = useRef(getCalmMoment());
  const questionRef = useRef(getCalmQuestion());
  const voice = useVoice();

  // Soft pads the whole way — romantic register, never hype.
  useEffect(() => {
    if (!voice.muted) startAmbient("romantic");
    return () => stopAmbient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape closes whichever soft overlay is up.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setMoment(null);
      setQuestion(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The one instant of contact — around the 8-minute mark, reusing the
  // Timer's coop trigger (9:00 crossing) so resume logic keeps working.
  const handleMomentTime = useCallback(() => {
    setMoment(momentRef.current);
    sfxChime();
  }, []);

  // The one question — late, after the cooking has softened the room.
  // Shown silently (no TTS): it's read, maybe asked out loud, maybe not.
  const handleQuestionTime = useCallback(() => {
    setQuestion(questionRef.current);
    sfxChime();
  }, []);

  const handleTimeUp = useCallback(() => {
    setMoment(null);
    setQuestion(null);
    setPhase("naming");
  }, []);

  return (
    <div
      className="bg-deep calm-scene"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px 100px",
          width: "100%",
          maxWidth: 440,
          textAlign: "center",
        }}
      >
        {phase === "cooking" && (
          <>
            <div className="calm-flame" aria-hidden="true" style={{ fontSize: 34, marginBottom: 14 }}>
              🕯️
            </div>
            <div
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                marginBottom: 36,
              }}
            >
              {theme || "Something warm"} — one dish, together
            </div>

            {/* Soft clock — tap to pause, same as always. No urgency, ever. */}
            <div
              role="button"
              tabIndex={0}
              aria-pressed={paused}
              aria-label={paused ? "Resume" : "Pause"}
              onClick={() => setPaused((p) => !p)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPaused((p) => !p);
                }
              }}
              style={{ position: "relative", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 320,
                  height: 320,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(245,207,93,0.10) 0%, transparent 65%)",
                  filter: "blur(8px)",
                  animation: paused ? "none" : "calmBreathe 7s ease-in-out infinite",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                }}
              />
              <Timer
                calm
                paused={paused}
                onCoopTime={handleMomentTime}
                onTwistTime={handleQuestionTime}
                onTimeUp={handleTimeUp}
              />
            </div>

            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 22, lineHeight: 1.6 }}>
              {paused ? "Paused. No hurry at all." : "Shoulder to shoulder counts as talking."}
            </p>
          </>
        )}

        {/* The gentle close of the cook — naming is optional, photo optional */}
        {phase === "naming" && (
          <div className="animate-calm-in" style={{ width: "100%" }}>
            <div className="calm-flame" aria-hidden="true" style={{ fontSize: 40, marginBottom: 18 }}>
              🕯️
            </div>
            <h2 className="font-display" style={{ fontSize: 26, marginBottom: 10 }}>
              Come look at what you made
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 28, lineHeight: 1.6 }}>
              Name it if you like. Or don't — it still counts.
            </p>
            <input
              className="input-field"
              placeholder="A name for it (optional)"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              maxLength={60}
              style={{ marginBottom: 20, textAlign: "center" }}
            />
            <button className="btn-primary" onClick={() => onDone({ dishName: dishName.trim() })}>
              We made it →
            </button>
          </div>
        )}
      </div>

      {/* The one instant of contact — soft overlay, tap to close */}
      {moment && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setMoment(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 24,
            cursor: "pointer",
          }}
        >
          <div className="card animate-calm-in" style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{ fontSize: 40, marginBottom: 14 }} aria-hidden="true">🤲</div>
            <p className="font-display" style={{ fontSize: 20, lineHeight: 1.5, marginBottom: 14 }}>
              {moment}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Tap when you're done — or just keep cooking</p>
          </div>
        </div>
      )}

      {/* The one question — a door, not a demand */}
      {question && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setQuestion(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 24,
            cursor: "pointer",
          }}
        >
          <div className="card animate-calm-in" style={{ textAlign: "center", maxWidth: 360 }}>
            <p className="font-display" style={{ fontSize: 20, lineHeight: 1.6, marginBottom: 16 }}>
              {question}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Ask it out loud if you like — or just keep cooking. Both are right.
            </p>
          </div>
        </div>
      )}

      {/* One camera, nothing else competing for attention */}
      <MemoryCapture memoriesCount={memories?.length || 0} maxMemories={5} onCapture={onAddMemory} />
    </div>
  );
}
