import { useState, useEffect } from "react";
import VoiceControl from "../ui/VoiceControl";
import { useVoice } from "../../hooks/useVoice";
import { sfxWord } from "../../utils/sfx";
import { hapticSuccess } from "../../utils/haptics";

export default function TheWord({ word, onContinue }) {
  const [phase, setPhase] = useState(0); // 0=black, 1=word, 2=subtitle, 3=saved, 4=button
  const { supported, muted, setMuted, speaking, speak, stop } = useVoice();

  useEffect(() => {
    // Timers only ever move the sequence forward — a tap may have already
    // fast-forwarded past them (Math.max keeps late timers from regressing).
    // A slightly longer black beat than feels necessary — the pause is the
    // ceremony. Impatient couples can tap through.
    const timers = [
      setTimeout(() => setPhase((p) => Math.max(p, 1)), 2200),
      setTimeout(() => setPhase((p) => Math.max(p, 2)), 4400),
      setTimeout(() => setPhase((p) => Math.max(p, 3)), 5800),
      setTimeout(() => setPhase((p) => Math.max(p, 4)), 7000),
    ];
    // Warm chord swells as the word fades in.
    const swell = setTimeout(() => {
      sfxWord();
      hapticSuccess();
    }, 2200);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(swell);
    };
  }, []);

  // Impatient? Tapping anywhere skips ahead to the full reveal.
  const handleSkip = () => setPhase((p) => (p < 4 ? 4 : p));

  // Speak the word in sync with phase 1 → "[word]. That's tonight."
  useEffect(() => {
    if (phase !== 1) return;
    if (!supported || muted || !word) return;
    const t = setTimeout(() => speak(`${word}. That's tonight.`, { rate: 0.85, pitch: 1.05 }), 200);
    return () => {
      clearTimeout(t);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, word, supported, muted]);

  return (
    <div
      onClick={handleSkip}
      style={{
        minHeight: "100vh",
        background: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 24px",
        position: "relative",
        cursor: phase < 4 ? "pointer" : "default",
      }}
    >
      <VoiceControl
        supported={supported}
        muted={muted}
        speaking={speaking}
        onToggleMute={setMuted}
      />

      {/* Radial glow that keeps breathing after it arrives — candlelight, not a lamp. */}
      {phase >= 1 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "radial-gradient(ellipse at center, rgba(245,207,93,0.05) 0%, transparent 70%)",
            pointerEvents: "none",
            animation: "fadeIn 2s var(--ease-out) both, glowPulse 7s ease-in-out 2s infinite",
          }}
        />
      )}

      {phase >= 1 && (
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(56px, 20vw, 96px)",
            fontWeight: 900,
            color: "var(--accent-gold)",
            letterSpacing: "0.05em",
            textShadow: "0 0 60px rgba(245,207,93,0.3), 0 0 120px rgba(255,138,61,0.1)",
            animation: "wordReveal 1.4s var(--ease-out) forwards",
            lineHeight: 1,
            marginBottom: 0,
          }}
        >
          {word}
        </h1>
      )}

      {phase >= 2 && (
        <p
          className="font-display"
          style={{
            fontSize: 19,
            fontStyle: "italic",
            color: "rgba(240,234,214,0.55)",
            marginTop: 28,
            letterSpacing: "0.08em",
            animation: "fadeIn 1.2s var(--ease-out) forwards",
          }}
        >
          That's tonight.
        </p>
      )}

      {phase >= 3 && (
        <p
          style={{
            fontSize: 14,
            color: "rgba(240,234,214,0.32)",
            marginTop: 14,
            animation: "fadeIn 1s var(--ease-out) forwards",
          }}
        >
          Yours to keep.
        </p>
      )}

      {phase >= 4 && (
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 48px)",
            maxWidth: 360,
            animation: "fadeInUp 0.7s var(--ease-out) forwards",
          }}
        >
          <button className="btn-primary" onClick={onContinue}>
            Keep tonight →
          </button>
        </div>
      )}
    </div>
  );
}
