import { useEffect, useMemo, useState } from "react";
import BadgeDisplay from "../ui/BadgeDisplay";
import VoiceControl from "../ui/VoiceControl";
import { BADGES } from "../../data/badges";
import { useVoice } from "../../hooks/useVoice";
import { useStorage } from "../../hooks/useStorage";
import { sfxFanfare } from "../../utils/sfx";
import { hapticSuccess } from "../../utils/haptics";

const CONFETTI_COLORS = ["#ffe27a", "#f5cf5d", "#ff8a3d", "#e87a8d", "#7dd3a8", "#b48cd6"];

// Deterministic pseudo-random — keeps the render pure under react-hooks/purity.
const cRand = (seed) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        left: `${cRand(i + 1) * 100}%`,
        delay: `${cRand(i + 2) * 2}s`,
        duration: `${cRand(i + 3) * 2 + 2}s`,
        size: cRand(i + 4) * 8 + 6,
        shape: i % 3 === 0 ? "circle" : "square",
      })),
    []
  );

  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 50 }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: "-20px",
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            animation: `confettiSway ${p.duration} ${p.delay} ease-in forwards`,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}

export default function WinnerAnnouncement({
  p1Name, p2Name, judgment, stakes, newBadges = [], existingBadges = [],
  newPair = false, onContinue,
}) {
  // Fanfare as the winner flies in.
  useEffect(() => {
    sfxFanfare();
    hapticSuccess();
  }, []);

  const safeJudgment = judgment || {};
  const {
    winner = "tie",
    winnerReason = "",
    coupleTitle = "A Pair Worth Watching",
    compatibilityScore = 0,
    compatibilityReason = "",
    futurePrediction = "",
    p1Reaction = "",
    p2Reaction = "",
    secretIngredientComment = "",
    plateScore = 0,
  } = safeJudgment;
  const isTie = winner === "tie";
  const [showBadge, setShowBadge] = useState(false);
  const [badgeShown, setBadgeShown] = useState(false);

  const { supported, muted, setMuted, speaking, speak, stop, voices, voiceName, setVoice } = useVoice();
  const { getProfile } = useStorage();

  // The judge's longest memory: the couple's very first dish. gamesPlayed
  // hasn't counted tonight yet while this screen is up, so tonight is
  // night gamesPlayed + 1 — and the note only exists from night two on.
  // New-pair nights never see it: no shared-history callbacks of any kind.
  const [marginNote] = useState(() => {
    if (newPair) return null;
    const profile = getProfile();
    const first =
      profile?.firstDish?.name ||
      profile?.dishHistory?.[0]?.dish1 ||
      profile?.dishHistory?.[0]?.dish2;
    const night = (profile?.gamesPlayed || 0) + 1;
    if (!first || night < 2) return null;
    return `Night ${night}. The first one was "${first}" — still counts.`;
  });

  // Auto-speak the headline judgment a short moment after the screen mounts.
  // Once per mount; user can tap the speaker to mute or replay.
  useEffect(() => {
    if (!supported || muted) return undefined;
    const verdicts = [p1Reaction, p2Reaction].filter(Boolean).join(" ");
    const opener = isTie
      ? `Tonight, nobody loses. ${coupleTitle}.`
      : `Tonight's winner is ${winner}. ${winnerReason} You are ${coupleTitle}.`;
    const closer = futurePrediction ? `Here's the prediction. ${futurePrediction}` : "";
    const fullText = [verdicts, opener, closer].filter(Boolean).join(" ");
    const t = setTimeout(() => speak(fullText), 900);
    return () => {
      clearTimeout(t);
      stop();
    };
    // We intentionally only re-run when the judgment payload changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, winnerReason, coupleTitle, futurePrediction, supported, muted]);

  useEffect(() => {
    if (newBadges.length > 0 && !badgeShown) {
      const t = setTimeout(() => { setShowBadge(true); setBadgeShown(true); }, 2500);
      return () => clearTimeout(t);
    }
  }, [newBadges, badgeShown]);

  // Deduplicate badge ids so any badge that lives in both existing and new lists
  // only renders once.
  const allBadgeIds = Array.from(new Set([...existingBadges, ...newBadges]));
  const allBadgeObjects = allBadgeIds
    .map((id) => BADGES.find((b) => b.id === id))
    .filter(Boolean);

  return (
    <div className="screen bg-deep" style={{ paddingTop: 48, paddingBottom: 48 }}>
      <Confetti />
      <VoiceControl
        supported={supported}
        muted={muted}
        speaking={speaking}
        onToggleMute={setMuted}
        voices={voices}
        voiceName={voiceName}
        onSelectVoice={setVoice}
        onPreview={() => speak("The judge has spoken.", { rate: 0.95 })}
      />

      <div style={{ width: "100%", maxWidth: 440, padding: "0 20px", position: "relative", zIndex: 2 }}>
        {/* Winner */}
        <div className="animate-fly-in" style={{ textAlign: "center", marginBottom: 40 }}>
          {isTie ? (
            <>
              <div style={{ fontSize: 64, marginBottom: 12 }}>🤝</div>
              <h1 className="font-display text-gold" style={{ fontSize: 40, fontWeight: 900, marginBottom: 8 }}>
                TONIGHT, NOBODY LOSES
              </h1>
            </>
          ) : (
            <>
              <div style={{ fontSize: 64, marginBottom: 12, animation: "heartbeat 1.5s ease infinite", display: "inline-block" }}>
                🏆
              </div>
              <div className="label" style={{ color: "var(--accent-gold)", marginBottom: 8 }}>
                Tonight's Winner
              </div>
              <h1
                className="font-display text-gold"
                style={{ fontSize: 48, fontWeight: 900, marginBottom: 12, letterSpacing: "-1px" }}
              >
                {winner}
              </h1>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.5 }}>
                {winnerReason}
              </p>
            </>
          )}
        </div>

        {/* Stakes payoff — the tiny real-world consequence they agreed to */}
        {stakes && !isTie && (
          <div
            className="card-sm animate-fade-in-up delay-200"
            style={{ textAlign: "center", marginBottom: 16, animationFillMode: "forwards", borderColor: "var(--border-strong)" }}
          >
            <div className="label" style={{ marginBottom: 6, color: "var(--accent-gold)" }}>The stakes</div>
            <p style={{ fontSize: 15, color: "var(--text-primary)" }}>
              {stakes} —{" "}
              <strong style={{ color: "var(--accent-gold)" }}>
                {stakes.startsWith("Winner") ? winner : winner === p1Name ? p2Name : p1Name}
              </strong>
              , that's you.
            </p>
          </div>
        )}
        {stakes && isTie && (
          <div
            className="card-sm animate-fade-in-up delay-200"
            style={{ textAlign: "center", marginBottom: 16, animationFillMode: "forwards" }}
          >
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              A tie — you do the stakes <em>together</em>. {stakes.replace(/^(Loser|Winner)/, "Both of you")}
            </p>
          </div>
        )}

        {/* One plate, one score — they rise and fall together */}
        <div className="card animate-fade-in-up delay-200" style={{ marginBottom: 20, textAlign: "center", animationFillMode: "forwards" }}>
          <div className="label" style={{ marginBottom: 6 }}>The plate</div>
          <div
            className="font-display text-gold"
            style={{ fontSize: 56, fontWeight: 900, lineHeight: 1 }}
          >
            {plateScore}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
            out of 100 — earned together
          </div>
        </div>

        {/* The Judge's Verdict — the AI's personal reaction to each dish */}
        {(p1Reaction || p2Reaction) && (
          <div
            className="card-sm animate-fade-in-up delay-300"
            style={{ marginBottom: 16, animationFillMode: "forwards" }}
          >
            <div className="label" style={{ marginBottom: 12, color: "var(--accent-gold)" }}>
              The judge's verdict
            </div>
            {p1Reaction && (
              <div style={{ marginBottom: p2Reaction ? 14 : 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-gold)", marginBottom: 4 }}>
                  {p1Name}
                </div>
                <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6, fontStyle: "italic" }}>
                  "{p1Reaction}"
                </p>
              </div>
            )}
            {p2Reaction && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-orange)", marginBottom: 4 }}>
                  {p2Name}
                </div>
                <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6, fontStyle: "italic" }}>
                  "{p2Reaction}"
                </p>
              </div>
            )}
            {secretIngredientComment && (
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
                {secretIngredientComment}
              </p>
            )}
          </div>
        )}

        {/* Couple title */}
        <div
          className="card-sm animate-fade-in-up delay-300"
          style={{ textAlign: "center", marginBottom: 16, animationFillMode: "forwards" }}
        >
          <div className="label" style={{ marginBottom: 6, color: "var(--accent-gold)" }}>You Are</div>
          <p className="font-display" style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
            {coupleTitle}
          </p>
        </div>

        {/* Compatibility — never shown on new-pair nights: two people still
            new to each other don't get scored as a couple. */}
        {compatibilityScore > 0 && (
        <div
          className="card-sm animate-fade-in-up delay-400"
          style={{ marginBottom: 16, animationFillMode: "forwards" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div className="label" style={{ color: "var(--accent-gold)" }}>Compatibility</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: "var(--accent-gold)" }}>
              {compatibilityScore}%
            </div>
          </div>
          <div
            style={{ display: "flex", gap: 3, marginBottom: 10 }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={compatibilityScore}
            aria-label="Compatibility score"
          >
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  background: i < Math.round(Math.max(0, Math.min(100, compatibilityScore)) / 10)
                    ? "linear-gradient(90deg, var(--accent-gold), var(--accent-orange))"
                    : "rgba(255,255,255,0.06)",
                  transition: "background 0.3s ease",
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{compatibilityReason}</p>
        </div>
        )}

        {/* Future prediction */}
        {futurePrediction ? (
          <div
            className="card-sm animate-fade-in-up delay-500"
            style={{ marginBottom: 24, animationFillMode: "forwards" }}
          >
            <div className="label" style={{ marginBottom: 6, color: "var(--accent-gold)" }}>The prediction</div>
            <p style={{ fontSize: 15, color: "var(--text-primary)", lineHeight: 1.6, fontStyle: "italic" }}>
              "{futurePrediction}"
            </p>
          </div>
        ) : null}

        {/* Badges */}
        {allBadgeObjects.length > 0 && (
          <div className="animate-fade-in-up delay-600" style={{ marginBottom: 24, animationFillMode: "forwards" }}>
            <div className="label" style={{ marginBottom: 12 }}>Your Badges</div>
            <BadgeDisplay badges={allBadgeObjects} newBadges={newBadges.map((id) => ({ id }))} />
          </div>
        )}

        {/* Badge popup */}
        {showBadge && newBadges.length > 0 && (() => {
          const badge = BADGES.find((b) => b.id === newBadges[0]);
          return (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-badge-title"
              className="overlay-in"
              onClick={() => setShowBadge(false)}
              onKeyDown={(e) => (e.key === "Escape" || e.key === "Enter") && setShowBadge(false)}
              tabIndex={0}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 80,
                padding: 24,
                cursor: "pointer",
              }}
            >
              <div className="card animate-badge-reveal" style={{ textAlign: "center", maxWidth: 320 }}>
                <div style={{ fontSize: 72, marginBottom: 12 }} aria-hidden="true">
                  {badge?.emoji || "🏅"}
                </div>
                <div className="label" style={{ color: "var(--accent-gold)", marginBottom: 8 }}>New badge earned</div>
                <h2 id="new-badge-title" className="font-display" style={{ fontSize: 28, marginBottom: 8 }}>
                  {badge?.name || "Mystery Badge"}
                </h2>
                <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                  {badge?.description || ""}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 16 }}>Tap to continue</p>
              </div>
            </div>
          );
        })()}

        <button className="btn-primary animate-fade-in-up delay-700" onClick={onContinue} style={{ animationFillMode: "forwards" }}>
          Reveal The Word →
        </button>

        {/* The margin note. On any night after the first, the judge quietly
            remembers where this all started. Tiny, late, easy to miss —
            it's for the couples who read the bottom of the page. */}
        {marginNote && (
          <p
            className="animate-fade-in opacity-0 delay-2000"
            style={{
              fontSize: 11.5,
              color: "var(--text-muted)",
              fontStyle: "italic",
              textAlign: "center",
              marginTop: 18,
              animationFillMode: "forwards",
            }}
          >
            {marginNote}
          </p>
        )}
      </div>
    </div>
  );
}
