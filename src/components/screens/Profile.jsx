import { useState } from "react";
import { ArrowLeft, Download, Flame } from "lucide-react";
import Mark from "../ui/Mark";
import { getCrashLog } from "../../utils/crashlog";
import BadgeDisplay from "../ui/BadgeDisplay";
import { BADGES } from "../../data/badges";
import { downloadCard } from "../../utils/shareCard";

export default function Profile({ profile, onBack }) {
  const [displayMode, setDisplayMode] = useState(profile?.displayMode || "words");
  const [confirmReset, setConfirmReset] = useState(false);

  const handleStartFresh = () => {
    // Wipe everything this couple accumulated — profile, any in-flight
    // session, and the question-rotation memory.
    try {
      localStorage.removeItem("cook_together_profile");
      localStorage.removeItem("cook_together_session");
      localStorage.removeItem("cook_together_phase");
      localStorage.removeItem("cook_together_used_questions");
    } catch {
      /* ignore */
    }
    onBack();
  };

  if (!profile) {
    return (
      <div className="screen-center bg-mesh" style={{ textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>No profile yet — your first night starts one.</p>
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
        {/* Stats row — couple stats, not a leaderboard. Since the one-plate
            change both partners always banked identical points, so per-person
            totals were dead weight. What actually accumulates: nights, words. */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { label: "nights", value: profile.gamesPlayed || 0 },
            { label: "words", value: (profile.wordCollection || []).length },
            { label: "badges", value: (profile.badges || []).length },
          ].map((s) => (
            <div
              key={s.label}
              className="card-sm"
              style={{ flex: 1, textAlign: "center", padding: "16px 12px" }}
            >
              <div
                className="font-display"
                style={{ fontSize: 28, fontWeight: 600, color: "var(--text-primary)" }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>{s.label}</div>
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
                fontFamily: "'Inter', sans-serif",
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
          <div className="animate-step-in">
            {wordCollection.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "32px 0" }}>
                Your words will collect here — one per night.
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
                      {/* Calm nights get a small flame — a quiet marker, no label */}
                      {entry.calm && (
                        <Flame size={12} aria-label="A calm night" style={{ marginLeft: 6, opacity: 0.7, verticalAlign: "-1px" }} />
                      )}
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
          <div className="animate-step-in" style={{ marginBottom: 24 }}>
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
                background: "var(--bg-card)",
                border: "1px solid var(--border-strong)",
                borderRadius: 24,
                padding: "32px 28px",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                <Mark variant="plate" size={34} color="#E8703A" />
              </div>
              <h3 className="font-display" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text-primary)", marginBottom: 6 }}>
                {profile.p1Name} &amp; {profile.p2Name}
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 22 }}>
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
                    {entry.calm && <Flame size={10} aria-hidden="true" style={{ marginLeft: 4, opacity: 0.7, verticalAlign: "-1px" }} />}
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

        {/* Keep your story safe + report problems — quiet utilities */}
        <div style={{ marginTop: 32, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            className="btn-ghost"
            style={{ fontSize: 12 }}
            onClick={() => {
              // The whole story as a file — so clearing a browser can never
              // silently erase fifteen words of a couple's history.
              const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "cook-together-story.json";
              a.click();
              // Revoke on a delay — revoking synchronously races the download
              // start on some browsers and silently produces an empty file.
              setTimeout(() => URL.revokeObjectURL(url), 3000);
            }}
          >
            Save your story
          </button>
          <a
            className="btn-ghost"
            style={{ fontSize: 12, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            href={`mailto:mahadihasan6274@gmail.com?subject=${encodeURIComponent("Cook Together — a problem")}&body=${encodeURIComponent(
              "What happened:\n\n\n— recent errors —\n" + JSON.stringify(getCrashLog(), null, 1).slice(0, 1500)
            )}`}
          >
            Report a problem
          </a>
        </div>

        {/* Start fresh — quiet, two-step, at the very bottom where it belongs */}
        <div style={{ marginTop: 40, textAlign: "center" }}>
          {confirmReset ? (
            <div className="card-sm" style={{ borderColor: "rgba(255,107,138,0.35)" }}>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
                Delete all nights, words, and memories? This can't be undone.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-ghost" onClick={() => setConfirmReset(false)} style={{ flex: 1 }}>
                  Keep everything
                </button>
                <button
                  onClick={handleStartFresh}
                  style={{
                    flex: 1,
                    background: "rgba(255,107,138,0.12)",
                    border: "1px solid rgba(255,107,138,0.4)",
                    borderRadius: 12,
                    color: "var(--accent-red)",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    padding: "10px",
                    cursor: "pointer",
                  }}
                >
                  Delete everything
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn-ghost"
              onClick={() => setConfirmReset(true)}
              style={{ fontSize: 12, opacity: 0.7 }}
            >
              Start fresh — erase this profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
