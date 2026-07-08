import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { sfxChime } from "../../utils/sfx";

export default function QuestionCard({ question, p1Name, p2Name, onSubmit, onDismiss }) {
  const [step, setStep] = useState("p1"); // p1 | p2 | done
  const [p1Answer, setP1Answer] = useState("");
  const [p2Answer, setP2Answer] = useState("");
  const finishTimerRef = useRef(null);

  // Soft chime when the card slides up — hands are busy, eyes are on the pan.
  useEffect(() => {
    sfxChime();
  }, []);

  const handleP1Submit = () => {
    if (!p1Answer.trim()) return;
    setStep("p2");
  };

  const handleP2Submit = () => {
    if (!p2Answer.trim()) return;
    if (onSubmit) onSubmit(question, p1Answer.trim(), p2Answer.trim());
    setStep("done");
    finishTimerRef.current = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 800);
  };

  // Clean up the auto-dismiss timer if the card unmounts before it fires.
  useEffect(() => {
    return () => {
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="question-card-prompt"
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "440px",
        zIndex: 50,
        animation: "slideUp 0.4s ease forwards",
      }}
    >
      <div className="card" style={{ padding: "24px", position: "relative" }}>
        <button
          onClick={onDismiss}
          aria-label="Dismiss question"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: 0,
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.15s ease, background 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        >
          <X size={16} aria-hidden="true" />
        </button>

        <div className="label" style={{ marginBottom: 8, color: "var(--accent-gold)" }}>
          Question Card
        </div>

        <p
          id="question-card-prompt"
          className="font-display"
          style={{ fontSize: 17, color: "var(--text-primary)", marginBottom: 20, lineHeight: 1.5, paddingRight: 28 }}
        >
          {question}
        </p>

        {step === "done" ? (
          <div style={{ textAlign: "center", color: "var(--accent-gold)", fontSize: 14 }}>
            Saved for the reveal ✨
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 8,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {step === "p1" ? `${p1Name}'s answer` : `${p2Name}'s answer — ${p1Name}, look away!`}
            </div>
            <textarea
              value={step === "p1" ? p1Answer : p2Answer}
              onChange={(e) =>
                step === "p1" ? setP1Answer(e.target.value) : setP2Answer(e.target.value)
              }
              placeholder="Answer honestly..."
              rows={2}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(245,207,93,0.2)",
                borderRadius: 12,
                color: "var(--text-primary)",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                padding: "12px 14px",
                outline: "none",
                resize: "none",
                marginBottom: 14,
              }}
            />
            <button
              className="btn-primary"
              onClick={step === "p1" ? handleP1Submit : handleP2Submit}
              disabled={!(step === "p1" ? p1Answer : p2Answer).trim()}
              style={{ padding: "12px 24px", fontSize: 15 }}
            >
              {step === "p1" ? `Done → ${p2Name}'s turn` : "Save answers ✓"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
