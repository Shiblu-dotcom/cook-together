import { useState, useEffect, useRef, useCallback } from "react";
import Timer from "../ui/Timer";
import QuestionCard from "../ui/QuestionCard";
import MemoryCapture from "../ui/MemoryCapture";
import MusicPlayer from "../ui/MusicPlayer";
import CookingAssistant from "../ui/CookingAssistant";
import { useVoice } from "../../hooks/useVoice";
import { getQuestionsForTone } from "../../data/questions";
import { getRandomTwist } from "../../data/twists";
import { getRandomCoopMoment } from "../../data/coopMoments";
import { sfxTwist, sfxChime } from "../../utils/sfx";
import { startAmbient, stopAmbient, setAmbientMood } from "../../utils/ambient";

export default function Cooking({
  p1Name, p2Name, theme, musicMood: initialMood, questionTone, questionBias,
  secret1, secret2, twistStyle, gamesPlayed, night,
  memories, onAddMemory, onQuestionAnswer, onTimeUp,
  initialSeconds, onTick,
}) {
  const [mood, setMood] = useState(initialMood || "chill");
  const [twist, setTwist] = useState(null);
  const [showTwist, setShowTwist] = useState(false);
  const [coop, setCoop] = useState(null);
  const [showCoop, setShowCoop] = useState(false);
  const [paused, setPaused] = useState(false);
  const [peeking, setPeeking] = useState(null); // null | 'choose' | 'p1' | 'p2'
  // Coarse clock for the Chef assistant — updated every 30s so re-renders
  // stay rare but Chef can give time-aware advice ("plate it, 3 minutes left").
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds || 15 * 60);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questions] = useState(() =>
    getQuestionsForTone(questionTone || "mix", 3, gamesPlayed || 0, questionBias || null)
  );
  const questionIdx = useRef(0);
  const questionTimers = useRef([]);
  const twistTimeoutRef = useRef(null);
  const twistRef = useRef(null);
  const voice = useVoice();

  const showNextQuestion = () => {
    if (questionIdx.current < questions.length) {
      setCurrentQuestion(questions[questionIdx.current]);
      questionIdx.current += 1;
    }
  };

  // Schedule question cards at 4min and 10min in (≈11min and 5min remaining).
  // Use refs so cleanup catches both timers regardless of when unmount happens.
  useEffect(() => {
    const timers = [
      setTimeout(showNextQuestion, 4 * 60 * 1000),
      setTimeout(showNextQuestion, 10 * 60 * 1000),
    ];
    questionTimers.current = timers;
    return () => {
      timers.forEach(clearTimeout);
      if (twistTimeoutRef.current) clearTimeout(twistTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ambient pad plays for the whole cook — starts with the AI-picked mood,
  // follows the music player's mood switches, and stops when the screen ends.
  useEffect(() => {
    if (!voice.muted) startAmbient(mood);
    return () => stopAmbient();
    // Start once per mount; mood changes are handled below without restarts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAmbientMood(mood);
  }, [mood]);

  const dismissTwist = () => {
    setShowTwist(false);
    if (twistTimeoutRef.current) {
      clearTimeout(twistTimeoutRef.current);
      twistTimeoutRef.current = null;
    }
  };

  const handleTwistTime = () => {
    // The AI reads the night: light twists after rough days, chaos on request.
    const t = getRandomTwist(twistStyle || "any");
    setTwist(t);
    setShowTwist(true);
    twistRef.current = t;
    sfxTwist();
    // Announce the twist out loud so cooks with messy hands don't miss it.
    if (voice.supported && !voice.muted) {
      voice.speak(`Plot twist! ${t.text}`);
    }
    if (twistTimeoutRef.current) clearTimeout(twistTimeoutRef.current);
    twistTimeoutRef.current = setTimeout(() => {
      setShowTwist(false);
      twistTimeoutRef.current = null;
    }, 8000);
  };

  // The Together Moment — the one forced-cooperation beat of the night.
  const coopRef = useRef(null);
  const coopTimeoutRef = useRef(null);
  const handleCoopTime = () => {
    const c = getRandomCoopMoment();
    setCoop(c);
    setShowCoop(true);
    coopRef.current = c;
    sfxChime();
    if (voice.supported && !voice.muted) {
      voice.speak(`Together now. ${c.text.replace(/^🤝\s*TOGETHER:\s*/, "")}`);
    }
    if (coopTimeoutRef.current) clearTimeout(coopTimeoutRef.current);
    coopTimeoutRef.current = setTimeout(() => {
      setShowCoop(false);
      coopTimeoutRef.current = null;
    }, 10000);
  };

  const handleTimeUp = () => {
    onTimeUp(twistRef.current, coopRef.current);
  };

  // Report remaining time upward every 5 ticks so a reload can resume the
  // clock close to where it was, without re-rendering the app every second.
  // Memoized so the Timer's tick effect never sees a new identity per render.
  const handleTick = useCallback(
    (s) => {
      if (onTick && s % 5 === 0) onTick(s);
      if (s % 30 === 0) setSecondsLeft(s);
    },
    [onTick]
  );

  // Escape closes whichever overlay is up — peek, twist, or together moment.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setPeeking(null);
      setShowTwist(false);
      setShowCoop(false);
      if (twistTimeoutRef.current) {
        clearTimeout(twistTimeoutRef.current);
        twistTimeoutRef.current = null;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="bg-deep"
      style={{ minHeight: "100vh", position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <MusicPlayer currentMood={mood} onChangeMood={setMood} />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 56,
          paddingBottom: 100,
          width: "100%",
        }}
      >
        {/* Theme badge */}
        <div
          style={{
            background: "rgba(245,207,93,0.06)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 100,
            padding: "6px 16px",
            fontSize: 13,
            color: "var(--text-secondary)",
            marginBottom: 40,
          }}
        >
          {theme}
        </div>

        {/* Timer with ambient breathing glow — tap it to pause/resume.
            The timer IS the pause button, so no extra control is needed. */}
        <div
          role="button"
          tabIndex={0}
          aria-pressed={paused}
          aria-label={paused ? "Resume the timer" : "Pause the timer"}
          onClick={() => setPaused((p) => !p)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setPaused((p) => !p);
            }
          }}
          style={{ position: "relative", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 340,
              height: 340,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(245,207,93,0.14) 0%, rgba(255,138,61,0.06) 45%, transparent 70%)",
              filter: "blur(6px)",
              animation: paused ? "none" : "glowBreathe 4s ease-in-out infinite",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />
          <Timer
            onTwistTime={handleTwistTime}
            onCoopTime={handleCoopTime}
            onTimeUp={handleTimeUp}
            onTick={handleTick}
            paused={paused}
            initialSeconds={initialSeconds || undefined}
          />
        </div>

        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 20 }}>
          {paused ? "▶ Paused — tap the timer to resume." : "Cook. Create. Don't panic."}
        </p>
        {!paused && (
          <p style={{ color: "var(--text-muted, #7a6e66)", fontSize: 12, marginTop: 6 }}>
            Tap the timer to pause
          </p>
        )}

        {/* One quiet entry point for secret re-checks. */}
        {(secret1 || secret2) && (
          <button
            className="chip"
            onClick={() => setPeeking("choose")}
            style={{ fontSize: 13, marginTop: 18 }}
          >
            🤫 Forgot your secret?
          </button>
        )}

        {/* Memory counter */}
        {(memories?.length || 0) > 0 && (
          <div
            style={{
              marginTop: 24,
              background: "rgba(245,207,93,0.06)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 100,
              padding: "6px 14px",
              fontSize: 13,
              color: "var(--accent-gold)",
            }}
            aria-live="polite"
          >
            📸 {memories.length} memor{memories.length === 1 ? "y" : "ies"} captured
          </div>
        )}
      </div>

      {/* Secret peek overlay — first pick who's peeking, then reveal privately */}
      {peeking && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => peeking !== "choose" && setPeeking(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 70,
            padding: 24,
            cursor: peeking === "choose" ? "default" : "pointer",
            textAlign: "center",
          }}
        >
          {peeking === "choose" ? (
            <>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 28 }}>
                Whose secret? The other one looks away 🤫
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 280 }}>
                {secret1 && (
                  <button className="btn-secondary" onClick={() => setPeeking("p1")}>
                    {p1Name}
                  </button>
                )}
                {secret2 && (
                  <button className="btn-secondary" onClick={() => setPeeking("p2")}>
                    {p2Name}
                  </button>
                )}
                <button className="btn-ghost" onClick={() => setPeeking(null)}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 28 }}>
                🤫 {peeking === "p1" ? p2Name : p1Name}, look away!
              </p>
              <div style={{ fontSize: 80, marginBottom: 12 }} aria-hidden="true">
                {(peeking === "p1" ? secret1 : secret2)?.emoji}
              </div>
              <h2
                className="font-display"
                style={{ fontSize: 28, fontWeight: 700, color: "var(--accent-gold)", marginBottom: 8 }}
              >
                {(peeking === "p1" ? secret1 : secret2)?.name}
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 20 }}>
                Tap anywhere to hide
              </p>
            </>
          )}
        </div>
      )}

      {/* Together Moment overlay — warm, not alarming */}
      {showCoop && coop && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="coop-title"
          onClick={() => setShowCoop(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 24,
            cursor: "pointer",
          }}
        >
          <div
            className="card animate-twist-in"
            style={{ textAlign: "center", maxWidth: 380, borderColor: "rgba(125,211,168,0.4)" }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">🤝</div>
            <div className="label" style={{ color: "var(--accent-green, #7dd3a8)", marginBottom: 10 }}>
              Together Moment
            </div>
            <h2
              id="coop-title"
              className="font-display"
              style={{ fontSize: 21, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, lineHeight: 1.4 }}
            >
              {coop.text.replace(/^🤝\s*TOGETHER:\s*/, "")}
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Tap anywhere when you've done it</p>
          </div>
        </div>
      )}

      {/* Twist overlay */}
      {showTwist && twist && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="twist-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 24,
            cursor: "pointer",
          }}
          onClick={dismissTwist}
        >
          <div
            className="card animate-twist-in"
            style={{ textAlign: "center", maxWidth: 380 }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">⚡</div>
            <h2
              id="twist-title"
              className="font-display"
              style={{ fontSize: 22, fontWeight: 700, color: "var(--accent-gold)", marginBottom: 12, lineHeight: 1.4 }}
            >
              {twist.text}
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Tap anywhere to dismiss</p>
          </div>
        </div>
      )}

      {/* Question card */}
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          p1Name={p1Name}
          p2Name={p2Name}
          onSubmit={(q, a1, a2) => {
            onQuestionAnswer(q, a1, a2);
            setCurrentQuestion(null);
          }}
          onDismiss={() => setCurrentQuestion(null)}
        />
      )}

      {/* Memory capture button */}
      <MemoryCapture
        memoriesCount={memories?.length || 0}
        maxMemories={5}
        onCapture={onAddMemory}
      />

      {/* Ask Chef — AI cooking assistant, aware of the clock and the night */}
      <CookingAssistant
        ctx={{ p1Name, p2Name, theme, secret1, secret2, night, minutesLeft: Math.ceil(secondsLeft / 60) }}
      />
    </div>
  );
}
