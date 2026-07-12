import { useEffect, useState } from "react";
import BadgeDisplay from "../ui/BadgeDisplay";
import VoiceControl from "../ui/VoiceControl";
import { BADGES } from "../../data/badges";
import { useVoice } from "../../hooks/useVoice";
import { useStorage } from "../../hooks/useStorage";
import { sfxFanfare } from "../../utils/sfx";
import { hapticSuccess } from "../../utils/haptics";

export default function WinnerAnnouncement({
  p1Name, p2Name, judgment, stakes, newBadges = [], existingBadges = [],
  newPair = false, mode = "win", onContinue,
}) {
  const isFun = mode === "fun";
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
    const opener = isFun
      ? `You are ${coupleTitle}.`
      : isTie
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

  // Deduplicate badge ids so any badge that lives in both existing and new lists
  // only renders once.
  const allBadgeIds = Array.from(new Set([...existingBadges, ...newBadges]));
  const allBadgeObjects = allBadgeIds
    .map((id) => BADGES.find((b) => b.id === id))
    .filter(Boolean);

  return (
    <div className="screen bg-deep" style={{ paddingTop: 48, paddingBottom: 48 }}>
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
        {/* The hero — typography only, one loud statement. Everything after
            this is deliberately quieter (the model is the Word screen). */}
        <div className="animate-fly-in" style={{ textAlign: "center", marginBottom: 48, marginTop: 24 }}>
          {isFun ? (
            <>
              <div className="label" style={{ marginBottom: 10 }}>You are</div>
              <h1 className="font-display" style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.02em", color: "var(--accent-gold)", marginBottom: 12 }}>
                {coupleTitle}
              </h1>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.5, maxWidth: 340, margin: "0 auto" }}>
                One plate, made together. That was the whole game.
              </p>
            </>
          ) : isTie ? (
            <h1 className="font-display" style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 12 }}>
              Tonight,<br />nobody loses
            </h1>
          ) : (
            <>
              <div className="label" style={{ marginBottom: 10 }}>
                Tonight's Winner
              </div>
              <h1
                className="font-display"
                style={{ fontSize: 56, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--accent-gold)", marginBottom: 12 }}
              >
                {winner}
              </h1>
            </>
          )}
          {(winnerReason || isTie) && (
            <p style={{ fontSize: 15, color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.5, maxWidth: 340, margin: "0 auto" }}>
              {winnerReason}
            </p>
          )}
        </div>

        {/* Stakes payoff — the tiny real-world consequence they agreed to */}
        {stakes && !isTie && (
          <div
            className="card-sm animate-fade-in-up delay-200"
            style={{ textAlign: "center", marginBottom: 16, animationFillMode: "forwards", borderColor: "var(--border-strong)" }}
          >
            <div className="label" style={{ marginBottom: 6 }}>The stakes</div>
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
              A tie — you do the stakes <em>together</em>.{" "}
              {stakes.replace(/^(Loser|Winner) (does|writes|picks)/, (m, who, verb) =>
                `Both of you ${{ does: "do", writes: "write", picks: "pick" }[verb]}`
              )}
            </p>
          </div>
        )}

        {/* One plate, one score — they rise and fall together. Fun nights
            have no score at all: the plate just was. */}
        {!isFun && (
        <div className="card animate-fade-in-up delay-200" style={{ marginBottom: 20, textAlign: "center", animationFillMode: "forwards" }}>
          <div className="label" style={{ marginBottom: 6 }}>The plate</div>
          <div
            className="font-display"
            style={{ fontSize: 56, fontWeight: 600, lineHeight: 1, color: "var(--text-primary)" }}
          >
            {plateScore}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
            out of 100 — earned together
          </div>
        </div>
        )}

        {/* The Judge's Verdict — the AI's personal reaction to each dish */}
        {(p1Reaction || p2Reaction) && (
          <div
            className="card-sm animate-fade-in-up delay-300"
            style={{ marginBottom: 16, animationFillMode: "forwards" }}
          >
            <div className="label" style={{ marginBottom: 12 }}>
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

        {/* Couple title — on fun nights it IS the hero above, so no repeat */}
        {!isFun && (
        <div
          className="card-sm animate-fade-in-up delay-300"
          style={{ textAlign: "center", marginBottom: 16, animationFillMode: "forwards" }}
        >
          <div className="label" style={{ marginBottom: 6 }}>You Are</div>
          <p className="font-display" style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
            {coupleTitle}
          </p>
        </div>
        )}

        {/* Compatibility — never shown on new-pair nights: two people still
            new to each other don't get scored as a couple. */}
        {compatibilityScore > 0 && (
        <div
          className="card-sm animate-fade-in-up delay-400"
          style={{ marginBottom: 16, animationFillMode: "forwards" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div className="label">Compatibility</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: "var(--text-primary)" }}>
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
            <div className="label" style={{ marginBottom: 6 }}>The prediction</div>
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
