import { useState, useEffect } from "react";
import { Camera, Mic, X } from "lucide-react";
import { useCamera } from "../../hooks/useCamera";
import VoiceMemoryRecorder from "./VoiceMemoryRecorder";

export default function MemoryCapture({ memoriesCount, maxMemories = 5, onCapture }) {
  const [open, setOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceKey, setVoiceKey] = useState(0);
  const [preview, setPreview] = useState(null);
  const [captureError, setCaptureError] = useState(null);
  const { videoRef, error, openCamera, closeCamera, capturePhoto } = useCamera();

  const handleOpen = async () => {
    setOpen(true);
    setPreview(null);
    setCaptureError(null);
    await openCamera();
  };

  const handleClose = () => {
    closeCamera();
    setOpen(false);
    setPreview(null);
    setCaptureError(null);
  };

  const handleCapture = () => {
    const photo = capturePhoto();
    if (photo) {
      setPreview(photo);
      setCaptureError(null);
      closeCamera();
    } else {
      setCaptureError("Couldn't capture that frame. Try again.");
    }
  };

  const handleKeep = () => {
    if (onCapture && preview) {
      onCapture(preview);
    }
    setOpen(false);
    setPreview(null);
  };

  const handleRetake = async () => {
    setPreview(null);
    setCaptureError(null);
    await openCamera();
  };

  // Close on Escape while modal is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canCapture = memoriesCount < maxMemories;

  const handleVoiceOpen = () => {
    setVoiceKey((k) => k + 1);
    setVoiceOpen(true);
  };
  const handleVoiceClose = () => setVoiceOpen(false);
  const handleVoiceCapture = (clip) => {
    if (onCapture) onCapture(clip);
  };

  return (
    <>
      {/* Voice memory button — sits above the camera FAB */}
      {canCapture && (
        <button
          onClick={handleVoiceOpen}
          aria-label="Record a voice memory (+10 pts)"
          title="Record a voice memory"
          style={{
            position: "fixed",
            bottom: "max(88px, env(safe-area-inset-bottom, 0px) + 80px)",
            right: "max(20px, env(safe-area-inset-right, 0px) + 12px)",
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(245,207,93,0.12)",
            border: "1px solid var(--border-subtle)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent-gold)",
            transition: "transform 0.15s ease, background 0.2s ease",
            zIndex: 40,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.background = "rgba(245,207,93,0.18)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "rgba(245,207,93,0.12)"; }}
        >
          <Mic size={18} aria-hidden="true" />
        </button>
      )}

      <VoiceMemoryRecorder
        key={voiceKey}
        open={voiceOpen}
        onClose={handleVoiceClose}
        onCapture={handleVoiceCapture}
      />

      <button
        onClick={canCapture ? handleOpen : undefined}
        disabled={!canCapture}
        aria-label={canCapture ? `Capture a memory (${memoriesCount} of ${maxMemories} used)` : "Max memories reached"}
        title={canCapture ? "Capture a memory (+10 pts)" : "Max memories reached"}
        className={canCapture ? "memory-fab" : ""}
        style={{
          position: "fixed",
          bottom: "max(24px, env(safe-area-inset-bottom, 0px) + 16px)",
          right: "max(20px, env(safe-area-inset-right, 0px) + 12px)",
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: canCapture
            ? "linear-gradient(135deg, var(--accent-gold), var(--accent-orange))"
            : "rgba(255,255,255,0.1)",
          border: "none",
          cursor: canCapture ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: canCapture ? "0 4px 20px rgba(245,207,93,0.3)" : "none",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          zIndex: 40,
        }}
      >
        <Camera size={22} color={canCapture ? "#0d0d0d" : "#666"} aria-hidden="true" />
      </button>

      {memoriesCount > 0 && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            bottom: "max(72px, env(safe-area-inset-bottom, 0px) + 64px)",
            right: "max(20px, env(safe-area-inset-right, 0px) + 12px)",
            background: "var(--accent-gold)",
            color: "#0d0d0d",
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 100,
            zIndex: 41,
            pointerEvents: "none",
          }}
        >
          {memoriesCount}/{maxMemories}
        </div>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Capture a memory"
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
            onClick={handleClose}
            aria-label="Close camera"
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

          <div className="label" style={{ marginBottom: 16, color: "var(--accent-gold)" }}>
            Memory Capture • +10 pts
          </div>

          {error && (
            <p style={{ color: "var(--accent-red)", textAlign: "center", marginBottom: 20, maxWidth: 360 }} role="alert">
              {error}
            </p>
          )}
          {captureError && (
            <p style={{ color: "var(--accent-red)", textAlign: "center", marginBottom: 20, maxWidth: 360 }} role="alert">
              {captureError}
            </p>
          )}

          {preview ? (
            <>
              <img
                src={preview}
                alt="Memory preview"
                style={{ width: "100%", maxWidth: 360, borderRadius: 16, marginBottom: 24 }}
              />
              <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 360 }}>
                <button className="btn-secondary" onClick={handleRetake}>
                  Retake
                </button>
                <button className="btn-primary" onClick={handleKeep}>
                  Keep as Memory ✓
                </button>
              </div>
            </>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                aria-label="Camera preview"
                style={{ width: "100%", maxWidth: 360, borderRadius: 16, marginBottom: 24, background: "#000" }}
              />
              <button
                onClick={handleCapture}
                aria-label="Capture photo"
                disabled={!!error}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "white",
                  border: "4px solid rgba(255,255,255,0.3)",
                  cursor: error ? "not-allowed" : "pointer",
                  opacity: error ? 0.4 : 1,
                  boxShadow: "0 0 0 6px rgba(255,255,255,0.1)",
                  transition: "transform 0.1s ease",
                }}
                onMouseDown={(e) => !error && (e.currentTarget.style.transform = "scale(0.95)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              />
            </>
          )}
        </div>
      )}
    </>
  );
}
