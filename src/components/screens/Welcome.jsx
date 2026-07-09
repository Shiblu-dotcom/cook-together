import { useState, useRef, useEffect } from "react";
import { ChefHat } from "lucide-react";
import Particles from "../ui/Particles";
import { useStorage } from "../../hooks/useStorage";

// The AI calls require a Claude API key. If the key is missing or is still the
// placeholder from .env.example, the app falls back to canned responses — that
// works, but the experience is much better with a real key. We surface a tiny
// hint banner so first-time devs know to set it up.
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const HAS_REAL_KEY = !!API_KEY && API_KEY !== "your_anthropic_api_key_here";

const CALM_NOTE_KEY = "cook_together_calm_note";

// Read the morning-after note once: shown only 6–48h after a calm night,
// then it disappears forever. Never a push, never a streak.
const readCalmNote = () => {
  try {
    const raw = localStorage.getItem(CALM_NOTE_KEY);
    if (!raw) return false;
    const age = Date.now() - new Date(raw).getTime();
    return age > 6 * 3600_000 && age < 48 * 3600_000;
  } catch {
    return false;
  }
};

export default function Welcome({ onStart, onViewProfile, onCalmNight, resumeSlot, onResume }) {
  const { getProfile, createProfile } = useStorage();
  // Hydrate from localStorage lazily so we don't trigger a cascading render
  // (React 19's react-hooks/set-state-in-effect rule).
  const [returning] = useState(() => getProfile());
  const [p1Name, setP1Name] = useState(() => returning?.p1Name ?? "");
  const [p2Name, setP2Name] = useState(() => returning?.p2Name ?? "");
  const [calmNote] = useState(readCalmNote);
  const p1Ref = useRef(null);
  const p2Ref = useRef(null);

  // The note shows once, then is gone.
  useEffect(() => {
    if (!calmNote) return;
    try {
      localStorage.removeItem(CALM_NOTE_KEY);
    } catch {
      /* ignore */
    }
  }, [calmNote]);

  // Auto-focus the first empty input on mount. Friendlier for new users on
  // desktop; on mobile this is a no-op because programmatic focus doesn't
  // pop the keyboard without a user gesture.
  useEffect(() => {
    if (!p1Name) p1Ref.current?.focus();
    else if (!p2Name) p2Ref.current?.focus();
    // We intentionally only run this on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = () => {
    if (!p1Name.trim() || !p2Name.trim()) return;
    if (!returning) {
      createProfile(p1Name.trim(), p2Name.trim());
    }
    onStart({ p1Name: p1Name.trim(), p2Name: p2Name.trim(), isReturning: !!returning, gamesPlayed: returning?.gamesPlayed || 0 });
  };

  // The calm night's quiet door — deliberate, never suggested by the app.
  const handleCalm = () => {
    if (!p1Name.trim() || !p2Name.trim() || !onCalmNight) return;
    if (!returning) {
      createProfile(p1Name.trim(), p2Name.trim());
    }
    onCalmNight({ p1Name: p1Name.trim(), p2Name: p2Name.trim(), isReturning: !!returning, gamesPlayed: returning?.gamesPlayed || 0 });
  };

  const roundNum = returning ? returning.gamesPlayed + 1 : 1;

  return (
    <div className="screen-center bg-deep" style={{ minHeight: "100vh" }}>
      <Particles count={14} />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 400,
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        {/* Icon */}
        <div
          className="animate-fade-in opacity-0"
          style={{ marginBottom: 24, animationFillMode: "forwards" }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(245,207,93,0.15), rgba(255,138,61,0.1))",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulseGlow 3s ease-in-out infinite",
            }}
          >
            <ChefHat size={32} color="var(--accent-gold)" aria-hidden="true" />
          </div>
        </div>

        {/* Title */}
        <h1
          className="font-display text-gold animate-fade-in-up opacity-0 delay-100"
          style={{
            fontSize: 48,
            fontWeight: 900,
            lineHeight: 1.1,
            textAlign: "center",
            marginBottom: 4,
            animationFillMode: "forwards",
          }}
        >
          Cook Together
        </h1>
        <p
          className="font-display animate-fade-in-up opacity-0 delay-200"
          style={{
            fontSize: 19,
            fontStyle: "italic",
            color: "var(--text-secondary)",
            marginBottom: returning ? 40 : 18,
            letterSpacing: "0.06em",
            textAlign: "center",
            animationFillMode: "forwards",
          }}
        >
          Stay Together
        </p>

        {/* The premise, in one breath — first-timers only. The how-it-works
            cards below carry the details; this line just sets the table. */}
        {!returning && (
          <p
            className="animate-fade-in opacity-0 delay-300"
            style={{
              fontSize: 15,
              color: "var(--text-secondary)",
              letterSpacing: "0.04em",
              textAlign: "center",
              marginBottom: 34,
              animationFillMode: "forwards",
            }}
          >
            One kitchen. Two cooks. Fifteen minutes.
          </p>
        )}

        {/* How it works — three beats, first-timers only */}
        {!returning && (
          <div
            className="animate-fade-in opacity-0 delay-400"
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 28,
              width: "100%",
              animationFillMode: "forwards",
            }}
          >
            {[
              { emoji: "🤫", text: "Get a secret ingredient" },
              { emoji: "🔥", text: "Cook for 15 minutes" },
              { emoji: "👨‍⚖️", text: "Let the AI judge decide" },
            ].map((step, i) => (
              <div
                key={i}
                className="card-sm"
                style={{ flex: 1, textAlign: "center", padding: "12px 8px" }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }} aria-hidden="true">{step.emoji}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  {step.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Morning-after note — appears once, 6–48h after a calm night,
            then is gone. One line, no streaks, no follow-up. */}
        {calmNote && (
          <p
            className="animate-fade-in opacity-0 delay-200"
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              fontStyle: "italic",
              textAlign: "center",
              maxWidth: 320,
              lineHeight: 1.6,
              marginBottom: 24,
              animationFillMode: "forwards",
            }}
          >
            🕯 Last night you made something together when it was hard. That counts.
          </p>
        )}

        {/* Interrupted night — offer to pick up where they left off */}
        {resumeSlot && (
          <div
            className="card-sm animate-fade-in opacity-0 delay-200"
            style={{
              width: "100%",
              marginBottom: 24,
              textAlign: "center",
              borderColor: "var(--border-strong)",
              animationFillMode: "forwards",
            }}
          >
            <p style={{ fontSize: 14, color: "var(--text-primary)", marginBottom: 4 }}>
              Still simmering from last time
            </p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14 }}>
              {resumeSlot.state.aiContext?.theme
                ? `"${resumeSlot.state.aiContext.theme}" was still cooking.`
                : "Your last session was interrupted."}
            </p>
            <button className="btn-primary" onClick={onResume} style={{ padding: "12px 24px", fontSize: 15 }}>
              Back to the kitchen →
            </button>
          </div>
        )}

        {/* Returning greeting */}
        {returning && (
          <div
            className="animate-fade-in opacity-0 delay-200"
            style={{
              background: "rgba(245,207,93,0.06)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 14,
              padding: "12px 20px",
              marginBottom: 28,
              textAlign: "center",
              animationFillMode: "forwards",
            }}
          >
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Welcome back,{" "}
              <span style={{ color: "var(--accent-gold)", fontWeight: 600 }}>
                {returning.p1Name} &amp; {returning.p2Name}
              </span>
            </p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
              Ready for round {roundNum}?
            </p>
            {returning.wordCollection?.length > 0 && (
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>
                Last night's word:{" "}
                <span className="font-display" style={{ color: "var(--accent-gold)", fontWeight: 700, fontSize: 14 }}>
                  {returning.wordCollection[returning.wordCollection.length - 1].word}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Inputs */}
        <div
          className="animate-fade-in-up opacity-0 delay-300"
          style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, marginBottom: 20, animationFillMode: "forwards" }}
        >
          <div>
            <label htmlFor="p1-name-input" className="label" style={{ display: "block", marginBottom: 6 }}>Your name</label>
            <input
              id="p1-name-input"
              ref={p1Ref}
              className="input-field"
              type="text"
              placeholder="Sofia"
              value={p1Name}
              onChange={(e) => setP1Name(e.target.value)}
              maxLength={30}
              autoComplete="given-name"
              onKeyDown={(e) => {
                if (e.key === "Enter" && p1Name.trim()) p2Ref.current?.focus();
              }}
            />
          </div>
          <div>
            <label htmlFor="p2-name-input" className="label" style={{ display: "block", marginBottom: 6 }}>Their name</label>
            <input
              id="p2-name-input"
              ref={p2Ref}
              className="input-field"
              type="text"
              placeholder="Marco"
              value={p2Name}
              onChange={(e) => setP2Name(e.target.value)}
              maxLength={30}
              autoComplete="given-name"
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />
          </div>
        </div>

        {/* CTA */}
        <div
          className="animate-fade-in-up opacity-0 delay-400"
          style={{ width: "100%", animationFillMode: "forwards" }}
        >
          <button
            className="btn-primary"
            onClick={handleStart}
            disabled={!p1Name.trim() || !p2Name.trim()}
            aria-disabled={!p1Name.trim() || !p2Name.trim()}
          >
            Let's cook
          </button>
        </div>

        {/* The quiet door. Deliberately understated — the app never suggests
            it, never links it to anything it knows. It just sits here. */}
        <button
          className="btn-ghost animate-fade-in opacity-0 delay-500"
          onClick={handleCalm}
          disabled={!p1Name.trim() || !p2Name.trim()}
          aria-disabled={!p1Name.trim() || !p2Name.trim()}
          style={{
            marginTop: 14,
            fontSize: 13,
            color: "var(--text-secondary)",
            opacity: !p1Name.trim() || !p2Name.trim() ? 0.35 : undefined,
            animationFillMode: "forwards",
          }}
        >
          🕯 or start a calm night
        </button>

        {/* Profile link */}
        {returning && (
          <button
            className="btn-ghost animate-fade-in opacity-0 delay-500"
            onClick={onViewProfile}
            style={{ marginTop: 20, animationFillMode: "forwards" }}
          >
            Your story →
          </button>
        )}

        {/* Dev hint — only shown when the Anthropic key isn't configured.
            Once a real key is set, this disappears entirely. */}
        {!HAS_REAL_KEY && (
          <div
            className="animate-fade-in opacity-0 delay-600"
            style={{
              marginTop: 28,
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(255, 138, 61, 0.08)",
              border: "1px solid rgba(255, 138, 61, 0.25)",
              fontSize: 12,
              color: "var(--text-secondary)",
              textAlign: "center",
              maxWidth: 340,
              lineHeight: 1.5,
              animationFillMode: "forwards",
            }}
          >
            <span aria-hidden="true">⚙️</span>{" "}
            Set <code style={{ color: "var(--accent-gold)", fontFamily: "inherit" }}>VITE_ANTHROPIC_API_KEY</code>{" "}
            in <code style={{ color: "var(--accent-gold)", fontFamily: "inherit" }}>.env</code> for personalised AI.
            The game still works without it — judging just uses canned responses.
          </div>
        )}
      </div>
    </div>
  );
}
