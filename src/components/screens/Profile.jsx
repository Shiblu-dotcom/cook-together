import { useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import BadgeDisplay from "../ui/BadgeDisplay";
import { BADGES } from "../../data/badges";
import { downloadCard } from "../../utils/shareCard";

export default function Profile({ profile, onBack }) {
  const [displayMode, setDisplayMode] = useState(profile?.displayMode || "words");

  if (!profile) {
    return (
      <div className="screen-center bg-mesh" style={{ textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>No profile yet. Play your first game!</p>
        <button className="btn-ghost" onClick={onBack} style={{ marginTop: 20 }}>
          ← Back
        </button>
      </div>
    );
  }

  const badgeObjects = (profile.badges || [])
    .map((id) => BADGES.find((b) => b.id === id))
    .filter(Boolean);

  const wordCollection = profile.wordCollection || [];
  const compatibilityHistory = profile.compatibilityHistory || [];
  const themes = profile.themes || [];
  const memories = profile.memories || [];

  return (
    <div className="screen bg-mesh" style={{ paddingTop: 56, paddingBottom: 40 }}>
      {/* Header bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          zIndex: 20,
          background: "rgba(13,13,13,0.9)",
          backdropFilter: "blur(10px)",
          padding: "14px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={onBack}
          aria-label="Back to welcome screen"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 4, display: "flex", alignItems: "center" }}
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <span className="font-display" style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
          {profile.p1Name} & {profile.p2Name}
        </span>
        <span style={{ fontSize: 13, color: "var(--text-secondary)", marginLeft: "auto" }}>
          {profile.gamesPlayed || 0} night{(profile.gamesPlayed || 0) !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ width: "100%", maxWidth: 440, padding: "0 20px" }}>
        {/* Stats row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { label: profile.p1Name, value: profile.totalP1Points || 0, color: "var(--accent-gold)" },
            { label: profile.p2Name, value: profile.totalP2Points || 0, color: "var(--accent-orange)" },
          ].map((s) => (
            <div
              key={s.label}
              className="card-sm"
              style={{ flex: 1, textAlign: "center" }}
            >
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>{s.label}</div>
              <div
                className="font-display"
                style={{ fontSize: 28, fontWeight: 700, color: s.color }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>points</div>
            </div>
          ))}
        </div>

        {/* Couple title */}
        {profile.coupleTitle && (
          <div className="card-sm" style={{ textAlign: "center", marginBottom: 20 }}>
            <div className="label" style={{ marginBottom: 6, color: "var(--accent-gold)" }}>You Are</div>
            <p className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>{profile.coupleTitle}</p>
          </div>
        )}

        {/* Toggle */}
        <div style={{ display: "flex", gap: 0, marginBottom: 20, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4 }}>
          {["words", "scores"].map((mode) => (
            <button
              key={mode}
              onClick={() => setDisplayMode(mode)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                background: displayMode === mode ? "rgba(245,207,93,0.1)" : "transparent",
                color: displayMode === mode ? "var(--accent-gold)" : "var(--text-secondary)",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                transition: "all 0.15s ease",
              }}
            >
              {mode === "words" ? "Word Collection" : "Score History"}
            </button>
          ))}
        </div>

        {/* Word collection */}
        {displayMode === "words" && (
          <div>
            {wordCollection.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "32px 0" }}>
                No words yet. Play your first game!
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                {[...wordCollection].reverse().map((entry, i) => (
                  <div
                    key={i}
                    className="card-sm"
                    style={{ textAlign: "center" }}
                  >
                    <div
                      className="font-display text-gold"
                      style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}
                    >
                      {entry.word}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{entry.date}</div>
                    {entry.theme && (
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2, opacity: 0.6 }}>
                        {entry.theme}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Score history */}
        {displayMode === "scores" && (
          <div style={{ marginBottom: 24 }}>
            {compatibilityHistory.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "32px 0" }}>
                No history yet.
              </p>
            ) : (
              <>
                <div className="label" style={{ marginBottom: 12 }}>Compatibility Over Time</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100, marginBottom: 24 }}>
                  {compatibilityHistory.map((score, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div
                        style={{
                          width: "100%",
                          height: `${Math.max(0, Math.min(100, score))}%`,
                          background: "linear-gradient(0deg, var(--accent-gold), var(--accent-orange))",
                          borderRadius: "4px 4px 0 0",
                          minHeight: 4,
                          transition: "height 0.5s ease",
                        }}
                        title={`Game ${i + 1}: ${score}%`}
                      />
                      <div style={{ fontSize: 9, color: "var(--text-secondary)" }}>G{i + 1}</div>
                    </div>
                  ))}
                </div>

                {themes.length > 0 && (
                  <>
                    <div className="label" style={{ marginBottom: 12 }}>Themes Played</div>
                    {themes.map((theme, i) => (
                      <div
                        key={i}
                        className="card-sm"
                        style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{theme || `Game ${i + 1}`}</span>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Memory wall */}
        {memories.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 12 }}>Memory Wall</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {memories.slice(-12).map((m, i) => (
                <img
                  key={i}
                  src={m.photo}
                  alt={`Captured memory ${i + 1}`}
                  loading="lazy"
                  style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {badgeObjects.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 12 }}>Badges</div>
            <BadgeDisplay badges={badgeObjects} size="md" />
          </div>
        )}

        {/* Your Story — the memory-machine payoff: everything the nights
            added up to, as one downloadable keepsake card. */}
        {wordCollection.length > 0 && (
          <div>
            <div className="label" style={{ marginBottom: 12 }}>Your Story</div>
            <div
              id="story-card"
              style={{
                background: "linear-gradient(160deg, #1d0d28 0%, #120912 60%, #1a0f14 100%)",
                border: "1px solid var(--border-strong)",
                borderRadius: 24,
                padding: "32px 28px",
                textAlign: "center",
              }}
            >
              <p
                className="font-display"
                style={{ fontSize: 13, color: "var(--text-secondary)", letterSpacing: "0.08em", marginBottom: 6 }}
              >
                Cook Together
              </p>
              <h3 className="font-display text-gold" style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>
                {profile.p1Name} &amp; {profile.p2Name}
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 20 }}>
                {profile.gamesPlayed} night{profile.gamesPlayed !== 1 ? "s" : ""} together
                {compatibilityHistory.length > 0 &&
                  ` · ${Math.round(compatibilityHistory.reduce((a, b) => a + b, 0) / compatibilityHistory.length)}% compatible`}
              </p>

              {/* The words, oldest to newest — the emotional map */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 20 }}>
                {wordCollection.map((entry, i) => (
                  <span
                    key={i}
                    className="font-display"
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--accent-gold)",
                      background: "rgba(245,207,93,0.08)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 100,
                      padding: "6px 16px",
                    }}
                  >
                    {entry.word}
                  </span>
                ))}
              </div>

              {profile.coupleTitle && (
                <p style={{ fontSize: 13, color: "var(--text-secondary)", fontStyle: "italic" }}>
                  {profile.coupleTitle}
                </p>
              )}
            </div>

            <button
              className="btn-secondary"
              onClick={() => downloadCard("story-card", `cook-together-story.png`)}
              style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <Download size={16} aria-hidden="true" /> Download your story
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
