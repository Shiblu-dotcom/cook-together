import { Volume2, VolumeX } from "lucide-react";

/**
 * A small floating control to toggle the AI judge voice on/off.
 * Renders nothing if speech synthesis isn't supported.
 */
export default function VoiceControl({
  muted,
  speaking,
  supported,
  onToggleMute,
  position = "top-left",
}) {
  if (!supported) return null;

  const posStyle =
    position === "top-left"
      ? { top: 16, left: 16 }
      : position === "top-right"
      ? { top: 16, right: 16 }
      : { bottom: 16, left: 16 };

  const Icon = muted ? VolumeX : Volume2;
  const label = muted ? "Voice off — tap to enable" : "Voice on — tap to mute";

  return (
    <button
      type="button"
      onClick={() => onToggleMute(!muted)}
      aria-label={label}
      title={label}
      style={{
        position: "fixed",
        zIndex: 70,
        ...posStyle,
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: muted
          ? "rgba(0,0,0,0.55)"
          : speaking
          ? "rgba(245,207,93,0.18)"
          : "rgba(0,0,0,0.55)",
        border: "1px solid var(--border-subtle)",
        color: muted ? "var(--text-secondary)" : "var(--accent-gold)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(10px)",
        transition: "background 0.2s ease, color 0.2s ease, transform 0.15s ease",
        animation: speaking && !muted ? "pulseRing 1.5s ease infinite" : "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
