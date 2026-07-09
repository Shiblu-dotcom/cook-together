import { useState, useEffect, useRef } from "react";
import { sfxTick, sfxTimesUp, sfxChime } from "../../utils/sfx";
import { hapticTap, hapticTimeUp } from "../../utils/haptics";

const TOTAL = 15 * 60;

// `calm` strips every urgency cue: no color shift, no shaking, no countdown
// beeps, no red flash — and the end is a soft chime instead of a gong.
// Calm nights have a clock, not a countdown.
export default function Timer({ onTwistTime, onCoopTime, onTimeUp, onTick, paused = false, initialSeconds = TOTAL, calm = false }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(true);
  // If we're resuming past a trigger mark, that beat already happened.
  const twistFired = useRef(initialSeconds <= 4 * 60);
  const coopFired = useRef(initialSeconds <= 9 * 60);
  const intervalRef = useRef(null);

  // The interval only decrements — pure state update, no side effects. All
  // callbacks fire from the effect below, after render, so ticking never
  // triggers a parent setState mid-render.
  useEffect(() => {
    if (!running || paused) return;
    intervalRef.current = setInterval(() => {
      // Hidden demo switch: set window.__COOK_FAST__ = true in the console
      // to run the clock at 60x — for demos and testing, never surfaced in UI.
      const step = typeof window !== "undefined" && window.__COOK_FAST__ ? 60 : 1;
      setSeconds((s) => Math.max(0, s - step));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, paused]);

  // Side effects of the clock advancing: parent tick reports, the twist
  // trigger, countdown beeps, and time-up. Callbacks are read through refs so
  // this effect keys ONLY on the clock — a parent re-render handing us new
  // callback identities must not re-fire it (that's an infinite loop).
  const callbacksRef = useRef({ onTick, onTwistTime, onCoopTime, onTimeUp });
  useEffect(() => {
    callbacksRef.current = { onTick, onTwistTime, onCoopTime, onTimeUp };
  });

  const timeUpFired = useRef(false);
  useEffect(() => {
    const cb = callbacksRef.current;
    if (cb.onTick) cb.onTick(seconds);

    // The Together Moment fires crossing the 9-minute mark — mid-cook,
    // when both dishes exist enough to cooperate over.
    if (seconds <= 9 * 60 && seconds > 0 && !coopFired.current) {
      coopFired.current = true;
      hapticTap();
      if (cb.onCoopTime) cb.onCoopTime();
    }

    // Twist fires when we cross the 4-minute mark (crossing, not equality,
    // so the 60x demo step and resumed sessions can't skip over it).
    if (seconds <= 4 * 60 && seconds > 0 && !twistFired.current) {
      twistFired.current = true;
      hapticTap();
      if (cb.onTwistTime) cb.onTwistTime();
    }

    // Final countdown ticks — one soft beep per second for the last ten.
    // Calm nights get no countdown pressure at all.
    if (!calm && seconds <= 10 && seconds > 0) sfxTick();

    if (seconds <= 0 && !timeUpFired.current) {
      timeUpFired.current = true;
      setRunning(false);
      // Calm nights end with a single soft tap, game nights with the full buzz.
      if (calm) {
        sfxChime();
        hapticTap();
      } else {
        sfxTimesUp();
        hapticTimeUp();
      }
      if (cb.onTimeUp) cb.onTimeUp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const pct = Math.max(0, Math.min(1, seconds / TOTAL));

  // Announce time at clean intervals only — every minute, and during the final
  // ten-second countdown — so screen readers don't read out every tick.
  const shouldAnnounce = secs === 0 || (seconds <= 10 && seconds > 0);
  const announcement = seconds <= 10 && seconds > 0
    ? `${seconds} seconds left`
    : seconds === 0
    ? "Time's up"
    : `${mins} minute${mins === 1 ? "" : "s"} left`;

  // Urgency colors track the candlelit palette:
  // calm → champagne → terracotta → coral → fire-coral as time runs out.
  // On calm nights the clock stays champagne gold the whole way.
  const getColor = () => {
    if (calm) return "#f5cf5d";
    if (seconds > 10 * 60) return "#f5cf5d";  // champagne gold
    if (seconds > 5 * 60) return "#ff8a3d";   // terracotta
    if (seconds > 60) return "#ff6b8a";       // coral
    return "#ff3d68";                          // intense coral-red
  };

  const getAnimation = () => {
    if (calm) return "none";
    if (seconds <= 10 && seconds > 0) return "shakeIntense 0.3s ease infinite";
    if (seconds <= 60) return "timerUrgent 0.5s ease infinite";
    if (seconds <= 5 * 60) return "timerUrgent 1s ease infinite";
    return "none";
  };

  const glowColor = getColor();

  return (
    <div
      role="timer"
      aria-label="Cooking time remaining"
      style={{
        textAlign: "center",
        position: "relative",
      }}
    >
      {/* Polite live region for screen readers (does not visually render) */}
      <span
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {shouldAnnounce ? announcement : ""}
      </span>

      {/* Progress ring */}
      <svg
        width="220"
        height="220"
        viewBox="0 0 220 220"
        aria-hidden="true"
        style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
      >
        <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
        <circle
          cx="110"
          cy="110"
          r="100"
          fill="none"
          stroke={glowColor}
          strokeWidth="6"
          strokeDasharray={`${2 * Math.PI * 100}`}
          strokeDashoffset={`${2 * Math.PI * 100 * (1 - pct)}`}
          strokeLinecap="round"
          transform="rotate(-90 110 110)"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
        />
      </svg>

      <div
        className="timer-display"
        style={{
          color: glowColor,
          opacity: paused ? 0.45 : 1,
          animation: paused ? "none" : getAnimation(),
          lineHeight: "220px",
          width: "220px",
          display: "inline-block",
          transition: "color 0.5s ease",
          position: "relative",
          zIndex: 2,
        }}
      >
        {display}
      </div>

      {!calm && seconds <= 10 && seconds > 0 && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(255,26,26,0.08)",
            animation: "screenFlash 1s ease infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}
    </div>
  );
}
