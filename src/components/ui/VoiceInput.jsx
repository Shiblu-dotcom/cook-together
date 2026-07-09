import { useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useSpeechInput } from "../../hooks/useSpeechInput";

/**
 * Floating mic-toggle button paired with a text input/textarea.
 *
 * Usage:
 *   <VoiceInput
 *     value={text}
 *     onChange={setText}
 *     append            // if true, dictation appends to existing value; otherwise replaces
 *     compact           // smaller variant
 *   />
 *
 * Renders nothing when the browser doesn't support SpeechRecognition (Firefox
 * etc.), so the underlying form still works.
 */
export default function VoiceInput({
  value,
  onChange,
  append = true,
  compact = false,
  label = "Dictate",
}) {
  const { supported, listening, transcript, error, start, stop } = useSpeechInput();
  const baseRef = useRef("");

  // Snapshot the input value when listening begins so live transcript can be
  // appended without losing what the user already typed.
  useEffect(() => {
    if (listening) {
      baseRef.current = value || "";
    }
  }, [listening, value]);

  useEffect(() => {
    if (!listening) return;
    const next = append
      ? `${baseRef.current}${baseRef.current && transcript ? " " : ""}${transcript}`
      : transcript;
    onChange(next);
  }, [transcript, listening, append, onChange]);

  if (!supported) return null;

  const size = compact ? 28 : 36;
  const icon = listening ? <MicOff size={compact ? 14 : 16} /> : <Mic size={compact ? 14 : 16} />;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <button
        type="button"
        onClick={listening ? stop : start}
        aria-label={listening ? "Stop dictation" : label}
        title={listening ? "Tap to stop" : "Tap to dictate"}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: listening ? "#e05c5c" : "var(--bg-card-strong)",
          border: listening
            ? "1px solid rgba(255,107,138,0.6)"
            : "1px solid var(--border-subtle)",
          color: listening ? "#0d0d0d" : "var(--accent-gold)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.15s ease, background 0.2s ease",
          animation: listening ? "pulseRing 1.3s ease infinite" : "none",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {listening ? <Loader2 size={compact ? 14 : 16} className="spin" /> : icon}
      </button>
      {error && (
        <span style={{ fontSize: 11, color: "var(--accent-red)" }} role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
