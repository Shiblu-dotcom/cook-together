import { useState, useEffect } from "react";
import { getRandomIngredients, getAlternatives } from "../../data/ingredients";
import { RefreshCw } from "lucide-react";
import { useVoice } from "../../hooks/useVoice";
import VoiceControl from "../ui/VoiceControl";

export default function IngredientReveal({ p1Name, p2Name, theme, cookingTip, openingMessage, onReady }) {
  const [step, setStep] = useState(0); // 0=theme, 1=p1 secret, 2=p2 secret
  const [ingredients, setIngredients] = useState(() => getRandomIngredients(2));
  const [p1Swapped, setP1Swapped] = useState(false);
  const [p2Swapped, setP2Swapped] = useState(false);
  const [showSwapOptions, setShowSwapOptions] = useState(null); // null | 'p1' | 'p2'
  const [swapOptions, setSwapOptions] = useState([]);
  const { supported, muted, setMuted, speaking, speak, stop } = useVoice();

  // Read out each reveal step out loud so players don't need to keep their
  // eyes on the screen while chopping or stirring.
  // Step 0 uses the AI-generated personalised opening when available; otherwise
  // a friendly fallback. The "you have 15 minutes" reminder always closes step 0.
  useEffect(() => {
    if (!supported || muted) return undefined;
    let utter = "";
    if (step === 0) {
      const opener = (openingMessage || "").trim();
      const themeLine = `Tonight's theme is ${theme}.`;
      const reminder = "You've got 15 minutes. Cook anything you want.";
      utter = opener
        ? `${opener} ${themeLine} ${reminder}`
        : `${themeLine} ${reminder}`;
    } else if (step === 1) {
      utter = `${p1Name}, your secret ingredient is ${ingredients[0].name}. You've got to use it. Don't tell ${p2Name}.`;
    } else if (step === 2) {
      utter = `${p2Name}, your secret ingredient is ${ingredients[1].name}. You've got to use it too. Keep it between us.`;
    }
    if (!utter) return undefined;
    const t = setTimeout(() => speak(utter), 350);
    return () => {
      clearTimeout(t);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, theme, ingredients, supported, muted, openingMessage]);

  const openSwap = (player) => {
    const orig = player === "p1" ? ingredients[0] : ingredients[1];
    setSwapOptions(getAlternatives(orig, 3));
    setShowSwapOptions(player);
  };

  const doSwap = (player, newIng) => {
    setIngredients((prev) => {
      const next = [...prev];
      if (player === "p1") { next[0] = newIng; setP1Swapped(true); }
      else { next[1] = newIng; setP2Swapped(true); }
      return next;
    });
    setShowSwapOptions(null);
  };

  const handleFinish = () => {
    onReady({ secret1: ingredients[0], secret2: ingredients[1], swapped1: p1Swapped, swapped2: p2Swapped });
  };

  return (
    <div className="screen-center bg-deep" style={{ minHeight: "100vh" }}>
      <VoiceControl supported={supported} muted={muted} speaking={speaking} onToggleMute={setMuted} />
      <div style={{ width: "100%", maxWidth: 440, padding: "0 20px" }}>

        {/* Step 0 — Theme reveal */}
        {step === 0 && (
          <div className="animate-fade-in-up" style={{ textAlign: "center" }}>
            {/* Personalised AI welcome, when present */}
            {openingMessage && (
              <p
                style={{
                  fontStyle: "italic",
                  color: "var(--text-secondary)",
                  fontSize: 15,
                  lineHeight: 1.55,
                  marginBottom: 28,
                  maxWidth: 380,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                {openingMessage}
              </p>
            )}

            <div className="label" style={{ marginBottom: 16, color: "var(--accent-gold)" }}>
              Tonight's Theme
            </div>
            <h1 className="font-display text-gold" style={{ fontSize: 40, fontWeight: 900, marginBottom: 12, lineHeight: 1.2 }}>
              {theme}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 16, marginBottom: 40 }}>
              You have <strong style={{ color: "var(--text-primary)" }}>15 minutes</strong>. Cook anything. Use your secret ingredient.
            </p>

            {cookingTip && (
              <div
                style={{
                  background: "rgba(245,207,93,0.06)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 14,
                  padding: "14px 18px",
                  marginBottom: 40,
                  textAlign: "left",
                }}
              >
                <span className="label" style={{ color: "var(--accent-gold)", display: "block", marginBottom: 6 }}>
                  Chef's Tip
                </span>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{cookingTip}</p>
              </div>
            )}

            <button className="btn-primary" onClick={() => setStep(1)}>
              Reveal {p1Name}'s Secret →
            </button>
          </div>
        )}

        {/* Step 1 — P1 secret */}
        {step === 1 && (
          <div className="animate-scale-bounce" style={{ textAlign: "center" }}>
            <div
              style={{
                background: "rgba(245,207,93,0.06)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                padding: "10px 16px",
                marginBottom: 32,
                fontSize: 13,
                color: "var(--text-secondary)",
              }}
            >
              🤫 {p2Name}, look away!
            </div>

            <div className="label" style={{ marginBottom: 12, color: "var(--accent-gold)" }}>
              {p1Name}'s Secret Ingredient
            </div>

            <div
              aria-hidden="true"
              style={{
                fontSize: 96,
                marginBottom: 16,
                animation: "heartbeat 2s ease infinite",
                display: "inline-block",
              }}
            >
              {ingredients[0].emoji}
            </div>

            <h2
              className="font-display"
              style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}
            >
              {ingredients[0].name}
            </h2>

            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 8 }}>
              You <strong style={{ color: "var(--accent-red)" }}>MUST</strong> use this. Don't tell {p2Name}!
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 32 }}>
              Skip it = 0 points this round.
            </p>

            {showSwapOptions === "p1" ? (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>Pick a replacement:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {swapOptions.map((opt) => (
                    <button
                      key={opt.name}
                      className="btn-secondary"
                      onClick={() => doSwap("p1", opt)}
                      style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}
                    >
                      <span style={{ fontSize: 24 }}>{opt.emoji}</span>
                      {opt.name}
                      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>(−10 pts)</span>
                    </button>
                  ))}
                </div>
                <button className="btn-ghost" onClick={() => setShowSwapOptions(null)} style={{ marginTop: 8 }}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => openSwap("p1")}
                className="btn-ghost"
                style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 auto 24px" }}
              >
                <RefreshCw size={14} /> Don't have it? Swap
              </button>
            )}

            <button className="btn-primary" onClick={() => setStep(2)}>
              I've got it, show {p2Name}'s secret →
            </button>
          </div>
        )}

        {/* Step 2 — P2 secret */}
        {step === 2 && (
          <div className="animate-scale-bounce" style={{ textAlign: "center" }}>
            <div
              style={{
                background: "rgba(245,207,93,0.06)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                padding: "10px 16px",
                marginBottom: 32,
                fontSize: 13,
                color: "var(--text-secondary)",
              }}
            >
              🤫 {p1Name}, look away!
            </div>

            <div className="label" style={{ marginBottom: 12, color: "var(--accent-gold)" }}>
              {p2Name}'s Secret Ingredient
            </div>

            <div
              aria-hidden="true"
              style={{
                fontSize: 96,
                marginBottom: 16,
                animation: "heartbeat 2s ease infinite",
                display: "inline-block",
              }}
            >
              {ingredients[1].emoji}
            </div>

            <h2
              className="font-display"
              style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}
            >
              {ingredients[1].name}
            </h2>

            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 8 }}>
              You <strong style={{ color: "var(--accent-red)" }}>MUST</strong> use this. Don't tell {p1Name}!
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 32 }}>
              Skip it = 0 points this round.
            </p>

            {showSwapOptions === "p2" ? (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>Pick a replacement:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {swapOptions.map((opt) => (
                    <button
                      key={opt.name}
                      className="btn-secondary"
                      onClick={() => doSwap("p2", opt)}
                      style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}
                    >
                      <span style={{ fontSize: 24 }}>{opt.emoji}</span>
                      {opt.name}
                      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>(−10 pts)</span>
                    </button>
                  ))}
                </div>
                <button className="btn-ghost" onClick={() => setShowSwapOptions(null)} style={{ marginTop: 8 }}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => openSwap("p2")}
                className="btn-ghost"
                style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 auto 24px" }}
              >
                <RefreshCw size={14} /> Don't have it? Swap
              </button>
            )}

            <button className="btn-primary" onClick={handleFinish}>
              We're ready. START COOKING! 🔥
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
