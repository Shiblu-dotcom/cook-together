import { useCallback, useEffect, useRef, useState } from "react";
import { setSfxMuted } from "../utils/sfx";
import { setAmbientMuted } from "../utils/ambient";

const STORAGE_KEY = "cook_together_voice_muted";
const isClient = typeof window !== "undefined" && "speechSynthesis" in window;

/**
 * Voice selection — prefer the natural / neural / online voices that modern
 * browsers ship, fall back gracefully to anything English.
 *
 * Priority order (first match wins):
 *   1. Any voice with "Natural" or "Online" in its name (Microsoft Edge's
 *      neural voices — by far the most human-sounding option on Windows).
 *   2. Named premium voices we know sound good: Aria, Jenny, Sonia, Ava,
 *      Olivia, Libby (MS neural), Samantha, Karen, Allison, Daniel (Apple),
 *      Google US English (Chrome).
 *   3. Any other English voice — but skip the old SAPI "Desktop" voices,
 *      which are noticeably robotic.
 *   4. Whatever's available.
 */
const pickVoice = (voices) => {
  if (!voices || voices.length === 0) return null;
  const english = voices.filter((v) => /^en[-_]/i.test(v.lang));
  const pool = english.length > 0 ? english : voices;

  // Skip legacy SAPI5 "Desktop" voices — they always sound robotic.
  const modern = pool.filter((v) => !/Desktop/i.test(v.name));
  const candidates = modern.length > 0 ? modern : pool;

  // 1. Natural / neural / online — usually the best on the system.
  const natural = candidates.find((v) => /(Natural|Neural|Online)/i.test(v.name));
  if (natural) return natural;

  // 2. Known-good premium voices.
  const namePrefs = [
    /Aria/i, /Jenny/i, /Sonia/i, /Ava/i, /Olivia/i, /Libby/i,
    /Samantha/i, /Karen/i, /Allison/i, /Daniel/i,
    /Google US English/i, /Google UK English Female/i,
  ];
  for (const pattern of namePrefs) {
    const match = candidates.find((v) => pattern.test(v.name));
    if (match) return match;
  }

  // 3. Anything English-ish.
  return candidates[0];
};

/**
 * Clean text up so it reads naturally:
 *   - Strip emojis (which TTS engines read as their unicode name, ugh).
 *   - Replace em/en dashes with commas — gives a natural breath pause.
 *   - Replace ampersands with "and".
 *   - Collapse whitespace and trim.
 */
const cleanForSpeech = (text) => {
  return String(text)
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}]/gu, "")
    .replace(/[—–]/g, ", ")
    .replace(/\s*&\s*/g, " and ")
    .replace(/\.\.\./g, ", ")    // ellipses → soft pause, not three dots read out
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Split prose into utterance-sized sentences. Speaking long blocks as one
 * utterance often sounds monotone — and on some browsers gets cut off after
 * ~15 seconds. Splitting lets us add tiny prosody variation per sentence too.
 */
const splitSentences = (text) => {
  if (!text) return [];
  // Split on sentence terminators followed by whitespace + capital/quote.
  // Keep the terminator on the previous sentence.
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z"'(‘“])/);
  return parts.map((s) => s.trim()).filter((s) => s.length > 0);
};

/**
 * Deterministic-ish wiggle so prosody variation is reproducible per session
 * but doesn't feel mechanical. Returns a small ±value based on index.
 */
const wiggle = (i, amplitude) => Math.sin(i * 2.7 + 1.3) * amplitude;

export const useVoice = () => {
  const supported = isClient;
  const [muted, setMutedState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef(null);

  // Keep the sfx + ambient engines in sync with the persisted mute preference.
  useEffect(() => {
    setSfxMuted(muted);
    setAmbientMuted(muted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load voices once available. The voiceschanged event fires on Chrome
  // after voices are loaded asynchronously.
  useEffect(() => {
    if (!supported) return undefined;
    const refreshVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current = pickVoice(voices);
    };
    refreshVoice();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoice);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", refreshVoice);
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    setSpeaking(false);
  }, [supported]);

  /**
   * Speak some text. `rate` and `pitch` set the baseline — the hook applies
   * subtle variation per sentence on top so the result doesn't sound monotone.
   */
  const speak = useCallback(
    (text, { rate = 0.96, pitch = 1.02, volume = 0.95 } = {}) => {
      if (!supported || !text || muted) return;
      const cleaned = cleanForSpeech(text);
      if (!cleaned) return;
      const sentences = splitSentences(cleaned);
      if (sentences.length === 0) return;

      try {
        // Cancel anything queued so consecutive calls don't pile up.
        window.speechSynthesis.cancel();
        setSpeaking(true);

        sentences.forEach((sentence, i) => {
          const utter = new SpeechSynthesisUtterance(sentence);
          if (voiceRef.current) utter.voice = voiceRef.current;

          // Subtle rate variation: ±4% around baseline keeps things alive.
          utter.rate = Math.max(0.65, Math.min(1.35, rate + wiggle(i, 0.04)));

          // Questions tilt the pitch up a touch; statements get a tiny natural drift.
          const isQuestion = /\?\s*$/.test(sentence);
          const isExcited = /!\s*$/.test(sentence);
          let p = pitch + wiggle(i + 7, 0.04);
          if (isQuestion) p += 0.10;
          else if (isExcited) p += 0.06;
          utter.pitch = Math.max(0.5, Math.min(1.6, p));

          utter.volume = volume;

          // Only fire onend when the LAST sentence finishes.
          if (i === sentences.length - 1) {
            utter.onend = () => setSpeaking(false);
            utter.onerror = () => setSpeaking(false);
          } else {
            utter.onerror = () => setSpeaking(false);
          }
          window.speechSynthesis.speak(utter);
        });
      } catch {
        setSpeaking(false);
      }
    },
    [supported, muted]
  );

  const setMuted = useCallback(
    (next) => {
      setMutedState(next);
      // One mute to rule them all — the speaker button silences voice,
      // sound effects, and the ambient music, so "mute" means actually quiet.
      setSfxMuted(next);
      setAmbientMuted(next);
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (next && supported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          /* ignore */
        }
        setSpeaking(false);
      }
    },
    [supported]
  );

  // Cancel speech if the consuming component unmounts.
  useEffect(() => {
    return () => {
      if (supported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          /* ignore */
        }
      }
    };
  }, [supported]);

  return { supported, muted, setMuted, speaking, speak, stop };
};
