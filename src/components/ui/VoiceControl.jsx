import { useState } from "react";
import { Volume2, VolumeX, AudioLines, Check } from "lucide-react";

/**
 * Floating voice controls: mute toggle, plus (when the voice-picker props
 * are provided) a picker that lists the device's best voices — tapping one
 * previews it and makes it the app-wide narrator.
 *
 * Backward compatible: without `voices`/`onSelectVoice`, renders just the
 * mute button exactly as before.
 */
export default function VoiceControl({
  muted,
  speaking,
  supported,
  onToggleMute,
  position = "top-left",
  voices = [],
  voiceName = null,
  onSelectVoice = null,
  onPreview = null,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  if (!supported) return null;

  const posStyle =
    position === "top-left"
      ? { top: 16, left: 16 }
      : position === "top-right"
      ? { top: 16, right: 16 }
      : { bottom: 16, left: 16 };

  const Icon = muted ? VolumeX : Volume2;
  const label = muted ? "Voice off — tap to enable" : "Voice on — tap to mute";
  const showPicker = voices.length > 1 && onSelectVoice;

  const buttonStyle = {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.55)",
    border: "1px solid var(--border-subtle)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(10px)",
    transition: "background 0.2s ease, color 0.2s ease, transform 0.15s ease",
  };

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 70,
        ...posStyle,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "flex-start",
      }}
    >
      <button
        type="button"
        onClick={() => onToggleMute(!muted)}
        aria-label={label}
        title={label}
        style={{
          ...buttonStyle,
          background: !muted && speaking ? "rgba(245,207,93,0.18)" : "rgba(0,0,0,0.55)",
          color: muted ? "var(--text-secondary)" : "var(--accent-gold)",
          animation: speaking && !muted ? "pulseRing 1.5s ease infinite" : "none",
        }}
      >
        <Icon size={18} aria-hidden="true" />
      </button>

      {showPicker && !muted && (
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          aria-label="Choose a voice"
          aria-expanded={pickerOpen}
          title="Choose a voice"
          style={{
            ...buttonStyle,
            width: 34,
            height: 34,
            color: pickerOpen ? "var(--accent-gold)" : "var(--text-secondary)",
          }}
        >
          <AudioLines size={15} aria-hidden="true" />
        </button>
      )}

      {pickerOpen && showPicker && (
        <div
          role="listbox"
          aria-label="Available voices"
          style={{
            background: "rgba(13,13,13,0.95)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 14,
            padding: 8,
            backdropFilter: "blur(14px)",
            maxWidth: 240,
            maxHeight: "50vh",
            overflowY: "auto",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            animation: "scaleIn 0.15s ease forwards",
          }}
        >
          <p style={{ fontSize: 11, color: "var(--text-secondary)", padding: "4px 8px 8px" }}>
            Tap to hear &amp; choose
          </p>
          {voices.map((name) => {
            const active = name === voiceName;
            // Voice names are verbose ("Microsoft Aria Online (Natural) -
            // English (United States)") — show the human part only.
            const shortName = name
              .replace(/\s*[-–—]\s*English.*$/i, "")
              .replace(/^(Microsoft|Google)\s+/i, "")
              .replace(/\s*\(.*\)\s*$/, "")
              .trim() || name;
            return (
              <button
                key={name}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onSelectVoice(name);
                  if (onPreview) onPreview(name);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  textAlign: "left",
                  background: active ? "rgba(245,207,93,0.12)" : "transparent",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                  color: active ? "var(--accent-gold)" : "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                {active ? <Check size={13} aria-hidden="true" /> : <span style={{ width: 13 }} />}
                {shortName}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
