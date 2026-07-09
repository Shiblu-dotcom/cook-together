import { useState } from "react";
import { Music, ChevronDown, ChevronUp } from "lucide-react";
import { MUSIC_MOODS } from "../../data/musicMoods";

export default function MusicPlayer({ currentMood, onChangeMood }) {
  const [expanded, setExpanded] = useState(false);
  const mood = MUSIC_MOODS[currentMood] || MUSIC_MOODS.chill;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        zIndex: 30,
        background: "var(--bg-primary)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls="music-player-panel"
        aria-label={`Music mood: ${mood.label}. ${expanded ? "Collapse" : "Expand"} mood picker.`}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: mood.color,
            boxShadow: `0 0 8px ${mood.color}`,
            animation: "pulse 2s ease infinite",
            flexShrink: 0,
          }}
        />
        <Music size={14} color="var(--text-secondary)" aria-hidden="true" />
        <span style={{ fontSize: 13, color: "var(--text-secondary)", flex: 1, textAlign: "left" }}>
          {mood.label}
        </span>
        {expanded ? (
          <ChevronUp size={14} color="var(--text-secondary)" aria-hidden="true" />
        ) : (
          <ChevronDown size={14} color="var(--text-secondary)" aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <div
          id="music-player-panel"
          role="group"
          aria-label="Music mood options"
          style={{ padding: "0 20px 16px", animation: "fadeIn 0.2s ease" }}
        >
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
            {mood.description}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }} role="radiogroup">
            {Object.entries(MUSIC_MOODS).map(([key, m]) => (
              <button
                key={key}
                onClick={() => {
                  onChangeMood(key);
                  setExpanded(false);
                }}
                role="radio"
                aria-checked={currentMood === key}
                className={`chip ${currentMood === key ? "selected" : ""}`}
                style={{ fontSize: 13 }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
