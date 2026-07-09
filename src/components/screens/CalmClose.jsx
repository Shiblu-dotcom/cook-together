import { useState, useEffect } from "react";
import { sfxWord } from "../../utils/sfx";
import { useVoice } from "../../hooks/useVoice";
import VoiceControl from "../ui/VoiceControl";

// The calm night's ending. No result card, no confetti, no sharing —
// repair nights are private by default. The witness notices, the Word
// lands quietly, and the night closes with "that counts."
export default function CalmClose({ witness, word, onGoodnight }) {
  const [stage, setStage] = useState(0); // 0=witness, 1=word, 2=counts, 3=button
  const { supported, muted, setMuted, speaking, speak, stop } = useVoice();

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage((s) => Math.max(s, 1)), 5200),
      setTimeout(() => setStage((s) => Math.max(s, 2)), 7600),
      setTimeout(() => setStage((s) => Math.max(s, 3)), 9000),
    ];
    const swell = setTimeout(sfxWord, 5200);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(swell);
    };
  }, []);

  // The witness is read softly, once. The Word is not spoken — it just is.
  useEffect(() => {
    if (!supported || muted || !witness) return undefined;
    const t = setTimeout(() => speak(witness, { rate: 0.88, pitch: 1.0, volume: 0.85 }), 700);
    return () => {
      clearTimeout(t);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, muted, witness]);

  return (
    <div
      onClick={() => setStage((s) => (s < 3 ? 3 : s))}
      className="calm-scene"
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 28px",
        position: "relative",
        cursor: stage < 3 ? "pointer" : "default",
      }}
    >
      <VoiceControl supported={supported} muted={muted} speaking={speaking} onToggleMute={setMuted} />

      <p
        className="animate-calm-in"
        style={{
          fontSize: 17,
          color: "var(--text-secondary)",
          lineHeight: 1.8,
          maxWidth: 380,
          fontStyle: "italic",
        }}
      >
        {witness}
      </p>

      {stage >= 1 && (
        <h1
          className="font-display animate-word-reveal"
          style={{
            fontSize: 64,
            fontWeight: 600,
            color: "var(--accent-gold)",
            letterSpacing: "-0.01em",
            marginTop: 40,
            lineHeight: 1,
          }}
        >
          {word}
        </h1>
      )}

      {stage >= 2 && (
        <p
          className="animate-calm-in"
          style={{ fontSize: 14, color: "rgba(240,234,214,0.45)", marginTop: 24 }}
        >
          That counts.
        </p>
      )}

      {stage >= 3 && (
        <div
          className="animate-calm-in"
          style={{
            position: "absolute",
            bottom: 48,
            // Inset centering — calmIn's transform would clobber translateX.
            left: 0,
            right: 0,
            margin: "0 auto",
            width: "calc(100% - 56px)",
            maxWidth: 320,
          }}
        >
          <button className="btn-secondary" onClick={onGoodnight}>
            Goodnight →
          </button>
        </div>
      )}
    </div>
  );
}
