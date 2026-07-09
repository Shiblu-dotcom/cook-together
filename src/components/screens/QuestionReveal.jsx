import { useState, useEffect } from "react";
import { startAmbient, stopAmbient } from "../../utils/ambient";
import { sfxReveal } from "../../utils/sfx";
import { hapticTap } from "../../utils/haptics";

const REACTIONS = ["😂", "❤️", "😮", "🔥", "🥺"];

export default function QuestionReveal({ questionsAnswered, p1Name, p2Name, onComplete, onReaction }) {
  const [qIdx, setQIdx] = useState(0);
  const [revealStep, setRevealStep] = useState(0); // 0=question, 1=p1answer, 2=p2answer
  const [reactions, setReactions] = useState({});

  // The reveal is the intimate beat of the night — soft romantic pads play
  // underneath while answers are read for the first time. (Hook sits above
  // the empty-state early return to keep hook order stable.)
  useEffect(() => {
    startAmbient("romantic");
    return () => stopAmbient();
  }, []);

  if (!questionsAnswered || questionsAnswered.length === 0) {
    return (
      <div className="screen-center bg-mesh" style={{ textAlign: "center" }}>
        <div style={{ padding: "0 24px" }}>
          <h2 className="font-display" style={{ fontSize: 28, marginBottom: 12 }}>
            Nothing to reveal tonight
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 40 }}>
            Too busy cooking to answer. Honestly, fair.
          </p>
          <button className="btn-primary" onClick={onComplete} style={{ maxWidth: 300, margin: "0 auto" }}>
            See the winner →
          </button>
        </div>
      </div>
    );
  }

  const current = questionsAnswered[qIdx];
  const isLast = qIdx === questionsAnswered.length - 1;

  const handleReaction = (emoji) => {
    setReactions((r) => ({ ...r, [`${qIdx}-${revealStep}`]: emoji }));
    // Persist upward too — reactions belong in the couple's history, not
    // just this screen's ephemeral state.
    if (onReaction) onReaction(qIdx, revealStep === 1 ? "p1" : "p2", emoji);
  };

  const handleNext = () => {
    if (revealStep < 2) {
      // An answer is about to be seen for the first time — mark it.
      sfxReveal();
      hapticTap();
      setRevealStep((s) => s + 1);
    } else if (!isLast) {
      setQIdx((i) => i + 1);
      setRevealStep(0);
    } else {
      onComplete();
    }
  };

  return (
    <div className="screen-center bg-mesh" style={{ minHeight: "100vh" }}>
      <div style={{ width: "100%", maxWidth: 440, padding: "0 20px" }}>
        {/* Progress */}
        <div className="label" style={{ textAlign: "center", marginBottom: 24, color: "var(--text-secondary)" }}>
          {qIdx + 1} of {questionsAnswered.length}
        </div>

        {/* Question */}
        <div
          className="card animate-fade-in"
          style={{ textAlign: "center", marginBottom: 24 }}
          key={`q-${qIdx}`}
        >
          <div className="label" style={{ marginBottom: 10, color: "var(--accent-gold)" }}>While you cooked, we asked</div>
          <p className="font-display" style={{ fontSize: 18, lineHeight: 1.6, color: "var(--text-primary)" }}>
            {current.question}
          </p>
        </div>

        {/* P1 answer */}
        {revealStep >= 1 && (
          <div
            className="card-sm animate-card-flip"
            key={`a1-${qIdx}`}
            style={{ marginBottom: 16, borderLeft: "3px solid var(--accent-gold)" }}
            aria-label={`${p1Name}'s answer`}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span className="label" style={{ color: "var(--accent-gold)" }}>{p1Name}</span>
              <div style={{ display: "flex", gap: 6 }} role="group" aria-label={`React to ${p1Name}'s answer`}>
                {REACTIONS.map((e) => {
                  const isSel = reactions[`${qIdx}-1`] === e;
                  return (
                    <button
                      key={e}
                      onClick={() => handleReaction(e)}
                      aria-label={`React with ${e}`}
                      aria-pressed={isSel}
                      style={{
                        background: isSel ? "rgba(245,207,93,0.15)" : "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 18,
                        padding: "4px 6px",
                        borderRadius: 6,
                        transition: "background 0.15s ease, transform 0.1s ease",
                      }}
                      onMouseDown={(ev) => (ev.currentTarget.style.transform = "scale(0.9)")}
                      onMouseUp={(ev) => (ev.currentTarget.style.transform = "scale(1)")}
                      onMouseLeave={(ev) => (ev.currentTarget.style.transform = "scale(1)")}
                    >
                      {e}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Their own words get the serif — same register as the witness. */}
            <p className="font-display" style={{ fontSize: 17, fontStyle: "italic", color: "var(--text-primary)", lineHeight: 1.65 }}>
              {current.p1Answer}
            </p>
          </div>
        )}

        {/* P2 answer */}
        {revealStep >= 2 && (
          <div
            className="card-sm animate-card-flip"
            key={`a2-${qIdx}`}
            style={{ marginBottom: 32, borderLeft: "3px solid #ff8a3d" }}
            aria-label={`${p2Name}'s answer`}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span className="label" style={{ color: "#ff8a3d" }}>{p2Name}</span>
              <div style={{ display: "flex", gap: 6 }} role="group" aria-label={`React to ${p2Name}'s answer`}>
                {REACTIONS.map((e) => {
                  const isSel = reactions[`${qIdx}-2`] === e;
                  return (
                    <button
                      key={e}
                      onClick={() => handleReaction(e)}
                      aria-label={`React with ${e}`}
                      aria-pressed={isSel}
                      style={{
                        background: isSel ? "rgba(255,138,61,0.15)" : "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 18,
                        padding: "4px 6px",
                        borderRadius: 6,
                        transition: "background 0.15s ease, transform 0.1s ease",
                      }}
                      onMouseDown={(ev) => (ev.currentTarget.style.transform = "scale(0.9)")}
                      onMouseUp={(ev) => (ev.currentTarget.style.transform = "scale(1)")}
                      onMouseLeave={(ev) => (ev.currentTarget.style.transform = "scale(1)")}
                    >
                      {e}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="font-display" style={{ fontSize: 17, fontStyle: "italic", color: "var(--text-primary)", lineHeight: 1.65 }}>
              {current.p2Answer}
            </p>
          </div>
        )}

        <button className="btn-primary" onClick={handleNext}>
          {revealStep === 0
            ? `${p1Name}'s answer →`
            : revealStep === 1
            ? `${p2Name}'s answer →`
            : isLast
            ? "See the winner →"
            : "Next question →"}
        </button>
      </div>
    </div>
  );
}
