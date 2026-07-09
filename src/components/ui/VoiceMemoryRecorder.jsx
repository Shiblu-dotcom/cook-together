import { useEffect, useRef, useState } from "react";
import { Mic, Square, X, Play, Pause } from "lucide-react";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";

/**
 * Modal recorder for capturing a voice-note memory.
 * Calls onCapture({ audio: dataUrl, durationMs }) when the user keeps the clip.
 *
 * The parent should remount this component each open by varying its key — that
 * way per-session state (preview, audio element) never lingers. The component
 * returns null when !open.
 */
export default function VoiceMemoryRecorder({ open, onClose, onCapture }) {
  const { supported, recording, durationMs, error, start, stop, cancel } =
    useVoiceRecorder({ maxDurationMs: 30000 });
  const [preview, setPreview] = useState(null); // { dataUrl, durationMs }
  const [playing, setPlaying] = useState(false);

  // Audio element held outside React state. We keep it inside a useRef
  // box so it survives renders without violating react-hooks/immutability.
  const audioBox = useRef({ current: null });

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Cleanup on unmount.
  useEffect(() => {
    const box = audioBox.current;
    return () => {
      cancel();
      if (box.current) {
        box.current.pause();
        box.current = null;
      }
    };
  }, [cancel]);

  if (!open) return null;

  const handleStart = async () => {
    setPreview(null);
    await start();
  };

  const handleStop = async () => {
    const result = await stop();
    if (result) setPreview(result);
  };

  const handleKeep = () => {
    if (preview) {
      onCapture({ audio: preview.dataUrl, durationMs: preview.durationMs });
    }
    onClose();
  };

  const togglePlay = () => {
    if (!preview) return;
    const box = audioBox.current;
    if (playing) {
      if (box.current) box.current.pause();
      setPlaying(false);
      return;
    }
    if (!box.current) {
      const a = new Audio(preview.dataUrl);
      a.onended = () => setPlaying(false);
      box.current = a;
    }
    box.current.currentTime = 0;
    box.current.play().catch(() => setPlaying(false));
    setPlaying(true);
  };

  const handleReRecord = () => {
    const box = audioBox.current;
    if (box.current) {
      box.current.pause();
      box.current = null;
    }
    setPreview(null);
    setPlaying(false);
  };

  const seconds = (durationMs / 1000).toFixed(1);
  const previewSeconds = preview ? (preview.durationMs / 1000).toFixed(1) : "0.0";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Record a voice memory"
      className="overlay-in"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.95)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close recorder"
        style={{
          position: "absolute",
          top: "max(24px, env(safe-area-inset-top, 0px) + 16px)",
          right: 24,
          background: "rgba(255,255,255,0.1)",
          border: "none",
          borderRadius: "50%",
          width: 40,
          height: 40,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        <X size={18} aria-hidden="true" />
      </button>

      <div className="label" style={{ marginBottom: 12, color: "var(--accent-gold)" }}>
        Voice Memory • +10 pts
      </div>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 28, textAlign: "center", maxWidth: 320 }}>
        Record up to 30 seconds. A quick laugh, an inside joke, or what you're tasting.
      </p>

      {!supported && (
        <p style={{ color: "var(--accent-red)", textAlign: "center", maxWidth: 320 }}>
          Voice recording isn't supported on this browser.
        </p>
      )}
      {error && (
        <p style={{ color: "var(--accent-red)", textAlign: "center", maxWidth: 320, marginBottom: 16 }} role="alert">
          {error}
        </p>
      )}

      {/* Idle */}
      {supported && !recording && !preview && (
        <button
          onClick={handleStart}
          aria-label="Start recording"
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent-gold), var(--accent-orange))",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(245,207,93,0.3)",
          }}
        >
          <Mic size={36} color="#0d0d0d" aria-hidden="true" />
        </button>
      )}

      {/* Recording */}
      {recording && (
        <>
          <button
            onClick={handleStop}
            aria-label="Stop recording"
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ff6b8a, #ff9b6b)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulseRing 1.3s ease infinite",
              boxShadow: "0 8px 32px rgba(255,107,138,0.35)",
            }}
          >
            <Square size={32} color="#0d0d0d" fill="#0d0d0d" aria-hidden="true" />
          </button>
          <p style={{ marginTop: 20, fontSize: 20, fontFamily: "'Playfair Display', serif", color: "var(--accent-gold)" }}>
            {seconds}s
          </p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>Tap to stop</p>
        </>
      )}

      {/* Preview */}
      {preview && !recording && (
        <>
          <button
            onClick={togglePlay}
            aria-label={playing ? "Pause preview" : "Play preview"}
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: "rgba(245,207,93,0.15)",
              border: "2px solid var(--accent-gold)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-gold)",
            }}
          >
            {playing ? <Pause size={32} aria-hidden="true" /> : <Play size={32} aria-hidden="true" />}
          </button>
          <p style={{ marginTop: 16, fontSize: 16, color: "var(--text-secondary)" }}>
            {previewSeconds}s recorded
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 24, width: "100%", maxWidth: 320 }}>
            <button className="btn-secondary" onClick={handleReRecord}>
              Re-record
            </button>
            <button className="btn-primary" onClick={handleKeep}>
              Keep ✓
            </button>
          </div>
        </>
      )}
    </div>
  );
}
